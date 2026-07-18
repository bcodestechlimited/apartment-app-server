import { env } from "@/config/env.config";
import { MongoClient, Db, Collection } from "mongodb";

const SOURCE_URI = env.SOURCE_URI as string;
const DESTINATION_URI = env.DESTINATION_URI as string;

// Optionally, make these environment variables if you prefer:
// const SOURCE_URI = process.env.SOURCE_DB_URI!;
// const DESTINATION_URI = process.env.DEST_DB_URI!;

async function cloneDatabase(): Promise<void> {
  const sourceClient = new MongoClient(SOURCE_URI);
  const destinationClient = new MongoClient(DESTINATION_URI);

  try {
    await sourceClient.connect();
    await destinationClient.connect();

    const sourceDb: Db = sourceClient.db("Haven-Lease-Staging");
    const destinationDb: Db = destinationClient.db("Haven-Lease-Staging");

    console.log("✅ Connected to both source and destination databases");

    // List all collections from source DB
    const collections = await sourceDb.listCollections().toArray();
    console.log(`📦 Found ${collections.length} collections`);

    for (const { name } of collections) {
      console.log(`➡️ Copying collection: ${name}`);

      const sourceCollection: Collection = sourceDb.collection(name);
      const destinationCollection: Collection = destinationDb.collection(name);

      const docs = await sourceCollection.find({}).toArray();

      if (docs.length === 0) {
        console.log(`⚠️ Skipped ${name} (no documents)`);
        continue;
      }

      // Optional: clear existing data in destination
      await destinationCollection.deleteMany({});
      await destinationCollection.insertMany(docs);

      console.log(`✅ Copied ${docs.length} documents from ${name}`);
    }

    console.log("🎉 Database cloned successfully!");
  } catch (error) {
    console.error("❌ Error during cloning:", error);
  } finally {
    await sourceClient.close();
    await destinationClient.close();
    console.log("🔒 Connections closed");
  }
}

// Run the script
cloneDatabase().catch((err) => console.error("Unexpected error:", err));
