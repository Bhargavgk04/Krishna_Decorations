const Booking = require('../models/Booking');
const User = require('../models/User');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get dashboard overview statistics
   * @param {Object} options - Query options
   */
  static async getDashboardOverview(options = {}) {
    try {
      const { startDate, endDate } = options;
      const dateFilter = {};
      
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
      }

      // Get booking statistics
      const [bookingStats, userStats, revenueStats, statusDistribution] = await Promise.all([
        this.getBookingStatistics(dateFilter),
        this.getUserStatistics(dateFilter),
        this.getRevenueStatistics(dateFilter),
        this.getBookingStatusDistribution(dateFilter),
      ]);

      // Get recent activities
      const recentBookings = await Booking.find(dateFilter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const recentUsers = await User.find(dateFilter)
        .select('name email createdAt isVerified')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      return {
        overview: {
          totalBookings: bookingStats.total,
          totalUsers: userStats.total,
          totalRevenue: revenueStats.total,
          averageBookingValue: revenueStats.average,
        },
        trends: {
          bookingsGrowth: bookingStats.growth,
          usersGrowth: userStats.growth,
          revenueGrowth: revenueStats.growth,
        },
        distribution: {
          bookingStatus: statusDistribution,
          eventTypes: await this.getEventTypeDistribution(dateFilter),
          monthlyBookings: await this.getMonthlyBookingTrends(dateFilter),
        },
        recent: {
          bookings: recentBookings,
          users: recentUsers,
        },
      };
    } catch (error) {
      logger.error('Failed to get dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get booking statistics
   */
  static async getBookingStatistics(dateFilter = {}) {
    try {
      const total = await Booking.countDocuments(dateFilter);
      
      // Get previous period for growth calculation
      const previousPeriodFilter = this.getPreviousPeriodFilter(dateFilter);
      const previousTotal = await Booking.countDocuments(previousPeriodFilter);
      
      const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

      return {
        total,
        growth: Math.round(growth * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get booking statistics:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStatistics(dateFilter = {}) {
    try {
      const total = await User.countDocuments(dateFilter);
      const verified = await User.countDocuments({ ...dateFilter, isVerified: true });
      
      const previousPeriodFilter = this.getPreviousPeriodFilter(dateFilter);
      const previousTotal = await User.countDocuments(previousPeriodFilter);
      
      const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

      return {
        total,
        verified,
        growth: Math.round(growth * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get user statistics:', error);
      throw error;
    }
  }

  /**
   * Get revenue statistics (mock implementation)
   */
  static async getRevenueStatistics(dateFilter = {}) {
    try {
      // Mock revenue calculation - in real app, this would be based on actual pricing
      const bookings = await Booking.find(dateFilter).lean();
      const total = bookings.length * 25000; // Average booking value
      const average = bookings.length > 0 ? total / bookings.length : 0;
      
      const previousPeriodFilter = this.getPreviousPeriodFilter(dateFilter);
      const previousBookings = await Booking.find(previousPeriodFilter).lean();
      const previousTotal = previousBookings.length * 25000;
      
      const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

      return {
        total,
        average,
        growth: Math.round(growth * 100) / 100,
      };
    } catch (error) {
      logger.error('Failed to get revenue statistics:', error);
      throw error;
    }
  }

  /**
   * Get booking status distribution
   */
  static async getBookingStatusDistribution(dateFilter = {}) {
    try {
      const distribution = await Booking.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return distribution.map(item => ({
        status: item._id,
        count: item.count,
      }));
    } catch (error) {
      logger.error('Failed to get booking status distribution:', error);
      throw error;
    }
  }

  /**
   * Get event type distribution
   */
  static async getEventTypeDistribution(dateFilter = {}) {
    try {
      const distribution = await Booking.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$eventType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      return distribution.map(item => ({
        eventType: item._id,
        count: item.count,
      }));
    } catch (error) {
      logger.error('Failed to get event type distribution:', error);
      throw error;
    }
  }

  /**
   * Get monthly booking trends
   */
  static async getMonthlyBookingTrends(dateFilter = {}) {
    try {
      const trends = await Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      return trends.map(item => ({
        year: item._id.year,
        month: item._id.month,
        count: item.count,
      }));
    } catch (error) {
      logger.error('Failed to get monthly booking trends:', error);
      throw error;
    }
  }

  /**
   * Get admin activity statistics
   */
  static async getAdminActivityStats(dateFilter = {}) {
    try {
      const adminActions = await Booking.aggregate([
        { $match: { ...dateFilter, updatedBy: { $exists: true } } },
        { $group: { _id: '$updatedBy', actions: { $sum: 1 } } },
        { $lookup: { from: 'admins', localField: '_id', foreignField: '_id', as: 'admin' } },
        { $unwind: '$admin' },
        { $project: { adminName: '$admin.name', actions: 1 } },
        { $sort: { actions: -1 } },
      ]);

      return adminActions;
    } catch (error) {
      logger.error('Failed to get admin activity stats:', error);
      throw error;
    }
  }

  /**
   * Get booking performance metrics
   */
  static async getBookingPerformanceMetrics(dateFilter = {}) {
    try {
      const metrics = await Booking.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            approvedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            rejectedBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] },
            },
            pendingBookings: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
            },
            avgResponseTime: {
              $avg: {
                $subtract: ['$updatedAt', '$createdAt'],
              },
            },
          },
        },
      ]);

      const result = metrics[0] || {
        totalBookings: 0,
        approvedBookings: 0,
        rejectedBookings: 0,
        pendingBookings: 0,
        avgResponseTime: 0,
      };

      return {
        ...result,
        approvalRate: result.totalBookings > 0 
          ? (result.approvedBookings / result.totalBookings) * 100 
          : 0,
        rejectionRate: result.totalBookings > 0 
          ? (result.rejectedBookings / result.totalBookings) * 100 
          : 0,
        avgResponseTimeHours: result.avgResponseTime / (1000 * 60 * 60), // Convert to hours
      };
    } catch (error) {
      logger.error('Failed to get booking performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get previous period filter for growth calculations
   */
  static getPreviousPeriodFilter(dateFilter) {
    if (!dateFilter.createdAt) return {};

    const { $gte: startDate, $lte: endDate } = dateFilter.createdAt;
    if (!startDate || !endDate) return {};

    const periodLength = endDate.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodLength);
    const previousEnd = new Date(startDate.getTime());

    return {
      createdAt: {
        $gte: previousStart,
        $lte: previousEnd,
      },
    };
  }
}

module.exports = AnalyticsService;