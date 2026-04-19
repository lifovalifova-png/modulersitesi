import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { sanitizeText } from '../utils/sanitize';
import SEOMeta from '../components/SEOMeta';

type Tip = 'istek' | 'sikayet';

export default function GeriBildirimPage() {
  const { currentUser } = useAuth();
  const [seciliTip, setSeciliTip] = useState<Tip | null>(null);
  const [ad, setAd]               = useState(currentUser?.displayName || '');
  const [eposta, setEposta]       = useState(currentUser?.email || '');
  const [baslik, setBaslik]       = useState('');
  const [aciklama, setAciklama]   = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);

  async function handleGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!seciliTip) return;

    if (!ad.trim()) { toast.error('Lütfen adınızı girin.'); return; }
    if (!eposta.trim()) { toast.error('Lütfen e-posta adresinizi girin.'); return; }
    if (!baslik.trim()) { toast.error('Lütfen bir başlık girin.'); return; }
    if (!aciklama.trim()) { toast.error('Lütfen açıklama girin.'); return; }

    setGonderiyor(true);
    try {
      await addDoc(collection(db, 'geri_bildirimler'), {
        tip:       seciliTip,
        baslik:    sanitizeText(baslik, 200),
        aciklama:  sanitizeText(aciklama, 2000),
        ad:        sanitizeText(ad, 100),
        eposta:    eposta.trim(),
        userId:    currentUser?.uid || null,
        userEmail: currentUser?.email || eposta.trim(),
        userName:  currentUser?.displayName || ad.trim(),
        anonim:    !currentUser,
        tarih:     serverTimestamp(),
        durum:     'beklemede',
      });
      toast.success('Geri bildiriminiz alındı, teşekkürler!');
      setBaslik('');
      setAciklama('');
      setSeciliTip(null);
      if (!currentUser) { setAd(''); setEposta(''); }
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setGonderiyor(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <SEOMeta
        title="Geri Bildirim"
        description="ModülerPazar hakkında istek veya şikayetlerinizi bize iletin."
        url="/geri-bildirim"
      />
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">İstek & Şikayet</h1>
        <p className="text-gray-500 mb-8">
          Görüşleriniz bizim için değerli. İstek veya şikayetlerinizi buradan iletebilirsiniz.
        </p>

        {/* Tip seçimi */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => setSeciliTip('istek')}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition text-center font-semibold text-lg ${
              seciliTip === 'istek'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
            }`}
          >
            <span className="text-4xl">📋</span>
            İstek
          </button>
          <button
            onClick={() => setSeciliTip('sikayet')}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition text-center font-semibold text-lg ${
              seciliTip === 'sikayet'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
            }`}
          >
            <span className="text-4xl">⚠️</span>
            Şikayet
          </button>
        </div>

        {/* Form — tip seçilmişse göster (giriş yapmamış da olsa) */}
        {seciliTip && (
          <form onSubmit={handleGonder} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{seciliTip === 'istek' ? '📋' : '⚠️'}</span>
              <span className="font-semibold text-gray-700 capitalize">
                {seciliTip === 'istek' ? 'İstek' : 'Şikayet'} Formu
              </span>
            </div>

            {/* Ad Soyad */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={100}
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Adınız Soyadınız"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* E-posta */}
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">
                E-posta <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Başlık */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  Başlık <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${baslik.length > 90 ? 'text-red-500' : 'text-gray-400'}`}>
                  {baslik.length}/100
                </span>
              </div>
              <input
                type="text"
                maxLength={100}
                value={baslik}
                onChange={(e) => setBaslik(e.target.value)}
                placeholder="Kısa ve açıklayıcı bir başlık girin"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Açıklama */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-700">
                  Açıklama <span className="text-red-500">*</span>
                </label>
                <span className={`text-xs ${aciklama.length > 1900 ? 'text-red-500' : 'text-gray-400'}`}>
                  {aciklama.length}/2000
                </span>
              </div>
              <textarea
                maxLength={2000}
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Detaylı açıklama yazın..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y"
                required
              />
            </div>

            {currentUser && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500">
                <span className="font-medium text-gray-700">Hesap:</span>{' '}
                {currentUser.displayName || currentUser.email}
              </div>
            )}

            <button
              type="submit"
              disabled={gonderiyor}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
            >
              {gonderiyor ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </form>
        )}

        {/* Tip seçilmemişse yönlendirici metin */}
        {!seciliTip && (
          <p className="text-center text-sm text-gray-400 mt-2">
            Yukarıdan bir tür seçin ve form açılacak.
          </p>
        )}
      </div>
    </main>
  );
}
