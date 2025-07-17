import React from 'react';
import { motion } from 'framer-motion';
import { Send, Phone, Mail, MapPin, Clock } from 'lucide-react';
import ContactForm from '../ContactForm';

const Contact: React.FC = () => {
  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone',
      details: '+1 (555) 123-4567',
      description: 'Call us anytime'
    },
    {
      icon: Mail,
      title: 'Email',
      details: 'info@krishnaevents.com',
      description: 'Send us an email'
    },
    {
      icon: MapPin,
      title: 'Address',
      details: '123 Event Street, City, State 12345',
      description: 'Visit our office'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      details: 'Mon - Fri: 9AM - 6PM',
      description: 'We\'re here to help'
    },
  ];

  return (
    <section id="contact" className="py-20 bg-white dark:bg-black relative overflow-hidden">
      {/* Subtle background elements */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="absolute top-10 left-10 w-32 h-32 bg-amber-400/5 rounded-full blur-xl"
      />
      <motion.div
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-10 right-10 w-24 h-24 bg-amber-400/10 rounded-full blur-xl"
      />
      <div className="container mx-auto px-4">
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
            <Send className="h-8 w-8 text-amber-400" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Get In <motion.span className="text-amber-400" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              Touch
            </motion.span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
          >
            Ready to create your dream event? Contact us today for a free consultation.
          </motion.p>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-8"
          >
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-3xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Let's Create Something Amazing Together
            </motion.h3>
            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  whileHover={{ x: 5 }}
                  className="flex items-start space-x-4 group cursor-pointer"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.2 }}
                    className="bg-amber-400/20 p-3 rounded-full group-hover:bg-amber-400/30 transition-colors duration-300"
                  >
                    <info.icon className="h-6 w-6 text-amber-400" />
                  </motion.div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {info.title}
                    </h4>
                    <p className="text-amber-400 font-medium mb-1">
                      {info.details}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {info.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Social Media Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="pt-6"
            >
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                Follow Us
              </h4>
              <div className="flex space-x-4">
                {['Facebook', 'Instagram', 'Twitter', 'LinkedIn'].map((platform) => (
                  <motion.button
                    key={platform}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="w-10 h-10 bg-amber-400/20 rounded-full flex items-center justify-center hover:bg-amber-400/30 transition-colors duration-300"
                  >
                    <span className="text-amber-400 font-medium text-sm">
                      {platform.charAt(0)}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
          {/* Contact Form (EmailJS) */}
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 relative overflow-hidden"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute top-4 right-4 w-16 h-16 bg-amber-400/5 rounded-full blur-xl"
            />
            {/* EmailJS Contact Form */}
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Contact;