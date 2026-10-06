import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Props {
  onComplete: () => void;
}

export const UpdatePassword: React.FC<Props> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!password || password.length < 4) {
        throw new Error('El NIP debe tener al menos 4 dígitos.');
      }

      toast.db('Actualizando NIP...', 'loading', 'Guardando nueva contraseña en la base de datos');
      let securePassword = `postreland_${password}`;
      
      const { data, error } = await supabase.auth.updateUser({ password: securePassword });
      if (error) throw error;
      
      if (data.user) {
        await supabase.from('profiles').update({ pin: password }).eq('id', data.user.id);
      }

      toast.db('NIP Actualizado', 'success', 'Tus nuevas credenciales se guardaron en la base de datos');
      onComplete();
    } catch (err: any) {
      const errMsg = err.message || 'Error al actualizar el NIP';
      setErrorMsg(errMsg);
      toast.db('Error al Actualizar', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ position: 'relative' }}>
        <h1 className="login-title">Nuevo NIP</h1>
        <p className="login-subtitle">Ingresa tu nuevo NIP de 4 dígitos para tu cuenta.</p>

        {errorMsg && (
          <div className="error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">NIP (4 dígitos)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="Ej: 1234"
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '44px', letterSpacing: password ? '3px' : 'normal', fontWeight: 'bold' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#78716C',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || password.length < 4} className="btn-primary">
            {loading ? 'Procesando...' : 'Guardar y Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};
