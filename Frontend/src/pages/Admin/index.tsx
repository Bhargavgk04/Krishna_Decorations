// src/pages/Admin/index.tsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from '../../components/Admin/AdminLogin';
import AdminDashboard from '../../components/Admin/AdminDashboard';
import { adminService } from '../../services/adminService';
import type { Admin as AdminUser } from '../../services/adminService';

const Admin: React.FC = () => {
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

  const handleLogin = (adminData: AdminUser) => {
    setAdmin(adminData);
  };

  const handleLogout = () => {
    adminService.logout();
    setAdmin(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          admin ? (
            <Navigate to="/admin/dashboard" replace />
          ) : (
            <AdminLogin onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="dashboard"
        element={
          admin ? (
            <AdminDashboard admin={admin} onLogout={handleLogout} />
          ) : (
            <Navigate to="/admin" replace />
          )
        }
      />
      <Route path="login" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default Admin;