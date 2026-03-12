import { apiService, ApiResponse } from './api';

// Development mode flag - set to true to use mock data
const USE_MOCK_DATA = true;

// Mock booking data - defined directly here to avoid import issues
const mockBookings = [
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0j1',
    bookingReference: 'KR-2024-001',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0j2',
      name: 'Priya Sharma',
      email: 'priya.sharma@gmail.com',
      phone: '+91 9876543210'
    },
    eventType: 'wedding',
    eventDate: '2024-04-15',
    eventTime: '18:00',
    venue: {
      name: 'Grand Palace Hotel',
      address: '123 MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    guestCount: 250,
    budget: {
      min: 150000,
      max: 200000
    },
    services: ['photography', 'videography', 'decoration', 'catering'],
    specialRequests: 'Need traditional South Indian setup with flower decorations',
    status: 'approved',
    estimatedCost: 175000,
    finalCost: 180000,
    createdAt: '2024-03-01T10:30:00.000Z',
    updatedAt: '2024-03-05T14:20:00.000Z'
  },
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0j3',
    bookingReference: 'KR-2024-002',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0j4',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@yahoo.com',
      phone: '+91 9876543211'
    },
    eventType: 'birthday',
    eventDate: '2024-03-25',
    eventTime: '16:00',
    venue: {
      name: 'Celebration Gardens',
      address: '456 Park Street',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    guestCount: 80,
    budget: {
      min: 50000,
      max: 75000
    },
    services: ['photography', 'decoration', 'entertainment'],
    specialRequests: 'Birthday theme should be superhero themed for 8-year-old',
    status: 'in_progress',
    estimatedCost: 65000,
    createdAt: '2024-02-28T09:15:00.000Z',
    updatedAt: '2024-03-02T11:45:00.000Z'
  },
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0j5',
    bookingReference: 'KR-2024-003',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0j6',
      name: 'Anita Patel',
      email: 'anita.patel@hotmail.com',
      phone: '+91 9876543212'
    },
    eventType: 'anniversary',
    eventDate: '2024-04-20',
    eventTime: '19:30',
    venue: {
      name: 'Sunset Resort',
      address: '789 Beach Road',
      city: 'Goa',
      state: 'Goa',
      pincode: '403001'
    },
    guestCount: 50,
    budget: {
      min: 80000,
      max: 120000
    },
    services: ['photography', 'videography', 'decoration'],
    specialRequests: 'Golden anniversary celebration, need elegant gold theme',
    status: 'pending',
    estimatedCost: 95000,
    createdAt: '2024-03-03T16:20:00.000Z',
    updatedAt: '2024-03-03T16:20:00.000Z'
  },
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0j7',
    bookingReference: 'KR-2024-004',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0j8',
      name: 'Vikram Singh',
      email: 'vikram.singh@gmail.com',
      phone: '+91 9876543213'
    },
    eventType: 'corporate',
    eventDate: '2024-03-30',
    eventTime: '10:00',
    venue: {
      name: 'Business Center Plaza',
      address: '321 Corporate Avenue',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    guestCount: 120,
    budget: {
      min: 100000,
      max: 150000
    },
    services: ['photography', 'videography', 'catering', 'sound_system'],
    specialRequests: 'Corporate event for product launch, need professional setup',
    status: 'completed',
    estimatedCost: 125000,
    finalCost: 130000,
    createdAt: '2024-02-25T08:00:00.000Z',
    updatedAt: '2024-03-01T17:30:00.000Z'
  },
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0j9',
    bookingReference: 'KR-2024-005',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0ja',
      name: 'Meera Reddy',
      email: 'meera.reddy@outlook.com',
      phone: '+91 9876543214'
    },
    eventType: 'wedding',
    eventDate: '2024-05-10',
    eventTime: '17:00',
    venue: {
      name: 'Heritage Palace',
      address: '654 Royal Street',
      city: 'Jaipur',
      state: 'Rajasthan',
      pincode: '302001'
    },
    guestCount: 300,
    budget: {
      min: 200000,
      max: 300000
    },
    services: ['photography', 'videography', 'decoration', 'catering', 'entertainment'],
    specialRequests: 'Traditional Rajasthani wedding with royal theme and folk dancers',
    status: 'modifications-requested',
    estimatedCost: 250000,
    adminNotes: 'Client requested changes to decoration theme and catering menu',
    createdAt: '2024-03-05T12:45:00.000Z',
    updatedAt: '2024-03-08T10:15:00.000Z'
  },
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0jb',
    bookingReference: 'KR-2024-006',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0jc',
      name: 'Arjun Nair',
      email: 'arjun.nair@gmail.com',
      phone: '+91 9876543215'
    },
    eventType: 'birthday',
    eventDate: '2024-04-05',
    eventTime: '15:30',
    venue: {
      name: 'Garden View Restaurant',
      address: '987 Green Lane',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600001'
    },
    guestCount: 60,
    budget: {
      min: 40000,
      max: 60000
    },
    services: ['photography', 'decoration', 'catering'],
    specialRequests: '21st birthday party with modern theme and DJ setup',
    status: 'cancelled',
    estimatedCost: 55000,
    adminNotes: 'Cancelled due to venue unavailability',
    createdAt: '2024-02-20T14:30:00.000Z',
    updatedAt: '2024-02-28T09:00:00.000Z'
  },
  {
    _id: '65f1a2b3c4d5e6f7g8h9i0jd',
    bookingReference: 'KR-2024-007',
    user: {
      _id: '65f1a2b3c4d5e6f7g8h9i0je',
      name: 'Kavya Iyer',
      email: 'kavya.iyer@yahoo.in',
      phone: '+91 9876543216'
    },
    eventType: 'other',
    eventDate: '2024-04-12',
    eventTime: '11:00',
    venue: {
      name: 'Community Hall',
      address: '147 Temple Road',
      city: 'Kochi',
      state: 'Kerala',
      pincode: '682001'
    },
    guestCount: 100,
    budget: {
      min: 70000,
      max: 100000
    },
    services: ['photography', 'videography', 'decoration', 'catering'],
    specialRequests: 'Housewarming ceremony with traditional Kerala style decorations',
    status: 'approved',
    estimatedCost: 85000,
    finalCost: 88000,
    quotation: {
      amount: 88000,
      breakdown: [
        { service: 'Photography', cost: 25000, description: 'Full day coverage with edited photos' },
        { service: 'Videography', cost: 20000, description: 'Highlight reel and raw footage' },
        { service: 'Decoration', cost: 30000, description: 'Traditional Kerala theme with flowers' },
        { service: 'Catering', cost: 13000, description: 'Traditional Kerala meal for 100 guests' }
      ],
      validUntil: '2024-04-01T00:00:00.000Z'
    },
    createdAt: '2024-03-07T13:20:00.000Z',
    updatedAt: '2024-03-10T16:40:00.000Z'
  }
];

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

    return await apiService.upload<Booking>('/bookings', formData);
  },

  // Get user's bookings
  getUserBookings: async (filters?: BookingFilters): Promise<ApiResponse<{ bookings: Booking[]; pagination: any }>> => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // For recent bookings, return the first few
      const recentBookings = mockBookings.slice(0, filters?.limit || 10);
      
      return {
        success: true,
        data: {
          bookings: recentBookings,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: recentBookings.length,
            itemsPerPage: recentBookings.length,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      };
    }

    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/bookings/my-bookings?${queryString}` : '/bookings/my-bookings';

    return await apiService.get<{ bookings: Booking[]; pagination: any }>(url);
  },

  // Get booking by ID
  getBooking: async (bookingId: string): Promise<ApiResponse<Booking>> => {
    return await apiService.get<Booking>(`/bookings/${bookingId}`);
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

    return await apiService.upload<Booking>(`/bookings/${_id}`, formData);
  },

  // Cancel booking
  cancelBooking: async (bookingId: string): Promise<ApiResponse> => {
    return await apiService.delete(`/bookings/${bookingId}`);
  },

  // Check date availability
  checkAvailability: async (date: string): Promise<ApiResponse<AvailabilityCheck>> => {
    return await apiService.get<AvailabilityCheck>(`/bookings/availability?date=${date}`);
  },

  // Admin: Get all bookings
  getAllBookings: async (filters?: BookingFilters): Promise<ApiResponse<{ bookings: Booking[]; pagination: any }>> => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredBookings = [...mockBookings];
      
      // Apply filters
      if (filters) {
        if (filters.status) {
          filteredBookings = filteredBookings.filter(booking => booking.status === filters.status);
        }
        if (filters.eventType) {
          filteredBookings = filteredBookings.filter(booking => booking.eventType === filters.eventType);
        }
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredBookings = filteredBookings.filter(booking => 
            booking.bookingReference?.toLowerCase().includes(searchLower) ||
            booking.user.name.toLowerCase().includes(searchLower) ||
            booking.user.email.toLowerCase().includes(searchLower) ||
            booking.eventType.toLowerCase().includes(searchLower)
          );
        }
        if (filters.dateFrom) {
          filteredBookings = filteredBookings.filter(booking => 
            new Date(booking.eventDate) >= new Date(filters.dateFrom!)
          );
        }
        if (filters.dateTo) {
          filteredBookings = filteredBookings.filter(booking => 
            new Date(booking.eventDate) <= new Date(filters.dateTo!)
          );
        }
      }
      
      // Sort by creation date (newest first)
      filteredBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
      
      return {
        success: true,
        data: {
          bookings: paginatedBookings,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(filteredBookings.length / limit),
            totalItems: filteredBookings.length,
            itemsPerPage: limit,
            hasNextPage: endIndex < filteredBookings.length,
            hasPrevPage: page > 1
          }
        }
      };
    }

    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    const url = queryString ? `/bookings/admin/all?${queryString}` : '/bookings/admin/all';

    return await apiService.get<{ bookings: Booking[]; pagination: any }>(url);
  },

  // Admin: Update booking status
  updateBookingStatus: async (
    bookingId: string,
    status: string,
    adminNotes?: string,
    quotation?: Booking['quotation']
  ): Promise<ApiResponse<Booking>> => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find the booking and update it
      const bookingIndex = mockBookings.findIndex(b => b._id === bookingId);
      if (bookingIndex !== -1) {
        const updatedBooking = {
          ...mockBookings[bookingIndex],
          status: status as any,
          adminNotes,
          quotation,
          updatedAt: new Date().toISOString()
        };
        
        // Update the mock data
        mockBookings[bookingIndex] = updatedBooking;
        
        return {
          success: true,
          data: updatedBooking
        };
      }
      
      return {
        success: false,
        error: 'Booking not found'
      };
    }

    return await apiService.put<Booking>(`/bookings/admin/${bookingId}/status`, {
      status,
      adminNotes,
      quotation,
    });
  },

  // Admin: Get booking statistics
  getBookingStatistics: async (): Promise<ApiResponse<BookingStatistics>> => {
    return await apiService.get<BookingStatistics>('/bookings/admin/statistics');
  },

  // Admin: Get upcoming bookings
  getUpcomingBookings: async (days: number = 7): Promise<ApiResponse<Booking[]>> => {
    return await apiService.get<Booking[]>(`/bookings/admin/upcoming?days=${days}`);
  },

  // Admin: Send event reminders
  sendEventReminders: async (): Promise<ApiResponse> => {
    return await apiService.post('/bookings/admin/send-reminders');
  },
};

export default bookingService;