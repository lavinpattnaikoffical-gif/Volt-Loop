import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { Charger } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location")?.toLowerCase();
    const powerKw = searchParams.get("powerKw");
    const connectorType = searchParams.get("connectorType");
    const availableTonight = searchParams.get("availableTonight");
    const maxPrice = searchParams.get("maxPrice");
    const vehicle = searchParams.get("vehicle");
    const includePending = searchParams.get("includePending") === "true";
    const ownerId = searchParams.get("ownerId");

    let chargers = await dbService.getChargers();

    // Only ACTIVE / VERIFIED chargers are publicly visible on explore marketplace,
    // unless requesting for a specific owner or from admin
    if (!includePending && !ownerId) {
      chargers = chargers.filter(
        (c) => c.verificationStatus === "VERIFIED"
      );
    } else if (ownerId) {
      chargers = chargers.filter((c) => c.ownerId === ownerId);
    }

    if (location) {
      chargers = chargers.filter(
        (c) =>
          c.city.toLowerCase().includes(location) ||
          c.state.toLowerCase().includes(location) ||
          c.address.toLowerCase().includes(location) ||
          c.title.toLowerCase().includes(location)
      );
    }

    if (powerKw) {
      const targetPower = parseFloat(powerKw);
      chargers = chargers.filter((c) => Math.abs(c.powerKw - targetPower) <= 1.5 || c.powerKw >= targetPower);
    }

    if (connectorType && connectorType !== "all") {
      chargers = chargers.filter((c) => c.connectorType === connectorType);
    }

    if (availableTonight === "true") {
      chargers = chargers.filter((c) => c.availableTonight && c.availability === "AVAILABLE");
    }

    if (maxPrice) {
      const budget = parseFloat(maxPrice);
      chargers = chargers.filter((c) => (c.electricityRate * 20 + c.hostFee + c.platformFee) <= budget || c.hostFee <= budget);
    }

    if (vehicle && vehicle !== "all") {
      chargers = chargers.filter(
        (c) =>
          c.supportedVehicles.some((v) => v.toLowerCase().includes(vehicle.toLowerCase())) ||
          c.supportedVehicles.length === 0
      );
    }

    return NextResponse.json({ success: true, count: chargers.length, chargers, data: chargers });
  } catch (error) {
    console.error("Error fetching chargers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch chargers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Server-side validation
    if (!body.title || !body.city || !body.powerKw) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (title, city, powerKw)" },
        { status: 400 }
      );
    }

    if (!body.ownerId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to list a charger" },
        { status: 401 }
      );
    }

    const powerKw = Number(body.powerKw);
    if (isNaN(powerKw) || powerKw <= 0) {
      return NextResponse.json(
        { success: false, error: "Power (kW) must be a positive number" },
        { status: 400 }
      );
    }

    const electricityRate = Number(body.electricityRate ?? 9.0);
    const hostFee = Number(body.hostFee ?? 35.0);
    if (electricityRate < 0 || hostFee < 0) {
      return NextResponse.json(
        { success: false, error: "Rates and fees cannot be negative" },
        { status: 400 }
      );
    }

    const newCharger: Charger = {
      chargerId: body.chargerId || `ch-${Date.now().toString(36)}`,
      ownerId: body.ownerId,
      hostName: body.hostName || "Community Host",
      hostPhone: body.hostPhone || "",
      hostRating: 0.0,
      title: body.title,
      description: body.description || "Community EV charging spot listed on VoltLoop.",
      latitude: Number(body.latitude) || 18.5204,
      longitude: Number(body.longitude) || 73.8567,
      address: body.address || "Community Location",
      city: body.city,
      state: body.state || "Maharashtra",
      chargerType: body.chargerType || "7.2 kW AC",
      powerKw,
      connectorType: body.connectorType || "Type 2",
      supportedVehicles: body.supportedVehicles || [
        "Tata Nexon EV",
        "MG ZS EV",
        "Mahindra XUV400",
        "Hyundai Ioniq 5",
      ],
      electricityRate,
      hostFee,
      platformFee: 12.0,
      availability: "UNAVAILABLE", // Initially unavailable until approved
      availableFrom: body.availableFrom || "19:00",
      availableUntil: body.availableUntil || "08:00",
      availableTonight: body.availableTonight ?? true,
      estimatedChargingTime: body.estimatedChargingTime || "4h 45m",
      images: Array.isArray(body.images) ? body.images : [],
      verificationStatus: "PENDING", // PENDING_REVIEW in DB
      verificationScore: Number(body.verificationScore) || 0,
      verificationReason: body.verificationReason || "Awaiting admin verification review",
      rating: 0.0,
      reviewCount: 0,
      amenities: body.amenities || ["Dedicated Bay", "Safe Access"],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await dbService.createCharger(newCharger);
    return NextResponse.json({ success: true, charger: saved }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating charger:", error);
    return NextResponse.json({ success: false, error: error?.message || "Failed to create charger" }, { status: 500 });
  }
}
