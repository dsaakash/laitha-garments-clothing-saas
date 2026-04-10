"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import styles from "./page.module.css";

/* ── Intersection Observer Hook ─────────────────────────── */
function useInView(options = {}) {
  const ref = useRef(null);
  const [isVisible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, ...options }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

/* ── Animated Counter ───────────────────────────────────── */
function AnimatedNumber({ value, prefix = "", suffix = "", duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useInView();

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const end = parseInt(value);
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return (
    <span ref={ref} className={styles.animatedNumber}>
      {prefix}{count.toLocaleString("en-IN")}{suffix}
    </span>
  );
}

/* ── Quiz Component ─────────────────────────────────────── */
function LeakageQuiz({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
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

  const handleAnswer = useCallback((value) => {
    const newAnswers = { ...answers, [step]: value };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
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
      if (onComplete) onComplete();
    }
  }, [answers, step, questions.length, onComplete]);

  if (result) {
    return (
      <div className={styles.quizResult}>
        <div className={styles.quizResultHeader}>
          <span className={styles.quizResultIcon}>📊</span>
          <h3>Your Hidden Leakage Report</h3>
        </div>
        <div className={styles.quizMetrics}>
          <div className={styles.quizMetric}>
            <span className={styles.quizMetricLabel}>Estimated Annual Leakage</span>
            <span className={`${styles.quizMetricValue} ${styles.red}`}>
              ₹{result.annualLeakage.toLocaleString("en-IN")}
            </span>
          </div>
          <div className={styles.quizMetric}>
            <span className={styles.quizMetricLabel}>Monthly "Chaos Tax"</span>
            <span className={`${styles.quizMetricValue} ${styles.orange}`}>
              ₹{result.monthlyLeakage.toLocaleString("en-IN")}
            </span>
          </div>
          <div className={styles.quizMetric}>
            <span className={styles.quizMetricLabel}>You Lose Every Day</span>
            <span className={`${styles.quizMetricValue} ${styles.red}`}>
              ₹{result.dailyLeakage.toLocaleString("en-IN")}
            </span>
          </div>
          <div className={styles.quizMetric}>
            <span className={styles.quizMetricLabel}>System Pays For Itself In</span>
            <span className={`${styles.quizMetricValue} ${styles.green}`}>
              {result.paybackDays} Days
            </span>
          </div>
        </div>
        <p className={styles.quizResultNote}>
          Your store is leaking approximately <strong>₹{result.dailyLeakage.toLocaleString("en-IN")}/day</strong> in hidden losses.
          Every day you delay costs you money.
        </p>
        <a href="#book" className={styles.quizResultCta}>
          Stop The Leakage — Book Your Free Audit →
        </a>
      </div>
    );
  }

  return (
    <div className={styles.quiz}>
      <div className={styles.quizProgress}>
        <div className={styles.quizProgressBar} style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>
      <p className={styles.quizStep}>Question {step + 1} of {questions.length}</p>
      <h3 className={styles.quizQuestion}>{questions[step].q}</h3>
      <div className={styles.quizOptions}>
        {questions[step].options.map((opt, i) => (
          <button
            key={i}
            className={styles.quizOption}
            onClick={() => handleAnswer(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Home() {
  const [heroRef, heroVisible] = useInView();
  const [probRef, probVisible] = useInView();
  const [leakRef, leakVisible] = useInView();
  const [sysRef, sysVisible] = useInView();
  const [resRef, resVisible] = useInView();
  const [offerRef, offerVisible] = useInView();
  const [guaRef, guaVisible] = useInView();
  const [forkRef, forkVisible] = useInView();
  const [ctaRef, ctaVisible] = useInView();

  return (
    <>
      <Navbar />

      {/* ══════ HERO SECTION ══════ */}
      <section className={styles.hero} id="hero">
        <div className={styles.heroGlow} />
        <div className={styles.heroGlow2} />
        <div className={`${styles.heroContent} container`} ref={heroRef}>
          <div className={`${styles.heroInner} ${heroVisible ? styles.visible : ""}`}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              Only 3 Stores Per Month — Next Cycle Starts on the 1st
            </div>

            <h1 className={styles.heroTitle}>
              Your Store Is a{" "}
              <span className={styles.heroHighlight}>Leaking Bucket.</span>
              <br />
              Every Drop Is Your{" "}
              <span className={styles.heroGold}>Profit.</span>
            </h1>

            <p className={styles.heroSub}>
              I fix stock mismatch in clothing stores in 30 days — permanently.
              <br />
              Without buying expensive ERP. Without hiring more staff.
              <br />
              Without changing your billing software.
            </p>

            <div className={styles.heroStats}>
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>
                  <AnimatedNumber value={320000} prefix="₹" suffix="" />
                </span>
                <span className={styles.heroStatLabel}>Recovered in 45 Days</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>17% → 2%</span>
                <span className={styles.heroStatLabel}>Mismatch Reduced</span>
              </div>
              <div className={styles.heroStatDivider} />
              <div className={styles.heroStat}>
                <span className={styles.heroStatNum}>30</span>
                <span className={styles.heroStatLabel}>Days to Full Control</span>
              </div>
            </div>

            <div className={styles.heroCtas}>
              <a href="#book" className={styles.ctaPrimary} id="hero-cta-primary">
                <span>Book Free Stock Leakage Audit</span>
                <span className={styles.ctaArrow}>→</span>
              </a>
              <a href="#quiz" className={styles.ctaSecondary} id="hero-cta-secondary">
                <span>Calculate Your Leakage</span>
              </a>
            </div>

            <p className={styles.heroNote}>
              ⚡ 30-minute free diagnosis · No obligation · Serious operators only
            </p>
          </div>
        </div>

        <div className={styles.heroScroll}>
          <div className={styles.scrollMouse}>
            <div className={styles.scrollDot} />
          </div>
        </div>
      </section>

      {/* ══════ PAIN AGITATION ══════ */}
      <section className={styles.section} id="problem" ref={probRef}>
        <div className={`container ${probVisible ? styles.visible : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>THE REALITY CHECK</span>
            <h2 className={styles.sectionTitle}>
              Does This Sound{" "}
              <span className={styles.textGold}>Familiar?</span>
            </h2>
          </div>

          <div className={styles.painGrid}>
            {[
              {
                icon: "📉",
                title: "Stock Shows 47, Rack Has 39",
                desc: "Nobody knows where the difference came from. It happens every week. You've accepted it as \"normal.\"",
              },
              {
                icon: "💸",
                title: "Invisible Money Walking Out",
                desc: "₹2–6 Lakhs per year in silent leakage. Not theft. Not damage. Just... no structure.",
              },
              {
                icon: "📋",
                title: "Two Systems, Two Realities",
                desc: "Manual register running alongside billing software. Which one is true? Nobody knows.",
              },
              {
                icon: "😰",
                title: "One Staff Member = The Brain",
                desc: "If they leave tomorrow, your store's \"brain\" walks out the door. You're a prisoner of your own business.",
              },
              {
                icon: "⏰",
                title: "2 Hours Daily Reconciliation",
                desc: "Should take 15 minutes. Instead, you spend your evenings chasing numbers that never match.",
              },
              {
                icon: "🔄",
                title: "Tried Everything, Nothing Worked",
                desc: "New software. More staff. Excel sheets. Random audits. The chaos always returns within weeks.",
              },
            ].map((pain, i) => (
              <div
                key={i}
                className={styles.painCard}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className={styles.painIcon}>{pain.icon}</span>
                <h3 className={styles.painTitle}>{pain.title}</h3>
                <p className={styles.painDesc}>{pain.desc}</p>
              </div>
            ))}
          </div>

          <div className={styles.painQuote}>
            <span className={styles.painQuoteIcon}>"</span>
            <p>
              Retail mein thoda mismatch toh hoga hi — yeh normal hai.
            </p>
            <span className={styles.painQuoteAuthor}>
              — What every struggling store owner believes (before they see their leakage number)
            </span>
          </div>
        </div>
      </section>

      {/* ══════ LEAKAGE POINTS ══════ */}
      <section className={`${styles.section} ${styles.darkBg}`} id="leakage" ref={leakRef}>
        <div className={`container ${leakVisible ? styles.visible : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>THE ROOT CAUSE</span>
            <h2 className={styles.sectionTitle}>
              The <span className={styles.textRed}>6 Silent Leakage Points</span>{" "}
              Destroying Your Profit
            </h2>
            <p className={styles.sectionSub}>
              ₹500/day × 365 = ₹1,82,500/year — from <em>just one</em> leakage point.
            </p>
          </div>

          <div className={styles.leakageGrid}>
            {[
              { point: "Sales without proper entry", icon: "🚫" },
              { point: "Returns without tagging", icon: "↩️" },
              { point: "Supplier inward without verification", icon: "📦" },
              { point: "Manual register alongside billing", icon: "📒" },
              { point: "End-of-day batch entries", icon: "🕐" },
              { point: "Staff 'adjustments' without record", icon: "✏️" },
            ].map((leak, i) => (
              <div key={i} className={styles.leakCard}>
                <span className={styles.leakIcon}>{leak.icon}</span>
                <span className={styles.leakText}>{leak.point}</span>
                <span className={styles.leakX}>✕</span>
              </div>
            ))}
          </div>

          <div className={styles.leakageMath}>
            <div className={styles.mathRow}>
              <span className={styles.mathLabel}>Average Store Inventory</span>
              <span className={styles.mathValue}>₹40,00,000</span>
            </div>
            <div className={styles.mathRow}>
              <span className={styles.mathLabel}>× Typical Mismatch</span>
              <span className={styles.mathValue}>10%</span>
            </div>
            <div className={styles.mathDivider} />
            <div className={`${styles.mathRow} ${styles.mathResult}`}>
              <span className={styles.mathLabel}>= Annual Uncontrolled Stock</span>
              <span className={`${styles.mathValue} ${styles.red}`}>₹4,00,000</span>
            </div>
            <p className={styles.mathNote}>
              This is money you can't see, can't measure, and can't stop — until now.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ QUIZ / CALCULATOR ══════ */}
      <section className={styles.section} id="quiz">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>YOUR FREE DIAGNOSIS</span>
            <h2 className={styles.sectionTitle}>
              Calculate Your Store's{" "}
              <span className={styles.textGold}>Hidden Leakage</span>
            </h2>
            <p className={styles.sectionSub}>
              Answer 5 quick questions. Get your estimated annual loss in 60 seconds.
            </p>
          </div>
          <LeakageQuiz />
        </div>
      </section>

      {/* ══════ THE SYSTEM — 7 STEPS ══════ */}
      <section className={`${styles.section} ${styles.darkBg}`} id="system" ref={sysRef}>
        <div className={`container ${sysVisible ? styles.visible : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>THE SOLUTION</span>
            <h2 className={styles.sectionTitle}>
              The{" "}
              <span className={styles.textGold}>30-Day Stock Certainty System™</span>
            </h2>
            <p className={styles.sectionSub}>
              A 7-step control installation that fixes stock mismatch permanently.
              <br />
              Not software. Not ERP. A structural installation.
            </p>
          </div>

          <div className={styles.stepsTimeline}>
            {[
              {
                num: "01",
                title: "Control Gap Audit™",
                desc: "We measure your REAL mismatch. System stock vs physical stock. Your exact leakage — in Rupees.",
                color: "#2ECCAD",
                week: "Week 1",
              },
              {
                num: "02",
                title: "Inventory Foundation Reset",
                desc: "We clean your item structure. SKU naming, categories, sizes, colors. Remove duplicates. Fix the foundation.",
                color: "#5B9BF7",
                week: "Week 1",
              },
              {
                num: "03",
                title: "Supplier Entry Lock™",
                desc: "No stock enters your store without entering the system FIRST. Your digital gatekeeper.",
                color: "#FF9F43",
                week: "Week 2",
              },
              {
                num: "04",
                title: "Sales Deduction Lock™",
                desc: "Every sale automatically reduces stock. No manual adjustments. No batch entries. Real-time accuracy.",
                color: "#4ED87B",
                week: "Week 2",
              },
              {
                num: "05",
                title: "Single System Enforcement",
                desc: "We physically REMOVE manual registers. No parallel systems. No Excel. One system. One truth.",
                color: "#FF5A5A",
                week: "Week 3",
              },
              {
                num: "06",
                title: "Owner Visibility Dashboard",
                desc: "YOU check everything independently. Stock. Suppliers. Sales. Daily report. 10 minutes. Full control.",
                color: "#F0BD4E",
                week: "Week 3",
              },
              {
                num: "07",
                title: "30-Day Discipline Installation",
                desc: "We monitor. We correct. We enforce. Daily compliance checks for 30 days. Until discipline becomes permanent.",
                color: "#2ECCAD",
                week: "Week 4",
              },
            ].map((step, i) => (
              <div key={i} className={styles.stepCard}>
                <div className={styles.stepLine} style={{ backgroundColor: step.color }} />
                <div className={styles.stepNum} style={{ color: step.color }}>
                  {step.num}
                </div>
                <div className={styles.stepContent}>
                  <span className={styles.stepWeek} style={{ color: step.color }}>
                    {step.week}
                  </span>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.systemNote}>
            <span className={styles.systemNoteIcon}>💡</span>
            <p>
              <strong>We fix behavior, not just numbers.</strong> You stop guessing. You start controlling.
              Most stores feel the difference within the first 14 days.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ RESULTS ══════ */}
      <section className={styles.section} id="results" ref={resRef}>
        <div className={`container ${resVisible ? styles.visible : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>PROVEN RESULTS</span>
            <h2 className={styles.sectionTitle}>
              Real Stores.{" "}
              <span className={styles.textGreen}>Real Results.</span>
            </h2>
          </div>

          <div className={styles.resultsGrid}>
            <div className={styles.resultCard}>
              <div className={styles.resultIcon}>₹3.2L</div>
              <h3>Recovered in 45 Days</h3>
              <p>
                Hidden leakage that was invisible for years. Found and plugged in one
                clothing store.
              </p>
            </div>
            <div className={styles.resultCard}>
              <div className={`${styles.resultIcon} ${styles.tealIcon}`}>
                17% → 2%
              </div>
              <h3>Stock Mismatch Reduced</h3>
              <p>
                From chaos to near-perfect accuracy. In 30 days. With full compliance.
              </p>
            </div>
            <div className={styles.resultCard}>
              <div className={`${styles.resultIcon} ${styles.greenIcon}`}>98%</div>
              <h3>Stock Accuracy Achieved</h3>
              <p>
                From 83% to 98% accuracy in just 30 days of disciplined enforcement.
              </p>
            </div>
            <div className={styles.resultCard}>
              <div className={`${styles.resultIcon} ${styles.goldIcon}`}>
                0
              </div>
              <h3>Month-End Stock Shocks</h3>
              <p>
                No more unpleasant surprises. No more guesswork. Just clean numbers.
              </p>
            </div>
          </div>

          <div className={styles.resultTestimonial}>
            <div className={styles.testimonialQuote}>
              <span>"</span>
              <p>
                Internal shrinkage — eliminated. Second branch — opened confidently.
                Micromanaging — stopped. All without replacing software or firing staff.
              </p>
            </div>
            <div className={styles.testimonialAuthor}>
              <div className={styles.testimonialAvatar}>👔</div>
              <div>
                <strong>Verified Store Owner</strong>
                <span>Multi-brand clothing outlet, Tier 2 City</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ ABOUT / CREDIBILITY ══════ */}
      <section className={`${styles.section} ${styles.darkBg}`} id="about">
        <div className="container">
          <div className={styles.aboutGrid}>
            <div className={styles.aboutContent}>
              <span className={styles.sectionTag}>WHO AM I</span>
              <h2 className={styles.aboutTitle}>
                Hi, I'm <span className={styles.textGold}>Aakash Savant.</span>
              </h2>
              <p className={styles.aboutText}>
                Founder of Retail Control Architect™. I specialize in one thing:
              </p>
              <p className={styles.aboutHighlight}>
                Making your system stock match your real stock.
              </p>
              <p className={styles.aboutText}>
                I once walked into a busy clothing shop. Good revenue. Normal-looking operations.
                System showed ₹28 Lakh inventory. Physical count showed ₹24 Lakh.
              </p>
              <p className={styles.aboutBig}>
                <span className={styles.textRed}>₹4 Lakh vanished.</span>{" "}
                And the owner thought it was "normal."
              </p>
              <p className={styles.aboutText}>
                That's when I understood — the real problem is not software.
                It's not staff. It's lack of <strong>STRUCTURE</strong>.
              </p>
            </div>
            <div className={styles.aboutCard}>
              <div className={styles.aboutCardInner}>
                <span className={styles.aboutCardIcon}>◆</span>
                <h3>Retail Control Architect™</h3>
                <ul>
                  <li>Not a software vendor</li>
                  <li>Not an ERP provider</li>
                  <li>I install operational control</li>
                </ul>
                <div className={styles.aboutCardQuote}>
                  "I don't sell billing software. I install The Stock Certainty System™ inside clothing stores."
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ THE OFFER ══════ */}
      <section className={styles.section} id="offer" ref={offerRef}>
        <div className={`container ${offerVisible ? styles.visible : ""}`}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>THE COMPLETE OFFER</span>
            <h2 className={styles.sectionTitle}>
              Everything You Get Inside{" "}
              <span className={styles.textGold}>The System</span>
            </h2>
            <p className={styles.sectionSub}>
              You aren't paying for a tool. You're paying to stop the bleeding.
            </p>
          </div>

          <div className={styles.offerColumns}>
            {/* Core Components */}
            <div className={styles.offerColumn}>
              <h3 className={styles.offerColumnTitle}>
                🏗️ Core Installation
              </h3>
              {[
                { name: "Control Gap Audit™", value: "₹5,000", desc: "Exact mismatch % + annual rupee cost" },
                { name: "Inventory Foundation Reset", value: "₹15,000", desc: "SKU cleanup, categories, sizes" },
                { name: "Supplier Entry Lock™", value: "₹10,000", desc: "No stock without system entry" },
                { name: "Sales Deduction Lock™", value: "₹10,000", desc: "Real-time automatic inventory" },
                { name: "Single System Enforcement", value: "₹8,000", desc: "Remove all parallel systems" },
                { name: "30-Day Compliance Monitoring", value: "₹20,000", desc: "Weekly calls + tracking" },
                { name: "Before & After Report™", value: "₹7,000", desc: "Measurable proof of transformation" },
              ].map((item, i) => (
                <div key={i} className={styles.offerItem}>
                  <div className={styles.offerItemLeft}>
                    <span className={styles.offerCheck}>✓</span>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </div>
                  <span className={styles.offerValue}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* Bonuses */}
            <div className={styles.offerColumn}>
              <h3 className={`${styles.offerColumnTitle} ${styles.bonusTitle}`}>
                🎁 Bonuses Included FREE
              </h3>
              {[
                { name: "Hidden Leakage Exposure Report™", value: "₹5,000" },
                { name: "Staff Control Rulebook™", value: "₹3,000" },
                { name: "10-Minute Daily Control Routine™", value: "₹2,000" },
                { name: "90-Day Stability Audit™", value: "₹8,000" },
                { name: "Expansion Readiness Scorecard™", value: "₹4,000" },
              ].map((bonus, i) => (
                <div key={i} className={styles.bonusItem}>
                  <div className={styles.bonusLeft}>
                    <span className={styles.bonusIcon}>🎁</span>
                    <strong>{bonus.name}</strong>
                  </div>
                  <span className={styles.bonusValue}>{bonus.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className={styles.priceBox}>
            <div className={styles.priceTop}>
              <div className={styles.priceTotal}>
                <span className={styles.priceTotalLabel}>Total Value</span>
                <span className={styles.priceTotalAmount}>₹97,000</span>
              </div>
              <div className={styles.priceArrow}>→</div>
              <div className={styles.priceYour}>
                <span className={styles.priceYourLabel}>Your Investment</span>
                <span className={styles.priceYourAmount}>₹85,000</span>
                <span className={styles.priceOneTime}>One-Time Setup Fee</span>
              </div>
            </div>
            <div className={styles.priceLogic}>
              <p>
                <strong>Investment Logic:</strong> If your store has 10% mismatch on ₹40L inventory =
                ₹4L in uncontrolled stock annually. Even a 50% correction in Year 1 recovers
                far more than ₹85,000.
              </p>
              <p className={styles.priceHonesty}>
                💬 If your Hidden Leakage Report shows less than ₹85,000 in annual impact —
                we tell you honestly and don't ask for your investment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ GUARANTEE ══════ */}
      <section className={`${styles.section} ${styles.guaranteeBg}`} id="guarantee" ref={guaRef}>
        <div className={`container ${guaVisible ? styles.visible : ""}`}>
          <div className={styles.guaranteeCard}>
            <div className={styles.guaranteeShield}>🛡️</div>
            <h2 className={styles.guaranteeTitle}>
              The Stock Certainty Guarantee™
            </h2>
            <p className={styles.guaranteeText}>
              If, after full 30-day compliance, your stock mismatch does not
              reduce measurably —
            </p>
            <p className={styles.guaranteeBold}>
              We continue working with you at <span>ZERO additional fee</span>{" "}
              until control is achieved.
            </p>
            <div className={styles.guaranteeLine} />
            <p className={styles.guaranteeClose}>
              "I don't win unless you win."
            </p>
            <p className={styles.guaranteeNote}>
              Zero risk. Complete confidence. Measurable results or we keep working free.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ SCARCITY ══════ */}
      <section className={styles.section} id="scarcity">
        <div className="container">
          <div className={styles.scarcityBox}>
            <div className={styles.scarcityLeft}>
              <h3 className={styles.scarcityTitle}>
                ⚠️ Only 3 Stores Per Month
              </h3>
              <p className={styles.scarcityText}>
                This is hands-on installation. Not bulk SaaS onboarding. I personally
                install this system in each store. That means maximum capacity — 3 clothing
                stores per month. Real capacity limit, not a marketing tactic.
              </p>
            </div>
            <div className={styles.scarcityRight}>
              <div className={styles.slotGrid}>
                <div className={`${styles.slot} ${styles.slotFilled}`}>
                  <span>Slot 1</span>
                  <span className={styles.slotStatus}>FILLED</span>
                </div>
                <div className={`${styles.slot} ${styles.slotFilled}`}>
                  <span>Slot 2</span>
                  <span className={styles.slotStatus}>FILLED</span>
                </div>
                <div className={`${styles.slot} ${styles.slotOpen}`}>
                  <span>Slot 3</span>
                  <span className={styles.slotStatusOpen}>OPEN</span>
                </div>
              </div>
              <p className={styles.slotNote}>
                Next cycle starts on the 1st. Miss this slot → wait 30 more days of silent leakage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FORK IN THE ROAD ══════ */}
      <section className={`${styles.section} ${styles.darkBg}`} id="decision" ref={forkRef}>
        <div className={`container ${forkVisible ? styles.visible : ""}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              You Have <span className={styles.textGold}>Two Options.</span>
            </h2>
          </div>

          <div className={styles.forkGrid}>
            <div className={`${styles.forkCard} ${styles.forkBad}`}>
              <h3>
                <span className={styles.textRed}>Option A</span>
              </h3>
              <ul>
                <li>Ignore this</li>
                <li>Continue monthly mismatch</li>
                <li>Continue guessing profits</li>
                <li>Continue the stress</li>
                <li>Lose ₹8,000–12,000 every month silently</li>
              </ul>
              <div className={styles.forkResult}>
                Same chaos → Same results → Same stress
              </div>
            </div>

            <div className={styles.forkVs}>OR</div>

            <div className={`${styles.forkCard} ${styles.forkGood}`}>
              <h3>
                <span className={styles.textGreen}>Option B</span>
              </h3>
              <ul>
                <li>Install a proven system</li>
                <li>Take back control</li>
                <li>Protect your margins</li>
                <li>Scale confidently</li>
                <li>Sleep peacefully knowing stock matches shop</li>
              </ul>
              <div className={`${styles.forkResult} ${styles.forkResultGood}`}>
                Clean reports → Confident audits → Growth plans
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ OBJECTION HANDLING ══════ */}
      <section className={styles.section} id="faq">
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTag}>COMMON QUESTIONS</span>
            <h2 className={styles.sectionTitle}>
              You Might Be <span className={styles.textGold}>Thinking…</span>
            </h2>
          </div>

          <div className={styles.faqGrid}>
            {[
              {
                q: "\"My staff won't follow the system.\"",
                a: "That's exactly why enforcement is built-in. We don't just teach. We monitor and enforce for 30 days straight. Discipline becomes habit, not effort.",
              },
              {
                q: "\"I already use billing software.\"",
                a: "Software doesn't create discipline. Structure does. Software records transactions. It doesn't enforce them. That's why mismatch continues.",
              },
              {
                q: "\"My store is small.\"",
                a: "Smaller stores leak MORE proportionally. 10% mismatch on ₹30L inventory = ₹3L uncontrolled stock. Structure is what makes small stores big. Chaos keeps them small.",
              },
              {
                q: "\"This sounds expensive.\"",
                a: "Compare ₹85,000 to your annual hidden loss of ₹1–3 Lakhs. The system pays for itself in ~31 days. If your leakage is less than ₹85K/year, we tell you honestly and walk away.",
              },
              {
                q: "\"What if it doesn't work?\"",
                a: "The Stock Certainty Guarantee™ — if mismatch doesn't reduce in 30 days, we work FREE until it does. I don't win unless you win.",
              },
              {
                q: "\"How much time do I need to invest?\"",
                a: "Your job is 3 rules. Your daily effort is 10 minutes. We handle everything — design, setup, enforcement, monitoring, and validation.",
              },
            ].map((faq, i) => (
              <details key={i} className={styles.faqItem}>
                <summary className={styles.faqQuestion}>{faq.q}</summary>
                <p className={styles.faqAnswer}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className={`${styles.section} ${styles.ctaSection}`} id="book" ref={ctaRef}>
        <div className={styles.ctaGlow} />
        <div className={`container ${ctaVisible ? styles.visible : ""}`}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaContent}>
              <span className={styles.sectionTag}>TAKE ACTION NOW</span>
              <h2 className={styles.ctaTitle}>
                Book Your Free{" "}
                <span className={styles.textGold}>Stock Leakage Audit</span>
              </h2>
              <p className={styles.ctaText}>
                30-minute detailed diagnosis of your store.
                We identify your exact leakage zones.
                You get clarity — instantly.
              </p>

              <ul className={styles.ctaChecks}>
                <li>✓ No obligation, no pressure</li>
                <li>✓ Exact leakage number in Rupees</li>
                <li>✓ Actionable plan for your specific store</li>
                <li>✓ Takes less than 60 seconds to book</li>
              </ul>

              <a href="https://wa.me/91XXXXXXXXXX?text=Hi%20Aakash,%20I%20want%20to%20book%20a%20free%20Stock%20Leakage%20Audit%20for%20my%20clothing%20store." className={styles.ctaBigButton} id="cta-final-book">
                📞 Book Your Free Audit Now
              </a>

              <div className={styles.ctaMeta}>
                <span>⚡ Limited audit slots every week</span>
                <span>🔒 Serious operators only</span>
                <span>⏰ Next cycle starts on the 1st</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div className={styles.footerBrand}>
              <span className={styles.footerLogo}>◆</span>
              <div>
                <strong>Aakash Savant</strong>
                <span>Retail Control Architect™</span>
              </div>
            </div>
            <p className={styles.footerTagline}>
              "I fix stock mismatch in clothing stores in 30 days — permanently."
            </p>
            <div className={styles.footerLinks}>
              <a href="#hero">Home</a>
              <a href="#system">The System</a>
              <a href="#offer">Offer</a>
              <a href="#book">Book Audit</a>
            </div>
            <div className={styles.footerDivider} />
            <p className={styles.footerCopy}>
              © {new Date().getFullYear()} Aakash Savant — Retail Control Architect™. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
