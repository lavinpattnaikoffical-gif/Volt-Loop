"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Booking, Charger } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Car,
  Home,
  Zap,
  Calendar,
  Clock,
  PlusCircle,
  MapPin,
  ArrowRight,
  Lock,
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

  // If unauthenticated: Show clean Vercel lock screen
  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 bg-black">
        <div className="max-w-md w-full vercel-card p-8 text-center border-[#262626]">
          <div className="w-10 h-10 rounded-lg bg-[#141414] text-white flex items-center justify-center mx-auto mb-4 border border-[#333333]">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-xs text-[#888888] mb-6 leading-relaxed">
            Please log in to manage your EV bookings, registered vehicles, and host settings.
          </p>

          <button
            onClick={openAuthModal}
            className="w-full py-2.5 px-4 rounded-md bg-white text-black font-medium text-xs sm:text-sm hover:bg-[#d4d4d4] transition-colors"
          >
            Log In to Continue
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
    <div className="min-h-screen bg-black text-[#ededed] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Header & Tab Switcher (Vercel Style) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#262626]">
          <div>
            <div className="text-xs font-mono text-[#888888] mb-1">
              Signed in as {profile?.name || user.email}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          </div>

          {/* Tab Switcher Pills */}
          <div className="p-1 bg-[#111111] border border-[#262626] rounded-lg flex items-center gap-1">
            <button
              onClick={() => setActiveTab("driver")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "driver"
                  ? "bg-[#262626] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Driver</span>
            </button>

            <button
              onClick={() => setActiveTab("host")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "host"
                  ? "bg-[#262626] text-white shadow-sm"
                  : "text-[#888888] hover:text-white"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Host</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* DRIVER MODE */}
        {/* ============================================================== */}
        {activeTab === "driver" && (
          <div className="space-y-8">
            {/* Upcoming Reservations */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#a1a1a1]" />
                  <span>Active &amp; Upcoming Bookings</span>
                </h3>
                <Link
                  href="/explore"
                  className="text-xs font-medium text-white hover:underline flex items-center gap-1"
                >
                  <span>Book New Charger</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {upcomingDriverBookings.length === 0 ? (
                <div className="p-8 text-center vercel-card">
                  <h4 className="font-semibold text-sm text-white mb-1">
                    No active bookings found
                  </h4>
                  <p className="text-xs text-[#888888] mb-4 max-w-sm mx-auto">
                    Search 300+ community chargers across your route and reserve guaranteed overnight AC charging.
                  </p>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-black text-xs font-medium hover:bg-[#d4d4d4] transition-colors"
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
                      className="p-5 vercel-card space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-[#666666] block">
                            ID: {b.bookingId}
                          </span>
                          <h4 className="font-semibold text-sm text-white mt-0.5">
                            {b.chargerTitle}
                          </h4>
                          <span className="text-xs text-[#888888] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#666666]" />
                            {b.chargerAddress}, {b.chargerCity}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-emerald-400">
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg bg-[#000000] border border-[#222222]">
                        <div>
                          <span className="text-[10px] text-[#666666] font-mono block">Estimated Time:</span>
                          <span className="text-white font-mono">{b.estimatedChargingTime}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#666666] font-mono block">Total Cost:</span>
                          <span className="text-white font-mono font-bold">₹{b.totalCost}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[#888888] font-mono">
                          Draw: ~{b.estimatedEnergyKwh} kWh
                        </span>
                        <Link
                          href={`/charger/${b.chargerId}`}
                          className="font-medium text-white hover:underline"
                        >
                          View Details →
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
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#888888]" />
                  <span>Session History</span>
                </h3>

                <div className="vercel-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#111111] text-[#888888] uppercase text-[10px] border-b border-[#262626]">
                        <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">Location</th>
                          <th className="p-3">Energy</th>
                          <th className="p-3">Duration</th>
                          <th className="p-3">Cost</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222] text-[#ededed]">
                        {pastDriverBookings.map((pb) => (
                          <tr key={pb.bookingId} className="hover:bg-[#141414]">
                            <td className="p-3 text-[#888888]">{pb.bookingId}</td>
                            <td className="p-3 font-sans font-medium text-white">{pb.chargerTitle}</td>
                            <td className="p-3">~{pb.estimatedEnergyKwh} kWh</td>
                            <td className="p-3">~{pb.estimatedChargingTime}</td>
                            <td className="p-3 font-bold text-white">₹{pb.totalCost}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-emerald-400 text-[10px]">
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
            <div className="vercel-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#888888]" />
                  <span>Registered Vehicles</span>
                </h3>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-black hover:bg-[#d4d4d4] transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-4 text-center rounded-lg bg-[#000000] border border-dashed border-[#262626]">
                  <p className="text-xs text-[#888888]">
                    Add your vehicle to automatically match compatible chargers and calculate precise overnight charging times.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vehicles.map((v) => (
                    <div
                      key={v.vehicleId}
                      className="p-3.5 rounded-lg bg-[#000000] border border-[#262626] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium text-sm text-white">
                          {v.brand} {v.model}
                        </h4>
                        <p className="text-xs text-[#888888] font-mono mt-0.5">
                          {v.batteryCapacityKwh} kWh • {v.connectorType}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171717] border border-[#262626] text-emerald-400">
                        Default
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
          <div className="space-y-8">
            {/* Host Analytics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="vercel-card p-5">
                <span className="text-xs font-mono text-[#888888] uppercase block mb-1">
                  Gross Earnings
                </span>
                <strong className="text-2xl font-bold text-white font-mono">
                  ₹{realEarnings.toLocaleString()}
                </strong>
                <span className="text-[10px] font-mono text-[#666666] block mt-1">Direct payout</span>
              </div>

              <div className="vercel-card p-5">
                <span className="text-xs font-mono text-[#888888] uppercase block mb-1">
                  Total Sessions
                </span>
                <strong className="text-2xl font-bold text-white font-mono">
                  {realSessionsCount}
                </strong>
                <span className="text-[10px] font-mono text-[#666666] block mt-1">Completed bookings</span>
              </div>

              <div className="vercel-card p-5">
                <span className="text-xs font-mono text-[#888888] uppercase block mb-1">
                  Listed Chargers
                </span>
                <strong className="text-2xl font-bold text-white font-mono">
                  {hostChargers.length}
                </strong>
                <span className="text-[10px] font-mono text-[#666666] block mt-1">Online wallboxes</span>
              </div>

              <div className="vercel-card p-5">
                <span className="text-xs font-mono text-[#888888] uppercase block mb-1">
                  Host Rating
                </span>
                <strong className="text-2xl font-bold text-amber-400 font-mono">
                  ★ {hostChargers.length > 0 ? (hostChargers.reduce((s, c) => s + c.rating, 0) / hostChargers.length).toFixed(1) : "—"}
                </strong>
                <span className="text-[10px] font-mono text-[#666666] block mt-1">Driver verified</span>
              </div>
            </div>

            {/* My Listed Chargers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#888888]" />
                  <span>My Charging Points</span>
                </h3>
                <Link
                  href="/host/list"
                  className="px-3 py-1.5 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>List New Wallbox</span>
                </Link>
              </div>

              {hostChargers.length === 0 ? (
                <div className="p-8 text-center vercel-card">
                  <h4 className="font-semibold text-sm text-white mb-1">
                    No charging points registered
                  </h4>
                  <p className="text-xs text-[#888888] mb-4 max-w-sm mx-auto">
                    Turn your private home charger into a community node and earn reliable income during overnight hours.
                  </p>
                  <Link
                    href="/host/list"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-white text-black text-xs font-medium hover:bg-[#d4d4d4] transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>List Your Charger</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hostChargers.map((hc) => (
                    <div
                      key={hc.chargerId}
                      className="p-5 vercel-card space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                              hc.verificationStatus === "VERIFIED"
                                ? "bg-[#141414] border-emerald-900/50 text-emerald-400"
                                : "bg-[#141414] border-amber-900/50 text-amber-400"
                            }`}
                          >
                            {hc.verificationStatus === "VERIFIED" ? "ACTIVE" : "PENDING REVIEW"}
                          </span>
                          <h4 className="font-semibold text-sm text-white mt-1.5">{hc.title}</h4>
                          <p className="text-xs text-[#888888] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#666666]" />
                            {hc.address}, {hc.city}
                          </p>
                        </div>
                        <span className="text-xs font-mono font-bold text-white bg-[#141414] border border-[#262626] px-2 py-0.5 rounded">
                          {hc.powerKw} kW AC
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 rounded-lg bg-[#000000] border border-[#222222]">
                        <div>
                          <span className="text-[10px] font-mono text-[#666666] block">Tariff</span>
                          <span className="text-white font-mono">₹{hc.electricityRate}/kWh</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[#666666] block">Host Fee</span>
                          <span className="text-white font-mono">₹{hc.hostFee}/slot</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-[#666666] block">Platform</span>
                          <span className="text-[#888888] font-mono">₹{hc.platformFee}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[#888888] font-mono">
                          Window: {hc.availableFrom} → {hc.availableUntil}
                        </span>
                        <Link
                          href={`/charger/${hc.chargerId}`}
                          className="font-medium text-white hover:underline"
                        >
                          Public Page →
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="relative w-full max-w-md vercel-card p-6 border-[#333333] shadow-2xl">
            <button
              onClick={() => setShowAddVehicleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-md text-[#888888] hover:text-white hover:bg-[#171717] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Add Vehicle</h3>
            <p className="text-xs text-[#888888] mb-5">
              Specify your vehicle to calculate exact charging speed and cost compatibility.
            </p>

            <form onSubmit={handleCreateVehicle} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono text-[#a1a1a1] mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  required
                  placeholder="Tata, MG, Mahindra, etc."
                  value={vBrand}
                  onChange={(e) => setVBrand(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#141414] border border-[#262626] text-xs text-white outline-none focus:border-[#555555]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#a1a1a1] mb-1">
                  Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nexon EV, ZS EV, etc."
                  value={vModel}
                  onChange={(e) => setVModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-[#141414] border border-[#262626] text-xs text-white outline-none focus:border-[#555555]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#a1a1a1] mb-1">
                    Battery (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="40.5"
                    value={vBattery}
                    onChange={(e) => setVBattery(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#141414] border border-[#262626] text-xs text-white outline-none focus:border-[#555555]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#a1a1a1] mb-1">
                    Max AC (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="7.2"
                    value={vPower}
                    onChange={(e) => setVPower(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-[#141414] border border-[#262626] text-xs text-white outline-none focus:border-[#555555]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#a1a1a1] mb-1">
                  Connector
                </label>
                <select
                  value={vConnector}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange={(e) => setVConnector(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-md bg-[#141414] border border-[#262626] text-xs text-white outline-none focus:border-[#555555]"
                >
                  <option value="Type 2">Type 2 (IEC 62196)</option>
                  <option value="CCS2">CCS2</option>
                  <option value="16A 3-Pin">16A 3-Pin Socket</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingVehicle}
                className="w-full mt-2 py-2 px-4 rounded-md bg-white text-black font-medium text-xs hover:bg-[#d4d4d4] transition-colors disabled:opacity-50"
              >
                {isSubmittingVehicle ? "Saving..." : "Save Vehicle"}
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
        <div className="flex items-center justify-center min-h-[70vh] bg-black">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
