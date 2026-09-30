import { AIProvider } from "./provider";
import {
  AIChargePilotRequest,
  AIChargePilotRecommendation,
  AIVerificationResult,
  AISmartPricingSuggestion,
  NaturalSearchFilter,
  Charger,
  Vehicle,
} from "@/types";
import { calculateForVehicleAndCharger } from "@/lib/charging/calculator";

export class MockAIProvider implements AIProvider {
  name = "VoltLoop Mock Bedrock Engine";

  isAvailable(): boolean {
    return true;
  }

  async chargepilot(
    request: AIChargePilotRequest,
    vehicle: Vehicle,
    candidateChargers: Charger[]
  ): Promise<AIChargePilotRecommendation> {
    // If no candidates exist, pick from general chargers
    const pool = candidateChargers.length > 0 ? candidateChargers : [];

    // Score candidates based on:
    // 1. Power compatibility (7.2kW or 11kW optimal for overnight)
    // 2. Rating & host reliability
    // 3. Price & availability
    const scored = pool.map((charger) => {
      const calc = calculateForVehicleAndCharger(
        vehicle,
        charger,
        request.currentBatteryPercent,
        request.targetBatteryPercent
      );

      let score = 50;
      // Rating weight
      score += charger.rating * 8;
      // Verification bonus
      if (charger.verificationStatus === "VERIFIED") score += 15;
      // Available tonight bonus
      if (charger.availableTonight) score += 20;
      // Price penalty if exceeding budget
      if (request.maxBudget && calc.totalCost > request.maxBudget) {
        score -= 25;
      }
      // Power bonus (ideal overnight is ~4-6 hours)
      if (calc.estimatedHours >= 3.5 && calc.estimatedHours <= 7.0) {
        score += 15;
      }

      return { charger, calc, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const winner = scored[0] ?? {
      charger: pool[0],
      calc: calculateForVehicleAndCharger(vehicle, pool[0], request.currentBatteryPercent, request.targetBatteryPercent),
      score: 80,
    };

    const alternatives = scored.slice(1, 3).map((s) => s.charger);

    const deltaSoc = request.targetBatteryPercent - request.currentBatteryPercent;
    const addedRange = Math.round(((vehicle.batteryCapacityKwh * deltaSoc) / 100) * 6.5);
    const remainingKm = Math.round(
      ((vehicle.batteryCapacityKwh * request.currentBatteryPercent) / 100) * 6.5
    );

    const promptQuery = request.naturalQuery || `${request.origin || "Origin"} to ${request.destination || "Destination"}`;

    return {
      recommendedCharger: winner.charger,
      alternativeChargers: alternatives,
      calculation: {
        energyRequiredKwh: winner.calc.energyRequiredKwh,
        effectivePowerKw: winner.calc.effectivePowerKw,
        estimatedChargingMinutes: winner.calc.estimatedMinutes,
        estimatedDurationFormatted: winner.calc.formattedDuration,
        electricityCost: winner.calc.electricityCost,
        hostFee: winner.calc.hostFee,
        platformFee: winner.calc.platformFee,
        totalPrice: winner.calc.totalCost,
      },
      explanation: {
        title: `Recommended for ${vehicle.brand} ${vehicle.model}`,
        whyThisOption: `For your trip matching "${promptQuery}", ${winner.charger.title} provides the optimal balance of distance, dependable overnight AC speed (${winner.charger.powerKw} kW), transparent tariff (₹${winner.calc.totalCost} total), and a top host rating of ${winner.charger.rating}★.`,
        keyHighlights: [
          `Compatible Type 2 port with continuous ${winner.calc.effectivePowerKw} kW throughput`,
          `Overnight session completes in ~${winner.calc.formattedDuration}, leaving the car ready by departure`,
          `Cost-effective community rate: ₹${winner.charger.electricityRate}/kWh + ₹${winner.charger.hostFee} host fee`,
          `Verified private driveway with safe access and verified host reviews`,
        ],
      },
      tripFeasibility: {
        isFeasible: remainingKm > 20,
        remainingRangeKmBeforeCharge: remainingKm,
        estimatedRangeAddedKm: addedRange,
        recommendationNote:
          remainingKm <= 25
            ? "⚠️ Battery is relatively low. Head directly to the charger upon arrival."
            : "✓ Route is feasible with comfortable remaining reserve.",
      },
    };
  }

  async verifyCharger(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _imageDataOrUrl: string,
    claimedSpecs: {
      powerKw: number;
      connectorType: string;
      chargerType: string;
      title: string;
    }
  ): Promise<AIVerificationResult> {
    // Simulate computer vision recognition with high confidence
    const isHighPower = claimedSpecs.powerKw >= 7;
    const connector = claimedSpecs.connectorType || "Type 2";

    return {
      chargerDetected: true,
      cableDetected: true,
      connectorDetected: connector,
      possibleBrand: isHighPower ? "ABB / Delta Terra AC" : "Standard AC Wallbox",
      installationVisible: true,
      confidence: 0.94,
      issues: [],
      summary: `Image analysis confirms a professionally mounted ${claimedSpecs.chargerType || "AC"} unit with visible heavy-duty tethered cable and undamaged ${connector} receptacle.`,
      isAiAssistedNotice:
        "AI-assisted verification detected compatible EV wallbox hardware. Human community admin review required for final marketplace badge.",
    };
  }

  async parseNaturalSearch(query: string): Promise<NaturalSearchFilter> {
    const lower = query.toLowerCase();
    const result: NaturalSearchFilter = {
      parsedSummary: query,
    };

    // Detect power
    if (lower.includes("22 kw") || lower.includes("22kw")) {
      result.powerKw = 22;
    } else if (lower.includes("11 kw") || lower.includes("11kw")) {
      result.powerKw = 11;
    } else if (lower.includes("7 kw") || lower.includes("7kw") || lower.includes("7.2")) {
      result.powerKw = 7.2;
    } else if (lower.includes("3.3 kw") || lower.includes("3kw") || lower.includes("16a")) {
      result.powerKw = 3.3;
    }

    // Detect location keywords
    const cities = ["pune", "satara", "kolhapur", "mumbai", "nagpur", "bhubaneswar", "karad", "shirwal", "lonavala", "hadapsar", "baner", "kothrud"];
    for (const city of cities) {
      if (lower.includes(city)) {
        result.location = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }

    // Detect budget / price
    const priceMatch = query.match(/(?:under|below|max|within|₹|\b)\s*(\d{2,4})\b/i);
    if (priceMatch && Number(priceMatch[1]) >= 100 && Number(priceMatch[1]) <= 2000) {
      result.maxPrice = Number(priceMatch[1]);
    }

    // Detect availability
    if (lower.includes("tonight") || lower.includes("now") || lower.includes("available")) {
      result.availableTonight = true;
    }

    // Detect connector
    if (lower.includes("type 2") || lower.includes("type2")) {
      result.connectorType = "Type 2";
    } else if (lower.includes("16a") || lower.includes("3 pin")) {
      result.connectorType = "16A 3-Pin";
    }

    return result;
  }

  async suggestSmartPricing(
    charger: Partial<Charger>,
    nearbyAverageRate: number
  ): Promise<AISmartPricingSuggestion> {
    const power = charger.powerKw ?? 7.2;
    let suggestedHostFee = 35;

    if (power >= 22) suggestedHostFee = 50;
    else if (power >= 11) suggestedHostFee = 40;
    else if (power <= 3.3) suggestedHostFee = 25;

    return {
      suggestedHostFee,
      currentMarketAverage: nearbyAverageRate || 35,
      reason: `Based on your ${power} kW charger rating and nearby host fees averaging ₹${nearbyAverageRate || 35}, a ₹${suggestedHostFee} host infrastructure fee keeps your listing competitive while yielding ₹150–₹220 profit per overnight charge.`,
      confidence: 0.92,
    };
  }
}
