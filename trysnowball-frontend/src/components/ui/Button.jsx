import React from 'react';
import clsx from 'clsx';

const base =
  "inline-flex items-center justify-center rounded-xl font-medium tracking-tight transition-all duration-200 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const sizes = {
  sm: "h-9 px-3 text-sm min-w-[80px]",
  md: "h-11 px-4 text-sm min-w-[100px]", 
  lg: "h-12 px-5 text-base min-w-[120px]"
};

const variants = {
  primary:
    "bg-primary text-white hover:bg-accent hover:shadow-lg focus-visible:ring-primary",
  secondary:
    "bg-gray-900 text-white hover:bg-gray-800 hover:shadow-md dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white focus-visible:ring-gray-400",
  muted:
    "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50 hover:shadow-md focus-visible:ring-gray-300",
  ghost:
    "text-gray-700 hover:bg-gray-100 hover:shadow-sm focus-visible:ring-gray-300",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus-visible:ring-red-600",
  special:
    "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:shadow-lg focus-visible:ring-purple-400"
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  leftIcon: LeftIcon,
  loading = false,
  ...props
}) {
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : LeftIcon ? (
        <LeftIcon className="mr-2 h-5 w-5" />
      ) : null}
      {children}
    </button>
  );
}