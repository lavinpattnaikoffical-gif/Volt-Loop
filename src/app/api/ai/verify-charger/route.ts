import { NextResponse } from "next/server";
import { runChargerVerification } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const imageUrl = body.imageUrl || "mock-charger-image.jpg";
    const claimedSpecs = {
      powerKw: Number(body.powerKw || 7.2),
      connectorType: body.connectorType || "Type 2",
      chargerType: body.chargerType || "7.2 kW AC",
      title: body.title || "Community Charger",
    };

    const verification = await runChargerVerification(imageUrl, claimedSpecs);

    return NextResponse.json({
      success: true,
      data: verification,
      engine: "VoltLoop AI Vision Pipeline",
    });
  } catch (error) {
    console.error("AI Verification error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform AI charger verification" },
      { status: 500 }
    );
  }
}
