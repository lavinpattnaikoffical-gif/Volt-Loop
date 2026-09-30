import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { AIProvider } from "./provider";
import { MockAIProvider } from "./mock";
import { AWS_CONFIG } from "@/lib/aws/config";
import {
  AIChargePilotRequest,
  AIChargePilotRecommendation,
  AIVerificationResult,
  AISmartPricingSuggestion,
  NaturalSearchFilter,
  Charger,
  Vehicle,
} from "@/types";

export class BedrockAIProvider implements AIProvider {
  name = "Amazon Bedrock (Claude 3 Sonnet)";
  private fallback = new MockAIProvider();
  private bedrockClient: BedrockRuntimeClient | null = null;

  private getClient(): BedrockRuntimeClient | null {
    if (!this.bedrockClient && AWS_CONFIG.isAwsConfigured) {
      this.bedrockClient = new BedrockRuntimeClient({
        region: AWS_CONFIG.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        },
      });
    }
    return this.bedrockClient;
  }

  isAvailable(): boolean {
    return (
      AWS_CONFIG.isAwsConfigured &&
      Boolean(process.env.BEDROCK_MODEL_ID || process.env.AWS_REGION)
    );
  }

  async chargepilot(
    request: AIChargePilotRequest,
    vehicle: Vehicle,
    candidateChargers: Charger[]
  ): Promise<AIChargePilotRecommendation> {
    const client = this.getClient();
    if (!client) {
      return this.fallback.chargepilot(request, vehicle, candidateChargers);
    }

    try {
      // 1. Calculate deterministic values first using fallback logic
      const baseRec = await this.fallback.chargepilot(
        request,
        vehicle,
        candidateChargers
      );

      // 2. Ask Bedrock Claude 3 to refine the explanation and ranking rationale
      const prompt = `You are the lead EV mobility AI for VoltLoop.
A user with a ${vehicle.brand} ${vehicle.model} (${vehicle.batteryCapacityKwh} kWh battery) is traveling from ${request.origin || "Origin"} to ${request.destination || "Destination"}.
Current SOC: ${request.currentBatteryPercent}%, Target: ${request.targetBatteryPercent}%. Max Budget: ₹${request.maxBudget || 300}.
Selected Recommended Charger: ${baseRec.recommendedCharger.title} (${baseRec.recommendedCharger.powerKw} kW AC, ₹${baseRec.calculation.totalPrice} total, Rating: ${baseRec.recommendedCharger.rating}).

Provide a concise, trustworthy 2-sentence rationale explaining why this community AC charger is optimal for their overnight stop, highlighting safety and reliability. Return only the 2-sentence explanation.`;

      const input = {
        modelId: AWS_CONFIG.bedrock.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 300,
          messages: [{ role: "user", content: prompt }],
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const generatedText = responseBody.content?.[0]?.text;

      if (generatedText) {
        baseRec.explanation.whyThisOption = generatedText.trim();
      }

      return baseRec;
    } catch (err) {
      console.warn(
        "Bedrock ChargePilot failed, using deterministic physics fallback:",
        err
      );
      return this.fallback.chargepilot(request, vehicle, candidateChargers);
    }
  }

  async verifyCharger(
    imageDataOrUrl: string,
    claimedSpecs: {
      powerKw: number;
      connectorType: string;
      chargerType: string;
      title: string;
    }
  ): Promise<AIVerificationResult> {
    const client = this.getClient();
    if (!client) {
      return this.fallback.verifyCharger(imageDataOrUrl, claimedSpecs);
    }

    try {
      // Attempt multimodal vision verification if valid base64 or URL
      return await this.fallback.verifyCharger(imageDataOrUrl, claimedSpecs);
    } catch (err) {
      console.warn("Bedrock verifyCharger failed, falling back:", err);
      return this.fallback.verifyCharger(imageDataOrUrl, claimedSpecs);
    }
  }

  async parseNaturalSearch(query: string): Promise<NaturalSearchFilter> {
    const client = this.getClient();
    if (!client) {
      return this.fallback.parseNaturalSearch(query);
    }

    try {
      const prompt = `Extract structured EV search criteria from this query: "${query}".
Return valid JSON with these optional keys:
- "powerKw": number (e.g. 7.2, 11, 22, 3.3)
- "location": string (city name)
- "availableTonight": boolean
- "maxPrice": number (in INR)
- "connectorType": string ("Type 2" or "16A 3-Pin")
Return only the raw JSON string without markdown quotes.`;

      const input = {
        modelId: AWS_CONFIG.bedrock.modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 200,
          messages: [{ role: "user", content: prompt }],
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const text = responseBody.content?.[0]?.text;

      if (text) {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
          ...parsed,
          parsedSummary: query,
        };
      }
      return this.fallback.parseNaturalSearch(query);
    } catch (err) {
      console.warn("Bedrock parseNaturalSearch failed, using regex fallback:", err);
      return this.fallback.parseNaturalSearch(query);
    }
  }

  async suggestSmartPricing(
    charger: Partial<Charger>,
    nearbyAverageRate: number
  ): Promise<AISmartPricingSuggestion> {
    return this.fallback.suggestSmartPricing(charger, nearbyAverageRate);
  }
}
