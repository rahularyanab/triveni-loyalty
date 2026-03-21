import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

export async function POST(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const pointsToRedeem = parseInt(body.points);
    const note = body.note || "";

    if (!pointsToRedeem || pointsToRedeem <= 0) {
      return NextResponse.json({ error: "Invalid points amount" }, { status: 400 });
    }

    const { db } = await connectToDb();
    const col = db.collection("customers");

    let filter;
    try { filter = { _id: new ObjectId(id) }; } catch { filter = { contact_id: id }; }

    const customer = await col.findOne(filter);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const available = (customer.total_points || 0) - (customer.redeemed_points || 0);
    if (pointsToRedeem > available) {
      return NextResponse.json(
        { error: `Insufficient points. Available: ${available}` },
        { status: 400 }
      );
    }

    // Rupee value of redeemed points: each point was earned from ₹4 of sales
    // So redeeming points = giving back 1% of the sales those points represent
    // points × 4 = original sales, 1% of that = points × 0.04
    const rupeeValue = parseFloat((pointsToRedeem * 0.04).toFixed(2));

    await db.collection("redemptions").insertOne({
      customer_id: customer._id.toString(),
      contact_id: customer.contact_id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      points: pointsToRedeem,
      rupee_value: rupeeValue,
      note,
      redeemed_by: user.username || "admin",
      redeemed_at: new Date(),
    });

    await col.updateOne(filter, {
      $inc: { redeemed_points: pointsToRedeem },
      $set: { updated_at: new Date() },
    });

    const updated = await col.findOne(filter);

    return NextResponse.json({
      success: true,
      customer: {
        _id: updated._id.toString(),
        name: updated.name,
        total_points: updated.total_points,
        redeemed_points: updated.redeemed_points,
        available_points: (updated.total_points || 0) - (updated.redeemed_points || 0),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
