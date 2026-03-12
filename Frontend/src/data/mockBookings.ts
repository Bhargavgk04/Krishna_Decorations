import { Booking } from '../services/bookingService';

// Mock booking data that looks realistic
export const mockBookings: Booking[] = [
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

// Mock dashboard data
export const mockDashboardData = {
  overview: {
    totalBookings: 7,
    pendingBookings: 1,
    totalRevenue: 536000,
    activeUsers: 7
  }
};