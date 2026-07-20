/**
 * seedBlogOnly.ts
 * ---------------------------------------------------------------------------
 * YALNIZCA `blog/{slug}` koleksiyonuna gerçek yazı gövdelerini yazar.
 * Başka HİÇBİR koleksiyona dokunmaz (seedFirestore.ts'in aksine).
 *
 * Neden ayrı script?
 *   - seedFirestore.ts blog dokümanlarına `_seed: true` koyar; clearSeedData()
 *     `where('_seed','==',true)` ile bunları siler. Burada `_seed` KOYULMUYOR
 *     → gerçek içerik, clearSeedData tarafından silinmez.
 *   - `icerik` alanı BLOG_ICERIK[slug]'ten gelir (13 yazının hepsi mevcut).
 *
 * ─── Alan seçimi ──────────────────────────────────────────────────────────
 *   Doküman `{ icerik, aktif: true }` yazar. Başka alan YOK.
 *     - icerik : BLOG_ICERIK[slug] — gerçek gövde.
 *     - aktif  : rules:157 public read şartı (kullanıcı kararı ile eklendi):
 *         allow read: if resource.data.aktif == true || (auth != null && isAdmin())
 *       Bu olmadan giriş yapmamış ziyaretçi gövdeyi okuyamaz → render olmaz.
 *   Metadata (baslik/ozet/kategori vb.) uygulamada statik blogPosts.ts'ten
 *   okunur; BlogDetayPage Firestore'dan YALNIZ `.icerik` okur → tekrarlanmaz.
 *
 * ─── KİMLİK DOĞRULAMA (bu dosya ÇALIŞTIRMAZ; invoke bağlamı dışarıda) ──────
 *   Yazma kuralı (rules:158): `allow write: if auth != null && isAdmin()`.
 *   Bu fonksiyon, çağrıldığı yerde `auth.currentUser`'ın bir ADMIN olmasını
 *   varsayar (seedFirestore.ts ile aynı model). Nasıl authenticate edileceği
 *   üç seçenekten biriyle karara bağlıdır — bkz. rapor. HEDEF: PROD (emülatör
 *   DEĞİL); db/auth `../lib/firebase`'ten gelir, proje: `modulerpazar`.
 * ---------------------------------------------------------------------------
 */
import { collection, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { BLOG_POSTS } from '../data/blogPosts';
import { BLOG_ICERIK } from '../data/blogIcerik';

export interface SeedBlogOnlyResult {
  oncekiDokumanSayisi: number;
  yazilanSayi: number;
  dogrulananSayi: number;
  eksikSluglar: string[];
}

export async function seedBlogOnly(): Promise<SeedBlogOnlyResult> {
  console.log('[blog-seed] Başladı — YALNIZ blog/{slug} yazılacak.');

  // Kim authenticate? (yazma isAdmin() ister — bağlamı doğrula)
  const user = auth.currentUser;
  console.log('[blog-seed] auth.currentUser:',
    user ? { uid: user.uid, email: user.email } : null);
  if (!user) {
    throw new Error(
      '[blog-seed] Giriş yapılmamış — blog yazma isAdmin() gerektirir. ' +
      'Önce bir admin kullanıcı ile authenticate olun (bkz. dosya başı auth seçenekleri).',
    );
  }

  // ── 1) YAZMADAN ÖNCE: mevcut blog koleksiyonunu oku, say ──────────────────
  const oncekiSnap = await getDocs(collection(db, 'blog'));
  const oncekiDokumanSayisi = oncekiSnap.size;
  console.log(`[blog-seed] Yazmadan önce blog koleksiyonunda ${oncekiDokumanSayisi} doküman var.`);
  console.log('[blog-seed] Mevcut slug\'lar:', oncekiSnap.docs.map((d) => d.id));

  // ── 2) YAZ: 13 dokümanı tek batch'te (set = tam üzerine yaz → varsa _seed temizlenir) ──
  const batch = writeBatch(db);
  let yazilacak = 0;
  for (const post of BLOG_POSTS) {
    const icerik = BLOG_ICERIK[post.slug];
    if (!icerik) {
      // Güvenlik: gövdesiz slug'ı yazma (spec: gerçek içerik). Boş '' de atlanır.
      console.warn(`[blog-seed] UYARI: BLOG_ICERIK['${post.slug}'] boş/yok — atlanıyor.`);
      continue;
    }
    batch.set(doc(db, 'blog', post.slug), {
      icerik,       // BLOG_ICERIK[slug] — gerçek gövde
      aktif: true,  // rules:157 public read şartı
      // _seed BİLİNÇLİ YOK → clearSeedData() bu dokümanı silmez.
    });
    yazilacak++;
  }
  await batch.commit();
  console.log(`[blog-seed] blog yazıldı (${yazilacak} adet).`);

  // ── 3) YAZMA SONRASI: 13 slug'ı geri oku ve doğrula ───────────────────────
  const eksikSluglar: string[] = [];
  let dogrulananSayi = 0;
  for (const post of BLOG_POSTS) {
    const beklenen = BLOG_ICERIK[post.slug];
    if (!beklenen) continue; // gövdesi olmayan/boş slug'ı doğrulama dışı bırak
    const snap = await getDoc(doc(db, 'blog', post.slug));
    const data = snap.exists() ? (snap.data() as { icerik?: string; aktif?: boolean }) : null;
    const ok = !!data && data.icerik === beklenen && data.aktif === true;
    if (ok) {
      dogrulananSayi++;
    } else {
      eksikSluglar.push(post.slug);
      console.error(`[blog-seed] DOĞRULAMA HATASI: ${post.slug} — exists:${snap.exists()} ` +
        `icerikEsit:${data?.icerik === beklenen} aktif:${data?.aktif}`);
    }
  }
  console.log(`[blog-seed] Doğrulama: ${dogrulananSayi}/${yazilacak} doküman geri okundu ve eşleşti.`);
  if (eksikSluglar.length > 0) {
    console.error('[blog-seed] Eşleşmeyen slug\'lar:', eksikSluglar);
  } else {
    console.log('[blog-seed] Tüm dokümanlar doğrulandı ✓');
  }

  return { oncekiDokumanSayisi, yazilanSayi: yazilacak, dogrulananSayi, eksikSluglar };
}
