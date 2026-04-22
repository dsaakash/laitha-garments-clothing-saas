import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

export const HeroSection = ({ setPage, showLalitaModal }: any) => {
  const [fullBleed, setFullBleed] = useState(true);

  // Using a relevant unsplash image for a garment store/boutique
  const IMAGE_URL =
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=2070&ixlib=rb-4.0.3";

  return (
    <section
      className={`relative w-full overflow-hidden transition-all duration-500 ease-in-out ${
        fullBleed ? "min-h-screen" : "py-32 lg:py-40"
      }`}
    >
      {/* Height Toggle */}
      <button
        onClick={() => setFullBleed(!fullBleed)}
        aria-label={fullBleed ? "Switch to fit-to-content" : "Switch to full-bleed"}
        className="absolute top-4 right-4 z-20 p-2.5 rounded-[10px] backdrop-blur-xl border border-[rgba(186,117,23,0.5)] bg-[rgba(13,27,46,0.6)] text-white hover:bg-[rgba(13,27,46,0.8)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BA7517]"
      >
        {fullBleed ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      {/* Image Background */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img
          src={IMAGE_URL}
          alt="Lalitha Garments Store"
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B2E]/80 via-transparent to-[#0D1B2E]/90" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center text-center mt-32 px-6">
        {/* Tagline Pill */}
        <div className="inline-flex items-center gap-2.5 h-[38px] px-3.5 rounded-[10px] backdrop-blur-xl border border-[rgba(186,117,23,0.5)] bg-[rgba(13,27,46,0.6)] shadow-[0_0_20px_rgba(186,117,23,0.15),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="bg-[#BA7517] text-[#0D1B2E] font-mono font-bold text-xs px-2.5 py-1 rounded-[6px] shadow-[0_0_8px_rgba(186,117,23,0.4)]">
            Retail Control Architect
          </span>
          <span className="font-sans font-medium text-sm text-[#FDF8EF] tracking-wide">
            India&apos;s #1 Stock System for Garment Stores
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-[#FDF8EF] text-5xl lg:text-[76px] leading-[1.08] font-black tracking-[-0.02em] mt-8 max-w-4xl drop-shadow-lg">
          Tumhari Dukaan Mein{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4921E] to-[#BA7517]">Kitna Stock</span>{' '}
          Hai — Sach Mein?
        </h1>

        {/* Subtext */}
        <p className="font-sans font-normal text-lg text-[rgba(253,248,239,0.8)] mt-6 max-w-[662px] leading-relaxed drop-shadow">
          80% kapde ki dukaan walon ko apna actual, live stock pata hi nahi hota. Aur ye &quot;pata nahi&quot; — silently lakhs drain kar raha hai. Har mahine.
        </p>

        <p className="font-sans font-medium text-base text-[#BA7517] mt-4 max-w-[662px] italic">
          ✦ Vadodara mein ek store ne 45 din mein ₹3.2 lakh recover kiye — sirf system change karke.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-8">
          <button
            onClick={() => setPage('trial')}
            className="px-8 py-3.5 rounded-[10px] bg-gradient-to-br from-[#D4921E] to-[#BA7517] text-[#0D1B2E] font-serif font-bold text-lg hover:scale-105 transition-all shadow-[0_12px_32px_rgba(186,117,23,0.45)]"
          >
            🚀 7 Din Free Try Karo
          </button>
          <button
            onClick={showLalitaModal}
            className="px-8 py-3.5 rounded-[10px] bg-[rgba(253,248,239,0.05)] border-[1.5px] border-[rgba(253,248,239,0.15)] text-[#FDF8EF] font-sans font-medium text-base hover:bg-[rgba(186,117,23,0.1)] hover:border-[#BA7517] hover:text-[#BA7517] transition-all backdrop-blur-md"
          >
            📖 Lalita Garments Case Study
          </button>
        </div>
      </div>
    </section>
  );
};
