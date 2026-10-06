import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { StoreProvider, useStore } from './context/StoreContext';
import { Login } from './components/Login';
import { ClientDashboard } from './components/ClientDashboard';
import { UpdatePassword } from './components/UpdatePassword';
import { RefreshCw } from 'lucide-react';

import { ToastProvider } from './context/ToastContext';

function AppContent() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const { loading: storeLoading } = useStore();

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Clear invalid/expired session token
        supabase.auth.signOut().catch(() => {});
        setSession(null);
      } else {
        setSession(session);
      }
      setLoading(false);
    }).catch(() => {
      setSession(null);
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setLoading(false);
  };

  if (loading || storeLoading) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="spin" style={{ color: 'var(--brand-gold)' }} size={48} />
          <p style={{ marginTop: '16px', color: 'var(--brand-gold)', fontWeight: 600 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!session ? (
        <Login onLoginSuccess={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />
      ) : isRecoveringPassword ? (
        <UpdatePassword onComplete={() => setIsRecoveringPassword(false)} />
      ) : (
        <ClientDashboard onLogout={handleLogout} />
      )}
    </>
  );
}

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;
