import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function GlassCard({ children, className, id }: GlassCardProps) {
  return (
    <div
      id={id}
      className={cn(
        "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
