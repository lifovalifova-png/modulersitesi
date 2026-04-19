import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';

interface PlanOzellik { ozellik: string; dahil: boolean }
interface Plan {
  isim: string; fiyat: string; aciklama: string;
  ozellikler: PlanOzellik[]; vurguli: boolean; buton: string; href: string;
}

const PLANLAR: Plan[] = [
  {
    isim: 'Ücretsiz', fiyat: '₺0', aciklama: 'Temel başlangıç paketi',
    vurguli: false, buton: 'Ücretsiz Başla', href: '/kayit?tip=satici',
    ozellikler: [
      { ozellik: '3 aktif ilan', dahil: true },
      { ozellik: '30 gün süre', dahil: true },
      { ozellik: 'Temel özellikler', dahil: true },
      { ozellik: 'Teklif talebi alma', dahil: true },
      { ozellik: 'Firma profil sayfası', dahil: true },
      { ozellik: 'Öne çıkarma', dahil: false },
      { ozellik: 'Detaylı istatistik', dahil: false },
      { ozellik: 'Öncelikli yönlendirme', dahil: false },
    ],
  },
  {
    isim: 'Standart', fiyat: '₺299', aciklama: 'Aylık / firma başına',
    vurguli: true, buton: 'Hemen Başla', href: '/satici-formu',
    ozellikler: [
      { ozellik: '10 aktif ilan', dahil: true },
      { ozellik: '60 gün süre', dahil: true },
      { ozellik: 'Öne çıkarma', dahil: true },
      { ozellik: 'Detaylı istatistik', dahil: true },
      { ozellik: 'Teklif talebi alma', dahil: true },
      { ozellik: 'Firma profil sayfası', dahil: true },
      { ozellik: 'Talep Havuzu önceliği', dahil: false },
      { ozellik: 'Spotlight listeleme', dahil: false },
    ],
  },
  {
    isim: 'Premium', fiyat: '₺599', aciklama: 'Aylık / firma başına',
    vurguli: false, buton: 'Premium\'a Geç', href: '/satici-formu',
    ozellikler: [
      { ozellik: 'Sınırsız ilan', dahil: true },
      { ozellik: 'Sınırsız süre', dahil: true },
      { ozellik: 'Spotlight listeleme', dahil: true },
      { ozellik: 'Öncelikli yönlendirme', dahil: true },
      { ozellik: 'Detaylı istatistik', dahil: true },
      { ozellik: 'Öne çıkarma', dahil: true },
      { ozellik: 'Talep Havuzu önceliği', dahil: true },
      { ozellik: 'Firma profil sayfası', dahil: true },
    ],
  },
];

export default function FiyatlandirmaPage() {
  return (
    <div className="flex flex-col min-h-screen font-body">
      <SEOMeta
        title="Fiyatlandırma | ModülerPazar"
        description="ModülerPazar ücretsiz ve ücretli plan seçenekleri."
        url="/fiyatlandirma"
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white py-14 md:py-20">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="material-symbols-outlined text-5xl text-secondary-container mb-4 block" aria-hidden="true">payments</span>
            <h1 className="text-3xl md:text-5xl font-extrabold font-headline mb-3">Fiyatlandırma</h1>
            <p className="text-white/60 max-w-2xl mx-auto text-lg">
              Alıcılar için her zaman ücretsiz. Satıcılar için esnek paketler.
            </p>
          </div>
        </section>

        {/* Planlar */}
        <section className="py-14 md:py-20 bg-surface-container-lowest">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANLAR.map((plan) => (
                <div
                  key={plan.isim}
                  className={`rounded-2xl p-6 flex flex-col ${
                    plan.vurguli
                      ? 'bg-primary text-on-primary shadow-xl ring-2 ring-primary ring-offset-2'
                      : 'bg-white border border-outline-variant/20'
                  }`}
                >
                  <div className="mb-4">
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 font-headline ${plan.vurguli ? 'text-on-primary/70' : 'text-primary'}`}>
                      {plan.isim}
                    </p>
                    <p className={`text-3xl font-extrabold font-headline ${plan.vurguli ? 'text-on-primary' : 'text-on-surface'}`}>
                      {plan.fiyat}<span className="text-base font-normal">{plan.fiyat !== '₺0' ? '/ay' : ''}</span>
                    </p>
                    <p className={`text-xs mt-0.5 font-body ${plan.vurguli ? 'text-on-primary/60' : 'text-on-surface-variant'}`}>
                      {plan.aciklama}
                    </p>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.ozellikler.map((oz, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm font-body">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          oz.dahil
                            ? plan.vurguli ? 'bg-white/20 text-on-primary' : 'bg-primary/10 text-primary'
                            : plan.vurguli ? 'bg-white/10 text-on-primary/40' : 'bg-surface-container text-on-surface-variant/40'
                        }`}>
                          {oz.dahil ? '✓' : '×'}
                        </span>
                        <span className={oz.dahil ? (plan.vurguli ? 'text-on-primary' : 'text-on-surface') : (plan.vurguli ? 'text-on-primary/50' : 'text-on-surface-variant/60')}>
                          {oz.ozellik}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.href}
                    className={`block text-center py-3 rounded-xl font-bold text-sm transition font-headline ${
                      plan.vurguli
                        ? 'bg-white text-primary hover:bg-white/90'
                        : 'bg-primary text-on-primary hover:bg-primary/90'
                    }`}
                  >
                    {plan.buton}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-on-surface-variant mt-8 font-body">
              Fiyatlar KDV hariçtir. Detaylı bilgi için{' '}
              <a href="mailto:modulerpazar@yandex.com" className="text-primary hover:underline">
                modulerpazar@yandex.com
              </a>{' '}
              adresine yazın.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
