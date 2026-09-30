"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Charger, Vehicle, Review } from "@/types";
import { calculateChargingMetrics } from "@/lib/charging/calculator";
import Link from "next/link";
import {
  Zap,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Car,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Info,
  Navigation,
  Share2,
  Bookmark,
  Shield,
  AlertTriangle,
  BatteryCharging,
  Loader2,
} from "lucide-react";
import { calculateDistanceKm } from "@/components/map/ChargerMap";

const STANDARD_VEHICLES: Vehicle[] = [
  {
    vehicleId: "veh-tata-nexon",
    userId: "guest",
    brand: "Tata",
    model: "Nexon EV (40.5 kWh)",
    batteryCapacityKwh: 40.5,
    connectorType: "Type 2",
    maxAcChargingKw: 7.2,
    currentBatteryPercent: 24,
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
  {
    vehicleId: "veh-mahindra-xuv",
    userId: "guest",
    brand: "Mahindra",
    model: "XUV400 (39.4 kWh)",
    batteryCapacityKwh: 39.4,
    connectorType: "Type 2",
    maxAcChargingKw: 7.2,
    currentBatteryPercent: 25,
    targetBatteryPercent: 85,
  },
];

export default function ChargerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [charger, setCharger] = useState<Charger | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [vehicles] = useState<Vehicle[]>(STANDARD_VEHICLES);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("veh-tata-nexon");
  const [isLoading, setIsLoading] = useState(true);

  // Interactive AI Charging Estimate inputs
  const [currentSoc, setCurrentSoc] = useState<number>(24);
  const [targetSoc, setTargetSoc] = useState<number>(85);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // User GPS Location State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Restore user location from sessionStorage if available
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("voltloop_user_coords");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.lat && parsed?.lng) {
          setUserLocation({ lat: parsed.lat, lng: parsed.lng });
        }
      }
    } catch (e) {
      console.warn("Could not read saved coords:", e);
    }
  }, []);

  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        try {
          sessionStorage.setItem("voltloop_user_coords", JSON.stringify(coords));
        } catch (e) {}
        setIsLocating(false);
      },
      (err) => {
        console.warn("Location error:", err);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/chargers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.charger) {
          setCharger(data.charger);
          if (Array.isArray(data.reviews)) setReviews(data.reviews);
        } else {
          setCharger(null);
        }
      })
      .catch((err) => {
        console.error("Error fetching charger details:", err);
        setCharger(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 pt-24 min-h-[60vh] bg-[#f4fbf4]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#3c4a42]">Loading Charger Profile...</p>
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
            This charger may have been removed, or is currently pending host verification.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006c49] text-white font-bold text-xs shadow-sm hover:bg-[#005236] transition"
          >
            <span>Explore Community Chargers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) ?? vehicles[0];

  // Engineering calculation
  const metrics = calculateChargingMetrics({
    batteryCapacityKwh: selectedVehicle.batteryCapacityKwh,
    currentSocPercent: currentSoc,
    targetSocPercent: targetSoc,
    chargerPowerKw: charger.powerKw,
    vehicleMaxAcKw: selectedVehicle.maxAcChargingKw,
    electricityRate: charger.electricityRate,
    hostFee: charger.hostFee,
    platformFee: charger.platformFee,
  });

  // Dynamic distance calculation from current user coordinates
  const distanceKm = userLocation && charger
    ? calculateDistanceKm(userLocation.lat, userLocation.lng, charger.latitude, charger.longitude)
    : null;
  const driveMinutes = distanceKm ? Math.max(3, Math.round(distanceKm * 2.5)) : null;
  const googleMapsUrl = userLocation && charger
    ? `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${charger.latitude},${charger.longitude}`
    : `https://maps.google.com/?q=${charger.latitude},${charger.longitude}`;

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard?.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf4] text-[#161d19] pt-16 pb-20">
      {/* Top Gallery & Navigation Header */}
      <div className="w-full bg-[#eef6ee] border-b border-[#dde4dd] pt-6 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back & Actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/explore")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006c49] hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Explore</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-full bg-white border border-[#dde4dd] flex items-center justify-center shadow-sm text-[#161d19] hover:text-[#006c49] transition"
                title="Share Listing"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                className="w-9 h-9 rounded-full bg-white border border-[#dde4dd] flex items-center justify-center shadow-sm text-[#161d19] hover:text-[#006c49] transition"
                title="Save Bookmark"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[320px] sm:h-[380px]">
            {/* Primary Main Image */}
            <div className="md:col-span-2 h-full rounded-2xl overflow-hidden relative group shadow-sm border border-[#dde4dd]">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${charger.images?.[0] || "https://images.unsplash.com/photo-1558441719-74e4479e4384?w=800&auto=format&fit=crop&q=80"})`,
                }}
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-[#dde4dd]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006c49] animate-pulse" />
                <span className="text-xs font-bold text-[#161d19]">Verified Host Location</span>
              </div>
            </div>

            {/* Side Photos */}
            <div className="hidden md:flex flex-col gap-4 h-full">
              <div className="h-1/2 rounded-2xl overflow-hidden relative group shadow-sm border border-[#dde4dd]">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${charger.images?.[1] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"})`,
                  }}
                />
              </div>

              <div className="h-1/2 rounded-2xl overflow-hidden relative group shadow-sm border border-[#dde4dd]">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${charger.images?.[2] || "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80"})`,
                  }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white font-bold text-xs">+3 Photos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Details, Specs, Safety & Reviews */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Title & Trust Header */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="px-2.5 py-1 bg-[#82f5c1] text-[#00714e] rounded-full text-xs font-bold">
                  Private Wallbox L2
                </span>
                <span className="text-[#3c4a42] text-xs">•</span>
                <span className="text-[#3c4a42] text-xs">
                  {charger.city} {charger.address} (Exact GPS post-booking)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#161d19] tracking-tight mb-3">
                {charger.title}
              </h1>

              {/* Trust Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef6ee] rounded-xl border border-[#dde4dd]">
                  <ShieldCheck className="w-4 h-4 text-[#006c49]" />
                  <span className="text-xs font-semibold text-[#161d19]">
                    AI-assisted verification (94% confidence)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef6ee] rounded-xl border border-[#dde4dd]">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-[#161d19]">
                    {charger.rating} <span className="text-[#3c4a42] font-normal">({charger.reviewCount} reviews)</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#eef6ee] rounded-xl border border-[#dde4dd]">
                  <Zap className="w-4 h-4 text-[#006c49]" />
                  <span className="text-xs font-semibold text-[#006c49]">
                    🟢 Available Tonight
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Low Battery Warning Note */}
            <div className="bg-[#ffdad6] text-[#93000a] p-4 rounded-2xl flex items-start gap-3 border border-[#fc7c78]/40 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-sm block mb-0.5">Emergency Low Battery Support Active</span>
                Need immediate emergency charging? This host offers priority driveway access for vehicles under 15% charge. Instant reserve is enabled below.
              </div>
            </div>

            {/* Live Distance & Navigation Route Banner */}
            {distanceKm !== null ? (
              <div className="bg-[#eef6ee] border border-[#c2e2c8] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#006c49] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-extrabold text-[#161d19]">
                        {distanceKm} km from your current location
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                        ~{driveMinutes} min drive
                      </span>
                    </div>
                    <p className="text-xs text-[#3c4a42]">
                      Direct route from your GPS location to {charger.address}, {charger.city}
                    </p>
                  </div>
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold transition shadow-sm shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Navigate in Google Maps</span>
                </a>
              </div>
            ) : (
              <div className="bg-[#eef6ee] border border-[#c2e2c8] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#c2e2c8] text-[#006c49] flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#161d19] block">
                      Check Distance from Current Location
                    </span>
                    <span className="text-[11px] text-[#3c4a42]">
                      Enable GPS to see exact distance and estimated driving time to this charger
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-3.5 py-2 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Detecting GPS...</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Detect Distance</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 1. Vehicle Compatibility Section */}
            <div className="bg-white p-5 rounded-2xl border border-[#dde4dd] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#161d19]">Vehicle Compatibility</h2>
                <div className="flex items-center gap-1 text-[#006c49] bg-[#eef6ee] px-2.5 py-1 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#006c49]" />
                  <span>Compatible with {selectedVehicle.brand} ✓</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#eef6ee] p-3 rounded-xl border border-[#dde4dd]">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#006c49] shrink-0 shadow-sm">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#161d19] block">
                    {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.batteryCapacityKwh} kWh)
                  </span>
                  <span className="text-[11px] text-[#3c4a42]">
                    Standard {selectedVehicle.connectorType} port • Onboard AC acceptance: {selectedVehicle.maxAcChargingKw} kW
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Specifications Grid */}
            <div className="bg-white p-5 rounded-2xl border border-[#dde4dd] shadow-sm space-y-4">
              <h2 className="text-base font-bold text-[#161d19]">Charger Specifications</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                  <span className="text-[10px] text-[#3c4a42] uppercase font-medium block">Power Output</span>
                  <strong className="text-sm font-bold text-[#006c49]">{charger.powerKw} kW AC</strong>
                </div>

                <div className="p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                  <span className="text-[10px] text-[#3c4a42] uppercase font-medium block">Connector</span>
                  <strong className="text-sm font-bold text-[#161d19]">{charger.connectorType}</strong>
                </div>

                <div className="p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                  <span className="text-[10px] text-[#3c4a42] uppercase font-medium block">Parking Type</span>
                  <strong className="text-sm font-bold text-[#161d19]">Driveway</strong>
                </div>

                <div className="p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                  <span className="text-[10px] text-[#3c4a42] uppercase font-medium block">Access Type</span>
                  <strong className="text-sm font-bold text-[#006c49]">RFID / QR</strong>
                </div>
              </div>

              <p className="text-xs text-[#3c4a42] leading-relaxed pt-2 border-t border-[#dde4dd]">
                {charger.description}
              </p>
            </div>

            {/* 3. Host Profile Card */}
            <div className="bg-white p-5 rounded-2xl border border-[#dde4dd] shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#006c49] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {(charger.hostName || "H")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#161d19] flex items-center gap-1.5">
                    <span>Hosted by {charger.hostName || "Community Host"}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                      Verified Host
                    </span>
                  </h3>
                  <p className="text-xs text-[#3c4a42]">
                    {charger.reviewCount} verified community reviews
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Host Reviews */}
            <div className="bg-white p-5 rounded-2xl border border-[#dde4dd] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#161d19]">Guest Reviews</h2>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  ★ {charger.rating} rating ({reviews.length})
                </span>
              </div>

              {reviews.length === 0 ? (
                /* Requirement 18: No Reviews Empty State */
                <div className="p-6 text-center rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                  <p className="text-xs text-[#3c4a42]">
                    Be the first person to review this charger after completing a charging session.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.reviewId} className="p-3.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#161d19]">{r.userName}</span>
                        <span className="text-[10px] text-amber-600 font-bold">★ {r.rating}.0</span>
                      </div>
                      <p className="text-xs text-[#3c4a42] leading-relaxed mb-1">{r.comment}</p>
                      <span className="text-[10px] text-[#3c4a42]/70 font-mono">{r.vehicleModel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking & AI Estimator Card */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-white border-2 border-[#006c49]/30 rounded-3xl p-6 shadow-md">
              {/* Header Price */}
              <div className="flex items-baseline justify-between pb-4 border-b border-[#dde4dd] mb-4">
                <div>
                  <span className="text-2xl font-black text-[#161d19]">₹{charger.electricityRate}</span>
                  <span className="text-xs text-[#3c4a42]"> / kWh tariff</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#006c49]">+ ₹{charger.hostFee}</span>
                  <span className="text-[10px] text-[#3c4a42] block">host access fee</span>
                </div>
              </div>

              {/* AI Charging Estimate Calculator */}
              <div className="space-y-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#161d19] flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-[#006c49]" />
                    AI Charging Estimate
                  </span>
                  <span className="text-[10px] text-[#006c49] font-bold bg-[#eef6ee] px-2 py-0.5 rounded-md">
                    Deterministic Physics
                  </span>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="text-[11px] font-semibold text-[#3c4a42] block mb-1">
                    Your Vehicle
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3 py-2 text-xs text-[#161d19] font-medium focus:outline-none"
                  >
                    {vehicles.map((v) => (
                      <option key={v.vehicleId} value={v.vehicleId}>
                        {v.brand} {v.model} ({v.batteryCapacityKwh} kWh)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Battery SOC Sliders */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[11px] text-[#3c4a42]">Current</span>
                      <strong className="text-xs font-bold text-amber-600">{currentSoc}%</strong>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={currentSoc}
                      onChange={(e) => setCurrentSoc(Number(e.target.value))}
                      className="w-full accent-[#006c49] h-1.5 bg-[#dde4dd] rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[11px] text-[#3c4a42]">Target</span>
                      <strong className="text-xs font-bold text-[#006c49]">{targetSoc}%</strong>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="100"
                      value={targetSoc}
                      onChange={(e) => setTargetSoc(Number(e.target.value))}
                      className="w-full accent-[#006c49] h-1.5 bg-[#dde4dd] rounded-lg cursor-pointer"
                    />
                  </div>
                </div>

                {/* Calculated Energy & Duration Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                    <span className="text-[10px] text-[#3c4a42] uppercase block">Est. Energy</span>
                    <strong className="text-xs font-bold text-[#161d19]">~{metrics.energyRequiredKwh} kWh</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                    <span className="text-[10px] text-[#3c4a42] uppercase block">Est. Time</span>
                    <strong className="text-xs font-bold text-[#006c49]">{metrics.formattedDuration}</strong>
                  </div>
                </div>

                {/* Transparent Cost Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#eef6ee] border border-[#dde4dd] space-y-1.5 text-xs">
                  <div className="flex justify-between text-[#3c4a42]">
                    <span>Energy ({metrics.energyRequiredKwh} kWh × ₹{charger.electricityRate})</span>
                    <span>₹{metrics.electricityCost}</span>
                  </div>
                  <div className="flex justify-between text-[#3c4a42]">
                    <span>Host Infrastructure Fee</span>
                    <span>₹{metrics.hostFee}</span>
                  </div>
                  <div className="flex justify-between text-[#3c4a42]">
                    <span>Platform Fee</span>
                    <span>₹{metrics.platformFee}</span>
                  </div>
                  <div className="pt-2 border-t border-[#dde4dd] flex justify-between font-black text-sm text-[#161d19]">
                    <span>Estimated Total</span>
                    <span className="text-[#006c49]">₹{metrics.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <Link
                  href={`/booking/${charger.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${currentSoc}&target=${targetSoc}`}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm text-center shadow-md transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Reserve Charging Slot (₹{metrics.totalCost})</span>
                </Link>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] font-semibold text-xs text-center border border-[#dde4dd] transition flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#006c49]" />
                  <span>
                    {distanceKm !== null
                      ? `Navigate with Google Maps (${distanceKm} km • ~${driveMinutes}m)`
                      : "Navigate with Google Maps"}
                  </span>
                </a>
              </div>

              {/* Guarantee Footer */}
              <div className="mt-4 pt-3 border-t border-[#dde4dd] flex items-center justify-center gap-2 text-[11px] text-[#3c4a42]">
                <ShieldCheck className="w-4 h-4 text-[#006c49]" />
                <span>100% Protected Community Booking Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
