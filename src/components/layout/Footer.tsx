import React from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { Zap, ShieldCheck, Cpu, Database, MapPin, Heart, Sparkles, Navigation } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#dde4dd] bg-[#0d131f] text-slate-400">
      {/* Community Charging Network Mission Banner */}
      <div className="border-b border-slate-800/80 bg-gradient-to-b from-[#111927] to-[#0d131f] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Decentralized Mobility Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              We Don&apos;t Build More Chargers. We Unlock The Chargers That Already Exist.
            </h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto mt-1.5">
              Empowering residential EV owners to share idle 7.2 kW &amp; 11 kW AC chargers with highway travelers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-2">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Hosts List Driveway Wallboxes</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Homeowners list their private Level 2 AC chargers, setting transparent electricity tariffs and access hours.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-sm mb-2">
                2
              </div>
              <h4 className="text-sm font-bold text-white">AI-Assisted Verification</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every listing is verified with AI vision hardware inspection and admin review to guarantee safe charging.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-1.5">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-sm mb-2">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Gentle Overnight Charging</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drivers reserve guaranteed slots, wake up to 100% battery with zero cell degradation, saving 50% vs DC stations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-black">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-lg font-black text-white">{SITE_CONFIG.name}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              {SITE_CONFIG.mission}
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1 text-emerald-400">
                <Database className="w-3.5 h-3.5" />
                Supabase
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-cyan-400">
                <Sparkles className="w-3.5 h-3.5" />
                Google Gemini
              </span>
            </div>
          </div>

          {/* Core Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Explore &amp; Book
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="hover:text-emerald-400 transition">
                  Community Charger Map
                </Link>
              </li>
              <li>
                <Link href="/ai" className="hover:text-emerald-400 transition">
                  AI ChargePilot Trip Planner
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition">
                  Driver Bookings &amp; Fleet
                </Link>
              </li>
            </ul>
          </div>

          {/* Charger Hosts */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              For Charger Hosts
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/host/list" className="hover:text-emerald-400 transition">
                  List Your Home AC Charger
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition">
                  Host Earnings Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition">
                  Admin Verification Layer
                </Link>
              </li>
            </ul>
          </div>

          {/* Production Architecture */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              System Architecture
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Built on Next.js 16, Supabase PostgreSQL with Row Level Security (RLS), and Google Gemini AI multimodal reasoning.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real Database Verified</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 {SITE_CONFIG.name} — Community EV Charging Infrastructure.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" /> for Indian EV Travelers
          </p>
        </div>
      </div>
    </footer>
  );
}
