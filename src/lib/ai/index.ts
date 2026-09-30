import { AIProvider } from "./provider";
import { GeminiAIProvider } from "./gemini";
import { BedrockAIProvider } from "./bedrock";
import { MockAIProvider } from "./mock";
import {
  AIChargePilotRequest,
  AIChargePilotRecommendation,
  AIVerificationResult,
  AISmartPricingSuggestion,
  NaturalSearchFilter,
  Charger,
  Vehicle,
} from "@/types";
import { AWS_CONFIG } from "@/lib/aws/config";

let providerInstance: AIProvider | null = null;

const HAS_GEMINI = Boolean(
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY
);

export interface AIStatusInfo {
  provider: "Google Gemini" | "Amazon Bedrock" | "Mock / Demo";
  model: string;
  status: "Connected" | "Demo Mode";
  fallback: "Enabled" | "Active";
  configured: boolean;
  region: string;
}

export function getAIStatus(): AIStatusInfo {
  const isMockExplicit = process.env.AI_PROVIDER === "mock";

  if (!isMockExplicit && HAS_GEMINI) {
    return {
      provider: "Google Gemini",
      model: "gemini-flash-latest",
      status: "Connected",
      fallback: "Enabled",
      configured: true,
      region: "global",
    };
  }

  const hasBedrock = !isMockExplicit && AWS_CONFIG.isAwsConfigured;
  return {
    provider: hasBedrock ? "Amazon Bedrock" : "Mock / Demo",
    model: hasBedrock ? AWS_CONFIG.bedrock.modelId : "gemini-flash-latest",
    status: hasBedrock ? "Connected" : "Demo Mode",
    fallback: hasBedrock ? "Enabled" : "Active",
    configured: hasBedrock,
    region: AWS_CONFIG.region,
  };
}

export function getAIProvider(): AIProvider {
  if (!providerInstance) {
    if (process.env.AI_PROVIDER === "mock") {
      providerInstance = new MockAIProvider();
    } else if (HAS_GEMINI) {
      providerInstance = new GeminiAIProvider();
    } else if (AWS_CONFIG.isAwsConfigured) {
      providerInstance = new BedrockAIProvider();
    } else {
      providerInstance = new MockAIProvider();
    }
  }
  return providerInstance;
}

export async function runChargePilot(
  request: AIChargePilotRequest,
  vehicle: Vehicle,
  candidateChargers: Charger[]
): Promise<AIChargePilotRecommendation> {
  const provider = getAIProvider();
  return provider.chargepilot(request, vehicle, candidateChargers);
}

export async function runChargerVerification(
  imageDataOrUrl: string,
  claimedSpecs: {
    powerKw: number;
    connectorType: string;
    chargerType: string;
    title: string;
  }
): Promise<AIVerificationResult> {
  const provider = getAIProvider();
  return provider.verifyCharger(imageDataOrUrl, claimedSpecs);
}

export async function runNaturalSearch(query: string): Promise<NaturalSearchFilter> {
  const provider = getAIProvider();
  return provider.parseNaturalSearch(query);
}

export async function runSmartPricing(
  charger: Partial<Charger>,
  nearbyAverageRate: number = 35
): Promise<AISmartPricingSuggestion> {
  const provider = getAIProvider();
  return provider.suggestSmartPricing(charger, nearbyAverageRate);
}

export { GeminiAIProvider, BedrockAIProvider, MockAIProvider };
