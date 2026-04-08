import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  onAuthStateChanged,
  signOut,
  type User,
} from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
  getDocs,
  query,
  where,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { CATEGORIES } from '../data/categories';
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts';
import { toast } from 'sonner';
import {
  LayoutDashboard, Settings, Zap, Building2 as BuildingIcon,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle,
  Save, X, Menu, ShieldCheck, Clock, Link as LinkIcon,
  Send, Eye, EyeOff, MapPin, Tag, Banknote, FileText, ChevronDown, ChevronUp,
  Inbox, BookOpen, BarChart2, Download, Sliders, Star, ThumbsUp, Flame,
  Facebook, Instagram, Twitter, Linkedin, Youtube, Newspaper, Bot,
} from 'lucide-react';
import { type FeatureFlags, DEFAULT_FLAGS } from '../hooks/useFeatureFlags';
import SEOMeta from '../components/SEOMeta';
import logoSrc from '../assets/logo.svg';
import { auth, db } from '../lib/firebase';
import { seedFirestore, clearSeedData } from '../scripts/seedFirestore';
import { sendFirmaOnayEmail } from '../lib/emailjs';
import {
  BarChart   as _BarChart,
  Bar        as _Bar,
  XAxis      as _XAxis,
  YAxis      as _YAxis,
  Tooltip    as _Tooltip,
  ResponsiveContainer as _ResponsiveContainer,
} from 'recharts';

/* Recharts 2.x + React 18 TypeScript compat — cast to any */
/* eslint-disable @typescript-eslint/no-explicit-any */
const BarChart            = _BarChart            as any;
const Bar                 = _Bar                 as any;
const XAxis               = _XAxis               as any;
const YAxis               = _YAxis               as any;
const Tooltip             = _Tooltip             as any;
const ResponsiveContainer = _ResponsiveContainer as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ═══════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */
interface SiteSettings {
  name:         string;
  tagline:      string;
  email:        string;
  destekSuresi: string;
  logoUrl:      string;
}

interface AdminFlashDeal {
  id?:            string;
  title:          string;
  location:       string;
  price:          string;
  originalPrice:  string;
  image:          string;
  category:       string;
  urgent:         boolean;
  discount:       number;
}

interface AdminFirm {
  id?:         string;
  name:        string;
  category:    string;
  city:        string;
  address:     string;
  phone:       string;
  verified:    boolean;
  status:      'pending' | 'approved' | 'rejected';
  /* SellerFormPage alanları */
  userId?:     string;
  sehir?:      string;
  kategoriler?: string[];
}

interface AdminTalep {
  id?:                  string;
  kategori:             string;
  sehir:                string;
  ilce:                 string;
  butce:                string;
  metrekare:            string;
  aciklama:             string;
  teslimTarihi:         string;
  fotograflar:          string[];
  ad:                   string;
  telefon:              string;
  email:                string;
  status:               'beklemede' | 'iletildi' | 'tamamlandi';
  firmaGonderilenler:   string[];
  firmaKabulEdenler:    string[];
  tarih:                { seconds: number } | null;
}

interface AdminIlan {
  id?:               string;
  baslik:            string;
  kategori:          string;
  kategoriSlug:      string;
  sehir:             string;
  fiyat:             number;
  aciklama:          string;
  firmaAdi:          string;
  firmaId:           string;
  firmaDogrulanmis:  boolean;
  gorseller:         string[];
  acil:              boolean;
  indirimli:         boolean;
  status:            'aktif' | 'pasif';
  acilSatis?:        boolean;
  acilSatisFiyat?:   number;
  acilSatisNedeni?:  string;
  acilSatisBitis?:   { seconds: number; nanoseconds: number } | null;
  ilanBitis?:        { seconds: number; nanoseconds: number } | null;
  yenilenmeSayisi?:  number;
  aktif?:            boolean;
}

type TabKey = 'overview' | 'settings' | 'flashDeals' | 'ilanlar' | 'firms' | 'talepler' | 'blog' | 'rapor' | 'features' | 'yorumlar' | 'hakkimizda' | 'acilIlanlar' | 'geriBildirimler' | 'haberler';
type FirmStatus  = 'all' | 'pending' | 'approved' | 'rejected';
type TalepStatus = 'all' | 'beklemede' | 'iletildi' | 'tamamlandi';

interface PendingCounts {
  talepler:        number;
  firms:           number;
  yorumlar:        number;
  quotes:          number;
  geriBildirimler: number;
  haberTaslak:     number;
}

/* ═══════════════════════════════════════════════════════════
   SHARED LOOKUP MAPS
════════════════════════════════════════════════════════════ */
const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name]));

const BUDGET_LABELS: Record<string, string> = {
  '50k_alti':  '50K ₺ altı',
  '50k_100k':  '50K – 100K ₺',
  '100k_250k': '100K – 250K ₺',
  '250k_ustu': '250K+ ₺',
};

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════════════════ */
const DEAL_CATEGORIES = [
  'Prefabrik', 'Yaşam Konteynerleri', 'Tiny House',
  'Çelik Yapılar', 'Ahşap Yapılar', 'Özel Projeler', '2. El',
];

const EMPTY_DEAL: Omit<AdminFlashDeal, 'id'> = {
  title: '', location: '', price: '', originalPrice: '',
  image: '', category: 'Prefabrik', urgent: false, discount: 0,
};

const EMPTY_ILAN: Omit<AdminIlan, 'id'> = {
  baslik: '', kategori: 'Prefabrik', kategoriSlug: 'prefabrik',
  sehir: '', fiyat: 0, aciklama: '',
  firmaAdi: '', firmaId: '', firmaDogrulanmis: false,
  gorseller: [], acil: false, indirimli: false, status: 'aktif',
};

const DEFAULT_SETTINGS: SiteSettings = {
  name: 'ModülerPazar', tagline: 'Türkiye\'nin En Büyük Modüler Yapı Pazarı',
  email: 'modulerpazar@yandex.com', destekSuresi: '3-5 iş günü', logoUrl: '',
};

interface SosyalMedya {
  linkedin:  string;
  instagram: string;
  facebook:  string;
  twitter:   string;
  youtube:   string;
}

const DEFAULT_SOSYAL: SosyalMedya = {
  linkedin:  'https://linkedin.com/company/modulerpazar',
  instagram: '',
  facebook:  '',
  twitter:   '',
  youtube:   '',
};

/* ═══════════════════════════════════════════════════════════
   SHARED UI
════════════════════════════════════════════════════════════ */
function StatCard({ label, value, sub, color }: {
  label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ status }: { status: AdminFirm['status'] }) {
  const map = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
  };
  const label = { pending: 'Bekliyor', approved: 'Onaylı', rejected: 'Reddedildi' };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {label[status]}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB — HAKKIMIZDA
════════════════════════════════════════════════════════════ */
const HAKKIMIZDA_DEFAULTS = {
  hikaye:   'Modüler yapı almaya karar verdiğinizde önünüzde onlarca seçenek beliriyor...',
  misyon:   'Modüler yapı alıcılarının doğru ve güvenilir seçim yapmasına yardımcı olmak.',
  vizyon:   'Türkiye\'de modüler yapı sektöründe referans platform olmak.',
  iletisim: 'Bir sorunuz mu var, bir şeylerin daha iyi olabileceğini mi düşünüyorsunuz? Dinlemekten memnuniyet duyarız.',
};

