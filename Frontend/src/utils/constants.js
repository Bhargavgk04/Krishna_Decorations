export const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'baby_shower', label: 'Baby Shower' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'graduation', label: 'Graduation' },
  { value: 'religious', label: 'Religious Ceremony' },
  { value: 'other', label: 'Other' }
];

export const ADDITIONAL_SERVICES = [
  { value: 'catering', label: 'Catering Services' },
  { value: 'photography', label: 'Photography' },
  { value: 'videography', label: 'Videography' },
  { value: 'music_dj', label: 'Music & DJ' },
  { value: 'lighting', label: 'Special Lighting' },
  { value: 'flowers', label: 'Floral Arrangements' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'security', label: 'Security Services' },
  { value: 'cleanup', label: 'Post-Event Cleanup' }
];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const BOOKING_STATUS_LABELS = {
  [BOOKING_STATUS.PENDING]: 'Pending Review',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.IN_PROGRESS]: 'In Progress',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled'
};

export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.PENDING]: '#ffc107',
  [BOOKING_STATUS.CONFIRMED]: '#28a745',
  [BOOKING_STATUS.IN_PROGRESS]: '#007bff',
  [BOOKING_STATUS.COMPLETED]: '#6c757d',
  [BOOKING_STATUS.CANCELLED]: '#dc3545'
};

export const API_ENDPOINTS = {
  BOOKINGS: '/api/bookings',
  ADMIN: '/api/admin',
  AUTH: '/api/auth'
};

export const PREFERRED_TIMES = [
  { value: 'morning', label: 'Morning (6 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 6 PM)' },
  { value: 'evening', label: 'Evening (6 PM - 12 AM)' },
  { value: 'full-day', label: 'Full Day' }
];

export const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'eventDate', label: 'Event Date' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'status', label: 'Status' },
  { value: 'budget', label: 'Budget' }
];

export const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, label: '10 per page' },
  { value: 25, label: '25 per page' },
  { value: 50, label: '50 per page' },
  { value: 100, label: '100 per page' }
];