# Triveni Supermart — Loyalty Points System v2

Admin dashboard for managing customer loyalty points. Reads directly from your existing MongoDB data.

## How It Works

- **Earning**: 1 point per ₹1 spent
- **Redemption**: 100 points = ₹1 discount (1% cashback)
- **Data**: Customer data already in MongoDB (imported separately)
- **Sync**: Daily Zoho POS sync at 6:00 AM IST for new invoices
- **No Excel upload needed** — reads from `customers` collection directly

## MongoDB Schema (existing)

### customers collection
```json
{
  "_id": "ObjectId",
  "phone": "6204266646",
  "contact_id": "1551100000002439175",
  "name": "Customer Name",
  "total_sales": 199817.34,
  "total_points": 1998,
  "redeemed_points": 0,
  "invoice_count": 1560,
  "created_at": "Date",
  "updated_at": "Date"
}
```

### invoices collection (populated by daily sync)
```json
{
  "invoice_id": "from Zoho",
  "invoice_number": "INV-001",
  "contact_id": "customer's contact_id",
  "customer_name": "Name",
  "total": 500.00,
  "points": 500,
  "invoice_date": "2025-03-19",
  "processed_at": "Date"
}
```

### redemptions collection (created when admin redeems)
```json
{
  "customer_id": "MongoDB _id string",
  "contact_id": "Zoho contact_id",
  "customer_name": "Name",
  "customer_phone": "Phone",
  "points": 1000,
  "rupee_value": 10.00,
  "note": "optional note",
  "redeemed_by": "admin",
  "redeemed_at": "Date"
}
```

## Environment Variables

| Variable | Value |
|----------|-------|
| MONGODB_URI | your MongoDB connection string |
| MONGODB_DB | triveni_loyalty |
| ZOHO_CLIENT_ID | 1000.CZA8VGV0ORIDPR7I3VKZ1VUQYY161V |
| ZOHO_CLIENT_SECRET | your secret |
| ZOHO_REFRESH_TOKEN | generate from api-console.zoho.in |
| ZOHO_ORG_ID | 60029757013 |
| ADMIN_USERNAME | admin |
| ADMIN_PASSWORD | admin123 |
| JWT_SECRET | any random string |
| CRON_SECRET | any random string |

## Deploy

1. Push to GitHub
2. Import in Vercel
3. Add env variables
4. Deploy
5. Login with admin / admin123
