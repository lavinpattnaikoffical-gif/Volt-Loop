"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Charger, Vehicle, Booking } from "@/types";
import { calculateChargingMetrics } from "@/lib/charging/calculator";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Zap,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Car,
  MapPin,
  CreditCard,
  QrCode,
  ArrowRight,
  ChevronLeft,
  Navigation,
  Check,
  Lock,
} from "lucide-react";

const STANDARD_VEHICLES: Vehicle[] = [
  {
    vehicleId: "veh-tata-nexon",
    userId: "guest",
    brand: "Tata",
    model: "Nexon EV (40.5 kWh)",
    batteryCapacityKwh: 40.5,
    connectorType: "Type 2",
    maxAcChargingKw: 7.2,
    currentBatteryPercent: 22,
    targetBatteryPercent: 85,
  },
  {
    vehicleId: "veh-mg-zs",
    userId: "guest",
    brand: "MG",
    model: "ZS EV (50.3 kWh)",
    batteryCapacityKwh: 50.3,
    connectorType: "Type 2",
    maxAcChargingKw: 7.4,
    currentBatteryPercent: 20,
    targetBatteryPercent: 85,
  },
];

function BookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const chargerId = params?.chargerId as string;
  const { user, vehicles: userVehicles, openAuthModal } = useAuth();

  const [charger, setCharger] = useState<Charger | null>(null);
  const vehicles = userVehicles.length > 0 ? userVehicles : STANDARD_VEHICLES;
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    searchParams?.get("vehicleId") || vehicles[0].vehicleId
  );

  const [bookingDate, setBookingDate] = useState("2026-09-30");
  const [startTime, setStartTime] = useState("22:00");
  const [endTime, setEndTime] = useState("06:00");

  const [initialBattery, setInitialBattery] = useState<number>(
    Number(searchParams?.get("initial") || 22)
  );
  const [targetBattery, setTargetBattery] = useState<number>(
    Number(searchParams?.get("target") || 85)
  );

  const [paymentMethod, setPaymentMethod] = useState("UPI (Google Pay / PhonePe)");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCharger() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/chargers/${chargerId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && (json.charger || json.data)) {
            setCharger(json.charger || json.data);
            return;
          }
        }
      } catch (err) {
        console.warn("Could not fetch charger:", err);
      } finally {
        setIsLoading(false);
      }
      setCharger(null);
    }
    loadCharger();
  }, [chargerId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-24 bg-[#f4fbf4]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#3c4a42]">Loading Booking Checkout...</p>
        </div>
      </div>
    );
  }

  if (!charger) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-24 min-h-[60vh] bg-black">
        <div className="max-w-md w-full vercel-card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#171717] border border-[#262626] text-white flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Charger Not Found</h2>
          <p className="text-xs text-[#888888] mb-6">
            This community charger is no longer available or was not found in the database.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors"
          >
            <span>Explore Other Chargers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) ?? vehicles[0];

  // Deterministic calculation
  const metrics = calculateChargingMetrics({
    batteryCapacityKwh: selectedVehicle.batteryCapacityKwh,
    currentSocPercent: initialBattery,
    targetSocPercent: targetBattery,
    chargerPowerKw: charger.powerKw,
    vehicleMaxAcKw: selectedVehicle.maxAcChargingKw,
    electricityRate: charger.electricityRate,
    hostFee: charger.hostFee,
    platformFee: charger.platformFee,
  });

  const handleConfirmBooking = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsBooking(true);
    setBookingError(null);
    try {
      const payload = {
        userId: user.id,
        chargerId: charger.chargerId,
        vehicleId: selectedVehicle.vehicleId,
        initialBatteryPercent: initialBattery,
        targetBatteryPercent: targetBattery,
        startTime: `${bookingDate}T${startTime}:00Z`,
        endTime: `${bookingDate}T${endTime}:00Z`,
        paymentMethod,
      };

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.booking) {
        setConfirmedBooking(data.booking);
        // Confetti celebration
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#ffffff", "#10b981", "#888888"],
        });
      } else {
        setBookingError(data.error || "Failed to create booking");
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setBookingError(err?.message || "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#888888] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Charger</span>
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation Success Card */
          <div className="vercel-card p-8 sm:p-10 text-center max-w-2xl mx-auto space-y-6">
            <div className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center mx-auto shadow-md">
              <Check className="w-7 h-7" />
            </div>

            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block mb-1">
                Community Reservation Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Booking ID: {confirmedBooking.bookingId}
              </h1>
              <p className="text-xs sm:text-sm text-[#888888] mt-1">
                Your private driveway charging slot at {charger.title} has been locked and reserved.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#000000] border border-[#222222] text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-[#888888]">Vehicle:</span>
                <strong className="text-white">{selectedVehicle.brand} {selectedVehicle.model}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Schedule:</span>
                <strong className="text-white">{startTime} → {endTime} ({bookingDate})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888888]">Energy Replenishment:</span>
                <strong className="text-white">~{confirmedBooking.estimatedEnergyKwh} kWh ({initialBattery}% → {targetBattery}%)</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#222222] font-bold text-sm">
                <span className="text-white">Total Paid:</span>
                <span className="text-emerald-400">₹{confirmedBooking.totalCost}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 py-2.5 px-4 bg-white hover:bg-[#d4d4d4] text-black font-medium text-xs sm:text-sm rounded-md transition-colors text-center"
              >
                View in Dashboard
              </Link>
              <a
                href={`https://maps.google.com/?q=${charger.latitude},${charger.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] text-white font-medium text-xs sm:text-sm rounded-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4" />
                <span>Navigate to Host</span>
              </a>
            </div>
          </div>
        ) : (
          /* Checkout Booking Form Grid */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Form inputs */}
            <div className="md:col-span-7 vercel-card p-6 space-y-6">
              <div className="border-b border-[#222222] pb-4">
                <h1 className="text-lg font-bold text-white mb-1">
                  Confirm Overnight Charging Reservation
                </h1>
                <p className="text-xs text-[#888888]">
                  Lock in reserved private driveway plug-in with transparent billing.
                </p>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="text-xs font-mono text-[#888888] block mb-1">
                  Active Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-[#000000] border border-[#262626] rounded-md px-3 py-2 text-xs text-white outline-none focus:border-[#555555]"
                >
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.brand} {v.model} ({v.batteryCapacityKwh} kWh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Battery SOC adjustments */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#000000] border border-[#222222]">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[11px] font-mono text-[#888888]">Current SOC</span>
                    <strong className="text-xs font-mono text-amber-400">{initialBattery}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={initialBattery}
                    onChange={(e) => setInitialBattery(Number(e.target.value))}
                    className="w-full accent-white h-1.5 bg-[#262626] rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[11px] font-mono text-[#888888]">Target SOC</span>
                    <strong className="text-xs font-mono text-emerald-400">{targetBattery}%</strong>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={targetBattery}
                    onChange={(e) => setTargetBattery(Number(e.target.value))}
                    className="w-full accent-white h-1.5 bg-[#262626] rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#555555]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#555555]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#888888] block mb-1">Departure</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#555555]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-mono text-[#888888] block mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  {["UPI (Google Pay / PhonePe)", "Credit/Debit Card", "VoltLoop EV Wallet"].map(
                    (pm) => (
                      <label
                        key={pm}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                          paymentMethod === pm
                            ? "bg-[#171717] border-white text-white"
                            : "bg-[#000000] border-[#262626] text-[#888888] hover:text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === pm}
                          onChange={() => setPaymentMethod(pm)}
                          className="accent-white"
                        />
                        <span>{pm}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 cols: Itemized Invoice & Confirm */}
            <div className="md:col-span-5 vercel-card p-6 space-y-5 border-[#333333]">
              <h2 className="text-sm font-semibold text-white border-b border-[#222222] pb-3">
                Cost Breakdown
              </h2>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#888888]">
                  <span>Electricity Energy</span>
                  <span className="text-white">₹{metrics.electricityCost}</span>
                </div>
                <div className="text-[10px] text-[#666666] pl-2">
                  ~{metrics.energyRequiredKwh} kWh @ ₹{charger.electricityRate}/kWh
                </div>

                <div className="flex justify-between text-[#888888]">
                  <span>Host Fee</span>
                  <span className="text-white">₹{metrics.hostFee}</span>
                </div>

                <div className="flex justify-between text-[#888888]">
                  <span>Platform Fee</span>
                  <span className="text-white">₹{metrics.platformFee}</span>
                </div>

                <div className="pt-3 border-t border-[#222222] flex justify-between items-baseline font-bold text-base text-white">
                  <span>Total Amount</span>
                  <span className="text-xl text-emerald-400">₹{metrics.totalCost}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#000000] border border-[#222222] text-xs text-[#888888] space-y-1 font-mono">
                <div className="text-white">Charging Time Estimate:</div>
                <div>{metrics.formattedDuration} on {charger.powerKw} kW AC</div>
              </div>

              {bookingError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-400">
                  {bookingError}
                </div>
              )}

              {user ? (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="w-full py-2.5 px-4 bg-white hover:bg-[#d4d4d4] text-black font-medium text-xs sm:text-sm rounded-md transition-colors flex items-center justify-center gap-1.5"
                >
                  {isBooking ? (
                    <span>Locking Slot...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black" />
                      <span>Confirm Booking (₹{metrics.totalCost})</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-lg bg-[#000000] border border-[#262626] text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-[#888888]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign in to reserve charger</span>
                  </div>
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="w-full py-2 px-4 bg-white hover:bg-[#d4d4d4] text-black font-medium text-xs rounded-md transition-colors"
                  >
                    Continue with Google / Email
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#666666]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant confirmation • Cancel free up to 2h before</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] bg-black">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
