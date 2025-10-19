import React from 'react';
import { cn } from './tailwind';

interface ButtonProps {
  onClick: () => void;
  variant?: 'gray' | 'green' | 'blue' | 'red';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  variant = 'gray', 
  children, 
  icon 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'green':
        return 'bg-green-100 hover:bg-green-200 text-green-700';
      case 'blue':
        return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
      case 'red':
        return 'bg-red-100 hover:bg-red-200 text-red-700';
      default:
        return 'bg-gray-100 hover:bg-gray-200 text-gray-700';
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center px-3 py-1.5 text-xs rounded-md transition-all duration-200 transform hover:scale-105 active:scale-95",
        getVariantClasses()
      )}
    >
      {icon && <span className="w-3 h-3 mr-1">{icon}</span>}
      {children}
    </button>
  );
};