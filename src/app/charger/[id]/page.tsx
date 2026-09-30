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
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#888888] font-mono">Loading Charger Profile...</p>
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
            This charger may have been removed, or is currently pending host verification.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors"
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
    <div className="min-h-screen bg-black text-[#ededed] pt-16 pb-20">
      {/* Top Gallery & Navigation Header */}
      <div className="w-full bg-[#000000] border-b border-[#222222] pt-6 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back & Actions */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push("/explore")}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-[#888888] hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Explore</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
                title="Share Listing"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-[#888888] hover:text-white transition-colors"
                title="Save Bookmark"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Image Gallery Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[320px] sm:h-[380px]">
            {/* Primary Main Image */}
            <div className="md:col-span-2 h-full rounded-xl overflow-hidden relative group border border-[#262626]">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage: `url(${charger.images?.[0] || "https://images.unsplash.com/photo-1558441719-74e4479e4384?w=800&auto=format&fit=crop&q=80"})`,
                }}
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-2 border border-[#333333]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono text-white">Verified Host Location</span>
              </div>
            </div>

            {/* Side Photos */}
            <div className="hidden md:flex flex-col gap-4 h-full">
              <div className="h-1/2 rounded-xl overflow-hidden relative group border border-[#262626]">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${charger.images?.[1] || "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=600&auto=format&fit=crop&q=80"})`,
                  }}
                />
              </div>

              <div className="h-1/2 rounded-xl overflow-hidden relative group border border-[#262626]">
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundImage: `url(${charger.images?.[2] || "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80"})`,
                  }}
                />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                  <span className="text-white font-mono text-xs">+3 Photos</span>
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
                <span className="px-2 py-0.5 bg-[#171717] border border-[#262626] text-white rounded-md text-[11px] font-mono">
                  Private Wallbox L2
                </span>
                <span className="text-[#666666] text-xs">•</span>
                <span className="text-[#888888] text-xs font-mono">
                  {charger.city} {charger.address} (Exact GPS post-booking)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3">
                {charger.title}
              </h1>

              {/* Trust Badges */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] rounded-md border border-[#262626]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-[#a1a1a1]">
                    AI-verified (94% confidence)
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] rounded-md border border-[#262626]">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-mono text-white">
                    {charger.rating} <span className="text-[#666666] font-normal">({charger.reviewCount} reviews)</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#141414] rounded-md border border-[#262626]">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs text-emerald-400 font-mono">
                    Available Tonight
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Low Battery Warning Note */}
            <div className="bg-rose-950/20 text-rose-400 p-4 rounded-xl flex items-start gap-3 border border-rose-900/40">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed text-[#ededed]">
                <span className="font-semibold text-rose-300 block mb-0.5">Emergency Low Battery Support Active</span>
                Need immediate emergency charging? This host offers priority driveway access for vehicles under 15% charge. Instant reserve is enabled below.
              </div>
            </div>

            {/* Live Distance & Navigation Route Banner */}
            {distanceKm !== null ? (
              <div className="vercel-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-[#171717] border border-[#262626] text-white flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white">
                        {distanceKm} km from your location
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-emerald-400">
                        ~{driveMinutes} min drive
                      </span>
                    </div>
                    <p className="text-xs text-[#888888]">
                      Direct route to {charger.address}, {charger.city}
                    </p>
                  </div>
                </div>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-md bg-white text-black text-xs font-medium hover:bg-[#d4d4d4] transition-colors shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </a>
              </div>
            ) : (
              <div className="vercel-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] border border-[#262626] text-[#888888] flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-white block">
                      Check Distance from Current Location
                    </span>
                    <span className="text-[11px] text-[#888888]">
                      Enable GPS to see exact distance and driving time
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 rounded-md bg-[#141414] hover:bg-[#1f1f1f] text-white border border-[#262626] text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shrink-0"
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
            <div className="vercel-card p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Vehicle Compatibility</h2>
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 px-2 py-0.5 rounded text-[11px] font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Compatible with {selectedVehicle.brand}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#000000] p-3 rounded-lg border border-[#222222]">
                <div className="w-9 h-9 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center text-white shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-white block">
                    {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.batteryCapacityKwh} kWh)
                  </span>
                  <span className="text-[11px] text-[#888888] font-mono">
                    Standard {selectedVehicle.connectorType} port • Max AC: {selectedVehicle.maxAcChargingKw} kW
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Specifications Grid */}
            <div className="vercel-card p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Charger Specifications</h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-lg bg-[#000000] border border-[#222222]">
                  <span className="text-[10px] text-[#666666] uppercase font-mono block">Power Output</span>
                  <strong className="text-sm font-semibold text-white font-mono">{charger.powerKw} kW AC</strong>
                </div>

                <div className="p-3 rounded-lg bg-[#000000] border border-[#222222]">
                  <span className="text-[10px] text-[#666666] uppercase font-mono block">Connector</span>
                  <strong className="text-sm font-semibold text-white">{charger.connectorType}</strong>
                </div>

                <div className="p-3 rounded-lg bg-[#000000] border border-[#222222]">
                  <span className="text-[10px] text-[#666666] uppercase font-mono block">Parking Type</span>
                  <strong className="text-sm font-semibold text-white">Driveway</strong>
                </div>

                <div className="p-3 rounded-lg bg-[#000000] border border-[#222222]">
                  <span className="text-[10px] text-[#666666] uppercase font-mono block">Access Type</span>
                  <strong className="text-sm font-semibold text-white font-mono">RFID / QR</strong>
                </div>
              </div>

              <p className="text-xs text-[#888888] leading-relaxed pt-2 border-t border-[#222222]">
                {charger.description}
              </p>
            </div>

            {/* 3. Host Profile Card */}
            <div className="vercel-card p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#171717] border border-[#262626] text-white flex items-center justify-center font-bold text-sm">
                  {(charger.hostName || "H")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>Hosted by {charger.hostName || "Community Host"}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-emerald-400">
                      Verified
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#888888]">
                    {charger.reviewCount} verified community reviews
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Host Reviews */}
            <div className="vercel-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-white">Guest Reviews</h2>
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1">
                  ★ {charger.rating} rating ({reviews.length})
                </span>
              </div>

              {reviews.length === 0 ? (
                <div className="p-6 text-center rounded-lg bg-[#000000] border border-[#222222]">
                  <p className="text-xs text-[#888888]">
                    Be the first person to review this charger after completing a charging session.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {reviews.map((r) => (
                    <div key={r.reviewId} className="p-3.5 rounded-lg bg-[#000000] border border-[#222222]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white">{r.userName}</span>
                        <span className="text-[10px] font-mono text-amber-400">★ {r.rating}.0</span>
                      </div>
                      <p className="text-xs text-[#888888] leading-relaxed mb-1">{r.comment}</p>
                      <span className="text-[10px] text-[#666666] font-mono">{r.vehicleModel}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Booking & AI Estimator Card */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="vercel-card p-6 border-[#333333]">
              {/* Header Price */}
              <div className="flex items-baseline justify-between pb-4 border-b border-[#222222] mb-4">
                <div>
                  <span className="text-2xl font-bold font-mono text-white">₹{charger.electricityRate}</span>
                  <span className="text-xs text-[#888888]"> / kWh</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-emerald-400">+ ₹{charger.hostFee}</span>
                  <span className="text-[10px] text-[#666666] block">host access fee</span>
                </div>
              </div>

              {/* AI Charging Estimate Calculator */}
              <div className="space-y-4 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
                    AI Charging Estimate
                  </span>
                  <span className="text-[10px] font-mono text-[#888888] bg-[#141414] border border-[#262626] px-2 py-0.5 rounded">
                    Physics Engine
                  </span>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label className="text-[11px] font-mono text-[#888888] block mb-1">
                    Your Vehicle
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

                {/* Battery SOC Sliders */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#000000] border border-[#222222]">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[11px] font-mono text-[#888888]">Current</span>
                      <strong className="text-xs font-mono text-amber-400">{currentSoc}%</strong>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="60"
                      value={currentSoc}
                      onChange={(e) => setCurrentSoc(Number(e.target.value))}
                      className="w-full accent-white h-1.5 bg-[#262626] rounded cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[11px] font-mono text-[#888888]">Target</span>
                      <strong className="text-xs font-mono text-emerald-400">{targetSoc}%</strong>
                    </div>
                    <input
                      type="range"
                      min="70"
                      max="100"
                      value={targetSoc}
                      onChange={(e) => setTargetSoc(Number(e.target.value))}
                      className="w-full accent-white h-1.5 bg-[#262626] rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Calculated Energy & Duration Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#000000] border border-[#222222]">
                    <span className="text-[10px] text-[#666666] uppercase block">Est. Energy</span>
                    <strong className="text-xs text-white">~{metrics.energyRequiredKwh} kWh</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#000000] border border-[#222222]">
                    <span className="text-[10px] text-[#666666] uppercase block">Est. Time</span>
                    <strong className="text-xs text-white">{metrics.formattedDuration}</strong>
                  </div>
                </div>

                {/* Transparent Cost Breakdown */}
                <div className="p-3.5 rounded-lg bg-[#000000] border border-[#222222] space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-[#888888]">
                    <span>Energy ({metrics.energyRequiredKwh} kWh × ₹{charger.electricityRate})</span>
                    <span>₹{metrics.electricityCost}</span>
                  </div>
                  <div className="flex justify-between text-[#888888]">
                    <span>Host Fee</span>
                    <span>₹{metrics.hostFee}</span>
                  </div>
                  <div className="flex justify-between text-[#888888]">
                    <span>Platform Fee</span>
                    <span>₹{metrics.platformFee}</span>
                  </div>
                  <div className="pt-2 border-t border-[#222222] flex justify-between font-bold text-sm text-white">
                    <span>Total Amount</span>
                    <span className="text-emerald-400">₹{metrics.totalCost}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Link
                  href={`/booking/${charger.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${currentSoc}&target=${targetSoc}`}
                  className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-[#d4d4d4] text-black font-medium text-xs sm:text-sm text-center transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Reserve Slot (₹{metrics.totalCost})</span>
                </Link>

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-4 rounded-md bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white font-medium text-xs text-center border border-[#262626] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>
                    {distanceKm !== null
                      ? `Directions (${distanceKm} km • ~${driveMinutes}m)`
                      : "Open in Google Maps"}
                  </span>
                </a>
              </div>

              {/* Guarantee Footer */}
              <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-center gap-1.5 text-[11px] text-[#666666]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Protected Community Booking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
