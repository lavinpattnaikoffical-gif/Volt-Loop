"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Charger } from "@/types";
import Link from "next/link";
import {
  Zap,
  ShieldCheck,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Navigation,
  PlusCircle,
} from "lucide-react";

// Dynamically import Leaflet Map to avoid SSR errors
const ChargerMap = dynamic(() => import("@/components/map/ChargerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-black border border-[#262626]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[#888888] font-mono">Loading Charger Map...</span>
      </div>
    </div>
  ),
});

// Haversine distance calculator
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export default function ExplorePage() {
  const [allChargers, setAllChargers] = useState<Charger[]>([]);
  const [filteredChargers, setFilteredChargers] = useState<Charger[]>([]);
  const [selectedChargerId, setSelectedChargerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Current Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [isAiNaturalSearching, setIsAiNaturalSearching] = useState(false);
  const [naturalSearchNotice, setNaturalSearchNotice] = useState<string | null>(null);

  const [selectedPower, setSelectedPower] = useState<string>("all");
  const [selectedConnector, setSelectedConnector] = useState<string>("all");
  const [availableTonightOnly, setAvailableTonightOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedVehicleModel, setSelectedVehicleModel] = useState<string>("all");

  // Mobile drawer state
  const [mobileView, setMobileView] = useState<"map" | "list">("map");

  // Load live chargers from API on mount
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/chargers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.chargers)) {
          setAllChargers(data.chargers);
          setFilteredChargers(data.chargers);
        } else {
          setAllChargers([]);
          setFilteredChargers([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching chargers:", err);
        setAllChargers([]);
        setFilteredChargers([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Filter application
  useEffect(() => {
    let result = [...allChargers];

    // Power filter
    if (selectedPower !== "all") {
      const p = parseFloat(selectedPower);
      result = result.filter((c) => Math.abs(c.powerKw - p) <= 1.5 || c.powerKw >= p);
    }

    // Connector filter
    if (selectedConnector !== "all") {
      result = result.filter((c) => c.connectorType === selectedConnector);
    }

    // Available tonight filter
    if (availableTonightOnly) {
      result = result.filter((c) => c.availableTonight && c.availability === "AVAILABLE");
    }

    // Rating filter
    if (minRating > 0) {
      result = result.filter((c) => c.rating >= minRating);
    }

    // Vehicle compatibility
    if (selectedVehicleModel !== "all") {
      result = result.filter(
        (c) =>
          c.supportedVehicles.some((v) =>
            v.toLowerCase().includes(selectedVehicleModel.toLowerCase())
          ) || c.supportedVehicles.length === 0
      );
    }

    // Keyword search (city, address, title)
    if (searchQuery.trim() && !naturalSearchNotice) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.city.toLowerCase().includes(q) ||
          c.state.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q)
      );
    }

    // Sort by distance if current user location is active
    if (userLocation) {
      result = result.map((c) => ({
        ...c,
        distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, c.latitude, c.longitude),
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result.sort((a, b) => ((a as any).distanceKm ?? Infinity) - ((b as any).distanceKm ?? Infinity));
    }

    setFilteredChargers(result);
  }, [
    allChargers,
    selectedPower,
    selectedConnector,
    availableTonightOnly,
    minRating,
    selectedVehicleModel,
    searchQuery,
    naturalSearchNotice,
    userLocation,
  ]);

  // Restore saved user location from sessionStorage
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
      console.warn("Could not parse saved location:", e);
    }
  }, []);

  // Request browser GPS location
  const handleGetLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    if (userLocation) {
      setUserLocation(null);
      try {
        sessionStorage.removeItem("voltloop_user_coords");
      } catch (e) {}
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

  const handleLocationFound = (coords: { lat: number; lng: number }) => {
    setUserLocation(coords);
    try {
      sessionStorage.setItem("voltloop_user_coords", JSON.stringify(coords));
    } catch (e) {}
  };

  // Execute AI Natural Language Search
  const handleNaturalSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsAiNaturalSearching(true);
    setNaturalSearchNotice(null);

    try {
      const res = await fetch("/api/ai/natural-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });
      const data = await res.json();

      if (data.success && data.chargers) {
        setFilteredChargers(data.chargers);
        setNaturalSearchNotice(
          `AI parsed: ${data.filters.powerKw ? `${data.filters.powerKw} kW` : ""} ${data.filters.location || ""} ${data.filters.availableTonight ? "• Available tonight" : ""} ${data.filters.maxPrice ? `• Under ₹${data.filters.maxPrice}` : ""}`
        );
      }
    } catch (err) {
      console.error("AI Natural search error:", err);
    } finally {
      setIsAiNaturalSearching(false);
    }
  };

  const resetFilters = () => {
    setSelectedPower("all");
    setSelectedConnector("all");
    setAvailableTonightOnly(false);
    setMinRating(0);
    setSelectedVehicleModel("all");
    setSearchQuery("");
    setNaturalSearchNotice(null);
    setUserLocation(null);
    setFilteredChargers(allChargers);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] pt-14 overflow-hidden bg-black text-[#ededed]">
      {/* Top Search & Filter Bar (Vercel Style) */}
      <div className="border-b border-[#262626] bg-[#0a0a0a] px-4 py-2.5 shrink-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-2.5">
          {/* Natural Search Input */}
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#888888]">
                {isAiNaturalSearching ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNaturalSearch(searchQuery);
                }}
                placeholder='AI search: "7 kW charger near Satara tonight under ₹250"'
                className="w-full pl-9 pr-20 py-1.5 rounded-md bg-[#141414] border border-[#262626] focus:border-[#555555] text-xs sm:text-sm text-white placeholder-[#666666] outline-none transition-colors"
              />
              <button
                onClick={() => handleNaturalSearch(searchQuery)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-white text-black text-xs font-medium hover:bg-[#d4d4d4] transition-colors"
              >
                Search
              </button>
            </div>

            {/* Quick "Near Me" GPS Button */}
            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              title={userLocation ? "Click to clear location" : "Find chargers near me"}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                userLocation
                  ? "bg-white text-black border-white"
                  : "bg-[#141414] text-[#ededed] border-[#262626] hover:border-[#404040]"
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : userLocation ? "rotate-45" : ""}`} />
              <span className="hidden sm:inline">{userLocation ? "Near Me (Active)" : "Near Me"}</span>
            </button>
          </div>

          {/* Quick AI Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-0.5 md:pb-0 text-xs shrink-0">
            <span className="text-[11px] text-[#666666] font-mono whitespace-nowrap">
              Suggestions:
            </span>
            <button
              onClick={() => {
                const q = "7 kW charger near Satara available tonight under ₹250";
                setSearchQuery(q);
                handleNaturalSearch(q);
              }}
              className="px-2 py-0.5 rounded bg-[#141414] hover:bg-[#202020] text-[#a1a1a1] hover:text-white border border-[#262626] whitespace-nowrap text-xs font-mono transition-colors"
            >
              Satara 7 kW
            </button>
            <button
              onClick={() => {
                const q = "11 kW charger Pune";
                setSearchQuery(q);
                handleNaturalSearch(q);
              }}
              className="px-2 py-0.5 rounded bg-[#141414] hover:bg-[#202020] text-[#a1a1a1] hover:text-white border border-[#262626] whitespace-nowrap text-xs font-mono transition-colors"
            >
              Pune 11 kW
            </button>
          </div>
        </div>

        {/* Natural Search Result Pill */}
        {naturalSearchNotice && (
          <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between bg-[#141414] border border-[#333333] px-3 py-1 rounded-md text-xs text-[#a1a1a1]">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>{naturalSearchNotice}</span>
            </span>
            <button
              onClick={() => {
                setNaturalSearchNotice(null);
                setFilteredChargers(allChargers);
              }}
              className="text-white hover:underline text-[11px] font-mono"
            >
              Clear
            </button>
          </div>
        )}

        {/* User Location Active Pill */}
        {userLocation && (
          <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between bg-[#141414] border border-[#333333] px-3 py-1 rounded-md text-xs text-[#a1a1a1]">
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sorted by distance from your current location</span>
            </span>
            <button
              onClick={() => setUserLocation(null)}
              className="text-white hover:underline text-[11px] font-mono"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Split View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Filter Controls & Charger Cards List */}
        <aside
          className={`w-full md:w-[440px] lg:w-[480px] shrink-0 border-r border-[#262626] bg-[#000000] flex flex-col z-20 transition-all ${
            mobileView === "list" ? "block" : "hidden md:flex"
          }`}
        >
          {/* Quick Filters Row */}
          <div className="p-3 border-b border-[#262626] bg-[#0a0a0a] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-[#a1a1a1] uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </span>
              <button
                onClick={resetFilters}
                className="text-[11px] text-[#888888] hover:text-white flex items-center gap-1 transition-colors font-mono"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Power Selector */}
              <div>
                <label className="text-[10px] text-[#888888] font-mono block mb-1">
                  Power
                </label>
                <select
                  value={selectedPower}
                  onChange={(e) => setSelectedPower(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1.5 text-white text-xs outline-none focus:border-[#555555]"
                >
                  <option value="all">All (3.3 - 22 kW)</option>
                  <option value="7.2">7.2 kW AC</option>
                  <option value="11">11 kW AC</option>
                  <option value="22">22 kW AC</option>
                  <option value="3.3">3.3 kW AC</option>
                </select>
              </div>

              {/* Vehicle Compatibility */}
              <div>
                <label className="text-[10px] text-[#888888] font-mono block mb-1">
                  Vehicle
                </label>
                <select
                  value={selectedVehicleModel}
                  onChange={(e) => setSelectedVehicleModel(e.target.value)}
                  className="w-full bg-[#141414] border border-[#262626] rounded-md px-2 py-1.5 text-white text-xs outline-none focus:border-[#555555]"
                >
                  <option value="all">Any EV</option>
                  <option value="Tata">Tata Nexon EV</option>
                  <option value="MG">MG ZS EV</option>
                  <option value="Mahindra">Mahindra XUV400</option>
                  <option value="Hyundai">Hyundai Ioniq 5</option>
                  <option value="BYD">BYD Atto 3</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#a1a1a1]">
                <input
                  type="checkbox"
                  checked={availableTonightOnly}
                  onChange={(e) => setAvailableTonightOnly(e.target.checked)}
                  className="accent-white rounded w-3.5 h-3.5"
                />
                <span>Available Tonight Only</span>
              </label>

              <span className="text-[11px] font-mono text-[#888888]">
                {filteredChargers.length} results
              </span>
            </div>
          </div>

          {/* Scrollable Charger Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-[#888888]">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="font-mono">Loading community chargers...</p>
              </div>
            ) : allChargers.length === 0 ? (
              <div className="p-6 text-center vercel-card">
                <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto mb-2 border border-[#262626]">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-white mb-1">
                  No community chargers available yet.
                </h4>
                <p className="text-xs text-[#888888] mb-4 max-w-xs mx-auto">
                  Be the first host in your area and monetize your idle home wallbox.
                </p>
                <Link
                  href="/host/list"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List Your Charger</span>
                </Link>
              </div>
            ) : filteredChargers.length === 0 ? (
              <div className="p-6 text-center text-xs vercel-card">
                <p className="font-semibold text-white mb-1">No chargers match your criteria</p>
                <p className="text-[#888888] mb-3">Try clearing some filters to expand results.</p>
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredChargers.map((c) => {
                const isSelected = selectedChargerId === c.chargerId;
                return (
                  <div
                    key={c.chargerId}
                    onClick={() => setSelectedChargerId(c.chargerId)}
                    className={`p-3.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-[#111111] border-white shadow-sm"
                        : "bg-[#0a0a0a] border-[#222222] hover:border-[#383838]"
                    }`}
                  >
                    {/* Top Row: Power & Availability */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#141414] border border-[#262626] text-white">
                          {c.powerKw} kW AC
                        </span>
                        <span className="text-[10px] font-mono text-[#888888]">
                          {c.connectorType}
                        </span>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(c as any).distanceKm !== undefined && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#171717] text-[#a1a1a1] border border-[#262626] flex items-center gap-1">
                            <Navigation className="w-2.5 h-2.5" />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <span>{(c as any).distanceKm} km</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#a1a1a1]">
                        <span className="text-amber-400">★ {c.rating}</span>
                        <span className="text-[#555555]">({c.reviewCount})</span>
                      </div>
                    </div>

                    {/* Charger Title & Location */}
                    <h3 className="font-semibold text-sm text-white mb-1 leading-snug">
                      {c.title}
                    </h3>

                    <p className="text-xs text-[#888888] mb-2.5 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-[#666666] shrink-0" />
                      <span className="truncate">{c.address}, {c.city}</span>
                    </p>

                    {/* AI Verification Badge */}
                    <div className="flex items-center gap-1.5 text-[10px] text-[#a1a1a1] mb-3 bg-[#111111] border border-[#262626] px-2 py-0.5 rounded w-max font-mono">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified Hardware ({Math.round((c.verificationScore || 0.9) * 100)}%)</span>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="pt-2.5 border-t border-[#222222] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white font-mono">
                          ₹{c.electricityRate}{" "}
                          <span className="text-[10px] text-[#888888] font-normal">/kWh</span>
                        </div>
                        <div className="text-[10px] text-[#666666] font-mono">
                          + ₹{c.hostFee} host fee
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/charger/${c.chargerId}`}
                          className="px-2.5 py-1 rounded bg-[#141414] hover:bg-[#202020] border border-[#262626] text-xs text-[#ededed] transition-colors"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/booking/${c.chargerId}`}
                          className="px-3 py-1 rounded bg-white text-black hover:bg-[#d4d4d4] font-medium text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Reserve</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Side: Leaflet Interactive OpenStreetMap Container */}
        <main
          className={`flex-1 h-full relative transition-all ${
            mobileView === "map" ? "block" : "hidden md:block"
          }`}
        >
          <ChargerMap
            chargers={filteredChargers}
            selectedChargerId={selectedChargerId}
            onSelectCharger={(charger) => setSelectedChargerId(charger?.chargerId || null)}
            userLocation={userLocation}
            onLocationFound={handleLocationFound}
          />
        </main>
      </div>
    </div>
  );
}
