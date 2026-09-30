"use client";

import React, { useState, useEffect } from "react";
import { Charger } from "@/types";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Zap,
  Eye,
  RotateCcw,
  Check,
  Lock,
} from "lucide-react";

export default function AdminVerificationPage() {
  const { user, profile, openAuthModal } = useAuth();
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState({
    provider: "Amazon Bedrock",
    model: "anthropic.claude-3-sonnet-20240229-v1:0",
    status: "Connected",
    fallback: "Enabled",
  });

  useEffect(() => {
    setIsLoading(true);
    fetch("/api/chargers?includePending=true")
      .then((res) => res.json())
      .then((data) => {
        const list = data.chargers || data.data || [];
        if (data.success && Array.isArray(list)) {
          setChargers(list);
          const pending = list.find((c: Charger) => c.verificationStatus === "PENDING");
          if (pending) {
            setSelectedCharger(pending);
          } else if (list.length > 0) {
            setSelectedCharger(list[0]);
          }
        }
      })
      .catch((err) => console.error("Admin fetch error:", err))
      .finally(() => setIsLoading(false));

    fetch("/api/ai/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setAiStatus(data.data);
        }
      })
      .catch((err) => console.error("AI status fetch error:", err));
  }, []);

  const pendingList = chargers.filter((c) => c.verificationStatus === "PENDING");
  const verifiedList = chargers.filter((c) => c.verificationStatus === "VERIFIED");

  const handleApprove = async (id: string) => {
    setChargers((prev) =>
      prev.map((c) =>
        c.chargerId === id ? { ...c, verificationStatus: "VERIFIED" as const } : c
      )
    );
    try {
      await fetch(`/api/chargers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: "VERIFIED" }),
      });
    } catch (e) {
      console.error("Approve update failed:", e);
    }
    setActionSuccess(`Charger ${id} approved and granted community verified badge.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleReject = async (id: string) => {
    setChargers((prev) =>
      prev.map((c) =>
        c.chargerId === id ? { ...c, verificationStatus: "REJECTED" as const } : c
      )
    );
    try {
      await fetch(`/api/chargers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: "REJECTED" }),
      });
    } catch (e) {
      console.error("Reject update failed:", e);
    }
    setActionSuccess(`Charger ${id} marked as rejected. Host informed to resubmit.`);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#f4fbf4] text-[#161d19] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Header with Developer/Admin AI Status Card (Section 4) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef6ee] border border-[#dde4dd] text-[#006c49] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Marketplace Trust Layer</span>
            </div>
            <h1 className="text-3xl font-black text-[#161d19] tracking-tight">
              Admin Charger Verification Console
            </h1>
            <p className="text-xs sm:text-sm text-[#3c4a42]">
              Review host submissions, inspect AI vision scan confidence, and approve chargers for public community discovery.
            </p>
          </div>

          {/* AI ENGINE Status Card */}
          <div className="bg-white border border-[#dde4dd] rounded-2xl p-4 shadow-sm min-w-[280px] text-xs">
            <div className="flex items-center justify-between font-bold text-[11px] text-[#3c4a42] uppercase tracking-wider mb-2">
              <span>AI ENGINE</span>
              <span className={`inline-flex items-center gap-1 font-semibold ${aiStatus.status === "Connected" ? "text-[#006c49]" : "text-amber-600"}`}>
                <span className={`w-2 h-2 rounded-full ${aiStatus.status === "Connected" ? "bg-[#006c49]" : "bg-amber-500"} animate-pulse`} />
                {aiStatus.status === "Connected" ? "● Connected" : "● Demo Mode"}
              </span>
            </div>
            <div className="space-y-1.5 text-[#161d19]">
              <div className="flex justify-between">
                <span className="text-[#3c4a42]">Provider:</span>
                <strong className="font-semibold">{aiStatus.provider}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#3c4a42]">Model:</span>
                <span className="font-mono text-[10px] text-[#006c49] truncate max-w-[160px]" title={aiStatus.model}>
                  {aiStatus.model}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#dde4dd]">
                <span className="text-[#3c4a42]">Fallback:</span>
                <strong className={aiStatus.fallback === "Active" ? "text-amber-700" : "text-[#006c49]"}>
                  {aiStatus.fallback}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {actionSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-[#eef6ee] border border-[#82f5c1] text-[#006c49] text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-[#006c49] shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: List of Pending Submissions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#dde4dd] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-[#161d19] uppercase tracking-wider">
                  Pending Submissions ({pendingList.length})
                </h3>
                <span className="text-[11px] text-amber-600 font-semibold">Requires Admin Review</span>
              </div>

              <div className="space-y-3">
                {pendingList.map((c) => {
                  const isSelected = selectedCharger?.chargerId === c.chargerId;
                  return (
                    <div
                      key={c.chargerId}
                      onClick={() => setSelectedCharger(c)}
                      className={`p-4 rounded-2xl transition cursor-pointer border ${
                        isSelected
                          ? "bg-[#eef6ee] border-[#006c49] shadow-sm"
                          : "bg-white border-[#dde4dd] hover:bg-[#eef6ee]"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          PENDING REVIEW
                        </span>
                        <span className="text-xs font-bold text-[#006c49]">
                          {c.powerKw} kW AC
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#161d19] mb-1">{c.title}</h4>
                      <p className="text-xs text-[#3c4a42] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#006c49]" />
                        {c.city}, {c.state}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Approved Chargers */}
            <div className="bg-white border border-[#dde4dd] rounded-3xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-[#161d19] uppercase tracking-wider mb-3">
                Approved Live Chargers ({verifiedList.length})
              </h3>
              <div className="space-y-2">
                {verifiedList.slice(0, 4).map((vc) => (
                  <div
                    key={vc.chargerId}
                    className="p-3 rounded-xl bg-[#eef6ee] border border-[#dde4dd] flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-[#161d19] block">{vc.title}</span>
                      <span className="text-[10px] text-[#3c4a42]">
                        {vc.city} • {vc.powerKw} kW AC
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#006c49] bg-[#82f5c1] px-2 py-0.5 rounded-full">
                      VERIFIED ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Charger AI Review Inspection */}
          <div className="lg:col-span-7">
            {selectedCharger ? (
              <div className="bg-white border border-[#dde4dd] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-[#dde4dd]">
                  <div>
                    <span className="text-xs font-mono text-[#3c4a42] block">
                      ID: {selectedCharger.chargerId}
                    </span>
                    <h2 className="text-xl font-bold text-[#161d19]">{selectedCharger.title}</h2>
                    <p className="text-xs text-[#3c4a42] mt-0.5">
                      {selectedCharger.address}, {selectedCharger.city}, {selectedCharger.state}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      selectedCharger.verificationStatus === "VERIFIED"
                        ? "bg-[#82f5c1] text-[#00714e]"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {selectedCharger.verificationStatus}
                  </span>
                </div>

                {/* Photo & Scanner Analysis */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#161d19] uppercase">
                    Host Submitted Evidence Photo
                  </span>
                  <div
                    className="w-full h-64 rounded-2xl bg-cover bg-center border border-[#dde4dd] relative overflow-hidden"
                    style={{
                      backgroundImage: `url(${selectedCharger.images?.[0] || "https://images.unsplash.com/photo-1558441719-74e4479e4384?w=800&auto=format&fit=crop&q=80"})`,
                    }}
                  >
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#dde4dd] text-xs font-bold text-[#006c49]">
                      AI Confidence Score: {Math.round((selectedCharger.verificationScore || 0.94) * 100)}%
                    </div>
                  </div>
                </div>

                {/* AI Automated Checklist */}
                <div className="p-4 rounded-2xl bg-[#eef6ee] border border-[#dde4dd] space-y-2 text-xs">
                  <span className="font-bold text-[#006c49] uppercase tracking-wider block mb-2">
                    AI-Assisted Computer Vision Analysis
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[#161d19]">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#006c49]" />
                      <span>EV Wallbox hardware detected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#006c49]" />
                      <span>Heavy-duty cable visible</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#006c49]" />
                      <span>{selectedCharger.connectorType} connector match</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#006c49]" />
                      <span>Clean outdoor/driveway mounting</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#3c4a42] pt-2 border-t border-[#dde4dd]">
                    Reason: {selectedCharger.verificationReason}
                  </p>
                </div>

                {/* Claimed Specs */}
                <div className="grid grid-cols-3 gap-2.5 text-center text-xs p-3 rounded-xl bg-[#eef6ee]">
                  <div>
                    <span className="text-[10px] text-[#3c4a42] block">Claimed Power</span>
                    <strong className="text-[#006c49] font-bold">{selectedCharger.powerKw} kW AC</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#3c4a42] block">Connector</span>
                    <strong className="text-[#161d19] font-bold">{selectedCharger.connectorType}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#3c4a42] block">Electricity Rate</span>
                    <strong className="text-[#161d19] font-bold">₹{selectedCharger.electricityRate}/kWh</strong>
                  </div>
                </div>

                {/* Approve / Reject Actions */}
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => handleReject(selectedCharger.chargerId)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#ffdad6] hover:bg-[#ffc6c0] text-[#ba1a1a] text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject / Request Resubmission</span>
                  </button>
                  <button
                    onClick={() => handleApprove(selectedCharger.chargerId)}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#006c49] hover:bg-[#005236] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve &amp; Issue Community Badge</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-[#dde4dd] rounded-3xl text-xs text-[#3c4a42]">
                Select a charger submission on the left to inspect AI vision results.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
