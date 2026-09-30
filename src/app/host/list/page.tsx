"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChargerPowerType, ConnectorType, AIVerificationResult } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase/client";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import Link from "next/link";
import {
  Zap,
  MapPin,
  Coins,
  Camera,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UploadCloud,
  Navigation,
  Check,
  Building,
  Lock,
} from "lucide-react";

export default function ListMyChargerPage() {
  const router = useRouter();
  const { user, profile, openAuthModal } = useAuth();
  const [step, setStep] = useState<number>(1);

  // Form State
  // Step 1: Info
  const [title, setTitle] = useState("My Home Smart AC Wallbox");
  const [chargerType, setChargerType] = useState<ChargerPowerType>("7.2 kW AC");
  const [powerKw, setPowerKw] = useState<number>(7.2);
  const [connectorType, setConnectorType] = useState<ConnectorType>("Type 2");
  const [supportedVehicles, setSupportedVehicles] = useState<string[]>([
    "Tata Nexon EV",
    "Tata Punch EV",
    "MG ZS EV",
    "Mahindra XUV400",
  ]);

  // Step 2: Location
  const [latitude, setLatitude] = useState<number>(18.5204);
  const [longitude, setLongitude] = useState<number>(73.8567);
  const [address, setAddress] = useState("Bungalow 12, Baner Road");
  const [city, setCity] = useState("Pune");
  const [state, setState] = useState("Maharashtra");
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Step 3: Pricing & Availability
  const [electricityRate, setElectricityRate] = useState<number>(9.0);
  const [hostFee, setHostFee] = useState<number>(35.0);
  const [availableFrom, setAvailableFrom] = useState("19:00");
  const [availableUntil, setAvailableUntil] = useState("08:00");
  const [isSmartPricingLoading, setIsSmartPricingLoading] = useState(false);
  const [smartPricingResult, setSmartPricingResult] = useState<string | null>(null);

  // Step 4: Verification Media
  const [chargerImageUrl, setChargerImageUrl] = useState<string>(
    "https://images.unsplash.com/photo-1558441719-74e4479e4384?w=600&auto=format&fit=crop&q=80"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    "https://images.unsplash.com/photo-1558441719-74e4479e4384?w=600&auto=format&fit=crop&q=80"
  );

  // Step 5: AI Verification Status
  const [isAiVerifying, setIsAiVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<AIVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  // Geolocation trigger with reverse geocoding
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();

          if (data && data.address) {
            const addr = data.address;
            // Build a readable street address
            const streetParts = [
              addr.house_number,
              addr.road || addr.pedestrian || addr.neighbourhood,
            ].filter(Boolean);
            const streetAddress = streetParts.join(", ") || addr.suburb || addr.village || "Near " + (addr.city || addr.town || "");
            
            setAddress(streetAddress);
            setCity(addr.city || addr.town || addr.village || addr.county || addr.state_district || "");
            setState(addr.state || "");
          }
        } catch (err) {
          console.error("Reverse geocoding failed:", err);
          // Coordinates are still set even if reverse geocode fails
        }

        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please allow location access in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location unavailable. Please check your device's GPS settings.");
            break;
          case err.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("Unable to detect location. Please enter manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // AI Smart Pricing Suggestion trigger
  const handleSmartPricing = async () => {
    setIsSmartPricingLoading(true);
    try {
      const res = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          charger: { powerKw, electricityRate },
          nearbyAverage: 35,
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestion) {
        setHostFee(data.suggestion.suggestedHostFee);
        setSmartPricingResult(data.suggestion.reason);
      }
    } catch (err) {
      console.error("Smart pricing error:", err);
    } finally {
      setIsSmartPricingLoading(false);
    }
  };

  // Run AI Verification Scan
  const handleRunAiVerification = async () => {
    setIsAiVerifying(true);
    try {
      const res = await fetch("/api/ai/verify-charger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: chargerImageUrl,
          claimedSpecs: {
            title,
            powerKw,
            connectorType,
            chargerType,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.verification) {
        setVerificationResult(data.verification);
      }
    } catch (err) {
      console.error("AI verification failed:", err);
    } finally {
      setIsAiVerifying(false);
    }
  };

  // Final Submission
  const handleSubmitListing = async () => {
    if (!user) {
      openAuthModal();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/chargers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId: user.id,
          hostName: profile?.name || user.email?.split("@")[0] || "Community Host",
          hostPhone: profile?.phone || "",
          title,
          description: `Private ${powerKw} kW AC charging point in ${city}. Hosted overnight with secure private driveway parking.`,
          powerKw,
          connectorType,
          chargerType,
          latitude,
          longitude,
          address,
          city,
          state,
          electricityRate,
          hostFee,
          platformFee: 12,
          availableFrom,
          availableUntil,
          images: chargerImageUrl ? [chargerImageUrl] : [],
          supportedVehicles,
          verificationScore: verificationResult?.confidence || 0.94,
          verificationReason: verificationResult?.summary || "AI vision check completed",
          verificationStatus: "PENDING",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsSuccess(true);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4fbf4] text-[#161d19] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header / Intro */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-wider text-[#006c49] font-bold mb-1">
              Host Onboarding
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#161d19] tracking-tight">
              List Your EV Charger
            </h1>
            <p className="text-sm text-[#3c4a42] mt-1">
              Monetize your parking spot and join the world&apos;s leading decentralized energy network.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#eef6ee] px-4 py-2 rounded-xl border border-[#dde4dd]">
            <CheckCircle2 className="w-4 h-4 text-[#006c49]" />
            <span className="text-xs font-bold text-[#161d19]">
              Earn up to ₹18,000 / month
            </span>
          </div>
        </div>

        {/* 5-Step Progress Stepper */}
        <div className="w-full bg-white border border-[#dde4dd] rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-5 gap-2 relative">
            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Location" },
              { num: 3, label: "Pricing" },
              { num: 4, label: "Photos" },
              { num: 5, label: "Review" },
            ].map((s) => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => setStep(s.num)}
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mb-1.5 transition-all ${
                      isPast
                        ? "bg-[#006c49] text-white"
                        : isCurrent
                        ? "bg-[#006c49] text-white shadow-md ring-4 ring-[#82f5c1]/50"
                        : "bg-[#eef6ee] text-[#3c4a42]"
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] sm:text-xs font-semibold truncate ${
                      isCurrent
                        ? "text-[#006c49] font-bold"
                        : isPast
                        ? "text-[#161d19]"
                        : "text-[#3c4a42]"
                    }`}
                  >
                    {s.num}. {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Grid: Form on Left (7 cols), Live Preview Card on Right (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Multi-Step Forms */}
          <div className="lg:col-span-7 space-y-6">
            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#dde4dd] pb-3">
                  <h2 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                    <Zap className="w-5 h-5 text-[#006c49]" />
                    <span>Charger Specifications</span>
                  </h2>
                  <span className="text-xs text-[#3c4a42]">Step 1 of 5</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161d19] block mb-1">
                    Listing Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161d19] focus:outline-none focus:border-[#006c49]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161d19] block mb-2">
                    Power Output (kW)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "3.3 kW", kw: 3.3 },
                      { label: "7.2 kW", kw: 7.2 },
                      { label: "11 kW", kw: 11 },
                      { label: "22 kW", kw: 22 },
                    ].map((p) => (
                      <button
                        key={p.kw}
                        type="button"
                        onClick={() => {
                          setPowerKw(p.kw);
                          setChargerType(`${p.kw} kW AC` as ChargerPowerType);
                        }}
                        className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition ${
                          powerKw === p.kw
                            ? "bg-[#006c49] text-white shadow-sm"
                            : "bg-[#eef6ee] text-[#161d19] hover:bg-[#dde4dd]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161d19] block mb-2">
                    Connector Standard
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Type 2", "16A 3-Pin", "CCS Combo"].map((conn) => (
                      <button
                        key={conn}
                        type="button"
                        onClick={() => setConnectorType(conn as ConnectorType)}
                        className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition ${
                          connectorType === conn
                            ? "bg-[#006c49] text-white shadow-sm"
                            : "bg-[#eef6ee] text-[#161d19] hover:bg-[#dde4dd]"
                        }`}
                      >
                        {conn}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <span>Continue to Location</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Location */}
            {step === 2 && (
              <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#dde4dd] pb-3">
                  <h2 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#006c49]" />
                    <span>Exact Location Setup</span>
                  </h2>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      isLocating
                        ? "bg-[#006c49] text-white"
                        : "bg-[#eef6ee] text-[#006c49] hover:bg-[#dde4dd] border border-[#c2e2c8]"
                    }`}
                  >
                    {isLocating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Detecting location...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5" />
                        <span>📍 Use My Location</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Location Error */}
                {locationError && (
                  <div className="p-3 rounded-xl bg-[#ffdad6] border border-[#fc7c78]/40 text-xs text-[#ba1a1a] font-medium">
                    ⚠️ {locationError}
                  </div>
                )}

                {/* Location Success - show detected coordinates */}
                {!locationError && latitude !== 18.5204 && (
                  <div className="p-3 rounded-xl bg-[#eef6ee] border border-[#82f5c1]/60 text-xs text-[#006c49] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Location detected: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°E — address fields updated automatically</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[#161d19] block mb-1">
                    Street Address &amp; House Number
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161d19] focus:outline-none focus:border-[#006c49]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#161d19] block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161d19] focus:outline-none focus:border-[#006c49]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#161d19] block mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161d19] focus:outline-none focus:border-[#006c49]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] font-bold text-xs rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-6 py-3 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <span>Continue to Pricing</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Pricing */}
            {step === 3 && (
              <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#dde4dd] pb-3">
                  <h2 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                    <Coins className="w-5 h-5 text-[#006c49]" />
                    <span>Pricing &amp; Availability</span>
                  </h2>
                  <button
                    type="button"
                    onClick={handleSmartPricing}
                    disabled={isSmartPricingLoading}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006c49] bg-[#eef6ee] px-2.5 py-1 rounded-lg border border-[#dde4dd] hover:bg-[#dde4dd]"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#006c49]" />
                    <span>{isSmartPricingLoading ? "Analyzing Market..." : "AI Pricing Suggestion"}</span>
                  </button>
                </div>

                {smartPricingResult && (
                  <div className="p-3.5 rounded-xl bg-[#eef6ee] border border-[#82f5c1]/60 text-xs text-[#006c49]">
                    <span className="font-bold block mb-1">AI Smart Pricing Rationale:</span>
                    {smartPricingResult}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#161d19] block mb-1">
                      Electricity Rate (₹/kWh)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={electricityRate}
                      onChange={(e) => setElectricityRate(Number(e.target.value))}
                      className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161d19] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#3c4a42] mt-1 block">Usually DISCOM tariff (₹8–₹12)</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#161d19] block mb-1">
                      Host Infrastructure Fee (₹/session)
                    </label>
                    <input
                      type="number"
                      value={hostFee}
                      onChange={(e) => setHostFee(Number(e.target.value))}
                      className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#161d19] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#3c4a42] mt-1 block">Your parking &amp; charger profit</span>
                  </div>
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-4 py-2.5 bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] font-bold text-xs rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="px-6 py-3 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <span>Continue to Photos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Photos & AI Verification */}
            {step === 4 && (
              <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#dde4dd] pb-3">
                  <h2 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#006c49]" />
                    <span>Charger Photos &amp; AI-Assisted Verification</span>
                  </h2>
                  <span className="text-xs text-[#3c4a42]">Step 4 of 5</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#161d19] block mb-1">
                    Upload Charger Photo (Supabase Storage)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImagePreview(URL.createObjectURL(file));
                        if (SUPABASE_CONFIG.isConfigured && user) {
                          const fileExt = file.name.split(".").pop();
                          const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                          const { data, error } = await supabase.storage
                            .from("charger-images")
                            .upload(fileName, file);
                          if (data) {
                            const { data: { publicUrl } } = supabase.storage
                              .from("charger-images")
                              .getPublicUrl(fileName);
                            setChargerImageUrl(publicUrl);
                          }
                        }
                      }
                    }}
                    className="w-full text-xs text-[#3c4a42] p-2.5 bg-[#eef6ee] border border-[#dde4dd] rounded-xl cursor-pointer"
                  />
                  <div className="mt-2">
                    <label className="text-[10px] text-[#3c4a42] block mb-0.5">Or direct photo URL</label>
                    <input
                      type="text"
                      value={chargerImageUrl}
                      onChange={(e) => {
                        setChargerImageUrl(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3 py-1.5 text-xs text-[#161d19] focus:outline-none"
                    />
                  </div>
                </div>

                {/* AI Verification Scanner Preview */}
                <div className="p-4 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#161d19] flex items-center gap-1.5 uppercase">
                      <Sparkles className="w-4 h-4 text-[#006c49]" />
                      AI Vision Scanner
                    </span>
                    <button
                      type="button"
                      onClick={handleRunAiVerification}
                      disabled={isAiVerifying}
                      className="px-3 py-1.5 rounded-lg bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold transition shadow-sm"
                    >
                      {isAiVerifying ? "Scanning Image..." : "Run AI Verification"}
                    </button>
                  </div>

                  {verificationResult && (
                    <div className="p-3 rounded-xl bg-white border border-[#dde4dd] text-xs space-y-2">
                      <div className="flex justify-between items-center font-bold text-[#006c49]">
                        <span>AI Confidence Score: {Math.round(verificationResult.confidence * 100)}%</span>
                        <span className="text-emerald-700 bg-[#82f5c1] px-2 py-0.5 rounded-full text-[10px]">
                          EV Wallbox Verified ✓
                        </span>
                      </div>
                      <p className="text-[#3c4a42] text-[11px] leading-relaxed">
                        {verificationResult.summary}
                      </p>
                      <p className="text-[10px] text-[#3c4a42]/80 italic">
                        *{verificationResult.isAiAssistedNotice}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-4 py-2.5 bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] font-bold text-xs rounded-xl transition"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-6 py-3 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <span>Review &amp; Publish</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Submit */}
            {step === 5 && (
              <div className="bg-white border border-[#dde4dd] rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b border-[#dde4dd] pb-3">
                  <h2 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
                    <span>Final Review &amp; Confirmation</span>
                  </h2>
                  <span className="text-xs text-[#3c4a42]">Ready to publish</span>
                </div>

                {isSuccess ? (
                  <div className="p-6 rounded-2xl bg-[#eef6ee] border border-[#82f5c1] text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#006c49] text-white flex items-center justify-center mx-auto">
                      <Check className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-[#161d19]">
                      Charger Successfully Listed!
                    </h3>
                    <p className="text-xs text-[#3c4a42] max-w-sm mx-auto">
                      Your community AC charger is now active on the VoltLoop map with AI-assisted verification.
                    </p>
                    <div className="pt-2 flex justify-center gap-3">
                      <button
                        onClick={() => router.push("/explore")}
                        className="px-5 py-2.5 bg-[#006c49] text-white font-bold text-xs rounded-xl shadow-sm"
                      >
                        View on Map
                      </button>
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="px-5 py-2.5 bg-[#eef6ee] border border-[#dde4dd] text-[#161d19] font-bold text-xs rounded-xl"
                      >
                        Host Dashboard
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-xl bg-[#eef6ee] border border-[#dde4dd] space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#3c4a42]">Title:</span>
                        <strong className="text-[#161d19]">{title}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#3c4a42]">Power &amp; Port:</span>
                        <strong className="text-[#006c49]">{powerKw} kW AC • {connectorType}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#3c4a42]">Location:</span>
                        <strong className="text-[#161d19]">{address}, {city}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#3c4a42]">Rates:</span>
                        <strong className="text-[#161d19]">₹{electricityRate}/kWh + ₹{hostFee} host fee</strong>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="px-4 py-2.5 bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] font-bold text-xs rounded-xl transition"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={handleSubmitListing}
                        disabled={isSubmitting}
                        className="px-8 py-3 bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-2"
                      >
                        <span>{isSubmitting ? "Publishing Listing..." : "Publish Charger Now"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Live Listing Preview Card */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-white border border-[#dde4dd] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#dde4dd] pb-3">
                <span className="text-xs font-bold text-[#161d19] uppercase tracking-wider">
                  Live Listing Preview
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                  Instant Reserve
                </span>
              </div>

              {/* Photo Preview */}
              <div
                className="w-full h-44 rounded-xl bg-cover bg-center border border-[#dde4dd] relative overflow-hidden"
                style={{
                  backgroundImage: `url(${chargerImageUrl || "https://images.unsplash.com/photo-1558441719-74e4479e4384?w=600&auto=format&fit=crop&q=80"})`,
                }}
              >
                <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#006c49] shadow-sm">
                  ⚡ {powerKw} kW AC
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#161d19] mb-1">{title}</h3>
                <p className="text-xs text-[#3c4a42] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                  <span>{address || "Baner"}, {city || "Pune"}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd]">
                <div>
                  <span className="text-[10px] text-[#3c4a42] block">Tariff</span>
                  <strong className="text-sm font-bold text-[#161d19]">₹{electricityRate}/kWh</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#3c4a42] block">Host Fee</span>
                  <strong className="text-sm font-bold text-[#006c49]">₹{hostFee}/session</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#eef6ee] text-xs text-[#3c4a42] flex items-center justify-between">
                <span>Est. Host Monthly Earnings:</span>
                <strong className="text-sm font-black text-[#006c49]">₹12,400+</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
