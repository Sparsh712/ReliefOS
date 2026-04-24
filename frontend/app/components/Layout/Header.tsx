"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clipboard, Menu, X, Sun, Moon, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

const GATED_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/intervention", label: "Intervene" },
  { href: "/dispatch", label: "Dispatch" },
  { href: "/feedback", label: "Feedback" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [hasUpload, setHasUpload] = useState(false);
  const [showGateToast, setShowGateToast] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has completed an upload
    const pipeline = localStorage.getItem("reliefos_pipeline");
    setHasUpload(!!pipeline);
  }, [pathname]); // Re-check on route change (after upload completes)

  const handleGatedClick = (e: React.MouseEvent, href: string) => {
    if (!hasUpload) {
      e.preventDefault();
      setShowGateToast(true);
      setTimeout(() => setShowGateToast(false), 3000);
    }
  };

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-[var(--bg-surface)]/90 backdrop-blur-md border-b border-[var(--border)] transition-colors duration-300">
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
          <nav className="hidden md:flex items-center gap-1">
            {/* Upload — always accessible */}
            <Link
              href="/upload"
              className={`px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-sm transition-colors ${
                isActive("/upload")
                  ? "text-gray-900 dark:text-white bg-amber-500/10 border-b-2 border-amber-600"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Upload
            </Link>

            {/* Gated links */}
            {GATED_LINKS.map((link) => (
              <Link
                key={link.href}
                href={hasUpload ? link.href : "#"}
                onClick={(e) => handleGatedClick(e, link.href)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-sm transition-all ${
                  !hasUpload
                    ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                    : isActive(link.href)
                    ? "text-gray-900 dark:text-white bg-amber-500/10 border-b-2 border-amber-600"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {!hasUpload && <Lock className="w-3 h-3" />}
                {link.label}
              </Link>
            ))}

            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[var(--border)]">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-2 rounded-full hover:bg-[var(--bg-elevated)] transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === "dark"
                    ? <Sun className="w-5 h-5 text-amber-500" />
                    : <Moon className="w-5 h-5 text-gray-600" />}
                </button>
              )}
              <Link href="/upload">
                <button className="btn-human py-2 px-6 text-xs">
                  {hasUpload ? "New Report" : "Start Here"}
                </button>
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-[var(--text-primary)] p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden bg-[var(--bg-surface)] border-b border-[var(--border)] p-8 space-y-1 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Navigation</span>
              {mounted && (
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="p-3 rounded-full bg-[var(--bg-elevated)] transition-colors"
                >
                  {theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
                </button>
              )}
            </div>

            {/* Upload always accessible on mobile */}
            <Link
              href="/upload"
              onClick={() => setIsOpen(false)}
              className={`flex items-center justify-between py-4 border-b border-[var(--border)] text-xl font-black uppercase tracking-tighter ${
                isActive("/upload") ? "text-amber-600" : "text-[var(--text-primary)]"
              }`}
            >
              Upload
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">Open</span>
            </Link>

            {/* Gated links on mobile */}
            {GATED_LINKS.map((link) => (
              <Link
                key={link.href}
                href={hasUpload ? link.href : "#"}
                onClick={(e) => {
                  if (hasUpload) {
                    setIsOpen(false);
                  } else {
                    handleGatedClick(e, link.href);
                    setIsOpen(false);
                  }
                }}
                className={`flex items-center justify-between py-4 border-b border-[var(--border)] text-xl font-black uppercase tracking-tighter ${
                  !hasUpload
                    ? "text-gray-400 dark:text-gray-600"
                    : isActive(link.href)
                    ? "text-amber-600"
                    : "text-[var(--text-primary)]"
                }`}
              >
                {link.label}
                {!hasUpload
                  ? <Lock className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                  : <span className="text-xs text-gray-400">→</span>
                }
              </Link>
            ))}

            {!hasUpload && (
              <p className="pt-4 text-sm text-[var(--text-muted)] font-medium">
                🔒 Upload a report to unlock the full pipeline.
              </p>
            )}
          </div>
        )}
      </header>

      {/* Gate Toast Notification */}
      {showGateToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4">
          <div className="hand-drawn-border bg-[var(--bg-surface)] px-8 py-4 shadow-2xl flex items-center gap-4">
            <Lock className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-black text-sm uppercase tracking-widest">Upload Required</p>
              <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                Process a field report first to unlock this section.
              </p>
            </div>
            <Link href="/upload" className="ml-4">
              <button className="btn-human py-2 px-4 text-xs whitespace-nowrap">Go to Upload →</button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
