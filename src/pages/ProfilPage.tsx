import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  collection, query, where, onSnapshot, doc, deleteDoc,
  type Timestamp,
} from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEOMeta from '../components/SEOMeta';
import { sanitizeText } from '../utils/sanitize';
import { formatFiyat } from '../hooks/useIlanlar';
import {
  Mail, Calendar, Edit2, X, Building2, Loader2, MapPin, Tag,
  Trash2, Send, Check, FileText, ShieldCheck, ChevronRight, Zap,
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Tipler ────────────────────────────────────────────────── */
interface Talep {
  id: string;
  kategori?: string;
  sehir?: string;
  butce?: string | number;
  tarih?: Timestamp;
  status?: string;
  aciklama?: string;
}

interface Quote {
  id: string;
  ilanBaslik?: string;
  ilanKategori?: string;
  ilanId?: string;
  firmaAdi?: string;
  tarih?: Timestamp;
  status?: string;
}

interface IlanItem {
  id: string;
  baslik?: string;
  kategori?: string;
  sehir?: string;
  fiyat?: number;
  status?: string;
  acil?: boolean;
  tarih?: Timestamp;
}

/* ── Helpers ───────────────────────────────────────────────── */
function formatTs(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  new:       { label: 'Yeni',       cls: 'bg-blue-100 text-blue-700' },
  pending:   { label: 'Beklemede',  cls: 'bg-amber-100 text-amber-700' },
  aktif:     { label: 'Aktif',      cls: 'bg-emerald-100 text-emerald-700' },
  active:    { label: 'Aktif',      cls: 'bg-emerald-100 text-emerald-700' },
  pasif:     { label: 'Pasif',      cls: 'bg-gray-100 text-gray-600' },
  completed: { label: 'Tamamlandı', cls: 'bg-purple-100 text-purple-700' },
  rejected:  { label: 'Reddedildi', cls: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CFG[status ?? ''] ?? { label: status ?? 'Bilinmiyor', cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function EmptyState({ icon, text, action }: {
  icon: JSX.Element;
  text: string;
  action?: JSX.Element;
}) {
  return (
    <div className="text-center py-14">
      <div className="text-gray-200 flex justify-center mb-3">{icon}</div>
      <p className="text-gray-400 text-sm mb-4">{text}</p>
      {action}
    </div>
  );
}

/* ── Ana Bileşen ────────────────────────────────────────────── */
export default function ProfilPage() {
  const { currentUser, role } = useAuth();

  /* Edit modal */
  const [editOpen,   setEditOpen]   = useState(false);
  const [editName,   setEditName]   = useState('');
  const [editSaving, setEditSaving] = useState(false);

  /* Aktif sekme */
  const [activeTab, setActiveTab] = useState(0);

  /* Veri */
  const [taleplar,      setTaleplar]      = useState<Talep[]>([]);
  const [quotes,        setQuotes]        = useState<Quote[]>([]);
  const [ilanlar,       setIlanlar]       = useState<IlanItem[]>([]);
  const [gelenTalepler, setGelenTalepler] = useState<Talep[]>([]);
  const [dataLoading,   setDataLoading]   = useState(true);

  /* Silme onayı */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSeller = role === 'seller';

  /* Firestore abonelikleri */
  useEffect(() => {
    if (!currentUser) { setDataLoading(false); return; }

    const unsubs: (() => void)[] = [];
    let settled = false;
    const done = () => { if (!settled) { settled = true; setDataLoading(false); } };

    if (!isSeller) {
      /* Alıcı — taleplerim */
      const q1 = query(collection(db, 'taleplar'), where('userId', '==', currentUser.uid));
      unsubs.push(onSnapshot(q1,
        snap => { setTaleplar(snap.docs.map(d => ({ id: d.id, ...d.data() } as Talep))); done(); },
        () => done(),
      ));
      /* Alıcı — tekliflerim */
      const q2 = query(collection(db, 'quotes'), where('musteriEmail', '==', currentUser.email ?? ''));
      unsubs.push(onSnapshot(q2,
        snap => setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote))),
        () => {},
      ));
    } else {
      /* Satıcı — ilanlarım */
      const q1 = query(collection(db, 'ilanlar'), where('firmaId', '==', currentUser.uid));
      unsubs.push(onSnapshot(q1,
        snap => { setIlanlar(snap.docs.map(d => ({ id: d.id, ...d.data() } as IlanItem))); done(); },
        () => done(),
      ));
      /* Satıcı — gelen talepler */
      const q2 = query(collection(db, 'bildirimler'), where('firmaId', '==', currentUser.uid));
      unsubs.push(onSnapshot(q2,
        snap => setGelenTalepler(snap.docs.map(d => ({ id: d.id, ...d.data() } as Talep))),
        () => {},
      ));
    }

    return () => unsubs.forEach(f => f());
  }, [currentUser?.uid, isSeller]);

  /* Giriş zorunlu */
  if (!currentUser) {
    return <Navigate to="/giris" replace state={{ from: { pathname: '/profil' } }} />;
  }

  /* Türetilmiş değerler */
  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı';
  const initials    = displayName.charAt(0).toUpperCase();
  const memberSince = currentUser.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    : '—';

  const TABS = isSeller ? ['İlanlarım', 'Gelen Talepler'] : ['Taleplerim', 'Tekliflerim'];

  /* Handlers */
  async function handleSaveName() {
    const name = sanitizeText(editName.trim(), 100);
    if (!name || !currentUser) return;
    setEditSaving(true);
    try {
      await updateProfile(currentUser, { displayName: name });
      toast.success('Ad güncellendi!');
      setEditOpen(false);
    } catch {
      toast.error('Güncelleme başarısız.');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteIlan(id: string) {
    try {
      await deleteDoc(doc(db, 'ilanlar', id));
      toast.success('İlan silindi.');
    } catch {
      toast.error('Silme işlemi başarısız.');
    } finally {
      setDeletingId(null);
    }
  }

  /* ── Sekme içerikleri ──────────────────────────────────── */

  function TaleplerTab() {
    if (taleplar.length === 0) {
      return (
        <EmptyState
          icon={<Send className="w-12 h-12" />}
          text="Henüz talep oluşturmadınız."
          action={
            <Link
              to="/talep-olustur"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            >
              <Send className="w-4 h-4" /> Talep Oluştur
            </Link>
          }
        />
      );
    }
    return (
      <div className="space-y-3">
        {taleplar.map(t => (
          <div key={t.id} className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {t.kategori && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />{t.kategori}
                    </span>
                  )}
                  {t.sehir && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" />{t.sehir}
                    </span>
                  )}
                </div>
                {t.aciklama && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-1.5">{t.aciklama}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  {t.butce && (
                    <span>Bütçe: {typeof t.butce === 'number' ? formatFiyat(t.butce) : t.butce}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatTs(t.tarih)}
                  </span>
                </div>
              </div>
              <StatusBadge status={t.status} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function QuotesTab() {
    if (quotes.length === 0) {
      return (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          text="Henüz teklif almadınız."
        />
      );
    }
    return (
      <div className="space-y-3">
        {quotes.map(q => (
          <Link
            key={q.id}
            to={q.ilanId ? `/ilan/${q.ilanId}` : '/'}
            className="block border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 text-sm line-clamp-1 mb-1">
                  {q.ilanBaslik ?? 'İlan'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  {q.ilanKategori && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{q.ilanKategori}</span>
                  )}
                  {q.firmaAdi && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />{q.firmaAdi}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{formatTs(q.tarih)}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={q.status ?? 'new'} />
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  function IlanlarTab() {
    if (ilanlar.length === 0) {
      return (
        <EmptyState
          icon={<FileText className="w-12 h-12" />}
          text="Henüz ilan yayınlamadınız."
          action={
            <Link
              to="/satici-formu"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
            >
              <Send className="w-4 h-4" /> İlan Ver
            </Link>
          }
        />
      );
    }
    return (
      <div className="space-y-3">
        {ilanlar.map(ilan => (
          <div key={ilan.id} className="border border-gray-100 rounded-xl p-4 hover:border-emerald-200 transition">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-semibold text-gray-800 text-sm">{ilan.baslik}</span>
                  {ilan.acil && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" />ACİL
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  {ilan.kategori && (
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{ilan.kategori}</span>
                  )}
                  {ilan.sehir && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ilan.sehir}</span>
                  )}
                  {ilan.fiyat != null && (
                    <span className="font-semibold text-emerald-600">{formatFiyat(ilan.fiyat)}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{formatTs(ilan.tarih)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StatusBadge status={ilan.status} />
                <Link
                  to={`/ilan/${ilan.id}`}
                  className="p-1.5 text-gray-400 hover:text-emerald-600 transition"
                  title="İlanı görüntüle"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
                {deletingId === ilan.id ? (
                  <>
                    <button
                      onClick={() => handleDeleteIlan(ilan.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Silmeyi onayla"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingId(null)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 rounded transition"
                      title="İptal"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeletingId(ilan.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition"
                    title="İlanı sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  function GelenTaleplerTab() {
    if (gelenTalepler.length === 0) {
      return (
        <EmptyState
          icon={<Mail className="w-12 h-12" />}
          text="Henüz gelen talep bulunmuyor."
        />
      );
    }
    return (
      <div className="space-y-3">
        {gelenTalepler.map(t => (
          <div key={t.id} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {t.kategori && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                      <Tag className="w-3 h-3" />{t.kategori}
                    </span>
                  )}
                  {t.sehir && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" />{t.sehir}
                    </span>
                  )}
                </div>
                {t.aciklama && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-1.5">{t.aciklama}</p>
                )}
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{formatTs(t.tarih)}
                </p>
              </div>
              <StatusBadge status={t.status ?? 'new'} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SEOMeta title="Profilim" description="Hesap bilgilerinizi yönetin." url="/profil" />
      <Header />

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* ── Profil Başlık ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentUser.photoURL
                  ? <img src={currentUser.photoURL} alt={displayName} className="w-full h-full object-cover" />
                  : <span className="text-emerald-700 font-extrabold text-3xl">{initials}</span>
                }
              </div>

              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    isSeller ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isSeller ? 'Satıcı / Firma' : 'Alıcı'}
                  </span>
                  {currentUser.emailVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Doğrulanmış
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-1">
                  <Mail className="w-3.5 h-3.5" /> {currentUser.email}
                </p>
                <p className="text-xs text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Üyelik: {memberSince}
                </p>
              </div>

              {/* Düzenle */}
              <button
                onClick={() => { setEditName(displayName); setEditOpen(true); }}
                className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:border-emerald-300 hover:text-emerald-600 transition flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" /> Profili Düzenle
              </button>
            </div>
          </div>

          {/* ── Sekmeler ──────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

            {/* Tab nav */}
            <div className="flex items-center border-b border-gray-200 overflow-x-auto">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium transition border-b-2 ${
                    activeTab === i
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                  {/* Badge sayaç */}
                  {(() => {
                    const cnt = !isSeller && i === 0 ? taleplar.length
                      : !isSeller && i === 1 ? quotes.length
                      : isSeller && i === 0 ? ilanlar.length
                      : isSeller && i === 1 ? gelenTalepler.length
                      : 0;
                    return cnt > 0 ? (
                      <span className={`ml-1.5 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isSeller && i === 1 ? 'bg-blue-500' : 'bg-emerald-600'
                      }`}>
                        {cnt}
                      </span>
                    ) : null;
                  })()}
                </button>
              ))}

              {isSeller && (
                <Link
                  to="/satici-formu"
                  className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition whitespace-nowrap"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Firma Bilgilerimi Güncelle</span>
                  <span className="sm:hidden">Firma</span>
                </Link>
              )}
            </div>

            {/* İçerik */}
            <div className="p-6">
              {dataLoading ? (
                <div className="flex items-center justify-center py-14">
                  <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                </div>
              ) : (
                <>
                  {!isSeller && activeTab === 0 && <TaleplerTab />}
                  {!isSeller && activeTab === 1 && <QuotesTab />}
                  {isSeller  && activeTab === 0 && <IlanlarTab />}
                  {isSeller  && activeTab === 1 && <GelenTaleplerTab />}
                </>
              )}
            </div>
          </div>

        </div>
      </main>

      <Footer />

      {/* ── Profil Düzenleme Modalı ────────────────────── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">Profili Düzenle</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  placeholder="Ad Soyad"
                  maxLength={100}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={currentUser.email ?? ''}
                  disabled
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">E-posta adresi değiştirilemez.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
              >
                İptal
              </button>
              <button
                onClick={handleSaveName}
                disabled={editSaving || !editName.trim()}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {editSaving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" />
                }
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
