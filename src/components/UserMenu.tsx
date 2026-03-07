import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, FileText, UserCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Dışarı tıklanınca kapat */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Giriş yapılmamışsa: Giriş / Kayıt butonları */
  if (!currentUser) {
    return (
      <div className="flex items-center gap-2">
        <Link
          to="/giris"
          className="text-sm text-gray-600 hover:text-emerald-600 font-medium transition hidden lg:inline"
        >
          Giriş Yap
        </Link>
        <Link
          to="/kayit"
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          Kayıt Ol
        </Link>
      </div>
    );
  }

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Kullanıcı';
  const initials    = displayName.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
    setOpen(false);
    navigate('/');
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger */}
      <div className="flex items-center gap-1 text-gray-700">
        {/* Avatar → /profil */}
        <Link
          to="/profil"
          aria-label="Profilim"
          className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm flex-shrink-0 hover:opacity-80 transition overflow-hidden"
        >
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </Link>
        {/* Ad + chevron → dropdown */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Hesap menüsü"
          aria-expanded={open}
          className="flex items-center gap-1 hover:text-emerald-600 transition"
        >
          <span className="text-sm font-medium hidden lg:inline max-w-[120px] truncate">{displayName}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          {/* Kullanıcı bilgisi → /profil */}
          <Link
            to="/profil"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 border-b border-gray-100 hover:bg-emerald-50 transition"
          >
            <p className="font-semibold text-gray-800 text-sm truncate">{displayName}</p>
            <p className="text-xs text-gray-400 truncate mt-0.5">{currentUser.email}</p>
          </Link>

          {/* Menü öğeleri */}
          <div className="py-1">
            <Link
              to="/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <UserCircle className="w-4 h-4" />
              Profilim
            </Link>
            <Link
              to="/firma-paneli"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
            >
              <FileText className="w-4 h-4" />
              İlanlarım
            </Link>
          </div>

          {/* Çıkış */}
          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
