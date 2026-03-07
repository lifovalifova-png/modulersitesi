import { AlertTriangle } from 'lucide-react';

/**
 * Reusable disclaimer / uyarı kutusu.
 * Fiyat hesaplayıcısı, blog detay ve talep oluştur sayfalarında kullanılır.
 */
export default function Disclaimer() {
  return (
    <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-xs text-amber-800 leading-relaxed">
        <strong>Uyarı:</strong> Bu sayfada sunulan fiyat tahminleri ve bilgiler yalnızca genel
        bilgilendirme amaçlıdır; kesin fiyat teklifi niteliği taşımaz. Gerçek maliyetler arsa
        konumu, zemin yapısı, malzeme seçimi, işçilik ve nakliye gibi faktörlere göre önemli
        ölçüde değişebilir. Karar vermeden önce en az 3 yetkili firmadan yazılı teklif almanızı
        tavsiye ederiz. ModülerPazar, bu tahminlere dayanılarak yapılan işlemlerden doğan
        zararlardan sorumlu tutulamaz.
      </p>
    </div>
  );
}
