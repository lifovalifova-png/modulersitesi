/**
 * countCollections.ts
 * Firestore koleksiyonlarındaki belge sayısını tablo olarak gösterir.
 *
 * Kullanım:
 *   npx tsx src/scripts/countCollections.ts
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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
] as const;

async function main() {
  console.log('\nModülerPazar — Firestore Koleksiyon Sayımı');
  console.log('='.repeat(55));
  console.log('Koleksiyon'.padEnd(25) + 'Toplam'.padEnd(10) + 'Aktif/Yayında');
  console.log('-'.repeat(55));

  for (const name of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, name));
      const total = snap.size;

      let activeCount = '-';
      if (name === 'ilanlar') {
        const q = query(collection(db, name), where('status', '==', 'aktif'));
        const aSnap = await getDocs(q);
        activeCount = String(aSnap.size);
      } else if (name === 'haberler') {
        const q = query(collection(db, name), where('yayinda', '==', true));
        const aSnap = await getDocs(q);
        activeCount = String(aSnap.size);
      } else if (name === 'firms') {
        const q = query(collection(db, name), where('status', '==', 'approved'));
        const aSnap = await getDocs(q);
        activeCount = String(aSnap.size);
      }

      console.log(name.padEnd(25) + String(total).padEnd(10) + activeCount);
    } catch (err) {
      console.log(name.padEnd(25) + 'HATA'.padEnd(10) + String(err));
    }
  }

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Hata:', err);
  process.exit(1);
});
