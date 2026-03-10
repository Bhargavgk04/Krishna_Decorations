import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname changes (but not when hash changes)
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }
  }, [pathname, hash]);

  // Handle page refresh and initial load
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Store current scroll position if needed for future use
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };

    const handleLoad = () => {
      // Check if this is a page refresh or initial load
      if (performance.navigation.type === 1 || !sessionStorage.getItem('hasLoaded')) {
        // Page was refreshed or it's the first load, scroll to top
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
        sessionStorage.setItem('hasLoaded', 'true');
      }
    };

    // Handle initial page load
    if (!sessionStorage.getItem('hasLoaded')) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
      sessionStorage.setItem('hasLoaded', 'true');
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Additional effect to handle direct URL access with hash
  useEffect(() => {
    if (hash && pathname === '/') {
      // If there's a hash in the URL, let HashHandler deal with it
      // But ensure we start from the top first
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }, 50);
    }
  }, [hash, pathname]);

  return null;
};

export default ScrollToTop; 