#!/usr/bin/env npx tsx
/**
 * vergiNo migration: firms → firmaPrivate
 *
 * --dry-run  (default): read-only listing
 * --execute: move vergiNo to firmaPrivate/{id}, delete from firms
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { resolve } from 'path';
import { homedir } from 'os';

const MODE = process.argv.includes('--execute') ? 'execute' : 'dry-run';

const keyPath = resolve(homedir(), '.gcp-keys/firestore-backup.json');
initializeApp({ credential: cert(keyPath) });
const db = getFirestore();

function mask(v: string): string {
  if (!v || v.length < 4) return '***';
  return v.slice(0, 3) + '***';
}

async function main() {
  console.log(`\n=== migrate-vergino [${MODE}] ===\n`);

  const firmsSnap = await db.collection('firms').get();
  const hits: { id: string; name: string; vergiNo: string }[] = [];

  for (const doc of firmsSnap.docs) {
    const data = doc.data();
    if (data.vergiNo != null && data.vergiNo !== '') {
      hits.push({ id: doc.id, name: data.name ?? '(isimsiz)', vergiNo: data.vergiNo });
    }
  }

  if (hits.length === 0) {
    console.log('vergiNo alanı olan firma bulunamadı. Çıkılıyor.');
    return;
  }

  console.log(`Bulunan: ${hits.length} firma\n`);
  for (const h of hits) {
    console.log(`  ${h.id}  ${h.name}  vergiNo=${mask(h.vergiNo)}`);
  }

  if (MODE === 'dry-run') {
    console.log('\n[DRY-RUN] Yazma işlemi yapılmadı. Taşımak için --execute kullanın.\n');
    return;
  }

  console.log('\n--- EXECUTE: taşıma başlıyor ---\n');
  let ok = 0;
  let fail = 0;

  for (const h of hits) {
    try {
      const batch = db.batch();
      batch.set(db.doc(`firmaPrivate/${h.id}`), {
        vergiNo: h.vergiNo,
        tasinmaTarihi: FieldValue.serverTimestamp(),
      });
      batch.update(db.doc(`firms/${h.id}`), {
        vergiNo: FieldValue.delete(),
      });
      await batch.commit();
      console.log(`  ✓ ${h.id} (${h.name})`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${h.id} (${h.name}):`, e);
      fail++;
    }
  }

  console.log(`\n--- Sonuç: ${ok} başarılı, ${fail} hatalı ---`);

  // doğrulama
  const verifySnap = await db.collection('firms').get();
  let remaining = 0;
  for (const doc of verifySnap.docs) {
    if (doc.data().vergiNo != null && doc.data().vergiNo !== '') remaining++;
  }
  const privateCount = (await db.collection('firmaPrivate').get()).size;
  console.log(`Doğrulama: firms'te kalan vergiNo=${remaining}, firmaPrivate doküman=${privateCount}\n`);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
