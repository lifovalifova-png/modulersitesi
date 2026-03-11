import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, getDoc, arrayUnion, Timestamp,
} from 'firebase/firestore';
import { toast } from 'sonner';
import {
  Building2, Bell, CheckCircle, XCircle, Phone, Mail,
  MapPin, Tag, Banknote, FileText, ChevronDown, ChevronUp, User,
  Package, AlertTriangle,
} from 'lucide-react';
import { type Ilan, formatFiyat } from '../hooks/useIlanlar';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/categories';
import Header from '../components/Header';
import Footer from '../components/Footer';

/* ─── Sabitler ────────────────────────────────────────────── */
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

const BUDGET_LABELS: Record<string, string> = {
  '50k_alti':  '50.000 ₺ altı',
  '50k_100k':  '50.000 – 100.000 ₺',
  '100k_250k': '100.000 – 250.000 ₺',
  '250k_ustu': '250.000 ₺ üzeri',
};

/* ─── Tipler ──────────────────────────────────────────────── */
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
  firmaKabulEdenler: string[];
}

interface BildirimWithTalep {
  id: string;
  talepId: string;
  firmaId: string;
  status: 'beklemede' | 'kabul' | 'red';
  tarih: { seconds: number } | null;
  talep: TalepData | null;
}

type FilterTab = 'beklemede' | 'kabul' | 'red';

/* ─── Acil Satış form state (per-ilan) ───────────────────── */
interface AcilForm {
  enabled: boolean;
  fiyat: string;
  bitis: string;
  neden: string;
}

