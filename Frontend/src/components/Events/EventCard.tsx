import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, Users, Star } from 'lucide-react';

interface EventCardProps {
  title: string;
  description: string;
  image: string;
  features: string[];
  price: string;
  rating: number;
  index: number;
}

const EventCard: React.FC<EventCardProps> = ({
  title,
  description,
  image,
  features,
  price,
  rating,
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700"
    >
      {/* Image */}
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Rating */}
        <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          <Star className="h-4 w-4 text-golden fill-current" />
          <span className="text-white font-medium">{rating}</span>
        </div>
        
        {/* Price */}
        <div className="absolute bottom-4 left-4 bg-golden text-black px-4 py-2 rounded-full font-bold">
          {price}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-golden transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Features */}
        <div className="space-y-2 mb-6">
          {features.map((feature, featureIndex) => (
            <div key={featureIndex} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-golden rounded-full" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-golden text-black px-6 py-3 rounded-full font-semibold hover:bg-golden/90 transition-all duration-300 flex items-center justify-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Book Now</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 border-2 border-golden text-golden hover:bg-golden hover:text-black transition-all duration-300 rounded-full font-semibold flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Details</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default EventCard;