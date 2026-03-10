const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../../../src/models/Booking');
const User = require('../../../src/models/User');
const { BOOKING_STATUS, EVENT_TYPES, DECORATION_STYLES, USER_ROLES } = require('../../../src/config/constants');

describe('Booking Model', () => {
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
    await Booking.deleteMany({});
    await User.deleteMany({});
    
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'user@example.com',
      phone: '+1234567890',
      password: 'password123',
    });

    // Create test admin
    testAdmin = await User.create({
      name: 'Test Admin',
      email: 'admin@example.com',
      phone: '+1234567891',
      password: 'adminpass123',
      role: USER_ROLES.ADMIN,
    });
  });

  describe('Booking Creation', () => {
    it('should create a valid booking', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        userId: testUser._id,
        eventType: EVENT_TYPES.WEDDING,
        eventDate: futureDate,
        eventTime: '18:00',
        venue: 'Grand Hotel Ballroom',
        guestCount: 150,
        decorationStyle: DECORATION_STYLES.ELEGANT,
        specialRequests: 'Please include white roses',
      };

      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.userId.toString()).toBe(testUser._id.toString());
      expect(savedBooking.eventType).toBe(EVENT_TYPES.WEDDING);
      expect(savedBooking.status).toBe(BOOKING_STATUS.PENDING);
      expect(savedBooking.bookingReference).toBeDefined();
      expect(savedBooking.bookingReference).toMatch(/^BK-/);
      expect(savedBooking.isActive).toBe(true);
    });

    it('should require mandatory fields', async () => {
      const booking = new Booking({});

      let error;
      try {
        await booking.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.userId).toBeDefined();
      expect(error.errors.eventType).toBeDefined();
      expect(error.errors.eventDate).toBeDefined();
      expect(error.errors.eventTime).toBeDefined();
    });

    it('should validate event date is in the future', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const bookingData = {
        userId: testUser._id,
        eventType: EVENT_TYPES.BIRTHDAY,
        eventDate: pastDate,
        eventTime: '15:00',
      };

      const booking = new Booking(bookingData);

      let error;
      try {
        await booking.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.message).toContain('Event date must be in the future');
    });

    it('should validate event time format', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        userId: testUser._id,
        eventType: EVENT_TYPES.CORPORATE,
        eventDate: futureDate,
        eventTime: '25:00', // Invalid time
      };

      const booking = new Booking(bookingData);

      let error;
      try {
        await booking.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.eventTime).toBeDefined();
    });

    it('should validate enum values', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        userId: testUser._id,
        eventType: 'invalid-event-type',
        eventDate: futureDate,
        eventTime: '18:00',
      };

      const booking = new Booking(bookingData);

      let error;
      try {
        await booking.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.eventType).toBeDefined();
    });

    it('should generate unique booking reference', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData1 = {
        userId: testUser._id,
        eventType: EVENT_TYPES.WEDDING,
        eventDate: futureDate,
        eventTime: '18:00',
      };

      const bookingData2 = {
        userId: testUser._id,
        eventType: EVENT_TYPES.BIRTHDAY,
        eventDate: futureDate,
        eventTime: '15:00',
      };

      const booking1 = await Booking.create(bookingData1);
      const booking2 = await Booking.create(bookingData2);

      expect(booking1.bookingReference).toBeDefined();
      expect(booking2.bookingReference).toBeDefined();
      expect(booking1.bookingReference).not.toBe(booking2.bookingReference);
    });
  });

  describe('Booking Relationships', () => {
    it('should populate user information', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.ANNIVERSARY,
        eventDate: futureDate,
        eventTime: '19:00',
      });

      const populatedBooking = await Booking.findById(booking._id)
        .populate('userId', 'name email phone');

      expect(populatedBooking.userId.name).toBe('Test User');
      expect(populatedBooking.userId.email).toBe('user@example.com');
      expect(populatedBooking.userId.password).toBeUndefined();
    });

    it('should validate admin reference', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.CORPORATE,
        eventDate: futureDate,
        eventTime: '10:00',
        adminId: testAdmin._id,
      });

      expect(booking.adminId.toString()).toBe(testAdmin._id.toString());
    });
  });

  describe('Booking Status Management', () => {
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

    it('should update booking status', async () => {
      await testBooking.updateStatus(
        BOOKING_STATUS.APPROVED,
        testAdmin._id,
        'Booking approved with standard package'
      );

      const updatedBooking = await Booking.findById(testBooking._id);
      expect(updatedBooking.status).toBe(BOOKING_STATUS.APPROVED);
      expect(updatedBooking.adminId.toString()).toBe(testAdmin._id.toString());
      expect(updatedBooking.adminComments).toBe('Booking approved with standard package');
    });

    it('should check if booking can be modified', () => {
      expect(testBooking.canBeModified()).toBe(true);

      testBooking.status = BOOKING_STATUS.APPROVED;
      expect(testBooking.canBeModified()).toBe(false);

      testBooking.status = BOOKING_STATUS.MODIFICATIONS_REQUESTED;
      expect(testBooking.canBeModified()).toBe(true);
    });

    it('should check if booking is expired', () => {
      expect(testBooking.isExpired()).toBe(false);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      testBooking.eventDate = pastDate;

      expect(testBooking.isExpired()).toBe(true);
    });
  });

  describe('Virtual Properties', () => {
    it('should calculate days until event', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.BABY_SHOWER,
        eventDate: futureDate,
        eventTime: '14:00',
      });

      expect(booking.daysUntilEvent).toBe(7);
    });

    it('should create event datetime virtual', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.OTHER,
        eventDate: futureDate,
        eventTime: '20:30',
      });

      const eventDateTime = booking.eventDateTime;
      expect(eventDateTime.getHours()).toBe(20);
      expect(eventDateTime.getMinutes()).toBe(30);
    });
  });

  describe('Static Methods', () => {
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

    it('should find bookings by user', async () => {
      const userBookings = await Booking.findByUser(testUser._id);
      expect(userBookings).toHaveLength(2);
      expect(userBookings[0].userId.name).toBe('Test User');
    });

    it('should find bookings by status', async () => {
      const pendingBookings = await Booking.findByUser(testUser._id, {
        status: BOOKING_STATUS.PENDING
      });
      expect(pendingBookings).toHaveLength(1);
      expect(pendingBookings[0].status).toBe(BOOKING_STATUS.PENDING);
    });

    it('should find bookings for admin', async () => {
      const adminBookings = await Booking.findForAdmin();
      expect(adminBookings).toHaveLength(2);
    });

    it('should get booking statistics', async () => {
      const stats = await Booking.getBookingStats();
      expect(stats.byStatus[BOOKING_STATUS.PENDING]).toBeDefined();
      expect(stats.byStatus[BOOKING_STATUS.APPROVED]).toBeDefined();
      expect(stats.byEventType[EVENT_TYPES.WEDDING]).toBe(1);
      expect(stats.byEventType[EVENT_TYPES.BIRTHDAY]).toBe(1);
    });

    it('should check availability for a date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);

      const availability = await Booking.checkAvailability(futureDate);
      expect(availability.available).toBe(true);
      expect(availability.existingBookings).toBe(0);
    });
  });

  describe('JSON Transformation', () => {
    it('should exclude version field from JSON', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const booking = await Booking.create({
        userId: testUser._id,
        eventType: EVENT_TYPES.OTHER,
        eventDate: futureDate,
        eventTime: '17:00',
      });

      const bookingJSON = booking.toJSON();
      expect(bookingJSON.__v).toBeUndefined();
      expect(bookingJSON.bookingReference).toBeDefined();
    });
  });
});