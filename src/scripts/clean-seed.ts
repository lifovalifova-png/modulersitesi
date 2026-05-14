/**
 * clean-seed.ts
 * Test/seed verilerini Firestore'dan temizler.
 *
 * Varsayılan: DRY-RUN — sadece silinecek belgeleri listeler.
 * Gerçek silme: --confirm bayrağı gerekir.
 *
 * Kullanım:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx src/scripts/clean-seed.ts
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx src/scripts/clean-seed.ts --confirm
 */
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';

const DRY_RUN = !process.argv.includes('--confirm');

const SEED_MARKERS = [
  'test',
  'deneme',
  'seed',
  'örnek',
  'sample',
  'demo',
  'lorem',
];

const COLLECTIONS_TO_CLEAN = [
  'ilanlar',
  'firms',
  'taleplar',
  'quotes',
  'teklifler',
  'yorumlar',
];

const BATCH_SIZE = 400;

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error('HATA: GOOGLE_APPLICATION_CREDENTIALS ortam değişkeni tanımlı değil.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8')) as ServiceAccount;
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function isSeedDoc(data: Record<string, unknown>): boolean {
  const searchFields = ['baslik', 'title', 'name', 'ad', 'email', 'aciklama', 'description', 'firmaAdi'];
  for (const field of searchFields) {
    const val = data[field];
    if (typeof val !== 'string') continue;
    const lower = val.toLowerCase();
    if (SEED_MARKERS.some((m) => lower.includes(m))) return true;
  }
  return false;
}

async function main() {
  if (DRY_RUN) {
    console.log('\n🔍 DRY-RUN modu — hiçbir şey silinmeyecek.');
    console.log('   Gerçek silme için: --confirm bayrağı ekleyin.\n');
  } else {
    console.log('\n⚠️  CONFIRM modu — eşleşen belgeler SİLİNECEK!\n');
  }

  let totalFound = 0;
  let totalDeleted = 0;

  for (const name of COLLECTIONS_TO_CLEAN) {
    const snap = await db.collection(name).get();
    const seedDocs = snap.docs.filter((d) => isSeedDoc(d.data() as Record<string, unknown>));

    if (seedDocs.length === 0) {
      console.log(`  ${name}: temiz (${snap.size} belge, seed yok)`);
      continue;
    }

    totalFound += seedDocs.length;
    console.log(`  ${name}: ${seedDocs.length}/${snap.size} seed belge bulundu`);

    for (const d of seedDocs) {
      const data = d.data();
      const label = (data.baslik || data.name || data.ad || d.id) as string;
      console.log(`    - ${d.id}: ${String(label).slice(0, 60)}`);
    }

    if (!DRY_RUN) {
      for (let i = 0; i < seedDocs.length; i += BATCH_SIZE) {
        const batch = db.batch();
        const chunk = seedDocs.slice(i, i + BATCH_SIZE);
        for (const d of chunk) {
          batch.delete(d.ref);
        }
        await batch.commit();
        totalDeleted += chunk.length;
      }
    }
  }

  console.log('');
  if (DRY_RUN) {
    console.log(`Sonuç: ${totalFound} seed belge bulundu (silinmedi — DRY-RUN)`);
  } else {
    console.log(`Sonuç: ${totalDeleted} seed belge silindi.`);
  }
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
