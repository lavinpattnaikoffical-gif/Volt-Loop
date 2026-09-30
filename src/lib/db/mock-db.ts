import { Charger, Vehicle, User, Booking, Review } from "@/types";
import fs from "fs";
import path from "path";

interface RuntimeData {
  chargers: Charger[];
  bookings: Booking[];
  reviews: Review[];
  vehicles: Vehicle[];
  users: User[];
}

function getDataFilePath(): string {
  return path.join(process.cwd(), ".data", "runtime-db.json");
}

function loadFromDisk(): RuntimeData | null {
  try {
    const filePath = getDataFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    // Graceful fallback to memory
  }
  return null;
}

function saveToDisk(data: RuntimeData) {
  try {
    const dir = path.join(process.cwd(), ".data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getDataFilePath(), JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    // Non-fatal, keep in-memory
  }
}

// In-memory store that persists across hot reloads and writes to local disk for persistence
class MemoryStore {
  private users: User[];
  private vehicles: Vehicle[];
  private chargers: Charger[];
  private bookings: Booking[];
  private reviews: Review[];

  constructor() {
    const disk = loadFromDisk();
    this.users = disk?.users ?? [];
    this.vehicles = disk?.vehicles ?? [];
    this.chargers = disk?.chargers ?? [];
    this.bookings = disk?.bookings ?? [];
    this.reviews = disk?.reviews ?? [];
  }

  private persist() {
    saveToDisk({
      users: this.users,
      vehicles: this.vehicles,
      chargers: this.chargers,
      bookings: this.bookings,
      reviews: this.reviews,
    });
  }

  // Chargers
  async getChargers(): Promise<Charger[]> {
    return [...this.chargers];
  }

  async getChargerById(id: string): Promise<Charger | undefined> {
    return this.chargers.find((c) => c.chargerId === id);
  }

  async createCharger(charger: Charger): Promise<Charger> {
    this.chargers.unshift(charger);
    this.persist();
    return charger;
  }

  async updateCharger(id: string, updates: Partial<Charger>): Promise<Charger | null> {
    const idx = this.chargers.findIndex((c) => c.chargerId === id);
    if (idx === -1) return null;
    this.chargers[idx] = {
      ...this.chargers[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.chargers[idx];
  }

  // Vehicles
  async getVehicles(userId?: string): Promise<Vehicle[]> {
    if (userId) {
      return this.vehicles.filter((v) => v.userId === userId);
    }
    return [...this.vehicles];
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return this.vehicles.find((v) => v.vehicleId === id);
  }

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    this.vehicles.unshift(vehicle);
    this.persist();
    return vehicle;
  }

  async deleteVehicle(id: string): Promise<boolean> {
    const before = this.vehicles.length;
    this.vehicles = this.vehicles.filter((v) => v.vehicleId !== id);
    if (this.vehicles.length !== before) {
      this.persist();
      return true;
    }
    return false;
  }

  // Bookings
  async getBookings(userId?: string): Promise<Booking[]> {
    if (userId) {
      return this.bookings.filter(
        (b) => b.userId === userId || b.chargerId.includes(userId)
      );
    }
    return [...this.bookings];
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    return this.bookings.find((b) => b.bookingId === id);
  }

  async createBooking(booking: Booking): Promise<Booking> {
    this.bookings.unshift(booking);
    this.persist();
    return booking;
  }

  async updateBookingStatus(
    id: string,
    status: Booking["status"]
  ): Promise<Booking | null> {
    const b = this.bookings.find((x) => x.bookingId === id);
    if (!b) return null;
    b.status = status;
    this.persist();
    return b;
  }

  // Reviews
  async getReviews(chargerId?: string): Promise<Review[]> {
    if (chargerId) {
      return this.reviews.filter((r) => r.chargerId === chargerId);
    }
    return [...this.reviews];
  }

  async createReview(review: Review): Promise<Review> {
    this.reviews.unshift(review);
    const charger = this.chargers.find((c) => c.chargerId === review.chargerId);
    if (charger) {
      const chargerReviews = this.reviews.filter(
        (r) => r.chargerId === charger.chargerId
      );
      const avg =
        chargerReviews.reduce((sum, r) => sum + r.rating, 0) /
        chargerReviews.length;
      charger.rating = Number(avg.toFixed(1));
      charger.reviewCount = chargerReviews.length;
    }
    this.persist();
    return review;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.userId === id);
  }
}

// Global singleton to persist across hot reloads in development
const globalForDb = global as unknown as { __voltloopStore?: MemoryStore };
export const db = globalForDb.__voltloopStore ?? new MemoryStore();
if (process.env.NODE_ENV !== "production") globalForDb.__voltloopStore = db;
