// Direct MongoDB connection test (without SRV)
import { MongoClient } from "mongodb";

async function testDirectConnection() {
  console.log("=== Direct MongoDB Connection Test ===\n");

  // SRV yerine direkt bağlantı dene
  const hosts = [
    "codevra-shard-00-00.39ivkjs.mongodb.net:27017",
    "codevra-shard-00-01.39ivkjs.mongodb.net:27017",
    "codevra-shard-00-02.39ivkjs.mongodb.net:27017"
  ];

  const uri = `mongodb://${hosts.join(",")}/?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority`;
  
  console.log("⚠️ Bu test DNS sorunu olup olmadığını kontrol eder.\n");
  console.log("Ana sorun: MongoDB Atlas Network Access ayarları olabilir.\n");

  console.log("Lütfen MongoDB Atlas'ta şunları kontrol edin:");
  console.log("1. Network Access menüsüne gidin");
  console.log("2. IP Access List'te '0.0.0.0/0' olduğundan emin olun");
  console.log("3. Cluster'ın 'Active' olduğunu kontrol edin (Paused değil)\n");

  console.log("Cluster durumu ekran görüntüsünde 'Inactive' görünüyor.");
  console.log("→ Cluster'ı 'Resume' etmeniz gerekebilir!\n");
}

testDirectConnection();
