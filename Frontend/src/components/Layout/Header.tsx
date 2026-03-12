import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Phone, Mail, MapPin, User, LogOut, UserCircle, LayoutDashboard, Clock } from 'lucide-react';

import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  type NavItem,
} from '../ui/resizable-navbar';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Contact', href: '/#contact' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  useTheme();

  const location = useLocation();
  const navigate = useNavigate();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Handle nav link active state
  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    if (href.startsWith('/#')) {
      return location.pathname === '/' && location.hash === href.substring(1);
    }
    return location.pathname === href;
  };

  // Navigation handler
  const handleNavigation = (href: string) => {
    if (href.startsWith('/#')) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const element = document.querySelector(href.substring(1));
          if (element) {
            const navbarHeight = 80;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - navbarHeight;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        }, 120);
      } else {
        const element = document.querySelector(href.substring(1));
        if (element) {
          const navbarHeight = 80;
          const elementPosition = element.getBoundingClientRect().top + window.scrollY;
          const offsetPosition = elementPosition - navbarHeight;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
  };

  const headerBackground = scrolled
    ? 'bg-[rgba(9,17,28,0.92)] border-[rgba(148,163,184,0.18)] shadow-lg shadow-[rgba(255,136,0,0.18)]'
    : 'bg-[rgba(6,12,20,0.7)] border-[rgba(26,35,58,0.45)] shadow-none';

  const navItems: NavItem[] = navLinks.map((item) => ({
    name: item.name,
    link: item.href,
    active: isActive(item.href),
    onClick: () => handleNavigation(item.href),
  }));

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${headerBackground}`}
    >
      <Navbar>
        <NavBody className="bg-transparent">
          <NavbarLogo
            onClick={() => {
              handleNavigation('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="aria-[current=true]:text-brand"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-brand-gradient shadow-brand flex items-center justify-center text-white font-semibold">
                  K
                </div>
                <div className="text-left">
                  <span
                    className="block text-lg font-semibold leading-tight text-white transition-colors group-hover:text-brand"
                  >
                    Krishna Events
                  </span>
                  <span className="block text-xs font-medium text-brand">
                    Premium Decorations
                  </span>
                </div>
              </div>
            </motion.div>
          </NavbarLogo>

          <NavItems items={navItems} />

          <div className="flex items-center gap-3">
            <NavbarButton onClick={() => handleNavigation('/booking')} className="hidden md:inline-flex">
              Book Now
            </NavbarButton>

            {isAuthenticated ? (
              <div className="hidden lg:flex items-center gap-2">
                {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
                  <NavbarButton
                    variant="ghost"
                    onClick={() => handleNavigation('/admin-dashboard')}
                    className="!px-3 !py-2 text-amber-500 hover:text-amber-400"
                  >
                    <LayoutDashboard className="w-5 h-5 mr-2" />
                    Dashboard
                  </NavbarButton>
                )}
                <NavbarButton
                  variant="ghost"
                  onClick={() => handleNavigation('/profile')}
                  className="!px-3 !py-2"
                >
                  <UserCircle className="w-5 h-5 mr-2" />
                  Profile
                </NavbarButton>
                <NavbarButton
                  variant="secondary"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="!px-3 !py-2"
                >
                  <LogOut className="w-5 h-5" />
                </NavbarButton>
              </div>
            ) : (
              <NavbarButton
                variant="secondary"
                onClick={() => handleNavigation('/login')}
                className="hidden lg:inline-flex"
              >
                <User className="w-4 h-4 mr-2" />
                Login
              </NavbarButton>
            )}

            <MobileNav>
              <MobileNavHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-brand-gradient shadow-brand flex items-center justify-center text-white font-semibold">
                    K
                  </div>
                  <span className="text-sm font-semibold text-white">
                    Krishna Events
                  </span>
                </div>
                <MobileNavToggle
                  isOpen={isMenuOpen}
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  aria-label="Toggle navigation menu"
                />
              </MobileNavHeader>

              <MobileNavMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                className="mt-3"
              >
                <div className="flex flex-col gap-3">
                  {navLinks.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-base font-medium transition-all ${isActive(item.href)
                        ? 'text-white bg-brand-gradient shadow-brand'
                        : 'text-slate-700 dark:text-slate-200 hover:text-brand hover:bg-brand-soft dark:hover:bg-[rgba(255,255,255,0.08)]'
                        }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>

                <div className="flex w-full flex-col gap-4">
                  {isAuthenticated ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50">
                        <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center text-white font-bold">
                          {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{user?.name}</p>
                          <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                      </div>
                      {(user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
                        <NavbarButton variant="ghost" onClick={() => handleNavigation('/admin-dashboard')} className="w-full justify-start text-amber-500">
                          <Clock className="w-4 h-4 mr-2" />
                          Admin Dashboard
                        </NavbarButton>
                      )}
                      <NavbarButton variant="secondary" onClick={() => handleNavigation('/profile')} className="w-full">
                        <UserCircle className="w-4 h-4 mr-2" />
                        My Profile
                      </NavbarButton>
                      <NavbarButton
                        variant="ghost"
                        onClick={async () => {
                          await logout();
                          navigate('/');
                          setIsMenuOpen(false);
                        }}
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </NavbarButton>
                    </>
                  ) : (
                    <NavbarButton onClick={() => handleNavigation('/login')} className="w-full" variant="secondary">
                      <User className="w-4 h-4 mr-2" />
                      Login
                    </NavbarButton>
                  )}

                  <NavbarButton onClick={() => handleNavigation('/booking')} className="w-full">
                    Book Your Event
                  </NavbarButton>
                </div>

                <div className="grid gap-3 rounded-2xl border border-brand-soft bg-white/95 p-4 text-sm dark:border-[rgba(148,163,184,0.18)] dark:bg-[rgba(5,11,22,0.92)]">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-brand" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Call us</p>
                      <p className="text-xs text-secondary dark:text-slate-400">+91 9021363789</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-brand" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Email</p>
                      <p className="text-xs text-secondary dark:text-slate-400">krishnadecoration@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-brand" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Location</p>
                      <p className="text-xs text-secondary dark:text-slate-400">Shakar Peth, Solapur</p>
                    </div>
                  </div>
                </div>
              </MobileNavMenu>
            </MobileNav>
          </div>
        </NavBody>
      </Navbar>
    </motion.div>
  );
};

export default Header;