import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "glass";
  size?: "sm" | "md" | "lg";
}

export function ActionButton({ 
  children, 
  className, 
  variant = "primary", 
  size = "md",
  ...props 
}: ActionButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full select-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-royal-purple to-deep-violet text-white shadow-[0_0_15px_rgba(120,81,169,0.5)] hover:shadow-[0_0_25px_rgba(120,81,169,0.8)]",
    secondary: "bg-white/10 text-white hover:bg-white/20",
    glass: "glass-panel text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
