import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import { SITE_CONFIG, LEGAL_LINKS } from '../config/site';

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-8 h-8 text-emerald-500" aria-hidden="true" />
              <span className="text-xl font-bold text-white">
                Modüler<span className="text-emerald-500">Pazar</span>
              </span>
            </div>
            <p className="text-sm mb-4">
              Türkiye'nin en büyük modüler yapı pazarı. Prefabrik evler, konteynerler, tiny house ve daha fazlası.
            </p>
            <div className="flex gap-3">
              <a href="#" aria-label="Facebook" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                <Facebook className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="#" aria-label="Instagram" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                <Instagram className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="#" aria-label="Twitter / X" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                <Twitter className="w-5 h-5" aria-hidden="true" />
              </a>
              <a href="#" aria-label="LinkedIn" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                <Linkedin className="w-5 h-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Hızlı Bağlantılar</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-emerald-400 transition">Ana Sayfa</Link></li>
              <li><Link to="/kategori/prefabrik" className="hover:text-emerald-400 transition">Prefabrik Evler</Link></li>
              <li><Link to="/kategori/tiny-house" className="hover:text-emerald-400 transition">Tiny House</Link></li>
              <li><Link to="/kategori/ikinci-el" className="hover:text-emerald-400 transition">2. El İlanlar</Link></li>
              <li><Link to="/satici-formu" className="hover:text-emerald-400 transition">İlan Ver</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Yasal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to={LEGAL_LINKS.kvkk} className="hover:text-emerald-400 transition">KVKK Aydınlatma Metni</Link></li>
              <li><Link to={LEGAL_LINKS.gizlilik} className="hover:text-emerald-400 transition">Gizlilik Politikası</Link></li>
              <li><Link to={LEGAL_LINKS.kullanim} className="hover:text-emerald-400 transition">Kullanım Koşulları</Link></li>
              <li><Link to={LEGAL_LINKS.cerez} className="hover:text-emerald-400 transition">Çerez Politikası</Link></li>
              <li><Link to={LEGAL_LINKS.mesafeli} className="hover:text-emerald-400 transition">Mesafeli Satış Sözleşmesi</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">İletişim</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{SITE_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                <a href={`tel:${SITE_CONFIG.phone.replace(/\s/g, '')}`} className="hover:text-emerald-400 transition">
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-emerald-400 transition">
                  {SITE_CONFIG.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center text-sm gap-2">
          <p>&copy; {currentYear} {SITE_CONFIG.name}. Tüm hakları saklıdır.</p>
          <p className="flex items-center gap-3">
            <Link to={LEGAL_LINKS.kvkk} className="hover:text-emerald-400 transition">KVKK</Link>
            <span aria-hidden="true">•</span>
            <Link to={LEGAL_LINKS.gizlilik} className="hover:text-emerald-400 transition">Gizlilik</Link>
            <span aria-hidden="true">•</span>
            <Link to={LEGAL_LINKS.cerez} className="hover:text-emerald-400 transition">Çerezler</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
