"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clipboard, Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const NAV_LINKS = [
  { href: "/upload", label: "Upload" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/intervention", label: "Intervene" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/feedback", label: "Feedback" },
];

export default function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  return (
    <header className="fixed top-0 w-full z-50 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gray-900 dark:bg-amber-600 flex items-center justify-center rounded-sm transition-transform group-hover:scale-110">
            <Clipboard className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">
            Relief<span className="text-amber-600">OS</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-bold uppercase tracking-widest transition-colors hover:text-gray-900 dark:hover:text-white ${
                pathname === link.href ? "text-gray-900 dark:text-white border-b-2 border-amber-600" : "text-gray-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="flex items-center gap-4 ml-4">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            )}
            <Link href="/upload">
              <button className="btn-human py-2 px-6 text-xs">Enter Portal</button>
            </Link>
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-gray-900 p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-8 space-y-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
             <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Mode</span>
             {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6 text-gray-600" />}
                </button>
             )}
          </div>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`block text-xl font-black uppercase tracking-tighter ${
                pathname === link.href ? "text-amber-600" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/upload" onClick={() => setIsOpen(false)}>
            <button className="w-full btn-human py-4">Enter Portal</button>
          </Link>
        </div>
      )}
    </header>
  );
}
