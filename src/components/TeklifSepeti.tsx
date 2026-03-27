import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { trackEvent } from '../lib/analytics';
import { useTeklifSepet } from '../context/TeklifSepetContext';
import { useLanguage } from '../context/LanguageContext';
import {
  X, Send, ShoppingBag, CheckCircle, AlertCircle, Loader2,
  Trash2, ShieldCheck, MapPin, Columns2,
} from 'lucide-react';

const BUTCE_OPTIONS = [
  '100.000 ₺ altı',
  '100.000 – 250.000 ₺',
  '250.000 – 500.000 ₺',
  '500.000 – 1.000.000 ₺',
  '1.000.000 ₺ üzeri',
];

const EMPTY_FORM = { ad: '', telefon: '', email: '', butce: '', mesaj: '', kvkk: false };

export default function TeklifSepeti() {
  const { firms, removeFirm, isOpen, openDrawer, closeDrawer, clearAll } = useTeklifSepet();
  const { t } = useLanguage();

  const [step, setStep] = useState<'list' | 'compare' | 'form' | 'success'>('list');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  /* Reset drawer state when closed */
  useEffect(() => {
    if (!isOpen) {
      setStep('list');
      setForm(EMPTY_FORM);
      setErrors({});
      setStatus('idle');
    }
  }, [isOpen]);

  /* Karşılaştırma tablosu — 2 firma yan yana (6 kriter) */
  const CompareTable = () => {
    if (firms.length < 2) return null;
    const [a, b] = firms;

    const fmt = (n: number) => new Intl.NumberFormat('tr-TR').format(n) + ' ₺';

    /* m² başına fiyat hesapla */
    const m2Of = (ilan: typeof a) => {
      const raw = ilan.ozellikler?.metrekare;
      if (!raw) return null;
      const n = parseInt(raw.replace(/\D/g, ''), 10);
      return n > 0 ? n : null;
    };
    const m2a = m2Of(a);
    const m2b = m2Of(b);
    const m2PriceA = m2a ? Math.round(a.fiyat / m2a) : null;
    const m2PriceB = m2b ? Math.round(b.fiyat / m2b) : null;

    /* Satır verisi: label, a değeri, b değeri, highlight ("a" | "b" | null) */
    type Row = { label: string; a: string; b: string; highlight?: 'a' | 'b' | null };
    const rows: Row[] = [
      { label: t('basket.colFirmName'),  a: a.firmaAdi, b: b.firmaAdi },
      { label: t('basket.colCategory'),  a: a.kategori, b: b.kategori },
      { label: t('basket.colCity'),      a: a.sehir,    b: b.sehir },
      {
        label: t('basket.colPrice'),
        a: fmt(a.fiyat),
        b: fmt(b.fiyat),
        highlight: a.fiyat < b.fiyat ? 'a' : a.fiyat > b.fiyat ? 'b' : null,
      },
      {
        label: 'm² Fiyat',
        a: m2PriceA ? fmt(m2PriceA) + '/m²' : 'Belirtilmemiş',
        b: m2PriceB ? fmt(m2PriceB) + '/m²' : 'Belirtilmemiş',
        highlight: m2PriceA && m2PriceB ? (m2PriceA < m2PriceB ? 'a' : m2PriceA > m2PriceB ? 'b' : null) : null,
      },
      {
        label: 'Metrekare',
        a: a.ozellikler?.metrekare || 'Belirtilmemiş',
        b: b.ozellikler?.metrekare || 'Belirtilmemiş',
      },
      {
        label: 'Teslim Süresi',
        a: a.ozellikler?.teslimSuresi || 'Belirtilmemiş',
        b: b.ozellikler?.teslimSuresi || 'Belirtilmemiş',
      },
      {
        label: t('basket.colVerified'),
        a: a.firmaDogrulanmis ? t('basket.yes') : '—',
        b: b.firmaDogrulanmis ? t('basket.yes') : '—',
        highlight: a.firmaDogrulanmis && !b.firmaDogrulanmis ? 'a' : !a.firmaDogrulanmis && b.firmaDogrulanmis ? 'b' : null,
      },
    ];

    const cellClass = (row: Row, side: 'a' | 'b') => {
      const base = 'px-3 py-2.5 text-xs font-semibold';
      if (row.highlight === side) return `${base} text-emerald-700 bg-emerald-50`;
      return `${base} text-gray-800`;
    };

    return (
      <div className="p-5">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Columns2 className="w-4 h-4 text-emerald-600" /> {t('basket.compareTitle')}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 w-1/3">{t('basket.colFeature')}</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-emerald-700 w-1/3">
                  {a.firmaAdi.slice(0, 14)}{a.firmaAdi.length > 14 ? '…' : ''}
                </th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold text-blue-700 w-1/3">
                  {b.firmaAdi.slice(0, 14)}{b.firmaAdi.length > 14 ? '…' : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                  <td className="px-3 py-2.5 text-xs font-medium text-gray-500">{row.label}</td>
                  <td className={cellClass(row, 'a')}>{row.a}</td>
                  <td className={cellClass(row, 'b')}>{row.b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {firms.map((f) => (
            <Link
              key={f.id}
              to={`/talep-olustur?firma=${f.firmaId}`}
              onClick={closeDrawer}
              className="block text-center border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold py-2 rounded-lg transition"
            >
              {f.firmaAdi.slice(0, 12)}{f.firmaAdi.length > 12 ? '…' : ''} — Teklif İste
            </Link>
          ))}
        </div>
        <button
          onClick={() => setStep('list')}
          className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition py-2"
        >
          {t('basket.backToList')}
        </button>
      </div>
    );
  };

  const count = firms.length;
  const isFull = count >= 2;

  if (count === 0 && step !== 'success') return null;

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.ad.trim())                              e.ad = t('basket.nameError');
    if (!/^[0-9+\s()\-]{10,}$/.test(form.telefon))  e.telefon = t('basket.phoneError');
    if (!form.kvkk)                                   e.kvkk = t('basket.kvkkError');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      await addDoc(collection(db, 'quotes'), {
        tip:       'sepet-teklif',
        firmIds:   firms.map((f) => f.id),
        firmNames: firms.map((f) => f.firmaAdi),
        ilanlar:   firms.map((f) => ({ id: f.id, baslik: f.baslik, fiyat: f.fiyat, kategori: f.kategori })),
        ad:        form.ad.trim(),
        telefon:   form.telefon.trim(),
        email:     form.email.trim(),
        butce:     form.butce || 'Belirtilmedi',
        mesaj:     form.mesaj.trim(),
        kvkk:      true,
        status:    'pending',
        tarih:     serverTimestamp(),
      });
      trackEvent('teklif_istendi', { firmaCount: firms.length });
      clearAll();
      setStep('success');
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      {/* ── Floating Button ──────────────────────────────────── */}
      {count > 0 && (
        <button
          onClick={openDrawer}
          aria-label={t('basket.openLabel')}
          className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg font-semibold text-white text-sm transition-all ${
            isFull
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          {t('basket.title')}
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              isFull ? 'bg-white text-emerald-700' : 'bg-white text-amber-600'
            }`}
          >
            {count}/2
          </span>
        </button>
      )}

      {/* ── Backdrop ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={closeDrawer}
        />
      )}

      {/* ── Drawer ───────────────────────────────────────────── */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-gray-800">{t('basket.title')}</h2>
            {count > 0 && (
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isFull ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {count}/2 {t('basket.firms')}
              </span>
            )}
          </div>
          <button
            onClick={closeDrawer}
            aria-label={t('basket.close')}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── SUCCESS ────────────────────────────────────── */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('basket.successTitle')}</h3>
              <p className="text-gray-500 text-sm mb-6">{t('basket.successMsg')}</p>
              <button
                onClick={closeDrawer}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition"
              >
                {t('basket.close')}
              </button>
            </div>
          )}

          {/* ── FORM ──────────────────────────────────────── */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                {t('basket.formIntro')}{' '}
                <strong>{count} {t('basket.firms')}</strong>{' '}
                {t('basket.formIntro2')}
              </p>

              {/* Ad Soyad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('basket.name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.ad}
                  onChange={(e) => set('ad', e.target.value)}
                  placeholder={t('basket.namePh')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.ad && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.ad}
                  </p>
                )}
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('basket.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={form.telefon}
                  onChange={(e) => set('telefon', e.target.value)}
                  placeholder={t('basket.phonePh')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {errors.telefon && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />{errors.telefon}
                  </p>
                )}
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('basket.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder={t('basket.emailPh')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Bütçe */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('basket.budget')}</label>
                <select
                  value={form.butce}
                  onChange={(e) => set('butce', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">{t('basket.budgetOpt')}</option>
                  {BUTCE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>

              {/* Mesaj */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('basket.message')}</label>
                <textarea
                  value={form.mesaj}
                  onChange={(e) => set('mesaj', e.target.value)}
                  rows={3}
                  placeholder={t('basket.messagePh')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* KVKK */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.kvkk}
                    onChange={(e) => set('kvkk', e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-gray-600 leading-relaxed">
                    {t('basket.kvkkText')}{' '}
                    <Link to="/kvkk" target="_blank" className="text-emerald-600 hover:underline font-medium">
                      {t('common.kvkkLink')}
                    </Link>{' '}
                    {t('basket.kvkkText2')}{' '}
                    <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.kvkk && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1 ml-7">
                    <AlertCircle className="w-3 h-3" />{errors.kvkk}
                  </p>
                )}
              </div>

              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-lg">
                  <AlertCircle className="w-4 h-4" />{t('common.error')}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('list')}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
                >
                  {t('basket.back')}
                </button>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {status === 'loading'
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{t('common.sending')}</>
                    : <><Send className="w-4 h-4" />{t('basket.send')}</>
                  }
                </button>
              </div>
            </form>
          )}

          {/* ── COMPARE ───────────────────────────────────── */}
          {step === 'compare' && <CompareTable />}

          {/* ── FIRM LIST ─────────────────────────────────── */}
          {step === 'list' && (
            <div className="p-5 space-y-4">
              {/* Info banner */}
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  isFull
                    ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                    : 'bg-amber-50 border border-amber-100 text-amber-800'
                }`}
              >
                {isFull ? t('basket.fullMsg') : t('basket.tipMsg')}
              </div>

              {/* Firm cards */}
              {firms.map((firm) => (
                <div
                  key={firm.id}
                  className="border border-gray-200 rounded-xl p-4 flex items-start gap-3 bg-white hover:shadow-sm transition"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-emerald-700 font-extrabold text-base leading-none">
                      {(firm.firmaAdi || 'F').charAt(0)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-1">
                        {firm.firmaAdi}
                      </p>
                      {firm.firmaDogrulanmis && (
                        <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3" />{firm.sehir}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{firm.baslik}</p>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      {new Intl.NumberFormat('tr-TR').format(firm.fiyat)} ₺
                    </p>
                  </div>

                  <button
                    onClick={() => removeFirm(firm.id)}
                    aria-label={`${firm.firmaAdi} ${t('basket.removeFirm')}`}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Empty slot */}
              {count < 2 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-sm text-gray-400">
                  {t('basket.emptySlotMsg')}
                </div>
              )}
            </div>
          )}

        </div>

        {/* ── Drawer Footer (only on list step) ────────────── */}
        {step === 'list' && (
          <div className="border-t border-gray-100 p-5 space-y-2 bg-white">
            <button
              onClick={() => setStep('form')}
              disabled={count === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              {t('basket.submitCta')}
            </button>
            {count === 2 && (
              <button
                onClick={() => setStep('compare')}
                className="w-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
              >
                <Columns2 className="w-4 h-4" /> {t('basket.compare')}
              </button>
            )}
            <button
              onClick={() => { clearAll(); closeDrawer(); }}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> {t('basket.clear')}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
