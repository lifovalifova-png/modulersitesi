import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import {
  Search, FileText, Handshake,
  ShieldCheck, Eye, TrendingUp, Heart,
  ArrowRight, Mail, MessageSquare,
} from 'lucide-react';

/* ─── Varsayılan içerik ──────────────────────────────────── */

const DEFAULT = {
  hikaye: `Modüler yapı almaya karar verdiğinizde önünüzde onlarca seçenek beliriyor. Prefabrik mi olsun, çelik yapı mı? Hangi firma gerçekten güvenilir, teslim tarihine uyuyor mu, garanti veriyor mu? Bu soruların cevabını bulmak çoğu zaman aylarca süren bir araştırmaya dönüşüyor.

ModülerPazar'ı kurarken tam bu noktadan başladık. Sektörü yakından gözlemlediğimizde şunu gördük: kaliteli üreticiler ve dürüst satıcılar var; ama alıcıların bunlara güvenli, karşılaştırmalı ve şeffaf bir şekilde ulaşabileceği bağımsız bir platform yok.

O platform biz olmak istedik. Ne firmaların reklam aracı, ne de sadece bir liste sitesi. Alıcının yanında duran, doğru kararı vermesine gerçekten yardımcı olan bir yer.`,

  misyon: `Modüler yapı alıcılarının doğru ve güvenilir seçim yapmasına yardımcı olmak. Doğrulanmış firmalar, şeffaf fiyatlar ve karşılaştırmalı teklif sistemiyle bu süreci olabildiğince basit, hızlı ve güvenli hale getirmek.

Bir firmayı önerirken tek ölçütümüz kalite ve güvenilirliktir; reklam bütçesi değil.`,

  vizyon: `Türkiye'de modüler yapı sektöründe referans platform olmak. Firmaların kalitelerini gösterebileceği, alıcıların güvenle karar verebileceği, sektörün şeffaflaşmasına katkı sunacak bir ekosistem kurmak.

Sektörü yakından takip ediyor, her yeni teknolojiyi ve eğilimi platforma yansıtmaya çalışıyoruz. Bu yolda öneri ve geri bildirimleriniz bize her zaman yol gösteriyor.`,

  iletisim: `Bir sorunuz mu var, bir şeylerin daha iyi olabileceğini mi düşünüyorsunuz? Dinlemekten memnuniyet duyarız. Geri bildirimleriniz platformu şekillendiriyor.`,
};

/* ─── Tipler ─────────────────────────────────────────────── */
interface Icerik {
  hikaye:    string;
  misyon:    string;
  vizyon:    string;
  iletisim:  string;
}

/* ─── Nasıl çalışır ──────────────────────────────────────── */
const STEPS = [
  {
    icon:  Search,
    step:  1,
    title: 'İhtiyacını belirle',
    desc:  'Talep oluştur ya da kategorilere göz at. Fiyat hesaplayıcıyla kafandaki bütçeyi netleştir.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon:  FileText,
    step:  2,
    title: 'Firmalardan teklif al',
    desc:  'Beğendiğin 2 firmayı teklif sepetine ekle. Tek formla her ikisine de teklif talebi gönder, yanıtları karşılaştır.',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    icon:  Handshake,
    step:  3,
    title: 'En uygun firmayı seç',
    desc:  'Doğrulanmış rozet, kullanıcı yorumları ve fiyat karşılaştırmasıyla bilinçli bir karar ver. Güvenli iletişim kurun.',
    color: 'bg-purple-100 text-purple-700',
  },
];

/* ─── Değerlerimiz ───────────────────────────────────────── */
const DEGERLER = [
  {
    icon:  ShieldCheck,
    title: 'Güven',
    desc:  'Hem size hem de firmalara karşı dürüst olmak önceliğimizdir. Doğrulanmamış hiçbir firma öne çıkmaz, kullanıcı yorumları filtrelenmez.',
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    icon:  Eye,
    title: 'Şeffaflık',
    desc:  'Fiyatlar, değerlendirmeler, firma bilgileri — hepsini açık tutarız. Sizi yanıltabilecek gizli bir bilgi yoktur.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon:  TrendingUp,
    title: 'Gelişim',
    desc:  'Sektörü yakından takip ediyor, her yeni eğilimi platforma yansıtmaya çalışıyoruz. Geri bildirimlerinize her zaman açığız.',
    color: 'bg-amber-100 text-amber-600',
  },
  {
    icon:  Heart,
    title: 'Müşteri Odaklılık',
    desc:  'Kararınızda size gerçekten yardımcı olup olmadığımızı soruyoruz. Cevap olumsuzsa nedenini anlamak istiyoruz.',
    color: 'bg-rose-100 text-rose-600',
  },
];

