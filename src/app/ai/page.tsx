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
  ChevronRight,
  ShieldCheck,
  Navigation,
  Send,
  HelpCircle,
  BatteryCharging,
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "ai-welcome",
      sender: "ai",
      text: "Hey there! I'm your VoltLoop AI Co-Pilot. I can answer questions about EV range, AC compatibility, host access, or cost calculations.\n\nTry asking:\n• \"How long will it take to charge my Nexon from 20% to 80% on 7.2 kW?\"\n• \"What are the cheapest chargers near Pune?\"\n• \"Overnight charging etiquette for driveway wallboxes\"",
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
    if (soc <= 15) return "text-rose-500";
    if (soc <= 30) return "text-amber-400";
    if (soc <= 70) return "text-emerald-400";
    return "text-cyan-400";
  };

  const getSocBarColor = (soc: number) => {
    if (soc <= 15) return "bg-rose-500";
    if (soc <= 30) return "bg-amber-500";
    if (soc <= 70) return "bg-emerald-500";
    return "bg-cyan-500";
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
    <div className="min-h-screen bg-black text-[#ededed] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Header & Tab Switcher (Vercel Style) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-[#262626]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#262626] bg-[#0a0a0a] text-xs font-mono text-[#a1a1a1] mb-2">
              <Sparkles className="w-3 h-3 text-[#0070f3]" />
              <span>AI-Powered Trip Planning</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
              AI Trip Planner
            </h1>
            <p className="text-xs sm:text-sm text-[#888888] mt-1 max-w-2xl">
              Plan charging stops, estimate overnight costs, and locate compatible verified community hosts along your route.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#111111] border border-[#262626] rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab("chargepilot")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "chargepilot"
                  ? "bg-[#262626] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
              <span>Trip Planner</span>
            </button>

            <button
              onClick={() => setActiveTab("emergency")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "emergency"
                  ? "bg-rose-950/40 text-rose-400 border border-rose-900/50"
                  : "text-rose-400 hover:bg-rose-950/20"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>SOS Mode</span>
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "chat"
                  ? "bg-[#262626] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ask Co-Pilot</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MODE 1: TRIP CHARGEPILOT */}
        {/* ============================================================== */}
        {activeTab === "chargepilot" && (
          <div className="space-y-6">
            {/* Quick 1-Click Interactive Presets Bar */}
            <div className="vercel-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#888888] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  Quick Demo Scenarios (1-Click Run):
                </span>
                <span className="text-[11px] font-mono text-[#666666] hidden sm:inline">
                  Click to auto-populate and calculate
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
                      vehicleId: "veh-tata-nexon",
                      soc: 22,
                      target: 85,
                      budget: 300,
                    })
                  }
                  className="text-left p-3 rounded-lg bg-[#000000] border border-[#222222] hover:border-[#444444] transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                    <span>Pune → Kolhapur</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171717] border border-[#262626] text-emerald-400">22% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#888888] truncate">Tata Nexon EV • Overnight</div>
                  <div className="text-[10px] font-mono text-[#666666] mt-1">&lt; ₹300 • Satara Corridor</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Trip from Mumbai to Satara in MG ZS EV, battery at 18%, arrive 10 PM under ₹350.",
                      origin: "Mumbai",
                      destination: "Satara",
                      vehicleId: "veh-mg-zs",
                      soc: 18,
                      target: 90,
                      budget: 350,
                    })
                  }
                  className="text-left p-3 rounded-lg bg-[#000000] border border-[#222222] hover:border-[#444444] transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                    <span>Mumbai → Satara</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171717] border border-[#262626] text-emerald-400">18% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#888888] truncate">MG ZS EV (50.3 kWh)</div>
                  <div className="text-[10px] font-mono text-[#666666] mt-1">7.2 kW AC Required</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Critical low battery in Punch EV, 9% SOC near Satara, need closest charger now.",
                      origin: "Karad",
                      destination: "Satara",
                      vehicleId: "veh-tata-nexon",
                      soc: 9,
                      target: 80,
                      budget: 250,
                    })
                  }
                  className="text-left p-3 rounded-lg bg-[#000000] border border-rose-950/60 hover:border-rose-800 transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-rose-400 mb-1">
                    <span>🚨 Low Battery SOS</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-950/40 text-rose-400 border border-rose-900/50">9% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#888888] truncate">Emergency Fast Arrival</div>
                  <div className="text-[10px] font-mono text-[#666666] mt-1">Nearest Host • Instant Slot</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      prompt: "Nagpur to Wardha commute in Mahindra XUV400, 28% battery, economical 3.3 kW AC.",
                      origin: "Nagpur",
                      destination: "Wardha",
                      vehicleId: "veh-mahindra-xuv",
                      soc: 28,
                      target: 80,
                      budget: 200,
                    })
                  }
                  className="text-left p-3 rounded-lg bg-[#000000] border border-[#222222] hover:border-[#444444] transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-white mb-1">
                    <span>Nagpur → Wardha</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171717] border border-[#262626] text-emerald-400">28% SOC</span>
                  </div>
                  <div className="text-[11px] text-[#888888] truncate">Mahindra XUV400 (39.4 kWh)</div>
                  <div className="text-[10px] font-mono text-[#666666] mt-1">Budget 3.3 kW AC Option</div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT COLUMN: Interactive Trip Controls */}
              <div className="lg:col-span-5 space-y-6">
                <div className="vercel-card p-6">
                  {/* Natural Prompt Area with Auto-Detect Button */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-mono text-[#a1a1a1] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0070f3]" />
                        <span>Trip Prompt</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoExtract}
                        disabled={isExtracting}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-[#ededed] hover:text-white bg-[#141414] hover:bg-[#1a1a1a] border border-[#262626] px-2 py-0.5 rounded transition-colors"
                      >
                        {isExtracting ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Parsing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-[#0070f3]" />
                            <span>Auto-Sync</span>
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
                        className="w-full bg-[#000000] border border-[#262626] focus:border-[#555555] rounded-lg p-3 text-xs text-white placeholder-[#666666] outline-none transition-colors leading-relaxed resize-none font-sans"
                      />
                    </div>
                  </div>

                  {/* Structured Form Fields */}
                  <div className="space-y-4 pt-4 border-t border-[#222222]">
                    {/* Origin & Destination */}
                    <div className="grid grid-cols-11 gap-2 items-center">
                      <div className="col-span-5">
                        <label className="text-[11px] font-mono text-[#888888] block mb-1">Origin</label>
                        <input
                          type="text"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#555555]"
                        />
                      </div>

                      <div className="col-span-1 flex justify-center pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            const temp = origin;
                            setOrigin(destination);
                            setDestination(temp);
                          }}
                          className="p-1 rounded bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white border border-[#262626] transition-colors"
                          title="Swap"
                        >
                          <ArrowLeftRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="col-span-5">
                        <label className="text-[11px] font-mono text-[#888888] block mb-1">Destination</label>
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#555555]"
                        />
                      </div>
                    </div>

                    {/* Active Vehicle Picker */}
                    <div>
                      <label className="text-[11px] font-mono text-[#888888] block mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Car className="w-3 h-3 text-[#a1a1a1]" />
                          Vehicle Model
                        </span>
                        <span className="text-[10px] text-[#666666]">
                          Max AC: {selectedVehicle.maxAcChargingKw} kW
                        </span>
                      </label>
                      <select
                        value={selectedVehicleId}
                        onChange={(e) => setSelectedVehicleId(e.target.value)}
                        className="w-full bg-[#000000] border border-[#262626] rounded-md px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#555555]"
                      >
                        {vehicles.map((v) => (
                          <option key={v.vehicleId} value={v.vehicleId}>
                            {v.brand} {v.model} ({v.batteryCapacityKwh} kWh)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dynamic Battery Gauge & Range Simulator */}
                    <div className="bg-[#000000] border border-[#222222] rounded-xl p-4 space-y-3.5">
                      <div>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="text-[#a1a1a1] text-[11px] font-mono flex items-center gap-1.5">
                            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                            Current Battery (SOC)
                          </span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className={`font-bold text-sm ${getSocColor(currentSoc)}`}>
                              {currentSoc}%
                            </span>
                            <span className="text-[10px] text-[#666666]">
                              (~{currentEstRangeKm} km)
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-[#171717] rounded-full overflow-hidden">
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
                          className="w-full accent-white h-1.5 bg-[#171717] rounded-lg cursor-pointer mt-2"
                        />
                      </div>

                      <div className="pt-2 border-t border-[#222222]">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="text-[#888888] text-[11px] font-mono">Target Morning Charge</span>
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <span className="text-white font-medium">{targetSoc}%</span>
                            <span className="text-[10px] text-[#666666]">
                              (+{addedRangeKm} km)
                            </span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="100"
                          value={targetSoc}
                          onChange={(e) => setTargetSoc(Number(e.target.value))}
                          className="w-full accent-white h-1.5 bg-[#171717] rounded-lg cursor-pointer"
                        />
                      </div>

                      <div className="p-2 rounded bg-[#111111] border border-[#222222] flex items-center justify-between text-[11px] font-mono text-[#a1a1a1]">
                        <span>Energy Draw Required:</span>
                        <strong className="text-white">
                          ~{energyNeededKwh} kWh ({targetSoc - currentSoc}% delta)
                        </strong>
                      </div>
                    </div>

                    {/* Budget & Times */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-[#888888] block mb-1">Budget</label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#666666] text-xs">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={maxBudget}
                            onChange={(e) => setMaxBudget(Number(e.target.value))}
                            className="w-full bg-[#000000] border border-[#262626] rounded-md pl-5 pr-1.5 py-1 text-xs text-white outline-none focus:border-[#555555]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#888888] block mb-1">Arrival</label>
                        <input
                          type="time"
                          value={arrivalTime}
                          onChange={(e) => setArrivalTime(e.target.value)}
                          className="w-full bg-[#000000] border border-[#262626] rounded-md px-1.5 py-1 text-xs text-white outline-none focus:border-[#555555]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-[#888888] block mb-1">Departure</label>
                        <input
                          type="time"
                          value={departureTime}
                          onChange={(e) => setDepartureTime(e.target.value)}
                          className="w-full bg-[#000000] border border-[#262626] rounded-md px-1.5 py-1 text-xs text-white outline-none focus:border-[#555555]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA (Vercel Solid White Button) */}
                  <button
                    type="button"
                    onClick={() => handleRunChargePilot()}
                    disabled={isLoading}
                    className="mt-5 w-full py-2.5 rounded-md bg-white text-black font-medium text-xs sm:text-sm hover:bg-[#d4d4d4] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Synthesizing Optimal Route Chargers...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-black" />
                        <span>Synthesize Route &amp; Recommended Charger</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: AI Recommendation & Route Details */}
              <div className="lg:col-span-7 space-y-5">
                {isLoading && (
                  <div className="vercel-card p-10 text-center space-y-3">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">Running Physics &amp; AI Engine</h4>
                      <p className="text-xs text-[#888888] max-w-sm mx-auto mt-1 font-mono">
                        Computing {selectedVehicle.maxAcChargingKw} kW AC limits, SOC delta ({targetSoc - currentSoc}%), and ranking verified hosts along {origin} → {destination}...
                      </p>
                    </div>
                  </div>
                )}

                {!isLoading && recommendation && (
                  <div className="space-y-5">
                    {/* Trip Feasibility Alert Banner */}
                    <div className="p-3.5 rounded-lg border border-[#262626] bg-[#0d0d0d] flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="text-xs leading-relaxed text-[#ededed]">
                        <span className="font-semibold text-white">Trip Feasibility: </span>
                        <span>{recommendation.tripFeasibility.recommendationNote} </span>
                        <span className="text-[#888888] font-mono">
                          (Reserve range before charging: ~{recommendation.tripFeasibility.remainingRangeKmBeforeCharge} km)
                        </span>
                      </div>
                    </div>

                    {/* WINNER RECOMMENDED CHARGER CARD */}
                    <div className="vercel-card p-6 border-[#333333] bg-[#0d0d0d]">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#171717] text-white text-xs font-mono border border-[#333333]">
                          <Sparkles className="w-3 h-3 text-[#0070f3]" />
                          Recommended Stop
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="text-amber-400">
                            ★ {recommendation.recommendedCharger.rating}
                          </span>
                          <span className="text-[#666666]">|</span>
                          <span className="text-[#888888]">
                            3.4 km from route
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1">
                        {recommendation.recommendedCharger.title}
                      </h3>
                      <p className="text-xs text-[#888888] mb-4 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                        {recommendation.recommendedCharger.address},{" "}
                        {recommendation.recommendedCharger.city}
                      </p>

                      {/* Physics & Calculation Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-lg bg-[#000000] border border-[#222222] text-center mb-4 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-[#666666] block uppercase">Power</span>
                          <strong className="text-white">
                            {recommendation.recommendedCharger.powerKw} kW AC
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#666666] block uppercase">Draw</span>
                          <strong className="text-white">
                            ~{recommendation.calculation.energyRequiredKwh} kWh
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#666666] block uppercase">Duration</span>
                          <strong className="text-white">
                            {recommendation.calculation.estimatedDurationFormatted}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#666666] block uppercase">Total Cost</span>
                          <strong className="text-emerald-400 font-bold">
                            ₹{recommendation.calculation.totalPrice}
                          </strong>
                        </div>
                      </div>

                      {/* AI Explanation */}
                      <div className="p-3.5 rounded-lg bg-[#000000] border border-[#222222] mb-5">
                        <h4 className="text-xs font-mono text-[#a1a1a1] uppercase mb-1.5 flex items-center gap-1.5">
                          <Info className="w-3 h-3 text-[#0070f3]" />
                          Route Suitability Analysis
                        </h4>
                        <p className="text-xs text-[#888888] leading-relaxed mb-3">
                          {recommendation.explanation.whyThisOption}
                        </p>
                        <ul className="space-y-1.5 text-xs text-[#a1a1a1]">
                          {recommendation.explanation.keyHighlights.map((hl, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{hl}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Primary Actions */}
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <Link
                          href={`/booking/${recommendation.recommendedCharger.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${currentSoc}&target=${targetSoc}`}
                          className="flex-1 py-2.5 px-4 rounded-md bg-white text-black hover:bg-[#d4d4d4] font-medium text-xs sm:text-sm text-center transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-4 h-4 fill-black" />
                          <span>Book This Wallbox (₹{recommendation.calculation.totalPrice})</span>
                        </Link>

                        <a
                          href={`https://maps.google.com/?q=${recommendation.recommendedCharger.latitude},${recommendation.recommendedCharger.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-4 rounded-md bg-[#141414] hover:bg-[#1f1f1f] text-[#ededed] font-medium text-xs text-center border border-[#262626] transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Directions</span>
                        </a>

                        <Link
                          href={`/charger/${recommendation.recommendedCharger.chargerId}`}
                          className="py-2.5 px-4 rounded-md bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white font-medium text-xs text-center border border-[#262626] transition-colors"
                        >
                          Profile
                        </Link>
                      </div>
                    </div>

                    {/* Display 2 Alternatives */}
                    {recommendation.alternativeChargers && recommendation.alternativeChargers.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <span className="text-xs font-mono text-[#888888] uppercase tracking-wider block">
                          Alternative Options
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {recommendation.alternativeChargers.slice(0, 2).map((alt) => (
                            <div
                              key={alt.chargerId}
                              className="vercel-card p-4 flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#171717] border border-[#262626] text-[#888888]">
                                    Backup Option
                                  </span>
                                  <span className="text-xs font-mono text-amber-400">
                                    ★ {alt.rating}
                                  </span>
                                </div>
                                <h5 className="font-semibold text-xs text-white line-clamp-1 mt-1">
                                  {alt.title}
                                </h5>
                                <p className="text-[11px] text-[#888888] flex items-center gap-1 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-[#666666] shrink-0" />
                                  <span className="truncate">{alt.address}, {alt.city}</span>
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-center text-xs p-2 rounded bg-[#000000] border border-[#222222] my-3 font-mono">
                                <div>
                                  <span className="text-[10px] text-[#666666] block">Power</span>
                                  <span className="text-white font-medium">{alt.powerKw} kW AC</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-[#666666] block">Tariff</span>
                                  <span className="text-white font-medium">₹{alt.electricityRate}/kWh</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/booking/${alt.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${currentSoc}&target=${targetSoc}`}
                                  className="flex-1 py-1.5 px-2.5 rounded-md bg-white text-black hover:bg-[#d4d4d4] font-medium text-xs text-center transition-colors"
                                >
                                  Reserve
                                </Link>
                                <Link
                                  href={`/charger/${alt.chargerId}`}
                                  className="py-1.5 px-2.5 rounded-md bg-[#141414] hover:bg-[#1f1f1f] text-[#888888] hover:text-white border border-[#262626] text-xs text-center transition-colors"
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
                  <div className="vercel-card p-8 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#141414] text-white flex items-center justify-center mx-auto border border-[#262626]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">
                        {hasNoChargersNotice || "No compatible community chargers are available yet."}
                      </h4>
                      <p className="text-xs text-[#888888] max-w-sm mx-auto leading-relaxed">
                        Be the first host in your area to turn your idle home wallbox into a community charging node.
                      </p>
                    </div>
                    <Link
                      href="/host/list"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
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
            <div className="vercel-card p-6 sm:p-8 border-rose-900/50 bg-[#0d0d0d]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-400 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/40 text-rose-400 text-xs font-mono mb-1 border border-rose-900/50">
                    Critical Battery SOS Protocol
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Emergency Charger Locator
                  </h2>
                </div>
              </div>

              <div className="bg-[#000000] border border-[#222222] rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-mono text-[#888888] uppercase">
                    Current Battery (SOC)
                  </span>
                  <span className="text-xl font-bold text-rose-400 font-mono">{emergencySoc}%</span>
                </div>

                <input
                  type="range"
                  min="3"
                  max="25"
                  value={emergencySoc}
                  onChange={(e) => setEmergencySoc(Number(e.target.value))}
                  className="w-full accent-rose-500 h-1.5 bg-[#171717] rounded-lg cursor-pointer"
                />

                <div className="mt-3 flex items-center justify-between text-xs text-[#ededed] border-t border-[#222222] pt-2.5 font-mono">
                  <span className="flex items-center gap-1.5 text-[#888888]">
                    <BatteryCharging className="w-3.5 h-3.5 text-rose-400" />
                    Estimated Safe Driving Range:
                  </span>
                  <strong className="text-rose-400">
                    ~{emergencyEstRangeKm} km
                  </strong>
                </div>
              </div>

              {/* Nearest Host */}
              {!nearestEmergencyCharger ? (
                <div className="p-6 text-center rounded-xl bg-[#000000] border border-dashed border-[#262626] mb-6">
                  <h4 className="font-semibold text-xs text-white mb-1">
                    No emergency community chargers registered nearby yet.
                  </h4>
                  <p className="text-xs text-[#888888] mb-4">
                    Be the first host in your area to offer emergency charging support to stranded EV drivers.
                  </p>
                  <Link
                    href="/host/list"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>List Your Charger</span>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="bg-[#000000] border border-[#222222] rounded-xl p-4 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Nearest Host (Bypasses Queues)
                      </span>
                      <span className="text-xs font-mono text-[#888888]">Verified</span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">{nearestEmergencyCharger.title}</h4>
                    <p className="text-xs text-[#888888] mb-3 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#666666] shrink-0" />
                      {nearestEmergencyCharger.address}, {nearestEmergencyCharger.city}
                    </p>

                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0a0a0a] border border-[#222222] text-center font-mono text-xs mb-3">
                      <div>
                        <span className="text-[10px] text-[#666666] block">Power</span>
                        <strong className="text-white">
                          {nearestEmergencyCharger.powerKw} kW AC
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#666666] block">Rating</span>
                        <strong className="text-amber-400">
                          ★ {nearestEmergencyCharger.rating}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#666666] block">Status</span>
                        <strong className="text-emerald-400">
                          Ready Now
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <a
                      href={`https://maps.google.com/?q=${nearestEmergencyCharger.latitude},${nearestEmergencyCharger.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-4 rounded-md bg-[#141414] hover:bg-[#1f1f1f] text-[#ededed] text-xs font-medium border border-[#262626] transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate Immediately</span>
                    </a>

                    <Link
                      href={`/booking/${nearestEmergencyCharger.chargerId}?vehicleId=${selectedVehicle.vehicleId}&initial=${emergencySoc}&target=80`}
                      className="py-2.5 px-4 rounded-md bg-white text-black hover:bg-[#d4d4d4] text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      <span>Book Emergency Slot</span>
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
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="vercel-card p-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#222222] mb-4">
                <div className="w-8 h-8 rounded-md bg-[#141414] border border-[#262626] text-white flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0070f3]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    VoltLoop Conversational Co-Pilot
                  </h3>
                  <p className="text-xs text-[#888888]">
                    Ask questions about charging physics, route stops, battery longevity, or host etiquette
                  </p>
                </div>
              </div>

              {/* Messages Container */}
              <div className="min-h-[340px] max-h-[440px] overflow-y-auto space-y-3 p-4 rounded-lg bg-[#000000] border border-[#222222] mb-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-xs leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-white text-black font-medium rounded-tr-none"
                          : "bg-[#141414] border border-[#262626] text-[#ededed] rounded-tl-none space-y-1.5"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {/* Thinking Animation */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[#141414] border border-[#262626] rounded-lg rounded-tl-none p-3 max-w-[80%]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-[#888888] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                  className="flex-1 bg-[#000000] border border-[#262626] rounded-md px-3 py-2 text-xs text-white outline-none focus:border-[#555555]"
                />
                <button
                  type="submit"
                  disabled={isChatLoading || !inputChat.trim()}
                  className="px-4 py-2 rounded-md bg-white text-black hover:bg-[#d4d4d4] disabled:opacity-50 font-medium text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
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
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#888888] font-mono">Loading AI Trip Planner...</span>
          </div>
        </div>
      }
    >
      <AIChargePilotContent />
    </Suspense>
  );
}
