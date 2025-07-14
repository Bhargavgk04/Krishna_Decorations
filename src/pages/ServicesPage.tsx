import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Palette, 
  Camera, 
  Lightbulb, 
  Users, 
  Clock, 
  Check, 
  ArrowRight, 
  Star,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

const ServicesPage: React.FC = () => {
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const services = [
    {
      icon: Sparkles,
      title: 'Event Planning',
      description: 'Complete event planning from concept to execution with attention to every detail.',
      features: ['Full Event Coordination', 'Timeline Management', 'Vendor Coordination', 'Budget Planning'],
      price: 'Starting from $500',
      duration: '2-6 months',
      includes: [
        'Initial consultation and concept development',
        'Detailed timeline and checklist creation',
        'Vendor sourcing and coordination',
        'Budget planning and cost management',
        'Day-of coordination and supervision',
        'Post-event cleanup and wrap-up'
      ],
      process: [
        'Consultation & Vision Discussion',
        'Concept Development & Planning',
        'Vendor Selection & Coordination',
        'Timeline Creation & Management',
        'Event Execution & Supervision'
      ]
    },
    {
      icon: Palette,
      title: 'Custom Themes',
      description: 'Personalized themes designed to match your vision and style preferences.',
      features: ['Theme Development', 'Color Coordination', 'Custom Props', 'Branding Integration'],
      price: 'Starting from $300',
      duration: '1-3 weeks',
      includes: [
        'Theme concept and mood board creation',
        'Custom color palette development',
        'Personalized prop design and creation',
        'Brand integration for corporate events',
        'Style guide and implementation plan',
        'Theme consistency across all elements'
      ],
      process: [
        'Style Consultation & Preferences',
        'Mood Board & Concept Creation',
        'Color Palette Development',
        'Custom Element Design',
        'Theme Implementation'
      ]
    },
    {
      icon: Camera,
      title: 'Photography Setup',
      description: 'Instagram-worthy setups and backdrops for memorable photo opportunities.',
      features: ['Photo Booth Setup', 'Backdrop Design', 'Lighting for Photos', 'Props & Accessories'],
      price: 'Starting from $200',
      duration: '1-2 days',
      includes: [
        'Custom backdrop design and setup',
        'Professional photo booth installation',
        'Optimal lighting arrangement',
        'Themed props and accessories',
        'Social media-ready compositions',
        'Setup and breakdown service'
      ],
      process: [
        'Photo Concept Discussion',
        'Backdrop Design & Creation',
        'Lighting Setup & Testing',
        'Props & Accessories Arrangement',
        'Final Setup & Quality Check'
      ]
    },
    {
      icon: Lightbulb,
      title: 'Lighting Design',
      description: 'Ambient and dramatic lighting to create the perfect atmosphere.',
      features: ['Mood Lighting', 'String Lights', 'Spotlights', 'Color-Changing LEDs'],
      price: 'Starting from $400',
      duration: '1-2 days',
      includes: [
        'Lighting design consultation',
        'Ambient mood lighting setup',
        'Decorative string light installation',
        'Spotlight positioning for key areas',
        'Color-changing LED systems',
        'Dimming and control systems'
      ],
      process: [
        'Venue Assessment & Planning',
        'Lighting Design Creation',
        'Equipment Setup & Installation',
        'Testing & Adjustments',
        'Final Lighting Optimization'
      ]
    },
    {
      icon: Users,
      title: 'Full Service Team',
      description: 'Professional team for setup, management, and breakdown of your event.',
      features: ['Setup & Breakdown', 'On-Site Coordination', 'Real-Time Support', 'Emergency Backup'],
      price: 'Starting from $800',
      duration: 'Event day + setup',
      includes: [
        'Professional setup team',
        'On-site event coordination',
        'Real-time problem solving',
        'Guest assistance and support',
        'Emergency backup plans',
        'Complete breakdown and cleanup'
      ],
      process: [
        'Team Assignment & Briefing',
        'Pre-Event Setup & Preparation',
        'Event Day Coordination',
        'Real-Time Support & Management',
        'Post-Event Breakdown'
      ]
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Round-the-clock support before, during, and after your event.',
      features: ['Pre-Event Planning', 'Day-of Coordination', 'Post-Event Cleanup', 'Emergency Support'],
      price: 'Included with packages',
      duration: 'Throughout project',
      includes: [
        '24/7 phone and email support',
        'Emergency response team',
        'Real-time problem resolution',
        'Continuous project updates',
        'Post-event follow-up',
        'Satisfaction guarantee'
      ],
      process: [
        'Initial Support Setup',
        'Ongoing Communication',
        'Emergency Response Protocol',
        'Real-Time Issue Resolution',
        'Post-Event Support'
      ]
    },
  ];

  const packages = [
    {
      name: 'Essential',
      price: '$1,200',
      description: 'Perfect for intimate gatherings and small celebrations',
      features: [
        'Basic theme development',
        'Standard lighting setup',
        'Photo booth with props',
        'Setup and breakdown',
        'Day-of coordination',
        'Email support'
      ],
      popular: false
    },
    {
      name: 'Premium',
      price: '$2,500',
      description: 'Comprehensive package for medium to large events',
      features: [
        'Custom theme design',
        'Advanced lighting system',
        'Professional photo setup',
        'Full service team',
        'Complete event planning',
        '24/7 support',
        'Emergency backup'
      ],
      popular: true
    },
    {
      name: 'Luxury',
      price: '$5,000',
      description: 'Ultimate experience for grand celebrations',
      features: [
        'Bespoke theme creation',
        'Premium lighting design',
        'Multiple photo stations',
        'Dedicated event manager',
        'Full planning service',
        'VIP support line',
        'Backup equipment',
        'Post-event cleanup'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white pt-20">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1024993/pexels-photo-1024993.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-10" />
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Our <span className="text-golden">Services</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive event decoration services to make your special day absolutely perfect
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 cursor-pointer"
                onClick={() => setSelectedService(selectedService === index ? null : index)}
              >
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-golden/20 rounded-full mb-4 group-hover:bg-golden/30 transition-colors duration-300">
                    <service.icon className="h-8 w-8 text-golden" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-golden transition-colors duration-300">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {service.description}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-golden font-semibold">{service.price}</span>
                    <span className="text-sm text-gray-500">{service.duration}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-golden rounded-full flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Expanded Content */}
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: selectedService === index ? 'auto' : 0,
                    opacity: selectedService === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-golden mb-3">What's Included:</h4>
                    <div className="space-y-2 mb-6">
                      {service.includes.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-start space-x-2">
                          <Check className="h-4 w-4 text-golden mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>

                    <h4 className="font-semibold text-golden mb-3">Our Process:</h4>
                    <div className="space-y-2">
                      {service.process.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-golden/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-golden">{stepIndex + 1}</span>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full mt-6 bg-golden text-black px-6 py-3 rounded-full font-semibold hover:bg-golden/90 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>Get Quote</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Service <span className="text-golden">Packages</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the perfect package for your event needs and budget
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-white dark:bg-black rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border-2 ${
                  pkg.popular 
                    ? 'border-golden scale-105' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-golden/50'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-golden text-black px-6 py-2 rounded-full font-semibold text-sm flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {pkg.name}
                  </h3>
                  <div className="text-4xl font-bold text-golden mb-4">{pkg.price}</div>
                  <p className="text-gray-600 dark:text-gray-300">{pkg.description}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {pkg.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="h-5 w-5 text-golden flex-shrink-0" />
                      <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-full py-4 rounded-full font-semibold transition-all duration-300 ${
                    pkg.popular
                      ? 'bg-golden text-black hover:bg-golden/90'
                      : 'border-2 border-golden text-golden hover:bg-golden hover:text-black'
                  }`}
                >
                  Choose {pkg.name}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-golden/10 to-golden/5 dark:from-golden/5 dark:to-golden/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Get <span className="text-golden">Started</span>?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Contact us today for a free consultation and let's bring your vision to life
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-golden text-black px-8 py-4 rounded-full font-semibold text-lg hover:bg-golden/90 transition-all duration-300 flex items-center space-x-2"
              >
                <Calendar className="h-5 w-5" />
                <span>Book Consultation</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border-2 border-golden text-golden px-8 py-4 rounded-full font-semibold text-lg hover:bg-golden hover:text-black transition-all duration-300 flex items-center space-x-2"
              >
                <Phone className="h-5 w-5" />
                <span>Call Now</span>
              </motion.button>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8 text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-golden" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-golden" />
                <span>info@Krishna Events.com</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;