import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import SellerFormPage from './pages/SellerFormPage';
import CategoryPage from './pages/CategoryPage';
import LegalPage from './pages/LegalPage';
import KvkkPage from './pages/KvkkPage';
import GizlilikPage from './pages/GizlilikPage';
import KullanimKosullariPage from './pages/KullanimKosullariPage';
import FirmalarHaritaPage from './pages/FirmalarHaritaPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminRoute from './components/AdminRoute';
import LogoKitPage from './pages/LogoKitPage';
import IlanDetayPage from './pages/IlanDetayPage';
import { TeklifSepetProvider } from './context/TeklifSepetContext';
import TeklifSepeti from './components/TeklifSepeti';
import './App.css';

function App() {
  return (
    <TeklifSepetProvider>
      <Router>
        <Toaster position="top-right" richColors />
        <TeklifSepeti />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/satici-formu" element={<SellerFormPage />} />
          <Route path="/kategori/:slug" element={<CategoryPage />} />
          <Route path="/kvkk" element={<KvkkPage />} />
          <Route path="/gizlilik" element={<GizlilikPage />} />
          <Route path="/kullanim-kosullari" element={<KullanimKosullariPage />} />
          <Route path="/firmalar-harita" element={<FirmalarHaritaPage />} />
          <Route path="/yasal/:slug" element={<LegalPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          } />
          <Route path="/logo-kit" element={<LogoKitPage />} />
          <Route path="/ilan/:id" element={<IlanDetayPage />} />
        </Routes>
      </Router>
    </TeklifSepetProvider>
  );
}

export default App;
