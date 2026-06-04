// MongoDB connection string'i test et — Google DNS ile
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import dns from "dns";

// Google & Cloudflare DNS kullan (sistem DNS'ini bypass et)
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// .env.local'i yükle
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testConnection() {
  const uri = process.env.DATABASE_URL?.replace(/^"|"$/g, "");

  if (!uri) {
    console.error("❌ DATABASE_URL bulunamadı!");
    return;
  }

  console.log("=== MongoDB Bağlantı Testi ===\n");
  console.log("Connection String:", uri.replace(/:[^:@]+@/, ":****@"));

  const userMatch    = uri.match(/\/\/([^:]+):/);
  const clusterMatch = uri.match(/@([^/?]+)/);
  const dbMatch      = uri.match(/\.net\/([^?]+)/);

  console.log("\nBağlantı Detayları:");
  console.log("  Kullanıcı:", userMatch?.[1]    || "bulunamadı");
  console.log("  Cluster:",   clusterMatch?.[1]  || "bulunamadı");
  console.log("  Database:",  dbMatch?.[1]       || "bulunamadı");
  console.log("");

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS:         10000,
  });

  try {
    console.log("Bağlanılıyor...");
    await client.connect();
    console.log("✅ Bağlantı başarılı!\n");

    const admin      = client.db().admin();
    const serverInfo = await admin.serverInfo();
    console.log("MongoDB Versiyon:", serverInfo.version);

    const db          = client.db("valorant-tracker");
    const collections = await db.listCollections().toArray();

    console.log("\nvalroant-tracker Collections:");
    if (collections.length === 0) {
      console.log("  ⚠️ Henüz collection yok (ilk kurulum)");
    } else {
      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`  - ${coll.name}: ${count} belge`);
      }
    }

    // Write test
    console.log("\nYazma testi...");
    const testColl = db.collection("_test");
    await testColl.insertOne({ test: true, ts: new Date() });
    await testColl.deleteMany({ test: true });
    console.log("✅ Yazma/silme başarılı!\n");

    console.log("=== TÜM TESTLER BAŞARILI ✅ ===");
  } catch (error) {
    console.error("\n❌ BAĞLANTI HATASI:");
    if (error instanceof Error) {
      console.error("Hata:", error.message);
    }
  } finally {
    await client.close();
  }
}

testConnection().catch(console.error);
