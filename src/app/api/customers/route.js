import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/mongodb";
import { requireAuth } from "@/lib/auth";

export async function GET(request) {
  const user = await requireAuth(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 25;
    const sortBy = searchParams.get("sort") || "total_points";
    const sortOrder = searchParams.get("order") === "asc" ? 1 : -1;

    const { db } = await connectToDb();
    const col = db.collection("customers");

    let filter = {};
    if (search) {
      if (/^\d+$/.test(search)) {
        filter.phone = { $regex: search, $options: "i" };
      } else {
        filter.name = { $regex: search, $options: "i" };
      }
    }

    const total = await col.countDocuments(filter);
    const customers = await col
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const enriched = customers.map((c) => {
      const available = (c.total_points || 0) - (c.redeemed_points || 0);
      return {
        _id: c._id.toString(),
        name: c.name,
        phone: c.phone,
        contact_id: c.contact_id,
        total_sales: c.total_sales || 0,
        total_points: c.total_points || 0,
        redeemed_points: c.redeemed_points || 0,
        invoice_count: c.invoice_count || 0,
        available_points: available,
        redemption_value: ((c.total_sales || 0) * 0.01).toFixed(2),
      };
    });

    return NextResponse.json({
      customers: enriched,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