function HakkimizdaTab() {
  const [form,    setForm]    = useState(HAKKIMIZDA_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    import('firebase/firestore').then(({ doc: fsDoc, getDoc: fsGetDoc }) => {
      fsGetDoc(fsDoc(db, 'hakkimizda', 'icerik')).then((snap) => {
        if (snap.exists()) {
          setForm({ ...HAKKIMIZDA_DEFAULTS, ...(snap.data() as typeof HAKKIMIZDA_DEFAULTS) });
        }
      }).finally(() => setLoading(false));
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const { doc: fsDoc, setDoc: fsSetDoc } = await import('firebase/firestore');
      await fsSetDoc(fsDoc(db, 'hakkimizda', 'icerik'), form, { merge: true });
      toast.success('Hakkımızda içeriği kaydedildi.');
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  const FIELDS: { key: keyof typeof HAKKIMIZDA_DEFAULTS; label: string; rows: number }[] = [
    { key: 'hikaye',   label: 'Hikayemiz',    rows: 8  },
    { key: 'misyon',   label: 'Misyonumuz',   rows: 5  },
    { key: 'vizyon',   label: 'Vizyonumuz',   rows: 5  },
    { key: 'iletisim', label: 'İletişim Metni', rows: 3 },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-1">Hakkımızda İçeriği</h2>
      <p className="text-sm text-gray-500 mb-6">
        Buraya kaydettiğiniz metinler /hakkimizda sayfasında görünür. Boş bırakırsanız varsayılan içerik gösterilir.
      </p>

      {loading ? (
        <div className="space-y-4">
          {[80, 48, 48, 32].map((h, i) => (
            <div key={i} className={`h-${h} bg-gray-100 rounded-xl animate-pulse`} />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {FIELDS.map(({ key, label, rows }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
              <textarea
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                rows={rows}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                placeholder={HAKKIMIZDA_DEFAULTS[key]}
              />
              <p className="text-xs text-gray-400 mt-0.5">
                İki paragraf arası için boş satır bırakın.
              </p>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB — YORUMLAR
════════════════════════════════════════════════════════════ */
interface AdminYorum {
  id: string;
  firmaId: string;
  userId: string;
  userName?: string;
  puan: number;
  aciklama?: string;
  tarih: { seconds: number } | null;
}

function YorumlarTab() {
  const [yorumlar, setYorumlar] = useState<AdminYorum[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'yorumlar'), (snap) => {
      setYorumlar(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AdminYorum))
          .sort((a, b) => (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0)),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  async function silPuan(id: string) {
    await deleteDoc(doc(db, 'yorumlar', id));
    toast.success('Puan silindi');
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>;

  return (
    <div className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800">Müşteri Puanları</h2>
        <p className="text-sm text-gray-500 mt-0.5">{yorumlar.length} değerlendirme</p>
      </div>

      {yorumlar.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <ThumbsUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Henüz değerlendirme yok.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {yorumlar.map((y) => (
            <div key={y.id} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-800">{y.userName || 'Kullanıcı'}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < y.puan ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">
                    Firma ID: {y.firmaId} ·{' '}
                    {y.tarih ? new Date(y.tarih.seconds * 1000).toLocaleDateString('tr-TR') : ''}
                  </p>
                  {y.aciklama && (
                    <p className="text-sm text-gray-700 leading-relaxed">{y.aciklama}</p>
                  )}
                </div>
                <button
                  onClick={() => silPuan(y.id)}
                  className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-lg transition flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FEATURE FLAGS — sabit tanımlar
════════════════════════════════════════════════════════════ */
interface FeatureDef {
  key:         keyof FeatureFlags;
  label:       string;
  description: string;
  tier:        'Ücretsiz' | 'Ücretli';
}

const FEATURE_DEFS: FeatureDef[] = [
  {
    key:         'aiAsistan',
    label:       'AI Yapı Asistanı',
    description: 'Ana sayfadaki yapay zeka chat widget\'ı.',
    tier:        'Ücretsiz',
  },
  {
    key:         'teklifSepeti',
    label:       'Teklif Sepeti',
    description: 'Kullanıcıların aynı anda 2 firmadan teklif alması.',
    tier:        'Ücretsiz',
  },
  {
    key:         'talepHavuzu',
    label:       'Talep Havuzu',
    description: 'Müşteri taleplerini onaylı firmalara iletme.',
    tier:        'Ücretsiz',
  },
  {
    key:         'onecikarIlan',
    label:       'Öne Çıkar İlan',
    description: 'Firma ilanını liste başına taşıma (ücretli özellik).',
    tier:        'Ücretli',
  },
  {
    key:         'sinirsizTalep',
    label:       'Sınırsız Talep',
    description: 'Günlük talep limitini kaldırma (ücretli özellik).',
    tier:        'Ücretli',
  },
  {
    key:         'puanlamaSistemi',
    label:       'Puanlama Sistemi',
    description: 'Onaylı müşterilerin firmaları 1–5 yıldızla değerlendirmesi.',
    tier:        'Ücretsiz',
  },
  {
    key:         'fiyatHesaplama',
    label:       'Fiyat Hesaplayıcı',
    description: 'Kullanıcıların yapı tipine göre tahmini maliyet hesaplaması.',
    tier:        'Ücretsiz',
  },
];

/* ═══════════════════════════════════════════════════════════
   TAB — FEATURES
════════════════════════════════════════════════════════════ */
function FeaturesTab() {
  const [flags,   setFlags]   = useState<FeatureFlags>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'features'),
      (snap) => {
        setFlags(snap.exists()
          ? { ...DEFAULT_FLAGS, ...(snap.data() as Partial<FeatureFlags>) }
          : DEFAULT_FLAGS,
        );
        setLoading(false);
      },
      (_err) => {
        setFlags(DEFAULT_FLAGS);
        setLoading(false);
      },
    );
    return unsub;
  }, []);

  async function handleToggle(key: keyof FeatureFlags) {
    const prev = flags;
    const next = { ...flags, [key]: !flags[key] };
    setFlags(next);
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'features'), next);
      toast.success('Özellik güncellendi');
    } catch {
      toast.error('Güncelleme başarısız.');
      setFlags(prev);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-gray-800 mb-1">Özellik Yönetimi</h2>
      <p className="text-sm text-gray-500 mb-6">
        Platform özelliklerini açıp kapatın. Değişiklikler anında uygulanır.
      </p>

      <div className="space-y-3">
        {FEATURE_DEFS.map((def) => {
          const enabled = flags[def.key];
          const isComingSoon = def.key === 'onecikarIlan';
          return (
            <div
              key={def.key}
              className={`bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-gray-300 transition ${isComingSoon ? 'opacity-60' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-800 text-sm">{def.label}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    def.tier === 'Ücretli'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {def.tier}
                  </span>
                  {isComingSoon && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      (Yakında)
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{def.description}</p>
              </div>

              {/* Toggle switch */}
              <button
                onClick={() => handleToggle(def.key)}
                disabled={saving || isComingSoon}
                aria-label={`${def.label} ${enabled ? 'kapat' : 'aç'}`}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-60 ${
                  enabled ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>

      {saving && <p className="text-xs text-gray-400 mt-4 text-center">Kaydediliyor…</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 1 — OVERVIEW
════════════════════════════════════════════════════════════ */
function OverviewTab({ pendingCounts }: { pendingCounts: PendingCounts }) {
  const [counts,         setCounts]         = useState({ ilanlar: 0, approved: 0, pending: 0, rejected: 0, talepler: 0 });
  const [avgFiyat,       setAvgFiyat]       = useState(0);
  const [kategoriDagilim, setKategoriDagilim] = useState<{ name: string; count: number }[]>([]);
  const [son30gun,       setSon30gun]       = useState({ talepler: 0, firmalar: 0, ilanlar: 0 });
  const [topSehirler,    setTopSehirler]    = useState<{ sehir: string; count: number }[]>([]);

  useEffect(() => {
    const thirtyDaysAgo = Date.now() / 1000 - 30 * 86400;

    const u1 = onSnapshot(collection(db, 'ilanlar'), (s) => {
      const docs = s.docs.map((d) => d.data() as { fiyat?: number; kategori?: string; tarih?: { seconds: number } | null });
      setCounts((p) => ({ ...p, ilanlar: s.size }));

      /* Ortalama fiyat */
      const withFiyat = docs.filter((d) => typeof d.fiyat === 'number' && (d.fiyat ?? 0) > 0);
      setAvgFiyat(withFiyat.length
        ? Math.round(withFiyat.reduce((sum, d) => sum + (d.fiyat ?? 0), 0) / withFiyat.length)
        : 0,
      );

      /* Kategori dağılımı */
      const catMap: Record<string, number> = {};
      docs.forEach((d) => { const k = d.kategori || 'Diğer'; catMap[k] = (catMap[k] ?? 0) + 1; });
      setKategoriDagilim(Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      /* Son 30 gün ilanlar */
      setSon30gun((p) => ({ ...p, ilanlar: docs.filter((d) => d.tarih && d.tarih.seconds > thirtyDaysAgo).length }));
    });

    const u2 = onSnapshot(collection(db, 'firms'), (s) => {
      const docs = s.docs.map((d) => d.data() as AdminFirm & { createdAt?: { seconds: number } });
      setCounts((p) => ({
        ...p,
        approved: docs.filter((f) => f.status === 'approved').length,
        pending:  docs.filter((f) => f.status === 'pending').length,
        rejected: docs.filter((f) => f.status === 'rejected').length,
      }));
      setSon30gun((p) => ({ ...p, firmalar: docs.filter((d) => d.createdAt && d.createdAt.seconds > thirtyDaysAgo).length }));
    });

    const u3 = onSnapshot(collection(db, 'taleplar'), (s) => {
      const docs = s.docs.map((d) => d.data() as { sehir?: string; tarih?: { seconds: number } | null });
      setCounts((p) => ({ ...p, talepler: s.size }));

      /* Son 30 gün talepler */
      setSon30gun((p) => ({ ...p, talepler: docs.filter((d) => d.tarih && d.tarih.seconds > thirtyDaysAgo).length }));

      /* Top 5 şehir */
      const sehirMap: Record<string, number> = {};
      docs.forEach((d) => { if (d.sehir) sehirMap[d.sehir] = (sehirMap[d.sehir] ?? 0) + 1; });
      setTopSehirler(
        Object.entries(sehirMap)
          .map(([sehir, count]) => ({ sehir, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      );
    });

    return () => { u1(); u2(); u3(); };
  }, []);

  const fmtTL = (n: number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Genel Bakış</h2>

      {/* ── Bekleyen işlem uyarıları ──────────────────────── */}
      {(pendingCounts.talepler > 0 || pendingCounts.firms > 0 || pendingCounts.quotes > 0 || pendingCounts.haberTaslak > 0) && (
        <div className="space-y-2">
          {pendingCounts.talepler > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>{pendingCounts.talepler} adet</strong> onay bekleyen proje talebi var.
              </p>
            </div>
          )}
          {pendingCounts.firms > 0 && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <BuildingIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>{pendingCounts.firms} adet</strong> onay bekleyen firma başvurusu var.
              </p>
            </div>
          )}
          {pendingCounts.quotes > 0 && (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <Inbox className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-sm text-emerald-800">
                <strong>{pendingCounts.quotes} adet</strong> cevaplanmamış fiyat teklif talebi var.
              </p>
            </div>
          )}
          {pendingCounts.haberTaslak > 0 && (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <Newspaper className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-800">
                <strong>{pendingCounts.haberTaslak} haber taslağı</strong> onay bekliyor.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Ana sayaçlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam İlanlar"    value={counts.ilanlar}  color="text-emerald-600" sub="Firestore ilanlar" />
        <StatCard label="Onaylı Firmalar"   value={counts.approved} color="text-blue-600"    sub="Aktif firmalar" />
        <StatCard label="Onay Bekleyen"     value={counts.pending}  color="text-amber-500"   sub="İnceleme gerekiyor" />
        <StatCard label="Gelen Talepler"    value={counts.talepler} color="text-purple-600"  sub="Müşteri talepleri" />
      </div>

      {/* Ortalama ilan fiyatı */}
      {avgFiyat > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-0.5">Ortalama İlan Fiyatı</p>
            <p className="text-2xl font-extrabold text-gray-800">{fmtTL(avgFiyat)}</p>
          </div>
        </div>
      )}

      {/* Kategori dağılımı + Top şehirler */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Recharts BarChart — Kategori dağılımı */}
        {kategoriDagilim.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Kategori Dağılımı</h3>
            <ResponsiveContainer width="100%" height={kategoriDagilim.length * 42 + 16}>
              <BarChart data={kategoriDagilim} layout="vertical" margin={{ top: 0, right: 24, left: 4, bottom: 0 }}>
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: unknown) => [v, 'İlan sayısı']} />
                <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top 5 şehir */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">En Çok Talep Gelen 5 Şehir</h3>
          {topSehirler.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Henüz talep verisi yok.</p>
          ) : (
            <ul className="space-y-2.5">
              {topSehirler.map((item, i) => (
                <li key={item.sehir} className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm text-gray-700">{item.sehir}</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {item.count} talep
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Son 30 gün aktivitesi */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 text-sm mb-4">Son 30 Gün Aktivitesi</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-purple-50 rounded-xl">
            <p className="text-2xl font-extrabold text-purple-600">{son30gun.talepler}</p>
            <p className="text-xs text-gray-500 mt-1">Yeni Talep</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-2xl font-extrabold text-blue-600">{son30gun.firmalar}</p>
            <p className="text-xs text-gray-500 mt-1">Yeni Firma</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-extrabold text-emerald-600">{son30gun.ilanlar}</p>
            <p className="text-xs text-gray-500 mt-1">Yeni İlan</p>
          </div>
        </div>
      </div>

      {/* Hızlı işlemler */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toast.info('İlanlar sekmesine gidin.')}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm px-4 py-2 rounded-lg hover:bg-emerald-100 transition"
          >
            <FileText className="w-4 h-4" /> Yeni İlan
          </button>
          <button
            onClick={() => toast.info('Flash İlanlar sekmesine gidin.')}
            className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 text-sm px-4 py-2 rounded-lg hover:bg-amber-100 transition"
          >
            <Zap className="w-4 h-4" /> Flash İlanlar
          </button>
          <button
            onClick={() => toast.info('Firmalar sekmesine gidin.')}
            className="flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 text-sm px-4 py-2 rounded-lg hover:bg-blue-100 transition"
          >
            <BuildingIcon className="w-4 h-4" /> Firma Onayları
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 2 — SITE SETTINGS
════════════════════════════════════════════════════════════ */
const DEFAULT_FIYATLAR: Record<string, number> = {
  prefabrik:             3500,
  'celik-yapilar':       40000,
  'yasam-konteynerleri': 3000,
  'tiny-house':          4000,
  'ahsap-yapilar':       5000,
};

const FIYAT_LABELS: Record<string, string> = {
  prefabrik:             'Prefabrik Ev (₺/m²)',
  'celik-yapilar':       'Çelik Yapı (₺/m²)',
  'yasam-konteynerleri': 'Yaşam Konteyneri (₺/m²)',
  'tiny-house':          'Tiny House (₺/m²)',
  'ahsap-yapilar':       'Ahşap Yapı (₺/m²)',
};

function SettingsTab() {
  const [settings,       setSettings]       = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving,         setSaving]         = useState(false);
  const [fiyatlar,       setFiyatlar]       = useState<Record<string, number>>(DEFAULT_FIYATLAR);
  const [fiyatlarSaving, setFiyatlarSaving] = useState(false);
  const [limits,         setLimits]         = useState({ ilanLimit: 3, gunlukTeklifLimit: 1, aiSorguLimit: 5, ilanSuresiGun: 30, maxYenilemeSayisi: 3 });
  const [limitsSaving,   setLimitsSaving]   = useState(false);
  const [sosyal,         setSosyal]         = useState<SosyalMedya>(DEFAULT_SOSYAL);
  const [sosyalSaving,   setSosyalSaving]   = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as SiteSettings);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'fiyatlar'), (snap) => {
      if (snap.exists()) setFiyatlar((prev) => ({ ...prev, ...(snap.data() as Record<string, number>) }));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'limits'), (snap) => {
      if (snap.exists()) setLimits((prev) => ({ ...prev, ...(snap.data() as typeof prev) }));
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'sosyalMedya'), (snap) => {
      if (snap.exists()) setSosyal((prev) => ({ ...prev, ...(snap.data() as SosyalMedya) }));
    });
    return unsub;
  }, []);

  const handleSosyalSave = async () => {
    for (const [key, val] of Object.entries(sosyal)) {
      if (val && !val.startsWith('https://')) {
        toast.error(`${key} alanı https:// ile başlamalıdır.`);
        return;
      }
    }
    setSosyalSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'sosyalMedya'), sosyal);
      toast.success('Sosyal medya linkleri kaydedildi.');
    } catch {
      toast.error('Kaydetme sırasında hata oluştu.');
    } finally {
      setSosyalSaving(false);
    }
  };

  const handleLimitsSave = async () => {
    setLimitsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'limits'), limits);
      toast.success('Limitler kaydedildi.');
    } catch {
      toast.error('Limit kaydetme hatası.');
    } finally {
      setLimitsSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), settings);
      toast.success('Ayarlar başarıyla kaydedildi.');
    } catch {
      toast.error('Kaydetme sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleFiyatSave = async () => {
    setFiyatlarSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'fiyatlar'), fiyatlar);
      toast.success('Fiyatlar kaydedildi.');
    } catch {
      toast.error('Fiyat kaydetme hatası.');
    } finally {
      setFiyatlarSaving(false);
    }
  };

  const Field = ({ label, id, value, onChange, type = 'text', placeholder }: {
    label: string; id: string; value: string;
    onChange: (v: string) => void; type?: string; placeholder?: string;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Site Ayarları</h2>

      {/* Platform Bilgileri */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Platform Bilgileri</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Site Adı"      id="siteName"        value={settings.name}         onChange={(v) => setSettings((p) => ({ ...p, name: v }))} />
          <Field label="E-posta"       id="siteEmail"       value={settings.email}        onChange={(v) => setSettings((p) => ({ ...p, email: v }))} type="email" />
          <Field label="Destek Süresi" id="siteDestekSuresi" value={settings.destekSuresi} onChange={(v) => setSettings((p) => ({ ...p, destekSuresi: v }))} placeholder="Örn: 3-5 iş günü" />
        </div>
        <Field
          label="Slogan / Alt Başlık"
          id="siteTagline"
          value={settings.tagline}
          onChange={(v) => setSettings((p) => ({ ...p, tagline: v }))}
        />
      </div>

      {/* Logo URL */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Logo URL</h3>
        <Field
          label="Logo URL"
          id="siteLogoUrl"
          value={settings.logoUrl}
          onChange={(v) => setSettings((p) => ({ ...p, logoUrl: v }))}
          placeholder="https://example.com/logo.png"
        />
        {/* Önizleme */}
        {settings.logoUrl && (
          <div className="flex items-center gap-3 pt-1">
            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={settings.logoUrl}
                alt="Logo önizleme"
                loading="lazy"
                className="w-full h-full object-contain"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <a
              href={settings.logoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
            >
              <LinkIcon className="w-3 h-3" />
              URL'yi aç
            </a>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
          : <><Save className="w-4 h-4" /> Kaydet</>
        }
      </button>

      {/* Fiyat Hesaplayıcı Tablosu */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 text-sm">Fiyat Hesaplayıcı — m² Birim Fiyatlar</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Bu değerler /fiyat-hesapla sayfasında kullanılır. m² başına Türk Lirası cinsinden girin.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {Object.entries(FIYAT_LABELS).map(([slug, label]) => (
            <div key={slug}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input
                type="number"
                min={0}
                value={fiyatlar[slug] ?? DEFAULT_FIYATLAR[slug]}
                onChange={(e) => setFiyatlar((prev) => ({ ...prev, [slug]: Number(e.target.value) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleFiyatSave}
          disabled={fiyatlarSaving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {fiyatlarSaving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
            : <><Save className="w-4 h-4" /> Fiyatları Kaydet</>
          }
        </button>
      </div>

      {/* Kullanım Limitleri */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 text-sm">Kullanım Limitleri</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Ücretsiz plan limitleri. Değişiklikler anında tüm kullanıcılara yansır.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 xl:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Satıcı İlan Limiti</label>
            <input
              type="number" min={1} max={100}
              value={limits.ilanLimit}
              onChange={(e) => setLimits((p) => ({ ...p, ilanLimit: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">Ücretsiz satıcı başına maks. ilan</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Günlük Teklif Talebi</label>
            <input
              type="number" min={1} max={100}
              value={limits.gunlukTeklifLimit}
              onChange={(e) => setLimits((p) => ({ ...p, gunlukTeklifLimit: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">Alıcı başına günlük maks. talep</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">AI Sorgu Limiti</label>
            <input
              type="number" min={1} max={100}
              value={limits.aiSorguLimit}
              onChange={(e) => setLimits((p) => ({ ...p, aiSorguLimit: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">Kullanıcı başına günlük maks. AI sorgu</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">İlan Süresi (Gün)</label>
            <input
              type="number" min={1} max={365}
              value={limits.ilanSuresiGun}
              onChange={(e) => setLimits((p) => ({ ...p, ilanSuresiGun: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">Yeni ilanın aktif kalacağı gün sayısı</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Maks. Yenileme Sayısı</label>
            <input
              type="number" min={0} max={100}
              value={limits.maxYenilemeSayisi}
              onChange={(e) => setLimits((p) => ({ ...p, maxYenilemeSayisi: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">Satıcı başına ücretsiz ilan yenileme</p>
          </div>
        </div>
        <button
          onClick={handleLimitsSave}
          disabled={limitsSaving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {limitsSaving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
            : <><Save className="w-4 h-4" /> Limitleri Kaydet</>
          }
        </button>
      </div>

      {/* Sosyal Medya Linkleri */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-700 text-sm">Sosyal Medya Linkleri</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Boş bırakılan platformlar footer'da gösterilmez. URL'ler https:// ile başlamalıdır.
          </p>
        </div>
        <div className="space-y-3">
          {([
            { key: 'linkedin',  label: 'LinkedIn',  icon: <Linkedin  className="w-4 h-4 text-blue-600" />,   placeholder: 'https://linkedin.com/company/modulerpazar' },
            { key: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4 text-pink-500" />,   placeholder: 'https://instagram.com/modulerpazar' },
            { key: 'facebook',  label: 'Facebook',  icon: <Facebook  className="w-4 h-4 text-blue-700" />,   placeholder: 'https://facebook.com/modulerpazar' },
            { key: 'twitter',   label: 'Twitter/X', icon: <Twitter   className="w-4 h-4 text-sky-500" />,    placeholder: 'https://twitter.com/modulerpazar' },
            { key: 'youtube',   label: 'YouTube',   icon: <Youtube   className="w-4 h-4 text-red-600" />,    placeholder: 'https://youtube.com/@modulerpazar' },
          ] as { key: keyof SosyalMedya; label: string; icon: React.ReactNode; placeholder: string }[]).map(({ key, label, icon, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                {icon} {label}
              </label>
              <input
                type="url"
                value={sosyal[key]}
                onChange={(e) => setSosyal((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={handleSosyalSave}
          disabled={sosyalSaving}
          className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sosyalSaving
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
            : <><Save className="w-4 h-4" /> Sosyal Medyayı Kaydet</>
          }
        </button>
      </div>

      {/* Beta Modu Ayarları */}
      <BetaSettingsCard />
    </div>
  );
}

function BetaSettingsCard() {
  const [beta, setBeta] = useState({
    betaMode: true,
    betaLabel: { tr: 'Beta', en: 'Beta' },
    betaBannerVisible: true,
    betaBannerText: {
      tr: 'Bu platform şu anda beta aşamasındadır. Geri bildirimlerinizi bekliyoruz!',
      en: 'This platform is currently in beta. We welcome your feedback!',
    },
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) setBeta((prev) => ({ ...prev, ...(snap.data() as typeof prev) }));
    });
    return unsub;
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), beta);
      toast.success('Beta ayarları kaydedildi.');
    } catch {
      toast.error('Kaydetme sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-700 text-sm">Beta Modu Ayarları</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Beta modunu ve banner'ı yönetin. Değişiklikler anında yansır.
        </p>
      </div>

      {/* Toggle'lar */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={beta.betaMode}
            onChange={(e) => setBeta((p) => ({ ...p, betaMode: e.target.checked }))}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">Beta modu aktif</span>
          <span className="text-xs text-gray-400">(Logo yanında badge gösterir)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={beta.betaBannerVisible}
            onChange={(e) => setBeta((p) => ({ ...p, betaBannerVisible: e.target.checked }))}
            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700">Beta banner'ı göster</span>
          <span className="text-xs text-gray-400">(Sayfa üstünde ince bilgi çubuğu)</span>
        </label>
      </div>

      {/* Beta Label */}
      <div>
        <h4 className="text-xs font-medium text-gray-600 mb-2">Badge Etiketi</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Türkçe</label>
            <input
              type="text"
              value={beta.betaLabel.tr}
              onChange={(e) => setBeta((p) => ({ ...p, betaLabel: { ...p.betaLabel, tr: e.target.value } }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">English</label>
            <input
              type="text"
              value={beta.betaLabel.en}
              onChange={(e) => setBeta((p) => ({ ...p, betaLabel: { ...p.betaLabel, en: e.target.value } }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Banner Text */}
      <div>
        <h4 className="text-xs font-medium text-gray-600 mb-2">Banner Metni</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Türkçe</label>
            <input
              type="text"
              value={beta.betaBannerText.tr}
              onChange={(e) => setBeta((p) => ({ ...p, betaBannerText: { ...p.betaBannerText, tr: e.target.value } }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">English</label>
            <input
              type="text"
              value={beta.betaBannerText.en}
              onChange={(e) => setBeta((p) => ({ ...p, betaBannerText: { ...p.betaBannerText, en: e.target.value } }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {saving
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
          : <><Save className="w-4 h-4" /> Beta Ayarlarını Kaydet</>
        }
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 3 — FLASH DEALS CRUD
════════════════════════════════════════════════════════════ */
function FlashDealsTab() {
  const [deals,      setDeals]      = useState<AdminFlashDeal[]>([]);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<AdminFlashDeal | null>(null);
  const [form,       setForm]       = useState<Omit<AdminFlashDeal, 'id'>>(EMPTY_DEAL);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'flashDeals'), (snap) => {
      setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminFlashDeal)));
    });
    return unsub;
  }, []);

  const openAdd = () => { setForm(EMPTY_DEAL); setEditing(null); setModalOpen(true); };
  const openEdit = (deal: AdminFlashDeal) => {
    setForm({ ...deal, discount: deal.discount ?? 0, originalPrice: deal.originalPrice ?? '' });
    setEditing(deal);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.price.trim()) {
      toast.error('Başlık ve fiyat zorunludur.');
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, discount: Number(form.discount) || 0 };
      if (editing?.id) {
        await updateDoc(doc(db, 'flashDeals', editing.id), data);
        toast.success('İlan güncellendi.');
      } else {
        await addDoc(collection(db, 'flashDeals'), data);
        toast.success('İlan eklendi.');
      }
      setModalOpen(false);
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'flashDeals', id));
      toast.success('İlan silindi.');
    } catch {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const upd = (field: keyof Omit<AdminFlashDeal, 'id'>, value: string | boolean | number) =>
    setForm((p) => ({ ...p, [field]: value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Flash İlanlar</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Yeni İlan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {deals.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Henüz flash ilan yok. "Yeni İlan" ile ekleyin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Başlık</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Lokasyon</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Fiyat</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Acil</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{deal.title}</td>
                    <td className="px-4 py-3 text-gray-600">{deal.location}</td>
                    <td className="px-4 py-3 text-gray-600">{deal.category}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{deal.price}</td>
                    <td className="px-4 py-3">
                      {deal.urgent
                        ? <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">ACİL</span>
                        : <span className="text-gray-400 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(deal)}
                          aria-label="Düzenle"
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(deal.id!)}
                          aria-label="Sil"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{editing ? 'İlanı Düzenle' : 'Yeni Flash İlan'}</h3>
              <button onClick={() => setModalOpen(false)} aria-label="Kapat">
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlık *</label>
                <input value={form.title} onChange={(e) => upd('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="80 m² Prefabrik Ev - Sıfır" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Lokasyon *</label>
                  <input value={form.location} onChange={(e) => upd('location', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="İstanbul" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                  <select value={form.category} onChange={(e) => upd('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    {DEAL_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fiyat *</label>
                  <input value={form.price} onChange={(e) => upd('price', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="320.000 ₺" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Eski Fiyat</label>
                  <input value={form.originalPrice} onChange={(e) => upd('originalPrice', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="400.000 ₺" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">İndirim %</label>
                  <input type="number" min={0} max={100}
                    value={form.discount || ''} onChange={(e) => upd('discount', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="20" />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={form.urgent}
                      onChange={(e) => upd('urgent', e.target.checked)}
                      className="w-4 h-4 accent-red-500" />
                    <span className="text-sm font-medium text-gray-700">Acil İlan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Görsel URL</label>
                <input value={form.image} onChange={(e) => upd('image', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://images.unsplash.com/..." />
                {form.image && (
                  <img src={form.image} alt="Önizleme" loading="lazy"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200" />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                İptal
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed">
                {saving
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
                  : <><Save className="w-4 h-4" /> Kaydet</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 4 — İLANLAR CRUD
════════════════════════════════════════════════════════════ */
function IlanlarTab() {
  const [ilanlar,   setIlanlar]   = useState<AdminIlan[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form,      setForm]      = useState<Omit<AdminIlan, 'id'>>(EMPTY_ILAN);
  const [gorselUrl, setGorselUrl] = useState('');
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'ilanlar'), (snap) => {
      setIlanlar(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminIlan)));
    });
    return unsub;
  }, []);

  const openAdd = () => { setForm(EMPTY_ILAN); setGorselUrl(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.baslik.trim() || !form.sehir.trim() || !form.fiyat) {
      toast.error('Başlık, şehir ve fiyat zorunludur.');
      return;
    }
    setSaving(true);
    try {
      const cat  = CATEGORIES.find((c) => c.slug === form.kategoriSlug);
      const data = {
        ...form,
        kategori: cat?.name ?? form.kategori,
        gorseller: gorselUrl.trim() ? [gorselUrl.trim()] : [],
        tarih: serverTimestamp(),
      };
      await addDoc(collection(db, 'ilanlar'), data);
      toast.success('İlan eklendi.');
      setModalOpen(false);
      setForm(EMPTY_ILAN);
      setGorselUrl('');
    } catch {
      toast.error('İşlem sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (ilan: AdminIlan) => {
    if (!ilan.id) return;
    const next = ilan.status === 'aktif' ? 'pasif' : 'aktif';
    try {
      await updateDoc(doc(db, 'ilanlar', ilan.id), { status: next });
      toast.success(`İlan ${next === 'aktif' ? 'aktif edildi' : 'pasife alındı'}.`);
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const deleteIlan = async (id: string) => {
    if (!window.confirm('Bu ilanı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'ilanlar', id));
      toast.success('İlan silindi.');
    } catch {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const extendIlan = async (id: string) => {
    try {
      await updateDoc(doc(db, 'ilanlar', id), {
        ilanBitis: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        aktif: true,
      });
      toast.success('İlan süresi 30 gün uzatıldı.');
    } catch {
      toast.error('Süre uzatma başarısız.');
    }
  };

  const upd = (patch: Partial<Omit<AdminIlan, 'id'>>) =>
    setForm((p) => ({ ...p, ...patch }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">İlanlar</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Yeni İlan
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {ilanlar.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Henüz ilan yok. "Yeni İlan" ile ekleyin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Başlık / Firma</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Şehir</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Fiyat</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Etiket</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ilanlar.map((ilan) => (
                  <tr key={ilan.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-medium text-gray-800 truncate">{ilan.baslik}</p>
                      <p className="text-xs text-gray-400 truncate">{ilan.firmaAdi || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ilan.sehir}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 whitespace-nowrap">
                      {new Intl.NumberFormat('tr-TR').format(ilan.fiyat)} ₺
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {ilan.acil && (
                          <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">ACİL</span>
                        )}
                        {ilan.indirimli && (
                          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">İNDİRİM</span>
                        )}
                        {!ilan.acil && !ilan.indirimli && (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        ilan.status === 'aktif'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {ilan.status === 'aktif' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => extendIlan(ilan.id!)}
                          aria-label="Süreyi 30 gün uzat"
                          title="Süreyi +30 gün uzat"
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition text-xs"
                        >
                          +30g
                        </button>
                        <button
                          onClick={() => toggleStatus(ilan)}
                          aria-label={ilan.status === 'aktif' ? 'Pasife al' : 'Aktif et'}
                          title={ilan.status === 'aktif' ? 'Pasife al' : 'Aktif et'}
                          className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        >
                          {ilan.status === 'aktif'
                            ? <XCircle className="w-4 h-4" />
                            : <CheckCircle className="w-4 h-4" />
                          }
                        </button>
                        <button
                          onClick={() => deleteIlan(ilan.id!)}
                          aria-label="Sil"
                          title="Sil"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Yeni İlan Ekle</h3>
              <button onClick={() => setModalOpen(false)} aria-label="Kapat">
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Başlık */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Başlık *</label>
                <input
                  value={form.baslik}
                  onChange={(e) => upd({ baslik: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="80 m² Prefabrik Ev"
                />
              </div>

              {/* Kategori + Şehir */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Kategori</label>
                  <select
                    value={form.kategoriSlug}
                    onChange={(e) => {
                      const cat = CATEGORIES.find((c) => c.slug === e.target.value);
                      upd({ kategoriSlug: e.target.value, kategori: cat?.name ?? e.target.value });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Şehir *</label>
                  <input
                    value={form.sehir}
                    onChange={(e) => upd({ sehir: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="İstanbul"
                  />
                </div>
              </div>

              {/* Fiyat + Firma Adı */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fiyat (₺) *</label>
                  <input
                    type="number"
                    min={0}
                    value={form.fiyat || ''}
                    onChange={(e) => upd({ fiyat: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="320000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Firma Adı</label>
                  <input
                    value={form.firmaAdi}
                    onChange={(e) => upd({ firmaAdi: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ABC Yapı Ltd."
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Açıklama</label>
                <textarea
                  value={form.aciklama}
                  onChange={(e) => upd({ aciklama: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="İlan açıklaması..."
                />
              </div>

              {/* Görsel URL */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Görsel URL</label>
                <input
                  value={gorselUrl}
                  onChange={(e) => setGorselUrl(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://images.unsplash.com/..."
                />
                {gorselUrl && (
                  <img
                    src={gorselUrl}
                    alt="Önizleme"
                    loading="lazy"
                    className="mt-2 w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.acil}
                    onChange={(e) => upd({ acil: e.target.checked })}
                    className="w-4 h-4 accent-red-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Acil İlan</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.indirimli}
                    onChange={(e) => upd({ indirimli: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700">İndirimli</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.status === 'aktif'}
                    onChange={(e) => upd({ status: e.target.checked ? 'aktif' : 'pasif' })}
                    className="w-4 h-4 accent-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Yayında (Aktif)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-emerald-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Kaydediliyor…</>
                  : <><Save className="w-4 h-4" /> Kaydet</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — FIRMS
════════════════════════════════════════════════════════════ */
function FirmsTab() {
  const [firms,  setFirms]  = useState<AdminFirm[]>([]);
  const [filter, setFilter] = useState<FirmStatus>('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'firms'), (snap) => {
      setFirms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminFirm)));
    });
    return unsub;
  }, []);

  const setStatus = async (id: string, status: AdminFirm['status']) => {
    try {
      await updateDoc(doc(db, 'firms', id), { status, verified: status === 'approved' });
      toast.success(status === 'approved' ? 'Firma onaylandı.' : 'Firma reddedildi.');

      // Onay sonrası firmaya e-posta gönder
      if (status === 'approved') {
        const firmSnap = await import('firebase/firestore').then(({ getDoc: gd }) => gd(doc(db, 'firms', id)));
        const data = firmSnap.data();
        const firmaEmail = data?.eposta || data?.email || '';
        if (firmaEmail) {
          sendFirmaOnayEmail({ firmaEmail, firmaAdi: data?.name || '' }).catch(() => {});
        }
      }
    } catch {
      toast.error('İşlem başarısız.');
    }
  };

  const deleteFirm = async (id: string) => {
    if (!window.confirm('Bu firmayı silmek istediğinizden emin misiniz?')) return;
    try {
      await deleteDoc(doc(db, 'firms', id));
      toast.success('Firma silindi.');
    } catch {
      toast.error('Silme işlemi başarısız.');
    }
  };

  const filtered = filter === 'all' ? firms : firms.filter((f) => f.status === filter);

  const tabCls = (t: FirmStatus) =>
    `px-4 py-1.5 rounded-full text-xs font-semibold transition ${filter === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Firmalar</h2>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as FirmStatus[]).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={tabCls(t)}>
              { t === 'all' ? 'Tümü' : t === 'pending' ? 'Bekleyen' : t === 'approved' ? 'Onaylı' : 'Reddedilen' }
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <BuildingIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {filter === 'all' ? 'Henüz kayıtlı firma yok.' : 'Bu kategoride firma yok.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Firma Adı</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Kategori</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Şehir</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Durum</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((firm) => (
                  <tr key={firm.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {firm.verified && (
                          <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-label="Doğrulanmış" />
                        )}
                        <span className="font-medium text-gray-800">{firm.name}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{firm.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{firm.category}</td>
                    <td className="px-4 py-3 text-gray-600">{firm.city}</td>
                    <td className="px-4 py-3"><Badge status={firm.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {firm.status !== 'approved' && (
                          <button
                            onClick={() => setStatus(firm.id!, 'approved')}
                            aria-label="Onayla"
                            title="Onayla"
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {firm.status !== 'rejected' && (
                          <button
                            onClick={() => setStatus(firm.id!, 'rejected')}
                            aria-label="Reddet"
                            title="Reddet"
                            className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteFirm(firm.id!)}
                          aria-label="Sil"
                          title="Sil"
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 5 — TALEPLER
════════════════════════════════════════════════════════════ */
function TaleplerTab() {
  const [talepler,  setTalepler]  = useState<AdminTalep[]>([]);
  const [firms,     setFirms]     = useState<AdminFirm[]>([]);
  const [teklifCounts, setTeklifCounts] = useState<Record<string, number>>({});
  const [filter,    setFilter]    = useState<TalepStatus>('all');
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [sending,   setSending]   = useState<string | null>(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'taleplar'), (snap) =>
      setTalepler(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminTalep))));
    const u2 = onSnapshot(collection(db, 'firms'), (snap) =>
      setFirms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminFirm))));
    const u3 = onSnapshot(collection(db, 'teklifler'), (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach((d) => {
        const tid = d.data().talepId as string;
        counts[tid] = (counts[tid] || 0) + 1;
      });
      setTeklifCounts(counts);
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  /* Firmalara İlet — 3 kademeli eşleştirme */
  const handleIlet = async (talep: AdminTalep) => {
    if (!talep.id) return;
    setSending(talep.id);
    try {
      // Tüm onaylı firmalar — userId olmayanlar eşleşmeye dahil, bildirime dahil değil
      const approved = firms.filter((f) => f.status === 'approved');

      if (approved.length === 0) {
        toast.warning('Sistemde onaylı firma bulunamadı.');
        return;
      }

      const hasCat  = (f: AdminFirm) =>
        (Array.isArray(f.kategoriler) && f.kategoriler.includes(talep.kategori)) ||
        f.category === talep.kategori;
      const hasCity = (f: AdminFirm) =>
        f.sehir === talep.sehir || f.city === talep.sehir;

      // 1. Aynı şehir + aynı kategori
      let matching = approved.filter((f) => hasCat(f) && hasCity(f));
      let matchDesc = `${talep.sehir} · ${talep.kategori}`;

      // 2. Sadece aynı kategori
      if (matching.length === 0) {
        matching = approved.filter((f) => hasCat(f));
        matchDesc = talep.kategori;
      }

      // 3. Tüm onaylı firmalar
      if (matching.length === 0) {
        matching = approved;
        matchDesc = 'tüm onaylı firmalar';
      }

      // userId olan firmalar bildirim alır; olmayanlar sadece iletildi sayısına girer
      const newIds = matching
        .map((f) => f.userId as string)
        .filter((uid) => uid && !talep.firmaGonderilenler.includes(uid));

      if (newIds.length === 0) {
        toast.info('Uygun firmalar zaten bilgilendirilmiş.');
        return;
      }

      await Promise.all(
        newIds.map((firmaId) =>
          addDoc(collection(db, 'bildirimler'), {
            firmaId,
            talepId: talep.id,
            status: 'beklemede',
            tarih: serverTimestamp(),
          }),
        ),
      );

      await updateDoc(doc(db, 'taleplar', talep.id!), {
        status: 'iletildi',
        firmaGonderilenler: arrayUnion(...newIds),
      });

      toast.success(`${newIds.length} firmaya iletildi (${matchDesc}).`);
    } catch {
      toast.error('Bildirim gönderilirken hata oluştu.');
    } finally {
      setSending(null);
    }
  };

  /* Durum badge */
  const StatusBadge = ({ status }: { status: AdminTalep['status'] }) => {
    const map = {
      beklemede:   'bg-amber-100 text-amber-700',
      iletildi:    'bg-blue-100 text-blue-700',
      tamamlandi:  'bg-emerald-100 text-emerald-700',
    };
    const label = { beklemede: 'Beklemede', iletildi: 'İletildi', tamamlandi: 'Tamamlandı' };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
        {label[status]}
      </span>
    );
  };

  const tabCls = (t: TalepStatus) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition ${
      filter === t ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  const formatDate = (tarih: AdminTalep['tarih']) => {
    if (!tarih) return '—';
    return new Date(tarih.seconds * 1000).toLocaleDateString('tr-TR');
  };

  const filtered = filter === 'all' ? talepler : talepler.filter((t) => t.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Müşteri Talepleri</h2>
        <div className="flex flex-wrap gap-2">
          {(['all', 'beklemede', 'iletildi', 'tamamlandi'] as TalepStatus[]).map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={tabCls(t)}>
              { t === 'all' ? 'Tümü' : t === 'beklemede' ? 'Beklemede' : t === 'iletildi' ? 'İletildi' : 'Tamamlandı' }
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-30" />
            {filter === 'all' ? 'Henüz müşteri talebi yok.' : 'Bu filtrede talep bulunamadı.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((talep) => {
              const isExpanded = expanded === talep.id;
              const isSending  = sending === talep.id;

              return (
                <div key={talep.id}>
                  {/* Satır */}
                  <div className="px-4 py-3 hover:bg-gray-50 transition">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          <Tag className="w-3 h-3" />
                          {CAT_MAP[talep.kategori] ?? talep.kategori}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {talep.sehir}{talep.ilce ? ` / ${talep.ilce}` : ''}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Banknote className="w-3 h-3" />
                          {BUDGET_LABELS[talep.butce] ?? talep.butce}
                        </span>
                        <StatusBadge status={talep.status} />
                        <span className="text-xs text-gray-400">{formatDate(talep.tarih)}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Firmalara İlet */}
                        {talep.status === 'beklemede' && (
                          <button
                            onClick={() => handleIlet(talep)}
                            disabled={isSending}
                            className="flex items-center gap-1.5 bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition disabled:opacity-60"
                          >
                            {isSending
                              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <Send className="w-3 h-3" />
                            }
                            Firmalara İlet
                          </button>
                        )}
                        {/* Detay */}
                        <button
                          onClick={() => setExpanded(isExpanded ? null : talep.id!)}
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 border border-gray-200 text-xs px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition"
                        >
                          <Eye className="w-3 h-3" />
                          {isExpanded ? 'Kapat' : 'Detay'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Açıklama özeti */}
                    {!isExpanded && talep.aciklama && (
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-1 pl-1">{talep.aciklama}</p>
                    )}
                  </div>

                  {/* Genişletilmiş detay */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-blue-50 border-t border-blue-100">
                      <div className="grid sm:grid-cols-2 gap-4 pt-4">
                        {/* Sol: proje detayları */}
                        <div className="space-y-2 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Proje Detayları
                          </p>
                          <p><strong>Kategori:</strong> {CAT_MAP[talep.kategori] ?? talep.kategori}</p>
                          <p><strong>Şehir / İlçe:</strong> {talep.sehir}{talep.ilce ? ` — ${talep.ilce}` : ''}</p>
                          <p><strong>Bütçe:</strong> {BUDGET_LABELS[talep.butce] ?? talep.butce}</p>
                          {talep.metrekare    && <p><strong>Boyut:</strong> {talep.metrekare}</p>}
                          {talep.teslimTarihi && <p><strong>Teslim:</strong> {talep.teslimTarihi}</p>}
                          <p><strong>Açıklama:</strong> {talep.aciklama}</p>
                          {talep.fotograflar?.length > 0 && (
                            <div>
                              <strong>Görseller:</strong>
                              <ul className="mt-1 space-y-1">
                                {talep.fotograflar.map((url, i) => (
                                  <li key={i}>
                                    <a href={url} target="_blank" rel="noopener noreferrer"
                                      className="text-emerald-600 hover:underline text-xs truncate block max-w-xs">
                                      {url}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Sağ: iletişim (sadece admin) */}
                        <div className="space-y-2 text-sm">
                          <p className="font-semibold text-gray-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Müşteri Bilgileri (Admin)
                          </p>
                          <div className="bg-white border border-blue-200 rounded-xl p-3 space-y-1.5 text-gray-700">
                            <p><strong>Ad Soyad:</strong> {talep.ad}</p>
                            <p>
                              <strong>Telefon:</strong>{' '}
                              <a href={`tel:${talep.telefon}`} className="text-emerald-600 hover:underline">{talep.telefon}</a>
                            </p>
                            <p>
                              <strong>E-posta:</strong>{' '}
                              <a href={`mailto:${talep.email}`} className="text-emerald-600 hover:underline">{talep.email}</a>
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 space-y-1">
                            <p><strong>İletildi:</strong> {talep.firmaGonderilenler.length} firmaya</p>
                            <p><strong>Kabul:</strong> {talep.firmaKabulEdenler.length} firma</p>
                            <p><strong>Teklif Sayısı:</strong> {teklifCounts[talep.id!] || 0} teklif</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 7 — BLOG
════════════════════════════════════════════════════════════ */
interface BlogSetting {
  slug:          string;
  fiyatBilgisi:  string;
  oneCikanBilgi: string;
  uyariMetni:    string;
  ekMetin:       string;
  yayinda:       boolean;
  guncelleme:    { toDate: () => Date } | null;
}

interface BlogForm {
  fiyatBilgisi:  string;
  oneCikanBilgi: string;
  uyariMetni:    string;
  ekMetin:       string;
  yayinda:       boolean;
}

const EMPTY_BLOG_FORM: BlogForm = {
  fiyatBilgisi:  '',
  oneCikanBilgi: '',
  uyariMetni:    '',
  ekMetin:       '',
  yayinda:       true,
};

function BlogTab() {
  const [settings, setSettings] = useState<Record<string, BlogSetting>>({});
  const [editing,  setEditing]  = useState<BlogPost | null>(null);
  const [form,     setForm]     = useState<BlogForm>(EMPTY_BLOG_FORM);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'blogSettings'), (snap) => {
      const map: Record<string, BlogSetting> = {};
      snap.forEach((d) => {
        const data = d.data() as BlogSetting;
        map[data.slug] = data;
      });
      setSettings(map);
    });
    return unsub;
  }, []);

  function openEdit(post: BlogPost) {
    const saved = settings[post.slug];
    setEditing(post);
    setForm({
      fiyatBilgisi:  saved?.fiyatBilgisi  ?? '',
      oneCikanBilgi: saved?.oneCikanBilgi ?? '',
      uyariMetni:    saved?.uyariMetni    ?? '',
      ekMetin:       saved?.ekMetin       ?? '',
      yayinda:       saved?.yayinda       ?? true,
    });
  }

  const setField = <K extends keyof BlogForm>(k: K, v: BlogForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'blogSettings', editing.slug), {
        slug:          editing.slug,
        fiyatBilgisi:  form.fiyatBilgisi.trim(),
        oneCikanBilgi: form.oneCikanBilgi.trim(),
        uyariMetni:    form.uyariMetni.trim(),
        ekMetin:       form.ekMetin.trim(),
        yayinda:       form.yayinda,
        guncelleme:    serverTimestamp(),
      });
      toast.success('Blog ayarları kaydedildi.');
      setEditing(null);
    } catch {
      toast.error('Kayıt başarısız.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Blog Yazıları</h2>
        <p className="text-sm text-gray-400">{BLOG_POSTS.length} yazı</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {BLOG_POSTS.map((post) => {
          const saved      = settings[post.slug];
          const isOnline   = saved?.yayinda !== false;
          const blockCount = [
            saved?.fiyatBilgisi,
            saved?.oneCikanBilgi,
            saved?.uyariMetni,
            saved?.ekMetin,
          ].filter(Boolean).length;

          return (
            <div key={post.slug} className="flex items-center gap-4 p-4">
              <img
                src={post.kapakGorseli}
                alt={post.baslik}
                loading="lazy"
                className="w-14 h-12 object-cover rounded-lg flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{post.baslik}</p>
                <p className="text-xs text-gray-400 mt-0.5">/{post.slug}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {!isOnline && (
                    <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium">
                      <EyeOff className="w-3 h-3" /> Yayında Değil
                    </span>
                  )}
                  {blockCount > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                      <CheckCircle className="w-3 h-3" /> {blockCount} içerik aktif
                    </span>
                  )}
                  {blockCount === 0 && isOnline && (
                    <span className="text-xs text-gray-400">Ayar yok</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => openEdit(post)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-400 hover:text-emerald-700 transition flex-shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                Düzenle
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Düzenle modal ──────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

            {/* Başlık */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="min-w-0 pr-4">
                <h3 className="font-bold text-gray-800 text-sm">Blog Yazısı Ayarları</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{editing.baslik}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Yayında toggle */}
                <button
                  onClick={() => setField('yayinda', !form.yayinda)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    form.yayinda
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  {form.yayinda
                    ? <><Eye    className="w-3.5 h-3.5" /> Yayında</>
                    : <><EyeOff className="w-3.5 h-3.5" /> Yayında Değil</>}
                </button>
                <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable içerik */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* 1 — Öne Çıkan Bilgi */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mb-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 flex-shrink-0" />
                  Öne Çıkan Bilgi Kutusu
                  <span className="font-normal text-gray-400">(yazının başında — yeşil kutu)</span>
                </label>
                <textarea
                  value={form.oneCikanBilgi}
                  onChange={(e) => setField('oneCikanBilgi', e.target.value)}
                  rows={3}
                  placeholder='Örn: "2025 güncel bilgi: Bu kategori için ortalama teslim süresi 45 gündür."'
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* 2 — Uyarı */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1.5">
                  <span className="w-3 h-3 rounded-sm bg-amber-400 flex-shrink-0" />
                  Uyarı Kutusu
                  <span className="font-normal text-gray-400">(yazının başında — sarı kutu)</span>
                </label>
                <textarea
                  value={form.uyariMetni}
                  onChange={(e) => setField('uyariMetni', e.target.value)}
                  rows={3}
                  placeholder='Örn: "Dikkat: Bu yapı tipi için belediye izni gerekebilir."'
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {/* 3 — Fiyat Bilgisi */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-blue-700 mb-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500 flex-shrink-0" />
                  Fiyat Bilgisi
                  <span className="font-normal text-gray-400">(yazının sonunda — mavi kutu)</span>
                </label>
                <textarea
                  value={form.fiyatBilgisi}
                  onChange={(e) => setField('fiyatBilgisi', e.target.value)}
                  rows={4}
                  placeholder="Güncel fiyat aralıklarını ve bilgileri buraya girin…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* 4 — Ek Metin */}
              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-1.5">
                  <span className="w-3 h-3 rounded-sm bg-gray-400 flex-shrink-0" />
                  Ek Metin
                  <span className="font-normal text-gray-400">(yazının sonunda — normal paragraf)</span>
                </label>
                <textarea
                  value={form.ekMetin}
                  onChange={(e) => setField('ekMetin', e.target.value)}
                  rows={4}
                  placeholder="Yazının sonuna eklemek istediğiniz ek bilgi veya paragraf…"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            {/* Alt butonlar */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB 8 — RAPOR
════════════════════════════════════════════════════════════ */

/* Google Apps Script kodu — kurulum kılavuzunda gösterilir */
const GAS_SCRIPT = `function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // İlk çalıştırmada başlık satırı oluştur
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Tarih', 'Kategori', 'Şehir', 'Bütçe', 'Durum', 'Ad', 'Telefon', 'E-posta']);
  }

  // Tek satır veya toplu dizi desteklenir
  const rows = Array.isArray(data.rows) ? data.rows : [data];
  rows.forEach(function(row) {
    sheet.appendRow([
      row.tarih ? new Date(row.tarih) : new Date(),
      row.kategori || '',
      row.sehir    || '',
      row.butce    || '',
      row.status   || '',
      row.ad       || '',
      row.telefon  || '',
      row.email    || ''
    ]);
  });

  return ContentService
    .createTextResponse(JSON.stringify({ ok: true, rows: rows.length }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

interface TalepRapor {
  id:       string;
  kategori: string;
  sehir:    string;
  butce:    string;
  status:   string;
  ad:       string;
  telefon:  string;
  email:    string;
  tarih:    Timestamp | null;
}

function RaporTab() {
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({
    totalIlanlar: 0, totalFirmalar: 0, totalTalepler: 0, newTalepler: 0,
  });
  const [kategoriData,    setKategoriData]    = useState<Array<{ kategori: string; sayi: number }>>([]);
  const [recentTalepler,  setRecentTalepler]  = useState<TalepRapor[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const ts30 = Timestamp.fromDate(thirtyDaysAgo);

        const [ilanSnap, firmSnap, talepSnap, newTalepSnap] = await Promise.all([
          getDocs(collection(db, 'ilanlar')),
          getDocs(collection(db, 'firms')),
          getDocs(collection(db, 'taleplar')),
          getDocs(query(collection(db, 'taleplar'), where('tarih', '>=', ts30))),
        ]);

        setStats({
          totalIlanlar:  ilanSnap.size,
          totalFirmalar: firmSnap.size,
          totalTalepler: talepSnap.size,
          newTalepler:   newTalepSnap.size,
        });

        /* Kategori dağılımı */
        const katMap: Record<string, number> = {};
        newTalepSnap.forEach((d) => {
          const k = (d.data().kategori as string) || 'diger';
          katMap[k] = (katMap[k] ?? 0) + 1;
        });
        setKategoriData(
          Object.entries(katMap)
            .sort((a, b) => b[1] - a[1])
            .map(([kategori, sayi]) => ({ kategori, sayi }))
        );

        /* Son 30 gün talepler listesi */
        const talepler: TalepRapor[] = newTalepSnap.docs.map((d) => {
          const data = d.data();
          return {
            id:       d.id,
            kategori: (data.kategori as string)  ?? '',
            sehir:    (data.sehir    as string)  ?? '',
            butce:    (data.butce    as string)  ?? '',
            status:   (data.status   as string)  ?? '',
            ad:       (data.ad       as string)  ?? '',
            telefon:  (data.telefon  as string)  ?? '',
            email:    (data.email    as string)  ?? '',
            tarih:    (data.tarih    as Timestamp | null) ?? null,
          };
        }).sort((a, b) => (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0));

        setRecentTalepler(talepler);
      } catch (err) {
        void err;
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  /* CSV indirme */
  function downloadCSV() {
    const header = ['Tarih', 'Kategori', 'Şehir', 'Bütçe', 'Durum', 'Ad', 'Telefon', 'E-posta'];
    const rows = recentTalepler.map((t) => [
      t.tarih ? new Date(t.tarih.seconds * 1000).toLocaleDateString('tr-TR') : '',
      CAT_MAP[t.kategori] ?? t.kategori,
      t.sehir,
      BUDGET_LABELS[t.butce] ?? t.butce,
      t.status,
      t.ad,
      t.telefon,
      t.email,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `talepler-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* Google Sheets aktar */
  async function handleExport() {
    const webhookUrl = import.meta.env.VITE_SHEETS_WEBHOOK_URL as string | undefined;
    // debug log kaldırıldı
    if (!webhookUrl) {
      toast.error('Google Sheets bağlantısı kurulmamış, lütfen Vercel\'de VITE_SHEETS_WEBHOOK_URL ayarlayın');
      return;
    }
    if (recentTalepler.length === 0) return;
    setExporting(true);
    try {
      const rows = recentTalepler.map((t) => ({
        tarih:    t.tarih ? new Date(t.tarih.seconds * 1000).toISOString() : new Date().toISOString(),
        kategori: CAT_MAP[t.kategori] ?? t.kategori,
        sehir:    t.sehir,
        butce:    BUDGET_LABELS[t.butce] ?? t.butce,
        status:   t.status,
        ad:       t.ad,
        telefon:  t.telefon,
        email:    t.email,
      }));

      /* webhookUrl client'tan gönderilir — Edge Function'da process.env erişemeyebilir */
      const resp = await fetch('/api/sheets-export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows, webhookUrl }),
      });

      if (resp.ok) {
        toast.success(`${rows.length} talep Google Sheets'e aktarıldı.`);
      } else {
        const data = await resp.json() as { error?: string };
        if (resp.status === 503) {
          toast.error('Google Sheets bağlantısı kurulmamış, lütfen Vercel\'de VITE_SHEETS_WEBHOOK_URL ayarlayın');
        } else {
          toast.error(`Aktarma başarısız: ${data.error ?? resp.statusText}`);
        }
      }
    } catch {
      toast.error('Bağlantı hatası — /api/sheets-export erişilemiyor.');
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusLabel = (s: string) =>
    s === 'tamamlandi' ? 'Tamamlandı' : s === 'iletildi' ? 'İletildi' : 'Beklemede';
  const statusColor = (s: string) =>
    s === 'tamamlandi' ? 'bg-emerald-100 text-emerald-700'
    : s === 'iletildi' ? 'bg-blue-100 text-blue-700'
    : 'bg-amber-100 text-amber-700';

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Rapor & İstatistikler</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">Son 30 gün</span>
      </div>

      {/* Genel toplamlar */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Genel Toplamlar</p>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Toplam İlan"    value={stats.totalIlanlar}  color="text-emerald-600" />
          <StatCard label="Toplam Firma"   value={stats.totalFirmalar} color="text-blue-600" />
          <StatCard label="Toplam Talep"   value={stats.totalTalepler} color="text-amber-600" />
        </div>
      </section>

      {/* Son 30 gün */}
      <section>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Son 30 Gün</p>
        <div className="grid grid-cols-1 gap-4">
          <StatCard
            label="Yeni Talep"
            value={stats.newTalepler}
            sub={`${stats.totalTalepler > 0 ? Math.round((stats.newTalepler / stats.totalTalepler) * 100) : 0}% toplam içinde`}
            color="text-amber-600"
          />
        </div>
      </section>

      {/* Kategori dağılımı */}
      {kategoriData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Kategori Dağılımı (Son 30 Gün)</h3>
          <div className="space-y-2.5">
            {kategoriData.map(({ kategori, sayi }) => {
              const pct = stats.newTalepler > 0
                ? Math.round((sayi / stats.newTalepler) * 100)
                : 0;
              return (
                <div key={kategori} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-44 truncate flex-shrink-0">
                    {CAT_MAP[kategori] ?? kategori}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-0">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-16 text-right flex-shrink-0">
                    {sayi} (%{pct})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Son 30 gün talep tablosu */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">Son 30 Günün Talepleri</h3>
          <span className="text-xs text-gray-400">{recentTalepler.length} talep</span>
        </div>

        {recentTalepler.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">Son 30 günde talep bulunmuyor.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-4 py-2.5 font-medium">Tarih</th>
                  <th className="px-4 py-2.5 font-medium">Kategori</th>
                  <th className="px-4 py-2.5 font-medium">Şehir</th>
                  <th className="px-4 py-2.5 font-medium">Bütçe</th>
                  <th className="px-4 py-2.5 font-medium">Durum</th>
                  <th className="px-4 py-2.5 font-medium">Ad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentTalepler.slice(0, 100).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                      {t.tarih
                        ? new Date(t.tarih.seconds * 1000).toLocaleDateString('tr-TR')
                        : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{CAT_MAP[t.kategori] ?? t.kategori}</td>
                    <td className="px-4 py-2.5 text-gray-700">{t.sehir}</td>
                    <td className="px-4 py-2.5 text-gray-700 whitespace-nowrap">
                      {BUDGET_LABELS[t.butce] ?? t.butce}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(t.status)}`}>
                        {statusLabel(t.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-700">{t.ad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google Sheets & CSV dışa aktarım */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800 text-sm">Dışa Aktar</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Son 30 günün {recentTalepler.length} talebini dışa aktarır.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            disabled={exporting || recentTalepler.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {exporting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <FileText className="w-4 h-4" />}
            {exporting ? 'Aktarılıyor…' : `📤 Google Sheets'e Aktar`}
          </button>

          <button
            onClick={downloadCSV}
            disabled={recentTalepler.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </button>
        </div>

        {/* Kurulum kılavuzu — webhook ayarlıysa gizle */}
        {!import.meta.env.VITE_SHEETS_WEBHOOK_URL && (
        <details className="border border-dashed border-gray-200 rounded-xl overflow-hidden">
          <summary className="px-4 py-3 text-xs font-medium text-emerald-700 cursor-pointer hover:bg-emerald-50 transition select-none">
            📋 Google Apps Script Kurulum Kılavuzu (adım adım)
          </summary>
          <div className="px-5 py-4 text-xs text-gray-600 space-y-3 bg-gray-50">
            <p>
              <strong>1.</strong>{' '}
              <a href="https://script.google.com" target="_blank" rel="noopener noreferrer"
                className="text-emerald-600 hover:underline">script.google.com</a>{' '}
              adresine gidin → <em>Yeni proje</em> oluşturun.
            </p>
            <p>
              <strong>2.</strong> Aşağıdaki kodu <code className="bg-gray-200 px-1 rounded">Code.gs</code> dosyasına yapıştırın:
            </p>
            <pre className="bg-gray-900 text-green-400 rounded-xl p-4 overflow-x-auto text-[10px] leading-relaxed whitespace-pre">
              {GAS_SCRIPT}
            </pre>
            <p>
              <strong>3.</strong> <em>Dağıt</em> → <em>Yeni dağıtım</em> → Tür: <strong>Web uygulaması</strong><br />
              Şöyle erişim izni ayarlayın: <strong>Herkes</strong> → <em>Dağıt</em>.
            </p>
            <p>
              <strong>4.</strong> Oluşan URL'yi kopyalayın:{' '}
              <code className="bg-gray-200 px-1 rounded">{'https://script.google.com/macros/s/.../exec'}</code>
            </p>
            <p>
              <strong>5.</strong> Vercel Dashboard → <em>Settings → Environment Variables</em> bölümüne gidin.
            </p>
            <p>
              <strong>6.</strong> Yeni değişken ekleyin:
              <br />
              Key: <code className="bg-gray-200 px-1 rounded font-mono">VITE_SHEETS_WEBHOOK_URL</code>
              <br />
              Value: 4. adımda kopyaladığınız URL
            </p>
            <p>
              <strong>7.</strong> Vercel'de projeyi yeniden <em>deploy</em> edin (veya bir commit gönderin).
            </p>
            <p className="text-emerald-700 font-medium">
              ✓ Artık her yeni talep otomatik olarak Google Sheets'e yazılacak.
              Admin panelindeki &quot;📤 Google Sheets'e Aktar&quot; butonu ise mevcut verileri toplu aktarır.
            </p>
          </div>
        </details>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — ADMIN DASHBOARD
════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   TAB — ACİL İLANLAR
════════════════════════════════════════════════════════════ */
function AcilIlanlarTab() {
  const [ilanlar, setIlanlar] = useState<AdminIlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'ilanlar'), where('acilSatis', '==', true));
    const unsub = onSnapshot(q, async (snap) => {
      const now = Date.now();
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminIlan));

      // Süresi dolmuş → otomatik normal ilana çevir
      const expired = docs.filter((d) => d.acilSatisBitis && d.acilSatisBitis.seconds * 1000 < now);
      if (expired.length > 0) {
        await Promise.all(expired.map((d) =>
          updateDoc(doc(db, 'ilanlar', d.id!), { acilSatis: false, acilSatisFiyat: null, acilSatisBitis: null })
        ));
      }

      setIlanlar(docs.filter((d) => !expired.some((e) => e.id === d.id)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleKaldir = async (id: string) => {
    await updateDoc(doc(db, 'ilanlar', id), {
      acilSatis: false, acilSatisFiyat: null, acilSatisBitis: null,
    });
    toast.info('Acil satış kaldırıldı.');
  };

  const fmtDate = (ts: { seconds: number } | null | undefined) => {
    if (!ts) return '—';
    return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR');
  };

  const daysLeft = (ts: { seconds: number } | null | undefined) => {
    if (!ts) return '—';
    const d = Math.ceil((ts.seconds * 1000 - Date.now()) / 86400000);
    return d > 0 ? `${d} gün` : 'Doldu';
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-800">Acil Satış İlanları</h2>
        <span className="ml-auto text-sm text-gray-400">{ilanlar.length} aktif</span>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto" />
        </div>
      ) : ilanlar.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">
          <Flame className="w-10 h-10 mx-auto mb-3 opacity-20" />
          Şu anda aktif acil satış ilanı yok.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Başlık</th>
                <th className="px-4 py-3 text-right">Normal Fiyat</th>
                <th className="px-4 py-3 text-right">Acil Fiyat</th>
                <th className="px-4 py-3 text-center">Bitiş</th>
                <th className="px-4 py-3 text-center">Kalan</th>
                <th className="px-4 py-3 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ilanlar.map((ilan) => (
                <tr key={ilan.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 max-w-[200px] truncate">{ilan.baslik}</p>
                    <p className="text-xs text-gray-400">{ilan.sehir} · {ilan.firmaAdi}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 line-through">
                    {new Intl.NumberFormat('tr-TR').format(ilan.fiyat)} ₺
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-red-600">
                    {ilan.acilSatisFiyat ? new Intl.NumberFormat('tr-TR').format(ilan.acilSatisFiyat) + ' ₺' : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {fmtDate(ilan.acilSatisBitis)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold ${
                      daysLeft(ilan.acilSatisBitis) === 'Doldu' ? 'text-red-500' : 'text-emerald-600'
                    }`}>
                      {daysLeft(ilan.acilSatisBitis)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleKaldir(ilan.id!)}
                      className="text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition"
                    >
                      Acil Satışı Kaldır
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TAB — GERİ BİLDİRİMLER
════════════════════════════════════════════════════════════ */
interface AdminGeriBildirim {
  id: string;
  tip: 'istek' | 'sikayet';
  baslik: string;
  aciklama: string;
  userId: string;
  userEmail: string;
  userName: string;
  tarih: { seconds: number } | null;
  durum: 'beklemede' | 'inceleniyor' | 'cozuldu';
}

/* ═══════════════════════════════════════════════════════════
   HABERLER TAB
════════════════════════════════════════════════════════════ */
interface AdminHaber {
  id?:        string;
  baslik:     string;
  kaynak:     string;
  kaynakUrl:  string;
  ozet:       string;
  icerik:     string;
  kategori:   string;
  bolge:      string; /* 'turkiye' | 'dunya' */
  gorselUrl:  string;
  yayinda:    boolean;
  arsivlendi: boolean;
  baslikEn?:  string;
  ozetEn?:    string;
  icerikEn?:  string;
  otomatik?:  boolean;
  _seed?:     boolean;
}

const BOSH_HABER: Omit<AdminHaber, 'id'> = {
  baslik: '', kaynak: '', kaynakUrl: 'https://', ozet: '', icerik: '',
  kategori: 'genel', bolge: 'turkiye', gorselUrl: '', yayinda: true, arsivlendi: false,
  baslikEn: '', ozetEn: '', icerikEn: '',
};


type HaberDurum = 'all' | 'taslak' | 'yayinda' | 'arsiv';

interface Onerilen { baslik: string; kaynak: string; kaynakUrl: string; ozet: string; icerik?: string; gorselUrl?: string; kategori: string; bolge: string; tarih: string }

function haberDurumHesapla(h: AdminHaber): 'taslak' | 'yayinda' | 'arsiv' {
  if (h.arsivlendi) return 'arsiv';
  if (h.yayinda)    return 'yayinda';
  return 'taslak';
}

/* ─── Haber Kaynakları ──────────────────────────────────── */
interface AdminHaberKaynagi {
  id?:            string;
  ad:             string;
  url:            string;
  aramaKelimesi:  string;
  bolge:          string;
  aktif:          boolean;
  eklenmeTarihi?: { seconds: number } | null;
  _seed?:         boolean;
}

const BOSH_KAYNAK: Omit<AdminHaberKaynagi, 'id'> = {
  ad: '', url: 'https://', aramaKelimesi: '', bolge: 'turkiye', aktif: true,
};

function KaynaklarTabContent() {
  const [liste,      setListe]      = useState<AdminHaberKaynagi[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modalAcik,  setModalAcik]  = useState(false);
  const [duzenle,    setDuzenle]    = useState<AdminHaberKaynagi | null>(null);
  const [form,       setForm]       = useState<Omit<AdminHaberKaynagi, 'id'>>(BOSH_KAYNAK);
  const [kaydediyor, setKaydediyor] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'haberKaynaklari'), (snap) => {
      setListe(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AdminHaberKaynagi))
          .sort((a, b) => a.ad.localeCompare(b.ad, 'tr')),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  function acModal(kaynak?: AdminHaberKaynagi) {
    if (kaynak) {
      setDuzenle(kaynak);
      setForm({ ad: kaynak.ad, url: kaynak.url, aramaKelimesi: kaynak.aramaKelimesi ?? '', bolge: kaynak.bolge, aktif: kaynak.aktif });
    } else {
      setDuzenle(null);
      setForm(BOSH_KAYNAK);
    }
    setModalAcik(true);
  }

  async function handleKaydet() {
    if (!form.ad.trim() || !form.url.trim()) {
      toast.error('Ad ve URL zorunludur.');
      return;
    }
    setKaydediyor(true);
    try {
      if (duzenle?.id) {
        await updateDoc(doc(db, 'haberKaynaklari', duzenle.id), { ...form });
        toast.success('Kaynak güncellendi.');
      } else {
        await addDoc(collection(db, 'haberKaynaklari'), { ...form, eklenmeTarihi: serverTimestamp() });
        toast.success('Kaynak eklendi.');
      }
      setModalAcik(false);
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setKaydediyor(false);
    }
  }

  async function handleSil(id: string) {
    if (!window.confirm('Bu kaynağı silmek istiyor musunuz?')) return;
    await deleteDoc(doc(db, 'haberKaynaklari', id));
    toast.success('Kaynak silindi.');
  }

  async function handleAktifToggle(id: string, aktif: boolean) {
    await updateDoc(doc(db, 'haberKaynaklari', id), { aktif: !aktif });
  }

  if (loading) return <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{liste.length} kaynak</p>
        <button
          onClick={() => acModal()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <Plus className="w-4 h-4" /> Kaynak Ekle
        </button>
      </div>

      {liste.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Henüz kaynak yok.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left py-3 pr-4">Kaynak Adı</th>
                <th className="text-left py-3 pr-4">URL</th>
                <th className="text-left py-3 pr-4">Arama Kelimesi</th>
                <th className="text-left py-3 pr-4">Bölge</th>
                <th className="text-left py-3 pr-4">Durum</th>
                <th className="text-right py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {liste.map((k) => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-800">{k.ad}</td>
                  <td className="py-3 pr-4">
                    <a href={k.url} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-emerald-600 hover:underline truncate max-w-[200px] block">{k.url}</a>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{k.aramaKelimesi || '—'}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      k.bolge === 'dunya' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {k.bolge === 'dunya' ? '🌍 Dünyadan' : '🇹🇷 Türkiye'}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={() => handleAktifToggle(k.id!, k.aktif)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                        k.aktif ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {k.aktif ? 'Aktif' : 'Pasif'}
                    </button>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => acModal(k)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSil(k.id!)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalAcik(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">{duzenle ? 'Kaynağı Düzenle' : 'Yeni Kaynak'}</h3>
              <button onClick={() => setModalAcik(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak Adı *</label>
                <input value={form.ad} onChange={(e) => setForm({ ...form, ad: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ör. İMSAD, ArchDaily…" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arama Kelimesi</label>
                <input value={form.aramaKelimesi} onChange={(e) => setForm({ ...form, aramaKelimesi: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="ör. prefabrik, konteyner ev, modular construction..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bölge</label>
                <select value={form.bolge} onChange={(e) => setForm({ ...form, bolge: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="turkiye">🇹🇷 Türkiye</option>
                  <option value="dunya">🌍 Dünyadan</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600" />
                <span className="text-sm text-gray-700">Aktif</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAcik(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleKaydet} disabled={kaydediyor}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                {kaydediyor ? 'Kaydediliyor…' : duzenle ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

function HaberlerTab() {
  const [altTab,        setAltTab]        = useState<'haberler' | 'kaynaklar'>('haberler');
  const [liste,         setListe]         = useState<AdminHaber[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [modalAcik,     setModalAcik]     = useState(false);
  const [duzenle,       setDuzenle]       = useState<AdminHaber | null>(null);
  const [form,          setForm]          = useState<Omit<AdminHaber, 'id'>>(BOSH_HABER);
  const [kaydediyor,    setKaydediyor]    = useState(false);
  const [filtre,        setFiltre]        = useState<HaberDurum>('yayinda');
  const [aiYukleniyor,  setAiYukleniyor]  = useState(false);
  const [onerilenler,   setOnerilenler]   = useState<Onerilen[]>([]);
  const [aiPanelAcik,   setAiPanelAcik]  = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'haberler'),
      async (snap) => {
        const haberler = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AdminHaber))
          .sort((a, b) => {
            const ta = (a as unknown as { tarih?: { seconds: number } }).tarih?.seconds ?? 0;
            const tb = (b as unknown as { tarih?: { seconds: number } }).tarih?.seconds ?? 0;
            return tb - ta;
          });
        setListe(haberler);
        setLoading(false);

        /* GÖREV 3c — 6 aydan eski taslakları otomatik arşivle */
        const altiAyOnce = Date.now() - 180 * 24 * 60 * 60 * 1000;
        const eskiTaslaklar = haberler.filter((h) => {
          if (h.yayinda || h.arsivlendi) return false;
          const sn = (h as unknown as { tarih?: { seconds: number } }).tarih?.seconds;
          return sn != null && sn * 1000 < altiAyOnce;
        });
        for (const h of eskiTaslaklar) {
          await updateDoc(doc(db, 'haberler', h.id!), { arsivlendi: true });
        }
        if (eskiTaslaklar.length > 0) {
          toast.success(`${eskiTaslaklar.length} eski taslak otomatik arşivlendi.`);
        }
      },
    );
    return unsub;
  }, []);

  const goruntule = filtre === 'all'
    ? liste
    : liste.filter((h) => haberDurumHesapla(h) === filtre);

  const sayilar = {
    taslak:  liste.filter((h) => haberDurumHesapla(h) === 'taslak').length,
    yayinda: liste.filter((h) => haberDurumHesapla(h) === 'yayinda').length,
    arsiv:   liste.filter((h) => haberDurumHesapla(h) === 'arsiv').length,
  };

  function acModal(haber?: AdminHaber) {
    if (haber) {
      setDuzenle(haber);
      setForm({
        baslik: haber.baslik, kaynak: haber.kaynak, kaynakUrl: haber.kaynakUrl,
        ozet: haber.ozet, icerik: haber.icerik ?? '', kategori: haber.kategori, bolge: haber.bolge ?? 'turkiye',
        gorselUrl: haber.gorselUrl ?? '', yayinda: haber.yayinda, arsivlendi: haber.arsivlendi ?? false,
        baslikEn: haber.baslikEn ?? '', ozetEn: haber.ozetEn ?? '', icerikEn: haber.icerikEn ?? '',
      });
    } else {
      setDuzenle(null);
      setForm(BOSH_HABER);
    }
    setModalAcik(true);
  }

  async function handleKaydet() {
    if (!form.baslik.trim() || !form.kaynak.trim() || !form.kaynakUrl.trim()) {
      toast.error('Başlık, kaynak ve kaynak URL zorunludur.');
      return;
    }
    setKaydediyor(true);
    try {
      if (duzenle?.id) {
        await updateDoc(doc(db, 'haberler', duzenle.id), { ...form, guncellenmeTarih: serverTimestamp() });
        toast.success('Haber güncellendi.');
      } else {
        await addDoc(collection(db, 'haberler'), {
          ...form, yayinda: true, arsivlendi: false, tarih: serverTimestamp(),
        });
        toast.success('Haber yayına eklendi.');
      }
      setModalAcik(false);
    } catch {
      toast.error('Kayıt sırasında hata oluştu.');
    } finally {
      setKaydediyor(false);
    }
  }

  async function handleSil(id: string) {
    if (!window.confirm('Bu haberi silmek istiyor musunuz?')) return;
    await deleteDoc(doc(db, 'haberler', id));
    toast.success('Haber silindi.');
  }

  async function handleOnayla(id: string) {
    await updateDoc(doc(db, 'haberler', id), { yayinda: true, arsivlendi: false });
    toast.success('Haber yayına alındı.');
  }

  async function handleArsivle(id: string) {
    await updateDoc(doc(db, 'haberler', id), { yayinda: false, arsivlendi: true });
    toast.success('Haber arşive taşındı.');
  }

  async function handleTaslaga(id: string) {
    await updateDoc(doc(db, 'haberler', id), { yayinda: false, arsivlendi: false });
    toast.success('Haber taslağa alındı.');
  }

  async function handleAiOner() {
    setAiYukleniyor(true);
    setAiPanelAcik(true);
    try {
      const res = await fetch('/api/fetch-news');
      if (!res.ok) throw new Error('API hatası');
      const data = await res.json() as { haberler: Onerilen[] };
      setOnerilenler(data.haberler ?? []);
    } catch {
      toast.error('Haberler alınamadı.');
      setAiPanelAcik(false);
    } finally {
      setAiYukleniyor(false);
    }
  }

  async function handleOneriEkle(o: Onerilen) {
    await addDoc(collection(db, 'haberler'), {
      baslik: o.baslik, kaynak: o.kaynak, kaynakUrl: o.kaynakUrl,
      ozet: o.ozet, icerik: o.icerik ?? '', kategori: o.kategori,
      bolge: o.bolge ?? 'turkiye', gorselUrl: o.gorselUrl ?? '',
      yayinda: true, arsivlendi: false, otomatik: true, tarih: serverTimestamp(),
    });
    toast.success('Yayına eklendi.');
    setOnerilenler((prev) => prev.filter((x) => x.kaynakUrl !== o.kaynakUrl));
  }

  async function handleTumunuYayinla() {
    if (onerilenler.length === 0) return;
    let eklenen = 0;
    for (const o of onerilenler) {
      await addDoc(collection(db, 'haberler'), {
        baslik: o.baslik, kaynak: o.kaynak, kaynakUrl: o.kaynakUrl,
        ozet: o.ozet, icerik: o.icerik ?? '', kategori: o.kategori,
        bolge: o.bolge ?? 'turkiye', gorselUrl: o.gorselUrl ?? '',
        yayinda: true, arsivlendi: false, otomatik: true, tarih: serverTimestamp(),
      });
      eklenen++;
    }
    setOnerilenler([]);
    toast.success(`${eklenen} haber yayına eklendi.`);
  }

  async function handleTaslakTumunuOnayla() {
    const taslaklar = liste.filter((h) => !h.yayinda && !h.arsivlendi);
    if (taslaklar.length === 0) {
      toast.info('Onaylanacak taslak yok.');
      return;
    }
    if (!window.confirm(`${taslaklar.length} taslak haberi yayına almak istiyor musunuz?`)) return;
    for (const h of taslaklar) {
      await updateDoc(doc(db, 'haberler', h.id!), { yayinda: true });
    }
    toast.success(`${taslaklar.length} haber yayına alındı.`);
  }

  if (loading && altTab === 'haberler') return <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>;

  const FILTRE_TANIMLARI: { key: HaberDurum; label: string }[] = [
    { key: 'yayinda', label: `Yayında (${sayilar.yayinda})` },
    { key: 'taslak',  label: `Taslak (${sayilar.taslak})` },
    { key: 'arsiv',   label: `Arşiv (${sayilar.arsiv})` },
    { key: 'all',     label: `Tümü (${liste.length})` },
  ];

  return (
    <div className="p-6">
      {/* Alt Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['haberler', 'kaynaklar'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAltTab(tab)}
            className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition capitalize -mb-px border-b-2 ${
              altTab === tab
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'haberler' ? 'Haberler' : 'Kaynaklar'}
          </button>
        ))}
      </div>

      {altTab === 'kaynaklar' && <KaynaklarTabContent />}

      {altTab === 'haberler' && (
      <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Haberler</h2>
          <p className="text-sm text-gray-500 mt-0.5">{liste.length} kayıt</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              setAiYukleniyor(true);
              try {
                const res = await fetch('/api/fetch-news');
                if (!res.ok) throw new Error('API hatası');
                const data = await res.json() as { haberler: Onerilen[] };
                const haberler = data.haberler ?? [];
                let eklenen = 0;
                for (const o of haberler) {
                  const mevcutMu = liste.some((h) => h.baslik === o.baslik || h.kaynakUrl === o.kaynakUrl);
                  if (!mevcutMu) {
                    await addDoc(collection(db, 'haberler'), {
                      baslik: o.baslik, kaynak: o.kaynak, kaynakUrl: o.kaynakUrl,
                      ozet: o.ozet, icerik: o.icerik ?? '', kategori: o.kategori,
                      bolge: o.bolge ?? 'turkiye', gorselUrl: o.gorselUrl ?? '',
                      yayinda: true, arsivlendi: false, otomatik: true, tarih: serverTimestamp(),
                    });
                    eklenen++;
                  }
                }
                if (eklenen > 0) toast.success(`${eklenen} haber yayına eklendi.`);
                else toast.info('Yeni haber bulunamadı (mevcut haberlerle aynı).');
              } catch {
                toast.error('Haberler alınamadı.');
              } finally {
                setAiYukleniyor(false);
              }
            }}
            disabled={aiYukleniyor}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-600 transition disabled:opacity-50"
          >
            <Newspaper className="w-4 h-4" /> {aiYukleniyor ? 'Getiriliyor…' : 'Günlük Haberleri Getir'}
          </button>
          <button
            onClick={handleAiOner}
            disabled={aiYukleniyor}
            className="flex items-center gap-2 border border-emerald-600 text-emerald-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-50 transition disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> {aiYukleniyor ? 'Yükleniyor…' : 'AI ile Haber Öner'}
          </button>
          <button
            onClick={() => acModal()}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
          >
            <Plus className="w-4 h-4" /> Yeni Haber Ekle
          </button>
        </div>
      </div>

      {/* Taslak uyarı banner */}
      {sayilar.taslak > 0 && (
        <div className="mb-5 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800">
            <strong>{sayilar.taslak} haber</strong> onay bekliyor.
          </p>
          <button
            onClick={handleTaslakTumunuOnayla}
            className="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
          >
            Tümünü Onayla
          </button>
        </div>
      )}

      {/* AI Öneri Paneli */}
      {aiPanelAcik && (
        <div className="mb-5 border border-emerald-200 rounded-xl bg-emerald-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-emerald-800 text-sm">AI Haber Önerileri</h3>
            <div className="flex items-center gap-2">
              {onerilenler.length > 0 && (
                <button
                  onClick={handleTumunuYayinla}
                  className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                >
                  Tümünü Yayınla
                </button>
              )}
              <button onClick={() => setAiPanelAcik(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {onerilenler.length === 0 ? (
            <p className="text-sm text-gray-500">Öneri bulunamadı veya tümü eklendi.</p>
          ) : (
            <div className="space-y-3">
              {onerilenler.map((o) => (
                <div key={o.kaynakUrl} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="flex gap-3">
                    {o.gorselUrl && (
                      <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={o.gorselUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{o.baslik}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{o.kaynak} · {o.bolge === 'dunya' ? 'Dünyadan' : 'Türkiye'} · {o.tarih}</p>
                    </div>
                    <button
                      onClick={() => handleOneriEkle(o)}
                      className="flex-shrink-0 self-start text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
                    >
                      Yayınla
                    </button>
                  </div>
                  {o.icerik && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">{o.icerik.slice(0, 200)}{o.icerik.length > 200 ? '…' : ''}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filtre chips */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTRE_TANIMLARI.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltre(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              filtre === key
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {goruntule.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Bu filtreye uygun haber yok.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left py-3 pr-4">Başlık</th>
                <th className="text-left py-3 pr-4">Kaynak</th>
                <th className="text-left py-3 pr-4">Kategori</th>
                <th className="text-left py-3 pr-4">Durum</th>
                <th className="text-right py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goruntule.map((h) => {
                const durum = haberDurumHesapla(h);
                return (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="font-medium text-gray-800 truncate flex items-center gap-1.5">
                        {h.otomatik && <Bot className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" title="Otomatik eklenen" />}
                        {h.baslik}
                      </p>
                      <a href={h.kaynakUrl} target="_blank" rel="noopener noreferrer"
                         className="text-xs text-emerald-600 hover:underline truncate block">{h.kaynakUrl}</a>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{h.kaynak}</td>
                    <td className="py-3 pr-4">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{h.kategori}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                        durum === 'yayinda' ? 'bg-emerald-100 text-emerald-700' :
                        durum === 'arsiv'   ? 'bg-gray-200 text-gray-500' :
                                             'bg-yellow-100 text-yellow-700'
                      }`}>
                        {durum === 'yayinda' ? 'Yayında' : durum === 'arsiv' ? 'Arşiv' : 'Taslak'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {durum === 'taslak' && (
                          <button onClick={() => handleOnayla(h.id!)}
                            className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-medium transition">
                            Onayla
                          </button>
                        )}
                        {durum === 'yayinda' && (
                          <button onClick={() => handleTaslaga(h.id!)}
                            className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded font-medium transition">
                            Taslağa Al
                          </button>
                        )}
                        {durum !== 'arsiv' && (
                          <button onClick={() => handleArsivle(h.id!)}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded font-medium transition">
                            Arşivle
                          </button>
                        )}
                        {durum === 'arsiv' && (
                          <button onClick={() => handleTaslaga(h.id!)}
                            className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded font-medium transition">
                            Geri Al
                          </button>
                        )}
                        <button onClick={() => acModal(h)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleSil(h.id!)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalAcik && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalAcik(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">{duzenle ? 'Haberi Düzenle' : 'Yeni Haber Ekle'}</h3>
              <button onClick={() => setModalAcik(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Haber başlığı" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak Adı *</label>
                  <input value={form.kaynak} onChange={(e) => setForm({ ...form, kaynak: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="AA, Hürriyet..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bölge</label>
                  <select value={form.bolge} onChange={(e) => setForm({ ...form, bolge: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="turkiye">🇹🇷 Türkiye</option>
                    <option value="dunya">🌍 Dünyadan</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak URL *</label>
                <input value={form.kaynakUrl} onChange={(e) => setForm({ ...form, kaynakUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Görsel URL</label>
                <input value={form.gorselUrl} onChange={(e) => setForm({ ...form, gorselUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://images.unsplash.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kısa Özet</label>
                <textarea value={form.ozet} onChange={(e) => setForm({ ...form, ozet: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Kartlarda görünecek kısa özet (2-3 cümle)..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik</label>
                <textarea value={form.icerik} onChange={(e) => setForm({ ...form, icerik: e.target.value })}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y font-mono"
                  placeholder="Detay sayfasında gösterilecek uzun içerik (5 paragraf, \n\n ile ayır)..." />
              </div>

              {/* İngilizce alanlar (opsiyonel) */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">🌐 İngilizce (Opsiyonel)</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Başlık (EN)</label>
                    <input value={form.baslikEn ?? ''} onChange={(e) => setForm({ ...form, baslikEn: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="English title (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Özet (EN)</label>
                    <textarea value={form.ozetEn ?? ''} onChange={(e) => setForm({ ...form, ozetEn: e.target.value })}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      placeholder="English summary (optional)" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İçerik (EN)</label>
                    <textarea value={form.icerikEn ?? ''} onChange={(e) => setForm({ ...form, icerikEn: e.target.value })}
                      rows={6}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y font-mono"
                      placeholder="English content (optional, 5 paragraphs)" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAcik(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                İptal
              </button>
              <button onClick={handleKaydet} disabled={kaydediyor}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                {kaydediyor ? 'Kaydediliyor…' : duzenle ? 'Güncelle' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

type GBDurum = 'all' | 'beklemede' | 'inceleniyor' | 'cozuldu';

function GeriBildirimlerTab() {
  const [liste,   setListe]   = useState<AdminGeriBildirim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<GBDurum>('all');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'geri_bildirimler'), (snap) => {
      setListe(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as AdminGeriBildirim))
          .sort((a, b) => (b.tarih?.seconds ?? 0) - (a.tarih?.seconds ?? 0)),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  async function handleDurumGuncelle(id: string, durum: AdminGeriBildirim['durum']) {
    await updateDoc(doc(db, 'geri_bildirimler', id), { durum });
    toast.success('Durum güncellendi.');
  }

  async function handleSil(id: string) {
    if (!window.confirm('Bu geri bildirimi silmek istediğinize emin misiniz?')) return;
    await deleteDoc(doc(db, 'geri_bildirimler', id));
    toast.success('Geri bildirim silindi.');
  }

  const goruntulenen = filter === 'all' ? liste : liste.filter((g) => g.durum === filter);

  const tabCls = (t: GBDurum) =>
    `px-3 py-1.5 text-sm rounded-lg font-medium transition ${
      filter === t ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;

  const tipBadge = (tip: AdminGeriBildirim['tip']) =>
    tip === 'istek'
      ? <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">📋 İstek</span>
      : <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">⚠️ Şikayet</span>;

  const durumRenk: Record<AdminGeriBildirim['durum'], string> = {
    beklemede:   'bg-amber-100 text-amber-700',
    inceleniyor: 'bg-blue-100 text-blue-700',
    cozuldu:     'bg-emerald-100 text-emerald-700',
  };

  if (loading) return <div className="p-6 text-sm text-gray-500">Yükleniyor…</div>;

  return (
    <div className="p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">Geri Bildirimler</h2>
        <p className="text-sm text-gray-500 mt-0.5">{liste.length} kayıt</p>
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['all', 'beklemede', 'inceleniyor', 'cozuldu'] as GBDurum[]).map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={tabCls(t)}>
            {t === 'all' ? 'Tümü' : t === 'beklemede' ? 'Beklemede' : t === 'inceleniyor' ? 'İnceleniyor' : 'Çözüldü'}
            {t === 'all' && ` (${liste.length})`}
            {t !== 'all' && ` (${liste.filter((g) => g.durum === t).length})`}
          </button>
        ))}
      </div>

      {goruntulenen.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-sm">Geri bildirim bulunamadı.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tip</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Başlık</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">Kullanıcı</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">Tarih</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {goruntulenen.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">{tipBadge(g.tip)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 truncate max-w-[200px]" title={g.baslik}>{g.baslik}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]" title={g.aciklama}>{g.aciklama}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-gray-700 truncate max-w-[150px]">{g.userName}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[150px]">{g.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                    {g.tarih ? new Date(g.tarih.seconds * 1000).toLocaleDateString('tr-TR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={g.durum}
                      onChange={(e) => handleDurumGuncelle(g.id, e.target.value as AdminGeriBildirim['durum'])}
                      className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${durumRenk[g.durum]}`}
                    >
                      <option value="beklemede">Beklemede</option>
                      <option value="inceleniyor">İnceleniyor</option>
                      <option value="cozuldu">Çözüldü</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSil(g.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',   label: 'Genel Bakış',   icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'settings',   label: 'Site Ayarları', icon: <Settings className="w-4 h-4" /> },
  { key: 'flashDeals', label: 'Flash İlanlar', icon: <Zap className="w-4 h-4" /> },
  { key: 'ilanlar',   label: 'İlanlar',        icon: <FileText className="w-4 h-4" /> },
  { key: 'firms',      label: 'Firmalar',      icon: <BuildingIcon className="w-4 h-4" /> },
  { key: 'talepler',   label: 'Talepler',      icon: <Inbox className="w-4 h-4" /> },
  { key: 'blog',       label: 'Blog',          icon: <BookOpen   className="w-4 h-4" /> },
  { key: 'rapor',      label: 'Rapor',         icon: <BarChart2  className="w-4 h-4" /> },
  { key: 'features',   label: 'Özellikler',    icon: <Sliders    className="w-4 h-4" /> },
  { key: 'yorumlar',   label: 'Puanlar',       icon: <ThumbsUp   className="w-4 h-4" /> },
  { key: 'hakkimizda', label: 'Hakkımızda',    icon: <BookOpen   className="w-4 h-4" /> },
  { key: 'acilIlanlar',      label: 'Acil İlanlar',    icon: <Flame className="w-4 h-4 text-red-500" /> },
  { key: 'geriBildirimler', label: 'Geri Bildirimler', icon: <Inbox className="w-4 h-4" /> },
  { key: 'haberler',        label: 'Haberler',         icon: <Newspaper className="w-4 h-4" /> },
];

export default function AdminDashboardPage() {
  const navigate            = useNavigate();
  const [user, setUser]     = useState<User | null>(null);
  const [tab,  setTab]      = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seedBusy,      setSeedBusy]      = useState(false);
  const [clearBusy,     setClearBusy]     = useState(false);
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({ talepler: 0, firms: 0, yorumlar: 0, quotes: 0, geriBildirimler: 0, haberTaslak: 0 });

  async function handleSeed() {
    toast.info('10 firma, 30 ilan, 15 talep, 10 teklif eklenecek…');
    setSeedBusy(true);
    try {
      await seedFirestore();
      toast.success('Test verisi başarıyla eklendi! (10 firma, 30 ilan, 15 talep, 10 teklif)');
    } catch {
      toast.error('Test verisi eklenirken hata oluştu.');
    } finally {
      setSeedBusy(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Tüm test verisi silinecek. Devam edilsin mi?')) return;
    setClearBusy(true);
    try {
      await clearSeedData();
      toast.success('Test verisi temizlendi.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Temizleme sırasında hata oluştu.');
    } finally {
      setClearBusy(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) navigate('/admin', { replace: true });
      else setUser(u);
    });
    return unsub;
  }, [navigate]);

  /* ── Admin kaydını otomatik oluştur (ilk kurulum bootstrap) ─ */
  useEffect(() => {
    if (!user) return;
    setDoc(doc(db, 'admins', user.uid), { email: user.email ?? '' })
      .catch(() => {
        // Belge zaten varsa update izni yok — bu normal, sessizce geç
      });
  }, [user]);

  /* ── Süresi dolan ilanları otomatik kapat ───────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'ilanlar'), where('status', '==', 'aktif')));
        const now  = Date.now();
        const expired = snap.docs.filter((d) => {
          const data = d.data();
          return data.ilanBitis && data.aktif !== false && data.ilanBitis.seconds * 1000 < now;
        });
        if (expired.length === 0) return;
        const batch = writeBatch(db);
        expired.forEach((d) => batch.update(doc(db, 'ilanlar', d.id), { aktif: false }));
        await batch.commit();
        // sessizce tamamlandı
      } catch {
        // expire check hatası — sessizce geç
      }
    })();
  }, [user]);

  /* ── Bekleyen işlem sayıları — real-time ────────────────── */
  useEffect(() => {
    if (!user) return;
    const u1 = onSnapshot(
      query(collection(db, 'taleplar'), where('status', '==', 'beklemede')),
      (s) => setPendingCounts((p) => ({ ...p, talepler: s.size })),
    );
    const u2 = onSnapshot(
      query(collection(db, 'firms'), where('status', '==', 'pending')),
      (s) => setPendingCounts((p) => ({ ...p, firms: s.size })),
    );
    const u3 = onSnapshot(
      query(collection(db, 'quotes'), where('durum', '==', 'beklemede')),
      (s) => setPendingCounts((p) => ({ ...p, quotes: s.size })),
    );
    const u4 = onSnapshot(
      query(collection(db, 'geri_bildirimler'), where('durum', '==', 'beklemede')),
      (s) => setPendingCounts((p) => ({ ...p, geriBildirimler: s.size })),
    );
    const u5 = onSnapshot(
      query(collection(db, 'haberler'), where('yayinda', '==', false)),
      (s) => {
        const taslakSayisi = s.docs.filter((d) => !d.data().arsivlendi).length;
        setPendingCounts((p) => ({ ...p, haberTaslak: taslakSayisi }));
      },
    );
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/admin', { replace: true });
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <SEOMeta
        title="Admin Dashboard"
        description="ModülerPazar yönetim paneli."
        url="/admin/dashboard"
      />

      {/* ── Top bar ─────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Left: hamburger (mobile) + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Menüyü aç/kapat"
              className="sm:hidden p-1.5 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={logoSrc} alt="ModülerPazar" className="h-7 w-auto" />
              <span className="text-xs text-gray-400 font-medium border-l border-gray-200 pl-2">Admin</span>
            </div>
          </div>

          {/* Right: user + sign out */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-gray-500 truncate max-w-[180px]">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 gap-6">

        {/* ── Sidebar ───────────────────────────────────── */}
        <aside className={`
          fixed sm:static inset-y-0 left-0 z-30 sm:z-auto
          w-56 bg-white sm:bg-transparent border-r sm:border-none border-gray-200
          transform transition-transform duration-200 sm:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
          flex flex-col pt-16 sm:pt-0 px-4 sm:px-0
        `}>
          <nav className="space-y-1">
            {TABS.map((t) => {
              const badge =
                t.key === 'talepler'        ? pendingCounts.talepler :
                t.key === 'firms'           ? pendingCounts.firms    :
                t.key === 'geriBildirimler' ? pendingCounts.geriBildirimler :
                t.key === 'haberler'        ? pendingCounts.haberTaslak : 0;
              return (
                <button
                  key={t.key}
                  onClick={() => { setTab(t.key); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    tab === t.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  {t.icon}
                  <span className="flex-1 text-left">{t.label}</span>
                  {badge > 0 && (
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto pb-6 sm:pb-0 pt-4 border-t border-gray-100 sm:block hidden">
            <div className="flex items-center gap-2 px-3 py-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">
                {new Date().toLocaleDateString('tr-TR')}
              </span>
            </div>
            {/* Test verisi araçları */}
            <div className="px-3 pt-2 pb-1 space-y-1 border-t border-dashed border-gray-200 mt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Geliştirici</p>
              <button
                onClick={handleSeed}
                disabled={seedBusy || clearBusy}
                className="w-full text-left text-xs px-2 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition"
              >
                {seedBusy ? '⏳ Ekleniyor…' : '🌱 Test Verisi Ekle'}
              </button>
              <button
                onClick={handleClear}
                disabled={seedBusy || clearBusy}
                className="w-full text-left text-xs px-2 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
              >
                {clearBusy ? '⏳ Temizleniyor…' : '🗑️ Test Verisini Temizle'}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 sm:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main content ──────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {tab === 'overview'   && <OverviewTab pendingCounts={pendingCounts} />}
          {tab === 'settings'   && <SettingsTab />}
          {tab === 'flashDeals' && <FlashDealsTab />}
          {tab === 'ilanlar'   && <IlanlarTab />}
          {tab === 'firms'      && <FirmsTab />}
          {tab === 'talepler'   && <TaleplerTab />}
          {tab === 'blog'       && <BlogTab />}
          {tab === 'rapor'      && <RaporTab />}
          {tab === 'features'   && <FeaturesTab />}
          {tab === 'yorumlar'   && <YorumlarTab />}
          {tab === 'hakkimizda' && <HakkimizdaTab />}
          {tab === 'acilIlanlar'      && <AcilIlanlarTab />}
          {tab === 'geriBildirimler' && <GeriBildirimlerTab />}
          {tab === 'haberler'       && <HaberlerTab />}
        </main>
      </div>
    </div>
  );
}
