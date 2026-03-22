import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

type Status = 'loading' | 'admin' | 'unauthorized';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('unauthorized');
        return;
      }
      try {
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        setStatus(adminSnap.exists() ? 'admin' : 'unauthorized');
      } catch {
        setStatus('unauthorized');
      }
    });
    return unsub;
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
