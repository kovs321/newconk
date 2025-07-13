import React, { FC, ComponentPropsWithoutRef, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {
  shimmerWidth?: number;
  shimmerColor?: string;
  animationSpeed?: number;
}

export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  shimmerWidth = 100,
  shimmerColor = 'orange',
  animationSpeed = 8,
  ...props
}) => {
  return (
    <span
      style={{
        "--shiny-width": `${shimmerWidth}px`,
        "--animation-speed": `${animationSpeed}s`,
      } as CSSProperties}
      className={cn(
        "relative inline-block text-orange-500 font-black",
        // Base text with subtle glow
        "drop-shadow-[0_0_20px_rgba(249,115,22,0.3)]",
        // Shine effect with custom animation
        "animate-shiny-text bg-clip-text bg-no-repeat",
        "[background-position:calc(-100%_-_var(--shiny-width))_0]",
        "[background-size:var(--shiny-width)_100%]",
        // Enhanced shine gradient with multiple stops for better effect
        shimmerColor === 'orange' 
          ? "bg-gradient-to-r from-transparent via-orange-200/90 via-45% via-orange-100/95 via-50% via-orange-200/90 via-55% to-transparent"
          : "bg-gradient-to-r from-transparent via-white/80 via-50% to-transparent",
        // Add some responsiveness to animation
        "hover:animate-pulse",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};