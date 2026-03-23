import React from 'react';
import { motion } from 'motion/react';

interface LoaderProps {
  message?: string;
  id?: string;
}

export function Loader({ message = "Loading...", id }: LoaderProps) {
  return (
    <div id={id} className="flex flex-col items-center justify-center p-8 space-y-4">
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
      />
      <p className="text-zinc-400 font-medium animate-pulse">{message}</p>
    </div>
  );
}
