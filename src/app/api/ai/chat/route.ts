import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { Vehicle } from "@/types";
import { getAIProvider, GeminiAIProvider } from "@/lib/ai";

const FALLBACK_EV: Vehicle = {
  vehicleId: "veh-default",
  userId: "demo",
  brand: "Tata",
  model: "Nexon EV (40.5 kWh)",
  batteryCapacityKwh: 40.5,
  connectorType: "Type 2",
  maxAcChargingKw: 7.2,
  currentBatteryPercent: 20,
  targetBatteryPercent: 85,
};

export async function POST(request: Request) {
  try {
    const { message, vehicleId } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    const lower = message.toLowerCase();
    let vehicle = vehicleId ? await dbService.getVehicleById(vehicleId) : undefined;
    if (!vehicle) {
      vehicle = FALLBACK_EV;
    }

    // Try live Google Gemini AI first
    try {
      const provider = getAIProvider();
      if (provider instanceof GeminiAIProvider) {
        const aiResponse = await provider.chat(message, vehicle);
        if (aiResponse.reply) {
          return NextResponse.json({
            success: true,
            reply: aiResponse.reply,
            suggestedAction: aiResponse.suggestedAction,
          });
        }
      }
    } catch (err) {
      console.warn("Live Gemini chat failed, falling back to EV knowledge base:", err);
    }

    let reply = "";
    let suggestedAction: string | undefined = undefined;

    if (lower.includes("dc") || lower.includes("fast charger") || lower.includes("difference") || lower.includes("ac vs dc")) {
      reply = `Commercial DC fast chargers (50–120 kW) pump high-voltage direct current directly into the pack, which stresses battery chemistry and costs ₹20–₹25/kWh. \n\nVoltLoop community chargers use your vehicle's onboard AC converter (3.3 kW to 7.2 kW), providing gentle, overnight replenishment that maximizes battery longevity at a fraction of the cost (~₹8–₹12/kWh electricity + modest host fee). For overnight stops, AC charging is cheaper, safer, and ready when you wake up.`;
      suggestedAction = "Explore 7.2 kW Community Chargers";
    } else if (lower.includes("degrade") || lower.includes("battery health") || lower.includes("harm") || lower.includes("safe")) {
      reply = `Slow AC charging (3.3 kW – 11 kW) is actually the gentlest method for EV battery packs. Because the vehicle's onboard Battery Management System (BMS) controls the current and temperature without thermal spikes, regular overnight AC charging causes virtually zero premature degradation compared to frequent DC fast charging.`;
    } else if (lower.includes("rain") || lower.includes("water") || lower.includes("weather") || lower.includes("outdoor")) {
      reply = `All verified VoltLoop chargers and cables are IP65/IP66 weather-sealed and IEC 62196 compliant. They feature automatic ground-fault detection and will not energize until a secure handshake is locked between the gun and your EV inlet. Charging in rain or fog is 100% safe.`;
    } else if (lower.includes("emergency") || lower.includes("low battery") || lower.includes("critical") || lower.includes("stranded")) {
      reply = `If your battery is critically low (< 15%), switch to our 🚨 Emergency SOS Mode immediately! It deterministically scans for the nearest compatible host with instant driveway access, bypassing long queues.`;
      suggestedAction = "Switch to Emergency SOS Mode";
    } else if (lower.includes("nexon") || lower.includes("punch") || lower.includes("mg") || lower.includes("vehicle") || lower.includes("car")) {
      reply = `Your ${vehicle.brand} ${vehicle.model} has a ${vehicle.batteryCapacityKwh} kWh battery and accepts up to ${vehicle.maxAcChargingKw} kW AC. On a standard 7.2 kW community charger, a 20% to 85% charge takes approximately ${Math.round((vehicle.batteryCapacityKwh * 0.65) / vehicle.maxAcChargingKw)}h ${Math.round((((vehicle.batteryCapacityKwh * 0.65) / vehicle.maxAcChargingKw) % 1) * 60)}m, delivering about ${Math.round(vehicle.batteryCapacityKwh * 0.65 * 6.5)} km of real-world highway range.`;
    } else if (lower.includes("cost") || lower.includes("price") || lower.includes("rate") || lower.includes("rupee") || lower.includes("₹")) {
      reply = `VoltLoop uses transparent three-part billing: 1) Actual DISCOM electricity tariff (e.g. ₹9/kWh), 2) Host private driveway access fee (e.g. ₹35/session), and 3) A minimal platform fee (₹12). An overnight 25 kWh session typically costs around ₹220–₹240, saving you over ₹400 compared to commercial highway stations.`;
    } else if (lower.includes("host") || lower.includes("not home") || lower.includes("late") || lower.includes("access")) {
      reply = `Most VoltLoop hosts offer self-service driveway access with RFID or QR-activated AC wallboxes. Once your booking is confirmed, you receive host gate instructions, Wi-Fi access details, and emergency contact phone numbers. Hosts are notified upon your arrival.`;
    } else {
      reply = `Based on your ${vehicle.brand} ${vehicle.model} (${vehicle.batteryCapacityKwh} kWh), I recommend planning an overnight 7.2 kW AC stop. Community AC chargers deliver smooth replenishment without peak highway lines, giving you ~${Math.round(vehicle.batteryCapacityKwh * 6.2)} km total range by morning. Would you like me to synthesize the best route chargers?`;
      suggestedAction = "Run AI ChargePilot";
    }

    return NextResponse.json({
      success: true,
      reply,
      suggestedAction,
    });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
