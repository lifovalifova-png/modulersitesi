/**
 * cleanDuplicateHaberler.ts
 * Firestore'daki duplicate haberleri temizler.
 *
 * Kullanım:
 *   DRY_RUN=true  npx tsx src/scripts/cleanDuplicateHaberler.ts   # sadece raporla
 *                 npx tsx src/scripts/cleanDuplicateHaberler.ts   # gerçek silme
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

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

interface HaberDoc {
  id: string;
  baslik: string;
  kaynakUrl: string;
  tarih: { seconds: number } | null;
  yayinda: boolean;
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

async function main() {
  console.log(`\n🔍 Duplicate Haber Temizleyici ${DRY_RUN ? '(DRY RUN — silme yapılmayacak)' : '(GERÇEK SİLME)'}\n`);

  // Tüm haberleri çek
  const snap = await getDocs(collection(db, 'haberler'));
  const haberler: HaberDoc[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      baslik: data.baslik ?? '',
      kaynakUrl: data.kaynakUrl ?? '',
      tarih: data.tarih ?? null,
      yayinda: data.yayinda ?? false,
    };
  });

  console.log(`📊 Toplam haber sayısı: ${haberler.length}\n`);

  // baslik'a göre grupla
  const groups = new Map<string, HaberDoc[]>();
  for (const h of haberler) {
    const key = normalize(h.baslik);
    if (!key) continue;
    const arr = groups.get(key) || [];
    arr.push(h);
    groups.set(key, arr);
  }

  // Duplicate grupları bul
  const duplicateGroups = [...groups.entries()].filter(([, arr]) => arr.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('✅ Duplicate haber bulunamadı. Temiz!\n');
    process.exit(0);
  }

  console.log(`⚠️  ${duplicateGroups.length} duplicate grup bulundu:\n`);

  let totalKept = 0;
  let totalDeleted = 0;
  const toDelete: string[] = [];

  for (const [key, arr] of duplicateGroups) {
    // En eski dokümanı tut (tarih.seconds'a göre sırala, en küçük = en eski)
    arr.sort((a, b) => {
      const ta = a.tarih?.seconds ?? Infinity;
      const tb = b.tarih?.seconds ?? Infinity;
      return ta - tb;
    });

    const kept = arr[0];
    const dupes = arr.slice(1);

    console.log(`  📰 "${key}" (${arr.length} kopya)`);
    console.log(`     ✅ TUTULAN: ${kept.id} (tarih: ${kept.tarih ? new Date(kept.tarih.seconds * 1000).toLocaleDateString('tr-TR') : 'yok'}, yayında: ${kept.yayinda})`);
    for (const d of dupes) {
      console.log(`     ❌ SİLİNECEK: ${d.id} (tarih: ${d.tarih ? new Date(d.tarih.seconds * 1000).toLocaleDateString('tr-TR') : 'yok'}, yayında: ${d.yayinda})`);
      toDelete.push(d.id);
    }
    console.log('');

    totalKept++;
    totalDeleted += dupes.length;
  }

  console.log(`\n📋 Özet: ${totalKept} grup, ${totalDeleted} duplicate silinecek\n`);

  if (DRY_RUN) {
    console.log('🏁 DRY RUN tamamlandı. Gerçek silme için DRY_RUN olmadan çalıştırın.\n');
    process.exit(0);
  }

  // Gerçek silme
  console.log('🗑️  Silme işlemi başlıyor...\n');
  let deleted = 0;
  for (const id of toDelete) {
    try {
      await deleteDoc(doc(db, 'haberler', id));
      deleted++;
      console.log(`  ✅ Silindi: ${id}`);
    } catch (err) {
      console.error(`  ❌ Silinemedi: ${id}`, err);
    }
  }

  console.log(`\n🏁 Tamamlandı. ${deleted}/${toDelete.length} duplicate silindi.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
