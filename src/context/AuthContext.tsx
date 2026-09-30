"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import { User, Vehicle } from "@/types";

interface AuthContextType {
  user: any | null;
  profile: User | null;
  vehicles: Vehicle[];
  loading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  addVehicle: (vehicleData: Omit<Vehicle, "vehicleId" | "userId">) => Promise<Vehicle | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  vehicles: [],
  loading: true,
  isConfigured: false,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  signInWithGoogle: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signOut: async () => {},
  refreshProfile: async () => {},
  addVehicle: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const fetchProfileAndVehicles = async (userId: string) => {
    try {
      if (!SUPABASE_CONFIG.isConfigured) return;

      // 1. Fetch profile from Supabase
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileData) {
        setProfile({
          userId: profileData.id,
          name: profileData.full_name || "VoltLoop User",
          email: profileData.email || "",
          phone: profileData.phone || "",
          role: profileData.role || "BOTH",
          avatar: profileData.avatar_url || "",
          createdAt: profileData.created_at,
        });
      }

      // 2. Fetch user's vehicles
      const { data: vData } = await supabase
        .from("vehicles")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (vData) {
        setVehicles(
          vData.map((v: any) => ({
            vehicleId: v.id,
            userId: v.user_id,
            brand: v.brand,
            model: v.model,
            batteryCapacityKwh: Number(v.battery_capacity_kwh),
            connectorType: v.connector_type,
            maxAcChargingKw: Number(v.max_ac_charging_kw),
            currentBatteryPercent: 20,
            targetBatteryPercent: 80,
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching profile/vehicles:", err);
    }
  };

  useEffect(() => {
    if (!SUPABASE_CONFIG.isConfigured) {
      setLoading(false);
      return;
    }

    // Initialize session
    supabase.auth.getSession().then((result: any) => {
      const session = result?.data?.session;
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfileAndVehicles(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndVehicles(session.user.id);
      } else {
        setProfile(null);
        setVehicles([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signInWithGoogle = async () => {
    if (!SUPABASE_CONFIG.isConfigured) {
      return {
        error: new Error(
          "Supabase is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
        ),
      };
    }

    try {
      const redirectOrigin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    if (!SUPABASE_CONFIG.isConfigured) {
      return {
        error: new Error(
          "Supabase Project URL is not configured yet. Please add your real NEXT_PUBLIC_SUPABASE_URL in .env.local (e.g. https://your-ref.supabase.co)."
        ),
      };
    }
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error && error.message?.toLowerCase().includes("failed to fetch")) {
        return {
          error: new Error(
            "Could not connect to Supabase. Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local."
          ),
        };
      }
      return { error };
    } catch (err: any) {
      return {
        error: new Error(
          err?.message?.toLowerCase().includes("fetch")
            ? "Could not connect to Supabase. Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local."
            : err?.message || "Failed to sign in."
        ),
      };
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (!SUPABASE_CONFIG.isConfigured) {
      return {
        error: new Error(
          "Supabase Project URL is not configured yet. Please add your real NEXT_PUBLIC_SUPABASE_URL in .env.local (e.g. https://your-ref.supabase.co)."
        ),
      };
    }
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      if (error && error.message?.toLowerCase().includes("failed to fetch")) {
        return {
          error: new Error(
            "Could not connect to Supabase. Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local."
          ),
        };
      }
      return { error };
    } catch (err: any) {
      return {
        error: new Error(
          err?.message?.toLowerCase().includes("fetch")
            ? "Could not connect to Supabase. Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local."
            : err?.message || "Failed to create account."
        ),
      };
    }
  };

  const signOut = async () => {
    if (SUPABASE_CONFIG.isConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setVehicles([]);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfileAndVehicles(user.id);
    }
  };

  const addVehicle = async (
    vehicleData: Omit<Vehicle, "vehicleId" | "userId">
  ): Promise<Vehicle | null> => {
    if (!user) {
      openAuthModal();
      return null;
    }

    try {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...vehicleData,
          userId: user.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to add vehicle");
      const created: Vehicle = await res.json();
      setVehicles((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      console.error("Error adding vehicle:", err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        vehicles,
        loading,
        isConfigured: SUPABASE_CONFIG.isConfigured,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
        addVehicle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
