import { Link } from 'react-router-dom';
import { Building2, Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
import { SITE_CONFIG, LEGAL_LINKS } from '../config/site';
import { useLanguage } from '../context/LanguageContext';
import { useFeatureFlags } from '../hooks/useFeatureFlags';
import { useSosyalMedya } from '../hooks/useSosyalMedya';

const currentYear = new Date().getFullYear();

export default function Footer() {
  const { t } = useLanguage();
  const { flags } = useFeatureFlags();
  const sosyal = useSosyalMedya();
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
              {t('footer.desc')}
            </p>
            <div className="flex gap-3 flex-wrap">
              {sosyal.linkedin && (
                <a href={sosyal.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                  <Linkedin className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.instagram && (
                <a href={sosyal.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.facebook && (
                <a href={sosyal.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                  <Facebook className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.twitter && (
                <a href={sosyal.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                  <Twitter className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.youtube && (
                <a href={sosyal.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2 bg-gray-800 rounded-lg hover:bg-emerald-600 transition">
                  <Youtube className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-emerald-400 transition">{t('footer.home')}</Link></li>
              <li><Link to="/kategori/prefabrik" className="hover:text-emerald-400 transition">{t('footer.prefabrik')}</Link></li>
              <li><Link to="/kategori/tiny-house" className="hover:text-emerald-400 transition">{t('footer.tinyHouse')}</Link></li>
              <li><Link to="/kategori/ikinci-el" className="hover:text-emerald-400 transition">{t('footer.secondHand')}</Link></li>
              <li><Link to="/firmalar" className="hover:text-emerald-400 transition">{t('nav.firms')}</Link></li>
              <li><Link to="/satici-formu" className="hover:text-emerald-400 transition">{t('footer.postAd')}</Link></li>
              <li><Link to="/blog" className="hover:text-emerald-400 transition">{t('footer.blog')}</Link></li>
              <li><Link to="/haberler" className="hover:text-emerald-400 transition">Haberler</Link></li>
              <li><Link to="/sss" className="hover:text-emerald-400 transition">{t('footer.faq')}</Link></li>
              <li><Link to="/nasil-kullanilir" className="hover:text-emerald-400 transition">Nasıl Kullanılır?</Link></li>
              {flags.fiyatHesaplama && (
                <li><Link to="/fiyat-hesapla" className="hover:text-emerald-400 transition">{t('nav.fiyatHesapla')}</Link></li>
              )}
              <li><Link to="/hakkimizda" className="hover:text-emerald-400 transition">{t('nav.about')}</Link></li>
              <li><Link to="/geri-bildirim" className="hover:text-emerald-400 transition">İstek & Şikayet</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to={LEGAL_LINKS.kvkk} className="hover:text-emerald-400 transition">{t('footer.kvkk')}</Link></li>
              <li><Link to={LEGAL_LINKS.gizlilik} className="hover:text-emerald-400 transition">{t('footer.privacy')}</Link></li>
              <li><Link to={LEGAL_LINKS.kullanim} className="hover:text-emerald-400 transition">{t('footer.terms')}</Link></li>
              <li><Link to={LEGAL_LINKS.cerez} className="hover:text-emerald-400 transition">{t('footer.cookies')}</Link></li>
              <li><Link to={LEGAL_LINKS.mesafeli} className="hover:text-emerald-400 transition">{t('footer.distance')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t('footer.contact')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>{SITE_CONFIG.address}</span>
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
          <p>&copy; {currentYear} {SITE_CONFIG.name}. {t('footer.rights')}</p>
          <p className="flex items-center gap-3">
            <Link to={LEGAL_LINKS.kvkk} className="hover:text-emerald-400 transition">KVKK</Link>
            <span aria-hidden="true">•</span>
            <Link to={LEGAL_LINKS.gizlilik} className="hover:text-emerald-400 transition">Gizlilik</Link>
            <span aria-hidden="true">•</span>
            <Link to={LEGAL_LINKS.cerez} className="hover:text-emerald-400 transition">Çerezler</Link>
          </p>
        </div>
      </div>

      {/* schema.org Organization markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ModülerPazar',
          url: 'https://www.modulerpazar.com',
          logo: 'https://www.modulerpazar.com/favicon.svg',
          description: 'Türkiye\'nin en büyük modüler yapı pazarı. Prefabrik ev, çelik yapı, konteyner ev, tiny house fiyatları ve firmaları.',
          contactPoint: {
            '@type': 'ContactPoint',
            email: SITE_CONFIG.email,
            contactType: 'customer service',
            availableLanguage: 'Turkish',
          },
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Maslak Mah. AOS 55. Sk. 42 Maslak',
            addressLocality: 'Sarıyer',
            addressRegion: 'İstanbul',
            addressCountry: 'TR',
          },
          sameAs: [sosyal.linkedin, sosyal.instagram, sosyal.facebook, sosyal.twitter, sosyal.youtube].filter(Boolean),
        }) }}
      />

      {/* schema.org WebSite markup — enables Google Sitelinks Search Box */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'ModülerPazar',
          url: 'https://www.modulerpazar.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://www.modulerpazar.com/ilanlar?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }) }}
      />
    </footer>
  );
}
