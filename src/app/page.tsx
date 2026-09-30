"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  Compass,
  Sparkles,
  MapPin,
  Clock,
  Coins,
  Cpu,
  Car,
  CheckCircle2,
  BatteryCharging,
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronRight,
} from "lucide-react";

const DEMO_VEHICLES = [
  {
    name: "Tata Nexon EV",
    battery: "40.5 kWh",
    speed: "7.2 kW AC",
    duration: "3.8 hrs",
    estCost: "₹210",
    dcCost: "₹680",
    saved: "₹470",
  },
  {
    name: "MG ZS EV",
    battery: "50.3 kWh",
    speed: "7.4 kW AC",
    duration: "4.5 hrs",
    estCost: "₹260",
    dcCost: "₹840",
    saved: "₹580",
  },
  {
    name: "Mahindra XUV400",
    battery: "39.4 kWh",
    speed: "7.2 kW AC",
    duration: "3.7 hrs",
    estCost: "₹205",
    dcCost: "₹660",
    saved: "₹455",
  },
];

export default function LandingPage() {
  const [selectedVehicleIdx, setSelectedVehicleIdx] = useState(0);
  const activeCar = DEMO_VEHICLES[selectedVehicleIdx];

  return (
    <div className="flex flex-col w-full text-[#ededed]">
      {/* Vercel-style Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24">
        {/* Subtle radial light cone from top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none -z-10" />

        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-14">
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#262626] bg-[#0a0a0a] text-xs font-mono text-[#a1a1a1] mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Community EV Infrastructure</span>
            <span className="text-[#404040]">|</span>
            <span className="text-white">300+ Verified Chargers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] mb-6">
            Your next charger might already be someone&apos;s home.
          </h1>

          <p className="text-base sm:text-xl text-[#a1a1a1] max-w-2xl leading-relaxed mb-8">
            Access private Level 2 AC wallboxes in residential driveways and homestays. Cheaper, dependable overnight charging without the queues.
          </p>

          {/* Action Buttons (Vercel Style: Solid White + Outlined Black) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/explore"
              className="px-5 py-2.5 bg-white text-black hover:bg-[#d4d4d4] font-medium text-sm rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>Find a Charger</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>

            <Link
              href="/ai"
              className="px-5 py-2.5 bg-[#0a0a0a] hover:bg-[#141414] text-[#ededed] hover:text-white border border-[#262626] hover:border-[#404040] font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#0070f3]" />
              <span>AI Trip Planner</span>
            </Link>

            <Link
              href="/host/list"
              className="px-4 py-2.5 text-[#a1a1a1] hover:text-white text-sm font-medium transition-colors"
            >
              Host a charger →
            </Link>
          </div>
        </div>

        {/* Live Interactive EV Simulator Card (Vercel Clean Minimal Card) */}
        <div className="max-w-3xl mx-auto vercel-card p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#222222] mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#a1a1a1]">
                Interactive Simulator
              </span>
            </div>
            <span className="text-xs font-mono text-[#888888] bg-[#141414] px-2.5 py-0.5 rounded border border-[#262626]">
              7.2 kW AC Wallbox
            </span>
          </div>

          {/* Vehicle Selector Tabs */}
          <div className="flex items-center gap-1.5 mb-6 p-1 bg-[#141414] rounded-lg border border-[#262626]">
            {DEMO_VEHICLES.map((v, i) => (
              <button
                key={v.name}
                onClick={() => setSelectedVehicleIdx(i)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedVehicleIdx === i
                    ? "bg-[#262626] text-white shadow-sm"
                    : "text-[#888888] hover:text-white"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* Specs & Calculations */}
          <div className="bg-[#000000] rounded-xl p-5 border border-[#222222] mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">{activeCar.name}</h3>
                <p className="text-xs text-[#888888] font-mono">Pack Capacity: {activeCar.battery}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#888888] block">Charging Speed</span>
                <span className="text-sm font-mono font-medium text-white">{activeCar.speed}</span>
              </div>
            </div>

            {/* Battery Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-[#888888]">Overnight SOC: 20% → 90%</span>
                <span className="text-emerald-400 font-medium">~{activeCar.duration}</span>
              </div>
              <div className="w-full h-2 bg-[#171717] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[88%]" />
              </div>
            </div>
          </div>

          {/* 3 Metric Pillars */}
          <div className="grid grid-cols-3 gap-3 mb-6 text-center">
            <div className="p-3 bg-[#111111] rounded-lg border border-[#222222]">
              <span className="text-xs text-[#888888] block mb-1">VoltLoop AC</span>
              <span className="text-base font-bold text-white font-mono">{activeCar.estCost}</span>
            </div>
            <div className="p-3 bg-[#111111] rounded-lg border border-[#222222]">
              <span className="text-xs text-[#888888] block mb-1">Public Fast DC</span>
              <span className="text-base font-medium text-[#666666] line-through font-mono">{activeCar.dcCost}</span>
            </div>
            <div className="p-3 bg-[#141414] rounded-lg border border-emerald-900/40">
              <span className="text-xs text-emerald-400 block mb-1 font-medium">You Save</span>
              <span className="text-base font-bold text-emerald-400 font-mono">+{activeCar.saved}</span>
            </div>
          </div>

          <Link
            href="/explore"
            className="w-full py-2.5 bg-white text-black hover:bg-[#d4d4d4] font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>Browse chargers compatible with {activeCar.name}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* Metrics Row (Vercel-style clean numbers) */}
      <section className="border-y border-[#262626] bg-[#000000] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-2">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">300+</span>
              <p className="text-xs text-[#888888] mt-1 font-mono">Verified Wallboxes</p>
            </div>
            <div className="p-2">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">₹180</span>
              <p className="text-xs text-[#888888] mt-1 font-mono">Avg Session Cost</p>
            </div>
            <div className="p-2">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400 tracking-tight font-mono">~50%</span>
              <p className="text-xs text-[#888888] mt-1 font-mono">Saved vs Fast DC</p>
            </div>
            <div className="p-2">
              <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">18-20 hrs</span>
              <p className="text-xs text-[#888888] mt-1 font-mono">Daily Idle Time Unlocked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Side-by-Side Comparison */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono text-[#888888] uppercase tracking-wider block mb-2">
            The Difference
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-3">
            Built for highway peace of mind.
          </h2>
          <p className="text-sm text-[#a1a1a1]">
            Commercial fast chargers degrade your battery cells and create long queues. Private AC charging offers gentle overnight refills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Public DC Station Card */}
          <div className="vercel-card p-6 border-[#222222]">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h3 className="text-sm font-semibold text-white">Commercial Fast DC Stations</h3>
            </div>
            <ul className="space-y-3 text-xs text-[#a1a1a1]">
              <li className="flex items-start gap-2">
                <span className="text-[#666666] font-mono">01</span>
                <span>Expensive commercial tariffs: ₹20–₹28 per kWh plus parking surcharges.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#666666] font-mono">02</span>
                <span>Unpredictable 45+ minute queues and frequent hardware connector downtime.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#666666] font-mono">03</span>
                <span>Rarely situated near scenic rural homestays or off-expressway towns.</span>
              </li>
            </ul>
          </div>

          {/* VoltLoop Community Network Card */}
          <div className="vercel-card p-6 border-[#333333] bg-[#0d0d0d]">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-semibold text-white">VoltLoop Community AC</h3>
            </div>
            <ul className="space-y-3 text-xs text-[#a1a1a1]">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">01</span>
                <span>Transparent electricity tariffs: ₹8–₹14/kWh with transparent host fees.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">02</span>
                <span>Guaranteed reserved driveway slot. Plug in overnight and wake up at 90%+.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">03</span>
                <span>Gentle 7.2 kW AC power ensures zero cell heating and protects battery health.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI Features Minimal Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#262626]">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono text-[#888888] uppercase tracking-wider block mb-2">
            Intelligence
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Deterministic physics meets Gemini AI.
          </h2>
          <p className="text-xs sm:text-sm text-[#a1a1a1]">
            Accurate calculations based on real vehicle specs, not hallucinated estimates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div className="vercel-card p-5">
            <Sparkles className="w-4 h-4 text-[#0070f3] mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1.5">AI Trip Planner</h3>
            <p className="text-xs text-[#888888] leading-relaxed mb-4">
              Evaluates battery SOC, onboard AC limits, and corridor distance to rank compatible hosts.
            </p>
            <Link href="/ai" className="text-xs font-medium text-white hover:underline flex items-center gap-1">
              Launch Trip Planner →
            </Link>
          </div>

          <div className="vercel-card p-5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1.5">Vision Hardware Verification</h3>
            <p className="text-xs text-[#888888] leading-relaxed mb-4">
              Inspects host installation photos for Type 2 connectors, proper earthing, and safety switches.
            </p>
            <Link href="/explore" className="text-xs font-medium text-white hover:underline flex items-center gap-1">
              View Verified Wallboxes →
            </Link>
          </div>

          <div className="vercel-card p-5">
            <Clock className="w-4 h-4 text-[#ededed] mb-3" />
            <h3 className="text-sm font-semibold text-white mb-1.5">90% Conversion Model</h3>
            <p className="text-xs text-[#888888] leading-relaxed mb-4">
              Calculates exact energy draw and duration using real EV onboard AC converter limits.
            </p>
            <Link href="/ai" className="text-xs font-medium text-white hover:underline flex items-center gap-1">
              Test Calculations →
            </Link>
          </div>
        </div>
      </section>

      {/* Host CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="vercel-card p-8 sm:p-12 text-center max-w-3xl mx-auto border-[#333333]">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
            Have a home charger? Start earning.
          </h2>
          <p className="text-xs sm:text-sm text-[#a1a1a1] max-w-lg mx-auto mb-6 leading-relaxed">
            EV owners earn ₹4,000–₹12,000 monthly by sharing idle 7.2 kW or 11 kW wallboxes overnight with verified travelers.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/host/list"
              className="px-4 py-2 bg-white text-black hover:bg-[#d4d4d4] font-medium text-xs sm:text-sm rounded-lg transition-colors"
            >
              List Your Wallbox
            </Link>
            <Link
              href="/dashboard?tab=host"
              className="px-4 py-2 bg-[#171717] hover:bg-[#222222] text-[#ededed] border border-[#262626] font-medium text-xs sm:text-sm rounded-lg transition-colors"
            >
              Host Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
