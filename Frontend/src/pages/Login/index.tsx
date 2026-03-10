import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/Auth/LoginForm';
import RegisterForm from '../../components/Auth/RegisterForm';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {showRegister ? (
          <RegisterForm 
            onSuccess={() => {
              navigate('/');
            }}
            onSwitchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <LoginForm 
            onSuccess={() => {
              navigate('/');
            }}
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
