// MongoDB connection string'i test et
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

// .env.local'i yükle
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function testConnection() {
  const uri = process.env.DATABASE_URL;
  
  if (!uri) {
    console.error("❌ DATABASE_URL bulunamadı!");
    return;
  }

  console.log("=== MongoDB Bağlantı Testi ===\n");
  console.log("Connection String:", uri.replace(/:[^:@]+@/, ":****@"));
  
  // Kullanıcı adını ve cluster'ı göster
  const userMatch = uri.match(/\/\/([^:]+):/);
  const clusterMatch = uri.match(/@([^/]+)/);
  const dbMatch = uri.match(/\.net\/([^?]+)/);
  
  console.log("\nBağlantı Detayları:");
  console.log("  Kullanıcı:", userMatch?.[1] || "bulunamadı");
  console.log("  Cluster:", clusterMatch?.[1] || "bulunamadı");
  console.log("  Database:", dbMatch?.[1] || "bulunamadı");
  console.log("");

  const client = new MongoClient(uri);

  try {
    console.log("Bağlanılıyor...");
    await client.connect();
    console.log("✅ Bağlantı başarılı!\n");

    // Admin komutunu test et
    const admin = client.db().admin();
    const serverInfo = await admin.serverInfo();
    console.log("MongoDB Sunucu Bilgisi:");
    console.log("  Versiyon:", serverInfo.version);
    console.log("");

    // Database listesi
    const databases = await admin.listDatabases();
    console.log("Veritabanları:");
    databases.databases.forEach((db: { name: string; sizeOnDisk?: number }) => {
      const size = db.sizeOnDisk ? (db.sizeOnDisk / 1024 / 1024).toFixed(2) : "0";
      console.log(`  - ${db.name} (${size} MB)`);
    });
    console.log("");

    // valorant-tracker database'ine bak
    const db = client.db("valorant-tracker");
    const collections = await db.listCollections().toArray();
    console.log("valorant-tracker Collections:");
    if (collections.length === 0) {
      console.log("  ⚠️ Hiç collection yok (henüz veri eklenmemiş)");
    } else {
      for (const coll of collections) {
        const count = await db.collection(coll.name).countDocuments();
        console.log(`  - ${coll.name}: ${count} belge`);
      }
    }
    console.log("");

    // Test insert
    console.log("Test yazma işlemi yapılıyor...");
    const testCollection = db.collection("_connection_test");
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log("✅ Yazma başarılı!");
    
    // Test okuması
    const doc = await testCollection.findOne({ test: true });
    console.log("✅ Okuma başarılı!");
    
    // Temizle
    await testCollection.deleteMany({ test: true });
    console.log("✅ Silme başarılı!");

    console.log("\n=== TÜM TESTLER BAŞARILI ===");
  } catch (error) {
    console.error("\n❌ BAĞLANTI HATASI:");
    if (error instanceof Error) {
      console.error("Hata mesajı:", error.message);
      
      if (error.message.includes("authentication failed")) {
        console.error("\n🔑 ÖNERİ: Kullanıcı adı veya şifre yanlış!");
        console.error("MongoDB Atlas'ta:");
        console.error("1. Database Access menüsüne gidin");
        console.error("2. Kullanıcıyı silin ve yeniden oluşturun");
        console.error("3. Şifreyi kopyalayın ve .env.local'e yapıştırın");
        console.error("\n⚠️ Özel karakter varsa URL encode edin:");
        console.error("   @ → %40");
        console.error("   ! → %21");
        console.error("   # → %23");
        console.error("   $ → %24");
      }
      
      if (error.message.includes("ENOTFOUND") || error.message.includes("ETIMEDOUT")) {
        console.error("\n🌐 ÖNERİ: Network sorunu!");
        console.error("1. İnternet bağlantınızı kontrol edin");
        console.error("2. MongoDB Atlas Network Access'te IP'nizi kontrol edin");
        console.error("3. Firewall ayarlarınızı kontrol edin");
      }
    }
  } finally {
    await client.close();
  }
}

testConnection().catch(console.error);
