/**
 * fuarScraper.ts
 * Fuar sitelerinden etkinlik bilgilerini cheerio ile çeker,
 * Gemini API ile yapılandırılmış veriye dönüştürür ve Firestore'a
 * "taslak" olarak kaydeder. Admin panelinden onaylanıp yayına alınır.
 *
 * Kullanım:
 *   GEMINI_API_KEY=... npx tsx src/scripts/fuarScraper.ts
 *   DRY_RUN=true GEMINI_API_KEY=... npx tsx src/scripts/fuarScraper.ts
 *
 * Ortam değişkenleri:
 *   GEMINI_API_KEY  — Google AI Studio API anahtarı (zorunlu)
 *   DRY_RUN         — "true" ise Firestore'a yazmaz, sadece konsola basar
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs, query, where, Timestamp, serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBqz1_0_jWBmtHr5o3cw77G9swzaV31hVk',
  authDomain: 'modulerpazar.firebaseapp.com',
  projectId: 'modulerpazar',
  storageBucket: 'modulerpazar.firebasestorage.app',
  messagingSenderId: '1066643691849',
  appId: '1:1066643691849:web:73230c8713b4360aa9a298',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DRY_RUN = process.env.DRY_RUN === 'true';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌  GEMINI_API_KEY ortam değişkeni gerekli.');
  process.exit(1);
}

/* ── Hedef siteler ────────────────────────────────────────── */
interface FuarKaynak {
  ad: string;
  url: string;
  selector?: string; // cheerio selector for event blocks
}

const KAYNAKLAR: FuarKaynak[] = [
  {
    ad: 'TÜYAP',
    url: 'https://www.tuyap.com.tr/fuarlar',
  },
  {
    ad: 'İFM',
    url: 'https://www.ifm.com.tr/',
  },
  {
    ad: 'CNR Expo',
    url: 'https://cnrexpo.com/fuarlar/',
  },
];

