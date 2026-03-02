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
} from 'firebase/firestore';
import { CATEGORIES } from '../data/categories';
import { BLOG_POSTS, type BlogPost } from '../data/blogPosts';
import { toast } from 'sonner';
import {
  LayoutDashboard, Settings, Zap, Building2 as BuildingIcon,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle,
  Save, X, Menu, ShieldCheck, Clock, Link as LinkIcon,
  Send, Eye, MapPin, Tag, Banknote, FileText, ChevronDown, ChevronUp,
  Inbox, BookOpen,
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

type TabKey = 'overview' | 'settings' | 'flashDeals' | 'ilanlar' | 'firms' | 'talepler' | 'blog';
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

  /* Firmalara İlet */
  const handleIlet = async (talep: AdminTalep) => {
    if (!talep.id) return;
    setSending(talep.id);
    try {
      const matching = firms.filter((f) => {
        const catMatch =
          (Array.isArray(f.kategoriler) && f.kategoriler.includes(talep.kategori)) ||
          f.category === talep.kategori;
        const cityMatch = f.sehir === talep.sehir || f.city === talep.sehir;
        return catMatch && cityMatch && f.status === 'approved' && f.userId;
      });

      if (matching.length === 0) {
        toast.warning('Bu kriterlere uygun onaylı firma bulunamadı.');
        return;
      }

      const newIds = matching
        .map((f) => f.userId as string)
        .filter((uid) => !talep.firmaGonderilenler.includes(uid));

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

      toast.success(`${newIds.length} firmaya bildirim gönderildi.`);
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
  slug: string;
  fiyatBilgisi: string;
  guncelleme: { toDate: () => Date } | null;
}

function BlogTab() {
  const [settings, setSettings] = useState<Record<string, BlogSetting>>({});
  const [editing, setEditing]   = useState<BlogPost | null>(null);
  const [fiyatMetni, setFiyatMetni] = useState('');
  const [saving, setSaving]     = useState(false);

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
    setEditing(post);
    setFiyatMetni(settings[post.slug]?.fiyatBilgisi ?? '');
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'blogSettings', editing.slug), {
        slug: editing.slug,
        fiyatBilgisi: fiyatMetni.trim(),
        guncelleme: serverTimestamp(),
      });
      toast.success('Fiyat bilgisi kaydedildi.');
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
          const saved = settings[post.slug];
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
                {saved?.fiyatBilgisi ? (
                  <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Fiyat bilgisi mevcut
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Fiyat bilgisi yok</p>
                )}
              </div>
              <button
                onClick={() => openEdit(post)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-400 hover:text-emerald-700 transition"
              >
                <Pencil className="w-3.5 h-3.5" />
                Düzenle
              </button>
            </div>
          );
        })}
      </div>

      {/* Düzenle modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Fiyat Bilgisini Düzenle</h3>
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{editing.baslik}</p>
              </div>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">Fiyat Bilgileri</label>
              <textarea
                value={fiyatMetni}
                onChange={(e) => setFiyatMetni(e.target.value)}
                rows={6}
                placeholder="Güncel fiyat bilgilerini girin (paragraf olarak)..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Bu metin blog yazısında içerik sonunda yeşil bir kutuda gösterilir.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
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
   MAIN — ADMIN DASHBOARD
════════════════════════════════════════════════════════════ */
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',   label: 'Genel Bakış',   icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'settings',   label: 'Site Ayarları', icon: <Settings className="w-4 h-4" /> },
  { key: 'flashDeals', label: 'Flash İlanlar', icon: <Zap className="w-4 h-4" /> },
  { key: 'ilanlar',   label: 'İlanlar',        icon: <FileText className="w-4 h-4" /> },
  { key: 'firms',      label: 'Firmalar',      icon: <BuildingIcon className="w-4 h-4" /> },
  { key: 'talepler',   label: 'Talepler',      icon: <Inbox className="w-4 h-4" /> },
  { key: 'blog',       label: 'Blog',          icon: <BookOpen className="w-4 h-4" /> },
];

export default function AdminDashboardPage() {
  const navigate            = useNavigate();
  const [user, setUser]     = useState<User | null>(null);
  const [tab,  setTab]      = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seedBusy,  setSeedBusy]  = useState(false);
  const [clearBusy, setClearBusy] = useState(false);

  async function handleSeed() {
    setSeedBusy(true);
    try {
      await seedFirestore();
      toast.success('Test verisi başarıyla eklendi! (10 firma, 30 ilan, 15 talep, 10 teklif)');
    } catch (e) {
      toast.error('Test verisi eklenirken hata oluştu.');
      console.error(e);
    } finally {
      setSeedBusy(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Tüm test verisi silinecek (_seed: true). Devam edilsin mi?')) return;
    setClearBusy(true);
    try {
      await clearSeedData();
      toast.success('Test verisi temizlendi.');
    } catch (e) {
      toast.error('Temizleme sırasında hata oluştu.');
      console.error(e);
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
        </main>
      </div>
    </div>
  );
}
