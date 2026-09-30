"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/config/site";
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
      <header className="fixed top-0 w-full z-50 bg-[#070b14]/85 backdrop-blur-xl border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#090e1a] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20 transition-transform group-hover:scale-110" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black tracking-wider text-white">
                  VOLT<span className="text-emerald-400">LOOP</span>
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400 tracking-wide">
                  PRO
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Emergency SOS CTA */}
            <button
              onClick={() => setEmergencyOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/30 shadow-sm hover:shadow-rose-500/20"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>🚨 SOS</span>
            </button>

            {/* Book a Charger Primary CTA */}
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Find a Charger
            </Link>

            {/* Auth State Button / Profile */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 transition-all border border-slate-700/80"
                  title={profile?.email || user.email}
                >
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover border border-emerald-400/50"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold">
                      {(profile?.name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-slate-200 max-w-[100px] truncate">
                    {profile?.name || user.email?.split("@")[0]}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setEmergencyOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold"
            >
              🚨 SOS
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#070b14]/95 backdrop-blur-2xl px-4 py-3 space-y-1.5 shadow-xl">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-800 space-y-2">
              {user ? (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span className="font-semibold text-slate-200">
                    Signed in as {profile?.name || user.email}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="font-bold text-rose-400 hover:underline"
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
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google / Email</span>
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
