export type UserRole = "TRAVELER" | "HOST" | "BOTH" | "ADMIN";

export interface User {
  userId: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  avatar?: string;
  rating?: number;
}

export type ConnectorType = "Type 2" | "Type 1" | "16A 3-Pin" | "GB/T" | "CCS2";

export interface Vehicle {
  vehicleId: string;
  userId: string;
  brand: string;
  model: string;
  batteryCapacityKwh: number;
  connectorType: ConnectorType;
  maxAcChargingKw: number;
  currentBatteryPercent: number;
  targetBatteryPercent: number;
  rangeKm?: number;
  image?: string;
}

export type ChargerPowerType = "3.3 kW AC" | "7.2 kW AC" | "11 kW AC" | "22 kW AC";
export type ChargerAvailability = "AVAILABLE" | "LIMITED" | "UNAVAILABLE" | "BOOKED";
export type VerificationStatus = "VERIFIED" | "PENDING" | "REJECTED";

export interface Charger {
  chargerId: string;
  ownerId: string;
  hostName: string;
  hostPhone?: string;
  hostAvatar?: string;
  hostRating: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;

  chargerType: ChargerPowerType;
  powerKw: number;
  connectorType: ConnectorType;
  supportedVehicles: string[];

  electricityRate: number; // ₹ per kWh
  hostFee: number;         // ₹ per session
  platformFee: number;     // ₹ per session

  availability: ChargerAvailability;
  availableFrom: string;   // e.g. "20:00"
  availableUntil: string;  // e.g. "08:00"
  availableTonight?: boolean;

  estimatedChargingTime?: string;
  images: string[];
  videoUrl?: string;

  verificationStatus: VerificationStatus;
  verificationScore: number; // 0 to 1 (e.g. 0.94)
  verificationReason: string;

  rating: number;
  reviewCount: number;
  amenities?: string[]; // e.g. "Restroom", "WiFi", "Gated Security", "Overnight Parking"
  distanceKm?: number;  // dynamically computed relative to search

  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Booking {
  bookingId: string;
  chargerId: string;
  userId: string;
  vehicleId: string;
  chargerTitle: string;
  chargerAddress: string;
  chargerCity: string;
  hostName: string;
  vehicleModel: string;

  startTime: string; // ISO date-time or formatted string
  endTime: string;

  initialBatteryPercent: number;
  targetBatteryPercent: number;
  estimatedEnergyKwh: number;
  estimatedChargingTime: string;

  electricityCost: number;
  hostFee: number;
  platformFee: number;
  totalCost: number;

  status: BookingStatus;
  createdAt: string;
  paymentMethod?: string;
}

export interface Review {
  reviewId: string;
  bookingId?: string;
  chargerId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  vehicleModel?: string;
  createdAt: string;
}

// AI Specific Interfaces
export interface AIVerificationResult {
  chargerDetected: boolean;
  cableDetected: boolean;
  connectorDetected: string;
  possibleBrand: string;
  installationVisible: boolean;
  confidence: number;
  issues: string[];
  summary: string;
  isAiAssistedNotice: string;
}

export interface AIChargePilotRequest {
  origin?: string;
  destination?: string;
  naturalQuery?: string;
  vehicleId: string;
  currentBatteryPercent: number;
  targetBatteryPercent: number;
  maxBudget?: number;
  arrivalTime?: string;
  departureTime?: string;
  userLatitude?: number;
  userLongitude?: number;
}

export interface AIChargePilotRecommendation {
  recommendedCharger: Charger;
  alternativeChargers: Charger[];
  calculation: {
    energyRequiredKwh: number;
    effectivePowerKw: number;
    estimatedChargingMinutes: number;
    estimatedDurationFormatted: string;
    electricityCost: number;
    hostFee: number;
    platformFee: number;
    totalPrice: number;
  };
  explanation: {
    title: string;
    whyThisOption: string;
    keyHighlights: string[];
  };
  tripFeasibility: {
    isFeasible: boolean;
    remainingRangeKmBeforeCharge: number;
    estimatedRangeAddedKm: number;
    recommendationNote: string;
  };
}

export interface AISmartPricingSuggestion {
  suggestedHostFee: number;
  currentMarketAverage: number;
  reason: string;
  confidence: number;
}

export interface NaturalSearchFilter {
  powerKw?: number;
  location?: string;
  availableTonight?: boolean;
  maxPrice?: number;
  connectorType?: ConnectorType;
  parsedSummary?: string;
}
