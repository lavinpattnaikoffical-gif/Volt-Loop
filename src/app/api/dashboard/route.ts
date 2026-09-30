import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({
        success: true,
        user: null,
        vehicles: [],
        driver: {
          upcomingBookings: [],
          pastBookings: [],
          totalChargingSessions: 0,
          totalEnergyConsumedKwh: 0,
        },
        host: {
          chargers: [],
          earnings: 0,
          sessionsCount: 0,
          utilizationPercent: 0,
          averageRating: 0,
          incomingBookings: [],
        },
      });
    }

    const [userProfile, allChargers, allBookings, vehicles] = await Promise.all([
      dbService.getUser(userId),
      dbService.getChargers(),
      dbService.getBookings(),
      dbService.getVehicles(userId),
    ]);

    // Host analytics - purely real records
    const hostChargers = allChargers.filter((c) => c.ownerId === userId);
    const hostBookings = allBookings.filter((b) =>
      hostChargers.some((hc) => hc.chargerId === b.chargerId)
    );

    const completedHostBookings = hostBookings.filter((b) => b.status === "COMPLETED");
    const hostEarnings = completedHostBookings.reduce(
      (sum, b) => sum + (b.totalCost - b.platformFee),
      0
    );

    const hostSessions = hostBookings.length;
    const avgRating =
      hostChargers.length > 0
        ? Number(
            (
              hostChargers.reduce((sum, c) => sum + (c.rating || 0), 0) /
              hostChargers.length
            ).toFixed(1)
          )
        : 0;

    // Driver analytics - purely real records
    const userBookings = allBookings.filter((b) => b.userId === userId);
    const upcomingBookings = userBookings.filter(
      (b) => b.status === "CONFIRMED" || b.status === "ACTIVE" || b.status === "PENDING"
    );
    const pastBookings = userBookings.filter(
      (b) => b.status === "COMPLETED" || b.status === "CANCELLED"
    );
    const totalEnergyConsumedKwh = userBookings.reduce(
      (sum, b) => sum + (b.estimatedEnergyKwh || 0),
      0
    );

    return NextResponse.json({
      success: true,
      user: userProfile
        ? {
            userId: userProfile.userId,
            name: userProfile.name,
            email: userProfile.email,
            phone: userProfile.phone,
            role: userProfile.role,
          }
        : {
            userId,
            name: "Community Member",
            email: "",
            phone: "",
            role: "BOTH",
          },
      vehicles,
      driver: {
        upcomingBookings,
        pastBookings,
        totalChargingSessions: userBookings.length,
        totalEnergyConsumedKwh,
      },
      host: {
        chargers: hostChargers,
        earnings: hostEarnings,
        sessionsCount: hostSessions,
        utilizationPercent: hostChargers.length > 0 ? Math.min(100, hostSessions * 10) : 0,
        averageRating: avgRating,
        incomingBookings: hostBookings,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
