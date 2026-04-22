import React from "react";

// --- Icon Components ---
export const SparklesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-emerald-400"
  >
    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558
             a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966
             l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558
             a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594
             l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051
             a2 2 0 0 0 1.594-1.594z"
    />
    <path d="M20 2v4" />
    <path d="M22 4h-4" />
    <circle cx="4" cy="20" r="2" />
  </svg>
);

export const BriefcaseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-blue-400"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

export const BuildingIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24" height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-purple-400"
  >
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <path d="M9 9h6v6H9z" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
  </svg>
);

const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12" height="12"
    viewBox="0 0 24 24"
    fill="hsl(240, 15%, 9%)"
    stroke="hsl(240, 15%, 9%)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export interface PricingCardProps {
  planName: string;
  description: string;
  price: string;
  priceDescription: string;
  features: string[];
  icon: React.ReactNode;
  iconBgClass: string;
  isPopular?: boolean;
  buttonText: string;
  onClick?: () => void;
  disabled?: boolean;
}

// --- PricingCard Component ---
export function PricingCard({
  planName,
  description,
  price,
  priceDescription,
  features,
  icon,
  iconBgClass,
  isPopular,
  buttonText,
  onClick,
  disabled,
}: PricingCardProps) {
  const cardStyle = {
    width: "100%",
    maxWidth: "19rem",
    backgroundColor: "hsla(240, 15%, 9%, 1)",
    backgroundImage:
      "radial-gradient(at 88% 40%, hsla(240, 15%, 9%, 1) 0px, transparent 85%)," +
      " radial-gradient(at 49% 30%, hsla(240, 15%, 9%, 1) 0px, transparent 85%)," +
      " radial-gradient(at 14% 26%, hsla(240, 15%, 9%, 1) 0px, transparent 85%)," +
      " radial-gradient(at 0% 64%, hsla(263, 93%, 56%, 1) 0px, transparent 85%)," +
      " radial-gradient(at 41% 94%, hsla(284, 100%, 84%, 1) 0px, transparent 85%)," +
      " radial-gradient(at 100% 99%, hsla(306, 100%, 57%, 1) 0px, transparent 85%)",
    boxShadow: "0px -16px 24px 0px rgba(255, 255, 255, 0.25) inset",
  };

  const borderContainerStyle = {
    overflow: "hidden",
    pointerEvents: "none",
    position: "absolute" as const,
    zIndex: "-10",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "calc(100% + 2px)",
    height: "calc(100% + 2px)",
    backgroundImage:
      "linear-gradient(0deg, hsl(0, 0%, 100%) -50%, hsl(0, 0%, 40%) 100%)",
    borderRadius: "1.5rem",
  };

  const rotatingBorderStyle = {
    content: '""',
    pointerEvents: "none",
    position: "absolute" as const,
    zIndex: "200",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(0deg)",
    transformOrigin: "left",
    width: "200%",
    height: "10rem",
    backgroundImage:
      "linear-gradient(0deg, hsla(0, 0%, 100%, 0) 0%, hsl(277, 95%, 60%) 40%, hsl(277, 95%, 60%) 60%, hsla(0, 0%, 40%, 0) 100%)",
    animation: "rotate 8s linear infinite",
  };

  return (
    <div
      className="relative hover:bg-white/[0.04] transition-all duration-300 group rounded-[1.5rem] p-6 flex flex-col mx-auto"
      style={cardStyle}
    >
      <style>{`@keyframes rotate { to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>

      {isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full whitespace-nowrap">
            RECOMMENDED
          </span>
        </div>
      )}

      <div className="flex-grow z-10">
        <div style={borderContainerStyle}>
          <div style={rotatingBorderStyle}></div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl border border-white/20 bg-gradient-to-br ${iconBgClass} flex items-center justify-center shrink-0`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-medium tracking-tight text-white leading-tight">
                {planName}
              </h3>
              <p className="text-[10px] text-neutral-300 mt-1 leading-tight">{description}</p>
            </div>
          </div>
          <div className="h-5 w-5 rounded-full border-2 border-white/30 shrink-0"></div>
        </div>

        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-white">
              {price}
            </span>
            <span className="text-sm text-neutral-400">
              {priceDescription}
            </span>
          </div>
        </div>

        <ul className="space-y-3 text-sm text-neutral-300">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex items-center justify-center w-4 h-4 bg-violet-500 rounded-full shrink-0 mt-0.5">
                <CheckIcon />
              </div>
              <span className="leading-tight">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 z-10">
        <button 
          onClick={onClick}
          disabled={disabled}
          className={`w-full py-3 rounded-lg font-bold transition-colors text-sm ${disabled ? 'bg-emerald-500/20 text-emerald-400 cursor-default' : 'bg-white text-neutral-900 hover:bg-neutral-200'}`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
