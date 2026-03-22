import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_3hiixen';
const TEMPLATE_ID = 'template_sdz7ml6';
const PUBLIC_KEY  = '4egUQ3U8O6eFOn0aY';

// TODO: info@modulerpazar.com aktif olunca EmailJS template'indeki
//       "To Email" alanını lifovalifova@gmail.com → info@modulerpazar.com yap.
//       Bakınız: src/docs/yandex-email-setup.md §6

export async function sendFirmaBasvuruEmail(firma: {
  firmaAdi:    string;
  eposta:      string;
  telefon:     string;
  sehir:       string;
  kategoriler: string;
}) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    name:          firma.firmaAdi,
    email:         firma.eposta,
    telefon:       firma.telefon,
    sehir:         firma.sehir,
    kategoriler:   firma.kategoriler,
    aciklama:      `Yeni firma başvurusu: ${firma.firmaAdi}`,
    musteri_email: firma.eposta,
    butce:         'Firma Başvurusu',
    kategori:      firma.kategoriler,
  }, PUBLIC_KEY);
}

export async function sendTalepEmail(talep: {
  kategori: string;
  sehir:    string;
  butce:    string;
  aciklama: string;
  ad:       string;
  telefon:  string;
  email:    string;
}) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    kategori:      talep.kategori,
    sehir:         talep.sehir,
    butce:         talep.butce,
    aciklama:      talep.aciklama,
    ad:            talep.ad,
    telefon:       talep.telefon,
    musteri_email: talep.email,
    name:          talep.ad,
    email:         talep.email,
  }, PUBLIC_KEY);
}

export async function sendTeklifEmail(teklif: {
  firmaAdi:    string;
  fiyat:       number;
  teslimSuresi: string;
  aciklama:    string;
  musteriAd:   string;
  musteriEmail: string;
  talepId:     string;
}) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    name:          teklif.firmaAdi,
    email:         teklif.musteriEmail,
    musteri_email: teklif.musteriEmail,
    aciklama:      `${teklif.firmaAdi} firması talebinize teklif verdi.\n\nFiyat: ${teklif.fiyat.toLocaleString('tr-TR')} ₺\nTeslim Süresi: ${teklif.teslimSuresi}\nAçıklama: ${teklif.aciklama}\n\nTeklifinizi görüntülemek için: https://modulerpazar.com/talepim/${teklif.talepId}`,
    kategori:      'Hızlı Teklif',
    sehir:         '',
    butce:         `${teklif.fiyat.toLocaleString('tr-TR')} ₺`,
    ad:            teklif.musteriAd,
    telefon:       '',
  }, PUBLIC_KEY);
}

export async function sendTeklifKabulEmail(data: {
  firmaEmail:  string;
  firmaAdi:    string;
  musteriAd:   string;
  musteriTel:  string;
  musteriEmail: string;
  fiyat:       number;
}) {
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    name:          data.musteriAd,
    email:         data.firmaEmail,
    musteri_email: data.firmaEmail,
    aciklama:      `${data.musteriAd} müşterisi teklifinizi kabul etti!\n\nKabul Edilen Fiyat: ${data.fiyat.toLocaleString('tr-TR')} ₺\nMüşteri Telefon: ${data.musteriTel}\nMüşteri E-posta: ${data.musteriEmail}`,
    kategori:      'Teklif Kabul Edildi',
    sehir:         '',
    butce:         `${data.fiyat.toLocaleString('tr-TR')} ₺`,
    ad:            data.firmaAdi,
    telefon:       data.musteriTel,
  }, PUBLIC_KEY);
}
