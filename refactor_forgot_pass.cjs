const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, 'src', 'components', 'Login.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');

// 1. Add Translations
const esTranslationsRegex = /phoneRequired: 'El número de teléfono es obligatorio.',\n  \},/g;
loginContent = loginContent.replace(esTranslationsRegex, `phoneRequired: 'El número de teléfono es obligatorio.',
    forgotPassword: '¿Olvidaste tu contraseña?',
    resetInstructions: 'Ingresa tu correo para recibir un enlace de recuperación.',
    sendResetLink: 'Enviar enlace',
    backToLogin: 'Volver a iniciar sesión',
    resetEmailSent: '¡Enlace enviado! Revisa tu correo.',
  },`);

const enTranslationsRegex = /phoneRequired: 'Phone number is required.',\n  \}\n\};/g;
loginContent = loginContent.replace(enTranslationsRegex, `phoneRequired: 'Phone number is required.',
    forgotPassword: 'Forgot your password?',
    resetInstructions: 'Enter your email to receive a recovery link.',
    sendResetLink: 'Send reset link',
    backToLogin: 'Back to log in',
    resetEmailSent: 'Link sent! Check your inbox.',
  }
};`);

// 2. Add State
const stateRegex = /const \[isSignUp, setIsSignUp\] = useState\(false\);/g;
loginContent = loginContent.replace(stateRegex, `const [isSignUp, setIsSignUp] = useState(false);\n  const [isForgotPassword, setIsForgotPassword] = useState(false);`);

// 3. Add handleResetPassword
const handleSubmitRegex = /const handleSubmit = async \(e: React.FormEvent\) => \{/g;
loginContent = loginContent.replace(handleSubmitRegex, `const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!email.trim()) throw new Error(t.emailRequired);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setErrorMsg(t.resetEmailSent);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {`);

// 4. Modify errorMsg banner
loginContent = loginContent.replace(
  `errorMsg.includes('exitoso') || errorMsg.includes('successful')`,
  `errorMsg.includes('exitoso') || errorMsg.includes('successful') || errorMsg.includes('enviado') || errorMsg.includes('sent')`
);

// 5. Render form logic
const renderRegex = /<form onSubmit=\{handleSubmit\}>[\s\S]*?<\/form>/;

const newForm = `{isForgotPassword ? (
          <form onSubmit={handleResetPassword}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginBottom: '16px' }}>{t.resetInstructions}</p>
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">{t.emailLabel}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                  <Mail size={18} />
                </span>
                <input
                  id="reset-email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading || email.trim() === ''} className="btn-primary" style={{ marginBottom: '16px' }}>
              {loading ? t.btnProcessing : t.sendResetLink}
            </button>
            <button type="button" onClick={() => setIsForgotPassword(false)} className="btn-secondary" style={{ border: 'none' }}>
              {t.backToLogin}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit}>
            {isSignUp ? (
              <>
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">{t.fullName}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                      <User size={18} />
                    </span>
                    <input
                      id="fullName"
                      type="text"
                      placeholder={t.fullNamePlaceholder}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '44px' }}
                      required
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">{t.phone}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                      <Phone size={18} />
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      placeholder={t.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '44px' }}
                      required
                    />
                  </div>
                </div>
                
                {/* Confirm Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="confirmPhone">{t.confirmPhone}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                      <Phone size={18} />
                    </span>
                    <input
                      id="confirmPhone"
                      type="tel"
                      placeholder={t.phonePlaceholder}
                      value={confirmPhone}
                      onChange={(e) => setConfirmPhone(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '44px' }}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">{t.emailLabel}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                      <Mail size={18} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      placeholder={t.emailPlaceholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '44px' }}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              /* Login Identifier (Phone or Email) */
              <div className="form-group">
                <label className="form-label" htmlFor="loginIdentifier">{t.loginIdentifier}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                    <User size={18} />
                  </span>
                  <input
                    id="loginIdentifier"
                    type="text"
                    placeholder={t.loginIdentifierPlaceholder}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                    required
                  />
                </div>
              </div>
            )}
            
            {/* Password */}
            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label className="form-label" htmlFor="password">{t.password}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
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

            {!isSignUp && (
              <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(null); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--brand-gold)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.forgotPassword}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="btn-primary"
            >
              {loading ? t.btnProcessing : (isSignUp ? t.btnCreate : t.btnEnter)}
            </button>
          </form>
        )}`;

loginContent = loginContent.replace(renderRegex, newForm);

// Also we need to wrap the bottom buttons so they don't show when isForgotPassword is true
const bottomRegex = /<div style=\{\{ marginTop: '24px' \}\}>[\s\S]*?<\/div>/;
const bottomContentMatch = loginContent.match(bottomRegex);
if (bottomContentMatch) {
  const bottomContent = bottomContentMatch[0];
  loginContent = loginContent.replace(bottomRegex, `{!isForgotPassword && (\n          ${bottomContent.split('\\n').join('\\n          ')}\n        )}`);
}

fs.writeFileSync(loginPath, loginContent, 'utf8');

// Update App.tsx
const appPath = path.join(__dirname, 'src', 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('UpdatePassword')) {
  const importRegex = /import \{ ClientDashboard \} from '.\/components\/ClientDashboard';/g;
  appContent = appContent.replace(importRegex, `import { ClientDashboard } from './components/ClientDashboard';\nimport { UpdatePassword } from './components/UpdatePassword';`);

  const stateRegexApp = /const \[loading, setLoading\] = useState\(true\);/g;
  appContent = appContent.replace(stateRegexApp, `const [loading, setLoading] = useState(true);\n  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);`);

  const authChangeRegex = /const \{ data: \{ subscription \} \} = supabase\.auth\.onAuthStateChange\(\(_event, session\) => \{[\s\S]*?\}\);/g;
  appContent = appContent.replace(authChangeRegex, `const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }
      setLoading(false);
    });`);

  const appRenderRegex = /<>\n      \{\!session \? \([\s\S]*?\) : \([\s\S]*?\)\}\n    <\/>/g;
  appContent = appContent.replace(appRenderRegex, `<>
      {!session ? (
        <Login onLoginSuccess={() => supabase.auth.getSession().then(({ data: { session } }) => setSession(session))} />
      ) : isRecoveringPassword ? (
        <UpdatePassword onComplete={() => setIsRecoveringPassword(false)} />
      ) : (
        <ClientDashboard onLogout={handleLogout} />
      )}
    </>`);

  fs.writeFileSync(appPath, appContent, 'utf8');
}

// Create UpdatePassword.tsx
const updatePasswordPath = path.join(__dirname, 'src', 'components', 'UpdatePassword.tsx');
if (!fs.existsSync(updatePasswordPath)) {
  const updatePasswordContent = `import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const UpdatePassword: React.FC<Props> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      onComplete();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ position: 'relative' }}>
        <h1 className="login-title">Nueva Contraseña</h1>
        <p className="login-subtitle">Ingresa tu nueva contraseña para tu cuenta.</p>

        {errorMsg && (
          <div className="error-banner">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label" htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                <Lock size={18} />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '44px', paddingRight: '44px' }}
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

          <button
            type="submit"
            disabled={loading || password.length < 6}
            className="btn-primary"
          >
            {loading ? 'Procesando...' : 'Guardar y Continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};
`;
  fs.writeFileSync(updatePasswordPath, updatePasswordContent, 'utf8');
}

console.log('Refactor complete!');
