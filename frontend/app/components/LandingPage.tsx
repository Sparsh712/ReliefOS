"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { 
  ArrowRight, 
  Map, 
  PenTool, 
  Heart, 
  Clipboard, 
  Search,
  Users,
  Image as ImageIcon,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StickyNote from "./StickyNote";

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Hero Zoom & Fade
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  // Folder reveal
  const folderY = useTransform(scrollYProgress, [0, 0.3], [400, 0]);
  const folderScale = useTransform(scrollYProgress, [0, 0.3], [0.8, 1]);
  const folderOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);
  
  // Map slide
  const mapX = useTransform(scrollYProgress, [0.25, 0.55], [1000, 0]);
  const mapOpacity = useTransform(scrollYProgress, [0.25, 0.5], [0, 1]);

  return (
    <div ref={containerRef} className="relative min-h-[300vh] bg-[#fdfaf6] dark:bg-[#0a0a0b] text-gray-900 dark:text-gray-100 selection:bg-amber-200 overflow-x-hidden">
      
      {/* Cinematic Hero (Fixed) */}
      <section className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-10">
        <motion.div 
          style={{ scale: heroScale, opacity: heroOpacity }}
          className="max-w-7xl mx-auto px-8 grid lg:grid-cols-2 gap-20 items-center w-full"
        >
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full text-amber-800 dark:text-amber-400 text-xs font-black uppercase tracking-widest"
            >
              <PenTool className="w-4 h-4" /> Operational Intelligence
            </motion.div>
            <h1 className="text-8xl md:text-[10rem] font-black leading-[0.8] mb-10 tracking-tighter italic font-serif">
              Ink. <br />
              <span className="text-amber-600">Action.</span>
            </h1>
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-xl leading-relaxed font-medium">
              We don't just extract data. We honor the field worker's hand. Digitizing life-saving reports at the speed of thought.
            </p>
            <div className="flex flex-col sm:row gap-6">
              <Link href="/upload">
                <button className="btn-human flex items-center justify-center gap-3 px-12 py-5 text-xl bg-gray-900 text-white dark:bg-amber-600">
                  Deploy Command Center <ArrowRight className="w-6 h-6" />
                </button>
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="hand-drawn-border p-2 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden group">
              <Image 
                src="/hero_desk.png" 
                alt="NGO Field Desk" 
                width={800} 
                height={600} 
                className="transition-transform duration-700 group-hover:scale-105"
                priority
              />
            </div>
            {/* Draggable fun element */}
            <div className="absolute -top-20 -right-20">
              <StickyNote text="Verify Ward 42!" initialX={0} initialY={0} rotation={15} />
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400"
        >
          <span className="text-xs uppercase tracking-widest font-black">Scroll to Unfold</span>
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </section>

      {/* The Folder Unfold (Scroll Reveal) */}
      <section className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-20 pointer-events-none">
        <motion.div 
          style={{ y: folderY, scale: folderScale, opacity: folderOpacity }}
          className="relative max-w-5xl w-full aspect-video pointer-events-auto"
        >
          <div className="absolute inset-0 bg-white dark:bg-gray-800 shadow-[0_50px_100px_rgba(0,0,0,0.2)] hand-drawn-border p-4 overflow-hidden">
            <Image 
              src="/folder_open.png" 
              alt="Open Folder" 
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent" />
            
            <div className="absolute bottom-12 left-12 right-12 grid md:grid-cols-3 gap-8">
               {[
                 { title: "OCR Vision", desc: "Reading the unreadable.", color: "text-amber-600" },
                 { title: "Risk Scoring", desc: "Predicting the peak.", color: "text-emerald-600" },
                 { title: "Team Dispatch", desc: "Deploying the brave.", color: "text-blue-600" },
               ].map((item, i) => (
                 <div key={i} className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-6 hand-drawn-border">
                    <h3 className={`text-xl font-black uppercase mb-2 ${item.color}`}>{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-bold">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* The Tactical Map (Scroll Reveal) */}
      <section className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden z-30 pointer-events-none">
        <motion.div 
          style={{ x: mapX, opacity: mapOpacity }}
          className="relative max-w-7xl w-full h-[80vh] pointer-events-auto"
        >
          <div className="absolute inset-0 bg-gray-900 shadow-2xl border-[12px] border-white dark:border-gray-800 rotate-1">
            <Image 
              src="/tactical_map.png" 
              alt="Tactical Map" 
              fill
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
            
            {/* Interactive Pulse Points on the map */}
            <div className="absolute top-1/4 left-1/3 w-8 h-8">
               <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
               <div className="absolute inset-2 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,1)]" />
            </div>
            <div className="absolute top-1/2 right-1/4 w-8 h-8">
               <div className="absolute inset-0 bg-amber-500 rounded-full animate-ping opacity-75" />
               <div className="absolute inset-2 bg-amber-500 rounded-full shadow-[0_0_20px_rgba(245,158,11,1)]" />
            </div>

            <div className="absolute top-12 left-12 max-w-md bg-white dark:bg-gray-900 p-8 hand-drawn-border">
              <h2 className="text-4xl font-black mb-6 tracking-tighter">Real-Time Impact</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-bold">
                Every pin on this map is a Ward successfully alerted. Every line is a life-saving supply route established.
              </p>
              <div className="flex gap-10">
                <div>
                  <div className="text-3xl font-black text-amber-600">42+</div>
                  <div className="text-xs uppercase font-black text-gray-400">Wards Covered</div>
                </div>
                <div>
                  <div className="text-3xl font-black text-emerald-600">850+</div>
                  <div className="text-xs uppercase font-black text-gray-400">Reports Scanned</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA (Static) */}
      <section className="relative z-40 bg-[var(--bg-primary)] py-40 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-8 text-center">
          <div className="hand-drawn-border py-32 px-12 bg-white dark:bg-gray-900 shadow-2xl relative group overflow-hidden">
            <div className="absolute inset-0 bg-amber-600 opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
            
            <h2 className="text-7xl md:text-8xl font-black mb-12 tracking-tighter leading-[0.8]">
              Ready to <br />
              <span className="italic font-serif text-amber-600">Make History?</span>
            </h2>
            <p className="text-2xl text-gray-600 dark:text-gray-400 mb-16 max-w-2xl mx-auto leading-relaxed font-bold">
              ReliefOS is more than code. It's a promise to the field. Join us in bridging the digital divide.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <Link href="/upload">
                <button className="btn-human text-2xl px-20 py-8 bg-gray-900 text-white dark:bg-amber-600">
                  Launch the OS
                </button>
              </Link>
            </div>

            {/* Scribble decoration */}
            <div className="absolute -bottom-10 -right-10 w-60 h-60 opacity-10 pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-gray-900 dark:stroke-white stroke-2">
                <path d="M10,10 Q50,90 90,10" className="animate-scribble" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Simple Footer */}
        <footer className="mt-40 text-center text-gray-400 text-sm font-black uppercase tracking-[0.2em]">
           © 2026 ReliefOS / Anticipatory Action Engine / Team Vectôr
        </footer>
      </section>

      {/* Floating Ink Cursor Effect Placeholder (CSS based) */}
      <style jsx global>{`
        .btn-human {
          box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
          border-radius: 2px;
          transition: all 0.2s ease;
        }
        .btn-human:hover {
          box-shadow: 0px 0px 0px 0px rgba(0,0,0,1);
          transform: translate(4px, 4px);
        }
        .dark .btn-human {
          box-shadow: 8px 8px 0px 0px rgba(217,119,6,1);
        }
      `}</style>
    </div>
  );
}
