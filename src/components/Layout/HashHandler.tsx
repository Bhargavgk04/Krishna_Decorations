import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const HashHandler: React.FC = () => {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    // Handle hash navigation on page load
    if (hash && pathname === '/') {
      // Wait for the page to fully load and render, then scroll to the section
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          // Calculate offset for fixed navbar (assuming navbar height is ~80px)
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 1000); // Increased delay to ensure all components are rendered

      return () => clearTimeout(timer);
    }
  }, [hash, pathname]);

  // Handle direct URL with hash (e.g., /#about)
  useEffect(() => {
    if (hash && pathname === '/') {
      // For direct navigation to hash, ensure we're at the top first
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });

      // Then scroll to the section after a brief delay
      const timer = setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [hash, pathname]);

  // Additional effect to handle cases where elements might not be immediately available
  useEffect(() => {
    if (hash && pathname === '/') {
      const checkAndScroll = () => {
        const element = document.querySelector(hash);
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - navbarHeight;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        } else {
          // If element is not found, try again after a short delay
          setTimeout(checkAndScroll, 100);
        }
      };

      // Start checking after a delay
      setTimeout(checkAndScroll, 500);
    }
  }, [hash, pathname]);

  return null;
};

export default HashHandler; 