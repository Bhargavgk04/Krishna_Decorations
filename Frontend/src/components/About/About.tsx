import React from 'react';
import { motion } from 'framer-motion';
import { Award, Users, Clock, Heart, Sparkles } from 'lucide-react';

const About: React.FC = () => {
  const stats = [
    { icon: Users, number: '500+', label: 'Happy Clients' },
    { icon: Award, number: '50+', label: 'Awards Won' },
    { icon: Clock, number: '5+', label: 'Years Experience' },
    { icon: Heart, number: '98%', label: 'Satisfaction Rate' },
  ];

  return (
    <section id="about" className="py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Subtle background elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-10 right-10 w-32 h-32 bg-amber-400/5 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-10 left-10 w-24 h-24 bg-amber-400/10 rounded-full blur-xl"
      />

      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
        >
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute -top-4 -left-4 w-8 h-8 bg-amber-400/20 rounded-full flex items-center justify-center"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6"
              >
                About <motion.span 
                  className="text-amber-400"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  Krishna Events
                </motion.span>
              </motion.h2>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              We are passionate about creating magical moments that last a lifetime. With years of experience in event decoration, 
              we specialize in transforming ordinary spaces into extraordinary venues that capture the essence of your special occasion.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed"
            >
              From intimate gatherings to grand celebrations, our team of creative professionals works tirelessly to bring your vision to life, 
              ensuring every detail is perfect and every moment is memorable.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-wrap gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-amber-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-amber-500 transition-colors duration-300"
              >
                Learn More
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="border-2 border-amber-400 text-amber-400 px-6 py-3 rounded-lg font-semibold hover:bg-amber-400 hover:text-black transition-colors duration-300"
              >
                Contact Us
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    delay: 0.2 + index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ 
                    y: -5,
                    transition: { duration: 0.2 }
                  }}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex items-center justify-center w-12 h-12 bg-amber-400/20 rounded-full mb-4 group-hover:bg-amber-400/30 transition-colors duration-300"
                  >
                    <stat.icon className="h-6 w-6 text-amber-400" />
                  </motion.div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Simple decorative elements */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-6 -right-6 w-16 h-16 bg-amber-400/20 rounded-full backdrop-blur-sm flex items-center justify-center"
            >
              <Sparkles className="h-6 w-6 text-amber-400" />
            </motion.div>
            
            <motion.div
              animate={{
                y: [0, 10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-6 -left-6 w-12 h-12 bg-amber-400/30 rounded-full backdrop-blur-sm flex items-center justify-center"
            >
              <Award className="h-5 w-5 text-amber-400" />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;