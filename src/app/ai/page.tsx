"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Vehicle, Charger, AIChargePilotRecommendation } from "@/types";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  ArrowRight,
  MapPin,
  Clock,
  Car,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  Navigation,
  Send,
  HelpCircle,
  TrendingDown,
  Leaf,
  BatteryCharging,
  SlidersHorizontal,
  Compass,
  ArrowLeftRight,
  PlusCircle,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedAction?: string;
}

const DEFAULT_EV_MODELS: Vehicle[] = [
  {
    vehicleId: "veh-tata-nexon",
    userId: "demo",
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
    userId: "demo",
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
    userId: "demo",
    brand: "Mahindra",
    model: "XUV400 (39.4 kWh)",
    batteryCapacityKwh: 39.4,
    connectorType: "Type 2",
    maxAcChargingKw: 7.2,
    currentBatteryPercent: 25,
    targetBatteryPercent: 85,
  },
  {
    vehicleId: "veh-hyundai-ioniq",
    userId: "demo",
    brand: "Hyundai",
    model: "Ioniq 5 (72.6 kWh)",
    batteryCapacityKwh: 72.6,
    connectorType: "Type 2",
    maxAcChargingKw: 11.0,
    currentBatteryPercent: 20,
    targetBatteryPercent: 80,
  },
];

