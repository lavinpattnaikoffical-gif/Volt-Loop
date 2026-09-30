import React from "react";
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
  Search,
  Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col w-full bg-[#f4fbf4] text-[#161d19]">
      {/* Split Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headline & Value Proposition */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 bg-[#e3eae3] px-4 py-1.5 rounded-full w-max">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006c49] animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#3c4a42]">
              Peer-to-Peer EV Network
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#161d19] leading-[1.1]">
            Your next charger might already be someone&apos;s home.
          </h1>

          <p className="text-base sm:text-lg text-[#3c4a42] max-w-xl leading-relaxed">
            Access private Level 2 and AC wallboxes in residential driveways and secure lots across your journey. Cheaper, dependable, and always nearby.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/explore"
              className="px-6 py-3.5 bg-[#006c49] text-white rounded-xl text-sm font-semibold hover:bg-[#005236] transition-colors shadow-sm flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Find a Charger</span>
            </Link>

            <Link
              href="/ai"
              className="px-6 py-3.5 bg-[#82f5c1] text-[#00422b] rounded-xl text-sm font-black hover:bg-[#6eeab3] transition-colors shadow-sm flex items-center gap-2 border border-[#006c49]/20"
            >
              <Sparkles className="w-4 h-4 text-[#006c49]" />
              <span>AI Trip Planner</span>
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-medium text-[#3c4a42]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#006c49]" />
              <span>Verified Hosts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#006c49]" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-[#006c49]" />
              <span>Live Database Availability</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Concept Card */}
        <div className="lg:col-span-5 relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-[#10b981]/15 via-transparent to-[#82f5c1]/20 rounded-3xl blur-2xl -z-10" />
          <div className="bg-white rounded-2xl shadow-lg border border-[#dde4dd] overflow-hidden p-4 flex flex-col gap-4 relative">
            <div
              className="h-64 w-full bg-cover bg-center rounded-xl relative overflow-hidden flex items-end p-4"
              style={{
                backgroundImage: "url('/home-charger.jpg')",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="relative z-10 text-white flex justify-between items-end w-full">
                <div>
                  <span className="text-[11px] bg-[#006c49] text-white px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Community Concept
                  </span>
                  <h3 className="text-lg font-bold mt-1 text-white">7.2 kW Fast AC Charge</h3>
                  <p className="text-xs text-white/80">Residential Driveway • Type 2 AC</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-[#82f5c1]">100%</span>
                  <p className="text-[11px] text-white/80 font-mono">Overnight Ready</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#eef6ee] p-3 rounded-xl text-center">
                <span className="text-xs text-[#3c4a42] block">Average Speed</span>
                <p className="text-sm font-bold text-[#161d19]">7.2 kW AC</p>
              </div>
              <div className="bg-[#eef6ee] p-3 rounded-xl text-center">
                <span className="text-xs text-[#3c4a42] block">Overnight Range</span>
                <p className="text-sm font-bold text-[#006c49]">+250 km</p>
              </div>
              <div className="bg-[#eef6ee] p-3 rounded-xl text-center">
                <span className="text-xs text-[#3c4a42] block">Host Control</span>
                <p className="text-sm font-bold text-[#161d19]">100%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Narrative Problem Section */}
      <section className="py-16 bg-[#eef6ee] border-y border-[#dde4dd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#161d19] tracking-tight mb-4">
              Charging infrastructure shouldn&apos;t stop where the highway ends.
            </h2>
            <p className="text-[#3c4a42] text-sm sm:text-base leading-relaxed">
              Fast-charging stations flourish on expressways. But what happens when you turn off the highway towards rural homestays or tier-2 destinations? Private wallboxes already sit quietly in thousands of driveways—waiting to be unlocked.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white border border-[#dde4dd] rounded-2xl p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mb-4">
                <Car className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#161d19] mb-2">For EV Drivers</h3>
              <p className="text-xs sm:text-sm text-[#3c4a42] leading-relaxed mb-4">
                Find reliable overnight charging where traditional commercial infrastructure may not exist. Wake up with a full battery, zero range anxiety, and no waiting in queues.
              </p>
              <ul className="space-y-2 text-xs text-[#3c4a42]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                  Reserved overnight slot booking with transparent pricing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                  AI compatibility check with your specific EV model &amp; onboard AC limits
                </li>
              </ul>
            </div>

            <div className="bg-white border border-[#dde4dd] rounded-2xl p-7 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mb-4">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#161d19] mb-2">For Charger Hosts</h3>
              <p className="text-xs sm:text-sm text-[#3c4a42] leading-relaxed mb-4">
                Recover your charger installation investment by sharing it during idle night hours. Set your own availability and earn effortless passive revenue.
              </p>
              <ul className="space-y-2 text-xs text-[#3c4a42]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                  Monetize idle overnight capacity on your own terms
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
                  Full host control: set electricity rates, host fees, and schedule
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Powered by AI Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e3eae3] text-[#006c49] text-xs font-bold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Smart Charging Intelligence</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#161d19] tracking-tight mb-3">
            Powered by Purposeful AI
          </h2>
          <p className="text-[#3c4a42] text-sm sm:text-base">
            AI must not be decorative. At VoltLoop, every AI capability solves a genuine engineering or marketplace trust bottleneck.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm hover:border-[#006c49] transition">
            <div className="w-10 h-10 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-[#006c49]" />
            </div>
            <h3 className="text-base font-bold text-[#161d19] mb-2">AI ChargePilot</h3>
            <p className="text-xs text-[#3c4a42] leading-relaxed mb-4">
              Evaluates battery state-of-charge, route feasibility, and real community chargers from your database.
            </p>
            <Link
              href="/ai"
              className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1"
            >
              Launch ChargePilot →
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm hover:border-[#006c49] transition">
            <div className="w-10 h-10 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-[#006c49]" />
            </div>
            <h3 className="text-base font-bold text-[#161d19] mb-2">AI-Assisted Verification</h3>
            <p className="text-xs text-[#3c4a42] leading-relaxed mb-4">
              Vision models scan host wallbox photos to detect EV connectors, wiring, and installation integrity before admin approval.
            </p>
            <Link
              href="/explore"
              className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1"
            >
              See Verified Chargers →
            </Link>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm hover:border-[#006c49] transition">
            <div className="w-10 h-10 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mb-4">
              <Clock className="w-5 h-5 text-[#006c49]" />
            </div>
            <h3 className="text-base font-bold text-[#161d19] mb-2">Deterministic Calculations</h3>
            <p className="text-xs text-[#3c4a42] leading-relaxed mb-4">
              Zero hallucinated charging numbers. Physics-grounded 90% onboard conversion efficiency calculates precise hours and costs.
            </p>
            <Link
              href="/explore"
              className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1"
            >
              Explore Network →
            </Link>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm hover:border-[#006c49] transition">
            <div className="w-10 h-10 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mb-4">
              <Compass className="w-5 h-5 text-[#006c49]" />
            </div>
            <h3 className="text-base font-bold text-[#161d19] mb-2">Natural Search Parser</h3>
            <p className="text-xs text-[#3c4a42] leading-relaxed mb-4">
              Converts conversational inputs into structured PostgreSQL queries against verified community chargers.
            </p>
            <Link
              href="/explore"
              className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1"
            >
              Try Natural Query →
            </Link>
          </div>
        </div>
      </section>

      {/* The Product Loop: How VoltLoop Works */}
      <section className="py-16 bg-[#eef6ee] border-t border-[#dde4dd]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-[#161d19] mb-2">
            The Community Charging Network
          </h2>
          <p className="text-xs text-[#3c4a42] uppercase tracking-wider font-semibold mb-10">
            Real Infrastructure • Verified Hosts • Transparent Overnight AC Charging
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
            <div className="bg-white p-6 rounded-2xl border border-[#dde4dd] shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#eef6ee] text-[#006c49] font-black text-sm flex items-center justify-center mb-3">
                1
              </span>
              <h3 className="font-bold text-sm text-[#161d19] mb-1">Host Lists Charger</h3>
              <p className="text-xs text-[#3c4a42] leading-relaxed">
                Homeowners configure location, AC power (3.3 - 22 kW), and overnight availability windows.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#dde4dd] shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#eef6ee] text-[#006c49] font-black text-sm flex items-center justify-center mb-3">
                2
              </span>
              <h3 className="font-bold text-sm text-[#161d19] mb-1">AI &amp; Admin Verification</h3>
              <p className="text-xs text-[#3c4a42] leading-relaxed">
                Vision models inspect physical equipment, connector pins, and administrative safety reviews.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#dde4dd] shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#eef6ee] text-[#006c49] font-black text-sm flex items-center justify-center mb-3">
                3
              </span>
              <h3 className="font-bold text-sm text-[#161d19] mb-1">Driver Discovers &amp; Books</h3>
              <p className="text-xs text-[#3c4a42] leading-relaxed">
                Travelers book guaranteed overnight slots matched to their EV battery capacity and range needs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-[#dde4dd] shadow-sm">
              <span className="w-8 h-8 rounded-full bg-[#eef6ee] text-[#006c49] font-black text-sm flex items-center justify-center mb-3">
                4
              </span>
              <h3 className="font-bold text-sm text-[#161d19] mb-1">Charge &amp; Grow Community</h3>
              <p className="text-xs text-[#3c4a42] leading-relaxed">
                Wake up with full battery, transparent settlement, and authentic driver reviews.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
