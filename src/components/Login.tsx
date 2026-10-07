import React, { useState } from 'react';
import { apiRequest, authenticate } from '../loyaltyApi';
import { User, Lock, Eye, EyeOff, Phone, Store as StoreIcon, LogIn, UserPlus, KeyRound } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';

interface LoginProps {
  onLoginSuccess: () => void;
}

const translations = {
  es: {
    title: 'Postreland',
    tabLogin: 'Iniciar Sesión',
    tabSignUp: 'Crear Cuenta',
    badgeLogin: 'Ya tengo cuenta',
    badgeSignUp: '✨ Nuevo Registro',
    headingLogin: 'Iniciar Sesión',
    headingSignUp: 'Crear Cuenta Nueva',
    fullName: 'Nombre Completo',
    fullNamePlaceholder: 'Tu nombre y apellido',
    loginIdentifier: 'Número de Teléfono Celular',
    loginIdentifierPlaceholder: '10 dígitos de tu celular',
    phone: 'Número de Teléfono Celular',
    phonePlaceholder: '10 dígitos de tu celular',
    phoneHint: 'Tu número de teléfono será tu usuario de acceso',
    confirmPhone: 'Confirmar Teléfono',
    emailLabel: 'Correo Electrónico',
    emailRequired: 'El correo electrónico es obligatorio.',
    emailPlaceholder: 'correo@ejemplo.com',
    password: 'Tu NIP de Acceso (4 dígitos)',
    passwordPlaceholder: 'Ingresa tus 4 dígitos',
    signUpPassword: 'Crea tu NIP (4 dígitos)',
    signUpPasswordPlaceholder: 'Ej: 1234',
    pinHint: 'Solo 4 números que recuerdes fácilmente',
    confirmPassword: 'Confirmar NIP (4 dígitos)',
    confirmPasswordPlaceholder: 'Repite tus 4 dígitos',
    passwordMismatch: 'Los NIPs no coinciden.',
    passwordMinLength: 'El NIP debe tener exactamente 4 dígitos.',
    defaultClientName: 'Cliente',
    btnCreate: '✨ Crear mi Cuenta y Registrarme',
    btnEnter: 'Ingresar a mi Cuenta →',
    btnProcessing: 'Procesando...',
    newCustomerPrompt: '¿Es tu primera vez con nosotros?',
    newCustomerBtn: '✨ Toca aquí para Crear una Cuenta',
    existingCustomerPrompt: '¿Ya te habías registrado antes?',
    existingCustomerBtn: '🔑 Toca aquí para Iniciar Sesión',
    toggleToSignUp: '¿No tienes una cuenta? Regístrate',
    toggleToLogin: '¿Ya tienes una cuenta? Inicia Sesión',
    successMsg: '¡Registro exitoso! Ya puedes iniciar sesión.',
    phoneMismatch: 'Los números de teléfono no coinciden.',
    phoneRequired: 'El número de teléfono celular es obligatorio.',
    forgotPassword: '¿Olvidaste tu NIP?',
    forgotTitle: 'Recuperar NIP por WhatsApp',
    resetInstructions: 'Ingresa tu número celular registrado y te enviaremos tu NIP por mensaje de WhatsApp.',
    sendResetLink: 'Enviar NIP por WhatsApp',
    backToLogin: '← Volver a Iniciar Sesión',
    resetEmailSent: '¡Enlace enviado! Revisa tu correo.',
    btnGoogle: 'Continuar con Google',
    btnFacebook: 'Continuar con Facebook',
    btnApple: 'Continuar con Apple',
  },
  en: {
    title: 'Postreland',
    tabLogin: 'Log In',
    tabSignUp: 'Sign Up',
    badgeLogin: 'Existing Account',
    badgeSignUp: '✨ New Member',
    headingLogin: 'Log In',
    headingSignUp: 'Create New Account',
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your full name',
    loginIdentifier: 'Mobile Phone Number',
    loginIdentifierPlaceholder: '10-digit phone number',
    phone: 'Mobile Phone Number',
    phonePlaceholder: '10-digit phone number',
    phoneHint: 'Your phone number will be your user ID',
    confirmPhone: 'Confirm Phone Number',
    emailLabel: 'Email Address',
    emailRequired: 'Email address is required.',
    emailPlaceholder: 'email@example.com',
    password: 'Your PIN (4 digits)',
    passwordPlaceholder: 'Enter 4 digits',
    signUpPassword: 'Create your PIN (4 digits)',
    signUpPasswordPlaceholder: 'Ex: 1234',
    pinHint: 'Exactly 4 digits you will easily remember',
    confirmPassword: 'Confirm PIN (4 digits)',
    confirmPasswordPlaceholder: 'Repeat your 4 digits',
    passwordMismatch: 'PINs do not match.',
    passwordMinLength: 'PIN must be exactly 4 digits.',
    defaultClientName: 'Client',
    btnCreate: '✨ Create Account & Register',
    btnEnter: 'Log In to My Account →',
    btnProcessing: 'Processing...',
    newCustomerPrompt: 'First time visiting us?',
    newCustomerBtn: '✨ Tap here to Create an Account',
    existingCustomerPrompt: 'Already registered before?',
    existingCustomerBtn: '🔑 Tap here to Log In',
    toggleToSignUp: "Don't have an account? Sign Up",
    toggleToLogin: 'Already have an account? Log In',
    successMsg: 'Sign up successful! You can now log in.',
    phoneMismatch: 'Phone numbers do not match.',
    phoneRequired: 'Phone number is required.',
    forgotPassword: 'Forgot your PIN?',
    forgotTitle: 'Recover PIN via WhatsApp',
    resetInstructions: 'Enter your registered mobile phone to receive your PIN via WhatsApp.',
    sendResetLink: 'Send PIN via WhatsApp',
    backToLogin: '← Back to Log In',
    resetEmailSent: 'Link sent! Check your inbox.',
    btnGoogle: 'Continue with Google',
    btnFacebook: 'Continue with Facebook',
    btnApple: 'Continue with Apple',
  }
};

