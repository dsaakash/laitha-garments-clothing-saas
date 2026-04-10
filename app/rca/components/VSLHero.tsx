"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function VSLHero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 px-4 overflow-hidden bg-stone-950">
      {/* Background Ornaments */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-red-950/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-950/20 blur-[100px] rounded-full" />
      </div>

      <div className="container max-w-6xl relative z-10 mx-auto text-center">
        {/* Scarcity Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-amber-500 text-sm font-medium tracking-wide uppercase">
            Only 3 Stores Per Month — Next Cycle Starts on the 1st
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
        >
          Your Store Is a <span className="text-red-500 decoration-red-500/30 underline decoration-8 underline-offset-8">Leaking Bucket.</span><br />
          Every Drop Is Your <span className="text-amber-500">Profit.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-stone-400 text-lg md:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          I fix stock mismatch in clothing stores in 30 days — permanently.<br className="hidden md:block" />
          Without buying expensive ERP. Without hiring more staff.<br className="hidden md:block" />
          Without changing your billing software.
        </motion.p>

        {/* VSL Player Placeholder */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-4xl mx-auto aspect-video rounded-3xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl group cursor-pointer"
        >
          {/* Unmute Overlay */}
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-stone-950/60 transition-opacity group-hover:bg-stone-950/40">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-amber-500 flex items-center justify-center text-black text-3xl md:text-4xl shadow-lg shadow-amber-500/30 transition-transform group-hover:scale-110">
              ▶
            </div>
            <p className="text-white text-lg font-semibold mt-6 tracking-widest uppercase">Click to Unmute & Play</p>
          </div>
          
          {/* Thumbnail / Video Placeholder */}
          <div className="absolute inset-0 z-10 w-full h-full bg-[url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-60" />
        </motion.div>

        {/* Immediate CTA below Video */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4 px-4"
        >
          <a 
            href="https://calendly.com/nirvriksh/meet-up"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-8 py-4 bg-amber-500 text-black font-bold text-lg rounded-2xl hover:scale-105 transition-all shadow-lg shadow-amber-500/20 text-center"
          >
            Book Free Stock Leakage Audit →
          </a>
          <a 
            href="#calculator"
            className="w-full md:w-auto px-8 py-4 bg-stone-900 border border-stone-800 text-white font-medium text-lg rounded-2xl hover:bg-stone-800 transition-all text-center"
          >
            Calculate Your Leakage ↓
          </a>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-stone-500 text-sm mt-6"
        >
          ⚡ 30-minute free diagnosis · No obligation · Serious operators only
        </motion.p>
      </div>
    </section>
  );
}
