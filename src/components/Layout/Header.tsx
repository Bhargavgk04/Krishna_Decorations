import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

const navLinks = [
  { name: 'Home', href: '/', icon: '🏠' },
  { name: 'Gallery', href: '/gallery', icon: '🖼️' },
  { name: 'Services', href: '/services', icon: '⚡' },
  { name: 'About', href: '/#about', icon: 'ℹ️' },
  { name: 'Contact', href: '/#contact', icon: '📞' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle nav link active state
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    if (href.startsWith('/#')) return location.pathname === '/' && location.hash === href.substring(1);
    return location.pathname === href;
  };

  // Smooth scroll for hash links
  const handleNavigation = (href: string) => {
    setIsMenuOpen(false);
    if (href.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href.substring(1));
          if (element) {
            const navbarHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - navbarHeight;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 200);
      } else {
        const element = document.querySelector(href.substring(1));
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navbarHeight;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
  };

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 w-screen z-[100]"
      style={{ minHeight: 80 }}
    >
      {/* Professional background with subtle gradient */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="w-full h-full bg-gradient-to-r from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-md border-b border-gray-700/50" />
      </motion.div>

      {/* Navbar content */}
      <div className="relative w-full flex items-center justify-between px-6 lg:px-8 py-4" style={{ zIndex: 10 }}>
        {/* Logo */}
        <motion.button
          onClick={() => {
            handleNavigation('/');
            setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }), 100);
          }}
          className="flex items-center space-x-3 group select-none bg-transparent border-none outline-none cursor-pointer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-amber-300 to-amber-500 rounded-lg opacity-0 group-hover:opacity-100"
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xl font-bold text-white tracking-tight group-hover:text-amber-400 transition-colors duration-300">
            Krishna Events
          </span>
        </motion.button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((item, index) => (
            <motion.button
              key={item.name}
              onClick={() => handleNavigation(item.href)}
              className={`relative px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-300
                ${isActive(item.href) 
                  ? 'text-amber-400 bg-amber-400/10' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                }
              `}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: 0.1 + index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              whileHover={{ 
                scale: 1.05,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.name}</span>
              {isActive(item.href) && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-amber-400/10 rounded-lg border border-amber-400/30"
                  initial={false}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              )}
            </motion.button>
          ))}
        </nav>

        {/* Theme toggle & mobile menu */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-300 border border-gray-600/50"
            aria-label="Toggle theme"
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-amber-400" />
            )}
          </motion.button>

          {/* Mobile menu button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-300 border border-gray-600/50"
            aria-label="Toggle menu"
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5 text-amber-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5 text-amber-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="md:hidden absolute top-full left-0 w-full bg-gray-900/95 backdrop-blur-md border-b border-gray-700/50 shadow-xl overflow-hidden"
          >
            <motion.ul 
              className="flex flex-col py-4 px-6 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              {navLinks.map((item, index) => (
                <motion.li 
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    delay: 0.2 + index * 0.1, 
                    duration: 0.3,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                >
                  <motion.button
                    onClick={() => handleNavigation(item.href)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-lg font-medium text-base transition-all duration-300
                      ${isActive(item.href) 
                        ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </motion.button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;