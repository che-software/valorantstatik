# MongoDB Hata Ayıklama Kılavuzu

## Yapılan İyileştirmeler

### 1. Geliştirilmiş Loglama
Artık tüm MongoDB ve API işlemlerinde detaylı loglar görüntüleniyor:

- ✅ **API çağrıları**: Her oyuncu aramasında başarı/başarısızlık logları
- ✅ **DB işlemleri**: MongoDB'ye yazma/okuma işlemlerinin detaylı logları
- ✅ **Hata mesajları**: Hatanın tam sebebi ve stack trace'i konsola yazılıyor
- ✅ **Fallback mekanizması**: Cache ve DB fallback durumları loglarda görünüyor

### 2. MongoDB Bağlantı İyileştirmeleri

**lib/prisma.ts** dosyasında:
- Bağlantı testleri eklendi
- Error format "pretty" yapıldı
- Warn level loglama aktif edildi

### 3. Test Endpoint'i

**GET /api/test** endpoint'i artık şunları döndürüyor:
```json
{
  "ok": true,
  "timestamp": "2026-06-04T...",
  "mongodb": {
    "connected": true/false,
    "error": null | "hata mesajı"
  },
  "env": {
    "hasDatabaseUrl": true,
    "databaseUrlPreview": "mongodb+srv://Codevra..."
  },
  "playerCount": 123
}
```

### 4. Test Script'i

MongoDB bağlantısını test etmek için:
```bash
npm run test:db
```

Bu script:
- ✅ MongoDB bağlantısını test eder
- ✅ Player sayısını gösterir
- ✅ Son eklenen 5 oyuncuyu listeler
- ✅ Büyük/küçük harf duyarsız arama testi yapar
- ✅ Tüm collection'ların istatistiklerini gösterir

## Sorun Giderme Adımları

### 1. MongoDB Bağlantısını Test Edin

Tarayıcınızda açın:
```
http://localhost:3000/api/test
```

veya:
```
https://kedipotter-tracker.vercel.app/api/test
```

**Beklenen sonuç:**
```json
{
  "mongodb": {
    "connected": true,
    "error": null
  }
}
```

### 2. Logları İnceleyin

Development server'ı çalıştırın:
```bash
npm run dev
```

Sonra bir oyuncu arayın ve konsolda şu logları kontrol edin:

✅ **Başarılı durum:**
```
[ApiGateway] Hesap bulundu: PlayerName#TAG, Region: eu, PUUID: xxx
[ApiGateway] DB'ye kaydediliyor: PlayerName#TAG, ELO: 1000
[ApiGateway] DB'ye başarıyla kaydedildi: PlayerName#TAG
```

❌ **Hata durumu:**
```
[ApiGateway] Deneme 1/3 başarısız - PlayerName#TAG, Status: 404
[ApiGateway] DB fallback için aranıyor: PlayerName#TAG
[ApiGateway] DB'de bulunamadı: PlayerName#TAG
```

### 3. Yaygın Hatalar ve Çözümleri

#### Hata: "Oyuncu bulunamadı"
**Sebep:** Riot ID format hatası veya oyuncu gerçekten yok
**Çözüm:**
- Nick#TAG formatının doğru olduğundan emin olun
- Büyük/küçük harf önemli değil ama özel karakterler sorun olabilir
- HenrikDev API'sinde oyuncunun gerçekten var olduğunu kontrol edin

#### Hata: "MongoDB bağlantısı başarısız"
**Sebep:** DATABASE_URL yanlış veya MongoDB cluster'ı erişilebilir değil
**Çözüm:**
1. `.env.local` dosyasında `DATABASE_URL` kontrol edin
2. MongoDB Atlas'ta IP whitelist kontrolü yapın (0.0.0.0/0 olmalı)
3. Kullanıcı adı ve şifrenin doğru olduğundan emin olun

#### Hata: "DB upsert başarısız"
**Sebep:** Schema uyumsuzluğu veya MongoDB yazma hatası
**Çözüm:**
```bash
npx prisma generate
npx prisma db push
```

### 4. MongoDB Atlas Kontrol Listesi

MongoDB Atlas dashboard'da kontrol edin:

- [ ] Cluster aktif mi?
- [ ] Database "valorant-tracker" var mı?
- [ ] Network Access -> 0.0.0.0/0 (Allow access from anywhere)
- [ ] Database Access -> Kullanıcı aktif mi?
- [ ] Collections -> Player collection'ı var mı?

### 5. Belirli Bir Oyuncuyu Test Etme

Console'da:
```javascript
// Browser console'da test
fetch('/api/player/PlayerName/TAG')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## İletişim

Eğer sorun devam ederse:
1. `/api/test` endpoint'inin çıktısını kaydedin
2. Console loglarını kaydedin
3. Hangi oyuncu ID'leriyle sorun yaşandığını not alın

## Ek Notlar

- **Cache süresi**: Profil bilgileri 5 dakika cache'lenir
- **Rate limiting**: HenrikDev API dakikada 60 istek limitlidir
- **Fallback sırası**: Cache → API → Stale Cache → Database
- **Büyük/küçük harf**: MongoDB aramaları case-insensitive'dir