/* ─── Yardımcı: metin satırlara böl ─────────────────────── */
function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').filter(Boolean).map((p, i) => (
        <p key={i} className="text-gray-600 leading-relaxed mb-4 last:mb-0">{p}</p>
      ))}
    </>
  );
}

/* ─── Sayfa ──────────────────────────────────────────────── */
export default function HakkimizdaPage() {
  const [icerik,  setIcerik]  = useState<Icerik>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, 'hakkimizda', 'icerik')).then((snap) => {
      if (snap.exists()) {
        setIcerik({ ...DEFAULT, ...(snap.data() as Partial<Icerik>) });
      }
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta
        title="Hakkımızda — ModülerPazar"
        description="ModülerPazar neden kuruldu, nasıl çalışır ve sizi neden tercih etmelisiniz? Hikayemizi, misyonumuzu ve değerlerimizi keşfedin."
        url="/hakkimizda"
      />
      <Header />

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-emerald-700 to-teal-600 text-white py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
              Doğru firmayı bulmak artık çok daha kolay
            </h1>
            <p className="text-emerald-100 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              ModülerPazar, modüler yapı arayanlarla Türkiye'nin dört bir yanındaki
              doğrulanmış üreticileri ve satıcıları bir araya getiriyor. Tarafsız,
              şeffaf ve kullanıcı odaklı.
            </p>
          </div>
        </section>

        {/* ── Hikayemiz ─────────────────────────────────── */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-3xl mx-auto">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 block">
              Hikayemiz
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">
              Neden ModülerPazar?
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : (
              <Paragraphs text={icerik.hikaye} />
            )}
          </div>
        </section>

        {/* ── Misyon + Vizyon ───────────────────────────── */}
        <section className="py-14 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Misyonumuz</h2>
              {loading ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="text-sm">
                  <Paragraphs text={icerik.misyon} />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Vizyonumuz</h2>
              {loading ? (
                <div className="space-y-2">
                  {[1,2].map(i => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="text-sm">
                  <Paragraphs text={icerik.vizyon} />
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ── Nasıl Çalışır ─────────────────────────────── */}
        <section className="py-14 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Nasıl Çalışır?</h2>
              <p className="text-gray-500 mt-2 text-sm">3 adımda hayalinizdeki yapıya ulaşın</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {STEPS.map(({ icon: Icon, step, title, desc, color }) => (
                <div
                  key={step}
                  className="bg-gray-50 border border-gray-100 rounded-2xl p-6 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {step}
                    </span>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Değerlerimiz ──────────────────────────────── */}
        <section className="py-14 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Değerlerimiz</h2>
              <p className="text-gray-500 mt-2 text-sm">Platformu inşa ederken bizi yönlendiren ilkeler</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {DEGERLER.map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="flex gap-4 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── İletişim CTA ──────────────────────────────── */}
        <section className="py-14 px-4 bg-emerald-700 text-white">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-3">Bir şey sormak ister misiniz?</h2>
            {loading ? (
              <div className="h-4 bg-white/20 rounded animate-pulse max-w-sm mx-auto mb-5" />
            ) : (
              <p className="text-emerald-100 text-sm mb-6 leading-relaxed max-w-md mx-auto">
                {icerik.iletisim}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:modulerpazar@yandex.com"
                className="inline-flex items-center justify-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition text-sm"
              >
                <Mail className="w-4 h-4" />
                modulerpazar@yandex.com
              </a>
              <Link
                to="/talep-olustur"
                className="inline-flex items-center justify-center gap-2 border border-white/50 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/10 transition text-sm"
              >
                Ücretsiz Teklif Al <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      <div className="max-w-4xl mx-auto px-4 py-4 w-full">
        <nav className="text-xs text-gray-400 flex items-center gap-1.5">
          <Link to="/" className="hover:text-emerald-600 transition">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-600">Hakkımızda</span>
        </nav>
      </div>

      <Footer />
    </div>
  );
}
