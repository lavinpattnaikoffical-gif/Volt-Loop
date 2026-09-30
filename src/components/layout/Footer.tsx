import React from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { Zap, ShieldCheck, Database, Sparkles, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#262626] bg-black text-[#888888]">
      {/* Community Mission Banner (Vercel Style) */}
      <div className="border-b border-[#262626] bg-[#0a0a0a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-xs font-mono text-[#a1a1a1] mb-3">
              <Zap className="w-3 h-3 text-white" />
              <span>Decentralized Mobility Network</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              We Don&apos;t Build More Chargers. We Unlock The Chargers That Already Exist.
            </h3>
            <p className="text-xs text-[#888888] max-w-xl mx-auto mt-2 leading-relaxed">
              Empowering residential EV owners to share idle 7.2 kW &amp; 11 kW AC chargers with highway travelers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="vercel-card p-5">
              <span className="text-xs font-mono text-[#666666] block mb-2">01 / DISCOVERY</span>
              <h4 className="text-sm font-semibold text-white mb-1">Hosts List Driveway Wallboxes</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Homeowners list their private Level 2 AC chargers, setting transparent electricity tariffs and access hours.
              </p>
            </div>

            <div className="vercel-card p-5">
              <span className="text-xs font-mono text-[#666666] block mb-2">02 / VERIFICATION</span>
              <h4 className="text-sm font-semibold text-white mb-1">AI-Assisted Verification</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Every listing is verified with AI vision hardware inspection and admin review to guarantee safe charging.
              </p>
            </div>

            <div className="vercel-card p-5">
              <span className="text-xs font-mono text-[#666666] block mb-2">03 / CHARGE</span>
              <h4 className="text-sm font-semibold text-white mb-1">Gentle Overnight Charging</h4>
              <p className="text-xs text-[#888888] leading-relaxed">
                Drivers reserve guaranteed slots, wake up to 90%+ battery with zero cell degradation, saving 50% vs DC stations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold">
                <Zap className="w-3.5 h-3.5 fill-black" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">{SITE_CONFIG.name}</span>
            </div>
            <p className="text-xs leading-relaxed text-[#888888]">
              {SITE_CONFIG.mission}
            </p>
            <div className="flex items-center gap-2.5 pt-1 text-xs text-[#666666] font-mono">
              <span className="flex items-center gap-1 text-[#a1a1a1]">
                <Database className="w-3 h-3" />
                Supabase
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#a1a1a1]">
                <Sparkles className="w-3 h-3" />
                Gemini
              </span>
            </div>
          </div>

          {/* Core Platform */}
          <div>
            <h4 className="text-xs font-mono text-white uppercase tracking-wider mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  Community Charger Map
                </Link>
              </li>
              <li>
                <Link href="/ai" className="hover:text-white transition-colors">
                  AI ChargePilot Trip Planner
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Driver Bookings &amp; Garage
                </Link>
              </li>
            </ul>
          </div>

          {/* Charger Hosts */}
          <div>
            <h4 className="text-xs font-mono text-white uppercase tracking-wider mb-3">
              Hosts
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/host/list" className="hover:text-white transition-colors">
                  List Your Wallbox
                </Link>
              </li>
              <li>
                <Link href="/dashboard?tab=host" className="hover:text-white transition-colors">
                  Host Dashboard
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Admin Verification Layer
                </Link>
              </li>
            </ul>
          </div>

          {/* Production Architecture */}
          <div>
            <h4 className="text-xs font-mono text-white uppercase tracking-wider mb-3">
              Stack
            </h4>
            <p className="text-xs text-[#888888] leading-relaxed mb-3">
              Built on Next.js 16, Supabase PostgreSQL with Row Level Security, and Google Gemini AI multimodal reasoning.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#141414] border border-[#262626] text-[11px] font-mono text-[#a1a1a1]">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>RLS Verified</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-[#222222] mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#666666] font-mono gap-3">
          <p>© 2026 {SITE_CONFIG.name} — Community EV Charging Infrastructure.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> for Indian EV Travelers
          </p>
        </div>
      </div>
    </footer>
  );
}
