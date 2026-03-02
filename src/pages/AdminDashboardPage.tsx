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
} from 'firebase/firestore';
import { CATEGORIES } from '../data/categories';
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts';
import { toast } from 'sonner';
import {
  LayoutDashboard, Settings, Zap, Building2 as BuildingIcon,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle,
  Save, X, Menu, ShieldCheck, Clock, Link as LinkIcon,
  Send, Eye, EyeOff, MapPin, Tag, Banknote, FileText, ChevronDown, ChevronUp,
  Inbox, BookOpen, BarChart2, Download,
} from 'lucide-react';
import logoSrc from '../assets/logo.svg';
import { auth, db } from '../lib/firebase';
import { seedFirestore, clearSeedData } from '../scripts/seedFirestore';

/* ═══════════════════════════════════════════════════════════
   TYPES
════════════════════════════════════════════════════════════ */
interface SiteSettings {
  name:     string;
  tagline:  string;
  phone:    string;
  email:    string;
  logoUrl:  string;
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
}

type TabKey = 'overview' | 'settings' | 'flashDeals' | 'ilanlar' | 'firms' | 'talepler' | 'blog' | 'rapor';
type FirmStatus  = 'all' | 'pending' | 'approved' | 'rejected';
type TalepStatus = 'all' | 'beklemede' | 'iletildi' | 'tamamlandi';

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
  phone: '0850 123 45 67', email: 'info@modulerpazar.com', logoUrl: '',
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
   TAB 1 — OVERVIEW
