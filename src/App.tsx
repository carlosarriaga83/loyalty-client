import { useState, useEffect } from 'react';
import { clearAccessToken, getAccessToken } from './loyaltyApi';
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
    setSession(getAccessToken() ? { accessToken: getAccessToken() } : null);
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    clearAccessToken();
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
        <Login onLoginSuccess={() => setSession({ accessToken: getAccessToken() })} />
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
