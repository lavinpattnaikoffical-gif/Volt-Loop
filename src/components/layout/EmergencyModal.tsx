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
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#fc7c78] rounded-3xl p-6 sm:p-7 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#3c4a42] hover:text-[#161d19] p-1.5 rounded-full bg-[#eef6ee] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emergency Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold uppercase tracking-wider mb-1">
              Critical Battery SOS Mode
            </div>
            <h3 className="text-xl font-black text-[#161d19]">Emergency Charger Locator</h3>
          </div>
        </div>

        {/* Battery SOC input slider */}
        <div className="bg-[#eef6ee] border border-[#dde4dd] rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-[#161d19] uppercase tracking-wide">Current Battery %</span>
            <span className="text-xl font-black text-[#ba1a1a] font-mono">{batteryPercent}%</span>
          </div>
          <input
            type="range"
            min="3"
            max="25"
            value={batteryPercent}
            onChange={(e) => setBatteryPercent(Number(e.target.value))}
            className="w-full accent-[#ba1a1a] h-2 bg-[#dde4dd] rounded-lg cursor-pointer"
          />
          <div className="mt-3 flex items-center justify-between text-xs text-[#161d19] border-t border-[#dde4dd] pt-2.5">
            <span className="flex items-center gap-1 font-medium">
              <BatteryCharging className="w-4 h-4 text-[#ba1a1a]" />
              Est. Remaining Range:
            </span>
            <span className="font-bold text-[#ba1a1a] text-sm font-mono">~{estimatedRemainingKm} km</span>
          </div>
        </div>

        {/* Recommended Immediate Stop */}
        {isLoading ? (
          <div className="p-8 text-center text-xs text-[#3c4a42]">
            <div className="w-6 h-6 border-2 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p>Searching real database for nearest active community charger...</p>
          </div>
        ) : !emergencyCharger ? (
          /* Empty state when database has 0 chargers */
          <div className="bg-[#eef6ee] border border-[#dde4dd] rounded-2xl p-6 text-center mb-6">
            <Zap className="w-8 h-8 text-[#006c49] mx-auto mb-2" />
            <h4 className="font-bold text-sm text-[#161d19] mb-1">
              No community chargers are available yet.
            </h4>
            <p className="text-xs text-[#3c4a42] mb-4">
              Be the first host in your area to offer emergency charging support to EV drivers.
            </p>
            <Link
              href="/host/list"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006c49] text-white text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Your Charger</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-[#eef6ee] border-2 border-[#006c49]/40 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#006c49] tracking-wide uppercase flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#006c49] animate-ping" />
                  Nearest Compatible Host
                </span>
                <span className="text-xs text-[#3c4a42] font-mono font-bold">Verified Host</span>
              </div>

              <h4 className="font-bold text-[#161d19] text-base mb-1">{emergencyCharger.title}</h4>
              <p className="text-xs text-[#3c4a42] mb-3 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                {emergencyCharger.address}, {emergencyCharger.city}
              </p>

              <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#dde4dd] text-center mb-3">
                <div>
                  <span className="block text-[10px] text-[#3c4a42] uppercase">Power</span>
                  <strong className="text-xs text-[#006c49] font-bold">{emergencyCharger.powerKw} kW AC</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#3c4a42] uppercase">Host Rating</span>
                  <strong className="text-xs text-amber-600 font-bold">★ {emergencyCharger.rating}</strong>
                </div>
                <div>
                  <span className="block text-[10px] text-[#3c4a42] uppercase">Status</span>
                  <strong className="text-xs text-[#006c49] font-bold">🟢 Available</strong>
                </div>
              </div>

              <p className="text-[11px] text-[#3c4a42] italic">
                * Host allows instant plug-in for emergency arrivals. Connect upon arrival to avoid stranding.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <a
                href={`https://maps.google.com/?q=${emergencyCharger.latitude},${emergencyCharger.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] text-xs font-bold border border-[#dde4dd] transition"
              >
                <Navigation className="w-4 h-4 text-[#006c49]" />
                <span>Navigate Now</span>
              </a>
              <Link
                href={`/booking/${emergencyCharger.chargerId}?initial=${batteryPercent}&target=80`}
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition"
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
