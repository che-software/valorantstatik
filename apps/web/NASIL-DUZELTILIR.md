# 🔧 MongoDB Bağlantısını Düzeltme Kılavuzu

## Şu anda yapmanız gereken:

### 1. MongoDB Atlas'tan Kullanıcı Bilgilerini Alın

1. **MongoDB Atlas'a gidin:** https://cloud.mongodb.com
2. Sol menüden **"Database Access"** tıklayın
3. Orada bir kullanıcı göreceksiniz (örn: `codevra`, `admin`, `myuser`)
4. **Kullanıcı adını** not alın

### 2. Şifreyi Alın veya Yenileyin

**Şifrenizi biliyorsanız:**
- Direkt kullanın

**Şifrenizi unuttuysanız:**
1. Kullanıcının yanındaki **"Edit"** butonuna tıklayın
2. **"Edit Password"** seçin
3. **"Autogenerate Secure Password"** tıklayın
4. 📋 **Şifreyi kopyalayın** (bir daha gösterilmeyecek!)
5. **"Update User"** tıklayın

### 3. .env.local Dosyasını Düzenleyin

VS Code'da `.env.local` dosyasını açın:

Şu satırı bulun:
```env
DATABASE_URL="mongodb+srv://<db_username>:<db_password>@codevra.39ivkjs.mongodb.net/valorant-tracker?retryWrites=true&w=majority&appName=codevra"
```

**`<db_username>` ve `<db_password>` kısımlarını değiştirin:**

**Örnek 1 - Basit Şifre:**
```env
DATABASE_URL="mongodb+srv://codevra:MyPassword123@codevra.39ivkjs.mongodb.net/valorant-tracker?retryWrites=true&w=majority&appName=codevra"
```

**Örnek 2 - Özel Karakterli Şifre:**
Eğer şifrenizde özel karakterler varsa, URL encode edin:

| Karakter | Encoded |
|----------|---------|
| `@` | `%40` |
| `!` | `%21` |
| `#` | `%23` |
| `$` | `%24` |
| `%` | `%25` |
| `&` | `%26` |
| `=` | `%3D` |
| `+` | `%2B` |

**Örnek:** Şifre `Pass@123!` ise:
```env
DATABASE_URL="mongodb+srv://codevra:Pass%40123%21@codevra.39ivkjs.mongodb.net/valorant-tracker?retryWrites=true&w=majority&appName=codevra"
```

### 4. Dosyayı Kaydedin

VS Code'da `Ctrl + S` ile kaydedin.

### 5. Test Edin

Terminal'de:
```bash
npm run test:connection
```

✅ **Başarılı çıktı:**
```
✅ Bağlantı başarılı!
MongoDB Sunucu Bilgisi:
  Versiyon: 8.0.x
✅ Yazma başarılı!
✅ Okuma başarılı!
=== TÜM TESTLER BAŞARILI ===
```

❌ **Hala hata alıyorsanız:**
```
❌ BAĞLANTI HATASI:
Hata mesajı: authentication failed
```

→ Kullanıcı adı veya şifre yanlış, tekrar kontrol edin!

### 6. Development Server'ı Başlatın

```bash
npm run dev
```

Sonra tarayıcıda test edin:
```
http://localhost:3000/api/test
```

Başarılı olursa:
```json
{
  "mongodb": {
    "connected": true,
    "error": null
  }
}
```

## 🎯 Hızlı Kontrol Listesi

- [ ] MongoDB Atlas Database Access'te kullanıcı var
- [ ] Kullanıcının şifresi belli
- [ ] .env.local dosyasında `<db_username>` ve `<db_password>` değiştirildi
- [ ] Özel karakterler URL encode edildi
- [ ] Dosya kaydedildi (`Ctrl + S`)
- [ ] `npm run test:connection` başarılı
- [ ] `/api/test` endpoint'i çalışıyor

## 🆘 Yardım

Hala sorun varsa terminalden şu komutu çalıştırın:
```bash
npm run check:env
```

Bu size hangi bilgilerin kullanıldığını gösterecek.
