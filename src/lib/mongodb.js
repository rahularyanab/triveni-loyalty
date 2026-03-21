import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

export async function connectToDb() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "triveni_loyalty");
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}
