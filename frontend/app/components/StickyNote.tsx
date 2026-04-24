"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface StickyNoteProps {
  text: string;
  color?: string;
  initialX?: number;
  initialY?: number;
  rotation?: number;
}

export default function StickyNote({ 
  text, 
  color = "bg-amber-100", 
  initialX = 0, 
  initialY = 0, 
  rotation = 0 
}: StickyNoteProps) {
  return (
    <motion.div
      drag
      dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
      whileDrag={{ scale: 1.1, zIndex: 50 }}
      initial={{ x: initialX, y: initialY, rotate: rotation, opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, delay: 1 }}
      className={`absolute p-6 w-48 shadow-xl cursor-grab active:cursor-grabbing border-b-4 border-black/10 ${color} dark:bg-amber-900/40 dark:border-amber-500/20`}
      style={{ 
        fontFamily: '"Permanent Marker", cursive',
        clipPath: "polygon(0% 0%, 100% 0%, 100% 90%, 95% 100%, 0% 100%)" 
      }}
    >
      <div className="absolute top-2 right-2 w-4 h-4 bg-black/5 rounded-full" />
      <p className="text-gray-800 dark:text-amber-200 text-lg leading-tight rotate-1">
        {text}
      </p>
    </motion.div>
  );
}
