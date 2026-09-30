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
      <div className="flex-1 flex items-center justify-center p-8 pt-24 min-h-[60vh] bg-[#f4fbf4]">
        <div className="max-w-md w-full bg-white border border-[#dde4dd] rounded-3xl p-8 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[#eef6ee] text-[#006c49] flex items-center justify-center mx-auto mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#161d19] mb-2">Charger Not Found</h2>
          <p className="text-xs text-[#3c4a42] mb-6">
            This community charger is no longer available or was not found in the database.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006c49] text-white font-bold text-xs shadow-sm hover:bg-[#005236] transition"
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
          colors: ["#006c49", "#10b981", "#82f5c1"],
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
    <div className="min-h-screen bg-[#f4fbf4] text-[#161d19] pt-20 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006c49] hover:underline"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Charger</span>
          </button>
        </div>

        {confirmedBooking ? (
          /* Confirmation Success Card */
          <div className="bg-white border border-[#82f5c1] rounded-3xl p-8 sm:p-10 shadow-md text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#006c49] text-white flex items-center justify-center mx-auto shadow-md">
              <Check className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#006c49] block mb-1">
                Community Reservation Confirmed
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-[#161d19]">
                Booking ID: {confirmedBooking.bookingId}
              </h1>
              <p className="text-xs sm:text-sm text-[#3c4a42] mt-1">
                Your private driveway charging slot at {charger.title} has been locked and reserved.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-[#3c4a42]">Vehicle:</span>
                <strong className="text-[#161d19]">{selectedVehicle.brand} {selectedVehicle.model}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3c4a42]">Schedule:</span>
                <strong className="text-[#006c49]">{startTime} → {endTime} ({bookingDate})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3c4a42]">Energy Replenishment:</span>
                <strong className="text-[#161d19]">~{confirmedBooking.estimatedEnergyKwh} kWh ({initialBattery}% → {targetBattery}%)</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#dde4dd] font-bold text-sm">
                <span className="text-[#161d19]">Total Paid:</span>
                <span className="text-[#006c49]">₹{confirmedBooking.totalCost}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/dashboard"
                className="flex-1 py-3.5 px-4 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition"
              >
                View in Dashboard
              </Link>
              <a
                href={`https://maps.google.com/?q=${charger.latitude},${charger.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3.5 px-4 bg-[#eef6ee] hover:bg-[#dde4dd] border border-[#dde4dd] text-[#161d19] font-bold text-xs sm:text-sm rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4 text-[#006c49]" />
                <span>Navigate to Host</span>
              </a>
            </div>
          </div>
        ) : (
          /* Checkout Booking Form Grid */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Form inputs */}
            <div className="md:col-span-7 bg-white border border-[#dde4dd] rounded-3xl p-6 shadow-sm space-y-6">
              <div className="border-b border-[#dde4dd] pb-4">
                <h1 className="text-xl font-bold text-[#161d19] mb-1">
                  Confirm Overnight Charging Reservation
                </h1>
                <p className="text-xs text-[#3c4a42]">
                  Lock in reserved private driveway plug-in with transparent three-part billing.
                </p>
              </div>

              {/* Vehicle Selection */}
              <div>
                <label className="text-xs font-semibold text-[#161d19] block mb-1">
                  Active Vehicle
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3 py-2.5 text-xs text-[#161d19] font-medium focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.vehicleId} value={v.vehicleId}>
                      {v.brand} {v.model} ({v.batteryCapacityKwh} kWh)
                    </option>
                  ))}
                </select>
              </div>

              {/* Battery SOC adjustments */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[11px] text-[#3c4a42]">Current SOC</span>
                    <strong className="text-xs font-bold text-amber-600">{initialBattery}%</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={initialBattery}
                    onChange={(e) => setInitialBattery(Number(e.target.value))}
                    className="w-full accent-[#006c49] h-1.5 bg-[#dde4dd] rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[11px] text-[#3c4a42]">Target SOC</span>
                    <strong className="text-xs font-bold text-[#006c49]">{targetBattery}%</strong>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={targetBattery}
                    onChange={(e) => setTargetBattery(Number(e.target.value))}
                    className="w-full accent-[#006c49] h-1.5 bg-[#dde4dd] rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-[#3c4a42] font-semibold block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-2.5 py-1.5 text-xs text-[#161d19]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#3c4a42] font-semibold block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-2.5 py-1.5 text-xs text-[#161d19]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#3c4a42] font-semibold block mb-1">Departure</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-2.5 py-1.5 text-xs text-[#161d19]"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-semibold text-[#161d19] block mb-2">
                  Payment Method (Simulated Hackathon Settlement)
                </label>
                <div className="space-y-2">
                  {["UPI (Google Pay / PhonePe)", "Credit/Debit Card", "VoltLoop EV Wallet"].map(
                    (pm) => (
                      <label
                        key={pm}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold cursor-pointer transition ${
                          paymentMethod === pm
                            ? "bg-[#eef6ee] border-[#006c49] text-[#006c49]"
                            : "bg-white border-[#dde4dd] text-[#161d19] hover:bg-[#eef6ee]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === pm}
                          onChange={() => setPaymentMethod(pm)}
                          className="accent-[#006c49]"
                        />
                        <span>{pm}</span>
                      </label>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right 5 cols: Itemized Invoice & Confirm */}
            <div className="md:col-span-5 bg-white border border-[#dde4dd] rounded-3xl p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-[#161d19] border-b border-[#dde4dd] pb-3">
                Transparent Cost Breakdown
              </h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-[#3c4a42]">
                  <span>Electricity Energy</span>
                  <span className="font-mono text-[#161d19]">₹{metrics.electricityCost}</span>
                </div>
                <div className="text-[10px] text-[#3c4a42]/70 pl-2">
                  ~{metrics.energyRequiredKwh} kWh @ ₹{charger.electricityRate}/kWh
                </div>

                <div className="flex justify-between text-[#3c4a42]">
                  <span>Host Infrastructure Fee</span>
                  <span className="font-mono text-[#161d19]">₹{metrics.hostFee}</span>
                </div>

                <div className="flex justify-between text-[#3c4a42]">
                  <span>VoltLoop Platform Fee</span>
                  <span className="font-mono text-[#161d19]">₹{metrics.platformFee}</span>
                </div>

                <div className="pt-3 border-t border-[#dde4dd] flex justify-between items-baseline font-black text-base text-[#161d19]">
                  <span>Total Amount</span>
                  <span className="text-xl text-[#006c49]">₹{metrics.totalCost}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#eef6ee] text-xs text-[#3c4a42] space-y-1">
                <div className="font-semibold text-[#161d19]">Charging Time Estimate:</div>
                <div>{metrics.formattedDuration} on {charger.powerKw} kW AC</div>
              </div>

              {bookingError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {bookingError}
                </div>
              )}

              {user ? (
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={isBooking}
                  className="w-full py-4 px-4 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {isBooking ? (
                    <span>Locking Slot...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Confirm Booking (₹{metrics.totalCost})</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-[#eef6ee] border border-[#82f5c1] text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#006c49]">
                    <Lock className="w-4 h-4" />
                    <span>Sign in to reserve charger</span>
                  </div>
                  <button
                    type="button"
                    onClick={openAuthModal}
                    className="w-full py-3 px-4 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs rounded-xl shadow-sm transition"
                  >
                    Continue with Google / Email
                  </button>
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#3c4a42]">
                <ShieldCheck className="w-4 h-4 text-[#006c49]" />
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
        <div className="flex items-center justify-center min-h-[60vh] bg-[#f4fbf4]">
          <div className="w-8 h-8 border-3 border-[#006c49] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
