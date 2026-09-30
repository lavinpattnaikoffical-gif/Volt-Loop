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
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black/90 backdrop-blur-xl border-t border-[#262626] safe-area-bottom">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab.href === "/"
            ? pathname === "/"
            : pathname.startsWith(tab.href);

          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-md transition-colors ${
                isActive
                  ? "text-white"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              {tab.highlight ? (
                <div
                  className={`w-9 h-9 -mt-4 rounded-lg flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-white text-black shadow-md"
                      : "bg-[#171717] text-white border border-[#333333]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              ) : (
                <Icon
                  className={`w-4 h-4 transition-transform ${
                    isActive ? "scale-105" : ""
                  }`}
                />
              )}
              <span
                className={`text-[10px] leading-tight ${
                  isActive ? "font-medium text-white" : "text-[#888888]"
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
            className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-md transition-colors ${
              pathname === "/dashboard"
                ? "text-white font-medium"
                : "text-[#888888] hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] leading-tight">Profile</span>
          </Link>
        ) : (
          <button
            onClick={openAuthModal}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 rounded-md text-[#888888] hover:text-white transition-colors"
          >
            <User className="w-4 h-4" />
            <span className="text-[10px] leading-tight">Log In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
