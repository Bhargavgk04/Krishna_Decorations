import React, { useState, useEffect, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useImageLoader, useIntersectionObserver } from '../utils/imageLoader';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  style?: CSSProperties;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  onLoad,
  onError,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  style = {},
}) => {
  const [shouldLoad, setShouldLoad] = useState(priority);
  const { isLoaded, hasError, imageSrc } = useImageLoader(shouldLoad ? src : '');

  const setRef = useIntersectionObserver(() => {
    setShouldLoad(true);
  }, { rootMargin: '100px' });

  useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  useEffect(() => {
    if (hasError && onError) {
      onError();
    }
  }, [hasError, onError]);

  return (
    <div
      ref={setRef}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight: '200px', ...style }}
    >
      <AnimatePresence mode="wait">
        {!isLoaded && !hasError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
          >
            <div className="animate-pulse bg-gray-300 dark:bg-gray-700 w-full h-full" />
          </motion.div>
        )}
        
        {isLoaded && (
          <motion.img
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            src={imageSrc}
            alt={alt}
            className="w-full h-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            sizes={sizes}
            style={style}
            onLoad={() => {
              if (onLoad) onLoad();
            }}
            onError={() => {
              if (onError) onError();
            }}
          />
        )}
        
        {hasError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center"
          >
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm">Image not available</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OptimizedImage; 