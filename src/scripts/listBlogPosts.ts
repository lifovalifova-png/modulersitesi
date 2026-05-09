/**
 * listBlogPosts.ts
 * Firestore blog + blogSettings koleksiyonlarını ve statik BLOG_POSTS listesini
 * birleştirerek tablo halinde yazdırır.
 *
 * Kullanım:
 *   npx tsx src/scripts/listBlogPosts.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { BLOG_POSTS } from '../data/blogPosts';

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

function kelimeSayisi(text: string | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

async function main() {
  const blogSnap = await getDocs(collection(db, 'blog'));
  const blogMap = new Map<string, Record<string, unknown>>();
  blogSnap.forEach((d) => blogMap.set(d.id, d.data()));

  const settingsSnap = await getDocs(collection(db, 'blogSettings'));
  const settingsMap = new Map<string, Record<string, unknown>>();
  settingsSnap.forEach((d) => settingsMap.set(d.id, d.data()));

  const rows: {
    slug: string;
    baslik: string;
    tarih: string;
    kelime_sayisi: number;
    firestore: boolean;
    aktif: boolean;
  }[] = [];

  const seenSlugs = new Set<string>();

  for (const post of BLOG_POSTS) {
    seenSlugs.add(post.slug);
    const fsData = blogMap.get(post.slug);
    const icerik = (fsData?.icerik ?? fsData?.content ?? '') as string;
    rows.push({
      slug: post.slug,
      baslik: post.baslik.slice(0, 50),
      tarih: post.tarih,
      kelime_sayisi: kelimeSayisi(icerik),
      firestore: !!fsData,
      aktif: true,
    });
  }

  for (const [slug, data] of blogMap) {
    if (seenSlugs.has(slug)) continue;
    const icerik = (data.icerik ?? data.content ?? '') as string;
    rows.push({
      slug,
      baslik: ((data.baslik ?? data.title ?? slug) as string).slice(0, 50),
      tarih: (data.tarih ?? data.date ?? '-') as string,
      kelime_sayisi: kelimeSayisi(icerik),
      firestore: true,
      aktif: (data.aktif ?? data.active ?? true) as boolean,
    });
  }

  rows.sort((a, b) => (a.tarih > b.tarih ? -1 : 1));

  console.log('');
  console.log(`Toplam: ${rows.length} blog yazısı (${blogMap.size} Firestore, ${BLOG_POSTS.length} statik)`);
  console.log(`blogSettings: ${settingsMap.size} kayıt`);
  console.log('');
  console.log(
    'No'.padEnd(4) +
    'Slug'.padEnd(45) +
    'Başlık'.padEnd(52) +
    'Tarih'.padEnd(12) +
    'Kelime'.padEnd(8) +
    'FS'.padEnd(5) +
    'Aktif'
  );
  console.log('-'.repeat(130));

  rows.forEach((r, i) => {
    console.log(
      String(i + 1).padEnd(4) +
      r.slug.padEnd(45) +
      r.baslik.padEnd(52) +
      r.tarih.padEnd(12) +
      String(r.kelime_sayisi).padEnd(8) +
      (r.firestore ? 'Evet' : 'Hayır').padEnd(5) +
      (r.aktif ? 'Evet' : 'Hayır')
    );
  });

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
