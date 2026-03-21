import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { db } = await connectToDb();

    const [stats] = await db.collection("customers").aggregate([
      {
        $group: {
          _id: null,
          total_customers: { $sum: 1 },
          total_sales: { $sum: "$total_sales" },
          total_points: { $sum: "$total_points" },
          total_redeemed: { $sum: "$redeemed_points" },
          total_invoices: { $sum: "$invoice_count" },
          avg_sales: { $avg: "$total_sales" },
        },
      },
    ]).toArray();

    const topCustomers = await db.collection("customers")
      .find()
      .sort({ total_sales: -1 })
      .limit(10)
      .toArray();

    const recentRedemptions = await db.collection("redemptions")
      .find()
      .sort({ redeemed_at: -1 })
      .limit(10)
      .toArray();

    const syncLog = await db.collection("sync_log")
      .find()
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    const available = (stats?.total_points || 0) - (stats?.total_redeemed || 0);

    return NextResponse.json({
      overview: {
        total_customers: stats?.total_customers || 0,
        total_sales: stats?.total_sales || 0,
        total_points: stats?.total_points || 0,
        total_redeemed: stats?.total_redeemed || 0,
        available_points: available,
        redemption_value: ((stats?.total_sales || 0) * 0.01).toFixed(2),
        total_invoices: stats?.total_invoices || 0,
        avg_sales: (stats?.avg_sales || 0).toFixed(2),
      },
      top_customers: topCustomers.map((c) => ({
        ...c,
        _id: c._id.toString(),
        available_points: (c.total_points || 0) - (c.redeemed_points || 0),
      })),
      recent_redemptions: recentRedemptions.map((r) => ({ ...r, _id: r._id.toString() })),
      recent_syncs: syncLog.map((s) => ({ ...s, _id: s._id.toString() })),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
