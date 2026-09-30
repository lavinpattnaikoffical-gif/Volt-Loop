import { NextResponse } from "next/server";
import { dbService } from "@/lib/db";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const booking = await dbService.getBookingById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Error fetching booking by ID:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await dbService.updateBookingStatus(id, body.status);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Error updating booking:", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}
