import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  variant?: "glass-panel" | "glass-panel-dark";
}

export function GlassCard({ children, className, variant = "glass-panel-dark", ...props }: GlassCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(variant, "p-6", className)} 
      {...props}
    >
      {children}
    </motion.div>
  );
}
