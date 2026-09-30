import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { runChargePilot } from "@/lib/ai";
import { AIChargePilotRequest, Vehicle } from "@/types";

export async function POST(request: Request) {
  try {
    const body: AIChargePilotRequest = await request.json();

    // 1. Fetch real active chargers from database
    const allChargers = await dbService.getChargers();
    const activeChargers = allChargers.filter(
      (c) => c.verificationStatus === "VERIFIED"
    );

    // If no real chargers exist in the database, DO NOT invent fake chargers
    if (activeChargers.length === 0) {
      return NextResponse.json({
        success: false,
        noChargers: true,
        error: "No compatible community chargers are available yet.",
        message: "No community chargers are available yet. Be the first host in your area to list a charger.",
      });
    }

    // 2. Fetch or construct vehicle
    let vehicle: Vehicle | undefined;
    if (body.vehicleId) {
      vehicle = await dbService.getVehicleById(body.vehicleId);
    }

    if (!vehicle) {
      const allVehicles = await dbService.getVehicles();
      if (allVehicles.length > 0) {
        vehicle = allVehicles[0];
      } else {
        // Fallback default EV specification if user hasn't added a vehicle yet
        vehicle = {
          vehicleId: "temp-vehicle",
          userId: "guest",
          brand: "Electric",
          model: "Vehicle",
          batteryCapacityKwh: 40.5,
          connectorType: "Type 2",
          maxAcChargingKw: 7.2,
          currentBatteryPercent: body.currentBatteryPercent || 20,
          targetBatteryPercent: body.targetBatteryPercent || 85,
        };
      }
    }

    // 3. Filter real compatible candidates based on query or destination
    const queryText = (
      (body.destination || "") +
      " " +
      (body.naturalQuery || "")
    ).toLowerCase();

    let candidates = activeChargers;
    if (queryText.trim().length > 0) {
      const matched = activeChargers.filter(
        (c) =>
          queryText.includes(c.city.toLowerCase()) ||
          queryText.includes(c.state.toLowerCase()) ||
          c.title.toLowerCase().includes(queryText)
      );
      if (matched.length > 0) {
        candidates = matched;
      }
    }

    // 4. Run deterministic calculations + AI ranking
    const result = await runChargePilot(body, vehicle, candidates);

    return NextResponse.json({
      success: true,
      data: result,
      engine: "VoltLoop AI ChargePilot (Supabase Data • Bedrock / Deterministic)",
    });
  } catch (error) {
    console.error("ChargePilot error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process ChargePilot request" },
      { status: 500 }
    );
  }
}
