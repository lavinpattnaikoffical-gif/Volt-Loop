import { NextResponse } from "next/server";
import { runNaturalSearch } from "@/lib/ai";
import { dbService } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query string is required" },
        { status: 400 }
      );
    }

    // 1. AI parses natural language query into structured criteria
    const filters = await runNaturalSearch(query);

    // 2. Query real database using parsed filters (never invent chargers!)
    let chargers = (await dbService.getChargers()).filter(
      (c) => c.verificationStatus === "VERIFIED"
    );

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      chargers = chargers.filter(
        (c) =>
          c.city.toLowerCase().includes(loc) ||
          c.state.toLowerCase().includes(loc) ||
          c.address.toLowerCase().includes(loc) ||
          c.title.toLowerCase().includes(loc)
      );
    }

    if (filters.powerKw) {
      chargers = chargers.filter(
        (c) => Math.abs(c.powerKw - filters.powerKw!) <= 1.0 || c.powerKw >= filters.powerKw!
      );
    }

    if (filters.connectorType) {
      chargers = chargers.filter((c) => c.connectorType === filters.connectorType);
    }

    if (filters.availableTonight) {
      chargers = chargers.filter((c) => c.availableTonight && c.availability === "AVAILABLE");
    }

    if (filters.maxPrice) {
      // Calculate realistic total for an average 25 kWh session
      chargers = chargers.filter((c) => {
        const estTotal = c.electricityRate * 22 + c.hostFee + c.platformFee;
        return estTotal <= filters.maxPrice! || c.hostFee <= filters.maxPrice!;
      });
    }

    return NextResponse.json({
      success: true,
      query,
      filters,
      count: chargers.length,
      chargers,
    });
  } catch (error) {
    console.error("Natural search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse natural query" },
      { status: 500 }
    );
  }
}
