import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';
import {
  type User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'buyer' | 'seller' | null;

interface AuthContextValue {
  currentUser: User | null;
  role: UserRole;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role,        setRole]        = useState<UserRole>(null);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const snap = await getDoc(doc(db, 'users', user.uid));
        setRole((snap.data()?.role as UserRole) ?? null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, displayName: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    return cred.user;
  }

  async function loginWithGoogle(): Promise<User> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, role, loading, login, register, loginWithGoogle, logout, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/* ── Hata kodlarını Türkçe'ye çevirir ─────────────────── */
export function authErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':         'Bu e-posta ile kayıtlı kullanıcı bulunamadı.',
    'auth/wrong-password':         'Şifre hatalı.',
    'auth/invalid-credential':     'E-posta veya şifre hatalı.',
    'auth/email-already-in-use':   'Bu e-posta adresi zaten kullanılıyor.',
    'auth/invalid-email':          'Geçersiz e-posta adresi.',
    'auth/weak-password':          'Şifre en az 6 karakter olmalıdır.',
    'auth/too-many-requests':      'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.',
    'auth/popup-closed-by-user':   'Google girişi iptal edildi.',
    'auth/popup-blocked':          "Tarayıcınız popup'ı engelledi. Lütfen izin verin.",
    'auth/network-request-failed': 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
  };
  return map[code] ?? 'Bir hata oluştu. Lütfen tekrar deneyin.';
}
