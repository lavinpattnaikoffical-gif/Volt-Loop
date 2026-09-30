"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Sparkles, LayoutDashboard, Home, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const MOBILE_TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/ai", label: "AI Pilot", icon: Sparkles, highlight: true },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();

  // Hide on pages where it would overlap map controls
  const hiddenPaths = ["/auth", "/booking"];
  if (hiddenPaths.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#070b14]/90 backdrop-blur-2xl border-t border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-emerald-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.highlight ? (
                <div
                  className={`w-11 h-11 -mt-5 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/40 ring-2 ring-emerald-400/40"
                      : "bg-slate-800/90 text-emerald-400 border border-emerald-500/30 shadow-black/40"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-110 text-emerald-400" : ""
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                  )}
                </div>
              )}
              <span
                className={`text-[10px] font-semibold leading-tight tracking-tight ${
                  isActive ? "font-bold text-emerald-400" : "text-slate-400"
                } ${tab.highlight ? "mt-0.5" : ""}`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}

        {/* Profile / Sign In Tab */}
        {user ? (
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl transition-all duration-200 ${
              pathname === "/dashboard"
                ? "text-emerald-400 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="relative">
              <User className={`w-5 h-5 transition-transform duration-200 ${
                pathname === "/dashboard" ? "scale-110 text-emerald-400" : ""
              }`} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full border border-slate-900 shadow-[0_0_8px_#10b981]" />
            </div>
            <span className="text-[10px] font-semibold leading-tight">
              Profile
            </span>
          </Link>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all duration-200"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-semibold leading-tight">
              Sign In
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
