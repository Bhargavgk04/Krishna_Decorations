import React from 'react';
import { AnimatePresence, motion, HTMLMotionProps } from 'framer-motion';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ children, className }) => {
  return <div className={`w-full ${className ?? ''}`}>{children}</div>;
};

interface NavBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const NavBody: React.FC<NavBodyProps> = ({ children, className }) => {
  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 flex h-16 lg:h-20 items-center justify-between gap-4 ${
        className ?? ''
      }`}
    >
      {children}
    </div>
  );
};

export interface NavItem {
  name: string;
  link: string;
  onClick?: () => void;
  active?: boolean;
}

interface NavItemsProps {
  items: NavItem[];
  className?: string;
}

export const NavItems: React.FC<NavItemsProps> = ({ items, className }) => {
  return (
    <div className={`hidden lg:flex items-center gap-1 ${className ?? ''}`}>
      {items.map((item) => (
        <motion.button
          key={item.name}
          onClick={item.onClick}
          className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgba(255,136,0,0.35)] ${
            item.active
              ? 'text-white bg-brand-gradient shadow-brand'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
          }`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          {item.name}
          {item.active && (
            <motion.span
              layoutId="navbar-active-pill"
              className="absolute inset-0 rounded-xl"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </motion.button>
      ))}
    </div>
  );
};

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({ children, className }) => {
  return <div className={`lg:hidden ${className ?? ''}`}>{children}</div>;
};

interface NavbarLogoProps {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const NavbarLogo: React.FC<NavbarLogoProps> = ({
  children,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgba(255,136,0,0.35)] ${
        className ?? ''
      }`}
    >
      {children}
    </button>
  );
};

type MotionButtonProps = Omit<HTMLMotionProps<'button'>, 'children'>;

type NavbarButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
} & MotionButtonProps;

export const NavbarButton: React.FC<NavbarButtonProps> = ({
  variant = 'primary',
  className,
  children,
  type = 'button',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const variants: Record<string, string> = {
    primary:
      'bg-brand-gradient text-[var(--brand-secondary)] shadow-brand hover:shadow-brand hover:brightness-105 focus-visible:ring-[rgba(255,136,0,0.35)]',
    secondary:
      'bg-slate-900/80 text-slate-100 border border-slate-700/70 shadow-sm hover:shadow-lg focus-visible:ring-[rgba(255,136,0,0.25)]',
    ghost:
      'bg-transparent text-slate-300 hover:text-brand hover:bg-slate-800/40 focus-visible:ring-[rgba(255,136,0,0.2)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className={`${baseClasses} ${variants[variant]} ${className ?? ''}`}
      type={type}
      {...props}
    >
      {children}
    </motion.button>
  );
};

interface MobileNavHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileNavHeader: React.FC<MobileNavHeaderProps> = ({
  children,
  className,
}) => {
  return (
    <div className={`flex items-center justify-between ${className ?? ''}`}>
      {children}
    </div>
  );
};

type MobileNavToggleProps = MotionButtonProps & {
  isOpen: boolean;
};

export const MobileNavToggle: React.FC<MobileNavToggleProps> = ({
  isOpen,
  className,
  type = 'button',
  ...props
}) => {
  return (
    <motion.button
      type={type}
      whileTap={{ scale: 0.94 }}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/70 text-slate-200 shadow-sm transition-colors duration-300 hover:border-brand hover:text-brand ${
        className ?? ''
      }`}
      {...props}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.span
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <X className="h-5 w-5" />
          </motion.span>
        ) : (
          <motion.span
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <Menu className="h-5 w-5" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

interface MobileNavMenuProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export const MobileNavMenu: React.FC<MobileNavMenuProps> = ({
  children,
  isOpen,
  onClose,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-nav"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
          className={`mt-4 rounded-2xl border border-slate-700/70 bg-[rgba(6,14,24,0.95)] p-4 shadow-xl backdrop-blur-xl ${
            className ?? ''
          }`}
        >
          <div className="space-y-4">{children}</div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="sr-only"
              aria-hidden
              tabIndex={-1}
            >
              Close
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
