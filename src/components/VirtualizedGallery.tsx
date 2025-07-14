import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import OptimizedImage from './OptimizedImage';
import { ImageData } from '../utils/imageData';
import { rafThrottle } from '../utils/performance';

interface VirtualizedGalleryProps {
  images: ImageData[];
  columns?: number;
  gap?: number;
  className?: string;
  onImageClick?: (image: ImageData, index: number) => void;
}

const MAX_RENDERED = 24; // Cap max images rendered at once
const BUFFER = 2; // Smaller buffer for better perf

const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({
  images,
  columns = 4,
  gap = 16,
  className = '',
  onImageClick
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [itemHeight, setItemHeight] = useState(300); // Default
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [animatedIndexes, setAnimatedIndexes] = useState<Set<number>>(new Set());

  // Dynamically calculate item height based on container width
  const recalculateItemHeight = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.offsetWidth;
    const colWidth = width / columns;
    const aspectRatio = 4 / 3;
    setItemHeight(colWidth * aspectRatio);
  }, [columns]);

  // Recalculate on mount and resize
  useEffect(() => {
    recalculateItemHeight();
    window.addEventListener('resize', recalculateItemHeight);
    return () => window.removeEventListener('resize', recalculateItemHeight);
  }, [recalculateItemHeight]);

  // Calculate which items should be visible
  const calculateVisibleRange = useCallback(() => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
    const containerHeight = containerRef.current.clientHeight;
    const scrollTop = window.scrollY;
    const buffer = BUFFER;
    const start = Math.max(0, Math.floor((scrollTop - containerTop - buffer * itemHeight) / itemHeight));
    let end = Math.min(
      images.length,
      Math.ceil((scrollTop - containerTop + containerHeight + buffer * itemHeight) / itemHeight)
    );
    // Cap max rendered
    if (end - start > MAX_RENDERED) end = start + MAX_RENDERED;
    setVisibleRange({ start, end });
  }, [images.length, itemHeight]);

  // Handle scroll events with performance optimization
  useEffect(() => {
    const handleScroll = rafThrottle(() => {
      calculateVisibleRange();
    });
    window.addEventListener('scroll', handleScroll, { passive: true });
    calculateVisibleRange();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [calculateVisibleRange]);

  // Calculate total height for virtual scrolling
  const totalHeight = images.length * itemHeight;

  // Get visible images
  const visibleImages = images.slice(visibleRange.start, visibleRange.end);

  // Track which images have animated in
  useEffect(() => {
    setAnimatedIndexes(prev => {
      const next = new Set(prev);
      for (let i = visibleRange.start; i < visibleRange.end; i++) {
        next.add(i);
      }
      return next;
    });
  }, [visibleRange]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ height: totalHeight }}
    >
      <div
        style={{
          transform: `translateY(${visibleRange.start * itemHeight}px)`,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0
        }}
      >
        <AnimatePresence>
          {visibleImages.map((image, index) => {
            const actualIndex = visibleRange.start + index;
            const hasAnimated = animatedIndexes.has(actualIndex);
            return (
              <motion.div
                key={`${image.src}-${actualIndex}`}
                initial={hasAnimated ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  duration: 0.3,
                  delay: hasAnimated ? 0 : index * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="group cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => onImageClick?.(image, actualIndex)}
                style={{ height: itemHeight }}
                tabIndex={0}
                aria-label={image.alt}
                role="button"
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onImageClick?.(image, actualIndex);
                  }
                }}
              >
                <OptimizedImage
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full"
                  sizes={`(max-width: 768px) 100vw, (max-width: 1200px) ${100 / columns}vw, ${100 / columns}vw`}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-end">
                  <div className="p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="font-semibold text-sm mb-1">{image.alt}</h3>
                    {image.description && (
                      <p className="text-xs text-gray-200">{image.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default VirtualizedGallery; 