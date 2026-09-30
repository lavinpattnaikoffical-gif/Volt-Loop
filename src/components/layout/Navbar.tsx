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
  User,
  AlertTriangle,
  Zap,
} from "lucide-react";
import EmergencyModal from "./EmergencyModal";
import { useAuth } from "@/context/AuthContext";
import { LogOut, LogIn } from "lucide-react";

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
      <header className="fixed top-0 w-full z-50 bg-[#f4fbf4]/90 backdrop-blur-xl border-b border-[#dde4dd] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-auto max-w-[140px] flex items-center justify-center">
              <img
                src="/logo.png"
                alt="VoltLoop Logo"
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#161d19]">
              VOLTLOOP
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#10b981] text-[#00422b] font-bold shadow-sm"
                      : "text-[#3c4a42] hover:text-[#161d19] hover:bg-[#e8f0e9]"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00422b] text-[#10b981]">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#ba1a1a] bg-[#ffdad6] hover:bg-[#ffc6c0] transition border border-[#fc7c78]/40"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#ba1a1a] animate-pulse" />
              <span>🚨 Find Charger Now</span>
            </button>

            {/* Book a Charger Primary CTA */}
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#006c49] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#005236] transition-colors shadow-sm"
            >
              Find a Charger
            </Link>

            {/* Auth State Button / Profile */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#e8f0e9] hover:bg-[#dde4dd] transition border border-[#c4d0c5]"
                  title={profile?.email || user.email}
                >
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#006c49] text-white flex items-center justify-center text-xs font-bold">
                      {(profile?.name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-medium text-[#161d19] max-w-[100px] truncate">
                    {profile?.name || user.email?.split("@")[0]}
                  </span>
                </Link>
                <button
                  onClick={() => signOut()}
                  className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-[#ffebee] transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#006c49] border border-[#006c49]/30 hover:bg-[#e8f0e9] transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setEmergencyOpen(true)}
              className="p-1.5 rounded-xl bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold"
            >
              🚨 SOS
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#e8f0e9] text-[#161d19] hover:bg-[#dde4dd]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#dde4dd] bg-[#f4fbf4] px-4 py-3 space-y-1.5 shadow-md">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-[#10b981] text-[#00422b] font-bold"
                      : "text-[#3c4a42] hover:bg-[#e8f0e9]"
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#00422b] text-[#10b981]">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-[#dde4dd] space-y-2">
              {user ? (
                <div className="flex items-center justify-between text-xs text-[#3c4a42] pt-1">
                  <span className="font-semibold text-[#161d19]">
                    Signed in as {profile?.name || user.email}
                  </span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="font-bold text-red-600"
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
                  className="w-full py-2.5 rounded-xl bg-[#006c49] text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In with Google / Email</span>
                </button>
              )}

              <div className="flex items-center justify-end text-xs text-[#3c4a42] pt-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setEmergencyOpen(true);
                  }}
                  className="font-bold text-[#ba1a1a]"
                >
                  🚨 Emergency Locator
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Emergency SOC Finder Modal */}
      <EmergencyModal isOpen={emergencyOpen} onClose={() => setEmergencyOpen(false)} />
    </>
  );
}
