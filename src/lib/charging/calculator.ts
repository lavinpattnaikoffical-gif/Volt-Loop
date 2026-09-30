import { Vehicle, Charger } from "@/types";

export interface ChargingCalculationInput {
  batteryCapacityKwh: number;
  currentSocPercent: number;
  targetSocPercent: number;
  chargerPowerKw: number;
  vehicleMaxAcKw: number;
  electricityRate: number; // ₹ per kWh
  hostFee: number;
  platformFee: number;
  efficiency?: number;    // default 0.90
}

export interface ChargingCalculationResult {
  energyRequiredKwh: number;
  effectivePowerKw: number;
  estimatedHours: number;
  estimatedMinutes: number;
  formattedDuration: string;
  electricityCost: number;
  hostFee: number;
  platformFee: number;
  totalCost: number;
  estimatedRangeAddedKm: number;
  disclaimer: string;
}

/**
 * Deterministic engineering calculation for EV charging time & cost.
 * All calculations are transparent, non-hallucinative, and mathematically grounded.
 */
export function calculateChargingMetrics(
  input: ChargingCalculationInput
): ChargingCalculationResult {
  const efficiency = input.efficiency ?? 0.90;
  
  // Safe boundaries for SOC
  const currentSoc = Math.max(0, Math.min(100, input.currentSocPercent));
  const targetSoc = Math.max(currentSoc, Math.min(100, input.targetSocPercent));
  const deltaSoc = targetSoc - currentSoc;

  // Energy required in kWh
  const energyRequired = Number(
    ((input.batteryCapacityKwh * deltaSoc) / 100).toFixed(2)
  );

  // Effective charging power constrained by car AC onboard charger & charger output
  const effectivePower = Math.min(input.chargerPowerKw, input.vehicleMaxAcKw);

  // Time calculation with efficiency loss factor
  let totalHours = 0;
  if (effectivePower > 0 && energyRequired > 0) {
    totalHours = energyRequired / (effectivePower * efficiency);
  }

  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  let formattedDuration = `${hours}h ${minutes}m`;
  if (hours === 0 && minutes === 0) {
    formattedDuration = "< 5 min";
  } else if (hours === 0) {
    formattedDuration = `${minutes}m`;
  }

  // Cost calculations
  const electricityCost = Math.round(energyRequired * input.electricityRate);
  const hostFee = input.hostFee;
  const platformFee = input.platformFee;
  const totalCost = electricityCost + hostFee + platformFee;

  // Estimated range added (approx 6.5 km per kWh for modern Indian road conditions)
  const estimatedRangeAddedKm = Math.round(energyRequired * 6.5);

  return {
    energyRequiredKwh: energyRequired,
    effectivePowerKw: effectivePower,
    estimatedHours: totalHours,
    estimatedMinutes: Math.round(totalHours * 60),
    formattedDuration,
    electricityCost,
    hostFee,
    platformFee,
    totalCost,
    estimatedRangeAddedKm,
    disclaimer: "Estimated charging time based on 90% onboard AC conversion efficiency. Actual time may vary based on ambient temperature and battery thermal management.",
  };
}

/**
 * Convenience helper to calculate for given vehicle and charger
 */
export function calculateForVehicleAndCharger(
  vehicle: Vehicle,
  charger: Charger,
  currentSoc: number = vehicle.currentBatteryPercent,
  targetSoc: number = vehicle.targetBatteryPercent
): ChargingCalculationResult {
  return calculateChargingMetrics({
    batteryCapacityKwh: vehicle.batteryCapacityKwh,
    currentSocPercent: currentSoc,
    targetSocPercent: targetSoc,
    chargerPowerKw: charger.powerKw,
    vehicleMaxAcKw: vehicle.maxAcChargingKw,
    electricityRate: charger.electricityRate,
    hostFee: charger.hostFee,
    platformFee: charger.platformFee,
  });
}
