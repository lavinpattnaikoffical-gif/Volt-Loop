"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Booking, Charger, Vehicle } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Car,
  Home,
  Zap,
  Calendar,
  Clock,
  Star,
  PlusCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Lock,
  Trash2,
  X,
} from "lucide-react";

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get("tab") === "host" ? "host" : "driver";
  const [activeTab, setActiveTab] = useState<"driver" | "host">(initialTab);

  const { user, profile, vehicles, openAuthModal, addVehicle, refreshProfile } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [hostChargers, setHostChargers] = useState<Charger[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Vehicle Modal State
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [vBrand, setVBrand] = useState("Tata");
  const [vModel, setVModel] = useState("Nexon EV");
  const [vBattery, setVBattery] = useState("40.5");
  const [vConnector, setVConnector] = useState<"Type 2" | "CCS2" | "16A 3-Pin">("Type 2");
  const [vPower, setVPower] = useState("7.2");
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [bookingsRes, chargersRes] = await Promise.all([
          fetch(`/api/bookings?userId=${user.id}`),
          fetch(`/api/chargers?ownerId=${user.id}`),
        ]);

        if (bookingsRes.ok) {
          const bData = await bookingsRes.json();
          if (bData.success && Array.isArray(bData.bookings)) {
            setBookings(bData.bookings);
          }
        }

        if (chargersRes.ok) {
          const cData = await chargersRes.json();
          if (cData.success && Array.isArray(cData.chargers)) {
            setHostChargers(cData.chargers);
          }
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [user?.id]);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingVehicle(true);
    try {
      await addVehicle({
        brand: vBrand,
        model: vModel,
        batteryCapacityKwh: parseFloat(vBattery) || 40.5,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connectorType: vConnector as any,
        maxAcChargingKw: parseFloat(vPower) || 7.2,
        currentBatteryPercent: 20,
        targetBatteryPercent: 80,
      });
      setShowAddVehicleModal(false);
      await refreshProfile();
    } catch (err) {
      console.error("Failed to add vehicle:", err);
    } finally {
      setIsSubmittingVehicle(false);
    }
  };

  // If unauthenticated: Show required Auth state
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-[#070b14]">
        <div className="max-w-md w-full glass-card rounded-3xl p-8 text-center border border-slate-800 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/25">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">
            Sign in to continue
          </h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Please sign in to view your EV charging bookings, manage your vehicles, or monitor host earnings on VOLTLOOP.
          </p>

          <button
            onClick={openAuthModal}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition"
          >
            <span>Sign In to Continue</span>
          </button>
        </div>
      </div>
    );
  }

  // Driver bookings
  const upcomingDriverBookings = bookings.filter(
    (b) => b.status === "CONFIRMED" || b.status === "ACTIVE" || b.status === "PENDING"
  );
  const pastDriverBookings = bookings.filter(
    (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
  );

  // Real host calculations
  const completedHostBookings = bookings.filter(
    (b) => b.status === "COMPLETED" && hostChargers.some((c) => c.chargerId === b.chargerId)
  );
  const realEarnings = completedHostBookings.reduce(
    (sum, b) => sum + (b.totalCost - b.platformFee),
    0
  );
  const realSessionsCount = bookings.filter((b) =>
    hostChargers.some((c) => c.chargerId === b.chargerId)
  ).length;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Banner / Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Member: {profile?.name || user.email}
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">VoltLoop Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage your charging bookings, registered vehicles, and host earnings.
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div className="p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab("driver")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "driver"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Driver Mode</span>
            </button>

            <button
              onClick={() => setActiveTab("host")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "host"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Host Mode</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DRIVER MODE */}
        {/* ============================================================== */}
        {activeTab === "driver" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Upcoming Reservations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                  <span>Your Bookings</span>
                </h3>
                <Link
                  href="/explore"
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <span>Book New Session</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {upcomingDriverBookings.length === 0 ? (
                <div className="p-8 text-center glass-card border border-slate-800 rounded-3xl">
                  <h4 className="font-bold text-base text-white mb-1">
                    No active bookings
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Explore verified community chargers near you and reserve your guaranteed overnight plug-in.
                  </p>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition"
                  >
                    <span>Find a Charger</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingDriverBookings.map((b) => (
                    <div
                      key={b.bookingId}
                      className="p-5 rounded-3xl glass-card border border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            ID: {b.bookingId}
                          </span>
                          <h4 className="font-bold text-base text-white">
                            {b.chargerTitle}
                          </h4>
                          <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            {b.chargerAddress}, {b.chargerCity}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Duration:</span>
                          <strong className="text-slate-200">{b.estimatedChargingTime}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Total Amount:</span>
                          <strong className="text-emerald-400 font-bold">₹{b.totalCost}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">
                          Energy: ~{b.estimatedEnergyKwh} kWh
                        </span>
                        <Link
                          href={`/charger/${b.chargerId}`}
                          className="font-bold text-emerald-400 hover:underline"
                        >
                          View Charger Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Charging History */}
            {pastDriverBookings.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span>Past Charging History</span>
                </h3>

                <div className="glass-card border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-3.5">Booking ID</th>
                          <th className="p-3.5">Location</th>
                          <th className="p-3.5">Energy</th>
                          <th className="p-3.5">Duration</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {pastDriverBookings.map((pb) => (
                          <tr key={pb.bookingId} className="hover:bg-slate-800/40">
                            <td className="p-3.5 font-mono text-[11px] text-slate-400">{pb.bookingId}</td>
                            <td className="p-3.5 font-semibold text-white">{pb.chargerTitle}</td>
                            <td className="p-3.5">~{pb.estimatedEnergyKwh} kWh</td>
                            <td className="p-3.5">~{pb.estimatedChargingTime}</td>
                            <td className="p-3.5 font-bold text-emerald-400">₹{pb.totalCost}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                {pb.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* My Vehicles */}
            <div className="glass-card border border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <span>My Vehicles</span>
                </h3>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-5 text-center rounded-2xl bg-slate-950/40 border border-dashed border-slate-800">
                  <p className="text-xs text-slate-400">
                    Adding your EV helps us calculate accurate charging times and costs based on your battery capacity.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((v) => (
                    <div
                      key={v.vehicleId}
                      className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white">
                          {v.brand} {v.model}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {v.batteryCapacityKwh} kWh • {v.connectorType} (Max {v.maxAcChargingKw} kW AC)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* HOST MODE */}
        {/* ============================================================== */}
        {activeTab === "host" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Host Analytics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                  Host Earnings
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-emerald-400">
                  ₹{realEarnings.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-1">Real completed sessions</span>
              </div>

              <div className="glass-card border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                  Charging Sessions
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-white">
                  {realSessionsCount}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-1">Total reservations</span>
              </div>

              <div className="glass-card border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                  Active Wallboxes
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-teal-400">
                  {hostChargers.length}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-1">Listed chargers</span>
              </div>

              <div className="glass-card border border-slate-800 rounded-3xl p-5">
                <span className="text-xs text-slate-400 uppercase font-semibold block mb-1">
                  Average Rating
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center gap-1">
                  ★ {hostChargers.length > 0 ? (hostChargers.reduce((s, c) => s + c.rating, 0) / hostChargers.length).toFixed(1) : "—"}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-1">Verified reviews</span>
              </div>
            </div>

            {/* My Listed Chargers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span>My Listed Wallboxes</span>
                </h3>
                <Link
                  href="/host/list"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List Your Charger</span>
                </Link>
              </div>

              {hostChargers.length === 0 ? (
                <div className="p-8 text-center glass-card border border-slate-800 rounded-3xl">
                  <h4 className="font-bold text-base text-white mb-1">
                    You haven&apos;t listed a charger yet.
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Turn your idle home wallbox into a community charging station and earn passive income overnight.
                  </p>
                  <Link
                    href="/host/list"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>List Your Charger</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostChargers.map((hc) => (
                    <div
                      key={hc.chargerId}
                      className="p-5 rounded-3xl glass-card border border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              hc.verificationStatus === "VERIFIED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            {hc.verificationStatus === "VERIFIED" ? "🟢 ACTIVE" : "⏳ PENDING REVIEW"}
                          </span>
                          <h4 className="font-bold text-base text-white mt-2">{hc.title}</h4>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            {hc.address}, {hc.city}
                          </p>
                        </div>
                        <span className="text-sm font-black text-emerald-400">
                          {hc.powerKw} kW AC
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Tariff</span>
                          <strong className="text-slate-200">₹{hc.electricityRate}/kWh</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Host Fee</span>
                          <strong className="text-emerald-400">₹{hc.hostFee}/slot</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">Platform Fee</span>
                          <strong className="text-slate-400">₹{hc.platformFee}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-400">
                          Hours: {hc.availableFrom} → {hc.availableUntil}
                        </span>
                        <Link
                          href={`/charger/${hc.chargerId}`}
                          className="font-bold text-emerald-400 hover:underline"
                        >
                          Public View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ADD VEHICLE MODAL */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
            <button
              onClick={() => setShowAddVehicleModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1">Add Your Vehicle</h3>
            <p className="text-xs text-slate-400 mb-5">
              Add your EV to calculate real charging speeds, costs, and battery ranges.
            </p>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata, MG, Mahindra, Hyundai"
                  value={vBrand}
                  onChange={(e) => setVBrand(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexon EV, ZS EV, XUV400"
                  value={vModel}
                  onChange={(e) => setVModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Battery (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="40.5"
                    value={vBattery}
                    onChange={(e) => setVBattery(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max AC (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="7.2"
                    value={vPower}
                    onChange={(e) => setVPower(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Connector Type
                </label>
                <select
                  value={vConnector}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setVConnector(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Type 2">Type 2 (IEC 62196)</option>
                  <option value="CCS2">CCS2</option>
                  <option value="16A 3-Pin">16A 3-Pin Socket</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingVehicle}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {isSubmittingVehicle ? "Saving Vehicle..." : "Save Vehicle"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[70vh] bg-[#070b14]">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
