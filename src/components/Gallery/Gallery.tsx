import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera, Sparkles, Play, Pause, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  slideshowImages, 
  portfolioImages, 
  fallbackSlideshowImages, 
  fallbackImages,
  getAllCategories
} from '../../utils/imageData';

const Gallery: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();

  // Use local images if available, otherwise fallback to placeholder images
  const slideshowData = slideshowImages.length > 0 ? slideshowImages : fallbackSlideshowImages;
  const portfolioData = portfolioImages.length > 0 ? portfolioImages : fallbackImages;

  // Get one image per category for the home page
  const getOneImagePerCategory = () => {
    const categories = getAllCategories();
    const categoryImages: typeof portfolioData = [];
    
    categories.forEach(category => {
      const categoryImage = portfolioData.find(img => img.category === category);
      if (categoryImage) {
        categoryImages.push(categoryImage);
      }
    });
    
    return categoryImages;
  };

  const categoryPreviewImages = getOneImagePerCategory();

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideshowData.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, slideshowData.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slideshowData.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slideshowData.length) % slideshowData.length);
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev !== null ? (prev + 1) % portfolioData.length : 0));
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev !== null ? (prev - 1 + portfolioData.length) % portfolioData.length : 0));
  };

  const handleViewAllGallery = () => {
    navigate('/gallery');
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/gallery?category=${category}`);
  };

  return (
    <section id="gallery" className="py-20 bg-white dark:bg-black relative overflow-hidden">
      {/* Subtle background elements */}
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

      <div className="w-full mx-auto px-4 lg:px-8">
        {/* Slideshow Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-center mb-12"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Featured <motion.span 
                className="text-amber-400"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                Showcase
              </motion.span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            >
              Discover our most stunning event decorations and creative setups
            </motion.p>
          </motion.div>

          {/* Slideshow Container */}
          <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0"
              >
                <img
                  src={slideshowData[currentSlide].src}
                  alt={slideshowData[currentSlide].alt}
                  className="w-full h-full object-contain bg-gray-100 dark:bg-gray-900"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop';
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white pointer-events-none">
                  <div className="bg-amber-400 text-black px-4 py-2 rounded-full text-sm font-medium inline-block mb-4">
                    {slideshowData[currentSlide].category}
                  </div>
                  <h3 className="text-3xl md:text-4xl font-bold mb-3">
                    {slideshowData[currentSlide].alt}
                  </h3>
                  <p className="text-lg text-gray-200 max-w-2xl">
                    {slideshowData[currentSlide].description}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-amber-400 hover:text-black transition-all duration-300 backdrop-blur-sm"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-amber-400 hover:text-black transition-all duration-300 backdrop-blur-sm"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </motion.button>

            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute top-4 right-4 bg-black/50 text-white p-3 rounded-full hover:bg-amber-400 hover:text-black transition-all duration-300 backdrop-blur-sm"
              aria-label={isPlaying ? "Pause slideshow" : "Play slideshow"}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </motion.button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {slideshowData.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'bg-amber-400' : 'bg-white/50'
                  }`}
                  whileHover={{ scale: 1.2 }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Category Preview Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-full mb-6"
          >
            <Camera className="h-8 w-8 text-amber-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Our <motion.span 
              className="text-amber-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Portfolio
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8"
          >
            Explore our stunning collection of event decorations organized by category
          </motion.p>

          {/* View All Gallery Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleViewAllGallery}
            className="inline-flex items-center gap-2 bg-amber-400 text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-amber-500 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            View All Gallery
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </motion.div>

        {/* Category Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full mb-12">
          {categoryPreviewImages.map((image, index) => (
            <motion.div
              key={`${image.category}-${index}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              whileHover={{ 
                scale: 1.03,
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="group relative overflow-hidden rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 w-full"
              onClick={() => handleCategoryClick(image.category)}
            >
              <motion.img
                src={image.src}
                alt={image.alt}
                className="w-full h-64 object-cover block"
                loading="lazy"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.4 }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop';
                }}
              />
              
              {/* Always Visible Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              
              {/* Always Visible Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="bg-amber-400 text-black px-3 py-1 rounded-full text-sm font-medium inline-block mb-2">
                  {image.category}
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {image.alt}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <span>Click to view all</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>

              {/* Hover Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileHover={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="absolute top-4 right-4 w-10 h-10 bg-amber-400/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <Sparkles className="h-5 w-5 text-white" />
              </motion.div>
            </motion.div>
          ))}
        </div>
        </div>

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
              <motion.img
                src={portfolioData[selectedImage].src}
                alt={portfolioData[selectedImage].alt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.pexels.com/photos/587741/pexels-photo-587741.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&fit=crop';
                }}
                />
                
                {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-full hover:bg-amber-400 hover:text-black transition-all duration-300 backdrop-blur-sm z-[10000]"
                  aria-label="Close gallery"
                >
                  <X className="h-6 w-6" />
              </motion.button>

                {/* Navigation Buttons */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                  onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-amber-400 hover:text-black transition-all duration-300 backdrop-blur-sm z-[10000]"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                  onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white p-3 rounded-full hover:bg-amber-400 hover:text-black transition-all duration-300 backdrop-blur-sm z-[10000]"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
              </motion.button>

                {/* Image Info */}
              <div className="absolute bottom-4 left-4 text-white max-w-md z-[10000]">
                <div className="bg-amber-400 text-black px-4 py-2 rounded-full text-sm font-medium inline-block mb-3">
                  {portfolioData[selectedImage].category}
                </div>
                <h3 className="text-xl font-semibold mb-2">{portfolioData[selectedImage].alt}</h3>
              </div>
            </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </section>
  );
};

export default Gallery;