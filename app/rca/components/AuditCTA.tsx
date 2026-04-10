"use client";

import React from 'react';
import { motion } from 'framer-motion';

export default function AuditCTA() {
  return (
    <section className="py-24 bg-stone-950 px-4 relative overflow-hidden" id="audit">
      <div className="container max-w-4xl mx-auto relative z-10">
        
        {/* Guarantee Shield Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-stone-900 to-stone-950 border border-amber-500/20 rounded-[40px] p-12 text-center shadow-2xl overflow-hidden relative"
        >
          {/* Subtle Glow Effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="w-24 h-24 rounded-full bg-amber-500/10 flex items-center justify-center text-5xl mx-auto mb-8 border border-amber-500/20 shadow-inner">
            🛡️
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black text-white mb-6 uppercase tracking-tight">
            The Stock Certainty Guarantee™
          </h2>
          
          <p className="text-stone-400 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
            If, after full 30-day compliance, your stock mismatch does not reduce measurably —
          </p>
          
          <div className="bg-stone-950/80 p-8 rounded-3xl border border-stone-800/50 mb-10">
            <p className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
              We continue working with you at <br />
              <span className="text-amber-500 underline underline-offset-4 decoration-amber-500/30 font-black tracking-widest uppercase">ZERO additional fee</span> <br />
              until control is achieved.
            </p>
          </div>
          
          <p className="text-amber-500/60 font-serif italic text-xl mb-12">
            "I don't win unless you win."
          </p>
          
          <div className="space-y-6">
            <a 
              href="https://calendly.com/nirvriksh/meet-up"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full md:w-auto px-12 py-5 bg-amber-500 text-black font-black text-xl rounded-2xl hover:scale-110 transition-all shadow-xl shadow-amber-500/20 uppercase tracking-widest text-center"
            >
              Book Your 10-Min Forensic Audit →
            </a>
            
            <p className="text-stone-500 text-sm font-medium tracking-widest uppercase flex items-center justify-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> 
              Only 3 Slots Available for {new Date().toLocaleString('default', { month: 'long' })}
            </p>
          </div>
        </motion.div>
        
        {/* Scarcity Note */}
        <div className="mt-16 text-center">
            <p className="text-stone-500 text-sm leading-relaxed max-w-xl mx-auto whitespace-pre-line font-medium opacity-60">
              ⚠️ This is hands-on installation, not bulk SaaS onboarding.<br />
              I personally install this system in each store.<br />
              Next cycle starts on the 1st. Miss this slot → wait 30 more days of leakage.
            </p>
        </div>

      </div>
    </section>
  );
}
