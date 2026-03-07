# Yandex 360 E-posta Kurulumu — modulerpazar.com

## 1. Yandex 360'a Kayıt

1. https://360.yandex.com.tr adresine git
2. "Ücretsiz Başla" → alan adını gir: `modulerpazar.com`
3. İlk kullanıcıyı oluştur: `info@modulerpazar.com`

---

## 2. DNS Kayıtları

Domain sağlayıcında (örn. GoDaddy, Namecheap, Cloudflare) aşağıdaki kayıtları ekle:

### MX Kayıtları (E-posta alımı)

| Tür | Ad     | Değer                  | Öncelik |
|-----|--------|------------------------|---------|
| MX  | @      | mx.yandex.net.         | 10      |

> Bazı panellerde nokta (.) sonuna eklenmez — panel otomatik tamamlar.

### TXT Kayıtları (Doğrulama + Anti-spam)

| Tür | Ad     | Değer                                                                 |
|-----|--------|-----------------------------------------------------------------------|
| TXT | @      | `v=spf1 include:_spf.yandex.net ~all`                                |
| TXT | mail._domainkey | *(Yandex 360 panelinden DKIM public key'i kopyala)*          |
| TXT | _dmarc | `v=DMARC1; p=none; rua=mailto:info@modulerpazar.com`                 |

### SPF Kaydı Açıklaması
- `include:_spf.yandex.net` → Yandex'in sunucularından gönderim izni
- `~all` → Diğer kaynaklardan gelen e-postalar SoftFail (karantinaya alınır)

### DKIM Kurulumu
1. Yandex 360 → Domain Ayarları → DKIM
2. Public key'i kopyala (format: `p=MIGf...`)
3. DNS'e `mail._domainkey` adıyla TXT kaydı olarak ekle
4. Yandex panelinden doğrula

---

## 3. Domain Doğrulama (Yandex tarafı)

Yandex, domain sahipliğini doğrulamak için iki yöntem sunar:

**Yöntem A — TXT kaydı:**
| Tür | Ad | Değer |
|-----|----|-------|
| TXT | @ | `yandex-verification: <kod>` |

**Yöntem B — HTML dosyası:**
`/public/yandex_<kod>.html` dosyası oluştur, içeriği boş bırak.

---

## 4. Yayılma Süresi

- DNS değişiklikleri genellikle **15 dakika – 48 saat** arasında yayılır
- `dig MX modulerpazar.com` komutuyla doğrulayabilirsin

---

## 5. E-posta Hesapları (Planlanan)

| Adres                          | Kullanım                   |
|--------------------------------|----------------------------|
| info@modulerpazar.com          | Genel iletişim, EmailJS To |
| destek@modulerpazar.com        | Müşteri desteği            |
| firma@modulerpazar.com         | Firma başvuruları          |
| noreply@modulerpazar.com       | Otomatik bildirimler       |

---

## 6. EmailJS Güncellemesi ⚠️

> **YAPILACAK:** `info@modulerpazar.com` aktif olunca EmailJS template'ini güncelle.
>
> - EmailJS → Services → service_3hiixen → Templates → template_sdz7ml6
> - "To Email" alanını `lifovalifova@gmail.com` → `info@modulerpazar.com` olarak değiştir
> - Şimdilik: `lifovalifova@gmail.com` kalsın

Kod referansı: `src/lib/emailjs.ts`

---

## 7. Cloudflare Kullanıyorsan

MX ve TXT kayıtları için **Proxy (turuncu bulut) KAPALI** olmalı.
Sadece A/CNAME kayıtlarında proxy açılabilir.
