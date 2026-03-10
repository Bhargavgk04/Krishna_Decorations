import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingAction {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  color: string;
}

const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const actions: FloatingAction[] = [
    {
      icon: <span className="text-lg">📞</span>,
      label: 'Call Now',
      action: () => window.open('tel:+919876543210'),
      color: 'bg-emerald-600 hover:bg-emerald-700'
    },
    {
      icon: <span className="text-lg">✉️</span>,
      label: 'Send Email',
      action: () => window.open('mailto:krishnaevents0123@gmail.com'),
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      icon: <span className="text-lg">💬</span>,
      label: 'WhatsApp',
      action: () => window.open('https://wa.me/919876543210'),
      color: 'bg-green-600 hover:bg-green-700'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="mb-4 w-12 h-12 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
          >
            <span className="text-lg">⬆️</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 space-y-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, scale: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  x: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0, 
                  x: 20,
                  transition: { delay: (actions.length - index - 1) * 0.1 }
                }}
                className="flex items-center space-x-3"
              >
                {/* Label */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-black dark:bg-white text-white dark:text-black px-3 py-2 rounded-lg text-sm font-medium shadow-lg whitespace-nowrap"
                >
                  {action.label}
                </motion.div>
                
                {/* Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={action.action}
                  className={`w-12 h-12 ${action.color} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center`}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-amber-400 to-orange-500 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden"
      >
        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-full"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 2, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Icon */}
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <span className="text-xl">✕</span> : <span className="text-xl">☰</span>}
        </motion.div>

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur-lg opacity-0"
          whileHover={{ opacity: 0.3 }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>

      {/* Background overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingActionButton;