import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { bookingService, Booking } from '../../services/bookingService';
import { User, Mail, Calendar, LogOut, Clock, MapPin, Eye } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadBookings();
        }
    }, [user]);

    const loadBookings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await bookingService.getUserBookings({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
            if (response.success && response.data) {
                setBookings(response.data);
            }
        } catch (err: any) {
            console.error('Failed to load bookings:', err);
            setError('Failed to load bookings');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'in_progress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!user) {
        return (
            <div className="min-h-screen pt-24 pb-12 flex justify-center items-center">
                <p className="text-gray-500">Please log in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card-dark p-8"
                >
                    <div className="flex items-center gap-6 mb-8">
                        <div className="h-24 w-24 rounded-full bg-brand-gradient flex items-center justify-center text-4xl font-bold text-white shadow-brand">
                            {user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                {user.name}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mt-2">
                                <Mail className="w-4 h-4" />
                                <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-brand mt-1 capitalize">
                                <User className="w-4 h-4" />
                                <span>{user.role}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-brand" />
                            Recent Bookings
                        </h2>

                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <LoadingSpinner />
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
                                <p className="text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="bg-white/50 dark:bg-slate-900/30 rounded-xl p-8 text-center border border-transparent dark:border-white/5">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No Bookings Yet
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    You haven't made any bookings yet. Start planning your dream event!
                                </p>
                                <a
                                    href="/booking"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl hover:bg-brand/90 transition-colors font-medium"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Create Your First Booking
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <motion.div
                                        key={booking._id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white/50 dark:bg-slate-900/30 rounded-xl p-6 border border-transparent dark:border-white/5 hover:border-brand/20 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                                                        {booking.eventType}
                                                    </h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDate(booking.eventDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{booking.eventTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4" />
                                                        <span>{booking.venue.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => window.location.href = `/booking/${booking._id}`}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="text-sm font-medium">View</span>
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}

                                {bookings.length >= 5 && (
                                    <div className="text-center pt-4">
                                        <a
                                            href="/my-bookings"
                                            className="inline-flex items-center gap-2 px-6 py-2 text-brand hover:text-brand/80 font-medium transition-colors"
                                        >
                                            View All Bookings
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProfilePage;
