"use client";

import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    num: "01",
    title: "Control Gap Audit™",
    desc: "We measure your REAL mismatch. System stock vs physical stock. Your exact leakage — in Rupees.",
    color: "#10B981", // emerald-500
    week: "Week 1",
  },
  {
    num: "02",
    title: "Inventory Foundation Reset",
    desc: "We clean your item structure. SKU naming, categories, sizes, colors. Remove duplicates. Fix the foundation.",
    color: "#3B82F6", // blue-500
    week: "Week 1",
  },
  {
    num: "03",
    title: "Supplier Entry Lock™",
    desc: "No stock enters your store without entering the system FIRST. Your digital gatekeeper.",
    color: "#F59E0B", // amber-500
    week: "Week 2",
  },
  {
    num: "04",
    title: "Sales Deduction Lock™",
    desc: "Every sale automatically reduces stock. No manual adjustments. No batch entries. Real-time accuracy.",
    color: "#10B981", // emerald-500
    week: "Week 2",
  },
  {
    num: "05",
    title: "Single System Enforcement",
    desc: "We physically REMOVE manual registers. No parallel systems. No Excel. One system. One truth.",
    color: "#EF4444", // red-500
    week: "Week 3",
  },
  {
    num: "06",
    title: "Owner Visibility Dashboard",
    desc: "YOU check everything independently. Stock. Suppliers. Sales. Daily report. 10 minutes. Full control.",
    color: "#F59E0B", // amber-500
    week: "Week 3",
  },
  {
    num: "07",
    title: "30-Day Discipline Installation",
    desc: "We monitor. We correct. We enforce. Daily compliance checks for 30 days. Until discipline becomes permanent.",
    color: "#10B981", // emerald-500
    week: "Week 4",
  },
];

export default function Roadmap() {
  return (
    <section className="py-24 bg-stone-950 px-4 relative overflow-hidden" id="roadmap">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-stone-800 to-transparent z-0 opacity-50" />
      
      <div className="container max-w-6xl mx-auto relative z-10 text-center mb-16">
        <span className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-4 block">THE SOLUTION</span>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
          The <span className="text-amber-500 underline underline-offset-8 decoration-amber-500/30">30-Day Stock Certainty System™</span>
        </h2>
        <p className="text-stone-400 text-lg max-w-2xl mx-auto leading-relaxed">
          A 7-step control installation that fixes stock mismatch permanently.<br />
          Not software. Not ERP. A structural installation.
        </p>
      </div>

      <div className="container max-w-4xl mx-auto relative z-10 px-4 space-y-12">
        {STEPS.map((step, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6 group"
          >
            {/* Step Number Circle */}
            <div 
              className="flex-shrink-0 w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-bold transition-all shadow-xl shadow-stone-900 group-hover:scale-110"
              style={{ backgroundColor: `${step.color}20`, border: `1px solid ${step.color}40`, color: step.color }}
            >
              {step.num}
            </div>

            {/* Step Content Card */}
            <div className="flex-grow bg-stone-900/40 backdrop-blur-sm border border-stone-800 p-8 rounded-3xl group-hover:border-stone-700 transition-all shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: step.color }}>
                  {step.week}
                </span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: step.color }} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-amber-500 transition-colors">
                {step.title}
              </h3>
              <p className="text-stone-400 leading-relaxed text-lg">
                {step.desc}
              </p>
            </div>
          </motion.div>
        ))}

        {/* Closing Note */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 bg-stone-900 border border-stone-800 rounded-3xl text-center flex flex-col md:flex-row items-center justify-center gap-4"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-2xl">
            💡
          </div>
          <p className="text-stone-300 text-lg">
            <strong>We fix behavior, not just numbers.</strong> You stop guessing. You start controlling.<br className="hidden md:block" />
            Most stores feel the difference within the first 14 days.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
