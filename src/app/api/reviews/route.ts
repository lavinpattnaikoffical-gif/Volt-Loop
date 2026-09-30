import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { Review } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.chargerId || !body.rating || !body.comment) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (chargerId, rating, comment)" },
        { status: 400 }
      );
    }

    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to review a charger" },
        { status: 401 }
      );
    }

    // Allow review only after booking is COMPLETED (Requirement 12)
    if (body.bookingId) {
      const booking = await dbService.getBookingById(body.bookingId);
      if (booking && booking.status !== "COMPLETED") {
        return NextResponse.json(
          { success: false, error: "Reviews can only be submitted after a charging session is completed" },
          { status: 400 }
        );
      }
    }

    // Get real user profile if available
    const userProfile = await dbService.getUser(body.userId);

    const newReview: Review = {
      reviewId: `rev-${Date.now().toString(36)}`,
      bookingId: body.bookingId,
      chargerId: body.chargerId,
      userId: body.userId,
      userName: userProfile?.name || body.userName || "EV Driver",
      userAvatar: userProfile?.avatar || body.userAvatar || "",
      rating: Math.min(5, Math.max(1, Number(body.rating))),
      comment: body.comment,
      vehicleModel: body.vehicleModel || "EV",
      createdAt: new Date().toISOString(),
    };

    const saved = await dbService.createReview(newReview);
    return NextResponse.json({ success: true, review: saved }, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ success: false, error: "Failed to create review" }, { status: 500 });
  }
}
