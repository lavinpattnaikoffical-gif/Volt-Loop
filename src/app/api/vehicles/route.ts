import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { Vehicle } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || undefined;
    const vehicles = await dbService.getVehicles(userId);
    return NextResponse.json({ success: true, count: vehicles.length, vehicles });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.userId || !body.brand || !body.model || !body.batteryCapacityKwh) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (userId, brand, model, batteryCapacityKwh)" },
        { status: 400 }
      );
    }

    const batteryCapacityKwh = Number(body.batteryCapacityKwh);
    const maxAcChargingKw = Number(body.maxAcChargingKw || 7.2);

    if (isNaN(batteryCapacityKwh) || batteryCapacityKwh <= 0) {
      return NextResponse.json(
        { success: false, error: "Battery capacity must be a positive number" },
        { status: 400 }
      );
    }

    const newVehicle: Vehicle = {
      vehicleId: body.vehicleId || `veh-${Date.now().toString(36)}`,
      userId: body.userId,
      brand: body.brand.trim(),
      model: body.model.trim(),
      batteryCapacityKwh,
      connectorType: body.connectorType || "Type 2",
      maxAcChargingKw,
      currentBatteryPercent: Number(body.currentBatteryPercent || 20),
      targetBatteryPercent: Number(body.targetBatteryPercent || 80),
    };

    const saved = await dbService.createVehicle(newVehicle);
    return NextResponse.json({ success: true, vehicle: saved }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create vehicle" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing vehicle id" }, { status: 400 });
    }

    const deleted = await dbService.deleteVehicle(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete vehicle" },
      { status: 500 }
    );
  }
}
