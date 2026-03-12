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
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'krishnaevents0123@gmail.com' });

    if (existingAdmin) {
      existingAdmin.password = 'Krishna@Decor@1234';
      await existingAdmin.save();
      // eslint-disable-next-line no-console
      console.log('Admin user already exists. Password has been updated.');
      console.log('Email: krishnaevents0123@gmail.com');
      process.exit(0);
    }

    // Create admin user
    const admin = new Admin({
      name: 'Admin User',
      email: 'krishnaevents0123@gmail.com',
      password: 'Krishna@Decor@1234',
      phone: '+911234567890',
      role: 'super_admin', // Set as super_admin to have full access
      permissions: [
        'view_dashboard',
        'manage_bookings',
        'view_statistics',
        'send_notifications',
        'manage_admins',
        'manage_users',
        'view_reports',
        'manage_settings'
      ],
      isActive: true,
      department: 'management'
    });

    await admin.save();
    // eslint-disable-next-line no-console
    console.log('Admin user created successfully');
    // eslint-disable-next-line no-console
    console.log('Email: krishnaevents0123@gmail.com');
    // eslint-disable-next-line no-console
    console.log('Password: Krishna@Decor@1234');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

createAdmin();