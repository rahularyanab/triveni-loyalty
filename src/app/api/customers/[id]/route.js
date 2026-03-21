import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

export async function GET(request, { params }) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const { db } = await connectToDb();

    let filter;
    try { filter = { _id: new ObjectId(id) }; } catch { filter = { contact_id: id }; }

    const customer = await db.collection("customers").findOne(filter);
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const redemptions = await db.collection("redemptions")
      .find({ customer_id: customer._id.toString() })
      .sort({ redeemed_at: -1 })
      .limit(50)
      .toArray();

    const invoices = await db.collection("invoices")
      .find({ contact_id: customer.contact_id })
      .sort({ invoice_date: -1 })
      .limit(20)
      .toArray();

    const available = (customer.total_points || 0) - (customer.redeemed_points || 0);

    return NextResponse.json({
      customer: {
        ...customer,
        _id: customer._id.toString(),
        available_points: available,
        redemption_value: ((customer.total_sales || 0) * 0.01).toFixed(2),
      },
      redemptions: redemptions.map((r) => ({ ...r, _id: r._id.toString() })),
      invoices: invoices.map((inv) => ({ ...inv, _id: inv._id.toString() })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
