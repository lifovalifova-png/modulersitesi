import emailjs from '@emailjs/browser';

const SERVICE_ID  = 'service_3hiixen';
const TEMPLATE_ID = 'template_sdz7ml6';
const PUBLIC_KEY  = '4egUQ3U8O6eFOn0aY';

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
