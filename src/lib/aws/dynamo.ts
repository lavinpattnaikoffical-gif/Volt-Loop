import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { AWS_CONFIG } from "./config";
import { Charger, Vehicle, User, Booking, Review } from "@/types";
import { DatabaseService } from "@/lib/db";
import { db as memoryDb } from "@/lib/db/mock-db";

let docClient: DynamoDBDocumentClient | null = null;

function getDocClient() {
  if (!docClient && AWS_CONFIG.isAwsConfigured) {
    const rawClient = new DynamoDBClient({
      region: AWS_CONFIG.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }
  return docClient;
}

export class DynamoDbService implements DatabaseService {
  private fallback = memoryDb;

  async getChargers(): Promise<Charger[]> {
    const client = getDocClient();
    if (!client) return this.fallback.getChargers();

    try {
      const result = await client.send(
        new ScanCommand({
          TableName: AWS_CONFIG.dynamoDb.chargersTable,
        })
      );
      if (result.Items && result.Items.length > 0) {
        return result.Items as Charger[];
      }
      return this.fallback.getChargers();
    } catch (err) {
      console.warn("DynamoDB getChargers scan failed, falling back to local store:", err);
      return this.fallback.getChargers();
    }
  }

  async getChargerById(id: string): Promise<Charger | undefined> {
    const client = getDocClient();
    if (!client) return this.fallback.getChargerById(id);

    try {
      const result = await client.send(
        new GetCommand({
          TableName: AWS_CONFIG.dynamoDb.chargersTable,
          Key: { chargerId: id },
        })
      );
      if (result.Item) {
        return result.Item as Charger;
      }
      return this.fallback.getChargerById(id);
    } catch (err) {
      console.warn("DynamoDB getChargerById failed, falling back:", err);
      return this.fallback.getChargerById(id);
    }
  }

  async createCharger(charger: Charger): Promise<Charger> {
    // Always persist to local fallback first so demo never breaks
    await this.fallback.createCharger(charger);

    const client = getDocClient();
    if (client) {
      try {
        await client.send(
          new PutCommand({
            TableName: AWS_CONFIG.dynamoDb.chargersTable,
            Item: charger,
          })
        );
      } catch (err) {
        console.warn("DynamoDB createCharger failed:", err);
      }
    }
    return charger;
  }

  async updateCharger(id: string, updates: Partial<Charger>): Promise<Charger | null> {
    await this.fallback.updateCharger(id, updates);

    const client = getDocClient();
    if (client) {
      try {
        const existing = await this.getChargerById(id);
        if (existing) {
          const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
          await client.send(
            new PutCommand({
              TableName: AWS_CONFIG.dynamoDb.chargersTable,
              Item: updated,
            })
          );
          return updated;
        }
      } catch (err) {
        console.warn("DynamoDB updateCharger failed:", err);
      }
    }
    return this.fallback.getChargerById(id).then((c) => c || null);
  }

  async getVehicles(userId?: string): Promise<Vehicle[]> {
    return this.fallback.getVehicles(userId);
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    return this.fallback.getVehicleById(id);
  }

  async createVehicle(vehicle: Vehicle): Promise<Vehicle> {
    return this.fallback.createVehicle(vehicle);
  }

  async deleteVehicle(id: string): Promise<boolean> {
    return this.fallback.deleteVehicle(id);
  }

  async getBookings(userId?: string): Promise<Booking[]> {
    const client = getDocClient();
    if (!client) return this.fallback.getBookings(userId);

    try {
      const result = await client.send(
        new ScanCommand({
          TableName: AWS_CONFIG.dynamoDb.bookingsTable,
        })
      );
      if (result.Items && result.Items.length > 0) {
        const all = result.Items as Booking[];
        if (userId) {
          return all.filter((b) => b.userId === userId);
        }
        return all;
      }
      return this.fallback.getBookings(userId);
    } catch (err) {
      console.warn("DynamoDB getBookings failed, falling back:", err);
      return this.fallback.getBookings(userId);
    }
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const client = getDocClient();
    if (!client) return this.fallback.getBookingById(id);

    try {
      const result = await client.send(
        new GetCommand({
          TableName: AWS_CONFIG.dynamoDb.bookingsTable,
          Key: { bookingId: id },
        })
      );
      if (result.Item) {
        return result.Item as Booking;
      }
      return this.fallback.getBookingById(id);
    } catch (err) {
      console.warn("DynamoDB getBookingById failed, falling back:", err);
      return this.fallback.getBookingById(id);
    }
  }

  async createBooking(booking: Booking): Promise<Booking> {
    await this.fallback.createBooking(booking);

    const client = getDocClient();
    if (client) {
      try {
        await client.send(
          new PutCommand({
            TableName: AWS_CONFIG.dynamoDb.bookingsTable,
            Item: booking,
          })
        );
      } catch (err) {
        console.warn("DynamoDB createBooking failed:", err);
      }
    }
    return booking;
  }

  async updateBookingStatus(id: string, status: Booking["status"]): Promise<Booking | null> {
    await this.fallback.updateBookingStatus(id, status);

    const client = getDocClient();
    if (client) {
      try {
        await client.send(
          new UpdateCommand({
            TableName: AWS_CONFIG.dynamoDb.bookingsTable,
            Key: { bookingId: id },
            UpdateExpression: "set #st = :status",
            ExpressionAttributeNames: { "#st": "status" },
            ExpressionAttributeValues: { ":status": status },
          })
        );
      } catch (err) {
        console.warn("DynamoDB updateBookingStatus failed:", err);
      }
    }
    return this.fallback.getBookingById(id).then((b) => b || null);
  }

  async getReviews(chargerId?: string): Promise<Review[]> {
    return this.fallback.getReviews(chargerId);
  }

  async createReview(review: Review): Promise<Review> {
    return this.fallback.createReview(review);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.fallback.getUser(id);
  }
}
