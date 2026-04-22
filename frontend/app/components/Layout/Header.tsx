"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-relief-800 bg-relief-950/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Pulse icon */}
          <div className="relative flex items-center justify-center w-7 h-7">
            <span className="absolute inline-flex w-full h-full rounded-full bg-accent-500/20 animate-ping" />
            <span className="relative inline-flex w-3.5 h-3.5 rounded-full bg-accent-500" />
          </div>
          <span className="text-relief-100 font-semibold tracking-tight text-[15px]">
            Relief<span className="text-accent-400">OS</span>
          </span>
          <span className="text-relief-600 text-xs font-medium hidden sm:block ml-0.5">
            Field Intelligence Engine
          </span>
        </Link>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 text-xs text-relief-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          <span className="hidden sm:inline">Delhi Monsoon Watch</span>
          <span className="inline sm:hidden">Active</span>
        </div>
      </div>
    </header>
  );
}
