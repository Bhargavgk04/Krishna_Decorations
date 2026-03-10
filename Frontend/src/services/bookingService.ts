import { apiService, ApiResponse, PaginatedResponse } from './api';

// Types
export interface Booking {
  _id: string;
  bookingReference?: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  eventType: 'wedding' | 'birthday' | 'anniversary' | 'corporate' | 'other';
  eventDate: string;
  eventTime: string;

  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  guestCount: number;
  budget: {
    min: number;
    max: number;
  };
  services: string[];
  specialRequests?: string;
  referenceImages?: string[];
  status:
    | 'pending'
    | 'confirmed'
    | 'in_progress'
    | 'approved'
    | 'completed'
    | 'cancelled'
    | 'modifications-requested'
    | 'rejected';
  adminNotes?: string;
  quotation?: {
    amount: number;
    breakdown: Array<{
      service: string;
      cost: number;
      description?: string;
    }>;
    validUntil: string;
  };
  estimatedCost?: number;
  finalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingData {
  eventType: string;
  eventDate: string;
  eventTime: string;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  guestCount: number;
  budget: {
    min: number;
    max: number;
  };
  services: string[];
  specialRequests?: string;
  referenceImages?: File[];
}

export interface UpdateBookingData extends Partial<CreateBookingData> {
  _id: string;
}

export interface BookingFilters {
  status?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AvailabilityCheck {
  date: string;
  available: boolean;
  reason?: string;
}

export interface BookingStatistics {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  thisMonth: number;
  revenue: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  popularServices: Array<{
    service: string;
    count: number;
  }>;
  upcomingEvents: number;
}

// Booking Service
export const bookingService = {
  // Create new booking
  createBooking: async (bookingData: CreateBookingData): Promise<ApiResponse<Booking>> => {
    const formData = new FormData();
    
    // Add booking data
    Object.entries(bookingData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === 'referenceImages' && Array.isArray(value)) {
        // Handle file uploads
        (value as File[]).forEach((file) => {
          formData.append('referenceImages', file);
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    return await apiService.upload<Booking>('/', formData);
  },

  // Get user's bookings
  getUserBookings: async (filters?: BookingFilters): Promise<PaginatedResponse<Booking>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/my-bookings?${queryString}` : '/my-bookings';
    
    return await apiService.get<Booking[]>(url) as PaginatedResponse<Booking>;
  },

  // Get booking by ID
  getBooking: async (bookingId: string): Promise<ApiResponse<Booking>> => {
    return await apiService.get<Booking>(`/${bookingId}`);
  },

  // Update booking
  updateBooking: async (bookingData: UpdateBookingData): Promise<ApiResponse<Booking>> => {
    const { _id, ...updateData } = bookingData;
    const formData = new FormData();
    
    // Add booking data
    Object.entries(updateData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (key === 'referenceImages' && Array.isArray(value)) {
        (value as File[]).forEach((file) => {
          formData.append('referenceImages', file);
        });
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    return await apiService.upload<Booking>(`/${_id}`, formData);
  },

  // Cancel booking
  cancelBooking: async (bookingId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/${bookingId}`);
  },

  // Check date availability
  checkAvailability: async (date: string): Promise<ApiResponse<AvailabilityCheck>> => {
    return await apiService.get<AvailabilityCheck>(`/availability?date=${date}`);
  },

  // Admin: Get all bookings
  getAllBookings: async (filters?: BookingFilters): Promise<PaginatedResponse<Booking>> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/admin/all?${queryString}` : '/admin/all';
    
    return await apiService.get<Booking[]>(url) as PaginatedResponse<Booking>;
  },

  // Admin: Update booking status
  updateBookingStatus: async (
    bookingId: string, 
    status: string, 
    adminNotes?: string,
    quotation?: Booking['quotation']
  ): Promise<ApiResponse<Booking>> => {
    return await apiService.put<Booking>(`/admin/${bookingId}/status`, {
      status,
      adminNotes,
      quotation,
    });
  },

  // Admin: Get booking statistics
  getBookingStatistics: async (): Promise<ApiResponse<BookingStatistics>> => {
    return await apiService.get<BookingStatistics>('/admin/statistics');
  },

  // Admin: Get upcoming bookings
  getUpcomingBookings: async (days: number = 7): Promise<ApiResponse<Booking[]>> => {
    return await apiService.get<Booking[]>(`/admin/upcoming?days=${days}`);
  },

  // Admin: Send event reminders
  sendEventReminders: async (): Promise<ApiResponse> => {
    return await apiService.post('/admin/send-reminders');
  },
};

export default bookingService;