import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider }        from './context/AuthContext';
import { TeklifSepetProvider } from './context/TeklifSepetContext';
import { LanguageProvider }    from './context/LanguageContext';
import AdminRoute   from './components/AdminRoute';
import TeklifSepeti from './components/TeklifSepeti';
import './App.css';

/* ── Lazy page imports (her sayfa ayrı chunk) ─────────────── */
const HomePage              = lazy(() => import('./pages/HomePage'));
const CategoryPage          = lazy(() => import('./pages/CategoryPage'));
const IlanDetayPage         = lazy(() => import('./pages/IlanDetayPage'));
const FirmalarHaritaPage    = lazy(() => import('./pages/FirmalarHaritaPage'));
const SellerFormPage        = lazy(() => import('./pages/SellerFormPage'));
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
const FirmaProfilPage       = lazy(() => import('./pages/FirmaProfilPage'));
const ProfilPage            = lazy(() => import('./pages/ProfilPage'));

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
    <LanguageProvider>
      <AuthProvider>
        <TeklifSepetProvider>
          <Router>
            <Toaster position="top-right" richColors />
            <TeklifSepeti />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                  element={<HomePage />} />
                <Route path="/kategori/:slug"    element={<CategoryPage />} />
                <Route path="/ilan/:id"          element={<IlanDetayPage />} />
                <Route path="/firmalar-harita"   element={<FirmalarHaritaPage />} />
                <Route path="/firma/:id"         element={<FirmaProfilPage />} />
                <Route path="/satici-formu"      element={<SellerFormPage />} />
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
                <Route path="/admin"            element={<AdminLoginPage />} />
                <Route path="/admin/dashboard"  element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                } />
              </Routes>
            </Suspense>
          </Router>
        </TeklifSepetProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
