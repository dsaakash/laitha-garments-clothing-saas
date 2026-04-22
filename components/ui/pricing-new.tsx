"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { BriefcaseIcon, SparklesIcon, BuildingIcon, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState } from "react";

export interface PlanData {
  name: string;
  description: string;
  price: number;
  yearlyPrice: number;
  buttonText: string;
  buttonVariant: "default" | "outline";
  popular?: boolean;
  features: { text: string; icon: React.ReactNode }[];
  includes: string[];
  onAction?: (isYearly: boolean) => void;
  disabled?: boolean;
}

const PricingSwitch = ({
  onSwitch,
  className,
}: {
  onSwitch: (value: string) => void;
  className?: string;
}) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="relative z-10 mx-auto flex w-fit rounded-xl bg-neutral-900 border border-neutral-800 p-1">
        <button
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 w-fit cursor-pointer h-12 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm",
            selected === "0"
              ? "text-white"
              : "text-neutral-400 hover:text-white",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0  h-12 w-full rounded-xl border border-blue-500/50 bg-blue-500/20"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly Billing</span>
        </button>

        <button
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 w-fit cursor-pointer h-12 flex-shrink-0 rounded-xl sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors sm:text-base text-sm",
            selected === "1"
              ? "text-white"
              : "text-neutral-400 hover:text-white",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0  h-12 w-full rounded-xl border border-blue-500/50 bg-blue-500/20"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Yearly Billing
            <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-xs font-medium text-blue-400">
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default function ModernPricingSection({ plans }: { plans: PlanData[] }) {
  const [isYearly, setIsYearly] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  const togglePricingPeriod = (value: string) =>
    setIsYearly(Number.parseInt(value) === 1);

  return (
    <div
      className="px-4 py-12 w-full mx-auto relative"
      ref={pricingRef}
    >
      <article className="text-center mb-12 space-y-6 flex flex-col items-center">
        <h2 className="md:text-5xl text-4xl capitalize font-black text-white mb-4">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            Upgrade Your Intelligence
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="md:text-lg text-sm text-neutral-400 w-full max-w-2xl mx-auto"
        >
          Choose the plan that fits the size and speed of your garment business. Expand operations effortlessly.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="mt-8"
        >
          <PricingSwitch onSwitch={togglePricingPeriod} className="w-fit" />
        </TimelineContent>
      </article>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto relative z-10">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card
              className={cn(
                "relative h-full border overflow-hidden transition-all duration-300",
                plan.popular
                  ? "border-blue-500/50 bg-neutral-900/80 shadow-[0_0_30px_rgba(59,130,246,0.15)]"
                  : "border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/60"
              )}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 p-4 z-20">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-left relative z-10 p-8 pb-6 border-b border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-black text-white">
                    {plan.name}
                  </h3>
                </div>
                <p className="text-sm text-neutral-400 mb-6 h-10">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white flex items-center">
                    ₹
                    <NumberFlow
                      format={{
                        style: "decimal",
                      }}
                      value={isYearly ? plan.yearlyPrice : plan.price}
                      className="text-5xl font-black ml-1"
                    />
                  </span>
                  <span className="text-neutral-500 text-sm font-medium">
                    /{isYearly ? "year" : "month"}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-6 relative z-10">
                <button
                  onClick={() => plan.onAction?.(isYearly)}
                  disabled={plan.disabled}
                  className={cn(
                    "w-full mb-8 p-4 text-base font-bold rounded-xl transition-all duration-300",
                    plan.disabled 
                      ? "bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed opacity-70"
                      : plan.popular
                        ? "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-blue-400"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  )}
                >
                  {plan.buttonText}
                </button>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-white uppercase tracking-wider">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-3">
                    {plan.includes.slice(1).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <span className="h-5 w-5 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCheck className="h-3 w-3 text-blue-400" />
                        </span>
                        <span className="text-sm text-neutral-300 leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>
    </div>
  );
}