const countryCodes = [
  { code: '52', label: '🇲🇽 +52' },
  { code: '1', label: '🇺🇸 +1' },
  { code: '54', label: '🇦🇷 +54' },
  { code: '34', label: '🇪🇸 +34' },
  { code: '57', label: '🇨🇴 +57' },
  { code: '56', label: '🇨🇱 +56' },
  { code: '51', label: '🇵🇪 +51' },
  { code: '58', label: '🇻🇪 +58' },
  { code: '55', label: '🇧🇷 +55' },
  { code: '502', label: '🇬🇹 +502' },
  { code: '506', label: '🇨🇷 +506' },
  { code: '503', label: '🇸🇻 +503' },
  { code: '504', label: '🇭🇳 +504' },
  { code: '593', label: '🇪🇨 +593' },
  { code: '598', label: '🇺🇾 +598' },
  { code: '591', label: '🇧🇴 +591' },
  { code: '507', label: '🇵🇦 +507' },
  { code: '505', label: '🇳🇮 +505' },
  { code: '595', label: '🇵🇾 +595' }
];

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  
  // States
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Used for login (phone)
  const [loginCountryCode, setLoginCountryCode] = useState('52');
  const [phone, setPhone] = useState('');
  const [signUpCountryCode, setSignUpCountryCode] = useState('52');
  const [resetCountryCode, setResetCountryCode] = useState('52');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const { currentStore, storeId, setStoreId, allStores, isSingleStore } = useStore();
  const toast = useToast();

  const t = translations[lang];
  const storeName = currentStore?.name || t.title;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    toast.db(
      lang === 'es' ? 'Consultando cuenta...' : 'Checking account...',
      'loading',
      lang === 'es' ? 'Buscando usuario en la base de datos' : 'Searching user in database'
    );

    try {
      if (!loginIdentifier.trim()) throw new Error(t.phoneRequired || 'El teléfono es obligatorio');
      
      const cleanPhone = loginIdentifier.replace(/[^0-9]/g, '');
      const phoneWithCountry = resetCountryCode === '52' ? cleanPhone : resetCountryCode + cleanPhone;
      
      let sentSuccess = false;

      // 1. Intentar envío directo a través del nuevo Loyalty Bot (en desarrollo local localhost:3006 o URL configurada)
      const botBaseUrl = (import.meta.env.VITE_LOYALTY_BOT_URL as string) || 
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3006' : '');

      if (botBaseUrl) {
        try {
          const resp = await fetch(`${botBaseUrl}/api/recover-pin?phone=${encodeURIComponent(phoneWithCountry)}&storeId=${encodeURIComponent(storeId || '')}`);
          if (resp.ok) {
            const botData = await resp.json();
            if (botData.success) {
              sentSuccess = true;
            }
          }
        } catch {
          // Si el bot no está activo, continúa con Supabase RPC
        }
      }

      // 2. Si no se completó por el bot directo, delegar al backend de lealtad.
      if (!sentSuccess) {
        await apiRequest('/auth/recover-pin', { method: 'POST', body: JSON.stringify({ phone: phoneWithCountry }) });
        sentSuccess = true;
      }

      if (sentSuccess) {
        const msg = lang === 'es' ? '¡NIP enviado! Revisa tu WhatsApp para recuperarlo.' : 'PIN sent! Check your WhatsApp.';
        setErrorMsg(msg);
        toast.db(
          lang === 'es' ? '¡Recuperación Enviada!' : 'Recovery Sent!',
          'success',
          lang === 'es' ? 'Revisa tu WhatsApp con tu nuevo código de acceso' : 'Check WhatsApp for your access code'
        );
        setTimeout(() => {
          setIsForgotPassword(false);
          setErrorMsg(null);
        }, 4000);
      } else {
        throw new Error(lang === 'es' ? 'No encontramos una cuenta con ese número de celular.' : 'No account found with that phone number.');
      }
    } catch (err: any) {
      const errMsg = err.message || (lang === 'es' ? 'Ocurrió un error' : 'An error occurred');
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error de Recuperación' : 'Recovery Error', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        if (!phone) {
          throw new Error(t.phoneRequired);
        }
        if (password.length !== 4) {
          throw new Error(t.passwordMinLength || 'El NIP debe tener exactamente 4 dígitos.');
        }
        if (password !== confirmPassword) {
          throw new Error(t.passwordMismatch || 'Los NIPs no coinciden.');
        }

        toast.db(
          lang === 'es' ? 'Creando Cuenta...' : 'Creating Account...',
          'loading',
          lang === 'es' ? 'Registrando usuario en la base de datos' : 'Registering user in database'
        );

        const cleanPhone = phone.replace(/[^0-9]/g, '');
        const phoneWithCountry = signUpCountryCode === '52' ? cleanPhone : signUpCountryCode + cleanPhone;
        await authenticate('/auth/signup', { phone: phoneWithCountry, pin: password.trim(), fullName: t.defaultClientName || 'Cliente', language: lang });
        toast.db(lang === 'es' ? '¡Registro Exitoso!' : 'Registration Successful!', 'success', lang === 'es' ? 'Cuenta creada y guardada en la base de datos' : 'Account created and saved in the database');
        onLoginSuccess();
      } else {
        // Sign In
        if (password.length !== 4) {
          throw new Error(t.passwordMinLength || 'El NIP debe tener exactamente 4 dígitos.');
        }

        toast.db(
          lang === 'es' ? 'Iniciando Sesión...' : 'Signing In...',
          'loading',
          lang === 'es' ? 'Autenticando credenciales en base de datos' : 'Authenticating credentials in database'
        );

        const cleanPhone = loginIdentifier.trim().replace(/[^0-9]/g, '');
        const phoneWithCountry = loginCountryCode === '52' ? cleanPhone : loginCountryCode + cleanPhone;
        await authenticate('/auth/login', { phone: phoneWithCountry, pin: password.trim() });
        await apiRequest('/me/profile', { method: 'PATCH', body: JSON.stringify({ language_preference: lang }) });

        toast.db(
          lang === 'es' ? '¡Bienvenido!' : 'Welcome!',
          'success',
          lang === 'es' ? 'Sesión iniciada con éxito en la base de datos' : 'Signed in successfully in database'
        );
        onLoginSuccess();
      }
    } catch (err: any) {
      const errMsg = err.message || (lang === 'es' ? 'Ocurrió un error inesperado' : 'An unexpected error occurred');
      setErrorMsg(errMsg);
      toast.db(
        isSignUp 
          ? (lang === 'es' ? 'Error al Registrar' : 'Registration Error') 
          : (lang === 'es' ? 'Error de Inicio de Sesión' : 'Sign In Error'),
        'error',
        errMsg
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    if (isSignUp) {
      return phone.trim() !== '' && password.length === 4 && confirmPassword.length === 4 && password === confirmPassword;
    } else {
      return loginIdentifier.trim() !== '' && password.length === 4;
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header: Store Selector & Logo */}
        <div className="login-header-group">
          <div style={{ display: 'flex', justifyContent: (!isSingleStore && allStores.length > 1) ? 'space-between' : 'flex-end', alignItems: 'center', width: '100%' }}>
            {!isSingleStore && allStores.length > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#F5F5F4',
                border: '1px solid #E7E5E4'
              }}>
                <StoreIcon size={14} style={{ color: 'var(--brand-gold)' }} />
                <select
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    color: '#44403C',
                    cursor: 'pointer',
                    maxWidth: '160px'
                  }}
                >
                  {allStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
              style={{
                background: '#F5F5F4',
                border: '1px solid #E7E5E4',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#78716C',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              🌐 {lang.toUpperCase()}
            </button>
          </div>

          {/* Store Logo */}
          <div className="login-logo">
            {currentStore?.logo_url ? (
              <img 
                src={currentStore.logo_url} 
                alt={storeName} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-gold) 0%, var(--brand-gold-hover) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <StoreIcon size={28} />
              </div>
            )}
          </div>
        </div>

        {/* Body: Tabs & Form */}
        <div className="login-body-group">
          {!isForgotPassword && (
            <div className="auth-tab-group">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg(null);
                }}
                className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
              >
                <LogIn size={16} />
                <span>{t.tabLogin}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMsg(null);
                }}
                className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
              >
                <UserPlus size={16} />
                <span>{t.tabSignUp}</span>
              </button>
            </div>
          )}

          {errorMsg && (
            <div className={errorMsg.includes('exitoso') || errorMsg.includes('successful') || errorMsg.includes('enviado') || errorMsg.includes('sent') ? 'success-banner' : 'error-banner'} style={{ marginBottom: '8px', padding: '8px 12px', fontSize: '0.82rem' }}>
              {errorMsg}
            </div>
          )}

        {isForgotPassword ? (
          /* FORGOT PASSWORD FORM */
          <form onSubmit={handleResetPassword}>
            <div className="auth-mode-header" style={{ marginBottom: '14px' }}>
              <div className="auth-mode-badge login">
                <KeyRound size={13} />
                <span>{t.forgotTitle}</span>
              </div>
              <h2 className="auth-mode-title">{t.forgotTitle}</h2>
              <p className="auth-mode-desc">{t.resetInstructions}</p>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reset-phone">{t.loginIdentifier}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  value={resetCountryCode}
                  onChange={(e) => setResetCountryCode(e.target.value)}
                  style={{
                    background: '#F5F5F4',
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px',
                    padding: '0 8px',
                    fontWeight: 600,
                    color: '#44403C',
                    fontSize: '0.9rem',
                    height: '38px',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {countryCodes.map(cc => (
                    <option key={cc.code} value={cc.code}>{cc.label}</option>
                  ))}
                </select>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                    <Phone size={18} />
                  </span>
                  <input
                    id="reset-phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={15}
                    placeholder={t.phonePlaceholder}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                    className="form-input"
                    style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loading || loginIdentifier.trim() === ''} className="btn-primary" style={{ marginBottom: '16px', backgroundColor: '#25D366', color: 'white', border: 'none' }}>
              {loading ? t.btnProcessing : t.sendResetLink}
            </button>
            <button type="button" onClick={() => setIsForgotPassword(false)} className="btn-secondary" style={{ border: 'none' }}>
              {t.backToLogin}
            </button>
          </form>
        ) : (
          /* LOGIN OR REGISTER FORM */
          <form onSubmit={handleSubmit}>
            {isSignUp ? (
              <>
                {/* Sign Up Phone */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">{t.phone}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={signUpCountryCode}
                      onChange={(e) => setSignUpCountryCode(e.target.value)}
                      style={{
                        background: '#F5F5F4',
                        border: '1px solid #E7E5E4',
                        borderRadius: '8px',
                        padding: '0 8px',
                        fontWeight: 600,
                        color: '#44403C',
                        fontSize: '0.9rem',
                        height: '38px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {countryCodes.map(cc => (
                        <option key={cc.code} value={cc.code}>{cc.label}</option>
                      ))}
                    </select>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                        <Phone size={18} />
                      </span>
                      <input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        placeholder={t.phonePlaceholder}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="form-input"
                        style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>
                  <div className="auth-field-hint">
                    <span>💡 {t.phoneHint}</span>
                  </div>
                </div>

                {/* Sign Up Password (NIP 4 Digits) */}
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label className="form-label" htmlFor="password">{t.signUpPassword}</label>
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
                      placeholder={t.signUpPasswordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      autoComplete="new-password"
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
                  <div className="auth-field-hint">
                    <span>🔒 {t.pinHint}</span>
                  </div>
                </div>

                {/* Confirm Password (NIP 4 Digits) */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" htmlFor="confirmPassword">{t.confirmPassword}</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                      <Lock size={18} />
                    </span>
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      placeholder={t.confirmPasswordPlaceholder}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      autoComplete="new-password"
                      className="form-input"
                      style={{ paddingLeft: '44px', paddingRight: '44px', letterSpacing: confirmPassword ? '3px' : 'normal', fontWeight: 'bold' }}
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Login Identifier (Phone) */}
                <div className="form-group">
                  <label className="form-label" htmlFor="loginIdentifier">{t.loginIdentifier}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      value={loginCountryCode}
                      onChange={(e) => setLoginCountryCode(e.target.value)}
                      style={{
                        background: '#F5F5F4',
                        border: '1px solid #E7E5E4',
                        borderRadius: '8px',
                        padding: '0 8px',
                        fontWeight: 600,
                        color: '#44403C',
                        fontSize: '0.9rem',
                        height: '38px',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {countryCodes.map(cc => (
                        <option key={cc.code} value={cc.code}>{cc.label}</option>
                      ))}
                    </select>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#78716C' }}>
                        <User size={18} />
                      </span>
                      <input
                        id="loginIdentifier"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={15}
                        placeholder={t.loginIdentifierPlaceholder}
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value.replace(/[^0-9]/g, ''))}
                        className="form-input"
                        style={{ paddingLeft: '44px', width: '100%', boxSizing: 'border-box' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Login Password (NIP 4 Digits) */}
                <div className="form-group" style={{ marginBottom: '8px' }}>
                  <label className="form-label" htmlFor="password">{t.password}</label>
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
                      placeholder={t.passwordPlaceholder}
                      value={password}
                      onChange={(e) => setPassword(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                      autoComplete="current-password"
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

                {/* Forgot PIN Link */}
                <div style={{ textAlign: 'right', marginBottom: '16px' }}>
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(true); setErrorMsg(null); }} 
                    style={{ background: 'none', border: 'none', color: 'var(--brand-gold)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              </>
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="btn-primary"
              style={{ fontSize: '0.94rem', padding: '11px 14px' }}
            >
              {loading ? t.btnProcessing : (isSignUp ? t.btnCreate : t.btnEnter)}
            </button>
          </form>
        )}
        </div>

        {/* BOTTOM SWITCHER LINK */}
        {!isForgotPassword && (
          <div className="login-footer-group">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="auth-switch-link-btn"
            >
              <span>{isSignUp ? t.toggleToLogin : t.toggleToSignUp}</span>
            </button>
          </div>
        )}
      </div>

      <footer className="login-page-footer">
        <span>© {new Date().getFullYear()}</span>
        <a 
          href="https://productibot.com" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          productibot.com
        </a>
        <span>• Todos los derechos reservados</span>
      </footer>
    </div>
  );
};
