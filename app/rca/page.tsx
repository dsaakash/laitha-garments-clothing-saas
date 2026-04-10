"use client";

import React from 'react';
import { motion } from 'framer-motion';
import VSLHero from './components/VSLHero';
import LeakageQuiz from './components/LeakageQuiz';
import Roadmap from './components/Roadmap';
import OfferStack from './components/OfferStack';
import AuditCTA from './components/AuditCTA';

/* ── Problem Exposure Sub-Component ─────────────────────── */
const ProblemExposure = () => (
  <section className="py-24 bg-stone-900 px-4 relative overflow-hidden" id="problem">
    <div className="container max-w-6xl mx-auto relative z-10">
      <div className="text-center mb-16">
        <span className="text-red-500 text-sm font-semibold uppercase tracking-widest mb-4 block">THE REALITY CHECK</span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          The <span className="text-red-500 underline underline-offset-8 decoration-red-500/30">6 Silent Leakage Points</span> Destroying Your Profit
        </h2>
        <p className="text-stone-400 text-lg max-w-2xl mx-auto">
          ₹500/day × 365 = ₹1,82,500/year — from <em>just one</em> leakage point.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { point: "Sales without proper entry", icon: "🚫", desc: "Rush hours lead to hand-written notes that never enter the system." },
          { point: "Returns without tagging", icon: "↩️", desc: "Returned items go back to the rack without system reconciliation." },
          { point: "Supplier inward without verification", icon: "📦", desc: "Bill says 40 Kurtis, box has 38. You pay for all 40." },
          { point: "Manual register alongside billing", icon: "📒", desc: "Dual systems create dual realities. Neither is actually true." },
          { point: "End-of-day batch entries", icon: "🕐", desc: "Entering total sales at night misses individual item tracking." },
          { point: "Staff 'adjustments' without record", icon: "✏️", desc: "Giving discounts or 'setting aside' items manually leaks money." },
        ].map((leak, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 bg-stone-950/40 border border-stone-800 rounded-3xl hover:border-red-500/30 transition-all group"
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{leak.icon}</div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-red-500 transition-colors uppercase">{leak.point}</h3>
            <p className="text-stone-500 text-sm leading-relaxed">{leak.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 bg-stone-950 p-10 rounded-[40px] border border-stone-800 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-12 relative z-10">
          <div className="text-center">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-3 block">Inventory</span>
            <span className="text-3xl md:text-4xl font-black text-white tracking-widest">₹40,00,000</span>
          </div>
          <div className="text-3xl text-stone-600 font-light">×</div>
          <div className="text-center">
            <span className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-3 block">Mismatch Rate</span>
            <span className="text-3xl md:text-4xl font-black text-red-500 tracking-widest">10% — 15%</span>
          </div>
        </div>
        <div className="mt-10 py-6 border-t border-stone-800 flex flex-col items-center">
          <h4 className="text-stone-500 uppercase tracking-widest text-xs font-bold mb-4">The Annual Result</h4>
          <p className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase mb-8">
            ₹4,00,000 — ₹6,00,000 <br /> 
            <span className="text-red-500 text-2xl tracking-widest font-black">LEAKING PER YEAR</span>
          </p>
          <a 
            href="https://calendly.com/nirvriksh/meet-up"
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-900/20"
          >
            Claim Your Forensic Audit →
          </a>
        </div>
      </div>
    </div>
  </section>
);

export default function RCAPage() {
  return (
    <main className="bg-stone-950 min-h-screen">
      {/* 1. Hero Section + Video */}
      <VSLHero />
      
      {/* 2. Problem Agitation */}
      <ProblemExposure />

      {/* 3. Interactive Quiz */}
      <section className="py-24 bg-stone-950 px-4 scroll-mt-20" id="calculator">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-4 block">YOUR FREE DIAGNOSIS</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Calculate Your Store's <span className="text-amber-500 underline underline-offset-8 decoration-amber-500/30">Hidden Leakage</span>
            </h2>
            <p className="text-stone-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Answer 5 quick questions. Get your estimated annual loss in 60 seconds.
            </p>
          </div>
          <LeakageQuiz />
        </div>
      </section>

      {/* 4. Roadmap */}
      <Roadmap />

      {/* 5. The Value Stack / Offer */}
      <OfferStack />

      {/* 6. Guarantee & Final CTA */}
      <AuditCTA />

      {/* 7. Footer / Basic Attribution */}
      <footer className="py-20 bg-stone-950 border-t border-stone-900 text-center px-4">
        <div className="container max-w-6xl mx-auto opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-stone-500 text-sm tracking-widest uppercase mb-4">© {new Date().getFullYear()} Retail Control Architect™ · Lalitha Garments Proprietary Method</p>
          <div className="flex items-center justify-center gap-8">
            <span className="text-stone-500 text-xs font-bold tracking-widest uppercase">Privacy Policy</span>
            <span className="text-stone-500 text-xs font-bold tracking-widest uppercase">Terms of Service</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
