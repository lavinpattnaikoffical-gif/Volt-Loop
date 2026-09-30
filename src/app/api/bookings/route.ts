import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { calculateChargingMetrics } from "@/lib/charging/calculator";
import { Booking } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const bookings = await dbService.getBookings(userId);
    return NextResponse.json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.chargerId || !body.vehicleId) {
      return NextResponse.json(
        { success: false, error: "Missing chargerId or vehicleId" },
        { status: 400 }
      );
    }

    const initialBatteryPercent = Number(body.initialBatteryPercent ?? 20);
    const targetBatteryPercent = Number(body.targetBatteryPercent ?? 85);

    // Validation (Section 20): Battery percentages
    if (isNaN(initialBatteryPercent) || initialBatteryPercent < 0 || initialBatteryPercent > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid initial battery percent (must be 0-100)" },
        { status: 400 }
      );
    }

    if (isNaN(targetBatteryPercent) || targetBatteryPercent < 0 || targetBatteryPercent > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid target battery percent (must be 0-100)" },
        { status: 400 }
      );
    }

    if (targetBatteryPercent <= initialBatteryPercent) {
      return NextResponse.json(
        { success: false, error: "Target battery percent must be greater than current battery percent" },
        { status: 400 }
      );
    }

    const charger = await dbService.getChargerById(body.chargerId);
    if (!charger) {
      return NextResponse.json({ success: false, error: "Charger not found" }, { status: 404 });
    }

    const vehicle = await dbService.getVehicleById(body.vehicleId);
    if (!vehicle) {
      return NextResponse.json({ success: false, error: "Vehicle not found" }, { status: 404 });
    }

    // Duplicate booking protection (Section 21)
    const startTimeStr = body.startTime || new Date(Date.now() + 3600000).toISOString();
    const endTimeStr = body.endTime || new Date(Date.now() + 28800000).toISOString();
    const reqStart = new Date(startTimeStr).getTime();
    const reqEnd = new Date(endTimeStr).getTime();

    const existingBookings = await dbService.getBookings();
    const hasOverlap = existingBookings.some((b) => {
      if (b.chargerId !== charger.chargerId) return false;
      if (b.status === "CANCELLED") return false;
      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();
      return Math.max(reqStart, bStart) < Math.min(reqEnd, bEnd);
    });

    if (hasOverlap) {
      return NextResponse.json(
        { success: false, error: "Charger unavailable for the selected time." },
        { status: 409 }
      );
    }

    // SERVER-SIDE DETERMINISTIC PRICING RECALCULATION (Section 7 & 8: Never trust client totals)
    const metrics = calculateChargingMetrics({
      batteryCapacityKwh: vehicle.batteryCapacityKwh,
      currentSocPercent: initialBatteryPercent,
      targetSocPercent: targetBatteryPercent,
      chargerPowerKw: charger.powerKw,
      vehicleMaxAcKw: vehicle.maxAcChargingKw,
      electricityRate: charger.electricityRate,
      hostFee: charger.hostFee,
      platformFee: charger.platformFee,
    });

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to create a booking" },
        { status: 401 }
      );
    }

    const bookingId = `VL-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newBooking: Booking = {
      bookingId,
      chargerId: charger.chargerId,
      userId: body.userId,
      vehicleId: vehicle.vehicleId,
      chargerTitle: charger.title,
      chargerAddress: charger.address,
      chargerCity: charger.city,
      hostName: charger.hostName,
      vehicleModel: `${vehicle.brand} ${vehicle.model}`,
      startTime: body.startTime || new Date(Date.now() + 3600000).toISOString(),
      endTime: body.endTime || new Date(Date.now() + 28800000).toISOString(),
      initialBatteryPercent,
      targetBatteryPercent,
      estimatedEnergyKwh: metrics.energyRequiredKwh,
      estimatedChargingTime: metrics.formattedDuration,
      electricityCost: metrics.electricityCost,
      hostFee: metrics.hostFee,
      platformFee: metrics.platformFee,
      totalCost: metrics.totalCost,
      status: "CONFIRMED",
      paymentMethod: body.paymentMethod || "UPI (Instant Community Pass)",
      createdAt: new Date().toISOString(),
    };

    const saved = await dbService.createBooking(newBooking);

    return NextResponse.json({ success: true, booking: saved }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({ success: false, error: "Failed to create booking" }, { status: 500 });
  }
}
