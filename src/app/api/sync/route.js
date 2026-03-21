import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/mongodb";
import { fetchAllInvoices } from "@/lib/zoho";
import { calculatePoints, EXCLUDED_CUSTOMERS } from "@/lib/points";

export const maxDuration = 60;

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isCron) {
    const cookie = request.headers.get("cookie") || "";
    if (!cookie.includes("auth_token=")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const { db } = await connectToDb();
    const customersCol = db.collection("customers");
    const invoicesCol = db.collection("invoices");
    const syncCol = db.collection("sync_log");

    await invoicesCol.createIndex({ invoice_id: 1 }, { unique: true }).catch(() => {});

    // Only fetch yesterday's data
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    let invoices;
    try {
      invoices = await fetchAllInvoices(dateStr, dateStr);
    } catch (zohoErr) {
      await syncCol.insertOne({
        status: "error",
        error: zohoErr.message,
        sync_date: dateStr,
        timestamp: new Date(),
      });
      return NextResponse.json({ error: `Zoho API: ${zohoErr.message}` }, { status: 502 });
    }

    let newInvoices = 0;
    let skipped = 0;

    for (const inv of invoices) {
      const invoiceId = inv.invoice_id;
      const customerName = inv.customer_name || "";
      const customerId = (inv.customer_id || "").toString();
      const total = parseFloat(inv.total) || 0;
      const phone = inv.mobile || inv.phone || "";

      if (EXCLUDED_CUSTOMERS.includes(customerName)) { skipped++; continue; }

      const exists = await invoicesCol.findOne({ invoice_id: invoiceId });
      if (exists) { skipped++; continue; }

      const points = calculatePoints(total);

      await customersCol.updateOne(
        { contact_id: customerId },
        {
          $set: {
            name: customerName,
            phone: phone || undefined,
            updated_at: new Date(),
          },
          $inc: {
            total_sales: total,
            total_points: points,
            invoice_count: 1,
          },
          $setOnInsert: {
            contact_id: customerId,
            redeemed_points: 0,
            created_at: new Date(),
          },
        },
        { upsert: true }
      );

      await invoicesCol.insertOne({
        invoice_id: invoiceId,
        invoice_number: inv.invoice_number,
        contact_id: customerId,
        customer_name: customerName,
        total,
        points,
        invoice_date: inv.date,
        processed_at: new Date(),
      });

      newInvoices++;
    }

    await syncCol.insertOne({
      status: "success",
      sync_date: dateStr,
      total_fetched: invoices.length,
      new_invoices: newInvoices,
      skipped,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      syncDate: dateStr,
      totalFetched: invoices.length,
      newInvoices,
      skipped,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
