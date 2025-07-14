import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Palette, Camera, Lightbulb, Users, Clock, ArrowRight } from 'lucide-react';

const Services: React.FC = () => {
  const services = [
    {
      icon: Sparkles,
      title: 'Event Planning',
      description: 'Complete event planning from concept to execution with attention to every detail.',
      features: ['Full Event Coordination', 'Timeline Management', 'Vendor Coordination', 'Budget Planning'],
    },
    {
      icon: Palette,
      title: 'Custom Themes',
      description: 'Personalized themes designed to match your vision and style preferences.',
      features: ['Theme Development', 'Color Coordination', 'Custom Props', 'Branding Integration'],
    },
    {
      icon: Camera,
      title: 'Photography Setup',
      description: 'Instagram-worthy setups and backdrops for memorable photo opportunities.',
      features: ['Photo Booth Setup', 'Backdrop Design', 'Lighting for Photos', 'Props & Accessories'],
    },
    {
      icon: Lightbulb,
      title: 'Lighting Design',
      description: 'Ambient and dramatic lighting to create the perfect atmosphere.',
      features: ['Mood Lighting', 'String Lights', 'Spotlights', 'Color-Changing LEDs'],
    },
    {
      icon: Users,
      title: 'Full Service Team',
      description: 'Professional team for setup, management, and breakdown of your event.',
      features: ['Setup & Breakdown', 'On-Site Coordination', 'Real-Time Support', 'Emergency Backup'],
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock support before, during, and after your event.',
      features: ['Pre-Event Planning', 'Day-of Coordination', 'Post-Event Cleanup', 'Emergency Support'],
    },
  ];

  return (
    <section id="services" className="py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-20 left-20 w-40 h-40 bg-amber-400/5 rounded-full blur-2xl"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-20 right-20 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"
      />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-full mb-6"
          >
            <Sparkles className="h-8 w-8 text-amber-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Our <motion.span 
              className="text-amber-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Services
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Comprehensive event decoration services to make your special day absolutely perfect.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-6">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center justify-center w-16 h-16 bg-amber-400/20 rounded-full mb-4 group-hover:bg-amber-400/30 transition-colors duration-300"
                >
                  <service.icon className="h-8 w-8 text-amber-400" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-amber-400 transition-colors duration-300">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {service.description}
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                    <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="w-full mt-6 bg-amber-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors duration-300 flex items-center justify-center space-x-2"
              >
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;