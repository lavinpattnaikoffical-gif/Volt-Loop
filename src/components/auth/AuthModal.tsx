"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";

export default function AuthModal() {
  const {
    isAuthModalOpen,
    closeAuthModal,
    signInWithEmail,
    signUpWithEmail,
    isConfigured,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    if (mode === "signin") {
      const { error } = await signInWithEmail(email.trim(), password);
      if (error) {
        setErrorMsg(error.message || "Failed to sign in. Please check your credentials.");
      } else {
        closeAuthModal();
      }
    } else {
      if (!name.trim()) {
        setErrorMsg("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      const { error } = await signUpWithEmail(email.trim(), password, name.trim());
      if (error) {
        setErrorMsg(error.message || "Failed to create account. Please try again.");
      } else {
        setSuccessMsg(
          "Account created successfully! If email confirmation is enabled, please verify your email."
        );
        setTimeout(() => {
          closeAuthModal();
        }, 1800);
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-[#dde4dd] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#161d19]">
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 p-2 rounded-full text-[#3c4a42] hover:text-[#161d19] hover:bg-[#eef6ee] transition"
          aria-label="Close authentication modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand & Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] text-[#006c49] mb-3 shadow-sm">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-[#161d19]">
            {mode === "signin" ? "Sign In to VoltLoop" : "Create Your Account"}
          </h2>
          <p className="text-xs text-[#3c4a42] mt-1 max-w-xs mx-auto">
            {mode === "signin"
              ? "Access your community bookings, vehicles, and host tools."
              : "Join the community charging network as a driver or host."}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-1 bg-[#eef6ee] rounded-xl flex items-center mb-6 border border-[#dde4dd]">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
              setMode("signin");
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "signin"
                ? "bg-white text-[#006c49] shadow-sm"
                : "text-[#3c4a42] hover:text-[#161d19]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setSuccessMsg(null);
              setMode("signup");
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              mode === "signup"
                ? "bg-white text-[#006c49] shadow-sm"
                : "text-[#3c4a42] hover:text-[#161d19]"
            }`}
          >
            Register
          </button>
        </div>

        {/* Notice if Supabase keys are missing */}
        {!isConfigured && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <div className="font-bold flex items-center gap-1.5 mb-0.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>Supabase Configuration Notice</span>
            </div>
            <p className="text-[11px] text-amber-700">
              Provide your <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="font-mono">.env.local</code> to activate live Supabase authentication.
            </p>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Success notification */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* Supabase Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-bold text-[#161d19] mb-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3c4a42]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd] text-[#161d19] placeholder-[#3c4a42]/60 text-xs sm:text-sm focus:outline-none focus:border-[#006c49] focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#161d19] mb-1">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3c4a42]">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd] text-[#161d19] placeholder-[#3c4a42]/60 text-xs sm:text-sm focus:outline-none focus:border-[#006c49] focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#161d19]">
                Password
              </label>
              {mode === "signup" && (
                <span className="text-[10px] text-[#3c4a42]">Min. 6 characters</span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3c4a42]">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd] text-[#161d19] placeholder-[#3c4a42]/60 text-xs sm:text-sm focus:outline-none focus:border-[#006c49] focus:bg-white transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3c4a42] hover:text-[#161d19]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === "signin" ? "Sign In" : "Create Free Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="text-center pt-5 mt-4 border-t border-[#dde4dd]">
          <p className="text-xs text-[#3c4a42]">
            {mode === "signin" ? "New to VoltLoop?" : "Already registered?"}{" "}
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setSuccessMsg(null);
                setMode(mode === "signin" ? "signup" : "signin");
              }}
              className="text-[#006c49] font-bold hover:underline ml-1"
            >
              {mode === "signin" ? "Create an account" : "Sign in here"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
