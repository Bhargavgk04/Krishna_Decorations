import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Star, Play, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import BookingForm from '../BookingForm/BookingForm';
import LoginForm from '../Auth/LoginForm';
import RegisterForm from '../Auth/RegisterForm';
import { useAuth } from '../../contexts/AuthContext';

const Hero: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Enhanced mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleBookNowClick = () => {
    if (isAuthenticated) {
      setShowBookingModal(true);
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowBookingModal(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    // Show success message or redirect
  };

  return (
    <>
    <section
      id="home"
      className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#050b16] via-[#0c1a2b] to-[#00040a]"
    >
      {/* Enhanced Background with Multiple Layers */}
      <div className="absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0b1726] to-black" />

        {/* Animated background image with parallax */}
        <motion.div 
          style={{ y }}
          className="absolute inset-0 scale-110"
        >
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.25 }}
            transition={{ duration: 3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')] bg-cover bg-center"
          />
        </motion.div>

        {/* Enhanced overlay with gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-slate-900/65 to-black/85" />

        {/* Animated mesh overlay */}
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 50%, rgba(251, 191, 36, 0.1) 0%, transparent 50%)',
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>

      {/* Enhanced floating elements with mouse parallax */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        style={{
          x: mousePosition.x * 0.5,
          y: mousePosition.y * 0.5,
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-20 w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full opacity-60 blur-sm"
      />
      <motion.div
        animate={{
          y: [0, 15, 0],
          rotate: [0, -5, 0],
        }}
        style={{
          x: mousePosition.x * -0.3,
          y: mousePosition.y * -0.3,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-40 right-32 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full opacity-40 blur-sm"
      />
      <motion.div
        animate={{
          y: [0, -25, 0],
          scale: [1, 1.1, 1],
        }}
        style={{
          x: mousePosition.x * 0.2,
          y: mousePosition.y * 0.2,
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-32 left-1/4 w-4 h-4 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full opacity-50 blur-sm"
      />

      {/* Content with Enhanced Animations */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 text-center px-4 max-w-6xl mx-auto"
      >
        {/* Premium badge with enhanced animation */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex items-center justify-center space-x-3 mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Star className="h-6 w-6 text-amber-500" fill="currentColor" />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="px-6 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-400/30 rounded-full"
          >
            <span className="text-amber-500 font-semibold tracking-wider text-sm uppercase">
              ✨ Premium Event Decorations Since 2016
            </span>
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Star className="h-6 w-6 text-amber-500" fill="currentColor" />
          </motion.div>
        </motion.div>

        {/* Enhanced Text Animation with Stagger Effect */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-tight"
          >
            <motion.span
              initial={{ opacity: 0, y: 50, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="block"
            >
              Beautiful
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 50, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.8, delay: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="block bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent bg-size-200 animate-gradient-x"
            >
              Celebrations
            </motion.span>
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-xl md:text-2xl lg:text-3xl text-slate-300 mb-10 max-w-4xl mx-auto leading-relaxed"
        >
          We bring your vision to life with{' '}
          <motion.span
            animate={{ color: ['#fbbf24', '#f97316', '#fbbf24'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="font-semibold"
          >
            stunning decorations
          </motion.span>
          {' '}for weddings, parties, and every special moment that matters to you.
        </motion.p>

        {/* Enhanced CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16"
        >
          <motion.button
            onClick={handleBookNowClick}
            whileHover={{ 
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(251, 191, 36, 0.3)",
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.95 }}
            className="group relative bg-gradient-to-r from-amber-400 to-orange-500 text-black px-10 py-5 rounded-2xl font-bold text-lg overflow-hidden shadow-2xl"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-400 opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
            <div className="relative flex items-center space-x-3">
              <Calendar className="h-6 w-6" />
              <span>Book Now</span>
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowRight className="h-6 w-6" />
              </motion.div>
            </div>
          </motion.button>
          
          <Link to="/gallery">
            <motion.button
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(251, 191, 36, 0.2)",
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative border-2 border-amber-400 text-amber-500 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-amber-400 hover:text-black transition-all duration-300 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-amber-400 scale-x-0 group-hover:scale-x-100 origin-left"
                transition={{ duration: 0.3 }}
              />
              <div className="relative flex items-center space-x-3">
                <Play className="h-6 w-6" />
                <span>See Our Work</span>
              </div>
            </motion.button>
          </Link>
        </motion.div>


      </motion.div>

      {/* Enhanced Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center space-y-2"
        >
          <div className="w-8 h-12 border-2 border-amber-400 rounded-full flex justify-center relative overflow-hidden">
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-4 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full mt-2"
            />
          </div>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-amber-400 text-sm font-medium tracking-wider"
          >
            DISCOVER MORE
          </motion.div>
        </motion.div>
      </motion.div>
    </section>

      {/* Booking Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        title="Book Your Event"
        size="xl"
      >
        <BookingForm
          onSuccess={handleBookingSuccess}
          onClose={() => setShowBookingModal(false)}
        />
      </Modal>

      {/* Auth Modal */}
      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        size="md"
      >
        {authMode === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </Modal>
    </>
  );
};

export default Hero;