import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Marketplace from './pages/Marketplace';
import SellerFormPage from './pages/SellerFormPage';
import CategoryPage from './pages/CategoryPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/satici-formu" element={<SellerFormPage />} />
        <Route path="/kategori/:slug" element={<CategoryPage />} />
      </Routes>
    </Router>
  );
}

export default App;
