/**
 * backup-firestore.ts
 * Firestore Export API ile tüm koleksiyonları GCS bucket'a yedekler.
 *
 * Gereksinim:
 *   - GOOGLE_APPLICATION_CREDENTIALS ortam değişkeni (service account JSON)
 *   - Service account rolleri: Cloud Datastore Import Export Admin + Storage Object Admin
 *
 * Opsiyonel:
 *   - BACKUP_PATH_PREFIX: "auto" veya "manual" (default: "manual")
 *
 * Kullanım:
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json npx tsx src/scripts/backup-firestore.ts
 *
 * Çıktı: gs://modulerpazar-backup/{prefix}/{timestamp}/ altına Firestore native export
 */
import firestore from '@google-cloud/firestore';
const { v1 } = firestore;

const PROJECT_ID = 'modulerpazar';
const BUCKET = 'modulerpazar-backup';
const DATABASE = `projects/${PROJECT_ID}/databases/(default)`;

const prefix = process.env.BACKUP_PATH_PREFIX || 'manual';

const now = new Date();
const timestamp =
  prefix === 'auto'
    ? now.toISOString().slice(0, 10)
    : now.toISOString().slice(0, 16).replace(':', '-');

const outputUriPrefix = `gs://${BUCKET}/${prefix}/${timestamp}`;

async function main() {
  const client = new v1.FirestoreAdminClient();

  console.log(`Firestore export başlatılıyor...`);
  console.log(`  Database : ${DATABASE}`);
  console.log(`  Hedef    : ${outputUriPrefix}`);

  const [operation] = await client.exportDocuments({
    name: DATABASE,
    outputUriPrefix,
    collectionIds: [],
  });

  console.log(`\nExport operation başlatıldı.`);
  console.log(`  Operation: ${operation.name}`);
  console.log(`  Durum GCP Console'dan takip edilebilir.`);
}

main().catch((err) => {
  console.error('Export hatası:', err.message || err);
  process.exit(1);
});
