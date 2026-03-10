import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

type BaseMotionProps = HTMLMotionProps<'button'>;

interface ButtonProps extends Omit<BaseMotionProps, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-brand-gradient text-[var(--brand-secondary)] shadow-brand hover:shadow-brand hover:brightness-105 focus:ring-[rgba(255,136,0,0.35)] hover:scale-105',
    secondary: 'bg-white dark:bg-[rgba(255,255,255,0.04)] border border-[rgba(15,23,42,0.08)] dark:border-[rgba(148,163,184,0.18)] text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg hover:bg-[rgba(15,23,42,0.05)] dark:hover:bg-[rgba(255,255,255,0.08)]',
    outline: 'border border-[rgba(15,23,42,0.2)] dark:border-[rgba(148,163,184,0.28)] text-slate-700 dark:text-slate-100 hover:border-brand hover:text-brand hover:bg-brand-soft focus:ring-[rgba(255,136,0,0.25)]',
    ghost: 'text-slate-500 dark:text-slate-400 hover:text-brand hover:bg-brand-soft dark:hover:bg-[rgba(255,255,255,0.08)] focus:ring-[rgba(255,136,0,0.2)]',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-400 hover:scale-105'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-3',
    lg: 'px-8 py-4 text-lg gap-4'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const combinedClasses = [baseClasses, variantClasses[variant], sizeClasses[size], widthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="w-4 h-4 animate-spin" />
      )}
      {!loading && leftIcon && (
        <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span className={loading ? 'opacity-70' : ''}>{children}</span>
      {!loading && rightIcon && (
        <span className="flex-shrink-0">{rightIcon}</span>
      )}
    </motion.button>
  );
};

export default Button;