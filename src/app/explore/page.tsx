"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Charger, Vehicle, ConnectorType } from "@/types";
import Link from "next/link";
import {
  Search,
  Filter,
  Zap,
  Star,
  ShieldCheck,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Car,
  X,
  RotateCcw,
  CheckCircle2,
  Navigation,
  PlusCircle,
} from "lucide-react";

// Dynamically import Leaflet Map to avoid SSR errors
const ChargerMap = dynamic(() => import("@/components/map/ChargerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium">Loading Community Charger Map...</span>
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
      // Toggle off location filter
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
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] pt-16 overflow-hidden bg-[#070b14] text-slate-100">
      {/* Top Search & Filter Bar */}
      <div className="border-b border-slate-800 bg-[#090e1a]/95 backdrop-blur-md px-4 py-3 shrink-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-3">
          {/* Natural Search Input with Current Location Action */}
          <div className="flex items-center gap-2 flex-1 w-full">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                {isAiNaturalSearching ? (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNaturalSearch(searchQuery);
                }}
                placeholder='Try AI search: "Find me a 7 kW charger near Satara available tonight under ₹250"'
                className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs sm:text-sm text-white placeholder-slate-500 transition shadow-inner"
              />
              <button
                onClick={() => handleNaturalSearch(searchQuery)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
              >
                <span>Search</span>
              </button>
            </div>

            {/* Quick "Near Me" GPS Button */}
            <button
              onClick={handleGetLocation}
              disabled={isLocating}
              title={userLocation ? "Click to disable location filter" : "Find community chargers near my location"}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                userLocation
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                  : "bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin" : userLocation ? "rotate-45" : ""}`} />
              <span className="hidden sm:inline">{userLocation ? "Near Me (Active)" : "Near Me"}</span>
            </button>
          </div>

          {/* Quick AI Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs shrink-0">
            <span className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
              Try:
            </span>
            <button
              onClick={() => {
                const q = "7 kW charger near Satara available tonight under ₹250";
                setSearchQuery(q);
                handleNaturalSearch(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 whitespace-nowrap font-medium transition"
            >
              Satara 7 kW tonight
            </button>
            <button
              onClick={() => {
                const q = "11 kW charger Pune";
                setSearchQuery(q);
                handleNaturalSearch(q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-emerald-400 border border-emerald-500/20 whitespace-nowrap font-medium transition"
            >
              Pune 11 kW
            </button>
          </div>
        </div>

        {/* Natural Search Result Pill */}
        {naturalSearchNotice && (
          <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-300">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{naturalSearchNotice}</span>
            </span>
            <button
              onClick={() => {
                setNaturalSearchNotice(null);
                setFilteredChargers(allChargers);
              }}
              className="text-emerald-400 hover:text-white font-bold text-[11px] underline"
            >
              Reset Search
            </button>
          </div>
        )}

        {/* User Location Active Pill */}
        {userLocation && (
          <div className="max-w-7xl mx-auto mt-2 flex items-center justify-between bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-xl text-xs text-cyan-300">
            <span className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Showing chargers sorted by distance from your current location</span>
            </span>
            <button
              onClick={() => setUserLocation(null)}
              className="text-cyan-400 hover:text-white font-medium text-[11px] underline"
            >
              Clear Location
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Split View (List / Filters on Left, Map on Right) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Side: Filter Controls & Charger Cards List */}
        <aside
          className={`w-full md:w-[460px] lg:w-[490px] shrink-0 border-r border-slate-800 bg-[#070b14] flex flex-col z-20 transition-all ${
            mobileView === "list" ? "block" : "hidden md:flex"
          }`}
        >
          {/* Quick Filters Row */}
          <div className="p-3.5 border-b border-slate-800 bg-[#0a101f] space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                Filter Community Chargers
              </span>
              <button
                onClick={resetFilters}
                className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Power Selector */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Charger Power
                </label>
                <select
                  value={selectedPower}
                  onChange={(e) => setSelectedPower(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">All Power (3.3 - 22 kW)</option>
                  <option value="7.2">7.2 kW AC (Fastest Home)</option>
                  <option value="11">11 kW AC (3-Phase)</option>
                  <option value="22">22 kW AC (Super AC)</option>
                  <option value="3.3">3.3 kW AC (16A Socket)</option>
                </select>
              </div>

              {/* Vehicle Compatibility */}
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  My Vehicle
                </label>
                <select
                  value={selectedVehicleModel}
                  onChange={(e) => setSelectedVehicleModel(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                >
                  <option value="all">Any EV Model</option>
                  <option value="Tata">Tata Nexon EV</option>
                  <option value="MG">MG ZS EV</option>
                  <option value="Mahindra">Mahindra XUV400</option>
                  <option value="Hyundai">Hyundai Ioniq 5</option>
                  <option value="BYD">BYD Atto 3</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-300">
                <input
                  type="checkbox"
                  checked={availableTonightOnly}
                  onChange={(e) => setAvailableTonightOnly(e.target.checked)}
                  className="accent-emerald-500 rounded w-3.5 h-3.5"
                />
                <span>Available Tonight Only</span>
              </label>

              <span className="text-[11px] font-semibold text-emerald-400">
                {filteredChargers.length} chargers found
              </span>
            </div>
          </div>

          {/* Scrollable Charger Cards List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Loading real community chargers...</p>
              </div>
            ) : allChargers.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-white mb-1">
                  No community chargers are available yet.
                </h4>
                <p className="text-xs text-slate-400 mb-5 max-w-xs mx-auto leading-relaxed">
                  Be the first host in your area. Turn your idle home wallbox into passive income while helping EV travelers charge overnight.
                </p>
                <Link
                  href="/host/list"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List Your Charger</span>
                </Link>
              </div>
            ) : filteredChargers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
                <p className="font-semibold text-sm text-white mb-1">No chargers match your filters</p>
                <p className="mb-4">Try clearing some criteria or expanding your radius along your route.</p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-sm hover:bg-emerald-400 transition"
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
                    className={`p-4 rounded-2xl transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-slate-900 border-emerald-400 shadow-lg ring-1 ring-emerald-400/40"
                        : "bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90 shadow-sm"
                    }`}
                  >
                    {/* Top Row: Power & Availability */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ⚡ {c.powerKw} kW AC
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {c.connectorType}
                        </span>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(c as any).distanceKm !== undefined && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                            <Navigation className="w-2.5 h-2.5" />
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <span>{(c as any).distanceKm} km (~{Math.max(3, Math.round((c as any).distanceKm * 2.5))} min drive)</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                          ★ {c.rating}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({c.reviewCount})
                        </span>
                      </div>
                    </div>

                    {/* Charger Title & Location */}
                    <h3 className="font-bold text-sm sm:text-base text-white mb-1 leading-snug">
                      {c.title}
                    </h3>

                    <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        {c.address}, {c.city}
                      </span>
                    </p>

                    {/* AI Verification Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mb-3 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg w-max font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI verified ({Math.round((c.verificationScore || 0.9) * 100)}% confidence)</span>
                    </div>

                    {/* Bottom Pricing & Action */}
                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-black text-white">
                          ₹{c.electricityRate}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">/kWh</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          + ₹{c.hostFee} host access
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {userLocation && (
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${c.latitude},${c.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-xl text-emerald-400 bg-slate-800 hover:bg-slate-700 transition"
                            title="Direct Navigation via Google Maps"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <Link
                          href={`/charger/${c.chargerId}`}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/booking/${c.chargerId}`}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 shadow-md shadow-emerald-500/20 transition flex items-center gap-1"
                        >
                          <span>Reserve</span>
                          <ChevronRight className="w-3.5 h-3.5" />
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
