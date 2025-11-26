import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => {
  const baseStyle = "px-8 py-3 rounded-full font-medium transition-all duration-500 shadow-lg";
  const variants = {
    primary: "bg-moon-orange text-white hover:bg-white hover:text-moon-orange",
    secondary: "bg-white text-moon-orange hover:bg-moon-orange hover:text-white"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className || ''}`}
      {...props}
    />
  );
};