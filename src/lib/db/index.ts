import { db as mockDb } from "./mock-db";
import { SUPABASE_CONFIG } from "@/lib/supabase/config";
import { SupabaseDbService } from "./supabase-db";
import { Charger, Vehicle, User, Booking, Review } from "@/types";

export interface DatabaseService {
  getChargers(): Promise<Charger[]>;
  getChargerById(id: string): Promise<Charger | undefined>;
  createCharger(charger: Charger): Promise<Charger>;
  updateCharger(id: string, updates: Partial<Charger>): Promise<Charger | null>;

  getVehicles(userId?: string): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: Vehicle): Promise<Vehicle>;
  deleteVehicle(id: string): Promise<boolean>;

  getBookings(userId?: string): Promise<Booking[]>;
  getBookingById(id: string): Promise<Booking | undefined>;
  createBooking(booking: Booking): Promise<Booking>;
  updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | null>;

  getReviews(chargerId?: string): Promise<Review[]>;
  createReview(review: Review): Promise<Review>;

  getUser(id: string): Promise<User | undefined>;
}

let dbInstance: DatabaseService | null = null;

export function getDb(): DatabaseService {
  if (!dbInstance) {
    // Primary database is Supabase PostgreSQL
    if (SUPABASE_CONFIG.isConfigured) {
      dbInstance = new SupabaseDbService();
    } else {
      // Local fallback for running unconfigured (clean empty database, strictly no dummy data)
      dbInstance = mockDb;
    }
  }
  return dbInstance!;
}

export const dbService: DatabaseService = new Proxy({} as DatabaseService, {
  get(_target, prop) {
    const db = getDb();
    const val = (db as any)[prop];
    if (typeof val === "function") {
      return val.bind(db);
    }
    return val;
  },
});
