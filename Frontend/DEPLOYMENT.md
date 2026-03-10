# Deployment Guide

## 🚀 Netlify Deployment Instructions

### Step 1: Deploy Backend on Render

1. Go to [Render.com](https://render.com) and create an account
2. Connect your GitHub repository
3. Create a new **Web Service**
4. Select your backend repository/folder
5. Configure the service:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` or `node src/server.js`
   - **Environment**: Node.js
   - **Region**: Choose closest to your users
6. Add environment variables in Render dashboard:
   - `NODE_ENV=production`
   - `MONGODB_URI=your_mongodb_connection_string`
   - `JWT_SECRET=your_jwt_secret`
   - `CLOUDINARY_CLOUD_NAME=your_cloudinary_name`
   - `CLOUDINARY_API_KEY=your_cloudinary_key`
   - `CLOUDINARY_API_SECRET=your_cloudinary_secret`
   - Add any other required environment variables
7. Deploy and note your Render URL (e.g., `https://your-app-name.onrender.com`)

### Step 2: Deploy Frontend on Netlify

1. Go to [Netlify.com](https://netlify.com) and create an account
2. Connect your GitHub repository
3. Create a new site from Git
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Base directory**: `Frontend` (if your frontend is in a subfolder)

### Step 3: Configure Environment Variables in Netlify

Go to **Site settings > Environment variables** and add:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_APP_NAME=Krishna Decorations
VITE_APP_VERSION=1.0.0
```

**Important**: Replace `https://your-backend-url.onrender.com` with your actual Render backend URL.

### Step 4: Deploy

1. Push your code to GitHub
2. Netlify will automatically build and deploy
3. Your site will be available at `https://your-site-name.netlify.app`

## 🔧 Environment Variables Reference

### Required for Netlify (Frontend)
- `VITE_API_URL`: Your backend API URL from Render
- `VITE_APP_NAME`: Application name
- `VITE_APP_VERSION`: Application version

### Required for Render (Backend)
- `NODE_ENV`: Set to `production`
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `EMAIL_SERVICE_ENABLED`: Set to `true` if using email
- `WHATSAPP_SERVICE_ENABLED`: Set to `true` if using WhatsApp

## 🌐 Custom Domain (Optional)

### For Netlify:
1. Go to **Site settings > Domain management**
2. Add your custom domain
3. Configure DNS records as instructed

### For Render:
1. Go to your service settings
2. Add custom domain
3. Configure DNS records as instructed

## 🔍 Troubleshooting

### Common Issues:

1. **Build fails on Netlify**:
   - Check that `VITE_API_URL` is set correctly
   - Ensure all dependencies are in `package.json`
   - Check build logs for specific errors

2. **API calls fail**:
   - Verify `VITE_API_URL` points to your Render backend
   - Check CORS settings in backend
   - Ensure backend is running and accessible

3. **Images not loading**:
   - Check Cloudinary configuration
   - Verify image paths are correct
   - Check Content Security Policy headers

4. **Authentication issues**:
   - Verify JWT_SECRET is set in backend
   - Check token expiration settings
   - Ensure CORS allows credentials

## 📱 Testing

After deployment:
1. Test user registration and login
2. Test booking creation
3. Test image uploads
4. Test admin functionality
5. Test on mobile devices
6. Check all pages load correctly

## 🔄 Continuous Deployment

Both Netlify and Render support automatic deployments:
- **Netlify**: Automatically deploys when you push to your main branch
- **Render**: Automatically deploys when you push to your main branch

## 📊 Monitoring

- **Netlify**: Check deploy logs and analytics in dashboard
- **Render**: Monitor service health and logs in dashboard
- Set up error tracking (e.g., Sentry) for production monitoring