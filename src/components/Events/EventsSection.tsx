import React from 'react';
import { motion } from 'framer-motion';
import EventCard from './EventCard';

const EventsSection: React.FC = () => {
  const events = [
    {
      title: 'Royal Wedding',
      description: 'Luxurious wedding decorations with premium flowers, elegant draping, and stunning lighting to create your perfect day.',
      image: 'https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      features: ['Premium Floral Arrangements', 'Elegant Draping', 'Ambient Lighting', 'Personalized Themes'],
      price: 'From $2,500',
      rating: 4.9,
    },
    {
      title: 'Mehendi Ceremony',
      description: 'Vibrant and colorful mehendi decorations with traditional elements, marigold flowers, and cultural aesthetics.',
      image: 'https://images.pexels.com/photos/1024994/pexels-photo-1024994.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      features: ['Marigold Decorations', 'Traditional Elements', 'Colorful Themes', 'Cultural Aesthetics'],
      price: 'From $800',
      rating: 4.8,
    },
    {
      title: 'Haldi Function',
      description: 'Bright and cheerful haldi decorations with yellow themes, sunflower arrangements, and festive ambiance.',
      image: 'https://images.pexels.com/photos/1024995/pexels-photo-1024995.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      features: ['Yellow Color Themes', 'Sunflower Arrangements', 'Festive Decor', 'Traditional Setup'],
      price: 'From $600',
      rating: 4.7,
    },
    {
      title: 'Engagement Party',
      description: 'Sophisticated engagement decorations with romantic lighting, floral backdrops, and elegant table settings.',
      image: 'https://images.pexels.com/photos/1024996/pexels-photo-1024996.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      features: ['Romantic Lighting', 'Floral Backdrops', 'Elegant Table Settings', 'Photo Booth Setup'],
      price: 'From $1,200',
      rating: 4.9,
    },
    {
      title: 'Birthday Celebration',
      description: 'Creative birthday decorations with customized themes, balloon arrangements, and entertainment setups.',
      image: 'https://images.pexels.com/photos/1024997/pexels-photo-1024997.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      features: ['Customized Themes', 'Balloon Arrangements', 'Entertainment Setup', 'Age-Appropriate Decor'],
      price: 'From $400',
      rating: 4.6,
    },
    {
      title: 'Corporate Events',
      description: 'Professional corporate event decorations with branded elements, sophisticated lighting, and modern aesthetics.',
      image: 'https://images.pexels.com/photos/1024998/pexels-photo-1024998.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop',
      features: ['Branded Elements', 'Modern Aesthetics', 'Professional Setup', 'Tech Integration'],
      price: 'From $1,800',
      rating: 4.8,
    },
  ];

  return (
    <section id="events" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Our Event <span className="text-golden">Specialties</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            From intimate gatherings to grand celebrations, we create magical experiences tailored to your vision and budget.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event, index) => (
            <EventCard
              key={index}
              {...event}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsSection;