import { Link } from 'react-router-dom';
import { Mail, MapPin, Facebook, Instagram, Twitter, Linkedin, Youtube } from 'lucide-react';
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
    <footer className="bg-slate-900 text-gray-300 font-body">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-3xl text-primary" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
              <span className="text-xl font-extrabold text-white font-headline">
                Modüler<span className="text-primary">Pazar</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5 text-gray-400">
              {t('footer.desc')}
            </p>
            <div className="flex gap-2 flex-wrap">
              {sosyal.linkedin && (
                <a href={sosyal.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="p-2.5 bg-white/5 rounded-xl hover:bg-primary hover:text-white transition">
                  <Linkedin className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.instagram && (
                <a href={sosyal.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="p-2.5 bg-white/5 rounded-xl hover:bg-primary hover:text-white transition">
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.facebook && (
                <a href={sosyal.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="p-2.5 bg-white/5 rounded-xl hover:bg-primary hover:text-white transition">
                  <Facebook className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.twitter && (
                <a href={sosyal.twitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="p-2.5 bg-white/5 rounded-xl hover:bg-primary hover:text-white transition">
                  <Twitter className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
              {sosyal.youtube && (
                <a href={sosyal.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="p-2.5 bg-white/5 rounded-xl hover:bg-primary hover:text-white transition">
                  <Youtube className="w-5 h-5" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-5 font-headline">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/" className="hover:text-primary transition">{t('footer.home')}</Link></li>
              <li><Link to="/kategori/prefabrik" className="hover:text-primary transition">{t('footer.prefabrik')}</Link></li>
              <li><Link to="/kategori/tiny-house" className="hover:text-primary transition">{t('footer.tinyHouse')}</Link></li>
              <li><Link to="/kategori/ikinci-el" className="hover:text-primary transition">{t('footer.secondHand')}</Link></li>
              <li><Link to="/firmalar" className="hover:text-primary transition">{t('nav.firms')}</Link></li>
              <li><Link to="/satici-formu" className="hover:text-primary transition">{t('footer.postAd')}</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition">{t('footer.blog')}</Link></li>
              <li><Link to="/haberler" className="hover:text-primary transition">{t('footer.haberler')}</Link></li>
              <li><Link to="/sss" className="hover:text-primary transition">{t('footer.faq')}</Link></li>
              <li><Link to="/nasil-kullanilir" className="hover:text-primary transition">{t('footer.howToUse')}</Link></li>
              {flags.fiyatHesaplama && (
                <li><Link to="/fiyat-hesapla" className="hover:text-primary transition">{t('nav.fiyatHesapla')}</Link></li>
              )}
              <li><Link to="/fiyatlandirma" className="hover:text-primary transition">Fiyatlandırma</Link></li>
              <li><Link to="/hakkimizda" className="hover:text-primary transition">{t('nav.about')}</Link></li>
              <li><Link to="/geri-bildirim" className="hover:text-primary transition">İstek & Şikayet</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-bold mb-5 font-headline">{t('footer.legal')}</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to={LEGAL_LINKS.kvkk} className="hover:text-primary transition">{t('footer.kvkk')}</Link></li>
              <li><Link to={LEGAL_LINKS.gizlilik} className="hover:text-primary transition">{t('footer.privacy')}</Link></li>
              <li><Link to={LEGAL_LINKS.kullanim} className="hover:text-primary transition">{t('footer.terms')}</Link></li>
              <li><Link to={LEGAL_LINKS.cerez} className="hover:text-primary transition">{t('footer.cookies')}</Link></li>
              <li><Link to={LEGAL_LINKS.mesafeli} className="hover:text-primary transition">{t('footer.distance')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-5 font-headline">{t('footer.contact')}</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-gray-400">{SITE_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-primary transition text-gray-400">
                  {SITE_CONFIG.email}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col md:flex-row justify-between items-center text-sm gap-2 text-gray-500">
          <p>&copy; {currentYear} {SITE_CONFIG.name}. {t('footer.rights')}</p>
          <p className="flex items-center gap-3">
            <Link to={LEGAL_LINKS.kvkk} className="hover:text-primary transition">KVKK</Link>
            <span aria-hidden="true" className="text-white/20">|</span>
            <Link to={LEGAL_LINKS.gizlilik} className="hover:text-primary transition">Gizlilik</Link>
            <span aria-hidden="true" className="text-white/20">|</span>
            <Link to={LEGAL_LINKS.cerez} className="hover:text-primary transition">Çerezler</Link>
          </p>
        </div>
      </div>

      {/* schema.org Organization markup — static JSON-LD, no user input */}
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

      {/* schema.org WebSite markup — static JSON-LD, no user input */}
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