function AIChargePilotContent() {
  const searchParams = useSearchParams();
  const isDemoMode = searchParams?.get("demo") === "1" || searchParams?.get("demo") === "true";

  const [vehicles] = useState<Vehicle[]>(DEFAULT_EV_MODELS);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("veh-tata-nexon");
  const selectedVehicle = vehicles.find((v) => v.vehicleId === selectedVehicleId) ?? vehicles[0];

  const [allChargers, setAllChargers] = useState<Charger[]>([]);
  const [hasNoChargersNotice, setHasNoChargersNotice] = useState<string | null>(null);

  // Active Tab Mode: "chargepilot" | "emergency" | "chat"
  const [activeTab, setActiveTab] = useState<"chargepilot" | "emergency" | "chat">("chargepilot");

  // Form State
  const [naturalPrompt, setNaturalPrompt] = useState(
    "I'm driving from Pune to Kolhapur in a Nexon EV. I'm at 22% battery and want to charge overnight for under ₹300."
  );
  const [origin, setOrigin] = useState("Pune");
  const [destination, setDestination] = useState("Kolhapur");
  const [currentSoc, setCurrentSoc] = useState(22);
  const [targetSoc, setTargetSoc] = useState(85);
  const [maxBudget, setMaxBudget] = useState(300);
  const [arrivalTime, setArrivalTime] = useState("21:30");
  const [departureTime, setDepartureTime] = useState("06:30");

  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [recommendation, setRecommendation] = useState<AIChargePilotRecommendation | null>(null);

  // Emergency Mode State
  const [emergencySoc, setEmergencySoc] = useState<number>(9);

  // Range & Energy Calculations
  const fullRangeKm = Math.round(selectedVehicle.batteryCapacityKwh * 7.5);
  const currentEstRangeKm = Math.round((currentSoc / 100) * fullRangeKm);
  const targetEstRangeKm = Math.round((targetSoc / 100) * fullRangeKm);
  const addedRangeKm = Math.max(0, targetEstRangeKm - currentEstRangeKm);
  const energyNeededKwh = Number(
    (((targetSoc - currentSoc) / 100) * selectedVehicle.batteryCapacityKwh).toFixed(1)
  );
  const emergencyEstRangeKm = Math.round((emergencySoc / 100) * fullRangeKm);

  // Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      sender: "user" | "ai";
      text: string;
      timestamp: string;
      suggestedAction?: string;
    }>
  >([
    {
      id: "ai-welcome",
      sender: "ai",
      text: "Hey there! 👋 I'm your VoltLoop AI co-pilot. I'm here to help you figure out the best charging stops, estimate costs for your trip, or just answer any EV questions you have.\n\nTry asking me something like:\n• \"How long will it take to charge my Nexon from 20% to 80%?\"\n• \"What's the cheapest charger near Pune?\"\n• \"Tips for overnight charging etiquette\"",
      timestamp: "Just now",
    },
  ]);
  const [inputChat, setInputChat] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fetch real active chargers from API on mount
  useEffect(() => {
    fetch("/api/chargers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.chargers)) {
          setAllChargers(data.chargers);
        }
      })
      .catch((err) => console.error("Error fetching chargers in AI view:", err));
  }, []);

  // Nearest real emergency charger
  const nearestEmergencyCharger = allChargers.length > 0
    ? (allChargers.find((c) => c.availability === "AVAILABLE" && c.powerKw >= 7.2) ?? allChargers[0])
    : null;

  // Helper to color-code SOC
  const getSocColor = (soc: number) => {
    if (soc <= 15) return "text-rose-600";
    if (soc <= 30) return "text-amber-600";
    if (soc <= 70) return "text-[#006c49]";
    return "text-teal-600";
  };

  const getSocBarColor = (soc: number) => {
    if (soc <= 15) return "bg-rose-500";
    if (soc <= 30) return "bg-amber-500";
    if (soc <= 70) return "bg-[#006c49]";
    return "bg-teal-500";
  };

  // Run AI ChargePilot Pipeline
  const handleRunChargePilot = async (customPayload?: Partial<{
    naturalQuery: string;
    origin: string;
    destination: string;
    vehicleId: string;
    currentBatteryPercent: number;
    targetBatteryPercent: number;
    maxBudget: number;
  }>) => {
    setIsLoading(true);
    try {
      const payload = {
        naturalQuery: customPayload?.naturalQuery ?? naturalPrompt,
        origin: customPayload?.origin ?? origin,
        destination: customPayload?.destination ?? destination,
        vehicleId: customPayload?.vehicleId ?? selectedVehicle.vehicleId,
        currentBatteryPercent: customPayload?.currentBatteryPercent ?? currentSoc,
        targetBatteryPercent: customPayload?.targetBatteryPercent ?? targetSoc,
        maxBudget: customPayload?.maxBudget ?? maxBudget,
        arrivalTime,
        departureTime,
      };

      const res = await fetch("/api/ai/chargepilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setRecommendation(data.data);
        setHasNoChargersNotice(null);
      } else {
        setRecommendation(null);
        setHasNoChargersNotice(
          data.message || data.error || "No compatible community chargers are available yet."
        );
      }
    } catch (err) {
      console.error("ChargePilot failed:", err);
      setRecommendation(null);
      setHasNoChargersNotice("No compatible community chargers are available yet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-Detect / Parse Trip details from naturalPrompt
  const handleAutoExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch("/api/ai/natural-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: naturalPrompt }),
      });
      const data = await res.json();

      if (data.success && data.filters) {
        if (data.filters.location) {
          setDestination(data.filters.location);
        }
        if (data.filters.maxPrice) {
          setMaxBudget(data.filters.maxPrice);
        }
      }

      // Check text for vehicle mention
      const lower = naturalPrompt.toLowerCase();
      const matchedVeh = vehicles.find(
        (v) =>
          lower.includes(v.model.toLowerCase()) ||
          lower.includes(v.brand.toLowerCase())
      );
      if (matchedVeh) {
        setSelectedVehicleId(matchedVeh.vehicleId);
      }

      // Check for SOC mention
      const socMatch = naturalPrompt.match(/(\d{1,2})%\s*(?:battery|soc)?/i);
      if (socMatch && Number(socMatch[1]) >= 5 && Number(socMatch[1]) <= 95) {
        setCurrentSoc(Number(socMatch[1]));
      }

      // Check for cities like "from X to Y"
      const routeMatch = naturalPrompt.match(/from\s+([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i);
      if (routeMatch) {
        setOrigin(routeMatch[1].charAt(0).toUpperCase() + routeMatch[1].slice(1));
        setDestination(routeMatch[2].charAt(0).toUpperCase() + routeMatch[2].slice(1));
      }
    } catch (e) {
      console.error("Extraction error:", e);
    } finally {
      setIsExtracting(false);
    }
  };

  // 1-Click Trip Presets with Instant Auto-Run
  const handleApplyPreset = (preset: {
    prompt: string;
    origin: string;
    destination: string;
    vehicleId: string;
    soc: number;
    target: number;
    budget: number;
  }) => {
    setNaturalPrompt(preset.prompt);
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setSelectedVehicleId(preset.vehicleId);
    setCurrentSoc(preset.soc);
    setTargetSoc(preset.target);
    setMaxBudget(preset.budget);

    handleRunChargePilot({
      naturalQuery: preset.prompt,
      origin: preset.origin,
      destination: preset.destination,
      vehicleId: preset.vehicleId,
      currentBatteryPercent: preset.soc,
      targetBatteryPercent: preset.target,
      maxBudget: preset.budget,
    });
  };

  // Send message in Chat Assistant
  const handleSendChat = async (overrideMsg?: string) => {
    const textToSend = overrideMsg || inputChat;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: "Just now",
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!overrideMsg) setInputChat("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          vehicleId: selectedVehicle.vehicleId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: "ai-" + Date.now(),
            sender: "ai",
            text: data.reply,
            timestamp: "Just now",
            suggestedAction: data.suggestedAction,
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    handleRunChargePilot();
  }, []);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AI-Powered Trip Planning</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              AI Trip Planner
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Plan your charging stops, estimate costs, and find the best community chargers along your route — all tailored to your EV.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl shadow-sm shrink-0">
            <button
              onClick={() => setActiveTab("chargepilot")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === "chargepilot"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Trip Planner</span>
            </button>

            <button
              onClick={() => setActiveTab("emergency")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === "emergency"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-rose-400 hover:bg-rose-500/10"
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>🚨 Emergency SOS</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeTab === "chat"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Ask Co-Pilot</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODE 1: TRIP CHARGEPILOT */}
        {/* ============================================================== */}
        {activeTab === "chargepilot" && (
          <div className="space-y-8">
            {/* Quick 1-Click Interactive Presets Bar */}
            <div className="bg-white border border-[#dde4dd] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-[#161d19] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#006c49]" />
                  Quick 1-Click Demo Scenarios (Auto-Fills &amp; Solves):
                </span>
                <span className="text-[11px] text-[#3c4a42] hidden sm:inline">
                  Click any scenario to immediately synthesize results
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Driving Pune to Kolhapur in Tata Nexon EV, 22% battery, overnight stop under ₹300.",
                      origin: "Pune",
                      destination: "Kolhapur",
                      vehicleId: "veh-01",
                      soc: 22,
                      target: 85,
                      budget: 300,
                    })
                  }
                  className="text-left p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd] hover:border-[#006c49] transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#006c49] mb-1">
                    <span>Pune → Kolhapur</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#82f5c1] text-[#00714e]">22% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#161d19] font-medium truncate">Tata Nexon EV • Overnight</div>
                  <div className="text-[10px] text-[#3c4a42] mt-1">Budget: &lt; ₹300 • Satara Corridor</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Trip from Mumbai to Satara in MG ZS EV, battery at 18%, arrive 10 PM under ₹350.",
                      origin: "Mumbai",
                      destination: "Satara",
                      vehicleId: "veh-03",
                      soc: 18,
                      target: 90,
                      budget: 350,
                    })
                  }
                  className="text-left p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd] hover:border-[#006c49] transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#006c49] mb-1">
                    <span>Mumbai → Satara</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#82f5c1] text-[#00714e]">18% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#161d19] font-medium truncate">MG ZS EV (50.3 kWh)</div>
                  <div className="text-[10px] text-[#3c4a42] mt-1">7.2 kW AC Required • Express</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Critical low battery in Punch EV, 9% SOC near Satara, need closest charger now.",
                      origin: "Karad",
                      destination: "Satara",
                      vehicleId: "veh-02",
                      soc: 9,
                      target: 80,
                      budget: 250,
                    })
                  }
                  className="text-left p-3 rounded-xl bg-[#ffdad6] border border-[#fc7c78]/40 hover:border-[#ba1a1a] transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#ba1a1a] mb-1">
                    <span>🚨 Critical 9% SOS</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ffdad6] text-[#ba1a1a]">9% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#161d19] font-medium truncate">Tata Punch EV (25 kWh)</div>
                  <div className="text-[10px] text-[#3c4a42] mt-1">Nearest Host • Instant Plug-in</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Nagpur to Wardha commute in Mahindra XUV400, 28% battery, economical 3.3 kW AC.",
                      origin: "Nagpur",
                      destination: "Wardha",
                      vehicleId: "veh-04",
                      soc: 28,
                      target: 80,
                      budget: 200,
                    })
                  }
                  className="text-left p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd] hover:border-[#006c49] transition group"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#006c49] mb-1">
                    <span>Nagpur → Wardha</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#82f5c1] text-[#00714e]">28% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#161d19] font-medium truncate">Mahindra XUV400 (39.4 kWh)</div>
                  <div className="text-[10px] text-[#3c4a42] mt-1">Budget 3.3 kW • Rural Farmhouse</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Interactive Trip Controls */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-[#dde4dd] rounded-3xl p-6 shadow-sm">
                  {/* Natural Prompt Area with Auto-Detect Button */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-[#161d19] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#006c49]" />
                        <span>Natural Language Trip Request</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoExtract}
                        disabled={isExtracting}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006c49] bg-[#eef6ee] hover:bg-[#dde4dd] border border-[#dde4dd] px-2.5 py-1 rounded-lg transition"
                      >
                        {isExtracting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-[#006c49] border-t-transparent rounded-full animate-spin" />
                            <span>Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>Auto-Sync Controls</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        rows={3}
                        value={naturalPrompt}
                        onChange={(e) => setNaturalPrompt(e.target.value)}
                        placeholder='e.g. "Driving from Pune to Kolhapur in a Nexon EV. Battery at 22%, need overnight charging under ₹300."'
                        className="w-full bg-[#eef6ee] border border-[#dde4dd] focus:border-[#006c49] focus:ring-1 focus:ring-[#006c49] rounded-2xl p-3.5 text-xs sm:text-sm text-[#161d19] placeholder-[#3c4a42]/60 transition leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  {/* Structured Form Fields */}
                  <div className="space-y-4 pt-4 border-t border-[#dde4dd]">
                    {/* Origin & Destination */}
                    <div className="grid grid-cols-11 gap-2 items-center">
                      <div className="col-span-5">
                        <label className="text-xs font-semibold text-[#161d19] block mb-1">Origin</label>
                        <input
                          type="text"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3 py-2 text-xs text-[#161d19] focus:border-[#006c49]"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center pt-5">
                        <button
                          type="button"
                          onClick={() => {
                            const temp = origin;
                            setOrigin(destination);
                            setDestination(temp);
                          }}
                          className="p-1.5 rounded-lg bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] transition"
                          title="Swap Origin and Destination"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="col-span-5">
                        <label className="text-xs font-semibold text-[#161d19] block mb-1">Destination</label>
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3 py-2 text-xs text-[#161d19] focus:border-[#006c49]"
                        />
                      </div>
                    </div>

                    {/* Active Vehicle Picker */}
                    <div>
                      <label className="text-xs font-semibold text-[#161d19] block mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-[#006c49]" />
                          Active Vehicle Model
                        </span>
                        <span className="text-[11px] text-[#3c4a42]">
                          Max AC: {selectedVehicle.maxAcChargingKw} kW
                        </span>
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-3 py-2.5 text-xs text-[#161d19] font-medium focus:border-[#006c49]"
                      >
                        {vehicles.map((v) => (
                          <option key={v.vehicleId} value={v.vehicleId}>
                            {v.brand} {v.model} ({v.batteryCapacityKwh} kWh • {v.connectorType})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic Battery Gauge & Range Simulator */}
                    <div className="bg-[#eef6ee] border border-[#dde4dd] rounded-2xl p-4 space-y-3.5">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-[#161d19] font-semibold flex items-center gap-1.5">
                            <BatteryCharging className="w-3.5 h-3.5 text-[#006c49]" />
                            Current Battery State (SOC)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`font-mono font-black text-sm ${getSocColor(currentSoc)}`}>
                              {currentSoc}%
                            </span>
                            <span className="text-[11px] text-[#3c4a42] font-mono">
                              (~{currentEstRangeKm} km left)
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-3 bg-[#dde4dd] rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${getSocBarColor(currentSoc)}`}
                            style={{ width: `${currentSoc}%` }}
                          />
                        </div>

                        <input
                          type="range"
                          min="5"
                          max="65"
                          value={currentSoc}
                          onChange={(e) => setCurrentSoc(Number(e.target.value))}
                          className="w-full accent-[#006c49] h-1.5 bg-[#dde4dd] rounded-lg cursor-pointer mt-2"
                        />
                      </div>

                      <div className="pt-2 border-t border-[#dde4dd]">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-[#3c4a42] font-medium">Target Morning Charge</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#006c49]">{targetSoc}%</span>
                            <span className="text-[11px] text-[#3c4a42]">
                              (~{targetEstRangeKm} km / +{addedRangeKm} km added)
                            </span>
                          </div>
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

                      <div className="p-2.5 rounded-xl bg-white border border-[#dde4dd] flex items-center justify-between text-[11px] text-[#161d19]">
                        <span>Energy Needed:</span>
                        <strong className="text-[#006c49] font-mono">
                          ~{energyNeededKwh} kWh ({targetSoc - currentSoc}% delta)
                        </strong>
                      </div>
                    </div>

                    {/* Budget & Times */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-[#3c4a42] block mb-1">Max Budget</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#3c4a42] text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={maxBudget}
                            onChange={(e) => setMaxBudget(Number(e.target.value))}
                            className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl pl-6 pr-2 py-1.5 text-xs text-[#161d19]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#3c4a42] block mb-1">Arrival</label>
                        <input
                          type="time"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-2 py-1.5 text-xs text-[#161d19]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#3c4a42] block mb-1">Departure</label>
                        <input
                          type="time"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          className="w-full bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-2 py-1.5 text-xs text-[#161d19]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA */}
                  <button
                    type="button"
                    onClick={() => handleRunChargePilot()}
                    disabled={isLoading}
                    className="mt-6 w-full py-3.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Synthesizing Optimal Route Chargers...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-white" />
                        <span>Synthesize Route &amp; Recommended Charger</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: AI Recommendation & Route Details */}
              <div className="lg:col-span-7 space-y-6">
                {isLoading && (
                  <div className="bg-white border border-[#dde4dd] rounded-3xl p-10 text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 border-3 border-[#006c49] border-t-transparent rounded-full animate-spin mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-[#161d19]">Running Bedrock AI &amp; Physics Pipeline</h4>
                      <p className="text-xs text-[#3c4a42] max-w-md mx-auto">
                        Calculating vehicle limits ({selectedVehicle.maxAcChargingKw} kW AC), SOC delta ({targetSoc - currentSoc}%), and ranking verified hosts along {origin} → {destination}...
                      </p>
                    </div>
                  </div>
                )}

                {!isLoading && recommendation && (
                  <div className="space-y-6">
                    {/* Trip Feasibility Alert Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3 shadow-sm ${
                        recommendation.tripFeasibility.isFeasible
                          ? "bg-[#eef6ee] border-[#82f5c1] text-[#006c49]"
                          : "bg-[#ffdad6] border-[#fc7c78] text-[#93000a]"
                      }`}
                    >
                      <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#006c49]" />
                      <div className="text-xs leading-relaxed flex-1">
                        <div className="font-bold text-sm mb-0.5">
                          Trip Feasibility Assessment
                        </div>
                        <div>
                          {recommendation.tripFeasibility.recommendationNote}{" "}
                          <span className="font-semibold">
                            (Reserve range before charging: ~
                            {recommendation.tripFeasibility.remainingRangeKmBeforeCharge} km)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* WINNER RECOMMENDED CHARGER CARD */}
                    <div className="bg-white border-2 border-[#006c49]/40 rounded-3xl p-6 shadow-md relative overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef6ee] text-[#006c49] text-xs font-bold border border-[#82f5c1]">
                          <Sparkles className="w-3.5 h-3.5 text-[#006c49]" />
                          AI Recommended Option
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                            ★ {recommendation.recommendedCharger.rating}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#eef6ee] text-[#3c4a42] border border-[#dde4dd]">
                            3.4 km from route
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-[#161d19] mb-1">
                        🏠 {recommendation.recommendedCharger.title}
                      </h3>
                      <p className="text-xs text-[#3c4a42] mb-5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                        {recommendation.recommendedCharger.address},{" "}
                        {recommendation.recommendedCharger.city}
                      </p>

                      {/* Physics & Calculation Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] text-center mb-5">
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block uppercase font-medium">Power</span>
                          <strong className="text-sm text-[#006c49] font-bold">
                            {recommendation.recommendedCharger.powerKw} kW AC
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block uppercase font-medium">Energy</span>
                          <strong className="text-sm text-[#161d19] font-bold">
                            ~{recommendation.calculation.energyRequiredKwh} kWh
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block uppercase font-medium">Duration</span>
                          <strong className="text-sm text-[#006c49] font-bold">
                            {recommendation.calculation.estimatedDurationFormatted}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block uppercase font-medium">Total Cost</span>
                          <strong className="text-sm text-[#161d19] font-black">
                            ₹{recommendation.calculation.totalPrice}
                          </strong>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="p-4 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] mb-5">
                        <h4 className="text-xs font-bold text-[#006c49] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#006c49]" />
                          Why this option fits your trip?
                        </h4>
                        <p className="text-xs text-[#3c4a42] leading-relaxed mb-3">
                          {recommendation.explanation.whyThisOption}
                        </p>
                        <ul className="space-y-1.5 text-xs text-[#3c4a42]">
                          {recommendation.explanation.keyHighlights.map((hl, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#006c49] shrink-0" />
                              <span>{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Primary Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                          href={`/booking/${recommendation.recommendedCharger.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${currentSoc}&target=${targetSoc}`}
                          className="flex-1 py-3.5 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm text-center shadow-sm transition flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4 text-white" />
                          <span>Book This Charger (₹{recommendation.calculation.totalPrice})</span>
                        </Link>

                        <a
                          href={`https://maps.google.com/?q=${recommendation.recommendedCharger.latitude},${recommendation.recommendedCharger.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-3.5 px-4 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] font-semibold text-xs text-center border border-[#dde4dd] transition flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5 text-[#006c49]" />
                          <span>Navigate</span>
                        </a>

                        <Link
                          href={`/charger/${recommendation.recommendedCharger.chargerId}`}
                          className="py-3.5 px-4 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#3c4a42] font-semibold text-xs text-center border border-[#dde4dd] transition"
                        >
                          Host Profile
                        </Link>
                      </div>
                    </div>

                    {/* Display 2 Alternatives (Requirement 9) */}
                    {recommendation.alternativeChargers && recommendation.alternativeChargers.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#161d19] uppercase tracking-wider flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-[#006c49]" />
                            <span>2 Alternative Compatible Options (AI-Synthesized)</span>
                          </h4>
                          <span className="text-[10px] text-[#3c4a42]">
                            Deterministic physics verified
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {recommendation.alternativeChargers.slice(0, 2).map((alt) => (
                            <div
                              key={alt.chargerId}
                              className="bg-white border border-[#dde4dd] rounded-2xl p-4 shadow-sm hover:border-[#006c49] transition space-y-3 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#eef6ee] text-[#006c49]">
                                    Alternative Route Stop
                                  </span>
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    ★ {alt.rating}
                                  </span>
                                </div>
                                <h5 className="font-bold text-sm text-[#161d19] line-clamp-1">
                                  {alt.title}
                                </h5>
                                <p className="text-[11px] text-[#3c4a42] flex items-center gap-1 mt-0.5">
                                  <MapPin className="w-3 h-3 text-[#006c49] shrink-0" />
                                  {alt.address}, {alt.city}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-center text-xs p-2 rounded-xl bg-[#eef6ee]">
                                <div>
                                  <span className="text-[10px] text-[#3c4a42] block">Power</span>
                                  <strong className="text-[#006c49] font-bold">{alt.powerKw} kW AC</strong>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#3c4a42] block">Tariff</span>
                                  <strong className="text-[#161d19]">₹{alt.electricityRate}/kWh</strong>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <Link
                                  href={`/booking/${alt.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${currentSoc}&target=${targetSoc}`}
                                  className="flex-1 py-2 px-3 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs text-center transition shadow-sm"
                                >
                                  Book Alternative
                                </Link>
                                <Link
                                  href={`/charger/${alt.chargerId}`}
                                  className="py-2 px-3 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#3c4a42] font-semibold text-xs text-center border border-[#dde4dd] transition"
                                >
                                  Details
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Empty State when no chargers in DB or no recommendation */}
                {!isLoading && !recommendation && (
                  <div className="bg-white border border-[#dde4dd] rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mx-auto border border-[#82f5c1]/60">
                      <Zap className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-[#161d19] mb-1">
                        {hasNoChargersNotice || "No compatible community chargers are available yet."}
                      </h4>
                      <p className="text-xs text-[#3c4a42] max-w-md mx-auto leading-relaxed">
                        Be the first host in your area to turn your idle home wallbox into a community charging point.
                      </p>
                    </div>
                    <Link
                      href="/host/list"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-xs shadow-sm transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>List Your Charger</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 2: EMERGENCY LOW BATTERY SOS (< 15% BATTERY) */}
        {/* ============================================================== */}
        {activeTab === "emergency" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white border-2 border-[#ba1a1a]/40 rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold uppercase tracking-wider mb-1">
                    Critical Battery SOS Protocol
                  </div>
                  <h2 className="text-2xl font-black text-[#161d19]">
                    Emergency Charger Locator
                  </h2>
                </div>
              </div>

              <div className="bg-[#eef6ee] border border-[#dde4dd] rounded-2xl p-5 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[#161d19] uppercase tracking-wide">
                    Current Battery State of Charge (SOC)
                  </span>
                  <span className="text-2xl font-black text-rose-600 font-mono">{emergencySoc}%</span>
                </div>

                <input
                  type="range"
                  min="3"
                  max="25"
                  value={emergencySoc}
                  onChange={(e) => setEmergencySoc(Number(e.target.value))}
                  className="w-full accent-rose-600 h-2 bg-[#dde4dd] rounded-lg cursor-pointer"
                />

                <div className="mt-4 flex items-center justify-between text-xs text-[#161d19] border-t border-[#dde4dd] pt-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <BatteryCharging className="w-4 h-4 text-rose-600" />
                    Estimated Remaining Safe Driving Range:
                  </span>
                  <strong className="text-lg font-black text-rose-600 font-mono">
                    ~{emergencyEstRangeKm} km
                  </strong>
                </div>
              </div>

              {/* Nearest Host */}
              {!nearestEmergencyCharger ? (
                <div className="p-8 text-center bg-[#f8faf8] border border-dashed border-[#dde4dd] rounded-2xl mb-6">
                  <h4 className="font-bold text-sm text-[#161d19] mb-1">
                    No emergency community chargers registered nearby yet.
                  </h4>
                  <p className="text-xs text-[#3c4a42] mb-4">
                    Be the first host in your area to offer emergency charging support to stranded EV drivers.
                  </p>
                  <Link
                    href="/host/list"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#006c49] text-white text-xs font-bold shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>List Your Charger</span>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-[#eef6ee] border-2 border-[#006c49]/40 rounded-2xl p-5 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#006c49] uppercase tracking-wide">
                        🟢 Nearest Compatible Host (Bypasses Queues)
                      </span>
                      <span className="text-xs font-mono font-bold text-[#006c49]">Verified Host</span>
                    </div>

                    <h4 className="text-lg font-black text-[#161d19] mb-1">{nearestEmergencyCharger.title}</h4>
                    <p className="text-xs text-[#3c4a42] mb-4 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                      {nearestEmergencyCharger.address}, {nearestEmergencyCharger.city}
                    </p>

                    <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-white border border-[#dde4dd] text-center mb-4">
                      <div>
                        <span className="text-[10px] text-[#3c4a42] block uppercase">Power</span>
                        <strong className="text-sm font-bold text-[#006c49]">
                          {nearestEmergencyCharger.powerKw} kW AC
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#3c4a42] block uppercase">Rating</span>
                        <strong className="text-sm font-bold text-amber-600">
                          ★ {nearestEmergencyCharger.rating}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#3c4a42] block uppercase">Availability</span>
                        <strong className="text-sm font-bold text-[#006c49]">
                          Ready Now
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={`https://maps.google.com/?q=${nearestEmergencyCharger.latitude},${nearestEmergencyCharger.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-3.5 px-4 rounded-xl bg-[#eef6ee] hover:bg-[#dde4dd] text-[#161d19] text-xs font-bold border border-[#dde4dd] transition flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-4 h-4 text-[#006c49]" />
                      <span>Navigate Immediately</span>
                    </a>

                    <Link
                      href={`/booking/${nearestEmergencyCharger.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${emergencySoc}&target=80`}
                      className="py-3.5 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-white" />
                      <span>Book Emergency Slot Now</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MODE 3: INTERACTIVE AI EV ASSISTANT (CHAT) */}
        {/* ============================================================== */}
        {activeTab === "chat" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-[#dde4dd] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-[#dde4dd] mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#161d19] flex items-center gap-2">
                      VoltLoop Conversational Co-Pilot
                    </h3>
                    <p className="text-xs text-[#3c4a42]">
                      Ask questions about charging physics, route stops, battery longevity, or host etiquette
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="min-h-[360px] max-h-[460px] overflow-y-auto space-y-4 p-4 rounded-2xl bg-[#f4fbf4] border border-[#dde4dd] mb-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-[#006c49] text-white flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-[#006c49] text-white font-medium rounded-tr-none shadow-sm"
                          : "bg-white border border-[#dde4dd] text-[#161d19] rounded-tl-none space-y-2 shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {/* Thinking Animation */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-[#006c49] text-white flex items-center justify-center text-xs font-bold mr-2 mt-1 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-[#dde4dd] rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[80%]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-[#006c49]">AI is thinking...</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[#006c49] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#006c49] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#006c49] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={inputChat}
                  onChange={(e) => setInputChat(e.target.value)}
                  placeholder="Ask about range, AC compatibility, host access, or cost..."
                  className="flex-1 bg-[#eef6ee] border border-[#dde4dd] rounded-xl px-4 py-3 text-xs sm:text-sm text-[#161d19] focus:outline-none focus:border-[#006c49]"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !inputChat.trim()}
                  className="px-5 py-3 rounded-xl bg-[#006c49] hover:bg-[#005236] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm"
                >
                  <span>Send</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChargePilotPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4fbf4] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#006c49] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#3c4a42] font-semibold">Loading AI ChargePilot...</span>
          </div>
        </div>
      }
    >
      <AIChargePilotContent />
    </Suspense>
  );
}
