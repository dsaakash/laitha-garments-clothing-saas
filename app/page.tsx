'use client'

import './rca-landing.css'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── BRAND TOKENS ────────────────────────────────────────────────
const BRAND = {
  navy: '#0D1B2E',
  navyLight: '#132338',
  gold: '#BA7517',
  goldLight: '#D4921E',
  green: '#3B6D11',
  greenLight: '#4A8A16',
  cream: '#FDF8EF',
  muted: '#7A6A52',
  accent: '#C94D1A',
}

// ─── SHARED COMPONENTS ───────────────────────────────────────────

const GoldBtn = ({ children, onClick, size = 'md', style = {}, id }: any) => {
  const [hovered, setHovered] = useState(false)
  const sizes: any = {
    sm: { padding: '10px 22px', fontSize: '14px' },
    md: { padding: '14px 32px', fontSize: '16px' },
    lg: { padding: '18px 46px', fontSize: '18px' },
  }
  return (
    <button
      id={id}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${BRAND.goldLight}, ${BRAND.gold})`
          : `linear-gradient(135deg, ${BRAND.gold}, #9A6010)`,
        color: BRAND.navy,
        fontFamily: "'Playfair Display', serif",
        fontWeight: 700,
        borderRadius: '4px',
        letterSpacing: '0.5px',
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-3px) scale(1.03)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? `0 12px 32px rgba(186,117,23,0.45), 0 0 0 1px rgba(186,117,23,0.3)`
          : `0 4px 14px rgba(186,117,23,0.3)`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        ...sizes[size],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

const Tag = ({ children, color = 'gold' }: any) => (
  <span
    style={{
      fontFamily: "'IBM Plex Mono', monospace",
      background: color === 'gold' ? `rgba(186,117,23,0.12)` : `rgba(59,109,17,0.12)`,
      color: color === 'gold' ? BRAND.gold : BRAND.greenLight,
      border: `1px solid ${color === 'gold' ? 'rgba(186,117,23,0.4)' : 'rgba(59,109,17,0.4)'}`,
      padding: '5px 14px',
      borderRadius: '100px',
      fontSize: '10px',
      letterSpacing: '2px',
      textTransform: 'uppercase' as const,
      display: 'inline-block',
    }}
  >
    {children}
  </span>
)

// ─── LALITA MODAL ────────────────────────────────────────────────

const LalitaModal = ({ onClose, onCaseStudy, onLivePage }: any) => (
  <div
    style={{
      position: 'fixed', inset: 0,
      background: 'rgba(5,12,22,0.92)',
      backdropFilter: 'blur(20px)',
      zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}
    onClick={onClose}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: 'linear-gradient(135deg, #0F1E34, #1A2C45)',
        border: `1px solid rgba(186,117,23,0.35)`,
        borderRadius: '20px',
        padding: '44px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(186,117,23,0.1)',
        animation: 'rcaFadeUp 0.35s ease forwards',
      }}
    >
      <div style={{ fontSize: '40px', textAlign: 'center', marginBottom: '16px' }}>📍</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 900, color: BRAND.cream, textAlign: 'center', marginBottom: '6px' }}>
        Lalita Garments
      </h2>
      <p style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', color: BRAND.muted, textAlign: 'center', marginBottom: '28px' }}>
        Aap kya dekhna chahte hain?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { icon: '📖', title: 'Case Study Padho', sub: '₹3.2L recovery ki poori kahani', onClick: onCaseStudy, border: BRAND.gold, bg: 'rgba(186,117,23,0.08)', hoverBg: 'rgba(186,117,23,0.18)' },
          { icon: '🏪', title: 'Live Store Ka Demo Dekho', sub: 'Lalita Garments ka live boutique page', onClick: onLivePage, border: BRAND.green, bg: 'rgba(59,109,17,0.08)', hoverBg: 'rgba(59,109,17,0.18)' },
        ].map((btn, i) => (
          <button
            key={i}
            onClick={btn.onClick}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = btn.hoverBg; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = btn.bg; e.currentTarget.style.transform = 'none' }}
            style={{
              background: btn.bg,
              border: `1.5px solid ${btn.border}`,
              borderRadius: '12px',
              padding: '18px 20px',
              color: BRAND.cream,
              fontFamily: "'Kalam', cursive",
              fontSize: '16px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontWeight: 700 }}>{btn.icon} {btn.title}</div>
            <div style={{ fontSize: '13px', color: BRAND.muted, marginTop: '4px' }}>{btn.sub}</div>
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        style={{ background: 'transparent', border: 'none', color: BRAND.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', cursor: 'pointer', marginTop: '20px', width: '100%', textAlign: 'center', letterSpacing: '1.5px' }}
      >
        ✕ BAND KARO
      </button>
    </div>
  </div>
)

// ─── NAV ─────────────────────────────────────────────────────────

const Nav = ({ page, setPage, showLalitaModal }: any) => {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(10,20,35,0.96)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(186,117,23,0.15)' : 'none',
        transition: 'all 0.4s ease',
        padding: '0 40px',
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
        <div onClick={() => setPage('home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
              <defs>
                <radialGradient id="treeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#4A8A16" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#3B6D11" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="20" cy="20" r="20" fill="url(#treeGlow)" />
              <line x1="20" y1="38" x2="20" y2="20" stroke={BRAND.gold} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="20" y1="38" x2="10" y2="30" stroke={BRAND.gold} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
              <line x1="20" y1="38" x2="30" y2="30" stroke={BRAND.gold} strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
              <circle cx="20" cy="15" r="8" fill={BRAND.green} />
              <circle cx="12" cy="20" r="5" fill={BRAND.green} opacity="0.7" />
              <circle cx="28" cy="20" r="5" fill={BRAND.green} opacity="0.7" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '17px', fontWeight: 900, color: BRAND.cream, letterSpacing: '2.5px', lineHeight: 1 }}>NIRVRIKSH</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: BRAND.gold, letterSpacing: '2.5px', marginTop: '3px' }}>RETAIL CONTROL ARCHITECT</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            id="nav-lalita-btn"
            onClick={showLalitaModal}
            style={{
              background: 'rgba(186,117,23,0.08)',
              border: '1px solid rgba(186,117,23,0.3)',
              color: BRAND.gold,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              letterSpacing: '1px',
              padding: '9px 18px',
              borderRadius: '100px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(186,117,23,0.16)'; e.currentTarget.style.borderColor = BRAND.gold }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(186,117,23,0.08)'; e.currentTarget.style.borderColor = 'rgba(186,117,23,0.3)' }}
          >
            📍 LALITA GARMENTS
          </button>
          <GoldBtn onClick={() => setPage('trial')} size="sm" id="nav-trial-btn">
            Start Free Trial →
          </GoldBtn>
        </div>
      </div>
    </nav>
  )
}

// ─── ANIMATED COUNTER ────────────────────────────────────────────

const Counter = ({ to, prefix = '', suffix = '', delay = 0 }: any) => {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      let start = 0
      const end = parseFloat(to)
      const duration = 1500
      const step = duration / 60
      const increment = end / (duration / step)
      const interval = setInterval(() => {
        start += increment
        if (start >= end) { setCount(end); clearInterval(interval) }
        else setCount(parseFloat(start.toFixed(1)))
      }, step)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [visible, to, delay])

  return <span ref={ref}>{prefix}{typeof to === 'string' && isNaN(parseFloat(to)) ? to : (Number.isInteger(parseFloat(to)) ? Math.floor(count) : count.toFixed(1))}{suffix}</span>
}

