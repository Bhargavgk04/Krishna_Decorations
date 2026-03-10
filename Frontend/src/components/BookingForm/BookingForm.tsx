import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  DollarSign, 
  Upload, 
  X, 
  Check,
  Heart,
  Cake,
  Building,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import { bookingService, CreateBookingData } from '../../services/bookingService';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';
import LoadingSpinner from '../common/LoadingSpinner';

interface BookingFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const BookingForm: React.FC<BookingFormProps> = ({ onSuccess, onClose }) => {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<CreateBookingData>({
    eventType: '',
    eventDate: '',
    eventTime: '',
    venue: {
      name: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
    guestCount: 50,
    budget: {
      min: 10000,
      max: 50000,
    },
    services: [],
    specialRequests: '',
    referenceImages: [],
  });

  const eventTypes = [
    { value: 'wedding', label: 'Wedding', icon: Heart, color: 'from-pink-400 to-red-400' },
    { value: 'birthday', label: 'Birthday', icon: Cake, color: 'from-yellow-400 to-orange-400' },
    { value: 'anniversary', label: 'Anniversary', icon: Star, color: 'from-purple-400 to-pink-400' },
    { value: 'corporate', label: 'Corporate', icon: Building, color: 'from-blue-400 to-cyan-400' },
    { value: 'other', label: 'Other', icon: Star, color: 'from-green-400 to-teal-400' },
  ];

  const availableServices = [
    'Stage Decoration',
    'Floral Arrangements',
    'Lighting Setup',
    'Sound System',
    'Photography',
    'Catering Setup',
    'Balloon Decoration',
    'Theme Decoration',
    'Mandap Decoration',
    'Car Decoration',
    'Entrance Decoration',
    'Table Setup',
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof CreateBookingData],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const newPreviewUrls: string[] = [];

    for (const file of files) {
      const validation = uploadService.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
        const previewUrl = await uploadService.createImagePreview(file);
        newPreviewUrls.push(previewUrl);
      }
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    setFormData(prev => ({
      ...prev,
      referenceImages: [...(prev.referenceImages || []), ...validFiles],
    }));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      referenceImages: prev.referenceImages?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      if (window.showToast) {
        window.showToast('warning', 'Authentication Required', 'Please login to submit a booking request');
      } else {
        alert('Please login to submit a booking request');
      }
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const response = await bookingService.createBooking(formData);
      
      if (response.success) {
        if (window.showToast) {
          window.showToast('success', 'Booking Submitted!', 'We will contact you soon to confirm your booking.');
        } else {
          alert('Booking request submitted successfully! We will contact you soon.');
        }
        onSuccess?.();
      } else {
        throw new Error(response.error?.message || 'Failed to submit booking');
      }
    } catch (error: any) {
      console.error('Booking submission error:', error);
      if (window.showToast) {
        window.showToast('error', 'Submission Failed', error.message || 'Failed to submit booking request');
      } else {
        alert(error.message || 'Failed to submit booking request');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.eventType && formData.eventDate && formData.eventTime);
      case 2:
        return !!(formData.venue.name && formData.venue.address && formData.venue.city);
      case 3:
        return formData.services.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Event Details
            </h3>
            
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Event Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {eventTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <motion.button
                      key={type.value}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleInputChange('eventType', type.value)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        formData.eventType === type.value
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                      }`}
                    >
                      <div className={`w-8 h-8 mx-auto mb-2 rounded-full bg-gradient-to-r ${type.color} flex items-center justify-center`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Event Date
                </label>
                <input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange('eventDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Event Time
                </label>
                <input
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => handleInputChange('eventTime', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Venue Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Venue Name
              </label>
              <input
                type="text"
                value={formData.venue.name}
                onChange={(e) => handleInputChange('venue.name', e.target.value)}
                placeholder="e.g., Grand Ballroom, Home, Garden"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Address
              </label>
              <textarea
                value={formData.venue.address}
                onChange={(e) => handleInputChange('venue.address', e.target.value)}
                placeholder="Full address of the venue"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.venue.city}
                  onChange={(e) => handleInputChange('venue.city', e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  value={formData.venue.state}
                  onChange={(e) => handleInputChange('venue.state', e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pincode
                </label>
                <input
                  type="text"
                  value={formData.venue.pincode}
                  onChange={(e) => handleInputChange('venue.pincode', e.target.value)}
                  placeholder="Pincode"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Expected Guests
                </label>
                <input
                  type="number"
                  value={formData.guestCount}
                  onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value))}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Budget Range (₹)
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={formData.budget.min}
                    onChange={(e) => handleInputChange('budget.min', parseInt(e.target.value))}
                    placeholder="Min"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <span className="flex items-center text-gray-500">to</span>
                  <input
                    type="number"
                    value={formData.budget.max}
                    onChange={(e) => handleInputChange('budget.max', parseInt(e.target.value))}
                    placeholder="Max"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Services Required
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableServices.map((service) => (
                <motion.button
                  key={service}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleServiceToggle(service)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    formData.services.includes(service)
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {service}
                    </span>
                    {formData.services.includes(service) && (
                      <Check className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder="Any specific requirements, themes, or special requests..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Reference Images (Optional)
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Upload reference images to help us understand your vision
              </label>
              
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors duration-300"
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload images or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG, WEBP up to 5MB each (max 5 images)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Image Previews */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {previewUrls.map((url, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative group"
                  >
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mt-8">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Booking Summary
              </h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Event:</span> {eventTypes.find(t => t.value === formData.eventType)?.label}</p>
                <p><span className="font-medium">Date:</span> {formData.eventDate} at {formData.eventTime}</p>
                <p><span className="font-medium">Venue:</span> {formData.venue.name}, {formData.venue.city}</p>
                <p><span className="font-medium">Guests:</span> {formData.guestCount}</p>
                <p><span className="font-medium">Budget:</span> ₹{formData.budget.min.toLocaleString()} - ₹{formData.budget.max.toLocaleString()}</p>
                <p><span className="font-medium">Services:</span> {formData.services.join(', ')}</p>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                step <= currentStep
                  ? 'border-amber-400 bg-amber-400 text-white'
                  : 'border-gray-300 text-gray-400'
              }`}
            >
              {step < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-semibold">{step}</span>
              )}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full"
            initial={{ width: '25%' }}
            animate={{ width: `${(currentStep / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className={currentStep === 1 ? 'opacity-50 cursor-not-allowed' : ''}
        >
          Previous
        </Button>

        <div className="flex space-x-4">
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          )}
          
          {currentStep < 4 ? (
            <Button
              variant="primary"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className={!isStepValid(currentStep) ? 'opacity-50 cursor-not-allowed' : ''}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !isAuthenticated}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Booking'}
            </Button>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {isSubmitting && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Please <a href="/login" className="font-medium underline">login</a> to submit a booking request.
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingForm;