import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import emailjs from '@emailjs/browser';
import { Send } from 'lucide-react';

const SERVICE_ID = 'service_2bojup8';
const TEMPLATE_ID = 'template_zg528cj';
const USER_ID = '7Sw7DzkKpBa_phxrH'; // Public key only

const ContactForm: React.FC = () => {
  const form = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);

    if (!form.current) return;

    emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form.current, USER_ID)
      .then(
        () => {
          setSuccess('Message sent successfully!');
          setLoading(false);
          form.current?.reset();
        },
        () => {
          setError('Failed to send message. Please try again.');
          setLoading(false);
        }
      );
  };

  return (
    <form
      ref={form}
      onSubmit={sendEmail}
      className="w-full h-full flex flex-col justify-center bg-white dark:bg-[#181E2A] rounded-3xl shadow-2xl p-8 md:p-12 space-y-6 transition-colors duration-300"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gray-100 dark:bg-[#232A3A] rounded-full p-3 transition-colors duration-300">
          <Send className="h-6 w-6 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
      </div>
      <input
        type="text"
        name="name"
        placeholder="Your Name"
        required
        className="w-full p-4 bg-gray-100 dark:bg-[#232A3A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all duration-300 shadow-sm border-none"
      />
      <input
        type="email"
        name="email"
        placeholder="Your Email"
        required
        className="w-full p-4 bg-gray-100 dark:bg-[#232A3A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all duration-300 shadow-sm border-none"
      />
      <textarea
        name="message"
        placeholder="Your Message"
        required
        className="w-full p-4 bg-gray-100 dark:bg-[#232A3A] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none transition-all duration-300 shadow-sm border-none min-h-[120px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-amber-400 text-black py-3 px-6 rounded-xl font-semibold text-lg hover:bg-amber-500 transition-colors duration-300 shadow-lg mt-2"
      >
        <Send className="h-5 w-5" />
        {loading ? 'Sending...' : 'Send Message'}
      </button>
      {success && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 dark:text-green-400 font-medium mt-2">{success}</motion.div>}
      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 dark:text-red-400 font-medium mt-2">{error}</motion.div>}
    </form>
  );
};

export default ContactForm; 