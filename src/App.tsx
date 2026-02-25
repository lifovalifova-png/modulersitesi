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
import './App.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/satici-formu" element={<SellerFormPage />} />
        <Route path="/kategori/:slug" element={<CategoryPage />} />
        <Route path="/kvkk" element={<KvkkPage />} />
        <Route path="/gizlilik" element={<GizlilikPage />} />
        <Route path="/kullanim-kosullari" element={<KullanimKosullariPage />} />
        <Route path="/firmalar-harita" element={<FirmalarHaritaPage />} />
        <Route path="/yasal/:slug" element={<LegalPage />} />
      </Routes>
    </Router>
  );
}

export default App;
