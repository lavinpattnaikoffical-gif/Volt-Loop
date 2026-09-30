import { NextResponse } from "next/server";
import { runSmartPricing } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const charger = body.charger || {};
    const nearbyAverage = Number(body.nearbyAverage || 35);

    const suggestion = await runSmartPricing(charger, nearbyAverage);

    return NextResponse.json({
      success: true,
      suggestion,
    });
  } catch (error) {
    console.error("Smart pricing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate smart pricing suggestion" },
      { status: 500 }
    );
  }
}
