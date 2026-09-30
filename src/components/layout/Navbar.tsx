"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  Sparkles,
  LayoutDashboard,
  Menu,
  X,
  AlertTriangle,
  Zap,
  LogOut,
  LogIn,
} from "lucide-react";
import EmergencyModal from "./EmergencyModal";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const { user, profile, openAuthModal, signOut } = useAuth();

  const navLinks = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/ai", label: "AI Pilot", icon: Sparkles, badge: "AI" },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-[#262626]">
        <div className="h-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand (Vercel breadcrumb style) */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 bg-white text-black rounded-md flex items-center justify-center transition-transform group-hover:scale-105">
                <Zap className="w-4 h-4 fill-black" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-white">
                VOLTLOOP
              </span>
            </Link>
            <span className="text-[#404040] select-none">/</span>
            <span className="text-xs text-[#a1a1a1] hidden sm:inline font-mono">
              EV Network
            </span>
          </div>

          {/* Desktop Navigation Links (Vercel segmented nav style) */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-[#171717] border border-[#262626]"
                      : "text-[#a1a1a1] hover:text-white hover:bg-[#111111]"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-[#171717] text-[#0070f3] border border-[#0070f3]/40">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Emergency SOS CTA */}
            <button
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>SOS</span>
            </button>

            {/* Find a Charger Primary CTA (Vercel Solid White Button) */}
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-3.5 py-1.5 bg-white text-black font-medium rounded-md text-xs sm:text-sm hover:bg-[#d4d4d4] transition-colors"
            >
              Find a Charger
            </Link>

            {/* Auth State Button / Profile */}
            {user ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#111111] hover:bg-[#171717] border border-[#262626] transition-colors"
                  title={profile?.email || user.email}
                >
                  <div className="w-5 h-5 rounded-full bg-[#262626] text-white flex items-center justify-center text-[10px] font-mono">
                    {(profile?.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[#ededed] max-w-[90px] truncate">
                    {profile?.name || user.email?.split("@")[0]}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-md text-[#a1a1a1] hover:text-rose-400 hover:bg-[#171717] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#111111] text-[#ededed] border border-[#262626] hover:border-[#404040] hover:text-white transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#a1a1a1]" />
                <span>Log In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setEmergencyOpen(true)}
              className="px-2 py-1 rounded-md bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-medium"
            >
              SOS
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md bg-[#111111] border border-[#262626] text-white hover:bg-[#171717]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#262626] bg-black px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2 rounded-md text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#171717] text-white border border-[#262626]"
                      : "text-[#a1a1a1] hover:text-white hover:bg-[#111111]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171717] text-[#0070f3] border border-[#0070f3]/40">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-[#262626] space-y-2">
              {user ? (
                <div className="flex items-center justify-between text-xs text-[#a1a1a1] pt-1">
                  <span className="text-white truncate">
                    {profile?.name || user.email}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="text-rose-400 hover:underline"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal();
                  }}
                  className="w-full py-2 rounded-md bg-white text-black text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Emergency SOC Finder Modal */}
      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </>
  );
}
