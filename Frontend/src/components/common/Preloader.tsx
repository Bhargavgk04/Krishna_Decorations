import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 800);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed inset-0 z-[9999] bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.2, 0.8, 0.2],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          <div className="text-center relative z-10">
            {/* Logo Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-500/20 blur-xl"
                />
                <div className="relative bg-gradient-to-r from-amber-400 to-orange-500 text-black p-6 rounded-2xl shadow-2xl">
                  <motion.h1
                    className="text-4xl font-bold"
                    animate={{
                      textShadow: [
                        '0 0 10px rgba(251, 191, 36, 0.5)',
                        '0 0 20px rgba(251, 191, 36, 0.8)',
                        '0 0 10px rgba(251, 191, 36, 0.5)',
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Krishna
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-sm font-medium mt-1"
                  >
                    Decorations
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Loading Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
                Setting up your celebration...
              </h2>
              <motion.p
                className="text-gray-600 dark:text-gray-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Getting everything ready for you
              </motion.p>
            </motion.div>

            {/* Progress Bar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 }}
              className="w-80 max-w-sm mx-auto"
            >
              <div className="relative">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <motion.div
                  className="absolute -top-1 h-4 w-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full shadow-lg"
                  animate={{ left: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ transform: 'translateX(-50%)' }}
                />
              </div>
              <motion.p
                className="text-center mt-4 text-sm font-medium text-gray-700 dark:text-gray-300"
                key={Math.floor(progress)}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {Math.floor(progress)}%
              </motion.p>
            </motion.div>

            {/* Loading Steps */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-8 text-sm text-gray-500 dark:text-gray-400"
            >
              {progress < 30 && "Loading resources..."}
              {progress >= 30 && progress < 60 && "Setting up gallery..."}
              {progress >= 60 && progress < 90 && "Final touches..."}
              {progress >= 90 && "Ready to go!"}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;