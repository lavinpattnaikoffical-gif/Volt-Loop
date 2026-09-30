import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// Haversine distance formula in kilometers
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "18.5204");
    const lng = parseFloat(searchParams.get("lng") || "73.8567");
    const maxDistanceKm = parseFloat(searchParams.get("radiusKm") || "50");

    const all = await dbService.getChargers();

    const withDistance = all
      .map((c) => ({
        ...c,
        distanceKm: getDistanceKm(lat, lng, c.latitude, c.longitude),
      }))
      .filter((c) => c.distanceKm <= maxDistanceKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return NextResponse.json({
      success: true,
      count: withDistance.length,
      chargers: withDistance,
    });
  } catch (error) {
    console.error("Error in nearby chargers:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate nearby chargers" },
      { status: 500 }
    );
  }
}
