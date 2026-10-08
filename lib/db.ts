import dns from "node:dns";
import { MongoClient, ObjectId } from "mongodb";

// Configure DNS for MongoDB Atlas SRV lookup on Windows networks
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
  if (typeof (dns as any).setDefaultResultOrder === "function") {
    (dns as any).setDefaultResultOrder("ipv4first");
  }
} catch {}

const g = globalThis as unknown as {
  _mongoClient?: MongoClient;
  _mongoPromise?: Promise<MongoClient>;
  _indexesCreated?: boolean;
};

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI as string;
  if (!g._mongoPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 30,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });
    g._mongoPromise = client.connect().catch((err) => {
      g._mongoPromise = undefined; // Reset on failure so subsequent requests retry
      throw err;
    });
  }
  return g._mongoPromise;
}

export async function db() {
  const c = await getClientPromise();
  const database = c.db();

  if (!g._indexesCreated) {
    g._indexesCreated = true;
    database.collection("users").createIndex({ email: 1 }, { unique: true }).catch(() => {});
    database.collection("sessions").createIndex({ tokenHash: 1, expiresAt: 1 }).catch(() => {});
    database.collection("vehicles").createIndex({ userId: 1, createdAt: 1 }).catch(() => {});
    database.collection("fuelEntries").createIndex({ userId: 1, vehicleId: 1, entryAt: -1 }).catch(() => {});
    database.collection("fuelEntries").createIndex({ userId: 1, entryAt: -1 }).catch(() => {});
    database.collection("fuelEntries").createIndex({ vehicleId: 1, userId: 1, entryAt: -1 }).catch(() => {});
  }

  return database;
}

export function oid(id: string) {
  return ObjectId.isValid(id) && id.length === 24 ? new ObjectId(id) : null;
}

export { ObjectId };