/* ─── Sayfa ───────────────────────────────────────────────── */
export default function FirmaPaneliPage() {
  const navigate                    = useNavigate();
  const { currentUser, role, loading } = useAuth();
  const [bildirimler, setBildirimler] = useState<BildirimWithTalep[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [filter,      setFilter]      = useState<FilterTab>('beklemede');
  const [expanded,    setExpanded]    = useState<Set<string>>(new Set());
  const [processing,  setProcessing]  = useState<string | null>(null);
  /* Talep cache: daha önce çekilen talepları saklar, snapshot güncellemelerinde
     yeniden Firestore'a gitmez — N+1 sorguyu O(yeni) okumaya düşürür. */
  const talepCache = useRef<Record<string, TalepData>>({});

  /* İlanlarım */
  const [firmaIlanlar,  setFirmaIlanlar]  = useState<Ilan[]>([]);
  const [acilForms,     setAcilForms]     = useState<Record<string, AcilForm>>({});
  const [acilSaving,    setAcilSaving]    = useState<string | null>(null);
  const [ilanLimit,     setIlanLimit]     = useState(3);

  /* ── Auth guard ─────────────────────────────────────────── */
  useEffect(() => {
    if (!loading && role !== 'seller') {
      navigate('/', { replace: true });
    }
  }, [role, loading, navigate]);

  /* ── Firma ilanları ──────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser || role !== 'seller') return;
    const q = query(collection(db, 'ilanlar'), where('firmaId', '==', currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ilan));
      setFirmaIlanlar(docs);
      setAcilForms((prev) => {
        const next = { ...prev };
        docs.forEach((ilan) => {
          if (!next[ilan.id]) {
            next[ilan.id] = {
              enabled: ilan.acilSatis ?? false,
              fiyat:   ilan.acilSatisFiyat ? String(ilan.acilSatisFiyat) : '',
              bitis:   ilan.acilSatisBitis
                ? new Date(ilan.acilSatisBitis.seconds * 1000).toISOString().slice(0, 10)
                : '',
              neden:   ilan.acilSatisNedeni ?? '',
            };
          }
        });
        return next;
      });
    });
    return unsub;
  }, [currentUser, role]);

  /* ── Bildirimler ─────────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser || role !== 'seller') return;

    const q = query(
      collection(db, 'bildirimler'),
      where('firmaId', '==', currentUser.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as BildirimWithTalep[];

      /* Talep verilerini çek — sadece cache'de olmayanlar */
      const talepIds  = [...new Set(docs.map((b) => b.talepId))];
      const missingIds = talepIds.filter((id) => !talepCache.current[id]);

      if (missingIds.length > 0) {
        await Promise.all(
          missingIds.map(async (talepId) => {
            const talepSnap = await getDoc(doc(db, 'taleplar', talepId));
            if (talepSnap.exists()) {
              talepCache.current[talepId] = talepSnap.data() as TalepData;
            }
          }),
        );
      }

      setBildirimler(
        docs.map((b) => ({ ...b, talep: talepCache.current[b.talepId] ?? null })),
      );
      setDataLoading(false);
    });

    return unsub;
  }, [currentUser, role]);

  /* ── İlan limiti ─────────────────────────────────────────── */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'limits'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { ilanLimit?: number };
        if (data.ilanLimit) setIlanLimit(data.ilanLimit);
      }
    });
    return unsub;
  }, []);

  /* ── Kabul Et ───────────────────────────────────────────── */
  const handleKabul = async (bildirim: BildirimWithTalep) => {
    setProcessing(bildirim.id);
    try {
      await updateDoc(doc(db, 'bildirimler', bildirim.id), { status: 'kabul' });
      await updateDoc(doc(db, 'taleplar', bildirim.talepId), {
        firmaKabulEdenler: arrayUnion(currentUser!.uid),
      });
      toast.success('Talep kabul edildi. Müşteri bilgileri açıldı.');
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    } finally {
      setProcessing(null);
    }
  };

  /* ── Reddet ─────────────────────────────────────────────── */
  const handleReddet = async (bildirimId: string) => {
    setProcessing(bildirimId);
    try {
      await updateDoc(doc(db, 'bildirimler', bildirimId), { status: 'red' });
      toast.info('Talep reddedildi.');
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    } finally {
      setProcessing(null);
    }
  };

  /* ── Acil Satış kaydet ───────────────────────────────────── */
  const handleAcilSave = async (ilan: Ilan) => {
    const form = acilForms[ilan.id];
    if (!form) return;
    const fiyat = Number(form.fiyat);
    if (!form.bitis) { toast.error('Bitiş tarihi zorunludur.'); return; }
    if (!fiyat || fiyat <= 0) { toast.error('Geçerli bir fiyat girin.'); return; }
    if (fiyat >= ilan.fiyat) { toast.error('Acil satış fiyatı normal fiyattan düşük olmalıdır.'); return; }
    const bitisDate = new Date(form.bitis + 'T23:59:59');
    if (bitisDate <= new Date()) { toast.error('Bitiş tarihi gelecekte olmalıdır.'); return; }
    setAcilSaving(ilan.id);
    try {
      await updateDoc(doc(db, 'ilanlar', ilan.id), {
        acilSatis:       true,
        acilSatisFiyat:  fiyat,
        acilSatisBitis:  Timestamp.fromDate(bitisDate),
        acilSatisNedeni: form.neden || null,
      });
      toast.success('Acil satış aktifleştirildi.');
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setAcilSaving(null);
    }
  };

  const handleAcilKaldir = async (ilanId: string) => {
    setAcilSaving(ilanId);
    try {
      await updateDoc(doc(db, 'ilanlar', ilanId), {
        acilSatis:       false,
        acilSatisFiyat:  null,
        acilSatisBitis:  null,
        acilSatisNedeni: null,
      });
      setAcilForms((prev) => ({
        ...prev,
        [ilanId]: { enabled: false, fiyat: '', bitis: '', neden: '' },
      }));
      toast.info('Acil satış kaldırıldı.');
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    } finally {
      setAcilSaving(null);
    }
  };

  /* ── Expand toggle ──────────────────────────────────────── */
  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  /* ── Loading / guard ────────────────────────────────────── */
  if (loading || (role !== 'seller' && !loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  /* ── Veriler ─────────────────────────────────────────────── */
  const counts = {
    beklemede: bildirimler.filter((b) => b.status === 'beklemede').length,
    kabul:     bildirimler.filter((b) => b.status === 'kabul').length,
    red:       bildirimler.filter((b) => b.status === 'red').length,
  };

  const filtered = bildirimler.filter((b) => b.status === filter);

  const tabCls = (t: FilterTab) =>
    `px-4 py-2 rounded-full text-xs font-semibold transition ${
      filter === t
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  const formatDate = (tarih: { seconds: number } | null) => {
    if (!tarih) return '—';
    return new Date(tarih.seconds * 1000).toLocaleDateString('tr-TR');
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto px-4">

          {/* Başlık */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Firma Paneli</h1>
              <p className="text-sm text-gray-500">Gelen proje talepleri ve müşteri teklifleri</p>
            </div>
          </div>

          {/* İstatistik kartları */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Yeni Talepler', count: counts.beklemede, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
              { label: 'Kabul Ettiklerim', count: counts.kabul,     color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Reddettiklerim',  count: counts.red,       color: 'text-gray-500',    bg: 'bg-gray-50 border-gray-200' },
            ].map((s) => (
              <div key={s.label} className={`border rounded-xl p-4 text-center ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* ── İlanlarım ─────────────────────────────────── */}
          {firmaIlanlar.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                <Package className="w-4 h-4 text-emerald-600" />
                <h2 className="font-semibold text-gray-800 text-sm">İlanlarım</h2>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                  firmaIlanlar.length >= ilanLimit
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {firmaIlanlar.length} / {ilanLimit} ilan
                </span>
                {firmaIlanlar.length < ilanLimit ? (
                  <Link
                    to="/satici-formu"
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium flex items-center gap-1"
                  >
                    <span>+</span> Yeni İlan
                  </Link>
                ) : (
                  <span
                    title="İlan limitinize ulaştınız"
                    className="text-xs bg-gray-200 text-gray-400 px-3 py-1.5 rounded-lg cursor-not-allowed font-medium flex items-center gap-1"
                  >
                    + Yeni İlan
                  </span>
                )}
              </div>
              {firmaIlanlar.length >= ilanLimit && (
                <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                  <p className="font-semibold text-amber-800">İlan limitinize ulaştınız</p>
                  <p className="text-amber-700 text-xs mt-0.5">
                    Ücretsiz planda en fazla {ilanLimit} ilan yayınlayabilirsiniz.
                    Daha fazla ilan için yakında gelecek ücretli planlarımıza göz atın.
                  </p>
                </div>
              )}
              <div className="divide-y divide-gray-100">
                {firmaIlanlar.map((ilan) => {
                  const form   = acilForms[ilan.id] ?? { enabled: false, fiyat: '', bitis: '', neden: '' };
                  const isBusy = acilSaving === ilan.id;
                  const today  = new Date().toISOString().slice(0, 10);

                  return (
                    <div key={ilan.id} className="p-4">
                      {/* Başlık satırı */}
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 text-sm leading-snug truncate max-w-xs">{ilan.baslik}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatFiyat(ilan.fiyat)}</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={form.enabled}
                            onChange={(e) => {
                              const enabled = e.target.checked;
                              setAcilForms((prev) => ({
                                ...prev,
                                [ilan.id]: { ...form, enabled },
                              }));
                              if (!enabled) handleAcilKaldir(ilan.id);
                            }}
                            className="w-4 h-4 rounded text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Acil Satılık</span>
                        </label>
                      </div>

                      {/* Acil form — sadece enabled ise */}
                      {form.enabled && (
                        <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                          {/* Önizleme badge */}
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                              🔴 ACİL SATILIK
                              {form.fiyat && ` — ${Number(form.fiyat).toLocaleString('tr-TR')} ₺`}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Acil fiyat */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Acil Satış Fiyatı (₺) <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={ilan.fiyat - 1}
                                value={form.fiyat}
                                onChange={(e) => setAcilForms((prev) => ({ ...prev, [ilan.id]: { ...form, fiyat: e.target.value } }))}
                                placeholder={`Normal: ${ilan.fiyat.toLocaleString('tr-TR')} ₺`}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                              />
                            </div>
                            {/* Bitiş tarihi */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Geçerlilik Tarihi <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="date"
                                min={today}
                                value={form.bitis}
                                onChange={(e) => setAcilForms((prev) => ({ ...prev, [ilan.id]: { ...form, bitis: e.target.value } }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                              />
                            </div>
                          </div>

                          {/* Neden */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Neden acil? (opsiyonel)</label>
                            <input
                              type="text"
                              value={form.neden}
                              onChange={(e) => setAcilForms((prev) => ({ ...prev, [ilan.id]: { ...form, neden: e.target.value } }))}
                              placeholder="Örn: Stok erken tükenecek, fiyat artmadan alın"
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleAcilSave(ilan)}
                              disabled={isBusy}
                              className="flex items-center gap-1.5 bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-60 font-medium"
                            >
                              {isBusy
                                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <AlertTriangle className="w-3.5 h-3.5" />
                              }
                              Kaydet
                            </button>
                            <p className="text-xs text-gray-400">Normal fiyat: {formatFiyat(ilan.fiyat)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtre sekmeleri */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilter('beklemede')} className={tabCls('beklemede')}>
              Yeni Talepler {counts.beklemede > 0 && `(${counts.beklemede})`}
            </button>
            <button onClick={() => setFilter('kabul')} className={tabCls('kabul')}>
              Kabul Ettiklerim {counts.kabul > 0 && `(${counts.kabul})`}
            </button>
            <button onClick={() => setFilter('red')} className={tabCls('red')}>
              Reddettiklerim
            </button>
          </div>

          {/* İçerik */}
          {dataLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
              <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {filter === 'beklemede' ? 'Henüz yeni talep yok.' :
                 filter === 'kabul'     ? 'Henüz kabul ettiğiniz talep yok.' :
                                          'Reddedilen talep yok.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((bildirim) => {
                const talep    = bildirim.talep;
                const isOpen   = expanded.has(bildirim.id);
                const isKabul  = bildirim.status === 'kabul';
                const isBusy   = processing === bildirim.id;

                return (
                  <div
                    key={bildirim.id}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                      isKabul ? 'border-emerald-200' : 'border-gray-100'
                    }`}
                  >
                    {/* Kart başlığı */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex flex-wrap gap-2 items-center">
                          {/* Kategori */}
                          <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                            <Tag className="w-3 h-3" />
                            {talep ? CAT_MAP[talep.kategori] ?? talep.kategori : '—'}
                          </span>
                          {/* Şehir */}
                          {talep?.sehir && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                              <MapPin className="w-3 h-3" />
                              {talep.sehir}{talep.ilce ? ` / ${talep.ilce}` : ''}
                            </span>
                          )}
                          {/* Bütçe */}
                          {talep?.butce && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                              <Banknote className="w-3 h-3" />
                              {BUDGET_LABELS[talep.butce] ?? talep.butce}
                            </span>
                          )}
                          {/* Kabul rozeti */}
                          {isKabul && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full font-semibold">
                              <CheckCircle className="w-3 h-3" /> Kabul Edildi
                            </span>
                          )}
                        </div>

                        {/* Tarih */}
                        <p className="text-xs text-gray-400">{formatDate(bildirim.tarih)}</p>
                      </div>

                      {/* Açıklama */}
                      {talep?.aciklama && (
                        <p className="mt-3 text-sm text-gray-600 line-clamp-2 leading-relaxed">
                          {talep.aciklama}
                        </p>
                      )}

                      {/* Metrekare / teslim */}
                      {(talep?.metrekare || talep?.teslimTarihi) && (
                        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
                          {talep.metrekare && (
                            <span><strong className="text-gray-600">Boyut:</strong> {talep.metrekare}</span>
                          )}
                          {talep.teslimTarihi && (
                            <span><strong className="text-gray-600">Teslim:</strong> {talep.teslimTarihi}</span>
                          )}
                        </div>
                      )}

                      {/* Kabul → Müşteri bilgileri */}
                      {isKabul && talep && (
                        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            Müşteri İletişim Bilgileri
                          </p>
                          <div className="space-y-2">
                            <p className="flex items-center gap-2 text-sm text-gray-700">
                              <User className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <strong>{talep.ad}</strong>
                            </p>
                            <a
                              href={`tel:${talep.telefon}`}
                              className="flex items-center gap-2 text-sm text-emerald-700 hover:underline"
                            >
                              <Phone className="w-4 h-4 flex-shrink-0" />
                              {talep.telefon}
                            </a>
                            <a
                              href={`mailto:${talep.email}`}
                              className="flex items-center gap-2 text-sm text-emerald-700 hover:underline"
                            >
                              <Mail className="w-4 h-4 flex-shrink-0" />
                              {talep.email}
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Detay aç/kapat */}
                      <button
                        onClick={() => toggleExpand(bildirim.id)}
                        className="mt-3 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {isOpen ? 'Detayı Kapat' : 'Tüm Detayları Gör'}
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Genişletilmiş detay */}
                      {isOpen && talep && (
                        <div className="mt-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1.5">
                          <p><strong>Kategori:</strong> {CAT_MAP[talep.kategori] ?? talep.kategori}</p>
                          <p><strong>Şehir / İlçe:</strong> {talep.sehir}{talep.ilce ? ` — ${talep.ilce}` : ''}</p>
                          <p><strong>Bütçe:</strong> {BUDGET_LABELS[talep.butce] ?? talep.butce}</p>
                          {talep.metrekare  && <p><strong>Boyut:</strong> {talep.metrekare}</p>}
                          {talep.teslimTarihi && <p><strong>Teslim Tarihi:</strong> {talep.teslimTarihi}</p>}
                          <p><strong>Açıklama:</strong> {talep.aciklama}</p>
                        </div>
                      )}
                    </div>

                    {/* Eylem butonları — sadece beklemede */}
                    {bildirim.status === 'beklemede' && (
                      <div className="border-t border-gray-100 px-5 py-3 flex gap-3 bg-gray-50">
                        <button
                          onClick={() => handleKabul(bildirim)}
                          disabled={isBusy}
                          className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white text-sm py-2 rounded-lg font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                          {isBusy
                            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckCircle className="w-4 h-4" />
                          }
                          Kabul Et — Müşteri Bilgilerini Al
                        </button>
                        <button
                          onClick={() => handleReddet(bildirim.id)}
                          disabled={isBusy}
                          className="flex items-center justify-center gap-2 border border-gray-300 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reddet
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bildirim ekranı alt yardımcı */}
          <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <strong>Nasıl çalışır?</strong> Müşteriler projeleri için teklif talep ettiğinde platform
            size bildirim gönderir. "Kabul Et" seçeneğiyle müşterinin iletişim bilgilerini görüntüleyerek
            doğrudan teklif iletebilirsiniz.
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-sm text-gray-400 hover:text-emerald-600 transition">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
