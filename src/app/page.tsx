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
  Shield,
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
    <div className="flex flex-col w-full text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 lg:py-28">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 w-max">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Peer-to-Peer EV Infrastructure
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Your next charger might already be someone&apos;s{" "}
              <span className="text-gradient-emerald">home.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Access private Level 2 AC wallboxes in residential driveways and secure homestays across highway corridors. Cheaper, dependable, and always nearby.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/explore"
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-sm font-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Find a Charger</span>
              </Link>

              <Link
                href="/ai"
                className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-sm font-bold border border-slate-700/80 hover:border-emerald-500/40 shadow-sm transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI Trip Planner</span>
              </Link>

              <Link
                href="/host/list"
                className="px-5 py-3.5 text-slate-400 hover:text-emerald-400 text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>List your charger</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Hosts &amp; Hardware</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>300+ Pre-Seeded Stations</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-teal-400" />
                <span>Save ~50% vs Commercial DC</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive EV Simulation Card */}
          <div className="lg:col-span-5 relative">
            <div className="glass-card rounded-3xl p-6 relative overflow-hidden border border-slate-800">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Live Overnight Simulation
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                  Type 2 AC Wallbox
                </span>
              </div>

              {/* Vehicle Selector Tabs */}
              <div className="flex items-center gap-2 mb-5 p-1 bg-slate-900/90 rounded-xl border border-slate-800">
                {DEMO_VEHICLES.map((v, i) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedVehicleIdx(i)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      selectedVehicleIdx === i
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {v.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              {/* Vehicle Specs Display */}
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">{activeCar.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">Battery: {activeCar.battery}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Charging Rate</span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">{activeCar.speed}</span>
                  </div>
                </div>

                {/* Battery Visual Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">SOC: 20% → 90%</span>
                    <span className="text-emerald-400 font-bold">~{activeCar.duration} overnight</span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                    <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full w-[90%] shadow-[0_0_12px_#10b981]" />
                  </div>
                </div>
              </div>

              {/* Cost & Savings Comparison */}
              <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">VoltLoop AC</span>
                  <span className="text-sm font-black text-emerald-400">{activeCar.estCost}</span>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Commercial DC</span>
                  <span className="text-sm font-bold text-slate-400 line-through">{activeCar.dcCost}</span>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30">
                  <span className="text-[11px] text-emerald-400 block mb-0.5 font-bold">You Save</span>
                  <span className="text-sm font-black text-emerald-300">+{activeCar.saved}</span>
                </div>
              </div>

              {/* Instant Action */}
              <Link
                href="/explore"
                className="w-full py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <span>Find chargers compatible with {activeCar.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Ticker Section */}
      <section className="border-y border-slate-800 bg-[#070b14]/70 backdrop-blur-md py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-3">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">300+</span>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Pre-Seeded Wallboxes
              </p>
            </div>
            <div className="p-3">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">₹180</span>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Avg Overnight Session
              </p>
            </div>
            <div className="p-3">
              <span className="text-3xl sm:text-4xl font-black text-teal-400 tracking-tight">50%</span>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Savings vs DC Fast
              </p>
            </div>
            <div className="p-3">
              <span className="text-3xl sm:text-4xl font-black text-cyan-400 tracking-tight">18-20 hrs</span>
              <p className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                Daily Idle Hardware Reclaimed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Infrastructure Gap: Visual Contrast */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>The Decentralized Advantage</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
            Commercial DC Stations vs. VoltLoop Community AC
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Fast chargers are great on expressways, but they degrade battery packs and leave EV travelers stranded away from tier-1 hubs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Public DC Stations */}
          <div className="glass-card rounded-3xl p-7 border border-rose-500/20 bg-slate-900/40 relative">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-sm mb-4 border border-rose-500/20">
              ✕
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Commercial DC Fast Stations</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              High queue times, expensive tariffs, and severe battery cell heating during long road trips.
            </p>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Expensive tariffs: ₹20–₹28 per kWh plus parking markups.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Broken gun connectors &amp; 45+ minute queue times on peak weekends.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-400 font-bold shrink-0">✕</span>
                <span>Rarely available outside major expressways or inside scenic rural valleys.</span>
              </li>
            </ul>
          </div>

          {/* VoltLoop Community Network */}
          <div className="glass-card rounded-3xl p-7 border border-emerald-500/30 bg-slate-900/60 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm mb-4 border border-emerald-500/30">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white mb-2">VoltLoop Community AC Network</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Guaranteed overnight plug-ins, gentle thermal curve, and peaceful sleep at verified homestays.
            </p>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Fair, transparent pricing: ₹8–₹14/kWh with host approval.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Zero battery cell degradation: Gentle 7.2 kW – 11 kW AC charging overnight.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>Pre-booked guaranteed driveway slots without waiting in public lines.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Purposeful AI Showcase */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Google Gemini Integrated</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Smart Charging Intelligence
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            VoltLoop pairs deterministic physics calculations with Gemini AI to guarantee safe, optimal charging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI ChargePilot</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Analyzes vehicle battery SOC, onboard AC limits, and corridor distance to rank the top community chargers.
              </p>
            </div>
            <Link
              href="/ai"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Launch ChargePilot →
            </Link>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">AI-Assisted Verification</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Vision models inspect host installation photos for earthing, Type 2 connectors, and safety switches.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              See Verified Chargers →
            </Link>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-4 border border-teal-500/20">
                <Clock className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Deterministic Physics</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Zero hallucinated numbers. Deterministic 90% onboard conversion calculates exact charge duration and costs.
              </p>
            </div>
            <Link
              href="/ai"
              className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
            >
              View Formula Engine →
            </Link>
          </div>

          {/* Card 4 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
                <Compass className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Natural Search Parser</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Type queries like &ldquo;Pune to Kolhapur under ₹300&rdquo; and let Gemini structure filters instantly.
              </p>
            </div>
            <Link
              href="/explore"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              Try Natural Query →
            </Link>
          </div>
        </div>
      </section>

      {/* Host CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4 inline-block">
              Host Community
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4">
              Have an idle home charger? Turn it into a reliable income stream.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              Homeowners earn ₹4,000–₹12,000 monthly by sharing 7.2 kW or 11 kW wallboxes overnight with verified travelers. You set the rules, schedule, and tariffs.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/host/list"
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
              >
                List Your Charger Now
              </Link>
              <Link
                href="/dashboard?tab=host"
                className="px-6 py-3 bg-slate-800/80 hover:bg-slate-700 text-white font-bold rounded-xl text-sm border border-slate-700 transition-all"
              >
                Host Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
