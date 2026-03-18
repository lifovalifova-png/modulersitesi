import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

type Tip = 'istek' | 'sikayet';

export default function GeriBildirimPage() {
  const { currentUser } = useAuth();
  const [seciliTip, setSeciliTip] = useState<Tip | null>(null);
  const [baslik, setBaslik]       = useState('');
  const [aciklama, setAciklama]   = useState('');
  const [gonderiyor, setGonderiyor] = useState(false);

  async function handleGonder(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !seciliTip) return;

    if (!baslik.trim()) { toast.error('Lütfen bir başlık girin.'); return; }
    if (!aciklama.trim()) { toast.error('Lütfen açıklama girin.'); return; }

    setGonderiyor(true);
    try {
      await addDoc(collection(db, 'geri_bildirimler'), {
        tip:       seciliTip,
        baslik:    baslik.trim(),
        aciklama:  aciklama.trim(),
        userId:    currentUser.uid,
        userEmail: currentUser.email ?? '',
        userName:  currentUser.displayName ?? currentUser.email ?? '',
        tarih:     serverTimestamp(),
        durum:     'beklemede',
      });
      toast.success('Geri bildiriminiz alındı. Teşekkürler!');
      setBaslik('');
      setAciklama('');
      setSeciliTip(null);
    } catch {
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setGonderiyor(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
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

        {/* Giriş yapılmamışsa uyarı */}
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
            <p className="text-amber-800 font-medium mb-3">
              Geri bildirim göndermek için giriş yapmanız gerekiyor.
            </p>
            <Link
              to="/giris"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition"
            >
              Giriş Yap
            </Link>
          </div>
        )}

        {/* Form — giriş yapılmış ve tip seçilmişse göster */}
        {currentUser && seciliTip && (
          <form onSubmit={handleGonder} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{seciliTip === 'istek' ? '📋' : '⚠️'}</span>
              <span className="font-semibold text-gray-700 capitalize">
                {seciliTip === 'istek' ? 'İstek' : 'Şikayet'} Formu
              </span>
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

            {/* Kullanıcı bilgisi */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-500">
              <span className="font-medium text-gray-700">Gönderen:</span>{' '}
              {currentUser.displayName || currentUser.email}
            </div>

            <button
              type="submit"
              disabled={gonderiyor}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition"
            >
              {gonderiyor ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </form>
        )}

        {/* Giriş yapılmış ama tip seçilmemişse yönlendirici metin */}
        {currentUser && !seciliTip && (
          <p className="text-center text-sm text-gray-400 mt-2">
            Yukarıdan bir tür seçin ve form açılacak.
          </p>
        )}
      </div>
    </div>
  );
}
