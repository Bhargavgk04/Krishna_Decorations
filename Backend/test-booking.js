const http = require('http');
const crypto = require('crypto');

const randomString = crypto.randomBytes(4).toString('hex');
const testEmail = `testuser_${randomString}@example.com`;
const testPassword = 'Password@123';

const registerData = JSON.stringify({
  name: 'Test Setup User',
  email: testEmail,
  password: testPassword
});

const registerOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

console.log(`Registering user ${testEmail}...`);

const reqReg = http.request(registerOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Register response:', data);
    login();
  });
});

reqReg.on('error', error => console.error('Register error:', error));
reqReg.write(registerData);
reqReg.end();

function login() {

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const loginData = JSON.stringify({
  email: testEmail,
  password: testPassword
});

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(data);
    
    if (response.success && response.data && response.data.token) {
      console.log('Login successful. Token obtained.');
      createBooking(response.data.token);
    } else {
      console.error('Login failed:', response);
      console.log('Please make sure to create a test user or update the credentials in this script.');
    }
  });
});

req.on('error', (error) => {
  console.error('Error during login:', error);
});

req.write(loginData);
req.end();
}


function createBooking(token) {
  const bookingData = JSON.stringify({
    customerName: 'Test Booking User',
    email: 'testbooking@example.com',
    phone: '+1234567890',
    eventType: 'wedding',
    eventDate: '2027-12-01',
    eventTime: '18:00',
    venue: {
      name: 'Test Venue',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    },
    guestCount: 150,
    budget: 5000,
    requirements: 'Vegetarian catering only',
    additionalServices: ['Photography', 'Catering']
  });

  const bookingOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/bookings',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const bookingReq = http.request(bookingOptions, (res) => {
    let rawData = '';

    res.on('data', (chunk) => {
      rawData += chunk;
    });

    res.on('end', () => {
      const parsedData = JSON.parse(rawData);
      console.log('Booking Creation Response:', JSON.stringify(parsedData, null, 2));
      
      if (parsedData.success) {
        console.log('✅ Booking created successfully!');
      } else {
        console.log('❌ Failed to create booking.');
      }
    });
  });

  bookingReq.on('error', (error) => {
    console.error('Error creating booking:', error);
  });

  bookingReq.write(bookingData);
  bookingReq.end();
}
