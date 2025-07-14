import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import ScrollToTop from './components/Layout/ScrollToTop';
import HashHandler from './components/Layout/HashHandler';

// Lazy load pages for better performance
const Home = React.lazy(() => import('./pages/Home'));
const Gallery = React.lazy(() => import('./pages/GalleryOptimized'));
const ServicesPage = React.lazy(() => import('./pages/ServicesPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <HashHandler />
        <div className="w-screen min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white overflow-x-hidden">
          <Header />
          <main className="pt-20"> {/* Reduced padding-top to match navbar height */}
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/services" element={<ServicesPage />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;