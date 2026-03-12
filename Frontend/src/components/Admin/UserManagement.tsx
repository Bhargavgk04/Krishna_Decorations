import React, { useState, useEffect } from 'react';
import {
    Search,
    Users,
    UserCheck,
    UserX,
    Mail,
    Phone,
    Calendar,
    RefreshCw
} from 'lucide-react';
import { adminService, User } from '../../services/adminService';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        isActive: undefined as boolean | undefined,
        page: 1,
        limit: 10
    });
    const [pagination, setPagination] = useState({
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
    });

    useEffect(() => {
        loadUsers();
    }, [filters]);

    const loadUsers = async () => {
        // For frontend demo, use mock users
        const mockUsers = [
            { _id: '1', name: 'Aarav Sharma', email: 'aarav.sharma@example.com', phone: '9876543210', role: 'user', isActive: true, createdAt: '2023-01-10', updatedAt: '2023-01-10' },
            { _id: '2', name: 'Priya Mehta', email: 'priya.mehta@example.com', phone: '8765432109', role: 'user', isActive: false, createdAt: '2023-02-15', updatedAt: '2023-02-15' },
            { _id: '3', name: 'Rohan Iyer', email: 'rohan.iyer@example.com', phone: '7654321098', role: 'user', isActive: true, createdAt: '2023-03-20', updatedAt: '2023-03-20' },
            { _id: '4', name: 'Sneha Kulkarni', email: 'sneha.kulkarni@example.com', phone: '6543210987', role: 'user', isActive: true, createdAt: '2023-04-05', updatedAt: '2023-04-05' },
            { _id: '5', name: 'Vikram Reddy', email: 'vikram.reddy@example.com', phone: '5432109876', role: 'user', isActive: false, createdAt: '2023-05-12', updatedAt: '2023-05-12' },
            { _id: '6', name: 'Ananya Gupta', email: 'ananya.gupta@example.com', phone: '4321098765', role: 'user', isActive: true, createdAt: '2023-06-18', updatedAt: '2023-06-18' },
            { _id: '7', name: 'Karan Patel', email: 'karan.patel@example.com', phone: '3210987654', role: 'user', isActive: true, createdAt: '2023-07-22', updatedAt: '2023-07-22' },
        ];
        setUsers(mockUsers);
        setPagination({
            totalItems: mockUsers.length,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        });
        setIsLoading(false);
    };

    const handleStatusToggle = async (user: User) => {
        try {
            const response = await adminService.updateUserStatus(user._id, !user.isActive);
            if (response.success) {
                setUsers(prev => prev.map(u =>
                    u._id === user._id ? { ...u, isActive: !user.isActive } : u
                ));
            }
        } catch (error) {
            console.error('Failed to update user status:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    User Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    View and manage registered customers
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone..."
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                    <select
                        value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                        onChange={(e) => setFilters(prev => ({
                            ...prev,
                            isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                            page: 1
                        }))}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active Only</option>
                        <option value="false">Inactive Only</option>
                    </select>
                    <Button
                        variant="outline"
                        onClick={loadUsers}
                        leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        User Info
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.map((user) => (
                                    <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {user.name}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        ID: {user._id.slice(-8)}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="text-sm text-gray-900 dark:text-white flex items-center">
                                                    <Mail className="w-3.h-3 mr-2 text-gray-400" />
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                        <Phone className="w-3.h-3 mr-2 text-gray-400" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            <div className="flex items-center">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.isActive
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Button
                                                size="sm"
                                                variant={user.isActive ? "danger" : "primary"}
                                                leftIcon={user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                                onClick={() => handleStatusToggle(user)}
                                            >
                                                {user.isActive ? 'Deactivate' : 'Activate'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {users.length === 0 && !isLoading && (
                    <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">No users found</p>
                    </div>
                )}

                {pagination.totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasPrevPage}
                                onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage - 1 }))}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!pagination.hasNextPage}
                                onClick={() => setFilters(prev => ({ ...prev, page: pagination.currentPage + 1 }))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
