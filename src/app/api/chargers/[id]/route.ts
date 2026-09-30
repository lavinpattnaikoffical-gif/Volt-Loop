import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const charger = await dbService.getChargerById(id);
    if (!charger) {
      return NextResponse.json(
        { success: false, error: "Charger not found" },
        { status: 404 }
      );
    }
    const reviews = await dbService.getReviews(id);
    return NextResponse.json({ success: true, charger, reviews });
  } catch (error) {
    console.error("Error fetching charger by ID:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch charger" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updates = await request.json();
    if (updates.verificationStatus === "VERIFIED" || updates.verificationStatus === "ACTIVE") {
      updates.verificationStatus = "VERIFIED";
      updates.availability = "AVAILABLE";
    }
    const updated = await dbService.updateCharger(id, updates);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Charger not found to update" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, charger: updated });
  } catch (error) {
    console.error("Error updating charger:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update charger" },
      { status: 500 }
    );
  }
}
