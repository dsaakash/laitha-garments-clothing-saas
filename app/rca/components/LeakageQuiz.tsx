"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const QUESTIONS = [
  {
    q: "What is your approximate annual revenue?",
    options: [
      { label: "₹30L – ₹50L", value: 4000000 },
      { label: "₹50L – ₹80L", value: 6500000 },
      { label: "₹80L – ₹1.2Cr", value: 10000000 },
      { label: "₹1.2Cr – ₹1.5Cr+", value: 13500000 },
    ],
  },
  {
    q: "Does your system stock match physical stock?",
    options: [
      { label: "Mostly matches (< 5% gap)", value: 5 },
      { label: "Noticeable gap (5–10%)", value: 8 },
      { label: "Significant gap (10–15%)", value: 13 },
      { label: "I honestly don't know", value: 15 },
    ],
  },
  {
    q: "Do you use manual registers alongside billing software?",
    options: [
      { label: "No, fully digital", value: 0 },
      { label: "Yes, some manual backup", value: 1 },
      { label: "Yes, heavily rely on manual", value: 2 },
    ],
  },
  {
    q: "How long does daily reconciliation take?",
    options: [
      { label: "Under 15 minutes", value: 0 },
      { label: "30 minutes to 1 hour", value: 1 },
      { label: "1–2 hours", value: 2 },
      { label: "We don't reconcile daily", value: 3 },
    ],
  },
  {
    q: "If your key staff member leaves tomorrow, what happens?",
    options: [
      { label: "Systems continue smoothly", value: 0 },
      { label: "Some disruption, but manageable", value: 1 },
      { label: "Major chaos — they know everything", value: 2 },
    ],
  },
];

export default function LeakageQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<any>(null);

  const handleAnswer = useCallback((value: number) => {
    const newAnswers = { ...answers, [step]: value };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const revenue = newAnswers[0] || 4000000;
      const mismatch = newAnswers[1] || 10;
      const annualLeakage = Math.round((revenue * mismatch) / 100);
      const monthlyLeakage = Math.round(annualLeakage / 12);
      const dailyLeakage = Math.round(monthlyLeakage / 30);
      const paybackDays = Math.round(85000 / dailyLeakage);

      setResult({
        annualLeakage,
        monthlyLeakage,
        dailyLeakage,
        paybackDays,
        mismatch,
      });
    }
  }, [answers, step]);

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-stone-900/40 backdrop-blur-xl border border-stone-800 p-8 rounded-3xl"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl text-red-400">
            📊
          </div>
          <h3 className="text-2xl font-semibold text-white">Your Hidden Leakage Report</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-stone-950/50 p-6 rounded-2xl border border-stone-800">
            <p className="text-stone-400 text-sm mb-1 uppercase tracking-wider">Annual Leakage</p>
            <p className="text-4xl font-bold text-red-500">₹{result.annualLeakage.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-stone-950/50 p-6 rounded-2xl border border-stone-800">
            <p className="text-stone-400 text-sm mb-1 uppercase tracking-wider">Monthly &quot;Chaos Tax&quot;</p>
            <p className="text-4xl font-bold text-orange-500">₹{result.monthlyLeakage.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-stone-950/50 p-6 rounded-2xl border border-stone-800">
            <p className="text-stone-400 text-sm mb-1 uppercase tracking-wider">Daily Loss</p>
            <p className="text-4xl font-bold text-red-500">₹{result.dailyLeakage.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-stone-950/50 p-6 rounded-2xl border border-stone-800">
            <p className="text-stone-400 text-sm mb-1 uppercase tracking-wider">ROI Timeline</p>
            <p className="text-4xl font-bold text-emerald-500">{result.paybackDays} Days</p>
          </div>
        </div>

        <div className="bg-stone-950/80 p-6 rounded-2xl border border-stone-800/50 mb-10">
          <p className="text-stone-300 leading-relaxed">
            Your store is leaking approximately <strong className="text-red-400 font-semibold">₹{result.dailyLeakage.toLocaleString("en-IN")} per day</strong> in hidden losses. 
            The system essentially pays for itself in less than <strong className="text-emerald-400">{result.paybackDays} days</strong> of operation.
          </p>
        </div>

        <div className="space-y-4">
          <a 
            href="https://calendly.com/nirvriksh/meet-up"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/20 text-center"
          >
            Stop the Bleeding — Book Your Free Audit →
          </a>
          <button 
            onClick={reset}
            className="w-full py-4 bg-transparent border border-stone-800 text-stone-400 font-medium rounded-2xl transition-all hover:bg-stone-800"
          >
            Start Over
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-stone-900/40 backdrop-blur-xl border border-stone-800 p-8 rounded-3xl relative overflow-hidden min-h-[450px] flex flex-col justify-center">
      <div className="absolute top-0 left-0 h-1 bg-amber-500 transition-all duration-500" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="w-full"
        >
          <p className="text-amber-500 text-sm font-semibold uppercase tracking-widest mb-2">Step {step + 1} of {QUESTIONS.length}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8 leading-tight">
            {QUESTIONS[step].q}
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            {QUESTIONS[step].options.map((opt, i) => (
              <button 
                key={i}
                onClick={() => handleAnswer(opt.value)}
                className="w-full p-4 md:p-5 bg-stone-950/40 border border-stone-800 rounded-2xl text-left text-stone-300 hover:border-amber-500 hover:text-amber-400 hover:bg-amber-500/5 transition-all group flex items-center justify-between"
              >
                <span className="font-medium">{opt.label}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
