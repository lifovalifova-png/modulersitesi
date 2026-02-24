import { useState } from 'react';
import { X, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface Listing {
  id: number;
  title: string;
  location: string;
  price: string;
  category: string;
}

interface QuickQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: Listing;
}

export default function QuickQuoteModal({ isOpen, onClose, listing }: QuickQuoteModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
    kvkkAccepted: false
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.kvkkAccepted) {
      setErrorMessage('KVKK aydınlatma metnini kabul etmeniz gerekmektedir.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    // Prepare JSON payload
    const payload = {
      productName: listing.title,
      productId: listing.id,
      location: listing.location,
      price: listing.price,
      category: listing.category,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: formData.email,
      message: formData.message,
      timestamp: new Date().toISOString(),
      source: 'ModulerPazar-QuickQuote'
    };

    try {
      // Webhook URL - Replace with your actual webhook URL
      // In production, this would send to the actual webhook
      // For demo purposes, we'll simulate a successful response
      console.log('Sending payload to webhook:', payload);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Uncomment below for actual webhook call:
      /*
      const webhookUrl = 'https://webhook.site/your-webhook-id';
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Webhook request failed');
      }
      */

      setStatus('success');

      // Reset form after 3 seconds and close modal
      setTimeout(() => {
        setStatus('idle');
        setFormData({
          name: '',
          phone: '',
          email: '',
          message: '',
          kvkkAccepted: false
        });
        onClose();
      }, 3000);

    } catch {
      setStatus('error');
      setErrorMessage('Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-800">Hızlı Teklif Al</h2>
          <button
            onClick={onClose}
            aria-label="Modalı kapat"
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Product Info */}
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <h3 className="font-semibold text-gray-800 mb-1">{listing.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{listing.location}</span>
            <span className="font-semibold text-emerald-600">{listing.price}</span>
          </div>
        </div>

        {/* Form */}
        {status === 'success' ? (
          <div className="px-6 py-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Talebiniz Alındı!
            </h3>
            <p className="text-gray-600">
              En kısa sürede sizinle iletişime geçeceğiz.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ad Soyad *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Adınız Soyadınız"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="05XX XXX XX XX"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mesajınız
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                placeholder="Ürün hakkında sormak istedikleriniz..."
              />
            </div>

            {/* KVKK Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="kvkk"
                checked={formData.kvkkAccepted}
                onChange={(e) => setFormData({ ...formData, kvkkAccepted: e.target.checked })}
                className="mt-1 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="kvkk" className="text-sm text-gray-600">
                <a href="#" className="text-emerald-600 hover:underline">KVKK Aydınlatma Metni</a>'ni
                okudum ve kişisel verilerimin işlenmesini kabul ediyorum. *
              </label>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div role="alert" className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Teklif Talep Et
                </>
              )}
            </button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center">
              Bilgileriniz 3. şahıslarla paylaşılmayacaktır.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
