import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Filter, Plus, Minus, RotateCcw, RotateCw, RefreshCcw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { 
  portfolioImages, 
  getAllCategories,
  type ImageData 
} from '../utils/imageData';
import VirtualizedGallery from '../components/VirtualizedGallery';
import OptimizedImage from '../components/OptimizedImage';

const GalleryOptimized: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filteredImages, setFilteredImages] = useState<ImageData[]>(portfolioImages);
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const categories = useMemo(() => ['All', ...getAllCategories()], []);

  // Filter images based on selected category
  const handleCategoryFilter = useCallback((category: string) => {
    setIsLoading(true);
    setSelectedCategory(category);
    // Use setTimeout to allow UI to update before filtering
    setTimeout(() => {
      if (category === 'All') {
        setFilteredImages(portfolioImages);
      } else {
        setFilteredImages(portfolioImages.filter(img => img.category === category));
      }
      setIsLoading(false);
    }, 100);
  }, []);

  // Memoize filtered images to prevent unnecessary re-renders
  const memoizedFilteredImages = useMemo(() => {
    if (selectedCategory === 'All') {
      return portfolioImages;
    }
    return portfolioImages.filter(img => img.category === selectedCategory);
  }, [selectedCategory]);

  // Handle URL parameters for category filtering
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && categories.includes(categoryParam)) {
      handleCategoryFilter(categoryParam);
    }
  }, [searchParams, categories, handleCategoryFilter]);

  // Group images by category (memoized)
  const imagesByCategory = useMemo(() => {
    const groupedImages: { [key: string]: ImageData[] } = {};
    
    getAllCategories().forEach(category => {
      groupedImages[category] = portfolioImages.filter(img => img.category === category);
    });
    
    return groupedImages;
  }, []);

  const nextImage = useCallback(() => {
    setSelectedImage((prev) => (prev !== null ? (prev + 1) % filteredImages.length : 0));
  }, [filteredImages.length]);

  const prevImage = useCallback(() => {
    setSelectedImage((prev) => (prev !== null ? (prev - 1 + filteredImages.length) % filteredImages.length : 0));
  }, [filteredImages.length]);

  // Reset zoom/rotation when image changes or modal closes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [selectedImage]);

  // Keyboard controls for zoom/rotate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage !== null) {
        if (e.key === 'Escape') {
          setSelectedImage(null);
        } else if (e.key === 'ArrowRight') {
          nextImage();
        } else if (e.key === 'ArrowLeft') {
          prevImage();
        } else if (e.key === '+' || e.key === '=') {
          setZoom(z => Math.min(z + 0.2, 3));
        } else if (e.key === '-') {
          setZoom(z => Math.max(z - 0.2, 0.2));
        } else if (e.key.toLowerCase() === 'r') {
          setRotation(r => r + 90);
        } else if (e.key.toLowerCase() === 'l') {
          setRotation(r => r - 90);
        } else if (e.key === '0') {
          setZoom(1);
          setRotation(0);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, nextImage, prevImage]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-black relative overflow-hidden">
        {/* Background elements */}
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-40 h-40 bg-amber-400/5 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            rotate: [360, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"
        />

        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-full mb-6"
            >
              <Camera className="h-8 w-8 text-amber-400" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Our <motion.span 
                className="text-amber-400"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                Gallery
              </motion.span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Explore our complete collection of event decorations organized by category
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filter by:</span>
            </div>
            {categories.map((category, index) => (
              <motion.button
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryFilter(category)}
                disabled={isLoading}
                className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-amber-400 text-black shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-100 dark:hover:bg-gray-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-16 bg-white dark:bg-black">
        <div className="container mx-auto px-4 lg:px-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-center items-center py-20"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Show filtered view when category is selected */}
                {selectedCategory !== 'All' ? (
                  <>
                    {/* Category Header */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6 }}
                      className="text-center mb-12"
                    >
                      <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {selectedCategory}
                      </h2>
                      <p className="text-lg text-gray-600 dark:text-gray-300">
                        {memoizedFilteredImages.length} {memoizedFilteredImages.length === 1 ? 'image' : 'images'} found
                      </p>
                    </motion.div>

                    {/* Virtualized Gallery for filtered images */}
                    <VirtualizedGallery
                      images={memoizedFilteredImages}
                      columns={4}
                      gap={24}
                      onImageClick={(image) => {
                        const globalIndex = portfolioImages.findIndex(img => 
                          img.src === image.src && img.alt === image.alt
                        );
                        setSelectedImage(globalIndex);
                      }}
                    />
                  </>
                ) : (
                  /* Show all images organized by category */
                  <div className="space-y-16">
                    {getAllCategories().map((category, categoryIndex) => {
                      const categoryImages = imagesByCategory[category];
                      if (categoryImages.length === 0) return null;

                      return (
                        <motion.div
                          key={category}
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.6, 
                            delay: categoryIndex * 0.1,
                            ease: [0.25, 0.46, 0.45, 0.94]
                          }}
                          className="space-y-8"
                        >
                          {/* Category Header */}
                          <div className="text-center">
                            <motion.h2
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.6, delay: 0.2 }}
                              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
                            >
                              {category}
                            </motion.h2>
                            <motion.p
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.6, delay: 0.3 }}
                              className="text-lg text-gray-600 dark:text-gray-300"
                            >
                              {categoryImages.length} {categoryImages.length === 1 ? 'image' : 'images'}
                            </motion.p>
                          </div>

                          {/* Virtualized Gallery for category images */}
                          <VirtualizedGallery
                            images={categoryImages}
                            columns={4}
                            gap={24}
                            onImageClick={(image) => {
                              const globalIndex = portfolioImages.findIndex(img => 
                                img.src === image.src && img.alt === image.alt
                              );
                              setSelectedImage(globalIndex);
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Bar: Info + Controls + Close */}
              <div className="absolute top-0 left-0 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-2 p-4 z-10">
                {/* Info Bar */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div className="bg-amber-400 text-black px-3 py-1 rounded-full text-sm font-medium inline-block">
                    {portfolioImages[selectedImage].category}
                  </div>
                  <div className="text-white font-semibold text-lg">
                    {portfolioImages[selectedImage].alt}
                  </div>
                  {portfolioImages[selectedImage].description && (
                    <div className="text-gray-200 text-sm">
                      {portfolioImages[selectedImage].description}
                    </div>
                  )}
                  <div className="text-xs text-gray-300 ml-2">
                    {selectedImage + 1} of {filteredImages.length}
                  </div>
                </div>
                {/* Controls */}
                <div className="flex gap-2 bg-black/60 rounded-lg p-2 shadow-lg">
                  <button
                    aria-label="Zoom in"
                    className="p-2 rounded hover:bg-amber-400/30 text-white"
                    onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Zoom out"
                    className="p-2 rounded hover:bg-amber-400/30 text-white"
                    onClick={() => setZoom(z => Math.max(z - 0.2, 0.2))}
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Rotate left"
                    className="p-2 rounded hover:bg-amber-400/30 text-white"
                    onClick={() => setRotation(r => r - 90)}
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Rotate right"
                    className="p-2 rounded hover:bg-amber-400/30 text-white"
                    onClick={() => setRotation(r => r + 90)}
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                  <button
                    aria-label="Reset"
                    className="p-2 rounded hover:bg-amber-400/30 text-white"
                    onClick={() => { setZoom(1); setRotation(0); }}
                  >
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                </div>
                {/* Close Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setSelectedImage(null)}
                  className="ml-auto p-2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                  style={{ position: 'absolute', top: 0, right: 0 }}
                >
                  <X className="h-6 w-6" />
                </motion.button>
              </div>
              {/* Centered Image */}
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="relative flex items-center justify-center w-full h-full">
                  <OptimizedImage
                    src={portfolioImages[selectedImage].src}
                    alt={portfolioImages[selectedImage].alt}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl bg-black"
                    priority={true}
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
                      margin: 'auto',
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: '80vh',
                      objectFit: 'contain',
                    }}
                  />
                </div>
              </div>
              {/* Navigation Buttons */}
              {filteredImages.length > 1 && (
                <>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors duration-200"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </motion.button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GalleryOptimized; 