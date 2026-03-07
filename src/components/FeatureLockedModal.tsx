import { X, Lock } from 'lucide-react';

interface Props {
  onClose:      () => void;
  featureName?: string;
}

export default function FeatureLockedModal({ onClose, featureName }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition"
          aria-label="Kapat"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-amber-500" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2">Yakında Geliyor</h3>

        {featureName && (
          <p className="text-sm text-gray-500 mb-2">
            <span className="font-semibold text-gray-700">{featureName}</span> özelliği
          </p>
        )}

        <p className="text-sm text-gray-500">
          Bu özellik henüz aktif değil. Çok yakında kullanıma açılacak.
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition"
        >
          Tamam
        </button>
      </div>
    </div>
  );
}
