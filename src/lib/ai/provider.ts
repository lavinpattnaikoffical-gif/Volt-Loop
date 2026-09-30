import {
  AIChargePilotRequest,
  AIChargePilotRecommendation,
  AIVerificationResult,
  AISmartPricingSuggestion,
  NaturalSearchFilter,
  Charger,
  Vehicle,
} from "@/types";

export interface AIProvider {
  name: string;
  isAvailable(): boolean;

  chargepilot(
    request: AIChargePilotRequest,
    vehicle: Vehicle,
    candidateChargers: Charger[]
  ): Promise<AIChargePilotRecommendation>;

  verifyCharger(
    imageDataOrUrl: string,
    claimedSpecs: {
      powerKw: number;
      connectorType: string;
      chargerType: string;
      title: string;
    }
  ): Promise<AIVerificationResult>;

  parseNaturalSearch(query: string): Promise<NaturalSearchFilter>;

  suggestSmartPricing(
    charger: Partial<Charger>,
    nearbyAverageRate: number
  ): Promise<AISmartPricingSuggestion>;
}
