import { useEffect, useRef, useState } from 'react';
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
} from 'firebase/firestore';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { toast } from 'sonner';
import {
  LayoutDashboard, Settings, Zap, Building2 as BuildingIcon,
  LogOut, Plus, Pencil, Trash2, CheckCircle, XCircle,
  Upload, Save, X, Menu, ShieldCheck, Clock,
} from 'lucide-react';
import logoSrc from '../assets/logo.svg';
import { auth, db, storage } from '../lib/firebase';

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
  id?:      string;
  name:     string;
  category: string;
  city:     string;
  address:  string;
  phone:    string;
  verified: boolean;
  status:   'pending' | 'approved' | 'rejected';
}

type TabKey = 'overview' | 'settings' | 'flashDeals' | 'firms';
type FirmStatus = 'all' | 'pending' | 'approved' | 'rejected';

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
  const [counts, setCounts] = useState({ deals: 0, approved: 0, pending: 0, rejected: 0 });

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'flashDeals'), (s) =>
      setCounts((p) => ({ ...p, deals: s.size })));
    const u2 = onSnapshot(collection(db, 'firms'), (s) => {
      const docs = s.docs.map((d) => d.data() as AdminFirm);
      setCounts((p) => ({
        ...p,
        approved: docs.filter((f) => f.status === 'approved').length,
        pending:  docs.filter((f) => f.status === 'pending').length,
        rejected: docs.filter((f) => f.status === 'rejected').length,
      }));
    });
    return () => { u1(); u2(); };
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Genel Bakış</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Flash İlanlar"     value={counts.deals}    color="text-emerald-600" sub="Firestore kayıtları" />
        <StatCard label="Onaylı Firmalar"   value={counts.approved} color="text-blue-600"    sub="Aktif firmalar" />
        <StatCard label="Onay Bekleyen"     value={counts.pending}  color="text-amber-500"   sub="İnceleme gerekiyor" />
        <StatCard label="Reddedilen"        value={counts.rejected} color="text-red-500"     sub="Onaylanmadı" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Hızlı İşlemler</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => toast.info('Flash İlanlar sekmesine gidin.')}
            className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm px-4 py-2 rounded-lg hover:bg-emerald-100 transition"
          >
            <Zap className="w-4 h-4" /> Yeni Flash İlan
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
  const [settings,    setSettings]    = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [logoFile,    setLogoFile]    = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [saving,      setSaving]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'site'), (snap) => {
      if (snap.exists()) setSettings(snap.data() as SiteSettings);
    });
    return unsub;
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = settings.logoUrl;
      if (logoFile) {
        const sRef = storageRef(storage, 'logos/site-logo');
        await uploadBytes(sRef, logoFile);
        logoUrl = await getDownloadURL(sRef);
        setLogoFile(null);
        setLogoPreview('');
      }
      await setDoc(doc(db, 'settings', 'site'), { ...settings, logoUrl });
      toast.success('Ayarlar başarıyla kaydedildi.');
    } catch {
      toast.error('Kaydetme sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, id, value, onChange, type = 'text' }: {
    label: string; id: string; value: string;
    onChange: (v: string) => void; type?: string;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );

  const currentLogo = logoPreview || settings.logoUrl;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Site Ayarları</h2>

      {/* Logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Site Logosu</h3>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
            {currentLogo
              ? <img src={currentLogo} alt="Logo" className="w-full h-full object-contain" />
              : <BuildingIcon className="w-8 h-8 text-gray-300" />
            }
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              <Upload className="w-4 h-4" />
              {logoFile ? logoFile.name : 'Logo Yükle'}
            </button>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG — maks. 2 MB önerilir</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
              aria-label="Logo dosyası seç"
            />
          </div>
        </div>
      </div>

      {/* Site config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h3 className="font-semibold text-gray-700 text-sm">Platform Bilgileri</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Site Adı"  id="siteName"   value={settings.name}    onChange={(v) => setSettings((p) => ({ ...p, name: v }))} />
          <Field label="Telefon"   id="sitePhone"  value={settings.phone}   onChange={(v) => setSettings((p) => ({ ...p, phone: v }))} />
          <Field label="E-posta"   id="siteEmail"  value={settings.email}   onChange={(v) => setSettings((p) => ({ ...p, email: v }))}  type="email" />
        </div>
        <Field label="Slogan / Alt Başlık" id="siteTagline" value={settings.tagline} onChange={(v) => setSettings((p) => ({ ...p, tagline: v }))} />
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
   TAB 4 — FIRMS
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
   MAIN — ADMIN DASHBOARD
════════════════════════════════════════════════════════════ */
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview',   label: 'Genel Bakış',   icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'settings',   label: 'Site Ayarları', icon: <Settings className="w-4 h-4" /> },
  { key: 'flashDeals', label: 'Flash İlanlar', icon: <Zap className="w-4 h-4" /> },
  { key: 'firms',      label: 'Firmalar',      icon: <BuildingIcon className="w-4 h-4" /> },
];

export default function AdminDashboardPage() {
  const navigate            = useNavigate();
  const [user, setUser]     = useState<User | null>(null);
  const [tab,  setTab]      = useState<TabKey>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          {tab === 'firms'      && <FirmsTab />}
        </main>
      </div>
    </div>
  );
}
