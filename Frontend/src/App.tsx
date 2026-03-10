import React, { Suspense, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LoginPage from "./pages/Login";
import Admin from "./pages/Admin";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ScrollToTop from "./components/Layout/ScrollToTop";
import HashHandler from "./components/Layout/HashHandler";
import Preloader from "./components/common/Preloader";
import ErrorBoundary from "./components/common/ErrorBoundary";

import { ToastContainer } from "./components/common/Toast";
import { useToast } from "./hooks/useToast";

// Lazy load pages for better performance
const Home = React.lazy(() => import("./pages/Home"));
const Gallery = React.lazy(() => import("./pages/GalleryOptimized"));
const Booking = React.lazy(() => import("./pages/Booking"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Register = React.lazy(() => import("./pages/Register"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Enhanced Loading component with professional animation
const PageLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black flex items-center justify-center relative overflow-hidden"
  >
    {/* Animated background elements */}
    <div className="absolute inset-0">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-amber-400/20 to-orange-500/20 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          rotate: [360, 180, 0],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-xl"
      />
    </div>

    <div className="text-center relative z-10">
      {/* Enhanced loading spinner */}
      <div className="relative mb-8">
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-20 h-20 border-4 border-amber-400/20 border-t-amber-400 rounded-full mx-auto relative"
        />
        <motion.div
          animate={{
            rotate: -360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 3, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
          className="absolute inset-2 border-2 border-orange-400/30 border-b-orange-400 rounded-full"
        />

        {/* Center logo */}
        <motion.div
          animate={{
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">K</span>
          </div>
        </motion.div>
      </div>

      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2"
      >
        Krishna Events
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-600 dark:text-gray-400 text-lg"
      >
        Setting up your experience...
      </motion.p>

      {/* Loading progress bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="mt-6 h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full mx-auto max-w-xs"
      />
    </div>
  </motion.div>
);

// Enhanced Page transition wrapper with more sophisticated animations
const PageTransition = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{
      opacity: 0,
      y: 20,
      scale: 0.98,
    }}
    animate={{
      opacity: 1,
      y: 0,
      scale: 1,
    }}
    exit={{
      opacity: 0,
      y: -20,
      scale: 1.02,
    }}
    transition={{
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    }}
  >
    {children}
  </motion.div>
);

function App() {
  const [showPreloader, setShowPreloader] = useState(true);
  const [appReady, setAppReady] = useState(false);

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
    setAppReady(true);
  };

  // Show preloader on first visit
  useEffect(() => {
    const hasVisited = sessionStorage.getItem("hasVisited");
    if (hasVisited) {
      setShowPreloader(false);
      setAppReady(true);
    } else {
      sessionStorage.setItem("hasVisited", "true");
    }
  }, []);

  if (showPreloader) {
    return <Preloader onComplete={handlePreloaderComplete} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppContent appReady={appReady} />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Separate component to use hooks inside providers
const AppContent: React.FC<{ appReady: boolean }> = ({ appReady }) => {
  const { toasts, showToast, removeToast } = useToast();

  // Make toast function globally available
  useEffect(() => {
    (window as unknown as { showToast: typeof showToast }).showToast =
      showToast;
  }, [showToast]);

  return (
    <Router>
      <ScrollToTop />
      <HashHandler />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: appReady ? 1 : 0 }}
        transition={{ duration: 0.8 }}
        className="w-screen min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-black dark:via-gray-900 dark:to-black text-gray-900 dark:text-white overflow-x-hidden relative"
      >
        {/* Enhanced background pattern */}
        <div className="fixed inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #fbbf24 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #f97316 0%, transparent 50%)`,
              backgroundSize: "400px 400px",
              animation: "float 20s ease-in-out infinite",
            }}
          />
        </div>

        <Header />
        <main className="pt-20 lg:pt-28 xl:pt-32 relative">{/* Adjusted padding to align hero with navbar */}
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <PageTransition>
                      <Home />
                    </PageTransition>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PageTransition>
                      <LoginPage />
                    </PageTransition>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PageTransition>
                      <Register />
                    </PageTransition>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PageTransition>
                      <ForgotPassword />
                    </PageTransition>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PageTransition>
                      <Profile />
                    </PageTransition>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <PageTransition>
                      <Admin />
                    </PageTransition>
                  }
                />
                <Route
                  path="/gallery"
                  element={
                    <PageTransition>
                      <Gallery />
                    </PageTransition>
                  }
                />
                <Route
                  path="/booking"
                  element={
                    <PageTransition>
                      <Booking />
                    </PageTransition>
                  }
                />
                <Route
                  path="*"
                  element={
                    <PageTransition>
                      <NotFound />
                    </PageTransition>
                  }
                />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>
        <Footer />

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </motion.div>
    </Router>
  );
};

export default App;
