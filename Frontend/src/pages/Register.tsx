import React from 'react';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/Auth/RegisterForm';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <RegisterForm 
          onSuccess={() => {
            navigate('/');
          }}
          onSwitchToLogin={() => {
            navigate('/login');
          }}
        />
      </div>
    </div>
  );
};

export default RegisterPage;
