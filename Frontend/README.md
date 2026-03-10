# Krishna Decorations - Frontend

A modern React application for event booking and decoration management.

## 🚀 Features

- **User Authentication**: Secure login and registration system
- **Event Booking**: Comprehensive booking system for various events
- **Responsive Design**: Mobile-first design with dark/light mode support
- **Real-time Updates**: Dynamic status updates and notifications
- **Image Gallery**: Beautiful gallery showcasing decoration work
- **Admin Panel**: Complete admin interface for booking management

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Router** for navigation
- **Axios** for API communication
- **Lucide React** for icons

## 📦 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

## 🏃‍♂️ Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🚀 Deployment

This project is configured for deployment on Netlify with backend on Render.

### Quick Deployment Steps:

1. **Deploy Backend on Render**:
   - Create a Web Service on Render
   - Connect your GitHub repo
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add required environment variables

2. **Deploy Frontend on Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variable: `VITE_API_URL=https://your-render-backend-url.onrender.com/api`

📖 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.**

### Environment Variables for Netlify

Set these in Netlify's dashboard under Site settings > Environment variables:

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_APP_NAME=Krishna Decorations
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components
│   ├── Auth/           # Authentication components
│   └── ...
├── pages/              # Page components
├── services/           # API services
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── styles/             # Global styles
```

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable styled components
- **Dark Mode**: Built-in dark/light mode support
- **Responsive**: Mobile-first responsive design

## 🔧 Configuration

- **Vite Config**: `vite.config.ts`
- **Tailwind Config**: `tailwind.config.js`
- **TypeScript Config**: `tsconfig.json`
- **Netlify Config**: `netlify.toml`

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for Krishna Decorations.