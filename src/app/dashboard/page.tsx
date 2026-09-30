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

  const { user, profile, vehicles, openAuthModal, signInWithGoogle, addVehicle, refreshProfile } = useAuth();

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

  // If unauthenticated: Show required Auth state (Requirement 3)
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#dde4dd] rounded-3xl p-8 text-center shadow-lg">
          <div className="w-14 h-14 rounded-2xl bg-[#eef6ee] text-[#006c49] flex items-center justify-center mx-auto mb-4 border border-[#82f5c1]/60">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-[#161d19] mb-2">
            Sign in to continue
          </h2>
          <p className="text-xs text-[#3c4a42] mb-6 leading-relaxed">
            Please sign in to view your EV charging bookings, register your vehicle, or manage host earnings on VOLTLOOP.
          </p>

          <button
            onClick={openAuthModal}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm shadow-md transition"
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

  // Real host calculations (zero fake numbers)
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
    <div className="min-h-screen bg-[#f4fbf4] text-[#161d19] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Top Banner / Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef6ee] border border-[#dde4dd] text-[#006c49] text-xs font-semibold uppercase tracking-wider mb-1">
              Member: {profile?.name || user.email}
            </div>
            <h1 className="text-3xl font-black text-[#161d19] tracking-tight">VoltLoop Dashboard</h1>
            <p className="text-xs text-[#3c4a42]">
              Manage your charging bookings, registered vehicles, and host earnings.
            </p>
          </div>

          {/* Tab Switcher Pills */}
          <div className="p-1.5 bg-white border border-[#dde4dd] rounded-2xl flex items-center gap-1 shadow-sm">
            <button
              onClick={() => setActiveTab("driver")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "driver"
                  ? "bg-[#006c49] text-white shadow-sm"
                  : "text-[#3c4a42] hover:text-[#161d19] hover:bg-[#eef6ee]"
              }`}
            >
              <Car className="w-4 h-4" />
              <span>Driver Mode</span>
            </button>

            <button
              onClick={() => setActiveTab("host")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "host"
                  ? "bg-[#006c49] text-white shadow-sm"
                  : "text-[#3c4a42] hover:text-[#161d19] hover:bg-[#eef6ee]"
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
            {/* Upcoming Reservations — PRIMARY CONTENT */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#006c49]" />
                  <span>Your Bookings</span>
                </h3>
                <Link
                  href="/explore"
                  className="text-xs font-bold text-[#006c49] hover:underline flex items-center gap-1"
                >
                  <span>Book New Session</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {upcomingDriverBookings.length === 0 ? (
                <div className="p-8 text-center bg-white border border-[#dde4dd] rounded-2xl">
                  <h4 className="font-bold text-base text-[#161d19] mb-1">
                    No bookings yet
                  </h4>
                  <p className="text-xs text-[#3c4a42] mb-4">
                    Find a community charger near you and book your first overnight charging session.
                  </p>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-sm transition"
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
                      className="p-5 rounded-2xl bg-white border border-[#dde4dd] shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-[#3c4a42] block">
                            ID: {b.bookingId}
                          </span>
                          <h4 className="font-bold text-base text-[#161d19]">
                            {b.chargerTitle}
                          </h4>
                          <span className="text-xs text-[#3c4a42] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                            {b.chargerAddress}, {b.chargerCity}
                          </span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
                          {b.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-xl bg-[#eef6ee]">
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block">Reserved Duration:</span>
                          <strong className="text-[#161d19]">{b.estimatedChargingTime}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block">Total Amount:</span>
                          <strong className="text-[#006c49]">₹{b.totalCost}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[#3c4a42]">
                          Est. Energy: ~{b.estimatedEnergyKwh} kWh
                        </span>
                        <Link
                          href={`/charger/${b.chargerId}`}
                          className="font-bold text-[#006c49] hover:underline"
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
                <h3 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#3c4a42]" />
                  <span>Past Charging History</span>
                </h3>

                <div className="bg-white border border-[#dde4dd] rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#eef6ee] text-[#3c4a42] uppercase text-[10px] border-b border-[#dde4dd]">
                        <tr>
                          <th className="p-3.5">Booking ID</th>
                          <th className="p-3.5">Location</th>
                          <th className="p-3.5">Energy</th>
                          <th className="p-3.5">Duration</th>
                          <th className="p-3.5">Amount</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dde4dd] text-[#161d19]">
                        {pastDriverBookings.map((pb) => (
                          <tr key={pb.bookingId} className="hover:bg-[#eef6ee]/50">
                            <td className="p-3.5 font-mono text-[11px]">{pb.bookingId}</td>
                            <td className="p-3.5 font-semibold">{pb.chargerTitle}</td>
                            <td className="p-3.5">~{pb.estimatedEnergyKwh} kWh</td>
                            <td className="p-3.5">~{pb.estimatedChargingTime}</td>
                            <td className="p-3.5 font-bold text-[#006c49]">₹{pb.totalCost}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e] text-[10px] font-bold">
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

            {/* My Vehicles — SECONDARY (setup, not primary action) */}
            <div className="bg-white border border-[#dde4dd] rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#161d19] flex items-center gap-2">
                  <Car className="w-4 h-4 text-[#006c49]" />
                  <span>My Vehicles</span>
                </h3>
                <button
                  onClick={() => setShowAddVehicleModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eef6ee] text-[#006c49] hover:bg-[#dde4dd] transition"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Vehicle</span>
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="p-4 text-center rounded-2xl bg-[#f8faf8] border border-dashed border-[#dde4dd]">
                  <p className="text-xs text-[#3c4a42]">
                    Adding your EV helps us calculate accurate charging times and costs. You can skip this for now.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicles.map((v) => (
                    <div
                      key={v.vehicleId}
                      className="p-4 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-[#161d19]">
                          {v.brand} {v.model}
                        </h4>
                        <p className="text-xs text-[#3c4a42]">
                          {v.batteryCapacityKwh} kWh • {v.connectorType} (Max {v.maxAcChargingKw} kW AC)
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#82f5c1] text-[#00714e]">
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
            {/* Real Host Analytics Cards (strictly calculated from DB records) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-[#dde4dd] rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-[#3c4a42] uppercase font-semibold block mb-1">
                  Host Earnings
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-[#006c49]">
                  ₹{realEarnings.toLocaleString()}
                </strong>
                <span className="text-[10px] text-[#3c4a42] block mt-1">Real completed sessions</span>
              </div>

              <div className="bg-white border border-[#dde4dd] rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-[#3c4a42] uppercase font-semibold block mb-1">
                  Charging Sessions
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-[#161d19]">
                  {realSessionsCount}
                </strong>
                <span className="text-[10px] text-[#3c4a42] block mt-1">Total reservations</span>
              </div>

              <div className="bg-white border border-[#dde4dd] rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-[#3c4a42] uppercase font-semibold block mb-1">
                  Active Wallboxes
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-[#006c49]">
                  {hostChargers.length}
                </strong>
                <span className="text-[10px] text-[#3c4a42] block mt-1">Listed chargers</span>
              </div>

              <div className="bg-white border border-[#dde4dd] rounded-2xl p-5 shadow-sm">
                <span className="text-xs text-[#3c4a42] uppercase font-semibold block mb-1">
                  Average Rating
                </span>
                <strong className="text-2xl sm:text-3xl font-black text-amber-600 flex items-center gap-1">
                  ★ {hostChargers.length > 0 ? (hostChargers.reduce((s, c) => s + c.rating, 0) / hostChargers.length).toFixed(1) : "—"}
                </strong>
                <span className="text-[10px] text-[#3c4a42] block mt-1">Verified reviews</span>
              </div>
            </div>

            {/* My Listed Chargers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#161d19] flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#006c49]" />
                  <span>My Listed Wallboxes</span>
                </h3>
                <Link
                  href="/host/list"
                  className="px-4 py-2 rounded-xl bg-[#006c49] text-white font-bold text-xs hover:bg-[#005236] transition shadow-sm flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>List Your Charger</span>
                </Link>
              </div>

              {hostChargers.length === 0 ? (
                /* Requirement 17 & 18: No Charger Listed Empty State */
                <div className="p-8 text-center bg-white border border-[#dde4dd] rounded-2xl">
                  <h4 className="font-bold text-base text-[#161d19] mb-1">
                    You haven't listed a charger yet.
                  </h4>
                  <p className="text-xs text-[#3c4a42] mb-4">
                    Turn your idle charger into a community charging point and earn passive revenue.
                  </p>
                  <Link
                    href="/host/list"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold shadow-sm transition"
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
                      className="p-5 rounded-2xl bg-white border border-[#dde4dd] shadow-sm space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              hc.verificationStatus === "VERIFIED"
                                ? "bg-[#82f5c1] text-[#00714e]"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {hc.verificationStatus === "VERIFIED" ? "🟢 ACTIVE" : "⏳ PENDING REVIEW"}
                          </span>
                          <h4 className="font-bold text-base text-[#161d19] mt-1.5">{hc.title}</h4>
                          <p className="text-xs text-[#3c4a42] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#006c49]" />
                            {hc.address}, {hc.city}
                          </p>
                        </div>
                        <span className="text-sm font-black text-[#006c49]">
                          {hc.powerKw} kW AC
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs p-2.5 rounded-xl bg-[#eef6ee]">
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block">Tariff</span>
                          <strong className="text-[#161d19]">₹{hc.electricityRate}/kWh</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block">Host Fee</span>
                          <strong className="text-[#006c49]">₹{hc.hostFee}/slot</strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#3c4a42] block">Platform Fee</span>
                          <strong className="text-[#161d19]">₹{hc.platformFee}</strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[#3c4a42]">
                          Available: {hc.availableFrom} → {hc.availableUntil}
                        </span>
                        <Link
                          href={`/charger/${hc.chargerId}`}
                          className="font-bold text-[#006c49] hover:underline"
                        >
                          Public Listing View →
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

      {/* ============================================================== */}
      {/* ADD VEHICLE MODAL (Requirement 5) */}
      {/* ============================================================== */}
      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-[#dde4dd] rounded-3xl p-6 sm:p-7 shadow-2xl text-[#161d19]">
            <button
              onClick={() => setShowAddVehicleModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-[#161d19] mb-1">Add Your Vehicle</h3>
            <p className="text-xs text-[#3c4a42] mb-5">
              Add your EV to calculate real charging speeds, costs, and battery ranges.
            </p>

            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#161d19] mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tata, MG, Mahindra, Hyundai"
                  value={vBrand}
                  onChange={(e) => setVBrand(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dde4dd] text-sm focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161d19] mb-1">
                  Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nexon EV, ZS EV, XUV400"
                  value={vModel}
                  onChange={(e) => setVModel(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dde4dd] text-sm focus:outline-none focus:border-[#006c49]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#161d19] mb-1">
                    Battery Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="40.5"
                    value={vBattery}
                    onChange={(e) => setVBattery(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dde4dd] text-sm focus:outline-none focus:border-[#006c49]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#161d19] mb-1">
                    Max AC Power (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="7.2"
                    value={vPower}
                    onChange={(e) => setVPower(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#dde4dd] text-sm focus:outline-none focus:border-[#006c49]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#161d19] mb-1">
                  Connector Type
                </label>
                <select
                  value={vConnector}
                  onChange={(e) => setVConnector(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-[#dde4dd] text-sm focus:outline-none focus:border-[#006c49]"
                >
                  <option value="Type 2">Type 2 (IEC 62196)</option>
                  <option value="CCS2">CCS2</option>
                  <option value="16A 3-Pin">16A 3-Pin Socket</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingVehicle}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
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
        <div className="flex items-center justify-center min-h-[60vh] bg-[#f4fbf4]">
          <div className="w-8 h-8 border-3 border-[#006c49] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
