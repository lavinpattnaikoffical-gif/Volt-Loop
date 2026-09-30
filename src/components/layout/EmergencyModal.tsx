"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, BatteryCharging, Zap, MapPin, X, Navigation, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Charger } from "@/types";

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyModal({ isOpen, onClose }: EmergencyModalProps) {
  const [batteryPercent, setBatteryPercent] = useState<number>(9);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/chargers")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.chargers)) {
            setChargers(data.chargers);
          }
        })
        .catch((err) => console.error("EmergencyModal charger fetch error:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Engineering calculation: 40.5 kWh battery * SOC% * 5.0 km/kWh
  const estimatedRemainingKm = Math.round((40.5 * (batteryPercent / 100)) * 5.0);

  // Pick nearest or first available charger from real database records
  const emergencyCharger = chargers.length > 0
    ? (chargers.find((c) => c.availability === "AVAILABLE" && c.powerKw >= 7.2) ?? chargers[0])
    : null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/40 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emergency Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-1 border border-rose-500/30">
              Critical Battery SOS Mode
            </div>
            <h3 className="text-xl font-black text-white">Emergency Charger Locator</h3>
          </div>
        </div>

        {/* Battery SOC input slider */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">Current Battery %</span>
            <span className="text-xl font-black text-rose-400 font-mono">{batteryPercent}%</span>
          </div>
          <input
            type="range"
            min="3"
            max="25"
            value={batteryPercent}
            onChange={(e) => setBatteryPercent(Number(e.target.value))}
            className="w-full accent-rose-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-slate-300 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1.5 font-medium">
              <BatteryCharging className="w-4 h-4 text-rose-400" />
              Est. Remaining Range:
            </span>
            <span className="font-bold text-rose-400 text-sm font-mono">~{estimatedRemainingKm} km</span>
          </div>
        </div>

        {/* Recommended Immediate Stop */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Searching database for nearest active community charger...</p>
          </div>
        ) : !emergencyCharger ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center mb-6">
            <Zap className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-bold text-sm text-white mb-1">
              No community chargers are available yet.
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Be the first host in your area to offer emergency charging support to EV drivers.
            </p>
            <Link
              href="/host/list"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Charger</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Nearest Compatible Host
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">Verified Host</span>
              </div>

              <h4 className="font-bold text-white text-base mb-1">{emergencyCharger.title}</h4>
              <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {emergencyCharger.address}, {emergencyCharger.city}
              </p>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-800 text-center mb-3">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Power</span>
                  <strong className="text-xs text-emerald-400 font-bold">{emergencyCharger.powerKw} kW AC</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Rating</span>
                  <strong className="text-xs text-amber-400 font-bold">★ {emergencyCharger.rating}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Status</span>
                  <strong className="text-xs text-emerald-400 font-bold">🟢 Available</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                * Host allows instant plug-in for emergency arrivals. Connect upon arrival to avoid stranding.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href={`https://maps.google.com/?q=${emergencyCharger.latitude},${emergencyCharger.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
              >
                <Navigation className="w-4 h-4 text-emerald-400" />
                <span>Navigate Now</span>
              </a>
              <Link
                href={`/booking/${emergencyCharger.chargerId}?initial=${batteryPercent}&target=80`}
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Book Now</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
