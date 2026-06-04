# 🔧 MongoDB Authentication Hatası - Çözüm Kılavuzu

## ❌ Sorun
```
AuthenticationFailed: SCRAM failure: bad auth : authentication failed
```

Bu hata, MongoDB Atlas'taki kullanıcı adı veya şifrenin yanlış olduğunu gösteriyor.

## ✅ Çözüm Adımları

### 1. MongoDB Atlas'a Giriş Yapın
https://cloud.mongodb.com adresine gidin ve giriş yapın.

### 2. Doğru Cluster'ı Seçin
Şu anda iki cluster kullanmaya çalışıyorsunuz:
- ❌ `Codevra:Codevra123@cluster0.bbp6d2f.mongodb.net` (ÇALIŞMIYOR)
- ❌ `codevra:codevra123@codevra.39ivkjs.mongodb.net` (ÇALIŞMIYOR)

**Hangisini kullanacağınıza karar verin.** Öneri: `codevra.39ivkjs` (çünkü .env dosyasında zaten var)

### 3. Database Access Menüsüne Gidin
Sol menüden **Database Access** seçeneğine tıklayın.

### 4. Kullanıcıyı Kontrol Edin

#### Seçenek A: Mevcut Kullanıcıyı Düzenle
1. Kullanıcı listesinde `codevra` kullanıcısını bulun
2. **Edit** butonuna tıklayın
3. Yeni şifre belirleyin (örn: `Codevra123!@#`)
4. **Update User** butonuna tıklayın
5. ⚠️ **Şifreyi not alın!**

#### Seçenek B: Yeni Kullanıcı Oluştur
1. **Add New Database User** butonuna tıklayın
2. Username: `valorant_user` (veya istediğiniz bir isim)
3. Password: **Autogenerate Secure Password** tıklayın veya kendiniz belirleyin
4. ⚠️ **Şifreyi not alın!**
5. Database User Privileges: **Atlas admin** veya **Read and write to any database** seçin
6. **Add User** butonuna tıklayın

### 5. Network Access'i Kontrol Edin
1. Sol menüden **Network Access** seçeneğine gidin
2. IP Access List'e bakın
3. Eğer `0.0.0.0/0` (Allow access from anywhere) yoksa:
   - **Add IP Address** butonuna tıklayın
   - **Allow Access from Anywhere** seçin
   - **Confirm** butonuna tıklayın

### 6. Connection String'i Alın
1. Sol menüden **Database** seçeneğine gidin
2. Cluster'ınızdaki **Connect** butonuna tıklayın
3. **Drivers** seçeneğini seçin
4. Connection string'i kopyalayın:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```
5. `<username>` ve `<password>` kısımlarını değiştirin
6. `<database>` kısmını `valorant-tracker` olarak değiştirin

### 7. .env.local Dosyasını Güncelleyin

Terminal'de şu komutu çalıştırın:
```bash
notepad .env.local
```

Veya VS Code'da `.env.local` dosyasını açın ve `DATABASE_URL` satırını güncelleyin:

```env
DATABASE_URL="mongodb+srv://KULLANICI_ADI:SIFRE@codevra.39ivkjs.mongodb.net/valorant-tracker?retryWrites=true&w=majority&appName=codevra"
```

**Örnek:**
```env
DATABASE_URL="mongodb+srv://valorant_user:MyStr0ngP@ssw0rd@codevra.39ivkjs.mongodb.net/valorant-tracker?retryWrites=true&w=majority&appName=codevra"
```

⚠️ **DİKKAT:** Özel karakterler varsa URL encode edilmeli:
- `@` → `%40`
- `!` → `%21`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`

### 8. Test Edin

Terminal'de:
```bash
npm run check:env
npm run test:db
```

✅ **Başarılı çıktı:**
```
✅ MongoDB bağlantısı başarılı
✅ Toplam X oyuncu kaydı bulundu
```

### 9. Development Server'ı Yeniden Başlatın

Eğer çalışıyorsa, dev server'ı durdurun (`Ctrl+C`) ve yeniden başlatın:
```bash
npm run dev
```

### 10. Web'den Test Edin

Tarayıcınızda:
```
http://localhost:3000/api/test
```

✅ **Beklenen sonuç:**
```json
{
  "ok": true,
  "mongodb": {
    "connected": true,
    "error": null
  },
  "playerCount": 0
}
```

## 🎯 Özet Checklist

- [ ] MongoDB Atlas'a giriş yaptım
- [ ] Database Access'te kullanıcı var ve şifresi doğru
- [ ] Network Access'te 0.0.0.0/0 eklendi
- [ ] Connection string'i kopyaladım
- [ ] .env.local dosyasını güncelledim
- [ ] `npm run test:db` komutu başarılı
- [ ] `/api/test` endpoint'i çalışıyor
- [ ] Oyuncu arama testi yaptım

## 🆘 Hala Çalışmıyorsa

1. **Terminal'deki hata mesajını tam olarak kopyalayın**
2. **MongoDB Atlas screenshot'ları:**
   - Database Access ekranı
   - Network Access ekranı
   - Cluster dashboard
3. **`.env.local` dosyasının DATABASE_URL satırı** (şifreyi gizleyin!)

Bu bilgilerle daha detaylı yardım edebilirim.

## 📚 Yararlı Linkler

- MongoDB Atlas: https://cloud.mongodb.com
- MongoDB Connection Troubleshooting: https://docs.atlas.mongodb.com/troubleshoot-connection/
- URL Encoding: https://www.urlencoder.org/
