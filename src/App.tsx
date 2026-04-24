import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HelmetProvider }      from 'react-helmet-async';
import { AuthProvider }        from './context/AuthContext';
import { TeklifSepetProvider } from './context/TeklifSepetContext';
import { LanguageProvider }    from './context/LanguageContext';
import { SettingsProvider }    from './context/SettingsContext';
import AdminRoute      from './components/AdminRoute';
import BetaBanner      from './components/BetaBanner';
import TeklifSepeti   from './components/TeklifSepeti';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useFeatureFlags } from './hooks/useFeatureFlags';
import './App.css';

/* ── Lazy page imports (her sayfa ayrı chunk) ─────────────── */
const HomePage              = lazy(() => import('./pages/HomePage'));
const CategoryPage          = lazy(() => import('./pages/CategoryPage'));
const IlanDetayPage         = lazy(() => import('./pages/IlanDetayPage'));
const SellerFormPage        = lazy(() => import('./pages/SellerFormPage'));
const IlanOlusturPage       = lazy(() => import('./pages/IlanOlusturPage'));
const TalepOlusturPage      = lazy(() => import('./pages/TalepOlusturPage'));
const FirmaPaneliPage       = lazy(() => import('./pages/FirmaPaneliPage'));
const BlogPage              = lazy(() => import('./pages/BlogPage'));
const BlogDetayPage         = lazy(() => import('./pages/BlogDetayPage'));
const SSSPage               = lazy(() => import('./pages/SSSPage'));
const GirisPage             = lazy(() => import('./pages/GirisPage'));
const KayitPage             = lazy(() => import('./pages/KayitPage'));
const SifreSifirlaPage      = lazy(() => import('./pages/SifreSifirlaPage'));
const AdminLoginPage        = lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage    = lazy(() => import('./pages/AdminDashboardPage'));
const KvkkPage              = lazy(() => import('./pages/KvkkPage'));
const GizlilikPage          = lazy(() => import('./pages/GizlilikPage'));
const KullanimKosullariPage = lazy(() => import('./pages/KullanimKosullariPage'));
const LegalPage             = lazy(() => import('./pages/LegalPage'));
const LogoKitPage           = lazy(() => import('./pages/LogoKitPage'));
const FirmalarPage          = lazy(() => import('./pages/FirmalarPage'));
const FirmaIlanlarPage      = lazy(() => import('./pages/FirmaIlanlarPage'));
const FirmaProfilPage       = lazy(() => import('./pages/FirmaProfilPage'));
const ProfilPage            = lazy(() => import('./pages/ProfilPage'));
const FiyatHesaplaPage      = lazy(() => import('./pages/FiyatHesaplaPage'));
const HakkimizdaPage        = lazy(() => import('./pages/HakkimizdaPage'));
const GeriBildirimPage      = lazy(() => import('./pages/GeriBildirimPage'));
const TalepDetayPage        = lazy(() => import('./pages/TalepDetayPage'));
const NasilKullanilirPage   = lazy(() => import('./pages/NasilKullanilirPage'));
const HaberlerPage          = lazy(() => import('./pages/HaberlerPage'));
const HaberDetayPage        = lazy(() => import('./pages/HaberDetayPage'));
const EtkinliklerPage       = lazy(() => import('./pages/EtkinliklerPage'));
// Faz 2'de aktif edilecek — şimdilik route kapalı
// const FiyatlandirmaPage  = lazy(() => import('./pages/FiyatlandirmaPage'));
const EtkinlikDetayPage     = lazy(() => import('./pages/EtkinlikDetayPage'));
const NotFoundPage          = lazy(() => import('./pages/NotFoundPage'));

/* ── Feature flag gated TeklifSepeti ───────────────────────── */
function GatedTeklifSepeti() {
  const { flags } = useFeatureFlags();
  if (!flags.teklifSepeti) return null;
  return <TeklifSepeti />;
}

/* ── Sayfa yüklenirken gösterilecek spinner ───────────────── */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
    <LanguageProvider>
      <SettingsProvider>
      <AuthProvider>
        <TeklifSepetProvider>
          <Router>
            <BetaBanner />
            <Toaster position="top-right" richColors />
            <GatedTeklifSepeti />
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                  element={<HomePage />} />
                <Route path="/kategori/:slug"    element={<CategoryPage />} />
                <Route path="/ilan/:id"          element={<IlanDetayPage />} />
                <Route path="/firmalar"          element={<FirmalarPage />} />
                <Route path="/firmalar/:firmaId/ilanlar" element={<FirmaIlanlarPage />} />
                <Route path="/firmalar/:firmaId" element={<FirmaProfilPage />} />
                <Route path="/firma/:id"         element={<FirmaProfilPage />} />
                <Route path="/satici-formu"      element={<SellerFormPage />} />
                <Route path="/ilan-olustur"      element={<IlanOlusturPage />} />
                <Route path="/talep-olustur"     element={<TalepOlusturPage />} />
                <Route path="/firma-paneli"      element={<FirmaPaneliPage />} />
                <Route path="/blog"              element={<BlogPage />} />
                <Route path="/blog/:slug"        element={<BlogDetayPage />} />
                <Route path="/sss"              element={<SSSPage />} />
                <Route path="/giris"            element={<GirisPage />} />
                <Route path="/kayit"            element={<KayitPage />} />
                <Route path="/sifre-sifirla"    element={<SifreSifirlaPage />} />
                <Route path="/kvkk"             element={<KvkkPage />} />
                <Route path="/gizlilik"         element={<GizlilikPage />} />
                <Route path="/kullanim-kosullari" element={<KullanimKosullariPage />} />
                <Route path="/yasal/:slug"      element={<LegalPage />} />
                <Route path="/profil"           element={<ProfilPage />} />
                <Route path="/logo-kit"         element={<LogoKitPage />} />
                <Route path="/fiyat-hesapla"    element={<FiyatHesaplaPage />} />
                <Route path="/hakkimizda"       element={<HakkimizdaPage />} />
                <Route path="/nasil-kullanilir" element={<NasilKullanilirPage />} />
                <Route path="/haberler"         element={<HaberlerPage />} />
                <Route path="/haberler/:haberId" element={<HaberDetayPage />} />
                <Route path="/etkinlikler"      element={<EtkinliklerPage />} />
                <Route path="/etkinlikler/:slug" element={<EtkinlikDetayPage />} />
                {/* Fiyatlandırma sayfası Faz 2'de aktif edilecek */}
                <Route path="/geri-bildirim"   element={<GeriBildirimPage />} />
                <Route path="/talepim/:talepId" element={<TalepDetayPage />} />
                <Route path="/admin"            element={<AdminLoginPage />} />
                <Route path="/admin/dashboard"  element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                } />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          </Router>
        </TeklifSepetProvider>
      </AuthProvider>
      </SettingsProvider>
    </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;
