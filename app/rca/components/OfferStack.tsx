"use client";

import React from 'react';
import { motion } from 'framer-motion';

const CORE_ITEMS = [
  { name: "Control Gap Audit™", value: "₹5,000", desc: "Exact mismatch % + annual rupee cost" },
  { name: "Inventory Foundation Reset", value: "₹15,000", desc: "SKU cleanup, categories, sizes" },
  { name: "Supplier Entry Lock™", value: "₹10,000", desc: "No stock without system entry" },
  { name: "Sales Deduction Lock™", value: "₹10,000", desc: "Real-time automatic inventory" },
  { name: "Single System Enforcement", value: "₹8,000", desc: "Remove all parallel systems" },
  { name: "30-Day Compliance Monitoring", value: "₹20,000", desc: "Weekly calls + tracking" },
  { name: "Before & After Report™", value: "₹7,000", desc: "Measurable proof of transformation" },
];

const BONUS_ITEMS = [
  { name: "Hidden Leakage Exposure Report™", value: "₹5,000" },
  { name: "Staff Control Rulebook™", value: "₹3,000" },
  { name: "10-Minute Daily Control Routine™", value: "₹2,000" },
  { name: "90-Day Stability Audit™", value: "₹8,000" },
  { name: "Expansion Readiness Scorecard™", value: "₹4,000" },
];

export default function OfferStack() {
  return (
    <section className="py-24 bg-stone-950 px-4 relative overflow-hidden" id="offer">
      <div className="container max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-4 block">THE COMPLETE OFFER</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Everything You Get Inside <span className="text-amber-500 underline underline-offset-8 decoration-amber-500/30">The System</span>
          </h2>
          <p className="text-stone-400 text-lg max-w-2xl mx-auto">
            You aren't paying for a tool. You're paying to stop the bleeding.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Core Installation */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col h-full bg-stone-900/40 border border-stone-800 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              🏗️ Core Installation
            </h3>
            <div className="space-y-6 flex-grow">
              {CORE_ITEMS.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-4 group">
                  <div className="flex gap-3">
                    <span className="text-amber-500 font-bold mt-1">✓</span>
                    <div>
                      <h4 className="text-stone-200 font-semibold group-hover:text-amber-500 transition-colors uppercase tracking-tight">{item.name}</h4>
                      <p className="text-stone-500 text-sm">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-stone-400 font-mono text-sm whitespace-nowrap">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bonuses */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col h-full bg-amber-500/5 border border-amber-500/10 rounded-3xl p-8"
          >
            <h3 className="text-2xl font-bold text-amber-500 mb-8 flex items-center gap-3">
              🎁 Bonuses Included FREE
            </h3>
            <div className="space-y-6 flex-grow">
              {BONUS_ITEMS.map((bonus, i) => (
                <div key={i} className="flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🎁</span>
                    <h4 className="text-stone-300 font-semibold group-hover:text-amber-500 transition-colors uppercase tracking-tight">{bonus.name}</h4>
                  </div>
                  <span className="text-amber-500/50 line-through font-mono text-sm whitespace-nowrap">{bonus.value}</span>
                </div>
              ))}
            </div>
            
            {/* Total Value Anchor */}
            <div className="mt-12 pt-8 border-t border-amber-500/10 text-center">
              <p className="text-stone-500 text-sm uppercase tracking-widest mb-1">Total Component Value</p>
              <p className="text-4xl font-bold text-white tracking-widest">₹97,000</p>
            </div>
          </motion.div>
        </div>

        {/* Pricing Box */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-stone-900 border border-stone-800 rounded-3xl p-10 text-center"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
            <div className="text-center">
                <p className="text-stone-500 text-xs uppercase tracking-widest mb-2 font-bold opacity-30">BEFORE</p>
                <div className="text-2xl font-bold text-stone-500 line-through tracking-widest">₹97,000</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-500">→</div>
            <div className="text-center">
                <p className="text-amber-500 text-xs uppercase tracking-widest mb-2 font-bold tracking-widest opacity-80 animate-pulse">INVESTMENT</p>
                <div className="text-6xl font-black text-white tracking-widest">₹85,000</div>
            </div>
          </div>
          
          <div className="max-w-xl mx-auto space-y-4">
              <p className="text-stone-300 text-lg leading-relaxed">
                <strong>Investment Logic:</strong> If your store has 10% mismatch on ₹40L inventory = ₹4L in uncontrolled stock. Recovering even 50% of that stock leakage in Year 1 pays for this system <strong className="text-amber-500">2.3x over.</strong>
              </p>
              <p className="text-stone-500 text-sm italic">
                💬 If your Hidden Leakage Report shows less than ₹85,000 in annual impact — we tell you honestly and don't ask for your investment.
              </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
