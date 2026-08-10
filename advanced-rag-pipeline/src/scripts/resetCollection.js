import { QdrantClient } from "@qdrant/js-client-rest";
import { config } from "../../config/config.js";

const client = new QdrantClient({ url: config.QDRANT_URL });

async function reset() {
  try {
    await client.deleteCollection(config.QDRANT_COLLECTION);
    console.log("✅ Collection deleted");
  } catch (err) {
    console.log("Collection didn't exist or already deleted:", err.message);
  }
}

reset();