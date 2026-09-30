import { DatabaseService } from "./index";
import { Charger, Vehicle, User, Booking, Review, VerificationStatus } from "@/types";
import { getAdminClient } from "@/lib/supabase/admin";

const isValidUuid = (val?: string): boolean =>
  Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

export class SupabaseDbService implements DatabaseService {
  private get client(): any {
    return getAdminClient();
  }

  // --- CHARGERS ---
  async getChargers(): Promise<Charger[]> {
    try {
      const { data, error } = await this.client
        .from("chargers")
        .select(`
          *,
          profiles:owner_id (full_name, phone, avatar_url, role)
        `)
        .order("created_at", { ascending: false });

      if (error || !data) {
        console.error("Supabase getChargers error:", error);
        return [];
      }

      return data.map((row: any) => this.mapChargerRow(row));
    } catch (err) {
      console.error("Error in getChargers:", err);
      return [];
    }
  }

  async getChargerById(id: string): Promise<Charger | undefined> {
    try {
      const { data, error } = await this.client
        .from("chargers")
        .select(`
          *,
          profiles:owner_id (full_name, phone, avatar_url, role)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return undefined;
      return this.mapChargerRow(data);
    } catch (err) {
      console.error("Error in getChargerById:", err);
      return undefined;
    }
  }

  async createCharger(charger: Charger): Promise<Charger> {
    const payload = {
      id: isValidUuid(charger.chargerId) ? charger.chargerId : undefined,
      owner_id: charger.ownerId,
      title: charger.title,
      description: charger.description || "",
      latitude: charger.latitude,
      longitude: charger.longitude,
      address: charger.address,
      city: charger.city,
      state: charger.state,
      charger_type: charger.chargerType || "AC Wallbox",
      power_kw: charger.powerKw,
      connector_type: charger.connectorType || "Type 2",
      electricity_rate: charger.electricityRate,
      host_fee: charger.hostFee,
      platform_fee: charger.platformFee,
      availability_start: charger.availableFrom || "19:00",
      availability_end: charger.availableUntil || "08:00",
      image_urls: charger.images || [],
      verification_status: this.mapToDbVerificationStatus(charger.verificationStatus),
      verification_score: charger.verificationScore || 0,
      verification_reason: charger.verificationReason || "",
      rating: charger.rating || 0,
      review_count: charger.reviewCount || 0,
    };

    const { data, error } = await this.client
      .from("chargers")
      .insert(payload)
      .select(`*, profiles:owner_id (full_name, phone, avatar_url, role)`)
      .single();

    if (error || !data) {
      console.error("Error creating charger in Supabase:", error);
      throw new Error(error?.message || "Failed to create charger");
    }

    return this.mapChargerRow(data);
  }

  async updateCharger(id: string, updates: Partial<Charger>): Promise<Charger | null> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.latitude !== undefined) payload.latitude = updates.latitude;
    if (updates.longitude !== undefined) payload.longitude = updates.longitude;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.city !== undefined) payload.city = updates.city;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.chargerType !== undefined) payload.charger_type = updates.chargerType;
    if (updates.powerKw !== undefined) payload.power_kw = updates.powerKw;
    if (updates.connectorType !== undefined) payload.connector_type = updates.connectorType;
    if (updates.electricityRate !== undefined) payload.electricity_rate = updates.electricityRate;
    if (updates.hostFee !== undefined) payload.host_fee = updates.hostFee;
    if (updates.platformFee !== undefined) payload.platform_fee = updates.platformFee;
    if (updates.availableFrom !== undefined) payload.availability_start = updates.availableFrom;
    if (updates.availableUntil !== undefined) payload.availability_end = updates.availableUntil;
    if (updates.images !== undefined) payload.image_urls = updates.images;
    if (updates.verificationStatus !== undefined) {
      payload.verification_status = this.mapToDbVerificationStatus(updates.verificationStatus);
    }
    if (updates.verificationScore !== undefined) payload.verification_score = updates.verificationScore;
    if (updates.verificationReason !== undefined) payload.verification_reason = updates.verificationReason;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.reviewCount !== undefined) payload.review_count = updates.reviewCount;

    const { data, error } = await this.client
      .from("chargers")
      .update(payload)
      .eq("id", id)
      .select(`*, profiles:owner_id (full_name, phone, avatar_url, role)`)
      .single();

    if (error || !data) {
      console.error("Error updating charger in Supabase:", error);
      return null;
    }

    return this.mapChargerRow(data);
  }

  // --- VEHICLES ---
  async getVehicles(userId?: string): Promise<Vehicle[]> {
    try {
      let query = this.client.from("vehicles").select("*");
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data) {
        console.error("Supabase getVehicles error:", error);
        return [];
      }

      return data.map((row: any) => ({
        vehicleId: row.id,
        userId: row.user_id,
        brand: row.brand,
        model: row.model,
        batteryCapacityKwh: Number(row.battery_capacity_kwh),
        connectorType: row.connector_type as any,
        maxAcChargingKw: Number(row.max_ac_charging_kw),
        currentBatteryPercent: 20,
        targetBatteryPercent: 80,
      }));
    } catch (err) {
      console.error("Error in getVehicles:", err);
      return [];
    }
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    try {
      const { data, error } = await this.client
        .from("vehicles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return undefined;
      return {
        vehicleId: data.id,
        userId: data.user_id,
        brand: data.brand,
        model: data.model,
        batteryCapacityKwh: Number(data.battery_capacity_kwh),
        connectorType: data.connector_type as any,
        maxAcChargingKw: Number(data.max_ac_charging_kw),
        currentBatteryPercent: 20,
        targetBatteryPercent: 80,
      };
    } catch (err) {
      console.error("Error in getVehicleById:", err);
      return undefined;
    }
  }

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    const payload = {
      id: isValidUuid(vehicle.vehicleId) ? vehicle.vehicleId : undefined,
      user_id: vehicle.userId,
      brand: vehicle.brand,
      model: vehicle.model,
      battery_capacity_kwh: vehicle.batteryCapacityKwh,
      connector_type: vehicle.connectorType,
      max_ac_charging_kw: vehicle.maxAcChargingKw,
    };

    const { data, error } = await this.client
      .from("vehicles")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      console.error("Error inserting vehicle in Supabase:", error);
      throw new Error(error?.message || "Failed to create vehicle");
    }

    return {
      vehicleId: data.id,
      userId: data.user_id,
      brand: data.brand,
      model: data.model,
      batteryCapacityKwh: Number(data.battery_capacity_kwh),
      connectorType: data.connector_type as any,
      maxAcChargingKw: Number(data.max_ac_charging_kw),
      currentBatteryPercent: 20,
      targetBatteryPercent: 80,
    };
  }

  async deleteVehicle(id: string): Promise<boolean> {
    try {
      const { error } = await this.client.from("vehicles").delete().eq("id", id);
      if (error) {
        console.error("Error deleting vehicle in Supabase:", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error in deleteVehicle:", err);
      return false;
    }
  }

  // --- BOOKINGS ---
  async getBookings(userId?: string): Promise<Booking[]> {
    try {
      let query = this.client.from("bookings").select(`
        *,
        chargers (title, address, city, owner_id),
        vehicles (model)
      `);

      if (userId) {
        query = query.or(`user_id.eq.${userId}`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data) {
        console.error("Supabase getBookings error:", error);
        return [];
      }

      return data.map((row: any) => this.mapBookingRow(row));
    } catch (err) {
      console.error("Error in getBookings:", err);
      return [];
    }
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    try {
      const { data, error } = await this.client
        .from("bookings")
        .select(`
          *,
          chargers (title, address, city, owner_id),
          vehicles (model)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return undefined;
      return this.mapBookingRow(data);
    } catch (err) {
      console.error("Error in getBookingById:", err);
      return undefined;
    }
  }

  async createBooking(booking: Booking): Promise<Booking> {
    const payload = {
      id: isValidUuid(booking.bookingId) ? booking.bookingId : undefined,
      booking_code: `BK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      charger_id: booking.chargerId,
      user_id: booking.userId,
      vehicle_id: isValidUuid(booking.vehicleId) ? booking.vehicleId : null,
      start_time: booking.startTime,
      end_time: booking.endTime,
      initial_soc: booking.initialBatteryPercent,
      target_soc: booking.targetBatteryPercent,
      estimated_energy_kwh: booking.estimatedEnergyKwh,
      estimated_charging_time_minutes: this.parseDurationMinutes(booking.estimatedChargingTime),
      electricity_cost: booking.electricityCost,
      host_fee: booking.hostFee,
      platform_fee: booking.platformFee,
      total_cost: booking.totalCost,
      status: booking.status || "CONFIRMED",
      payment_method: booking.paymentMethod || "UPI",
    };

    const { data, error } = await this.client
      .from("bookings")
      .insert(payload)
      .select(`
        *,
        chargers (title, address, city, owner_id),
        vehicles (model)
      `)
      .single();

    if (error || !data) {
      console.error("Error creating booking in Supabase:", error);
      throw new Error(error?.message || "Failed to create booking");
    }

    return this.mapBookingRow(data);
  }

  async updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | null> {
    const { data, error } = await this.client
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(`
        *,
        chargers (title, address, city, owner_id),
        vehicles (model)
      `)
      .single();

    if (error || !data) {
      console.error("Error updating booking status in Supabase:", error);
      return null;
    }

    return this.mapBookingRow(data);
  }

  // --- REVIEWS ---
  async getReviews(chargerId?: string): Promise<Review[]> {
    try {
      let query = this.client.from("reviews").select(`
        *,
        profiles:user_id (full_name, avatar_url)
      `);

      if (chargerId) {
        query = query.eq("charger_id", chargerId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error || !data) {
        console.error("Supabase getReviews error:", error);
        return [];
      }

      return data.map((row: any) => ({
        reviewId: row.id,
        bookingId: row.booking_id,
        chargerId: row.charger_id,
        userId: row.user_id,
        userName: row.profiles?.full_name || "EV Driver",
        userAvatar: row.profiles?.avatar_url || "",
        rating: row.rating,
        comment: row.comment || "",
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.error("Error in getReviews:", err);
      return [];
    }
  }

  async createReview(review: Review): Promise<Review> {
    const payload = {
      booking_id: review.bookingId,
      charger_id: review.chargerId,
      user_id: review.userId,
      rating: review.rating,
      comment: review.comment,
    };

    const { data, error } = await this.client
      .from("reviews")
      .insert(payload)
      .select(`*, profiles:user_id (full_name, avatar_url)`)
      .single();

    if (error || !data) {
      console.error("Error creating review in Supabase:", error);
      throw new Error(error?.message || "Failed to create review");
    }

    // Refresh charger rating & review count
    const { data: allReviews } = await this.client
      .from("reviews")
      .select("rating")
      .eq("charger_id", review.chargerId);

    if (allReviews && allReviews.length > 0) {
      const avg = allReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / allReviews.length;
      await this.client
        .from("chargers")
        .update({
          rating: Number(avg.toFixed(1)),
          review_count: allReviews.length,
        })
        .eq("id", review.chargerId);
    }

    return {
      reviewId: data.id,
      bookingId: data.booking_id,
      chargerId: data.charger_id,
      userId: data.user_id,
      userName: data.profiles?.full_name || review.userName,
      userAvatar: data.profiles?.avatar_url || review.userAvatar,
      rating: data.rating,
      comment: data.comment,
      createdAt: data.created_at,
    };
  }

  // --- USERS / PROFILES ---
  async getUser(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await this.client
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) return undefined;

      return {
        userId: data.id,
        name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "BOTH",
        avatar: data.avatar_url || "",
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error("Error in getUser:", err);
      return undefined;
    }
  }

  // --- HELPER MAPPERS ---
  private mapChargerRow(row: any): Charger {
    const statusMap: Record<string, VerificationStatus> = {
      ACTIVE: "VERIFIED",
      AI_REVIEWED: "PENDING",
      PENDING_REVIEW: "PENDING",
      REJECTED: "REJECTED",
    };

    return {
      chargerId: row.id,
      ownerId: row.owner_id,
      hostName: row.profiles?.full_name || "Community Host",
      hostPhone: row.profiles?.phone || "",
      hostAvatar: row.profiles?.avatar_url || "",
      hostRating: Number(row.rating || 0),
      title: row.title,
      description: row.description || "",
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      address: row.address,
      city: row.city,
      state: row.state,
      chargerType: row.charger_type as any,
      powerKw: Number(row.power_kw),
      connectorType: row.connector_type as any,
      supportedVehicles: ["All Type 2 Compatible EVs"],
      electricityRate: Number(row.electricity_rate),
      hostFee: Number(row.host_fee),
      platformFee: Number(row.platform_fee),
      availability: row.verification_status === "ACTIVE" ? "AVAILABLE" : "UNAVAILABLE",
      availableFrom: row.availability_start?.slice(0, 5) || "19:00",
      availableUntil: row.availability_end?.slice(0, 5) || "08:00",
      images: Array.isArray(row.image_urls) ? row.image_urls : [],
      verificationStatus: statusMap[row.verification_status] || "PENDING",
      verificationScore: Number(row.verification_score || 0),
      verificationReason: row.verification_reason || "",
      rating: Number(row.rating || 0),
      reviewCount: Number(row.review_count || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapBookingRow(row: any): Booking {
    const durationMins = row.estimated_charging_time_minutes || 60;
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const formattedDuration = `${hours > 0 ? `${hours}h ` : ""}${mins}m`;

    return {
      bookingId: row.id,
      chargerId: row.charger_id,
      userId: row.user_id,
      vehicleId: row.vehicle_id || "",
      chargerTitle: row.chargers?.title || "Community Charger",
      chargerAddress: row.chargers?.address || "",
      chargerCity: row.chargers?.city || "",
      hostName: "Community Host",
      vehicleModel: row.vehicles?.model || "EV",
      startTime: row.start_time,
      endTime: row.end_time,
      initialBatteryPercent: Number(row.initial_soc),
      targetBatteryPercent: Number(row.target_soc),
      estimatedEnergyKwh: Number(row.estimated_energy_kwh),
      estimatedChargingTime: formattedDuration,
      electricityCost: Number(row.electricity_cost),
      hostFee: Number(row.host_fee),
      platformFee: Number(row.platform_fee),
      totalCost: Number(row.total_cost),
      status: row.status,
      createdAt: row.created_at,
      paymentMethod: row.payment_method || "UPI",
    };
  }

  private mapToDbVerificationStatus(status: VerificationStatus): string {
    if (status === "VERIFIED") return "ACTIVE";
    if (status === "REJECTED") return "REJECTED";
    return "PENDING_REVIEW";
  }

  private parseDurationMinutes(durationStr?: string): number {
    if (!durationStr) return 120;
    const hoursMatch = durationStr.match(/(\d+)\s*h/);
    const minsMatch = durationStr.match(/(\d+)\s*m/);
    const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
    const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    const total = hours * 60 + mins;
    return total > 0 ? total : 120;
  }
}
