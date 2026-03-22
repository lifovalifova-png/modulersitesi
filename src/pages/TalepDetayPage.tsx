import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  collection, query, where, onSnapshot, doc, getDoc, updateDoc,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  FileText, CheckCircle, XCircle, Clock, Banknote,
  Building2, MapPin, Tag, ArrowLeft,
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useLanguage } from '../context/LanguageContext';
import { sendTeklifKabulEmail } from '../lib/emailjs';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { CATEGORIES } from '../data/categories';

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

const BUDGET_LABELS: Record<string, string> = {
  '50k_alti':  '50.000 ₺ altı',
  '50k_100k':  '50.000 – 100.000 ₺',
  '100k_250k': '100.000 – 250.000 ₺',
  '250k_ustu': '250.000 ₺ üzeri',
};

interface TalepData {
  kategori: string;
  sehir: string;
  ilce: string;
  butce: string;
  metrekare: string;
  aciklama: string;
  teslimTarihi: string;
  ad: string;
  telefon: string;
  email: string;
  status: string;
}

interface Teklif {
  id: string;
  talepId: string;
  firmaId: string;
  firmaAdi: string;
  fiyat: number;
  aciklama: string;
  teslimSuresi: string;
  durum: 'beklemede' | 'kabul' | 'red';
  tarih: { seconds: number } | null;
}

export default function TalepDetayPage() {
  const { talepId } = useParams<{ talepId: string }>();
  const { t } = useLanguage();
  const [talep, setTalep] = useState<TalepData | null>(null);
  const [teklifler, setTeklifler] = useState<Teklif[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  /* Talep verisini çek */
  useEffect(() => {
    if (!talepId) return;
    getDoc(doc(db, 'taleplar', talepId)).then((snap) => {
      if (snap.exists()) setTalep(snap.data() as TalepData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [talepId]);

  /* Teklifleri dinle */
  useEffect(() => {
    if (!talepId) return;
    const q = query(collection(db, 'teklifler'), where('talepId', '==', talepId));
    const unsub = onSnapshot(q, (snap) => {
      setTeklifler(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Teklif))
          .sort((a, b) => (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0)),
      );
    });
    return unsub;
  }, [talepId]);

  /* Teklifi kabul et */
  const handleKabul = async (teklif: Teklif) => {
    setProcessing(teklif.id);
    try {
      await updateDoc(doc(db, 'teklifler', teklif.id), { durum: 'kabul' });

      // Firma e-postasını al
      const firmaSnap = await getDoc(doc(db, 'firms', teklif.firmaId));
      const firmaData = firmaSnap.exists() ? firmaSnap.data() : null;
      const firmaEmail = firmaData?.eposta || firmaData?.email || '';

      if (firmaEmail && talep) {
        sendTeklifKabulEmail({
          firmaEmail,
          firmaAdi:    teklif.firmaAdi,
          musteriAd:   talep.ad,
          musteriTel:  talep.telefon,
          musteriEmail: talep.email,
          fiyat:       teklif.fiyat,
        }).catch(() => { /* sessizce geç */ });
      }

      toast.success(t('teklif.accepted'));
    } catch {
      toast.error(t('teklif.error'));
    } finally {
      setProcessing(null);
    }
  };

  /* Teklifi reddet */
  const handleReddet = async (teklifId: string) => {
    setProcessing(teklifId);
    try {
      await updateDoc(doc(db, 'teklifler', teklifId), { durum: 'red' });
      toast.info(t('teklif.rejected'));
    } catch {
      toast.error(t('teklif.error'));
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (tarih: { seconds: number } | null) => {
    if (!tarih) return '—';
    return new Date(tarih.seconds * 1000).toLocaleDateString('tr-TR');
  };

  const durumBadge = (durum: Teklif['durum']) => {
    const map = {
      beklemede: 'bg-amber-100 text-amber-700',
      kabul:     'bg-emerald-100 text-emerald-700',
      red:       'bg-red-100 text-red-600',
    };
    const label = {
      beklemede: t('teklif.statusPending'),
      kabul:     t('teklif.statusAccepted'),
      red:       t('teklif.statusRejected'),
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[durum]}`}>
        {label[durum]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!talep) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('teklif.notFound')}</p>
            <Link to="/" className="text-emerald-600 hover:underline text-sm mt-2 inline-block">{t('firmaPanel.backHome')}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-3xl mx-auto px-4">

          {/* Geri dön */}
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 transition mb-6">
            <ArrowLeft className="w-4 h-4" /> {t('firmaPanel.backHome')}
          </Link>

          {/* Talep Özeti */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <h1 className="text-lg font-bold text-gray-900 mb-4">{t('teklif.myRequest')}</h1>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
              <p className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <strong>{t('firmaPanel.detailCategory')}</strong> {CAT_MAP[talep.kategori] ?? talep.kategori}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                <strong>{t('firmaPanel.detailCity')}</strong> {talep.sehir}{talep.ilce ? ` — ${talep.ilce}` : ''}
              </p>
              <p className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-500" />
                <strong>{t('firmaPanel.detailBudget')}</strong> {BUDGET_LABELS[talep.butce] ?? talep.butce}
              </p>
              {talep.metrekare && (
                <p><strong>{t('firmaPanel.detailSize')}</strong> {talep.metrekare}</p>
              )}
              {talep.teslimTarihi && (
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <strong>{t('firmaPanel.detailDelivery')}</strong> {talep.teslimTarihi}
                </p>
              )}
            </div>
            {talep.aciklama && (
              <p className="mt-3 text-sm text-gray-600"><strong>{t('firmaPanel.detailDesc')}</strong> {talep.aciklama}</p>
            )}
          </div>

          {/* Gelen Teklifler */}
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('teklif.incomingOffers')} ({teklifler.length})
          </h2>

          {teklifler.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
              <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">{t('teklif.noOffers')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teklifler.map((teklif) => {
                const isBusy = processing === teklif.id;
                return (
                  <div key={teklif.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5">
                      {/* Firma bilgisi */}
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                          <span className="font-semibold text-gray-900">{teklif.firmaAdi}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {durumBadge(teklif.durum)}
                          <span className="text-xs text-gray-400">{formatDate(teklif.tarih)}</span>
                        </div>
                      </div>

                      {/* Fiyat + teslim süresi */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
                          <p className="text-xs text-emerald-600">{t('teklif.price')}</p>
                          <p className="text-lg font-bold text-emerald-700">{teklif.fiyat.toLocaleString('tr-TR')} ₺</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                          <p className="text-xs text-blue-600">{t('teklif.deliveryTime')}</p>
                          <p className="text-sm font-semibold text-blue-700">{teklif.teslimSuresi}</p>
                        </div>
                      </div>

                      {/* Açıklama */}
                      <p className="text-sm text-gray-600">{teklif.aciklama}</p>
                    </div>

                    {/* Kabul / Red butonları */}
                    {teklif.durum === 'beklemede' && (
                      <div className="border-t border-gray-100 px-5 py-3 flex gap-3 bg-gray-50">
                        <button
                          onClick={() => handleKabul(teklif)}
                          disabled={isBusy}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {isBusy
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckCircle className="w-4 h-4" />
                          }
                          {t('teklif.acceptBtn')}
                        </button>
                        <button
                          onClick={() => handleReddet(teklif.id)}
                          disabled={isBusy}
                          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {t('teklif.rejectBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