════════════════════════════════════════════════════════════ */
function OverviewTab() {
  const [counts, setCounts] = useState({ ilanlar: 0, approved: 0, pending: 0, rejected: 0, talepler: 0 });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'ilanlar'), (s) =>
      setCounts((p) => ({ ...p, ilanlar: s.size })));
    const u2 = onSnapshot(collection(db, 'firms'), (s) => {
      const docs = s.docs.map((d) => d.data() as AdminFirm);
      setCounts((p) => ({
        ...p,
        approved: docs.filter((f) => f.status === 'approved').length,
        pending:  docs.filter((f) => f.status === 'pending').length,
        rejected: docs.filter((f) => f.status === 'rejected').length,
      }));
    });
    const u3 = onSnapshot(collection(db, 'taleplar'), (s) =>
      setCounts((p) => ({ ...p, talepler: s.size })));
    return () => { u1(); u2(); u3(); };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Genel Bakış</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam İlanlar"    value={counts.ilanlar}  color="text-emerald-600" sub="Firestore ilanlar" />
        <StatCard label="Onaylı Firmalar"   value={counts.approved} color="text-blue-600"    sub="Aktif firmalar" />
        <StatCard label="Onay Bekleyen"     value={counts.pending}  color="text-amber-500"   sub="İnceleme gerekiyor" />
        <StatCard label="Gelen Talepler"    value={counts.talepler} color="text-purple-600"  sub="Müşteri talepleri" />
      </div>

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
function SettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as SiteSettings);
    });
    return unsub;
  }, []);

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
          <Field label="Site Adı" id="siteName"  value={settings.name}  onChange={(v) => setSettings((p) => ({ ...p, name: v }))} />
          <Field label="Telefon"  id="sitePhone" value={settings.phone} onChange={(v) => setSettings((p) => ({ ...p, phone: v }))} />
          <Field label="E-posta"  id="siteEmail" value={settings.email} onChange={(v) => setSettings((p) => ({ ...p, email: v }))} type="email" />
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
                  <img src={form.image} alt="Önizleme"
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
  const [filter,    setFilter]    = useState<TalepStatus>('all');
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [sending,   setSending]   = useState<string | null>(null);

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'taleplar'), (snap) =>
      setTalepler(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminTalep))));
    const u2 = onSnapshot(collection(db, 'firms'), (snap) =>
      setFirms(snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminFirm))));
    return () => { u1(); u2(); };
  }, []);

  /* Firmalara İlet — 3 kademeli eşleştirme */
  const handleIlet = async (talep: AdminTalep) => {
    if (!talep.id) return;
    setSending(talep.id);
    try {
      // Tüm onaylı firmalar — userId olmayanlar eşleşmeye dahil, bildirime dahil değil
      const approved = firms.filter((f) => f.status === 'approved');

      console.log(
        `[ilet] toplam firms: ${firms.length}`,
        `| onaylı: ${approved.length}`,
        `| status değerleri:`, [...new Set(firms.map((f) => f.status))],
      );

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

      console.log(`[ilet] eşleşme: "${matchDesc}" → ${matching.length} firma`);

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
        console.error('[RaporTab] Veri yüklenemedi:', err);
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

      const resp = await fetch('/api/sheets-export', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows }),
      });

      if (resp.ok) {
        toast.success(`${rows.length} talep Google Sheets'e aktarıldı.`);
      } else {
        const data = await resp.json() as { error?: string };
        if (resp.status === 503) {
          toast.error('SHEETS_WEBHOOK_URL ayarlı değil. Kurulum kılavuzuna bakın.');
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

        {/* Kurulum kılavuzu */}
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
              Key: <code className="bg-gray-200 px-1 rounded font-mono">SHEETS_WEBHOOK_URL</code>
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
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN — ADMIN DASHBOARD
════════════════════════════════════════════════════════════ */
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',   label: 'Genel Bakış',   icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'settings',   label: 'Site Ayarları', icon: <Settings className="w-4 h-4" /> },
  { key: 'flashDeals', label: 'Flash İlanlar', icon: <Zap className="w-4 h-4" /> },
  { key: 'ilanlar',   label: 'İlanlar',        icon: <FileText className="w-4 h-4" /> },
  { key: 'firms',      label: 'Firmalar',      icon: <BuildingIcon className="w-4 h-4" /> },
  { key: 'talepler',   label: 'Talepler',      icon: <Inbox className="w-4 h-4" /> },
  { key: 'blog',       label: 'Blog',          icon: <BookOpen   className="w-4 h-4" /> },
  { key: 'rapor',      label: 'Rapor',         icon: <BarChart2  className="w-4 h-4" /> },
];

export default function AdminDashboardPage() {
  const navigate            = useNavigate();
  const [user, setUser]     = useState<User | null>(null);
  const [tab,  setTab]      = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seedBusy,  setSeedBusy]  = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  async function handleSeed() {
    console.log('[seed] Seed başlatıldı (admin)');
    toast.info('10 firma, 30 ilan, 15 talep, 10 teklif eklenecek…');
    setSeedBusy(true);
    try {
      await seedFirestore();
      toast.success('Test verisi başarıyla eklendi! (10 firma, 30 ilan, 15 talep, 10 teklif)');
      console.log('[seed] Başarıyla tamamlandı');
    } catch (e) {
      console.error('[seed] HATA:', e);
      toast.error('Test verisi eklenirken hata oluştu.');
    } finally {
      setSeedBusy(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Tüm test verisi silinecek. Devam edilsin mi?')) return;
    console.log('[clear] Temizleme başlatıldı (admin)');
    setClearBusy(true);
    try {
      await clearSeedData();
      toast.success('Test verisi temizlendi.');
      console.log('[clear] Başarıyla tamamlandı');
    } catch (e) {
      console.error('[clear] HATA:', e);
      toast.error('Temizleme sırasında hata oluştu.');
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
            {TABS.map((t) => (
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
                {t.label}
              </button>
            ))}
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
          {tab === 'overview'   && <OverviewTab />}
          {tab === 'settings'   && <SettingsTab />}
          {tab === 'flashDeals' && <FlashDealsTab />}
          {tab === 'ilanlar'   && <IlanlarTab />}
          {tab === 'firms'      && <FirmsTab />}
          {tab === 'talepler'   && <TaleplerTab />}
          {tab === 'blog'       && <BlogTab />}
          {tab === 'rapor'      && <RaporTab />}
        </main>
      </div>
    </div>
  );
}
