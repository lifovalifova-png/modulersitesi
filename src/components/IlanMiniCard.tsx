import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { type Ilan, formatFiyat } from '../hooks/useIlanlar';

/* ── Kategori çipi renkleri — ilan.kategori (görünen ad) ile anahtarlanır ─── */
const CATEGORY_CHIP: Record<string, string> = {
  'Prefabrik':           'bg-green-100 text-green-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
  '2. El':               'bg-orange-100 text-orange-700',
};

/* ── Sol üst rozet — öncelik: acilSatis > ikinci-el > indirimli ─────────── */
function getBadge(ilan: Ilan): { label: string; cls: string } | null {
  if (ilan.acilSatis)                     return { label: 'ACİL SATILIK', cls: 'bg-red-600' };
  if (ilan.kategoriSlug === 'ikinci-el')  return { label: '2. EL',        cls: 'bg-orange-500' };
  if (ilan.indirimli)                     return { label: 'İNDİRİMLİ',    cls: 'bg-amber-600' };
  return null;
}

/* Kompakt ilan kartı — anasayfa "Öne Çıkan İlanlar" ızgarası için.
   Tüm kart /ilan/{id}'ye gider; buton/firma/stok yok. */
export default function IlanMiniCard({ ilan }: { ilan: Ilan }) {
  const img     = ilan.gorseller?.[0] ?? '';
  const badge   = getBadge(ilan);
  const chipCls = CATEGORY_CHIP[ilan.kategori] ?? 'bg-gray-100 text-gray-600';
  const fiyat   = ilan.acilSatis && ilan.acilSatisFiyat ? ilan.acilSatisFiyat : ilan.fiyat;

  return (
    <Link
      to={`/ilan/${ilan.id}`}
      className="group bg-white rounded-2xl border border-outline-variant/40 overflow-hidden flex flex-col hover:shadow-lg hover:-translate-y-[3px] transition duration-300"
    >
      {/* Görsel 4:3 */}
      <div className="relative aspect-[4/3] bg-surface-container-low">
        {img ? (
          <img
            src={img}
            alt={ilan.baslik}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
        )}
        {badge && (
          <span className={`absolute top-2.5 left-2.5 ${badge.cls} text-white text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full shadow-sm font-headline`}>
            {badge.label}
          </span>
        )}
      </div>

      {/* Gövde */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`flex-none text-[10px] font-bold px-2 py-0.5 rounded-full font-headline ${chipCls}`}>
            {ilan.kategori}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-on-surface-variant truncate font-body">
            <MapPin className="w-3 h-3 flex-none" aria-hidden="true" />
            {ilan.sehir}
          </span>
        </div>

        <h3 className="font-headline font-bold text-sm leading-snug text-on-surface line-clamp-2 min-h-[38px]">
          {ilan.baslik}
        </h3>

        <span className="mt-auto font-headline font-extrabold text-[17px] text-primary">
          {formatFiyat(fiyat)}
        </span>
      </div>
    </Link>
  );
}
