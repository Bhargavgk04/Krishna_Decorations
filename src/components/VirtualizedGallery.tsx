import React from 'react';
import { motion } from 'framer-motion';
import OptimizedImage from './OptimizedImage';
import { ImageData } from '../utils/imageData';

interface VirtualizedGalleryProps {
  images: ImageData[];
  columns?: number;
  gap?: number;
  className?: string;
  onImageClick?: (image: ImageData, index: number) => void;
}

const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({
  images,
  columns = 4,
  gap = 24,
  className = '',
  onImageClick
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: `${gap}px`
        }}
      >
        {images.map((image, index) => (
          <motion.div
            key={`${image.src}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4,
              delay: index * 0.05,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            whileHover={{ 
              scale: 1.03,
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="group relative overflow-hidden rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800"
            onClick={() => onImageClick?.(image, index)}
            tabIndex={0}
            aria-label={image.alt}
            role="button"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                onImageClick?.(image, index);
              }
            }}
          >
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <OptimizedImage
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                sizes={`(max-width: 768px) 100vw, (max-width: 1200px) ${100 / columns}vw, ${100 / columns}vw`}
              />
              
              {/* Category Badge - Always Visible */}
              <div className="absolute top-3 left-3 bg-amber-400 text-black px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                {image.category}
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-2">{image.alt}</h3>
                  {image.description && (
                    <p className="text-xs text-gray-200 line-clamp-2">{image.description}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Image Info - Always Visible Below Image */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                    {image.alt}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {image.category}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default VirtualizedGallery; 