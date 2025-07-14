import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const services = [
    'Wedding Decorations',
    'Corporate Events',
    'Birthday Parties',
    'Engagement Ceremonies',
    'Mehendi Functions',
    'Haldi Ceremonies',
  ];

  const socialLinks = [
    { icon: Facebook, label: 'Facebook', href: '#' },
    { icon: Instagram, label: 'Instagram', href: '#' },
    { icon: Twitter, label: 'Twitter', href: '#' },
    { icon: Linkedin, label: 'LinkedIn', href: '#' },
  ];

  const contactInfo = [
    { icon: Phone, text: '+1 (555) 123-4567' },
    { icon: Mail, text: 'info@krishnaevents.com' },
    { icon: MapPin, text: '123 Event Street, City, State 12345' },
  ];

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Subtle background elements */}
      <motion.div
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-10 left-10 w-32 h-32 bg-amber-400/5 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-10 right-10 w-24 h-24 bg-amber-400/10 rounded-full blur-xl"
      />

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            <motion.h3 
              className="text-2xl font-bold text-amber-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Krishna Events
            </motion.h3>
            <p className="text-gray-400 leading-relaxed">
              Creating magical moments and unforgettable memories through exceptional event decorations and planning services.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <motion.button
                  key={social.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 bg-amber-400/20 rounded-full hover:bg-amber-400/30 transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5 text-amber-400" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            <motion.h3 
              className="text-xl font-semibold text-amber-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Services
            </motion.h3>
            <ul className="space-y-2 text-gray-400">
              {services.map((service, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ 
                    x: 5,
                    color: '#F59E0B',
                    transition: { duration: 0.2 }
                  }}
                  className="cursor-pointer transition-all duration-300 flex items-center space-x-2"
                >
                  <div className="w-1 h-1 bg-amber-400 rounded-full" />
                  <span>{service}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            <motion.h3 
              className="text-xl font-semibold text-amber-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Contact Info
            </motion.h3>
            <div className="space-y-3">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="flex items-center space-x-3"
                >
                  <div className="p-2 bg-amber-400/20 rounded-full">
                    <info.icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="text-gray-400 text-sm">{info.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4"
          >
            <motion.h3 
              className="text-xl font-semibold text-amber-400"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              Newsletter
            </motion.h3>
            <p className="text-gray-400 text-sm">
              Subscribe to our newsletter for the latest updates and special offers.
            </p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="px-4 py-2 bg-amber-400 text-black rounded-lg font-medium hover:bg-amber-500 transition-colors duration-300"
              >
                Subscribe
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="mt-12 pt-8 border-t border-amber-400/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.p 
              className="text-gray-400 text-sm flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <span>© {currentYear} Krishna Events. All rights reserved.</span>
              <Heart className="h-4 w-4 text-amber-400" />
            </motion.p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              {['Privacy Policy', 'Terms of Service'].map((link, index) => (
                <motion.a
                  key={index}
                  href="#"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.5 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ 
                    y: -2,
                    color: '#F59E0B',
                    transition: { duration: 0.2 }
                  }}
                  className="text-gray-400 hover:text-amber-400 transition-all duration-300 text-sm"
                >
                  {link}
                </motion.a>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;