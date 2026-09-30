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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-[#dde4dd] shadow-[0_-2px_16px_rgba(0,0,0,0.06)] safe-area-bottom">
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
                  ? "text-[#006c49]"
                  : "text-[#8a9a90] hover:text-[#3c4a42]"
              }`}
            >
              {tab.highlight ? (
                <div
                  className={`w-10 h-10 -mt-4 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
                    isActive
                      ? "bg-[#006c49] text-white shadow-[#006c49]/30"
                      : "bg-[#eef6ee] text-[#006c49] border border-[#c2e2c8]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              ) : (
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#006c49] rounded-full animate-pulse" />
                  )}
                </div>
              )}
              <span
                className={`text-[10px] font-semibold leading-tight ${
                  isActive ? "font-bold" : ""
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
                ? "text-[#006c49]"
                : "text-[#8a9a90] hover:text-[#3c4a42]"
            }`}
          >
            <div className="relative">
              <User className={`w-5 h-5 transition-transform duration-200 ${
                pathname === "/dashboard" ? "scale-110" : ""
              }`} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#10b981] rounded-full border border-white" />
            </div>
            <span className="text-[10px] font-semibold leading-tight">
              Profile
            </span>
          </Link>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] py-1.5 rounded-xl text-[#8a9a90] hover:text-[#3c4a42] transition-all duration-200"
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
