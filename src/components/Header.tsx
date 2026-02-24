import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Building2, ChevronDown, Search, User, Phone } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { SITE_CONFIG } from '../config/site';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-emerald-700 text-white py-2 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Destek Hattı:</span> {SITE_CONFIG.phone}
          </span>
          <Link to="/satici-formu" className="hover:underline">
            Ücretsiz İlan Ver
          </Link>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Building2 className="w-8 h-8 text-emerald-600" />
            <span className="text-xl font-bold text-gray-800">
              Modüler<span className="text-emerald-600">Pazar</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Prefabrik ev, konteyner, tiny house ara..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/satici-formu"
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
            >
              İlan Ver
            </Link>
            <button className="p-2 text-gray-600 hover:text-emerald-600 transition">
              <User className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Search Bar - Mobile */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Ara..."
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <nav className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {/* Desktop Categories */}
          <div className="hidden md:flex items-center gap-1 py-2 overflow-x-auto">
            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium"
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                Tüm Kategoriler
                <ChevronDown className="w-4 h-4" />
              </button>
              {categoryDropdownOpen && (
                <div
                  className="absolute top-full left-0 bg-white shadow-lg rounded-lg py-2 min-w-48 z-50"
                  onMouseEnter={() => setCategoryDropdownOpen(true)}
                  onMouseLeave={() => setCategoryDropdownOpen(false)}
                >
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={`/kategori/${cat.slug}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/kategori/${cat.slug}`}
                className="px-3 py-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition whitespace-nowrap text-sm"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-2">
            <Link
              to="/satici-formu"
              className="block w-full bg-emerald-600 text-white px-4 py-3 rounded-lg text-center font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Ücretsiz İlan Ver
            </Link>
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="text-sm text-gray-500 mb-2">Kategoriler</p>
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/kategori/${cat.slug}`}
                  className="block px-2 py-2 text-gray-700 hover:text-emerald-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
