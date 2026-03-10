require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@krishnadecorations.com' });

    if (existingAdmin) {
      // eslint-disable-next-line no-console
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      name: 'Admin User',
      email: 'admin@krishnadecorations.com',
      password: 'admin123',
      phone: '+91 12345 67890',
      role: 'super_admin', // Set as super_admin to have full access
      permissions: ['all'],
      isActive: true,
      department: 'management'
    });

    await admin.save();
    // eslint-disable-next-line no-console
    console.log('Admin user created successfully');
    // eslint-disable-next-line no-console
    console.log('Email: admin@krishnadecorations.com');
    // eslint-disable-next-line no-console
    console.log('Password: admin123');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();