// ─── STAT CARD 3D ────────────────────────────────────────────────

const Stat3D = ({ number, label, icon, delay = 0 }: any) => {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className="rca-3d-card"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(186,117,23,0.05) 100%)',
        border: '1px solid rgba(186,117,23,0.2)',
        borderRadius: '20px',
        padding: '32px 28px',
        textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ${delay}s ease, transform 0.7s ${delay}s ease`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', fontSize: '80px', opacity: 0.05, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: '28px', marginBottom: '10px' }}>{icon}</div>
      <div
        className="rca-shimmer-text"
        style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: 900, lineHeight: 1 }}
      >
        {number}
      </div>
      <div style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: BRAND.muted, marginTop: '10px', lineHeight: 1.5 }}>
        {label}
      </div>
    </div>
  )
}

// ─── PAIN CARD (module-level — no hooks in map) ───────────────────

const PainCard = ({ icon, title, desc }: any) => (
  <div
    className="rca-pain-card"
    onMouseEnter={(e: any) => {
      e.currentTarget.style.background = 'rgba(201,77,26,0.07)'
      e.currentTarget.querySelector('.pain-icon').style.filter = 'drop-shadow(0 4px 12px rgba(201,77,26,0.4))'
    }}
    onMouseLeave={(e: any) => {
      e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
      e.currentTarget.querySelector('.pain-icon').style.filter = 'none'
    }}
    style={{ background: 'rgba(255,255,255,0.025)', borderRadius: '16px', padding: '28px 24px' }}
  >
    <div className="pain-icon" style={{ fontSize: '36px', marginBottom: '14px', transition: 'filter 0.3s' }}>{icon}</div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, color: BRAND.cream, marginBottom: '10px' }}>{title}</div>
    <div style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', color: BRAND.muted, lineHeight: 1.7 }}>{desc}</div>
  </div>
)

// ─── HOME PAGE ───────────────────────────────────────────────────

const HomePage = ({ setPage, showLalitaModal }: any) => (
  <div>
    {/* ══ HERO ══════════════════════════════════════════════════════ */}
    <section className="rca-hero-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: '120px 40px 80px' }}>
      {/* Background orbs */}
      <div className="rca-orb rca-orb-1" />
      <div className="rca-orb rca-orb-2" />
      <div className="rca-orb rca-orb-3" />
      <div className="rca-mesh" />

      <div style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 2, width: '100%', display: 'grid', gridTemplateColumns: '1fr auto', gap: '60px', alignItems: 'center' }}>
        {/* Left: Copy */}
        <div>
          <div className="rca-fade-up-1" style={{ marginBottom: '24px' }}>
            <Tag>Retail Control Architect — India&apos;s #1 Stock System for Garment Stores</Tag>
          </div>

          <h1
            className="rca-fade-up-2"
            style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(40px, 6vw, 76px)', fontWeight: 900, lineHeight: 1.08, marginBottom: '28px', maxWidth: '860px' }}
          >
            Tumhari Dukaan Mein{' '}
            <span className="rca-shimmer-text">Kitna Stock</span>{' '}
            Hai — Sach Mein?
          </h1>

          <p
            className="rca-fade-up-3"
            style={{ fontFamily: "'Kalam', cursive", fontSize: 'clamp(17px, 2vw, 21px)', color: 'rgba(253,248,239,0.68)', maxWidth: '600px', lineHeight: 1.8, marginBottom: '16px' }}
          >
            80% kapde ki dukaan walon ko apna actual, live stock pata hi nahi hota. Aur ye &quot;pata nahi&quot; — silently lakhs drain kar raha hai. Har mahine.
          </p>

          <p className="rca-fade-up-3" style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', color: BRAND.gold, marginBottom: '44px', fontStyle: 'italic' }}>
            ✦ Vadodara mein ek store ne 45 din mein ₹3.2 lakh recover kiye — sirf system change karke.
          </p>

          <div className="rca-fade-up-4" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <GoldBtn onClick={() => setPage('trial')} size="lg" id="hero-trial-btn">
              🚀 7 Din Free Try Karo
            </GoldBtn>
            <button
              onClick={showLalitaModal}
              style={{
                background: 'rgba(253,248,239,0.05)',
                border: '1.5px solid rgba(253,248,239,0.15)',
                color: BRAND.cream,
                fontFamily: "'Kalam', cursive",
                fontSize: '16px',
                padding: '17px 30px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
                backdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = 'rgba(186,117,23,0.6)'; e.currentTarget.style.color = BRAND.gold; e.currentTarget.style.background = 'rgba(186,117,23,0.06)' }}
              onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = 'rgba(253,248,239,0.15)'; e.currentTarget.style.color = BRAND.cream; e.currentTarget.style.background = 'rgba(253,248,239,0.05)' }}
            >
              📖 Lalita Garments Case Study
            </button>
          </div>
        </div>

        {/* Right: 3D floating widget */}
        <div className="rca-hide-mobile" style={{ flexShrink: 0, position: 'relative', width: '280px' }}>
          {/* Main Floating Card */}
          <div
            className="rca-float rca-glass rca-glow"
            style={{ borderRadius: '20px', padding: '28px', border: '1px solid rgba(186,117,23,0.3)', position: 'relative', zIndex: 2 }}
          >
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2px', marginBottom: '16px' }}>STOCK MISMATCH · LIVE</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '44px', fontWeight: 900, color: BRAND.accent, lineHeight: 1 }}>17%</div>
                <div style={{ fontFamily: "'Kalam', cursive", fontSize: '12px', color: BRAND.muted, marginTop: '4px' }}>Before RCA</div>
              </div>
              <div style={{ fontSize: '24px' }}>→</div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '44px', fontWeight: 900, color: BRAND.greenLight, lineHeight: 1 }}>2%</div>
                <div style={{ fontFamily: "'Kalam', cursive", fontSize: '12px', color: BRAND.muted, marginTop: '4px' }}>After 30 Days</div>
              </div>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '88%', background: `linear-gradient(90deg, ${BRAND.greenLight}, ${BRAND.gold})`, borderRadius: '10px', transition: 'width 1s ease' }} />
            </div>
            <div style={{ fontFamily: "'Kalam', cursive", fontSize: '12px', color: BRAND.muted, marginTop: '8px', textAlign: 'right' }}>88% improvement</div>
          </div>

          {/* Sub-badge 1 */}
          <div
            className="rca-float-rev"
            style={{ position: 'absolute', top: '-40px', right: '-30px', background: 'linear-gradient(135deg, #1E3A18, #2A4F22)', border: `1px solid ${BRAND.green}`, borderRadius: '12px', padding: '12px 16px', zIndex: 3 }}
          >
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 900, color: BRAND.greenLight }}>₹3.2L</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: BRAND.muted, letterSpacing: '1px' }}>RECOVERED</div>
          </div>

          {/* Sub-badge 2 */}
          <div
            className="rca-float"
            style={{ position: 'absolute', bottom: '-35px', left: '-35px', background: 'linear-gradient(135deg, #2A1E0A, #3D2C0E)', border: `1px solid ${BRAND.gold}`, borderRadius: '12px', padding: '12px 16px', animationDelay: '-2s', zIndex: 3 }}
          >
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 900, color: BRAND.gold }}>45 Days</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '8px', color: BRAND.muted, letterSpacing: '1px' }}>TO CERTAINTY</div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to top, #0D1B2E, transparent)', zIndex: 3 }} />
    </section>

    {/* ══ STATS STRIP ══════════════════════════════════════════════ */}
    <section style={{ padding: '80px 40px', position: 'relative' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <Tag>By The Numbers</Tag>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 900, marginTop: '16px', lineHeight: 1.2 }}>
            Real Results. Real Dukaandar.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          <Stat3D number="₹3.2L" icon="💰" label="Recovered by one Vadodara store in 45 days" delay={0} />
          <Stat3D number="17%→2%" icon="📉" label="Stock mismatch reduced in just 30 days" delay={0.12} />
          <Stat3D number="80%" icon="🤯" label="Garment stores don't know their real stock" delay={0.24} />
          <Stat3D number="30 Days" icon="⚡" label="To full stock certainty — guaranteed" delay={0.36} />
        </div>
      </div>
    </section>

    {/* ══ PAIN POINTS ══════════════════════════════════════════════ */}
    <section style={{ padding: '80px 40px', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle BG glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', background: 'radial-gradient(ellipse, rgba(201,77,26,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Tag>Pehchana?</Tag>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 900, marginTop: '20px', lineHeight: 1.15 }}>
            Ye Cheezein Tumhari<br />Dukaan Mein Bhi Hoti Hain
          </h2>
          <p style={{ fontFamily: "'Kalam', cursive", fontSize: '17px', color: BRAND.muted, marginTop: '14px', maxWidth: '500px', margin: '14px auto 0' }}>
            Agar inme se ek bhi &quot;haan yaar&quot; feel ho — toh RCA tumhare liye hi hai.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
          {[
            { icon: '📦', title: 'Stock Ka Andaza', desc: 'Billing software mein numbers hain — physical shelf pe kuch aur milta hai. Dono kabhi match nahi karte.' },
            { icon: '👕', title: 'Variant-less Billing', desc: '"Shirt — 2 pcs." Colour kya? Size? "Baad mein dekhenge." Lekin baad mein aata hi nahi.' },
            { icon: '🔄', title: 'Return Record Nahi', desc: 'Customer ne return kiya — system mein 3 din baad update hua. Tab tak stock wrong ho chuka.' },
            { icon: '💸', title: 'Dead Stock Problem', desc: 'Wohi size ki 40 pieces hain jo bikti hi nahi. Jo bikti hai woh hamesha khatam. Buying = blind.' },
            { icon: '👥', title: 'Staff Accountability Zero', desc: 'Kaun ne kya nikala, kab nikala, wapas kab aaya — kuch pata nahi. Ye bahut mehnga padta hai.' },
            { icon: '😰', title: 'Season End Shock', desc: 'Saal end mein audit karo — aur jo numbers aate hain woh dekhke bistar pe baith jaate ho.' },
          ].map((card, i) => (
            <PainCard key={i} icon={card.icon} title={card.title} desc={card.desc} />
          ))}
        </div>
      </div>
    </section>

    {/* ══ CASE STUDY ═══════════════════════════════════════════════ */}
    <section
      id="case-study"
      style={{ padding: '100px 40px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #0D1B2E 0%, #0A1828 50%, #0D1B2E 100%)' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(59,109,17,0.12) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 30%, rgba(186,117,23,0.07) 0%, transparent 50%)' }} />

      <div style={{ maxWidth: '1180px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '70px', alignItems: 'center' }}>
          <div>
            <Tag color="green">Real Client · Real Numbers</Tag>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, marginTop: '20px', lineHeight: 1.15, marginBottom: '18px' }}>
              Lalita Garments,<br />
              <span className="rca-shimmer-text">Vadodara</span>
            </h2>

            <blockquote
              style={{ fontFamily: "'Kalam', cursive", fontSize: '17px', color: 'rgba(253,248,239,0.75)', lineHeight: 1.85, borderLeft: `3px solid ${BRAND.gold}`, paddingLeft: '20px', fontStyle: 'italic', margin: '0 0 32px' }}
            >
              &quot;Mujhe laga tha problem supplier ki hai. Ya customers ki. Pata chala — problem meri thi. Aur fix bhi ho sakti thi.&quot;
            </blockquote>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
              {[
                { before: '17%', after: '2%', label: 'Stock Mismatch' },
                { before: '₹?', after: '₹3.2L', label: 'Recovered in 45 Days' },
                { before: '1 Branch', after: '2 Branches', label: 'Now Expanding' },
                { before: 'Andaza', after: 'Certainty', label: 'Stock Visibility' },
              ].map((s, i) => (
                <div key={i} className="rca-3d-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(186,117,23,0.18)', borderRadius: '14px', padding: '16px' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.muted, letterSpacing: '1.2px', marginBottom: '8px' }}>{s.label}</div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '16px', color: 'rgba(201,77,26,0.7)', textDecoration: 'line-through' }}>{s.before}</span>
                    <span style={{ color: BRAND.muted, fontSize: '12px' }}>→</span>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', fontWeight: 700, color: BRAND.gold }}>{s.after}</span>
                  </div>
                </div>
              ))}
            </div>

            <GoldBtn onClick={showLalitaModal} id="case-study-btn">Poori Kahani Padho →</GoldBtn>
          </div>

          {/* Timeline */}
          <div className="rca-3d-card rca-glass" style={{ borderRadius: '20px', padding: '36px', border: '1px solid rgba(186,117,23,0.18)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2.5px', marginBottom: '28px' }}>TIMELINE — 45 DAYS</div>
            {[
              { day: 'Day 0', event: 'Audit kiya — 17% mismatch nikla. Store owner ka jaw drop.', color: BRAND.accent },
              { day: 'Day 1–7', event: 'Variant-level billing shuru. Staff training. Return tracking lagaya.', color: BRAND.gold },
              { day: 'Day 8–21', event: 'Micro-audit. Differences track hone lage. System ne kaam dikhaya.', color: BRAND.gold },
              { day: 'Day 30', event: 'Mismatch 2% pe aaya. Pehli baar — real stock clear tha.', color: BRAND.green },
              { day: 'Day 45', event: '₹3.2 lakh recover. Second branch ki planning shuru.', color: BRAND.greenLight },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '18px', marginBottom: i < 4 ? '22px' : '0', alignItems: 'flex-start' }}>
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: item.color, marginTop: '3px', boxShadow: `0 0 10px ${item.color}` }} />
                  {i < 4 && <div style={{ width: '1px', height: '30px', background: 'rgba(186,117,23,0.15)', marginTop: '5px' }} />}
                </div>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: item.color, letterSpacing: '1.2px', marginBottom: '4px' }}>{item.day}</div>
                  <div style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: 'rgba(253,248,239,0.72)', lineHeight: 1.6 }}>{item.event}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* ══ HOW IT WORKS ══════════════════════════════════════════════ */}
    <section style={{ padding: '100px 40px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
        <div>
          <Tag>RCA Ka System</Tag>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 900, marginTop: '20px', lineHeight: 1.15, marginBottom: '48px' }}>
            Teen Changes.<br />
            <span className="rca-shimmer-text">Ek Mahina.</span><br />
            Poora Control.
          </h2>

          {[
            { num: '01', title: 'Variant-Level Billing', desc: 'Sirf "shirts — 2 pcs" nahi. Colour, size, style code — har cheez record. 5 seconds extra = lakhs saved.' },
            { num: '02', title: 'Same-Day Return Tracking', desc: '"Baad mein" band. Jo aayi — record. Jo gayi — record. Us din. 3-4% mismatch akela khatam.' },
            { num: '03', title: 'Monthly Micro-Audit', desc: 'Pura store ek din mein count nahi. Ek category, ek shelf, 30 min. Koi "thoda toh hoga" nahi.' },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: i < 2 ? '36px' : '0', alignItems: 'flex-start' }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: BRAND.gold,
                  background: 'rgba(186,117,23,0.1)',
                  border: '1px solid rgba(186,117,23,0.3)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  flexShrink: 0,
                  letterSpacing: '1px',
                }}
              >
                {step.num}
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '19px', fontWeight: 700, color: BRAND.cream, marginBottom: '6px' }}>{step.title}</div>
                <div style={{ fontFamily: "'Kalam', cursive", fontSize: '15px', color: BRAND.muted, lineHeight: 1.75 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* What you get card */}
        <div className="rca-glass rca-3d-card" style={{ borderRadius: '24px', padding: '40px', border: '1px solid rgba(186,117,23,0.18)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '180px', background: 'radial-gradient(ellipse, rgba(186,117,23,0.08) 0%, transparent 70%)' }} />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2.5px', marginBottom: '24px' }}>30 DINON MEIN KYA MILTA HAI</div>
          {[
            '✅ Actual real-time stock visibility',
            '✅ Staff accountability — koi excuse nahi',
            '✅ Data-driven buying decisions',
            '✅ Dead stock clearly tagged',
            '✅ Return/exchange tracked same day',
            '✅ Monthly audit template — 30 min',
            '✅ RCA dashboard setup',
            '✅ Seedha Aakash se — done-with-you',
          ].map((item, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'Kalam', cursive",
                fontSize: '15px',
                color: 'rgba(253,248,239,0.82)',
                padding: '11px 0',
                borderBottom: i < 7 ? '1px solid rgba(186,117,23,0.08)' : 'none',
                lineHeight: 1.5,
                transition: 'color 0.2s',
              }}
            >
              {item}
            </div>
          ))}
          <div style={{ marginTop: '28px' }}>
            <GoldBtn onClick={() => setPage('trial')} style={{ width: '100%' }} id="works-trial-btn">
              7 Din Free Shuru Karo →
            </GoldBtn>
          </div>
        </div>
      </div>
    </section>

    {/* ══ CTA ══════════════════════════════════════════════════════ */}
    <section
      style={{
        padding: '120px 40px',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #0D1B2E 0%, #0A1520 100%)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(186,117,23,0.08) 0%, transparent 60%)' }} />
      <div className="rca-mesh" />

      <div style={{ maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div className="rca-float" style={{ fontSize: '64px', marginBottom: '24px', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(59,109,17,0.4))' }}>🌳</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px, 5vw, 54px)', fontWeight: 900, lineHeight: 1.15, marginBottom: '20px' }}>
          Kal Se <span className="rca-shimmer-text">Andhere Mein</span><br />Mat Khelo
        </h2>
        <p style={{ fontFamily: "'Kalam', cursive", fontSize: '19px', color: 'rgba(253,248,239,0.68)', lineHeight: 1.85, marginBottom: '44px' }}>
          7 din free. Koi credit card nahi. Koi pressure nahi.<br />Sirf tumhara store, tumhara stock, aur ek system jo kaam karta hai.
        </p>
        <GoldBtn onClick={() => setPage('trial')} size="lg" id="cta-trial-btn">
          🚀 Abhi Start Karo — Free Hai
        </GoldBtn>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: 'rgba(122,106,82,0.7)', marginTop: '20px', letterSpacing: '1.5px' }}>
          7-DAY FREE TRIAL · NO CREDIT CARD · CANCEL ANYTIME
        </p>
      </div>
    </section>

    {/* FOOTER */}
    <footer style={{ padding: '44px 40px', borderTop: '1px solid rgba(186,117,23,0.1)', textAlign: 'center' }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: 900, color: BRAND.gold, marginBottom: '10px', letterSpacing: '2px' }}>NIRVRIKSH</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: BRAND.muted, letterSpacing: '1px' }}>
        aakash@nirvriksh.com · nirvriksh.com · +91 93530 83597
      </div>
      <div style={{ fontFamily: "'Kalam', cursive", fontSize: '12px', color: 'rgba(186,117,23,0.35)', marginTop: '16px' }}>
        © 2025 Nirvriksh. Retail Control Architect is a Nirvriksh product.
      </div>
    </footer>
  </div>
)

// ─── LALITA CASE STUDY PAGE ──────────────────────────────────────

const LalitaPage = ({ setPage }: any) => (
  <div>
    <section
      style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', padding: '140px 40px 80px', position: 'relative', overflow: 'hidden' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(59,109,17,0.15) 0%, transparent 60%)' }} />
      <div className="rca-mesh" />
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Tag color="green">Case Study</Tag>
          <Tag>Kapde Ki Dukaan · Vadodara</Tag>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 62px)', fontWeight: 900, lineHeight: 1.12, marginBottom: '20px' }}>
          Lalita Garments Ne{' '}
          <span className="rca-shimmer-text">₹3.2 Lakh</span>{' '}
          Recover Kiya — Bina Nayi Dukaan Khole
        </h1>
        <p style={{ fontFamily: "'Kalam', cursive", fontSize: '19px', color: 'rgba(253,248,239,0.68)', lineHeight: 1.8 }}>
          Vadodara ke ek standalone kapde ki dukaan ki kahani — jahan sab kuch tha, phir bhi lakhs drain ho rahe the. Aur phir 45 din mein sab badal gaya.
        </p>
      </div>
    </section>

    <div style={{ background: 'rgba(186,117,23,0.07)', borderTop: '1px solid rgba(186,117,23,0.15)', borderBottom: '1px solid rgba(186,117,23,0.15)', padding: '36px 40px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '24px', textAlign: 'center' }}>
        {[
          { num: '17% → 2%', label: 'Stock mismatch in 30 days' },
          { num: '₹3.2 Lakh', label: 'Recovered in 45 days' },
          { num: '30 Days', label: 'To full stock certainty' },
          { num: '2nd Branch', label: 'Now planning to open' },
        ].map((s, i) => (
          <div key={i}>
            <div className="rca-shimmer-text" style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900 }}>{s.num}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: BRAND.muted, letterSpacing: '1px', marginTop: '6px' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>

    <section style={{ padding: '80px 40px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {[
          { label: 'THE SITUATION', title: 'Sab Theek Lag Raha Tha — Lekin Tha Nahi', body: `Lalita Garments Vadodara ka ek established kapde ka store hai. Customers the. Staff tha. Billing software tha. Sab kuch professionally run ho raha tha — ya kam se kam aisa lagta tha.\n\nStore owner khud confident tha: "Mera sab kuch track hai." Unhone kabhi koi badi problem feel nahi ki. Lekin numbers kuch aur bol rahe the.` },
          { label: 'THE DISCOVERY', title: 'Audit Kiya — Aur Jo Nikla Woh Shock Kar Gaya', body: `RCA ke saath pehla kaam tha — ek simple stock audit. Physical count karo. System se match karo.\n\nResult: 17% stock mismatch.\n\nHar 100 pieces mein 17 ya toh duplicate entries mein the, ya physically the lekin system mein nahi the.\n\n5 lakh ke stock pe — 85,000 rupye ka maal "kahin" tha. Koi chori nahi thi. Sirf — system nahi tha.` },
          { label: 'THE ROOT CAUSE', title: 'Teen Cheezein Jo Sab Bigaad Rahi Thin', body: `1. Variant-less billing — "Shirts — 2 pcs" bina colour, size ya style ke.\n\n2. Return aur exchange ka record miss hona — 2-3 din baad system update. Tab tak stock wrong.\n\n3. Physical count sirf saal mein ek baar — baaki sab andaze pe.` },
          { label: 'THE FIX', title: 'Teen Changes. Koi Nayi App Nahi. Koi Bada Investment Nahi.', body: `Step 1: Variant-level billing enforce ki. Har entry mein colour, size, style code mandatory.\n\nStep 2: Same-day return/exchange tracking. Koi bhi return "baad mein" nahi.\n\nStep 3: Monthly micro-audit — ek category, ek shelf, 30-45 minutes. Staff training ke saath, existing software ke saath.` },
          { label: 'THE RESULT', title: '30 Din Baad — Pehli Baar Real Numbers Dikhe', body: `30 din ke andar stock mismatch 17% se 2% pe aa gayi.\n\nPehli baar Lalita Garments ke owner ne apna actual, real stock dekha. 45 din ke andar ₹3.2 lakh recover.\n\nAur ab? Doosri branch ki planning chal rahi hai. Usi dukaan ke paise se.` },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: '56px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2.5px', marginBottom: '12px' }}>{section.label}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '25px', fontWeight: 700, marginBottom: '18px', lineHeight: 1.3 }}>{section.title}</h2>
            <div style={{ fontFamily: "'Kalam', cursive", fontSize: '17px', color: 'rgba(253,248,239,0.76)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{section.body}</div>
            {i < 4 && <div style={{ height: '1px', background: 'rgba(186,117,23,0.12)', marginTop: '44px' }} />}
          </div>
        ))}

        <div className="rca-glass" style={{ border: '2px solid rgba(186,117,23,0.22)', borderRadius: '16px', padding: '36px', margin: '40px 0 60px', position: 'relative' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '72px', color: BRAND.gold, opacity: 0.2, position: 'absolute', top: '8px', left: '22px', lineHeight: 1 }}>&quot;</div>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontStyle: 'italic', lineHeight: 1.65, color: BRAND.cream, paddingTop: '24px', position: 'relative', zIndex: 1 }}>
            Mujhe laga tha problem supplier ki hai. Ya customers ki. Ya market ki. Pata chala — problem meri thi. Aur fix bhi ho sakti thi.
          </p>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: BRAND.gold, letterSpacing: '1.5px', marginTop: '20px' }}>— STORE OWNER, LALITA GARMENTS, VADODARA</div>
        </div>

        <div style={{ textAlign: 'center', padding: '48px 32px', background: 'rgba(59,109,17,0.07)', border: '1px solid rgba(59,109,17,0.2)', borderRadius: '16px' }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, marginBottom: '14px' }}>Tumhari Dukaan Ka Audit Karo — Free Mein</h3>
          <p style={{ fontFamily: "'Kalam', cursive", fontSize: '16px', color: 'rgba(253,248,239,0.68)', marginBottom: '28px', lineHeight: 1.7 }}>7 din free trial mein apna actual stock reality dekho.</p>
          <GoldBtn onClick={() => setPage('trial')} size="lg" id="lalita-trial-btn">7 Din Free Shuru Karo →</GoldBtn>
        </div>
      </div>
    </section>

    <footer style={{ padding: '40px', borderTop: '1px solid rgba(186,117,23,0.08)', textAlign: 'center' }}>
      <button onClick={() => setPage('home')} style={{ background: 'transparent', color: BRAND.gold, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '1.5px', cursor: 'pointer', textDecoration: 'underline', border: 'none' }}>
        ← Back to Nirvriksh RCA
      </button>
    </footer>
  </div>
)

// ─── FORM FIELD (defined at module level — never remount on rerender) ───────

const FIELD_LBL_STYLE = {
  display: 'block', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: BRAND.gold, letterSpacing: '1.5px', textTransform: 'uppercase' as const, marginBottom: '8px',
}

const FormField = ({ label, type = 'text', field, placeholder, options, value, onChange }: any) => (
  <div style={{ marginBottom: '22px' }}>
    <label style={FIELD_LBL_STYLE}>{label}</label>
    {options
      ? <select value={value} onChange={(e) => onChange(field, e.target.value)} className="rca-input-field" style={{ cursor: 'pointer' }}>
          <option value="">Select...</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
      : <input
          type={type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className="rca-input-field"
        />}
  </div>
)

// ─── TRIAL PAGE ──────────────────────────────────────────────────

const TrialPage = ({ setPage }: any) => {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', store: '', phone: '', city: '', storeType: '', revenue: '', staff: '', software: '', mainProblem: '', email: '' })

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, store_name: form.store, phone: form.phone, city: form.city, store_type: form.storeType, monthly_revenue: form.revenue, staff_count: form.staff, billing_software: form.software, main_problem: form.mainProblem, email: form.email }),
      })
      const data = await res.json()
      if (data.success) { setSubmitted(true) }
      else { setError(data.error || 'Kuch galat hua. Dobara try karo.') }
    } catch { setError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', position: 'relative', background: BRAND.navy }}>
      <div style={{ position: 'absolute', inset: 0 }} className="rca-mesh" />
      <div style={{ position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', background: 'radial-gradient(ellipse, rgba(59,109,17,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: submitted ? '800px' : '560px', position: 'relative', zIndex: 1, transition: 'max-width 0.4s ease' }}>
        {!submitted && (
          <button onClick={() => step > 1 ? setStep((s) => s - 1) : setPage('home')} style={{ background: 'transparent', color: BRAND.muted, fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '1px', cursor: 'pointer', marginBottom: '28px', display: 'block', border: 'none', transition: 'color 0.2s' }}
            onMouseEnter={(e: any) => e.target.style.color = BRAND.cream}
            onMouseLeave={(e: any) => e.target.style.color = BRAND.muted}>
            ← Back
          </button>
        )}

        {/* Progress */}
        {!submitted && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '32px' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{ height: '3px', flex: 1, background: s <= step ? BRAND.gold : 'rgba(186,117,23,0.15)', borderRadius: '10px', transition: 'background 0.4s ease', boxShadow: s <= step ? `0 0 8px rgba(186,117,23,0.4)` : 'none' }} />
            ))}
          </div>
        )}

        <div className="rca-glass" style={{ border: '1px solid rgba(186,117,23,0.18)', borderRadius: '20px', padding: submitted ? '24px' : '40px', boxShadow: '0 32px 64px rgba(0,0,0,0.3)' }}>

          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: BRAND.greenLight, letterSpacing: '2px', marginBottom: '14px' }}>SUCCESS!</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>Awesome! Ab Call Book Karo</h2>
              <p style={{ fontFamily: "'Kalam', cursive", fontSize: '16px', color: BRAND.muted, marginBottom: '24px' }}>
                Neeche diye gaye calendar se Aakash ke saath apna onboarding session schedule karo.
              </p>
              <div style={{ height: '650px', width: '100%', borderRadius: '16px', overflow: 'hidden', background: '#ffffff' }}>
                <iframe src="https://calendly.com/nirvriksh/meet-up" width="100%" height="100%" frameBorder="0" style={{ border: 'none' }} />
              </div>
            </div>
          ) : (
            <>
              {step === 1 && <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2px', marginBottom: '14px' }}>STEP 1 OF 3</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, marginBottom: '6px' }}>Apni Dukaan Ke Baare Mein Batao</h2>
            <p style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: BRAND.muted, marginBottom: '28px' }}>Basics se start karte hain.</p>
            <FormField label="Tumhara Naam *" field="name" placeholder="Jaise: Ramesh Bhai" value={form.name} onChange={update} />
            <FormField label="Dukaan Ka Naam" field="store" placeholder="Jaise: Lalita Garments" value={form.store} onChange={update} />
            <FormField label="Phone Number *" field="phone" type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={update} />
            <FormField label="City *" field="city" placeholder="Vadodara, Surat, Jaipur..." value={form.city} onChange={update} />
            <GoldBtn id="step1-next" onClick={() => { if (!form.name || !form.phone || !form.city) { setError('Naam, phone aur city zaroori hai.'); return } setError(''); setStep(2) }} style={{ width: '100%' }}>Aage Chalo →</GoldBtn>
            {error && <p style={{ fontFamily: "'Kalam', cursive", color: BRAND.accent, marginTop: '12px', fontSize: '14px' }}>{error}</p>}
          </>}

          {step === 2 && <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2px', marginBottom: '14px' }}>STEP 2 OF 3</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, marginBottom: '6px' }}>Tumhari Dukaan Kaisi Hai?</h2>
            <p style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: BRAND.muted, marginBottom: '28px' }}>Humein better help karne mein help karo.</p>
            <FormField label="Store Type" field="storeType" options={['Kapde ki dukaan (Multi-brand)', 'Ethnic / Saree Store', 'Kids Wear', "Men's Wear", "Ladies Wear", 'Mix (Sab kuch)']} value={form.storeType} onChange={update} />
            <FormField label="Monthly Revenue (Approx)" field="revenue" options={['₹1L – ₹3L', '₹3L – ₹7L', '₹7L – ₹15L', '₹15L+', 'Batana nahi chahta']} value={form.revenue} onChange={update} />
            <FormField label="Staff Count" field="staff" options={['Sirf main', '1–2 log', '3–5 log', '5+ log']} value={form.staff} onChange={update} />
            <FormField label="Billing Software?" field="software" options={['Haan — Tally', 'Haan — Vyapar', 'Haan — koi aur', 'Nahi, manually', 'Excel pe']} value={form.software} onChange={update} />
            <FormField label="Sabse Badi Problem?" field="mainProblem" options={['Stock track nahi hota', 'Staff accountable nahi', 'Dead stock zyada', 'Wrong buying decisions', 'Cashflow unclear', 'Sab kuch']} value={form.mainProblem} onChange={update} />
            <GoldBtn id="step2-next" onClick={() => setStep(3)} style={{ width: '100%' }}>Almost Done →</GoldBtn>
          </>}

          {step === 3 && <>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.gold, letterSpacing: '2px', marginBottom: '14px' }}>STEP 3 OF 3 — ALMOST DONE!</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 900, marginBottom: '6px' }}>Aakash Se Meeting Book Karo</h2>
            <p style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: BRAND.muted, marginBottom: '28px' }}>Submit karke Calendly pe time lo. 7 din free.</p>
            <FormField label="Email (Optional)" field="email" type="text" placeholder="Jaise: ramesh@gmail.com" value={form.email} onChange={update} />

            <div style={{ background: 'rgba(59,109,17,0.08)', border: '1px solid rgba(59,109,17,0.22)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: 'rgba(74,138,22,0.9)', lineHeight: 1.75 }}>
                ✅ 7-day free trial — koi charge nahi<br />
                ✅ Aakash personally onboarding karega<br />
                ✅ Pehle 3 din mein stock audit<br />
                ✅ Cancel karo — koi sawaal nahi
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: 'rgba(186,117,23,0.05)', border: '1px solid rgba(186,117,23,0.12)', borderRadius: '10px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: BRAND.muted, letterSpacing: '1px', marginBottom: '6px' }}>TUMHARI DETAILS</div>
              <div style={{ fontFamily: "'Kalam', cursive", fontSize: '14px', color: BRAND.cream, lineHeight: 1.8 }}>
                <strong>{form.name}</strong>{form.store ? ` · ${form.store}` : ''}<br />
                {form.phone} · {form.city}
                {form.storeType && <><br />{form.storeType}</>}
              </div>
            </div>

            {error && <p style={{ fontFamily: "'Kalam', cursive", color: BRAND.accent, marginBottom: '14px', fontSize: '14px' }}>{error}</p>}
            <GoldBtn id="submit-trial" onClick={handleSubmit} style={{ width: '100%', opacity: submitting ? 0.7 : 1 }} size="lg">
              {submitting ? '⏳ Saving...' : '📅 Aakash Se Milne Ka Time Lo →'}
            </GoldBtn>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: BRAND.muted, textAlign: 'center', marginTop: '14px', letterSpacing: '1px' }}>
              Submit karke tum Nirvriksh terms se agree karte ho.
            </p>
          </>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────

export default function RCALandingPage() {
  const [page, setPage] = useState('home')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [page])

  return (
    <div className="rca-root">
      {showModal && (
        <LalitaModal
          onClose={() => setShowModal(false)}
          onCaseStudy={() => { setShowModal(false); setPage('lalita') }}
          onLivePage={() => { setShowModal(false); window.open('/boutique', '_blank') }}
        />
      )}
      {page !== 'trial' && <Nav page={page} setPage={setPage} showLalitaModal={() => setShowModal(true)} />}
      {page === 'home' && <HomePage setPage={setPage} showLalitaModal={() => setShowModal(true)} />}
      {page === 'lalita' && <LalitaPage setPage={setPage} />}
      {page === 'trial' && <TrialPage setPage={setPage} />}
    </div>
  )
}
