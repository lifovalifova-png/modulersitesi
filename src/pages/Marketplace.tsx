import React, { useState } from 'react';
import { Zap, Phone, CheckCircle, Mail, MapPin, Send, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../data/categories';

const flashDeals = [
  {
    id: 1,
    title: "2 Adet Şantiye Konteyneri",
    location: "Kütahya Merkez",
    price: "85.000",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=250&fit=crop"
  },
  {
    id: 2,
    title: "Lüks Ahşap Tiny House",
    location: "Sakarya / Sapanca",
    price: "420.000",
    image: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=250&fit=crop"
  },
  {
    id: 3,
    title: "Sıfır Ayarında Prefabrik Ev",
    location: "Bursa / Mudanya",
    price: "290.000",
    image: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=250&fit=crop"
  },
  {
    id: 4,
    title: "Çelik Konstrüksiyon Depo",
    location: "İstanbul / Hadımköy",
    price: "520.000",
    image: "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=400&h=250&fit=crop"
  },
  {
    id: 5,
    title: "2. El Konteyner - 12m",
    location: "Ankara / Sincan",
    price: "65.000",
    image: "https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=400&h=250&fit=crop"
  }
];

interface FlashDealProps {
  title: string;
  location: string;
  price: string;
  image: string;
  onQuote: (title: string, location: string, price: string) => void;
}

const FlashDeal = ({ title, location, price, image, onQuote }: FlashDealProps) => (
  <div className="border rounded-xl overflow-hidden shadow-sm bg-white hover:shadow-lg transition-all duration-300 flex-shrink-0 w-72 sm:w-80">
    <div className="relative h-40">
      <img src={image} alt={`${title} — ${location}`} loading="lazy" className="w-full h-full object-cover" />
      <span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md">
        ACİL İLAN
      </span>
    </div>
    <div className="p-4">
      <h3 className="font-bold text-gray-800 text-lg line-clamp-2 min-h-[56px]">{title}</h3>
      <div className="flex items-center text-gray-500 text-sm mt-2">
        <MapPin className="w-4 h-4 mr-1" />
        {location}
      </div>
      <p className="text-primary font-bold text-xl mt-3">{price} TL</p>
      <button
        onClick={() => onQuote(title, location, price)}
        className="w-full mt-4 bg-primary text-white py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        Teklif Al
      </button>
    </div>
  </div>
);

export default function Marketplace() {
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleQuoteRequest = async (productName: string, location: string, price: string) => {
    if (!kvkkAccepted) {
      alert("Lütfen devam etmeden önce KVKK metnini onaylayın.");
      return;
    }

    setIsSubmitting(true);

    // n8n Webhook URL - Buraya kendi URL'nizi yapıştırın
    const _webhookUrl = "https://your-n8n-instance.com/webhook/your-webhook-id";

    const payload = {
      product: productName,
      location: location,
      price: price,
      date: new Date().toISOString(),
      status: "New Lead",
      source: "ModulerPazar"
    };

    try {
      // Gerçek webhook çağrısı için aşağıdaki kodu aktif edin:
      /*
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      */

      // Demo için simülasyon
      console.log("Webhook payload:", payload);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Hata:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span>Teklif talebiniz başarıyla gönderildi!</span>
        </div>
      )}

      {/* Header & Navigation */}
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary italic">ModülerPazar</h1>
            </Link>
            <Link
              to="/satici-formu"
              className="hidden sm:flex bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
            >
              Ücretsiz İlan Ver
            </Link>
          </div>

          {/* Categories - Horizontal Scroll */}
          <div className="flex space-x-4 overflow-x-auto pb-2 mt-4 scrollbar-hide">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                to={`/kategori/${cat.slug}`}
                className="text-sm font-medium text-gray-600 hover:text-primary whitespace-nowrap px-3 py-2 rounded-lg hover:bg-primary/5 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="bg-gradient-to-br from-primary via-primary to-primary/80 text-white py-16 px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 uppercase tracking-tight">
          Hayalindeki Modüler Yapıyı Bul
        </h2>
        <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
          Prefabrikten Tiny House'a, Türkiye'nin en büyük modüler yapı pazar yeri.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            to="/satici-formu"
            className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Ücretsiz İlan Ver
          </Link>
          <Link
            to="/kategori/prefabrik"
            className="bg-accent text-white px-6 py-3 rounded-lg font-semibold hover:bg-accent/90 transition"
          >
            İlanları Keşfet
          </Link>
        </div>
      </header>

      {/* Flash Deals - Horizontal Carousel */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center mb-6">
          <div className="bg-accent/20 p-2 rounded-lg mr-3">
            <Zap className="text-accent w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Günün Acil İlanları</h2>
            <p className="text-gray-500 text-sm">Kaçırılmayacak fırsatlar</p>
          </div>
        </div>

        {/* Horizontal Scrolling Carousel */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
          {flashDeals.map((deal) => (
            <div key={deal.id} className="snap-start">
              <FlashDeal
                title={deal.title}
                location={deal.location}
                price={deal.price}
                image={deal.image}
                onQuote={handleQuoteRequest}
              />
            </div>
          ))}
        </div>

        {/* KVKK & Quick Quote Section */}
        <div className="mt-16 bg-white p-6 md:p-8 rounded-2xl shadow-sm border">
          <h3 className="text-xl font-bold mb-2 text-gray-800">Hızlı Teklif Sistemi</h3>
          <p className="text-gray-600 mb-6">
            Sistem üzerinden firmalara hızlıca teklif talebinde bulunabilirsiniz.
          </p>

          {/* KVKK Checkbox */}
          <div className="flex items-start space-x-3 mb-6 p-4 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              id="kvkk"
              checked={kvkkAccepted}
              onChange={() => setKvkkAccepted(!kvkkAccepted)}
              className="w-5 h-5 text-primary mt-0.5 rounded border-gray-300 focus:ring-primary"
            />
            <label htmlFor="kvkk" className="text-sm text-gray-600">
              <a href="#" className="text-primary hover:underline font-medium">KVKK Aydınlatma Metni</a>'ni ve
              <a href="#" className="text-primary hover:underline font-medium"> Gizlilik Politikası</a>'nı okudum, kabul ediyorum.
            </label>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <CheckCircle className="text-primary mr-3 w-6 h-6" />
              <span className="font-medium text-gray-700">Güvenilir Kurumsal Firmalar</span>
            </div>
            <div className="flex items-center p-4 bg-secondary/5 rounded-lg border border-secondary/20">
              <Phone className="text-secondary mr-3 w-6 h-6" />
              <span className="font-medium text-gray-700">Hızlı İletişim & Onay</span>
            </div>
            <div className="flex items-center p-4 bg-accent/5 rounded-lg border border-accent/20">
              <Mail className="text-accent mr-3 w-6 h-6" />
              <span className="font-medium text-gray-700">E-posta ile Bilgilendirme</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center bg-gradient-to-r from-primary to-primary/80 text-white p-8 rounded-2xl">
          <h3 className="text-2xl font-bold mb-3">Firmanız mı var?</h3>
          <p className="opacity-90 mb-6">Binlerce potansiyel müşteriye ulaşın. İlk ilanınız ücretsiz!</p>
          <Link
            to="/satici-formu"
            className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Hemen İlan Ver
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold text-white">ModülerPazar</span>
              </div>
              <p className="text-sm">
                Türkiye'nin en büyük modüler yapı pazarı.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Kategoriler</h4>
              <ul className="space-y-2 text-sm">
                {CATEGORIES.slice(0, 4).map(cat => (
                  <li key={cat.slug}>
                    <Link to={`/kategori/${cat.slug}`} className="hover:text-primary transition">
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-primary transition">KVKK Aydınlatma Metni</a></li>
                <li><a href="#" className="hover:text-primary transition">Gizlilik Politikası</a></li>
                <li><a href="#" className="hover:text-primary transition">Kullanım Koşulları</a></li>
                <li><a href="#" className="hover:text-primary transition">Çerez Politikası</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            &copy; 2026 ModülerPazar - Tüm Hakları Saklıdır.
          </div>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-gray-600">Gönderiliyor...</p>
          </div>
        </div>
      )}
    </div>
  );
}
