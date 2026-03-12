import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../../components/Admin/AdminDashboard';
import { adminService } from '../../services/adminService';
import type { Admin as AdminUser } from '../../services/adminService';

interface AdminProps {
  path: 'dashboard';
}

const Admin: React.FC<AdminProps> = ({ path }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (adminService.isAuthenticated()) {
        const currentAdmin = adminService.getCurrentAdmin();
        if (currentAdmin) {
          setAdmin(currentAdmin);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    adminService.logout();
    setAdmin(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (path === 'dashboard') {
    if (!admin) {
      return <Navigate to="/login" replace />;
    }
    return <AdminDashboard admin={admin} onLogout={handleLogout} />;
  }

  return <Navigate to="/login" replace />;
};

export default Admin;