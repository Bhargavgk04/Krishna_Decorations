const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const BookingService = require('../../../src/services/bookingService');
const Booking = require('../../../src/models/Booking');
const User = require('../../../src/models/User');
const { Admin } = require('../../../src/models/Admin');
const { BOOKING_STATUS, EVENT_TYPES, DECORATION_STYLES } = require('../../../src/config/constants');

describe('BookingService', () => {
  let mongoServer;
  let testUser;
  let testAdmin;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Booking.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'password123',
    });

    // Create test admin
    testAdmin = await Admin.createAdmin({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '+1234567891',
      password: 'adminpass123',
    });
  });

  describe('createBooking', () => {
    it('should create booking successfully', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        eventType: EVENT_TYPES.WEDDING,
        eventDate: futureDate,
        eventTime: '18:00',
        venue: 'Grand Hotel Ballroom',
        guestCount: 150,
        decorationStyle: DECORATION_STYLES.ELEGANT,
        specialRequests: 'Please include white roses',
      };

      const booking = await BookingService.createBooking(bookingData, testUser._id);

      expect(booking).toBeDefined();
      expect(booking.userId._id.toString()).toBe(testUser._id.toString());
      expect(booking.eventType).toBe(EVENT_TYPES.WEDDING);
      expect(booking.status).toBe(BOOKING_STATUS.PENDING);
      expect(booking.bookingReference).toBeDefined();
      expect(booking.bookingReference).toMatch(/^BK-/);
    });

    it('should throw error for non-existent user', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        eventType: EVENT_TYPES.BIRTHDAY,
        eventDate: futureDate,
        eventTime: '15:00',
      };

      const fakeUserId = new mongoose.Types.ObjectId();

      await expect(
        BookingService.createBooking(bookingData, fakeUserId)
      ).rejects.toThrow('User not found or inactive');
    });

    it('should throw error for past event date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const bookingData = {
        eventType: EVENT_TYPES.CORPORATE,
        eventDate: pastDate,
        eventTime: '10:00',
      };

      await expect(
        BookingService.createBooking(bookingData, testUser._id)
      ).rejects.toThrow('Event date must be in the future');
    });

    it('should throw error for inactive user', async () => {
      testUser.isActive = false;
      await testUser.save();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        eventType: EVENT_TYPES.ANNIVERSARY,
        eventDate: futureDate,
        eventTime: '19:00',
      };

      await expect(
        BookingService.createBooking(bookingData, testUser._id)
      ).rejects.toThrow('User not found or inactive');
    });
  });

  describe('getBookingById', () => {
    let testBooking;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      testBooking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.ENGAGEMENT,
        eventDate: futureDate,
        eventTime: '16:00',
      });
    });

    it('should get booking successfully for owner', async () => {
      const booking = await BookingService.getBookingById(
        testBooking._id,
        testUser._id,
        false
      );

      expect(booking).toBeDefined();
      expect(booking._id.toString()).toBe(testBooking._id.toString());
      expect(booking.userId.name).toBe(testUser.name);
    });

    it('should get booking successfully for admin', async () => {
      const booking = await BookingService.getBookingById(
        testBooking._id,
        null,
        true
      );

      expect(booking).toBeDefined();
      expect(booking._id.toString()).toBe(testBooking._id.toString());
    });

    it('should throw error for unauthorized access', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        phone: '+1234567892',
        password: 'password123',
      });

      await expect(
        BookingService.getBookingById(testBooking._id, otherUser._id, false)
      ).rejects.toThrow('Access denied');
    });

    it('should throw error for non-existent booking', async () => {
      const fakeBookingId = new mongoose.Types.ObjectId();

      await expect(
        BookingService.getBookingById(fakeBookingId, testUser._id, false)
      ).rejects.toThrow('Booking not found');
    });
  });

  describe('getUserBookings', () => {
    beforeEach(async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 5);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 10);

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.WEDDING,
        eventDate: futureDate1,
        eventTime: '18:00',
        status: BOOKING_STATUS.PENDING,
      });

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.BIRTHDAY,
        eventDate: futureDate2,
        eventTime: '15:00',
        status: BOOKING_STATUS.APPROVED,
      });
    });

    it('should get user bookings successfully', async () => {
      const result = await BookingService.getUserBookings(testUser._id);

      expect(result.bookings).toHaveLength(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.totalItems).toBe(2);
    });

    it('should filter bookings by status', async () => {
      const result = await BookingService.getUserBookings(testUser._id, {
        status: BOOKING_STATUS.PENDING,
      });

      expect(result.bookings).toHaveLength(1);
      expect(result.bookings[0].status).toBe(BOOKING_STATUS.PENDING);
    });

    it('should paginate results', async () => {
      const result = await BookingService.getUserBookings(testUser._id, {
        page: 1,
        limit: 1,
      });

      expect(result.bookings).toHaveLength(1);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should throw error for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();

      await expect(
        BookingService.getUserBookings(fakeUserId)
      ).rejects.toThrow('User not found or inactive');
    });
  });

  describe('updateBooking', () => {
    let testBooking;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      testBooking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.CORPORATE,
        eventDate: futureDate,
        eventTime: '10:00',
        status: BOOKING_STATUS.PENDING,
      });
    });

    it('should update booking successfully', async () => {
      const updateData = {
        guestCount: 200,
        specialRequests: 'Updated special requests',
      };

      const updatedBooking = await BookingService.updateBooking(
        testBooking._id,
        updateData,
        testUser._id
      );

      expect(updatedBooking.guestCount).toBe(200);
      expect(updatedBooking.specialRequests).toBe('Updated special requests');
    });

    it('should update event date successfully', async () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 14);

      const updateData = {
        eventDate: newDate,
      };

      const updatedBooking = await BookingService.updateBooking(
        testBooking._id,
        updateData,
        testUser._id
      );

      expect(updatedBooking.eventDate.toDateString()).toBe(newDate.toDateString());
    });

    it('should throw error for past event date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const updateData = {
        eventDate: pastDate,
      };

      await expect(
        BookingService.updateBooking(testBooking._id, updateData, testUser._id)
      ).rejects.toThrow('Event date must be in the future');
    });

    it('should throw error for non-modifiable booking', async () => {
      testBooking.status = BOOKING_STATUS.APPROVED;
      await testBooking.save();

      const updateData = {
        guestCount: 300,
      };

      await expect(
        BookingService.updateBooking(testBooking._id, updateData, testUser._id)
      ).rejects.toThrow('Booking cannot be modified in current status');
    });

    it('should reset status from modifications-requested to pending', async () => {
      testBooking.status = BOOKING_STATUS.MODIFICATIONS_REQUESTED;
      testBooking.adminComments = 'Please update guest count';
      await testBooking.save();

      const updateData = {
        guestCount: 250,
      };

      const updatedBooking = await BookingService.updateBooking(
        testBooking._id,
        updateData,
        testUser._id
      );

      expect(updatedBooking.status).toBe(BOOKING_STATUS.PENDING);
      expect(updatedBooking.adminComments).toBe('');
    });
  });

  describe('cancelBooking', () => {
    let testBooking;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      testBooking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.BABY_SHOWER,
        eventDate: futureDate,
        eventTime: '14:00',
        status: BOOKING_STATUS.PENDING,
      });
    });

    it('should cancel booking successfully', async () => {
      const result = await BookingService.cancelBooking(testBooking._id, testUser._id);

      expect(result.message).toBe('Booking cancelled successfully');
      expect(result.bookingReference).toBe(testBooking.bookingReference);

      // Verify booking is soft deleted
      const cancelledBooking = await Booking.findById(testBooking._id);
      expect(cancelledBooking.isActive).toBe(false);
      // Status remains the same, but booking is inactive
    });

    it('should throw error for already rejected booking', async () => {
      testBooking.status = BOOKING_STATUS.REJECTED;
      await testBooking.save();

      await expect(
        BookingService.cancelBooking(testBooking._id, testUser._id)
      ).rejects.toThrow('Booking is already rejected');
    });
  });

  describe('updateBookingStatus', () => {
    let testBooking;

    beforeEach(async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      testBooking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.OTHER,
        eventDate: futureDate,
        eventTime: '20:00',
        status: BOOKING_STATUS.PENDING,
      });
    });

    it('should update booking status successfully', async () => {
      const updatedBooking = await BookingService.updateBookingStatus(
        testBooking._id,
        BOOKING_STATUS.APPROVED,
        testAdmin._id,
        'Booking approved with premium package',
        5000
      );

      expect(updatedBooking.status).toBe(BOOKING_STATUS.APPROVED);
      expect(updatedBooking.adminComments).toBe('Booking approved with premium package');
      expect(updatedBooking.totalAmount).toBe(5000);
      expect(updatedBooking.adminId._id.toString()).toBe(testAdmin._id.toString());
    });

    it('should reject booking with reason', async () => {
      const updatedBooking = await BookingService.updateBookingStatus(
        testBooking._id,
        BOOKING_STATUS.REJECTED,
        testAdmin._id,
        'Date not available for requested event type'
      );

      expect(updatedBooking.status).toBe(BOOKING_STATUS.REJECTED);
      expect(updatedBooking.adminComments).toBe('Date not available for requested event type');
    });

    it('should request modifications', async () => {
      const updatedBooking = await BookingService.updateBookingStatus(
        testBooking._id,
        BOOKING_STATUS.MODIFICATIONS_REQUESTED,
        testAdmin._id,
        'Please provide more details about decoration preferences'
      );

      expect(updatedBooking.status).toBe(BOOKING_STATUS.MODIFICATIONS_REQUESTED);
      expect(updatedBooking.adminComments).toBe('Please provide more details about decoration preferences');
    });

    it('should throw error for non-existent booking', async () => {
      const fakeBookingId = new mongoose.Types.ObjectId();

      await expect(
        BookingService.updateBookingStatus(
          fakeBookingId,
          BOOKING_STATUS.APPROVED,
          testAdmin._id
        )
      ).rejects.toThrow('Booking not found');
    });

    it('should throw error for non-existent admin', async () => {
      const fakeAdminId = new mongoose.Types.ObjectId();

      await expect(
        BookingService.updateBookingStatus(
          testBooking._id,
          BOOKING_STATUS.APPROVED,
          fakeAdminId
        )
      ).rejects.toThrow('Admin not found');
    });
  });

  describe('checkDateAvailability', () => {
    it('should return available for future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const availability = await BookingService.checkDateAvailability(futureDate);

      expect(availability.available).toBe(true);
      expect(availability.existingBookings).toBe(0);
      expect(availability.conflictingBookings).toHaveLength(0);
    });

    it('should return not available for past date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const availability = await BookingService.checkDateAvailability(pastDate);

      expect(availability.available).toBe(false);
      expect(availability.reason).toBe('Date must be in the future');
    });

    it('should show existing bookings for occupied date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      // Create existing booking
      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.WEDDING,
        eventDate: futureDate,
        eventTime: '18:00',
        status: BOOKING_STATUS.APPROVED,
      });

      const availability = await BookingService.checkDateAvailability(futureDate);

      expect(availability.existingBookings).toBe(1);
      expect(availability.conflictingBookings).toHaveLength(1);
    });
  });

  describe('getUpcomingBookings', () => {
    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.WEDDING,
        eventDate: tomorrow,
        eventTime: '18:00',
        status: BOOKING_STATUS.APPROVED,
      });

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.BIRTHDAY,
        eventDate: nextWeek,
        eventTime: '15:00',
        status: BOOKING_STATUS.PENDING,
      });

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.CORPORATE,
        eventDate: nextMonth,
        eventTime: '10:00',
        status: BOOKING_STATUS.APPROVED,
      });
    });

    it('should get upcoming bookings within specified days', async () => {
      const upcomingBookings = await BookingService.getUpcomingBookings(7);

      expect(upcomingBookings).toHaveLength(2); // Tomorrow and next week
      expect(upcomingBookings[0].eventDate.getTime()).toBeLessThan(upcomingBookings[1].eventDate.getTime());
    });

    it('should get all upcoming bookings with larger day range', async () => {
      const upcomingBookings = await BookingService.getUpcomingBookings(35);

      expect(upcomingBookings).toHaveLength(3); // All three bookings
    });
  });

  describe('getBookingStatistics', () => {
    beforeEach(async () => {
      const futureDate1 = new Date();
      futureDate1.setDate(futureDate1.getDate() + 5);

      const futureDate2 = new Date();
      futureDate2.setDate(futureDate2.getDate() + 10);

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.WEDDING,
        eventDate: futureDate1,
        eventTime: '18:00',
        status: BOOKING_STATUS.APPROVED,
        totalAmount: 5000,
      });

      await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.BIRTHDAY,
        eventDate: futureDate2,
        eventTime: '15:00',
        status: BOOKING_STATUS.PENDING,
        totalAmount: 2000,
      });
    });

    it('should get booking statistics successfully', async () => {
      const stats = await BookingService.getBookingStatistics();

      expect(stats.overall).toBeDefined();
      expect(stats.overall.byStatus).toBeDefined();
      expect(stats.overall.byEventType).toBeDefined();
      expect(stats.recentTrend).toBeDefined();
    });

    it('should get statistics for date range', async () => {
      const dateFrom = new Date();
      dateFrom.setDate(dateFrom.getDate() - 1);

      const dateTo = new Date();
      dateTo.setDate(dateTo.getDate() + 1);

      const stats = await BookingService.getBookingStatistics({ dateFrom, dateTo });

      expect(stats.timeBased).toBeDefined();
      expect(Array.isArray(stats.timeBased)).toBe(true);
    });
  });
});