/* ── HTML çek ─────────────────────────────────────────────── */
async function fetchHTML(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ModulerPazar-FuarBot/1.0 (+https://modulerpazar.com)',
        'Accept': 'text/html',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

/* ── Gemini API ile yapılandırılmış veri çıkar ──────────── */
interface ScrapedEtkinlik {
  baslik: string;
  baslangicTarihi: string; // YYYY-MM-DD
  bitisTarihi: string;
  sehir: string;
  mekan: string;
  kisaAciklama: string;
  kategoriler: string[];
  organizator: string;
  organizatorWeb?: string;
  katilimUcretli: boolean;
}

async function parseWithGemini(html: string, kaynakAd: string): Promise<ScrapedEtkinlik[]> {
  // Trim HTML to avoid token limits — keep first 30k chars
  const trimmed = html.slice(0, 30000);

  const prompt = `Aşağıdaki HTML, "${kaynakAd}" adlı bir fuar/etkinlik sitesinden alınmıştır.
Bu HTML'den modüler yapı, prefabrik, konteyner ev, çelik yapı, tiny house veya inşaat sektörüyle ilgili
yaklaşan fuarları ve etkinlikleri çıkar.

Her etkinlik için şu JSON formatında döndür:
{
  "baslik": "etkinlik adı",
  "baslangicTarihi": "YYYY-MM-DD",
  "bitisTarihi": "YYYY-MM-DD",
  "sehir": "şehir adı",
  "mekan": "mekan adı",
  "kisaAciklama": "1-2 cümle açıklama",
  "kategoriler": ["prefabrik", "modüler yapı"],
  "organizator": "organizatör adı",
  "organizatorWeb": "https://...",
  "katilimUcretli": false
}

Kurallar:
- Sadece modüler yapı, inşaat, prefabrik, konteyner, çelik yapı, ahşap yapı, tiny house, yapı malzemeleri fuarlarını dahil et
- Geçmiş tarihli etkinlikleri dahil ETME
- Tarihler YYYY-MM-DD formatında olmalı
- Yanıtı SADECE JSON array olarak döndür, başka metin ekleme
- İlgili etkinlik bulunamazsa boş array döndür: []

HTML:
${trimmed}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API hatası: ${res.status} — ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Extract JSON array from response
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  try {
    return JSON.parse(match[0]) as ScrapedEtkinlik[];
  } catch {
    console.warn('⚠️  JSON parse hatası, Gemini yanıtı:', text.slice(0, 300));
    return [];
  }
}

/* ── Slug oluştur ─────────────────────────────────────────── */
function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ── Firestore'a kaydet ───────────────────────────────────── */
async function kaydet(etkinlik: ScrapedEtkinlik, kaynakUrl: string): Promise<string | null> {
  // Duplicate check by baslik
  const q = query(
    collection(db, 'etkinlikler'),
    where('baslik', '==', etkinlik.baslik),
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    console.log(`  ⏭  Zaten mevcut: ${etkinlik.baslik}`);
    return null;
  }

  const doc = {
    baslik: etkinlik.baslik,
    slug: slugify(etkinlik.baslik),
    tur: 'fuar' as const,
    baslangicTarihi: Timestamp.fromDate(new Date(etkinlik.baslangicTarihi)),
    bitisTarihi: Timestamp.fromDate(new Date(etkinlik.bitisTarihi)),
    sehir: etkinlik.sehir || '',
    mekan: etkinlik.mekan || '',
    kisaAciklama: etkinlik.kisaAciklama || '',
    tamAciklama: etkinlik.kisaAciklama || '',
    kapakGorseli: '',
    kategoriler: etkinlik.kategoriler || [],
    organizator: etkinlik.organizator || '',
    organizatorWeb: etkinlik.organizatorWeb || '',
    katilimUcretli: etkinlik.katilimUcretli || false,
    biletUcreti: 0,
    biletLinki: '',
    durum: 'taslak', // Admin onayı gerekli
    oneCikan: false,
    goruntulenmeSayisi: 0,
    kaynak: 'ai-scraper',
    kaynakUrl,
    olusturulmaTarihi: serverTimestamp(),
    guncellenmeTarihi: serverTimestamp(),
  };

  if (DRY_RUN) {
    console.log(`  📝 [DRY RUN] Kaydedilecek: ${etkinlik.baslik}`);
    console.log(`     ${etkinlik.baslangicTarihi} — ${etkinlik.bitisTarihi} · ${etkinlik.sehir}`);
    return 'dry-run';
  }

  const ref = await addDoc(collection(db, 'etkinlikler'), doc);
  console.log(`  ✅ Kaydedildi: ${etkinlik.baslik} (${ref.id})`);
  return ref.id;
}

/* ── Ana fonksiyon ────────────────────────────────────────── */
async function main() {
  console.log('🔍 Fuar Scraper başlatılıyor...');
  console.log(`   Mod: ${DRY_RUN ? 'DRY RUN' : 'CANLI'}`);
  console.log(`   Kaynak sayısı: ${KAYNAKLAR.length}\n`);

  let toplam = 0;
  let kaydedilen = 0;

  for (const kaynak of KAYNAKLAR) {
    console.log(`📡 ${kaynak.ad} (${kaynak.url})`);
    try {
      const html = await fetchHTML(kaynak.url);
      console.log(`   HTML boyutu: ${(html.length / 1024).toFixed(0)} KB`);

      const etkinlikler = await parseWithGemini(html, kaynak.ad);
      console.log(`   Bulunan etkinlik: ${etkinlikler.length}`);
      toplam += etkinlikler.length;

      for (const etk of etkinlikler) {
        const id = await kaydet(etk, kaynak.url);
        if (id) kaydedilen++;
      }
    } catch (err) {
      console.error(`   ❌ Hata: ${err instanceof Error ? err.message : err}`);
    }
    console.log('');
  }

  console.log('────────────────────────────────');
  console.log(`📊 Sonuç: ${toplam} etkinlik bulundu, ${kaydedilen} yeni kayıt eklendi.`);
  console.log('   Etkinlikler "taslak" olarak kaydedildi. Admin panelinden yayına alın.');
}

main().catch(console.error);
