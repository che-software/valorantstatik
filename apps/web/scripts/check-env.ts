// Hangi DATABASE_URL kullanıldığını kontrol et
import dotenv from "dotenv";
import path from "path";

console.log("=== Environment Değişkenleri Kontrolü ===\n");

// .env.local yükle
const envLocalPath = path.join(process.cwd(), ".env.local");
const envLocal = dotenv.config({ path: envLocalPath });
console.log("1. .env.local:");
if (envLocal.parsed?.DATABASE_URL) {
  const url = envLocal.parsed.DATABASE_URL;
  console.log(`   ✅ Bulundu: ${url.substring(0, 40)}...`);
  console.log(`   Kullanıcı: ${url.match(/\/\/([^:]+):/)?.[1] || 'bulunamadı'}`);
  console.log(`   Cluster: ${url.match(/@([^/]+)/)?.[1] || 'bulunamadı'}`);
} else {
  console.log("   ❌ DATABASE_URL bulunamadı");
}

// .env yükle
const envPath = path.join(process.cwd(), ".env");
const env = dotenv.config({ path: envPath });
console.log("\n2. .env:");
if (env.parsed?.DATABASE_URL) {
  const url = env.parsed.DATABASE_URL;
  console.log(`   ✅ Bulundu: ${url.substring(0, 40)}...`);
  console.log(`   Kullanıcı: ${url.match(/\/\/([^:]+):/)?.[1] || 'bulunamadı'}`);
  console.log(`   Cluster: ${url.match(/@([^/]+)/)?.[1] || 'bulunamadı'}`);
} else {
  console.log("   ❌ DATABASE_URL bulunamadı");
}

// Process env'den oku
console.log("\n3. Process.env (Runtime):");
if (process.env.DATABASE_URL) {
  const url = process.env.DATABASE_URL;
  console.log(`   ✅ Bulundu: ${url.substring(0, 40)}...`);
  console.log(`   Kullanıcı: ${url.match(/\/\/([^:]+):/)?.[1] || 'bulunamadı'}`);
  console.log(`   Cluster: ${url.match(/@([^/]+)/)?.[1] || 'bulunamadı'}`);
} else {
  console.log("   ❌ DATABASE_URL bulunamadı");
}

console.log("\n=== Öneri ===");
console.log("MongoDB Atlas'ta şu kontrollerı yapın:");
console.log("1. Database Access -> Kullanıcı adı ve şifrenin doğru olduğundan emin olun");
console.log("2. Network Access -> IP whitelist'e 0.0.0.0/0 eklenmiş olmalı");
console.log("3. Her iki cluster'ı da test edin (codevra.39ivkjs ve cluster0.bbp6d2f)");
