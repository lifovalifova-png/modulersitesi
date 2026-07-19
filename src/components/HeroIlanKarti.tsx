import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { type Ilan, formatFiyat } from '@/hooks/useIlanlar';
import { useLanguage } from '@/context/LanguageContext';

/* Yatay ilan kartı — koyu zeminli Hero sağ paneli için.
   IlanMiniCard'ın (dikey, açık zemin) yatay/karanlık muadili. Foto solda,
   içerik sağda. Tüm kart /ilan/{id}'ye gider. */
export default function HeroIlanKarti({ ilan }: { ilan: Ilan }) {
  const { t } = useLanguage();
  const img   = ilan.gorseller?.[0] ?? '';
  const fiyat = ilan.acilSatis && ilan.acilSatisFiyat ? ilan.acilSatisFiyat : ilan.fiyat;

  return (
    <Link
      to={`/ilan/${ilan.id}`}
      className="group flex gap-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition"
    >
      {/* Foto — sol, 128px kare */}
      <div className="flex-none w-32 h-32 rounded-lg overflow-hidden bg-white/5">
        {img ? (
          <img
            src={img}
            alt={ilan.baslik}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/25 text-2xl">🏠</div>
        )}
      </div>

      {/* İçerik — sağ */}
      <div className="flex flex-col min-w-0 flex-1 py-0.5">
        <h3 className="font-headline font-bold text-base text-white leading-snug line-clamp-2">
          {ilan.baslik}
        </h3>

        <span className="mt-1.5 font-headline font-bold text-lg text-primary-container">
          {formatFiyat(fiyat)}
        </span>

        <div className="mt-auto flex items-center gap-x-2 gap-y-1 flex-wrap">
          <span className="text-xs text-white/70 font-body truncate">{ilan.sehir}</span>
          {ilan.acilSatis && (
            <span className="flex-none inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-headline">
              🔴 {t('common.urgent')}
            </span>
          )}
          {ilan.firmaDogrulanmis && (
            <span className="flex-none inline-flex items-center gap-0.5 text-primary-container text-[10px] font-semibold font-headline">
              <ShieldCheck className="w-3 h-3" aria-hidden="true" /> {t('common.verified')}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
