/**
 * backup-firestore.ts
 * Tüm Firestore koleksiyonlarını JSON olarak dışa aktarır.
 *
 * Gereksinim: GOOGLE_APPLICATION_CREDENTIALS ortam değişkeni veya
 *             Firebase Admin SDK service account JSON dosyası
 *
 * Kullanım:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx src/scripts/backup-firestore.ts
 *
 * Çıktı: backups/firestore-YYYY-MM-DD.json
 */
import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

const COLLECTIONS = [
  'ilanlar',
  'firms',
  'taleplar',
  'quotes',
  'teklifler',
  'blog',
  'blogSettings',
  'haberler',
  'haberKaynaklari',
  'etkinlikler',
  'yorumlar',
  'bildirimler',
  'settings',
  'admins',
  'users',
  'geri_bildirimler',
  'hakkimizda',
  'whatsappTiklamalari',
];

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!credPath) {
  console.error('HATA: GOOGLE_APPLICATION_CREDENTIALS ortam değişkeni tanımlı değil.');
  console.error('Kullanım: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json npx tsx src/scripts/backup-firestore.ts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf-8')) as ServiceAccount;
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function main() {
  const backup: Record<string, Record<string, unknown>[]> = {};
  let totalDocs = 0;

  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    backup[name] = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    totalDocs += snap.size;
    console.log(`  ${name}: ${snap.size} belge`);
  }

  const outDir = path.resolve('backups');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const date = new Date().toISOString().slice(0, 10);
  const outFile = path.join(outDir, `firestore-${date}.json`);
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2), 'utf-8');

  const sizeMB = (fs.statSync(outFile).size / (1024 * 1024)).toFixed(2);
  console.log(`\nToplam: ${totalDocs} belge → ${outFile} (${sizeMB} MB)`);
}

main().catch((err) => {
  console.error('Backup hatası:', err);
  process.exit(1);
});
