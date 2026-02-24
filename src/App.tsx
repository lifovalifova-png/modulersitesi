import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from './pages/HomePage';
import SellerFormPage from './pages/SellerFormPage';
import CategoryPage from './pages/CategoryPage';
import './App.css';

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/satici-formu" element={<SellerFormPage />} />
        <Route path="/kategori/:slug" element={<CategoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
