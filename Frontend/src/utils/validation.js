export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validateBookingForm = (formData) => {
  const errors = {};

  // Required fields validation
  if (!formData.customerName?.trim()) {
    errors.customerName = 'Customer name is required';
  } else if (formData.customerName.trim().length < 2) {
    errors.customerName = 'Customer name must be at least 2 characters';
  }

  if (!formData.email?.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!formData.phone?.trim()) {
    errors.phone = 'Phone number is required';
  } else if (!validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (!formData.eventType) {
    errors.eventType = 'Event type is required';
  }

  if (!formData.eventDate) {
    errors.eventDate = 'Event date is required';
  } else {
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      errors.eventDate = 'Event date cannot be in the past';
    }
  }

  if (!formData.venue?.trim()) {
    errors.venue = 'Venue is required';
  }

  if (!formData.guestCount) {
    errors.guestCount = 'Number of guests is required';
  } else if (parseInt(formData.guestCount) < 1) {
    errors.guestCount = 'Number of guests must be at least 1';
  } else if (parseInt(formData.guestCount) > 10000) {
    errors.guestCount = 'Number of guests cannot exceed 10,000';
  }

  if (!formData.budget) {
    errors.budget = 'Budget is required';
  } else if (parseFloat(formData.budget) < 0) {
    errors.budget = 'Budget cannot be negative';
  }

  return errors;
};

export const validateBookingUpdate = (formData) => {
  const errors = {};

  if (formData.customerName && formData.customerName.trim().length < 2) {
    errors.customerName = 'Customer name must be at least 2 characters';
  }

  if (formData.email && !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  if (formData.eventDate) {
    const eventDate = new Date(formData.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      errors.eventDate = 'Event date cannot be in the past';
    }
  }

  if (formData.guestCount) {
    const guestCount = parseInt(formData.guestCount);
    if (guestCount < 1) {
      errors.guestCount = 'Number of guests must be at least 1';
    } else if (guestCount > 10000) {
      errors.guestCount = 'Number of guests cannot exceed 10,000';
    }
  }

  if (formData.budget && parseFloat(formData.budget) < 0) {
    errors.budget = 'Budget cannot be negative';
  }

  return errors;
};

export const validateStatusUpdate = (status, notes) => {
  const errors = {};
  
  const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  
  if (!status) {
    errors.status = 'Status is required';
  } else if (!validStatuses.includes(status)) {
    errors.status = 'Invalid status value';
  }

  if (notes && notes.length > 1000) {
    errors.notes = 'Notes cannot exceed 1000 characters';
  }

  return errors;
};

export const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.reduce((acc, error) => {
      acc[error.path || error.param] = error.msg || error.message;
      return acc;
    }, {});
  }
  
  return errors || {};
};