import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../loyaltyApi';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  UtensilsCrossed, 
  Store, 
  User, 
  LogOut, 
  Trash2, 
  RefreshCw, 
  Phone, 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook, 
  Award, 
  Gift,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Home,
  Mail,
  Edit2
} from 'lucide-react';

interface ClientDashboardProps {
  onLogout: () => void;
}

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  visits: number;
  phone?: string | null;
  language_preference?: string | null;
  birthday_day?: number | null;
  birthday_month?: number | null;
  birthday_year?: number | null;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  visits_cost: number;
  time_limit_days?: number | null;
  image_url?: string | null;
  created_at: string;
  is_active: boolean;
}

interface LoyaltyTransaction {
  id: string;
  visits_change: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string | null;
  tags: ('vegan' | 'vegetarian' | 'organic' | 'healthy')[];
  is_active: boolean;
}

interface StoreType {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  logo_url?: string;
  promo_banner_title?: string;
  promo_banner_subtitle?: string;
  promo_banner_image_url?: string;
  promo_banner_badge?: string;
  promo_banner_active?: boolean;
  primary_color?: string;
  secondary_color?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  google_business_url?: string;
  tripadvisor_url?: string;
}

interface Coupon {
  id: string;
  reward_description: string;
  status: 'active' | 'redeemed';
  created_at: string;
}

const translations = {
  es: {
    loading: 'Cargando...',
    loadingClub: 'Cargando Club de Lealtad...',
    visitsTitleCard: 'Visitas Acumuladas',
    brandClub: 'CLUB DE LEALTAD',
    progressTitle: 'Tu Progreso de Visitas',
    progressSub: 'Llega a 10 visitas para canjear premios especiales',
    btnScan: 'Escanear QR de Visita',
    activeCoupons: 'Tus Cupones Activos',
    readyToRedeem: 'Listo para canjear en tienda',
    rewardsCatalog: 'Catálogo de Premios',
    loadingRewards: 'Cargando catálogo de premios...',
    visitsCostSuffix: 'visitas',
    btnRedeem: 'Canjear',
    ourFlavors: 'Nuestros Sabores',
    ourStores: 'Nuestras Tiendas',
    gelateriaBadge: 'Gelatería & Café',
    btnCall: 'Llamar',
    btnDirections: 'Dirección',
    generalContact: 'Contacto General',
    defaultClientName: 'Cliente',
    btnEditName: 'Corregir Nombre',
    btnEditPhone: 'Corregir Teléfono',
    modalEditPhoneTitle: 'Corregir Teléfono',
    modalEditPhoneDesc: 'Ingresa tu número de teléfono corregido a 10 dígitos.',
    editPhonePlaceholder: 'Número de teléfono a 10 dígitos',
    msgPhoneSuccess: 'Teléfono actualizado con éxito',
    msgPhoneError: 'Error al actualizar tu teléfono',
    language: 'Idioma / Language',
    logout: 'Cerrar Sesión',
    deleteAccount: 'Eliminar Cuenta',
    navCard: 'Tarjeta',
    navFlavors: 'Sabores',
    navStores: 'Tiendas',
    navProfile: 'Perfil',
    modalClientCodeTitle: 'Tu Código de Cliente',
    modalClientCodeDesc: 'Presenta este código QR al mesero para acumular o canjear visitas.',
    btnClose: 'Cerrar',
    modalScanTitle: 'Escanear QR de Visita',
    modalScanDesc: 'Apunta con tu cámara hacia el código QR (diario o único) del mesero para registrar tu visita.',
    btnCancel: 'Cancelar',
    modalCouponDesc: 'Presenta este código al mesero para canjear tu premio.',
    modalCouponTitleCode: 'Código de Cupón Activo',
    modalEditNameTitle: 'Corregir Nombre',
    modalEditNameDesc: 'Ingresa tu nombre completo corregido para tu cuenta de fidelidad.',
    editNamePlaceholder: 'Nombre completo',
    btnSave: 'Guardar',
    modalDeleteTitle: 'Eliminar Cuenta Permanente',
    modalDeleteDesc: '¿Estás completamente seguro? Esta acción es irreversible. Se eliminará tu cuenta y perderás todas tus visitas y cupones de forma definitiva.',
    msgNameSuccess: 'Nombre actualizado con éxito',
    msgNameError: 'Error al actualizar tu nombre',
    msgRedeemSuccess: '¡Premio canjeado con éxito! Has obtenido',
    msgRedeemError: 'Error al canjear el premio',
    msgDeleteError: 'Error al eliminar la cuenta',
    hoursFallbackText1: 'Abierto todos los días de 8:00 AM a 11:00 PM',
    hoursFallbackText2: 'Abierto todos los días de 8:00 AM a 10:00 PM',
    categoryPostres: 'Postres',
    categoryDeslactosados: 'Deslactosados',
    categoryCheesecakes: 'Cheesecakes',
    categoryOtros: 'Otros Postres',
    tagVegan: 'Vegano',
    tagVegetarian: 'Vegetariano',
    tagOrganic: 'Orgánico',
    tagHealthy: 'Saludable',
  },
  en: {
    loading: 'Loading...',
    loadingClub: 'Loading Loyalty Club...',
    visitsTitleCard: 'Accumulated Visits',
    brandClub: 'LOYALTY CLUB',
    progressTitle: 'Your Visit Progress',
    progressSub: 'Reach 10 visits to redeem special rewards',
    btnScan: 'Scan Visit QR',
    activeCoupons: 'Your Active Coupons',
    readyToRedeem: 'Ready to redeem in store',
    rewardsCatalog: 'Rewards Catalog',
    loadingRewards: 'Loading rewards catalog...',
    visitsCostSuffix: 'visits',
    btnRedeem: 'Redeem',
    ourFlavors: 'Our Flavors',
    ourStores: 'Our Stores',
    gelateriaBadge: 'Gelato & Coffee',
    btnCall: 'Call',
    btnDirections: 'Directions',
    generalContact: 'General Contact',
    defaultClientName: 'Client',
    btnEditName: 'Edit Name',
    btnEditPhone: 'Edit Phone',
    modalEditPhoneTitle: 'Edit Phone Number',
    modalEditPhoneDesc: 'Enter your corrected 10-digit phone number.',
    editPhonePlaceholder: '10-digit phone number',
    msgPhoneSuccess: 'Phone number successfully updated',
    msgPhoneError: 'Error updating your phone number',
    language: 'Language / Idioma',
    logout: 'Log Out',
    deleteAccount: 'Delete Account',
    navCard: 'Card',
    navFlavors: 'Flavors',
    navStores: 'Stores',
    navProfile: 'Profile',
    modalClientCodeTitle: 'Your Customer Code',
    modalClientCodeDesc: 'Present this QR code to the server to collect or redeem visits.',
    btnClose: 'Close',
    modalScanTitle: 'Scan Visit QR',
    modalScanDesc: 'Point your camera at the server\'s QR code (daily or unique) to record your visit.',
    btnCancel: 'Cancel',
    modalCouponDesc: 'Present this code to the server to redeem your reward.',
    modalCouponTitleCode: 'Active Coupon Code',
    modalEditNameTitle: 'Edit Name',
    modalEditNameDesc: 'Enter your corrected full name for your loyalty account.',
    editNamePlaceholder: 'Full name',
    btnSave: 'Save',
    modalDeleteTitle: 'Delete Account Permanently',
    modalDeleteDesc: 'Are you absolutely sure? This action is irreversible. Your account will be deleted and you will lose all visits and coupons permanently.',
    msgNameSuccess: 'Name updated successfully',
    msgNameError: 'Error updating your name',
    msgRedeemSuccess: 'Reward successfully redeemed! You have obtained',
    msgRedeemError: 'Error redeeming reward',
    msgDeleteError: 'Error deleting account',
    hoursFallbackText1: 'Open daily from 8:00 AM to 11:00 PM',
    hoursFallbackText2: 'Open daily from 8:00 AM to 10:00 PM',
    categoryPostres: 'Desserts',
    categoryDeslactosados: 'Lactose-Free',
    categoryCheesecakes: 'Cheesecakes',
    categoryOtros: 'Other Desserts',
    tagVegan: 'Vegan',
    tagVegetarian: 'Vegetarian',
    tagOrganic: 'Organic',
    tagHealthy: 'Healthy',
  }
};

const getProductImageSource = (prod: Product): string => {
  if (prod.image_url && (prod.image_url.startsWith('http://') || prod.image_url.startsWith('https://') || prod.image_url.startsWith('/'))) {
    return prod.image_url;
  }

  // Exact Swift-equivalent clean name logic:
  let clean = prod.name.toLowerCase();
  const replacements: Record<string, string> = {
    " ": "_", "ñ": "n", "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u",
    "´": "", "'": ""
  };
  for (const [k, v] of Object.entries(replacements)) {
    clean = clean.split(k).join(v);
  }

  // Determine prefix based on category
  let key = "";
  switch (prod.category) {
    case "gelato":
      key = `gelato_${clean}`;
      break;
    case "cafe":
      key = `cafe_${clean}`;
      break;
    case "panini":
      key = `panini_${clean}`;
      break;
    case "waffles":
      key = `waffles_${clean}`;
      break;
  }

  // List of local assets that are PNGs (the rest are JPGs)
  const pngs = [
    "gelato_chocoavellana",
    "gelato_chocolate",
    "gelato_coco_sogno",
    "gelato_frutos_rojos",
    "gelato_platano",
    "gelato_yogurt_con_fresa",
    "gelato_pistache",
    "cafe_image",
    "gelato_image",
    "panini_image",
    "waffles_image"
  ];

  const ext = pngs.includes(key) ? "png" : "jpg";
  return `/assets/${key}.${ext}`;
};

const calculateChallengeProgress = (reward: Reward, transactions: LoyaltyTransaction[], allCoupons: Coupon[]) => {
  if (!reward.time_limit_days) return null;
  
  const lastClaim = allCoupons.find(c => c.reward_description === reward.title);
  const lastClaimDate = lastClaim ? new Date(lastClaim.created_at).getTime() : 0;
  
  // Base time is either creation of reward or last time it was claimed
  const baseTime = Math.max(new Date(reward.created_at).getTime(), lastClaimDate);
  const now = Date.now();
  const limitMs = reward.time_limit_days * 24 * 60 * 60 * 1000;
  const rollingCutoffTime = now - limitMs;

  // Filter transactions that occurred after the baseTime AND within the rolling time limit window
  const relevantTxs = transactions
    .filter(tx => {
      const txTime = new Date(tx.created_at).getTime();
      return tx.visits_change > 0 && txTime > baseTime && txTime >= rollingCutoffTime;
    });

  // Calculate current visits as sum of visits_change in this rolling window
  const currentVisits = relevantTxs.reduce((sum, tx) => sum + tx.visits_change, 0);

  let daysLeft: number;

  if (relevantTxs.length > 0) {
    // Challenge started: countdown from the oldest transaction in the window
    const oldestTxTime = Math.min(...relevantTxs.map(tx => new Date(tx.created_at).getTime()));
    const expirationTime = oldestTxTime + limitMs;
    daysLeft = Math.max(0, Math.ceil((expirationTime - now) / (1000 * 60 * 60 * 24)));
  } else {
    // Challenge not started yet: countdown from the reward creation date (fixed window)
    const expirationTime = baseTime + limitMs;
    daysLeft = Math.max(0, Math.ceil((expirationTime - now) / (1000 * 60 * 60 * 24)));
  }

  return { 
    currentVisits, 
    daysLeft,
    isActive: relevantTxs.length > 0,
    isExpired: daysLeft === 0,
  };
};


export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'card' | 'rewards' | 'menu' | 'stores' | 'profile' | 'desafios'>('card');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]); // only active (for display)
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]); // all (for lastClaimDate logic)
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Postres');
  const [lang, setLang] = useState<'es' | 'en'>('es');

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / scanner states
  const [showQRModal, setShowQRModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState<Coupon | null>(null);
  const [selectedRewardDetail, setSelectedRewardDetail] = useState<Reward | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameText, setEditNameText] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhoneText, setEditPhoneText] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailText, setEditEmailText] = useState('');
  const [isShowingDeleteConfirm, setIsShowingDeleteConfirm] = useState(false);
  /*
  const [isEditingBirthday, setIsEditingBirthday] = useState(false);
  const [editBirthdayDay, setEditBirthdayDay] = useState<number>(1);
  const [editBirthdayMonth, setEditBirthdayMonth] = useState<number>(1);
  const [editBirthdayYear, setEditBirthdayYear] = useState<number | ''>('');
  */

  // Scanner ref
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'webcam-scanner-element';

  const [celebrationCoupon, setCelebrationCoupon] = useState<string | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimRef = useRef<number | null>(null);

  // Wallet Download Loading Overlay State
  const [walletLoadingType, setWalletLoadingType] = useState<'apple' | 'google' | null>(null);

  const handleDownloadWallet = (type: 'apple' | 'google') => {
    if (!profile) return;
    setWalletLoadingType(type);

    const url = type === 'apple'
      ? `/api/generate-pass?userId=${profile.id}&storeId=${activeStoreId}`
      : `/api/generate-google-pass?userId=${profile.id}&storeId=${activeStoreId}`;

    // 150ms delay allows React to paint the blur loading overlay before browser navigation starts
    setTimeout(() => {
      window.location.href = url;
    }, 150);

    // Auto-dismiss the overlay after 4.5s
    setTimeout(() => {
      setWalletLoadingType(null);
    }, 4500);
  };

  // Dynamic Store Context
  const { currentStore, storeId, setStoreId } = useStore();
  const activeStoreId = storeId || currentStore?.id || '';
  const activeStore = (currentStore || stores.find(s => s.id === activeStoreId) || stores[0]) as StoreType | undefined;

  const t = translations[lang];
  const toast = useToast();

  const categoryDisplayNames: Record<string, string> = {
    'Postres': t.categoryPostres,
    'Deslactosados': t.categoryDeslactosados,
    'Cheesecakes': t.categoryCheesecakes,
    'Otros Postres': t.categoryOtros
  };

  const tagDisplayNames = {
    vegan: t.tagVegan,
    vegetarian: t.tagVegetarian,
    organic: t.tagOrganic,
    healthy: t.tagHealthy
  };

  // Fallbacks
  const fallbackStores: StoreType[] = [
    {
      id: '1',
      name: 'Tulum Centro',
      address: 'Avenida Tulum, Mz 5 Lt 19-4, Tulum Centro, Quintana Roo, CP 77780',
      phone: '+52 984 871 2992',
      hours: t.hoursFallbackText1
    },
    {
      id: '2',
      name: 'Aldea Zamá',
      address: 'Zona Comercial Aldea Zamá, Tulum, Quintana Roo, CP 77760',
      phone: '+52 984 145 1476',
      hours: t.hoursFallbackText2
    }
  ];

  const fallbackProducts: Product[] = [
    {
      id: '1',
      name: 'Fresa (Chico)',
      description: 'Postre de fresa tamaño chico',
      category: 'Postres',
      tags: [],
      image_url: 'https://images.unsplash.com/photo-1563805042-7684c8e9e9cb?auto=format&fit=crop&q=80&w=400',
      is_active: true
    }
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!activeStoreId) return;
      const dashboard = await apiRequest<{ profile: Profile; rewards: Reward[]; coupons: Coupon[]; transactions: LoyaltyTransaction[] }>(`/me/dashboard?storeId=${encodeURIComponent(activeStoreId)}`);
      const prof = dashboard.profile;
      setProfile(prof);

      // Load language preference from DB
      if (prof && prof.language_preference) {
        setLang(prof.language_preference as 'es' | 'en');
      }

      // Check if this is the first access / name is missing/default
      const isDefaultName = !prof || !prof.full_name || 
        prof.full_name.trim() === '' || 
        prof.full_name.toLowerCase() === 'cliente' || 
        prof.full_name.toLowerCase() === 'client';
      const hasPromptedName = localStorage.getItem(`has_prompted_name_${prof.id}`);
      
      if (isDefaultName && !hasPromptedName) {
        setEditNameText('');
        setIsEditingName(true);
        localStorage.setItem(`has_prompted_name_${prof.id}`, 'true');
        // Save the date when we prompted for name/first access
        localStorage.setItem(`first_access_date_${prof.id}`, new Date().toDateString());
      } else {
        // If they already have a name, or already prompted, check for email prompt
        // We prompt for email if the email is missing, or is a placeholder/autogenerated phone email (like ending in @placeholder.com or @phone.com etc.)
        const isMissingOrPlaceholderEmail = !prof || !prof.email || 
          prof.email.trim() === '' || 
          prof.email.includes('placeholder') || 
          prof.email.includes('phone') || 
          prof.email.includes('random');
          
        if (isMissingOrPlaceholderEmail) {
          const firstAccessStr = localStorage.getItem(`first_access_date_${prof.id}`);
          const todayStr = new Date().toDateString();
          
          // Check if it is a different day (subsequent visit/access day)
          if (firstAccessStr && firstAccessStr !== todayStr) {
            const hasPromptedEmail = localStorage.getItem(`has_prompted_email_${prof.id}`);
            if (!hasPromptedEmail) {
              setEditEmailText('');
              setIsEditingEmail(true);
              localStorage.setItem(`has_prompted_email_${prof.id}`, 'true');
            }
          } else if (!firstAccessStr) {
            // If first access date wasn't set, set it today so next time (different day) it prompts
            localStorage.setItem(`first_access_date_${prof.id}`, todayStr);
          }
        }
      }

      setRewards(dashboard.rewards.filter((reward: any) => !reward.is_birthday_reward));

      // 3. Products / Menu items (Local fallback)
      setProducts(fallbackProducts);

      if (currentStore) {
        setStores([currentStore as StoreType]);
      } else {
        setStores(fallbackStores);
      }

      setCoupons(dashboard.coupons.filter((coupon) => coupon.status === 'active'));
      setAllCoupons(dashboard.coupons);
      setTransactions(dashboard.transactions);

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setErrorMsg(err.message || (lang === 'es' ? 'Error al conectar con la base de datos' : 'Database connection error'));
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoreId]);

  // Poll the API so staff redemption and visit changes appear without a client database connection.
  useEffect(() => {
    const refresh = window.setInterval(() => { void fetchData(); }, 30000);
    return () => window.clearInterval(refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStoreId]);

  // Confetti animation
  useEffect(() => {
    if (!celebrationCoupon) return;

    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['var(--brand-gold)', '#F9E4B7', '#2ECC71', '#E74C3C', '#9B59B6', '#3498DB', '#F39C12', '#1ABC9C'];
    const particles: { x: number; y: number; r: number; d: number; color: string; tilt: number; tiltAngle: number; tiltAngleIncrement: number }[] = [];

    for (let i = 0; i < 200; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 10 + 4,
        d: Math.random() * 200 + 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngle: 0,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      });
    }

    let angle = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      angle += 0.01;
      particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncrement;
        p.y += (Math.cos(angle + p.d) + 1.5) * 1.5;
        p.x += Math.sin(angle) * 0.8;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 4);
        ctx.stroke();

        if (p.y > canvas.height) {
          particles[i] = { ...particles[i], x: Math.random() * canvas.width, y: -10 };
        }
      });
      confettiAnimRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Stop after 5 seconds
    const timeout = setTimeout(() => {
      if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    }, 5000);

    return () => {
      clearTimeout(timeout);
      if (confettiAnimRef.current) cancelAnimationFrame(confettiAnimRef.current);
    };
  }, [celebrationCoupon]);

  const handleUpdateLanguage = async (newLang: 'es' | 'en') => {
    setLang(newLang);
    if (!profile) return;
    try {
      toast.db(
        newLang === 'es' ? 'Guardando idioma...' : 'Saving language...',
        'loading',
        newLang === 'es' ? 'Actualizando base de datos' : 'Updating database'
      );
      await apiRequest('/me/profile', { method: 'PATCH', body: JSON.stringify({ language_preference: newLang }) });
      
      const msg = newLang === 'es' ? 'Preferencia de idioma guardada' : 'Language preference saved';
      setSuccessMsg(msg);
      toast.db(
        newLang === 'es' ? 'Idioma Guardado' : 'Language Saved',
        'success',
        newLang === 'es' ? 'Preferencia guardada con éxito en la base de datos' : 'Preference saved successfully in database'
      );
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error updating language preference:', err);
      toast.db(
        newLang === 'es' ? 'Error al guardar idioma' : 'Error saving language',
        'error',
        err.message
      );
    }
  };

  // Webcam QR scanner methods (kept for reference)
  // @ts-ignore
  const _startScanner = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Tiny delay to ensure DOM element is mounted
    setTimeout(async () => {
      try {
        // Reuse existing instance to avoid re-requesting camera permission
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(scannerContainerId);
        }
        const html5QrCode = html5QrCodeRef.current;

        if (!html5QrCode.isScanning) {
          await html5QrCode.start(
            { facingMode: 'environment' },
            {
              fps: 10,
              qrbox: (width, height) => {
                const size = Math.min(width, height) * 0.7;
                return { width: size, height: size };
              }
            },
            async (decodedText) => {
              // Found a QR! Process it
              console.log('QR Code detected:', decodedText);
              stopScanner();
              setShowScannerModal(false);
              await handleProcessScannedToken(decodedText);
            },
            () => {
              // Verbose error, ignore
            }
          );
        }
      } catch (err: any) {
        console.error('Error starting camera scanner:', err);
        const errMsg = lang === 'es' ? 'No se pudo acceder a la cámara. Revisa los permisos.' : 'Could not access camera. Please check permissions.';
        setErrorMsg(errMsg);
        toast.db(lang === 'es' ? 'Error de Cámara' : 'Camera Error', 'error', errMsg);
        setShowScannerModal(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
          // Do NOT clear() or null the ref — keeps camera permission alive for next scan
        }
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleProcessScannedToken = async (tokenId: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    toast.db(
      lang === 'es' ? 'Validando Código QR...' : 'Validating QR Code...',
      'loading',
      lang === 'es' ? 'Consultando registro en la base de datos' : 'Querying database record'
    );

    try {
      // Validate UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(tokenId)) {
        throw new Error(lang === 'es' ? 'El código QR escaneado no tiene un formato válido' : 'The scanned QR code format is not valid');
      }

      const data = await apiRequest<{ success: boolean; visitsAdded: number }>('/visits/claim', { method: 'POST', body: JSON.stringify({ tokenId }) });

      if (data && data.success) {
        const msg = lang === 'es' 
          ? `¡Felicidades! Sumaste ${data.visitsAdded} visitas en la tienda.`
          : `Congratulations! You added ${data.visitsAdded} visits at the store.`;
        setSuccessMsg(msg);
        toast.db(
          lang === 'es' ? '¡Visitas Registradas!' : 'Visits Registered!',
          'success',
          lang === 'es' ? `+${data.visitsAdded} visitas agregadas a tu cuenta en base de datos` : `+${data.visitsAdded} visits added in database`
        );
        // If the scanned QR belongs to another store, switch automatically!
        await fetchData();
      } else {
        const errMsg = lang === 'es' ? 'Error al procesar el código' : 'Error processing code';
        setErrorMsg(errMsg);
        toast.db(lang === 'es' ? 'No se pudo procesar' : 'Could not process', 'error', errMsg);
      }
    } catch (err: any) {
      const errMsg = err.message || (lang === 'es' ? 'Error al registrar la visita' : 'Error registering visit');
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error en Base de Datos' : 'Database Error', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (reward: Reward) => {
    if (!profile) return;

    // Validate eligibility based on reward type
    if (reward.time_limit_days) {
      // Time-limited: use ANY coupon (active or redeemed) as last claim date
      const relatedCoupons = allCoupons.filter(c => c.reward_description === reward.title);
      const lastClaimDate = relatedCoupons.length > 0
        ? new Date(Math.max(...relatedCoupons.map(c => new Date(c.created_at).getTime())))
        : new Date('1970-01-01');
      const cutoffDate = new Date(Date.now() - reward.time_limit_days * 24 * 60 * 60 * 1000);
      const progress = Math.max(0, transactions
        .filter(tx => new Date(tx.created_at) > lastClaimDate && new Date(tx.created_at) >= cutoffDate)
        .reduce((sum, tx) => sum + tx.visits_change, 0));
      if (progress < reward.visits_cost) return;
    } else {
      if (profile.visits < reward.visits_cost) return;
      const alreadyRedeemed = allCoupons.some(c => c.reward_description === reward.title && c.status === 'redeemed');
      if (alreadyRedeemed) {
        toast.db(
          lang === 'es' ? 'Premio ya canjeado' : 'Reward already redeemed',
          'info',
          lang === 'es' ? 'Ya has canjeado esta recompensa anteriormente.' : 'You have already redeemed this reward previously.'
        );
        return;
      }
      const alreadyActive = coupons.some(c => c.reward_description === reward.title && c.status === 'active');
      if (alreadyActive) {
        toast.db(
          lang === 'es' ? 'Cupón Activo' : 'Active Coupon',
          'info',
          lang === 'es' ? 'Ya tienes este cupón listo en Tus Cupones Activos.' : 'You already have this coupon ready in Your Active Coupons.'
        );
        return;
      }
    }

    const confirmMsg = lang === 'es'
      ? `¿Estás seguro de que deseas desbloquear tu premio "${reward.title}"? Tus estrellas acumuladas se mantendrán intactas y se generará tu cupón para canjear en tienda.`
      : `Are you sure you want to unlock your reward "${reward.title}"? Your accumulated stars will remain intact and your coupon will be generated for store redemption.`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    toast.db(
      lang === 'es' ? 'Procesando Canje...' : 'Processing Redemption...',
      'loading',
      lang === 'es' ? `Validando recompensa "${reward.title}" en base de datos` : `Validating reward "${reward.title}" in database`
    );

    try {
      await apiRequest(`/rewards/${reward.id}/redeem`, { method: 'POST', body: JSON.stringify({ storeId: activeStoreId }) });

      const successText = lang === 'es'
        ? `¡Premio canjeado con éxito! Has obtenido "${reward.title}".`
        : `Reward successfully redeemed! You have obtained "${reward.title}".`;
      setSuccessMsg(successText);
      toast.db(
        lang === 'es' ? '¡Premio Desbloqueado!' : 'Reward Unlocked!',
        'success',
        lang === 'es' ? `Cupón "${reward.title}" generado y guardado en base de datos` : `Coupon "${reward.title}" created and saved in database`
      );

      // Refresh all data so allCoupons updates, lastClaimDate recalculates, and progress resets to 0
      await fetchData();
    } catch (err: any) {
      const errMsg = err.message || t.msgRedeemError;
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error al Canjear' : 'Redeem Error', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimPromoBanner = async () => {
    if (!profile || !activeStore) return;
    const promoTitle = activeStore.promo_banner_title || (lang === 'es' ? 'Promo de la Semana' : 'Weekly Promo');

    const confirmMsg = lang === 'es'
      ? `¿Estás seguro de que deseas obtener el cupón para la promoción: "${promoTitle}"?`
      : `Are you sure you want to get the coupon for the promotion: "${promoTitle}"?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    toast.db(
      lang === 'es' ? 'Generando Cupón...' : 'Generating Coupon...',
      'loading',
      lang === 'es' ? 'Registrando cupón en la base de datos' : 'Registering coupon in database'
    );

    try {
      await apiRequest(`/stores/${activeStoreId}/promo-coupons`, { method: 'POST' });

      const successText = lang === 'es'
        ? `¡Cupón de promoción generado con éxito! Puedes encontrarlo en tus cupones activos.`
        : `Promo coupon successfully generated! You can find it in your active coupons.`;
      setSuccessMsg(successText);
      toast.db(
        lang === 'es' ? '¡Promoción Obtenida!' : 'Promo Claimed!',
        'success',
        lang === 'es' ? `Cupón para "${promoTitle}" guardado en base de datos` : `Coupon for "${promoTitle}" saved in database`
      );

      await fetchData();
    } catch (err: any) {
      const errMsg = err.message || 'Error al obtener promoción.';
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error en Promoción' : 'Promo Error', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!profile) return;
    const trimmedName = editNameText.trim();
    if (!trimmedName) return;

    setLoading(true);
    setErrorMsg(null);
    toast.db(
      lang === 'es' ? 'Guardando Nombre...' : 'Saving Name...',
      'loading',
      lang === 'es' ? 'Actualizando perfil en la base de datos' : 'Updating profile in database'
    );

    try {
      await apiRequest('/me/profile', { method: 'PATCH', body: JSON.stringify({ full_name: trimmedName }) });

      setSuccessMsg(t.msgNameSuccess);
      toast.db(
        lang === 'es' ? 'Nombre Actualizado' : 'Name Updated',
        'success',
        lang === 'es' ? 'Nombre guardado con éxito en la base de datos' : 'Name saved successfully in database'
      );
      setIsEditingName(false);
      await fetchData();
    } catch (err: any) {
      const errMsg = err.message || t.msgNameError;
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error al Guardar Nombre' : 'Error Saving Name', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePhone = async () => {
    if (!profile) return;
    const trimmedPhone = editPhoneText.replace(/[^0-9]/g, '');
    if (!trimmedPhone || trimmedPhone.length < 10) return;

    setLoading(true);
    setErrorMsg(null);
    toast.db(
      lang === 'es' ? 'Guardando Teléfono...' : 'Saving Phone...',
      'loading',
      lang === 'es' ? 'Actualizando número en la base de datos' : 'Updating phone in database'
    );

    try {
      await apiRequest('/me/profile', { method: 'PATCH', body: JSON.stringify({ phone: trimmedPhone }) });

      setSuccessMsg(t.msgPhoneSuccess);
      toast.db(
        lang === 'es' ? 'Teléfono Actualizado' : 'Phone Updated',
        'success',
        lang === 'es' ? 'Teléfono guardado con éxito en la base de datos' : 'Phone saved successfully in database'
      );
      setIsEditingPhone(false);
      await fetchData();
    } catch (err: any) {
      const errMsg = err.message || t.msgPhoneError;
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error al Guardar Teléfono' : 'Error Saving Phone', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!profile) return;
    const trimmedEmail = editEmailText.trim();
    if (!trimmedEmail) return;

    setLoading(true);
    setErrorMsg(null);
    toast.db(
      lang === 'es' ? 'Guardando Correo...' : 'Saving Email...',
      'loading',
      lang === 'es' ? 'Actualizando correo en la base de datos' : 'Updating email in database'
    );

    try {
      await apiRequest('/me/profile', { method: 'PATCH', body: JSON.stringify({ email: trimmedEmail }) });

      setSuccessMsg('Perfil actualizado');
      toast.db(
        lang === 'es' ? 'Correo Actualizado' : 'Email Updated',
        'success',
        lang === 'es' ? 'Correo electrónico guardado en la base de datos' : 'Email saved in database'
      );
      setIsEditingEmail(false);
      await fetchData();
    } catch (err: any) {
      const errMsg = err.message || 'Error al actualizar';
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error al Guardar Correo' : 'Error Saving Email', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  /*
  const handleUpdateBirthday = async () => {
    if (!profile) return;

    setLoading(true);
    setErrorMsg(null);
    toast.db(
      lang === 'es' ? 'Guardando Cumpleaños...' : 'Saving Birthday...',
      'loading',
      lang === 'es' ? 'Actualizando fecha en la base de datos' : 'Updating date in database'
    );

    try {
      const yearVal = editBirthdayYear === '' ? null : Number(editBirthdayYear);
      const { error } = await supabase
        .from('profiles')
        .update({
          birthday_day: Number(editBirthdayDay),
          birthday_month: Number(editBirthdayMonth),
          birthday_year: yearVal
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSuccessMsg('Fecha de cumpleaños actualizada con éxito.');
      toast.db(
        lang === 'es' ? 'Cumpleaños Guardado' : 'Birthday Saved',
        'success',
        lang === 'es' ? 'Fecha de cumpleaños guardada en la base de datos' : 'Birthday date saved in database'
      );
      setIsEditingBirthday(false);
      await fetchData();
    } catch (err: any) {
      const errMsg = err.message || 'Error al actualizar fecha de cumpleaños.';
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error en Cumpleaños' : 'Birthday Error', 'error', errMsg);
    } finally {
      setLoading(false);
    }
  };
  */

  const handleDeleteAccount = async () => {
    setLoading(true);
    setErrorMsg(null);
    toast.db(
      lang === 'es' ? 'Eliminando Cuenta...' : 'Deleting Account...',
      'loading',
      lang === 'es' ? 'Procesando baja en la base de datos' : 'Processing account deletion in database'
    );

    try {
      await apiRequest('/me', { method: 'DELETE' });
      
      toast.db(
        lang === 'es' ? 'Cuenta Eliminada' : 'Account Deleted',
        'info',
        lang === 'es' ? 'Tu cuenta ha sido eliminada de la base de datos' : 'Your account was deleted from database'
      );
      onLogout();
    } catch (err: any) {
      const errMsg = err.message || t.msgDeleteError;
      setErrorMsg(errMsg);
      toast.db(lang === 'es' ? 'Error al Eliminar' : 'Delete Error', 'error', errMsg);
      setLoading(false);
      setIsShowingDeleteConfirm(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="login-container">
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="spin" style={{ color: 'var(--brand-gold)' }} size={48} />
          <p style={{ marginTop: '16px', color: 'var(--brand-gold)', fontWeight: 600 }}>{t.loadingClub}</p>
        </div>
      </div>
    );
  }

  const lifetimeStars = profile?.visits || 0;

  return (
    <div className="app-container">
      {/* Main Content Area */}
      <main className={`client-content ${activeTab === 'card' ? 'dashboard-view-mode' : ''}`}>
        {errorMsg && (
          <div className="error-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="success-banner" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ==================== TAB 1: HOME / INICIO (100VH NO-SCROLL LAYOUT) ==================== */}
        {activeTab === 'card' && profile && (() => {
          const isPromoActive = activeStore?.promo_banner_active !== false && !!(activeStore?.promo_banner_title || activeStore?.promo_banner_image_url);

          return (
            <div className="dashboard-100vh-layout" style={{ gap: '6px' }}>
              {/* 1. Header / Saludo al Cliente con Logo y Redes Sociales */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', gap: '8px', flexShrink: 0 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0F172A', fontFamily: 'var(--font-sans)', lineHeight: '1.15' }}>
                    {(() => {
                      const hrs = new Date().getHours();
                      if (hrs < 12) return lang === 'es' ? 'Buenos días,' : 'Good morning,';
                      if (hrs < 19) return lang === 'es' ? 'Buenas tardes,' : 'Good afternoon,';
                      return lang === 'es' ? 'Buenas noches,' : 'Good evening,';
                    })()} <br/>
                    <span style={{ color: '#0F172A' }}>{profile.full_name?.split(' ')[0] || 'Cliente'}</span>
                  </div>
                </div>

                {/* Redes Sociales e Icono de Tienda */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {activeStore?.facebook_url && (
                    <a 
                      href={activeStore.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#1877F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(24,119,242,0.25)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Facebook"
                    >
                      <span style={{ fontWeight: 'bold', fontSize: '0.9rem', fontFamily: 'system-ui' }}>f</span>
                    </a>
                  )}
                  {activeStore?.instagram_url && (
                    <a 
                      href={activeStore.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(220,39,67,0.25)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Instagram"
                    >
                      <Instagram size={14} />
                    </a>
                  )}
                  {activeStore?.tiktok_url && (
                    <a 
                      href={activeStore.tiktok_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="TikTok"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.36a6.34 6.34 0 0 0-.85-.06A6.33 6.33 0 0 0 3 15.63 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.34V8.47a8.28 8.28 0 0 0 4.91 1.62V6.69z"/>
                      </svg>
                    </a>
                  )}
                  {activeStore?.google_business_url && (
                    <a 
                      href={activeStore.google_business_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(66,133,244,0.18)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="Google Business"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                    </a>
                  )}
                  {activeStore?.tripadvisor_url && (
                    <a 
                      href={activeStore.tripadvisor_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(0,175,135,0.18)',
                        transition: 'transform 0.15s ease'
                      }}
                      title="TripAdvisor"
                    >
                      <svg width="17" height="11" viewBox="50 110 412 260">
                        <path fill="#FCC419" stroke="#000a12" strokeWidth="16" d="M93 202a195 151 0 0 1 326 0v56H93" />
                        <g transform="translate(256, 257)">
                          <g fill="#000a12">
                            <path d="M-115 -97 h-77 c0 2 22 36 19 48 M0 92 -31 45 V0 H2" />
                            <circle cx="-97" cy="0" r="97" />
                            <circle cx="-97" cy="0" r="78" fill="#FFFFFF" />
                            <circle cx="-97" cy="0" r="50" />
                            <circle cx="-97" cy="0" r="33" fill="#FFFFFF" />
                          </g>
                          <g fill="#000a12" transform="scale(-1, 1)">
                            <path d="M-115 -97 h-77 c0 2 22 36 19 48 M0 92 -31 45 V0 H2" />
                            <circle cx="-97" cy="0" r="97" />
                            <circle cx="-97" cy="0" r="78" fill="#FFFFFF" />
                            <circle cx="-97" cy="0" r="50" />
                            <circle cx="-97" cy="0" r="33" fill="#FFFFFF" />
                          </g>
                          <circle cx="-97" cy="0" r="17" fill="#E53935" />
                          <circle cx="97" cy="0" r="17" fill="#00AF87" />
                        </g>
                      </svg>
                    </a>
                  )}
                  {activeStore?.logo_url ? (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
                      border: '1.5px solid #FFFFFF',
                      outline: '1.5px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0,
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      <img 
                        src={activeStore.logo_url} 
                        alt={activeStore.name || "Logo"} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--brand-gold) 0%, var(--brand-gold-hover) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                    }}>
                      {(activeStore?.name || 'P').charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Tarjeta de Estrellas y Progreso con Timeline Slider hasta 200 */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                padding: '8px 12px 10px',
                boxShadow: '0 4px 15px -2px rgba(0, 0, 0, 0.04)',
                border: '1px solid #F1F5F9',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0F172A', lineHeight: 1 }}>{lifetimeStars}</span>
                    <span style={{ fontSize: '1.15rem', color: 'var(--brand-gold)', lineHeight: 1 }}>★</span>
                    <span style={{ color: '#64748B', fontSize: '0.76rem', fontWeight: '600', marginLeft: '3px' }}>
                      {lang === 'es' ? 'Estrellas' : 'Stars'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setActiveTab('rewards')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      background: '#FAF8F5',
                      border: '1px solid var(--brand-gold-border)',
                      borderRadius: '12px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      color: '#0F172A',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'es' ? 'Recompensas' : 'Rewards'}
                    <span style={{ color: 'var(--brand-gold)' }}>★</span>
                  </button>
                </div>

                {/* Timeline Slider hasta 200 */}
                <div style={{ position: 'relative', padding: '6px 4px 14px', marginTop: '0' }}>
                  {(() => {
                    const getVisualProgressPct = (val: number) => {
                      if (val >= 200) return 100;
                      if (val <= 0) return 0;
                      const stops = [
                        { v: 0, p: 0 },
                        { v: 25, p: 20 },
                        { v: 50, p: 40 },
                        { v: 100, p: 60 },
                        { v: 150, p: 80 },
                        { v: 200, p: 100 }
                      ];
                      for (let i = 0; i < stops.length - 1; i++) {
                        if (val >= stops[i].v && val <= stops[i+1].v) {
                          const rangeV = stops[i+1].v - stops[i].v;
                          const rangeP = stops[i+1].p - stops[i].p;
                          return stops[i].p + ((val - stops[i].v) / rangeV) * rangeP;
                        }
                      }
                      return 100;
                    };

                    const currentPct = getVisualProgressPct(lifetimeStars);

                    return (
                      <>
                        {/* Background line */}
                        <div style={{ height: '4px', background: '#E2E8F0', borderRadius: '2px', position: 'relative' }}>
                          <div style={{
                            height: '100%',
                            background: 'var(--brand-gold)',
                            borderRadius: '2px',
                            width: `${currentPct}%`
                          }} />
                        </div>

                        {/* Milestones */}
                        {[25, 50, 100, 150, 200].map(m => {
                          const positionPct = getVisualProgressPct(m);
                          const isActive = lifetimeStars >= m;
                          return (
                            <div 
                              key={m} 
                              style={{ 
                                position: 'absolute', 
                                left: `${positionPct}%`, 
                                top: '8px', 
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}
                            >
                              <div style={{ 
                                width: '7px', 
                                height: '7px', 
                                borderRadius: '50%', 
                                background: isActive ? 'var(--brand-gold)' : '#FFFFFF', 
                                border: `2px solid ${isActive ? 'var(--brand-gold)' : '#CBD5E1'}`,
                                marginBottom: '2px',
                                zIndex: 2
                              }} />
                              <span style={{ fontSize: '0.62rem', fontWeight: '700', color: isActive ? 'var(--brand-gold)' : '#94A3B8' }}>{m}</span>
                            </div>
                          );
                        })}

                        {/* Current progress pointer */}
                        <div style={{
                          position: 'absolute',
                          left: `${currentPct}%`,
                          top: '-1px',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          zIndex: 3
                        }}>
                          <div style={{
                            width: '9px',
                            height: '9px',
                            background: 'var(--brand-gold)',
                            borderRadius: '50% 50% 50% 0',
                            transform: 'rotate(-45deg)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }} />
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* 3. Tarjeta de Código QR del Usuario (GRANDE Y CENTRADO) */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '18px',
                padding: '6px 10px',
                boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.05)',
                border: '1px solid #F1F5F9',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minHeight: '120px'
              }}>
                <div 
                  onClick={() => setShowQRModal(true)}
                  style={{ 
                    background: '#FAF8F5', 
                    padding: '6px', 
                    borderRadius: '14px', 
                    border: '1.5px solid var(--brand-gold-border)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    boxShadow: '0 3px 10px var(--brand-gold-light)'
                  }}
                >
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(profile.id)}`}
                    alt="Código QR del Cliente"
                    style={{ 
                      width: 'clamp(115px, 18.5vh, 160px)', 
                      height: 'clamp(115px, 18.5vh, 160px)', 
                      maxWidth: '100%',
                      aspectRatio: '1 / 1',
                      display: 'block', 
                      borderRadius: '8px', 
                      objectFit: 'contain' 
                    }}
                  />
                </div>

                <div style={{
                  marginTop: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  padding: '2px 7px',
                  borderRadius: '7px',
                  fontSize: '0.68rem',
                  color: '#64748B',
                  fontWeight: '600'
                }}>
                  <span>ID:</span>
                  <span style={{ fontFamily: 'monospace', color: '#0F172A', fontWeight: '700' }}>
                    {profile.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* 4. Banner Promo de la Semana (PROPORCIONAL) */}
              {isPromoActive && (
                <div className="promo-banner-card" style={{
                  position: 'relative',
                  height: 'clamp(90px, 13vh, 125px)',
                  minHeight: '85px',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.35) 100%), url('${activeStore?.promo_banner_image_url || 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=600'}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  color: 'white',
                  padding: '8px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 6px 18px rgba(0, 0, 0, 0.12)',
                  border: '1.5px solid rgba(255, 255, 255, 0.2)',
                  flexShrink: 0
                }}>
                  {/* Fila Superior: Badge + Botón Obtener */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <span style={{
                      background: 'rgba(255, 255, 255, 0.28)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.45)',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: '800',
                      padding: '3px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      {activeStore?.promo_banner_badge || (lang === 'es' ? 'PROMO DE LA SEMANA' : 'WEEKLY PROMO')}
                    </span>

                    <button 
                      onClick={() => setActiveTab('rewards')}
                      style={{
                        background: '#FFFFFF',
                        color: '#0F172A',
                        border: 'none',
                        borderRadius: '14px',
                        padding: '5px 14px',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'transform 0.15s ease'
                      }}
                    >
                      <span>{lang === 'es' ? 'Obtener' : 'Get'}</span>
                      <span style={{ fontSize: '0.8rem' }}>→</span>
                    </button>
                  </div>

                  {/* Fila Inferior: Título y Subtítulo Grandes */}
                  <div>
                    <h4 style={{ 
                      fontSize: '1.05rem', 
                      fontWeight: '900', 
                      margin: 0, 
                      color: '#FFFFFF', 
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      lineHeight: '1.15',
                      letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeStore?.promo_banner_title || (lang === 'es' ? 'Arroz con Leche Gratis' : 'Free Rice Pudding')}
                    </h4>
                    <p style={{ 
                      fontSize: '0.76rem', 
                      color: 'rgba(255, 255, 255, 0.95)', 
                      margin: '2px 0 0', 
                      fontWeight: '500',
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeStore?.promo_banner_subtitle || (lang === 'es' ? 'En la compra de cualquier platillo fuerte' : 'With purchase of any main dish')}
                    </p>
                  </div>
                </div>
              )}

              {/* 5. Wallet Integration Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, padding: '0 2px' }}>
                {/* Apple Wallet Button */}
                <button 
                  type="button"
                  onClick={() => handleDownloadWallet('apple')}
                  disabled={walletLoadingType !== null}
                  style={{ 
                    background: '#000', 
                    color: '#fff', 
                    border: '1px solid #222', 
                    borderRadius: '12px', 
                    padding: '4px 8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '600', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    cursor: walletLoadingType !== null ? 'not-allowed' : 'pointer', 
                    flex: 1, 
                    height: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    opacity: walletLoadingType !== null ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.68-1.11 1.77-1.01 2.82 1.07.08 2.17-.63 2.79-1.38z"/>
                  </svg>
                  {walletLoadingType === 'apple' ? (lang === 'es' ? 'Descargando...' : 'Downloading...') : 'Apple Wallet'}
                </button>

                {/* Google Wallet Button */}
                <button 
                  type="button"
                  onClick={() => handleDownloadWallet('google')}
                  disabled={walletLoadingType !== null}
                  style={{ 
                    background: '#000', 
                    color: '#fff', 
                    border: '1px solid #222', 
                    borderRadius: '12px', 
                    padding: '4px 8px', 
                    fontSize: '0.7rem', 
                    fontWeight: '600', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '6px', 
                    cursor: walletLoadingType !== null ? 'not-allowed' : 'pointer', 
                    flex: 1, 
                    height: '30px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                    opacity: walletLoadingType !== null ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  {walletLoadingType === 'google' ? (lang === 'es' ? 'Conectando...' : 'Connecting...') : 'Google Wallet'}
                </button>
              </div>
            </div>
          );
        })()}

        {/* ==================== NUEVO TAB: DESAFÍOS ==================== */}
        {activeTab === 'desafios' && profile && (
          <div style={{ padding: '0 20px' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              {lang === 'es' ? 'Mis Desafíos' : 'My Challenges'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '24px' }}>
              {lang === 'es' ? '⏱️ Acumula las visitas necesarias dentro del plazo. Tus estrellas no se ven afectadas.' : '⏱️ Accumulate the required visits within the time limit. Your stars are not affected.'}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {(() => {
                const timeLimitedRewards = rewards.filter(r => r.is_active && r.time_limit_days && r.time_limit_days > 0);
                if (timeLimitedRewards.length === 0) {
                  return (
                    <p style={{ color: '#64748B', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', width: '100%', padding: '20px' }}>
                      {lang === 'es' ? 'No hay desafíos activos en este momento.' : 'No active challenges at the moment.'}
                    </p>
                  );
                }
                
                return timeLimitedRewards.map(rew => {
                  const prog = calculateChallengeProgress(rew, transactions, allCoupons);
                  if (!prog) return null;
                  
                  const maxVisits = rew.visits_cost;
                  const curVisits = Math.min(prog.currentVisits, maxVisits);
                  const percent = Math.min(100, Math.round((curVisits / maxVisits) * 100));
                  
                  const canRedeem = curVisits >= maxVisits;
                  const hasClaimed = allCoupons.some(c => c.reward_description === rew.title && c.status === 'active');
                  if (hasClaimed) return null; // Already claimed, waiting to be scanned

                  return (
                    <div 
                      key={rew.id} 
                      onClick={() => {
                        if (canRedeem) {
                          handleRedeemReward(rew);
                        }
                      }}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        border: '1px solid #F1F5F9',
                        cursor: canRedeem ? 'pointer' : 'default',
                        position: 'relative'
                    }}>
                      {canRedeem && (
                        <div style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'var(--brand-action)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          zIndex: 10
                        }}>
                          ¡COMPLETADO!
                        </div>
                      )}
                      {/* Top Image */}
                      <div style={{
                        height: '160px',
                        width: '100%',
                        backgroundImage: `url('${rew.image_url || activeStore?.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=600'}')`,
                        backgroundSize: rew.image_url ? 'cover' : (activeStore?.logo_url ? 'contain' : 'cover'),
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        backgroundColor: '#F8FAFC'
                      }} />
                      
                      <div style={{ padding: '20px' }}>
                        {/* Type badge */}
                        <span style={{
                          display: 'inline-block',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: '#a855f7',
                          backgroundColor: 'rgba(168,85,247,0.1)',
                          border: '1px solid rgba(168,85,247,0.25)',
                          borderRadius: '5px',
                          padding: '2px 7px',
                          marginBottom: '6px',
                          letterSpacing: '0.03em'
                        }}>
                          ⏱️ {lang === 'es' ? 'DESAFÍO' : 'CHALLENGE'}
                        </span>
                        <h4 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#0F172A', margin: '0 0 4px' }}>
                          {rew.title}
                        </h4>

                        {rew.description && (
                          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 12px', lineHeight: 1.4 }}>
                            {rew.description}
                          </p>
                        )}

                        <div style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '16px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
                              {curVisits} / {maxVisits} ★
                            </span>
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              color: prog.isExpired ? '#EF4444' : prog.daysLeft <= 3 ? '#F59E0B' : '#6366F1',
                              background: prog.isExpired ? 'rgba(239,68,68,0.1)' : prog.daysLeft <= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)',
                              border: `1px solid ${prog.isExpired ? 'rgba(239,68,68,0.25)' : prog.daysLeft <= 3 ? 'rgba(245,158,11,0.25)' : 'rgba(99,102,241,0.25)'}`,
                              borderRadius: '8px',
                              padding: '3px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}>
                              {prog.isExpired
                                ? '❌ Expirado'
                                : prog.daysLeft <= 3
                                ? `⚠️ ${prog.daysLeft}d restante${prog.daysLeft !== 1 ? 's' : ''}`
                                : `⏱️ ${prog.daysLeft}d restantes`}
                            </span>
                          </div>
                          <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--brand-action)', width: `${percent}%`, borderRadius: '4px' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* ==================== TAB: REWARDS ==================== */}
        {activeTab === 'rewards' && profile && (
          <div style={{ padding: '8px 20px 0' }}>
            {/* Tarjeta de Promoción de la Semana (Banner independiente de estrellas) */}
            {(() => {
              const promoTitle = activeStore?.promo_banner_title;
              if (!promoTitle || activeStore?.promo_banner_active === false) return null;

              // Check if coupon already generated for this exact promo
              const hasClaimed = coupons.some(c => c.reward_description === `Promo: ${promoTitle}`);

              return (
                <div 
                  style={{
                    backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)), url(${activeStore?.promo_banner_image_url || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '24px',
                    padding: '24px',
                    color: 'white',
                    marginBottom: '32px',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <span style={{
                    background: 'var(--brand-gold)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '5px 12px',
                    borderRadius: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {activeStore?.promo_banner_badge || (lang === 'es' ? 'PROMO DE LA SEMANA' : 'WEEKLY PROMO')}
                  </span>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '12px', marginBottom: '6px', fontFamily: 'var(--font-sans)' }}>
                    {promoTitle}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#CBD5E1', fontWeight: '400', marginBottom: '20px', lineHeight: 1.4 }}>
                    {activeStore?.promo_banner_subtitle || (lang === 'es' ? 'Presenta el código QR para validar la promoción en caja.' : 'Present the QR code to validate the promotion at the counter.')}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    {hasClaimed ? (
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--brand-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        {lang === 'es' ? '¡Cupón Listo en Activos! 🎯' : 'Coupon Ready in Actives! 🎯'}
                      </span>
                    ) : (
                      <button 
                        onClick={handleClaimPromoBanner}
                        style={{
                          background: '#FFFFFF',
                          color: '#0F172A',
                          border: 'none',
                          borderRadius: '20px',
                          padding: '10px 20px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(255,255,255,0.15)'
                        }}
                      >
                        {lang === 'es' ? 'Obtener Cupón QR' : 'Get QR Coupon'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Collapsible active coupons section */}
            {coupons.filter(c => c.status === 'active').length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 className="section-title" style={{ marginTop: 0 }}>
                  <Gift size={20} style={{ color: 'var(--brand-gold)' }} />
                  {t.activeCoupons}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {coupons.filter(c => c.status === 'active').map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => setShowCouponModal(c)}
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px solid var(--brand-gold-border)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#1C1917', fontSize: '1rem' }}>{c.reward_description}</div>
                        <div style={{ fontSize: '0.75rem', color: '#2ECC71', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                          <CheckCircle2 size={14} />
                          {t.readyToRedeem}
                        </div>
                      </div>
                      <ChevronRight size={20} style={{ color: 'var(--brand-gold)' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rewards Catalog */}
            <h3 className="section-title" style={{ marginTop: 0 }}>
              <Award size={20} style={{ color: 'var(--brand-gold)' }} />
              {t.rewardsCatalog}
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#78716C', marginBottom: '12px', marginTop: '-8px', paddingLeft: '2px' }}>
              {lang === 'es' ? '⭐ Al llegar a las visitas requeridas desbloqueas el premio. Tus estrellas no se descuentan.' : '⭐ Reach the required visits to unlock the reward. Your stars are not deducted.'}
            </p>
            <div className="rewards-grid">
              {(() => {
                const catalogRewards = rewards.filter(r => !r.time_limit_days);

                if (catalogRewards.length === 0) {
                  if (loading) {
                    return (
                      <>
                        {[1, 2, 3, 4].map(idx => (
                          <div key={idx} className="reward-card" style={{ pointerEvents: 'none', border: '1px solid #F1F5F9' }}>
                            <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '16px 16px 0 0' }} />
                            <div className="reward-info" style={{ padding: '12px' }}>
                              <div className="skeleton" style={{ width: '40%', height: '14px', marginBottom: '8px' }} />
                              <div className="skeleton" style={{ width: '70%', height: '18px', marginBottom: '6px' }} />
                              <div className="skeleton" style={{ width: '90%', height: '12px' }} />
                            </div>
                          </div>
                        ))}
                      </>
                    );
                  }
                  return (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '30px 20px', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                      <p style={{ color: '#64748B', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>
                        {t.loadingRewards}
                      </p>
                    </div>
                  );
                }

                return catalogRewards.map(rew => {
                  let activeCoupon = coupons.find(c => c.reward_description === rew.title && c.status === 'active');
                  let hasRedeemed = allCoupons.some(c => c.reward_description === rew.title && c.status === 'redeemed');
                  let hasClaimed = !!activeCoupon;
                  let isEligible = profile.visits >= rew.visits_cost;

                  return (
                    <div 
                      key={rew.id} 
                      className="reward-card" 
                      onClick={() => {
                        setSelectedRewardDetail(rew);
                      }}
                    >
                      {/* Image container with floating star badge */}
                      <div className="reward-image-box">
                        {/* Floating Stars Pill */}
                        <div className="reward-star-pill">
                          <span style={{ color: 'var(--brand-gold)', fontSize: '0.8rem' }}>★</span>
                          <span>{rew.visits_cost}</span>
                        </div>

                        {rew.image_url ? (
                          <img 
                            src={rew.image_url} 
                            alt={rew.title} 
                          />
                        ) : activeStore?.logo_url ? (
                          <div style={{ width: '100%', height: '100%', background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{
                              width: '74px',
                              height: '74px',
                              borderRadius: '50%',
                              backgroundColor: '#FFFFFF',
                              boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                              border: '2.5px solid #FFFFFF',
                              outline: '1.5px solid #E2E8F0',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <img 
                                src={activeStore.logo_url} 
                                alt={rew.title} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-gold)' }}>
                            <Gift size={28} />
                          </div>
                        )}

                        {hasClaimed ? (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(3px)',
                            WebkitBackdropFilter: 'blur(3px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            gap: '4px',
                            zIndex: 3
                          }}>
                            <CheckCircle2 size={16} style={{ color: '#2ECC71' }} />
                            <span>{lang === 'es' ? '¡Cupón Activo!' : 'Active!'}</span>
                          </div>
                        ) : hasRedeemed ? (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(241, 245, 249, 0.85)',
                            backdropFilter: 'blur(2px)',
                            WebkitBackdropFilter: 'blur(2px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '700',
                            color: '#64748B',
                            fontSize: '0.78rem',
                            zIndex: 3
                          }}>
                            <span>{lang === 'es' ? 'Canjeado ✓' : 'Redeemed ✓'}</span>
                          </div>
                        ) : null}
                      </div>

                      {/* Info & Uniform Footer */}
                      <div className="reward-info">
                        <div>
                          <h4 className="reward-name">
                            {rew.title}
                          </h4>
                          
                          <p className="reward-desc">
                            {rew.description || (lang === 'es' ? 'Presenta este cupón en tu próxima visita.' : 'Present this coupon on your next visit.')}
                          </p>
                        </div>

                        {/* Status Footer */}
                        <div className="reward-status-footer">
                          {hasClaimed ? (
                            <div style={{
                              background: 'rgba(46, 204, 113, 0.1)',
                              color: '#16A34A',
                              border: '1px solid rgba(46, 204, 113, 0.25)',
                              borderRadius: '10px',
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px'
                            }}>
                              <CheckCircle2 size={13} />
                              <span>{lang === 'es' ? 'Listo en caja' : 'Ready at register'}</span>
                            </div>
                          ) : hasRedeemed ? (
                            <div style={{
                              background: '#F1F5F9',
                              color: '#94A3B8',
                              borderRadius: '10px',
                              padding: '5px 8px',
                              fontSize: '0.72rem',
                              fontWeight: '700',
                              textAlign: 'center'
                            }}>
                              {lang === 'es' ? 'Canjeado' : 'Redeemed'}
                            </div>
                          ) : isEligible ? (
                            <div style={{
                              background: 'linear-gradient(135deg, var(--brand-gold) 0%, var(--brand-gold-hover) 100%)',
                              color: '#FFFFFF',
                              borderRadius: '10px',
                              padding: '6px 8px',
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px var(--brand-gold-light)'
                            }}>
                              <span>🎁</span>
                              <span>{lang === 'es' ? 'Desbloqueado' : 'Unlocked'}</span>
                            </div>
                          ) : (
                            <div style={{
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#64748B',
                              borderRadius: '10px',
                              padding: '5px 8px',
                              fontSize: '0.7rem',
                              fontWeight: '600',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
                              <span>{lang === 'es' ? 'Faltan' : 'Need'}</span>
                              <span style={{ fontWeight: '700', color: '#0F172A' }}>
                                {Math.max(0, rew.visits_cost - profile.visits)} ★
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
            <div style={{ height: '80px' }}></div>
          </div>
        )}

        {/* ==================== TAB 2: PRODUCT MENU ==================== */}
        {activeTab === 'menu' && (
          <div>
            <h3 className="section-title" style={{ marginTop: 0 }}>
              <UtensilsCrossed size={20} style={{ color: 'var(--brand-gold)' }} />
              {t.ourFlavors}
            </h3>

            {/* Category selection */}
            <div className="category-bar">
              {(['Postres', 'Deslactosados', 'Cheesecakes', 'Otros Postres'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {categoryDisplayNames[cat]}
                </button>
              ))}
            </div>

            {/* Product list */}
            <div className="products-grid">
              {products
                .filter(p => p.category === selectedCategory && p.is_active)
                .map(prod => (
                  <div key={prod.id} className="product-card">
                    <img 
                      src={getProductImageSource(prod)} 
                      alt={prod.name} 
                      className="product-img" 
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `/assets/${prod.category}_image.png`;
                      }}
                    />
                    <h4 className="product-name">{prod.name}</h4>
                    
                    <div className="product-tags">
                      {prod.tags && prod.tags.map(tag => (
                        <span key={tag} className={`tag-badge tag-${tag}`}>
                          {tagDisplayNames[tag]}
                        </span>
                      ))}
                    </div>

                    <p className="product-desc">{prod.description}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: STORES LIST ==================== */}
        {activeTab === 'stores' && (
          <div>
            <h3 className="section-title" style={{ marginTop: 0 }}>
              <Store size={20} style={{ color: 'var(--brand-gold)' }} />
              {t.ourStores}
            </h3>

            {stores.map(st => {
              const isSelected = st.id === activeStoreId;
              return (
                <div key={st.id} className="store-card" style={isSelected ? { borderColor: 'var(--brand-gold)', borderWidth: 2, background: 'linear-gradient(180deg, var(--brand-gold-light) 0%, #FFFFFF 100%)' } : {}}>
                  <div className="store-header">
                    <h4 className="store-name">{st.name}</h4>
                    {isSelected ? (
                      <span style={{ background: '#10B981', color: '#FFFFFF', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {lang === 'es' ? 'Sucursal Activa ✓' : 'Active Store ✓'}
                      </span>
                    ) : (
                      <span className="store-badge">{t.gelateriaBadge}</span>
                    )}
                  </div>

                  <div className="store-details">
                    <div className="store-detail-item">
                      <MapPin size={16} />
                      <span>{st.address}</span>
                    </div>
                    {st.phone && (
                      <div className="store-detail-item">
                        <Phone size={16} />
                        <span>{st.phone}</span>
                      </div>
                    )}
                    {st.hours && (
                      <div className="store-detail-item">
                        <Clock size={16} />
                        <span>{st.hours}</span>
                      </div>
                    )}
                  </div>

                  <div className="store-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
                    {!isSelected && (
                      <button
                        onClick={() => {
                          setStoreId(st.id);
                          setActiveTab('card');
                        }}
                        className="btn-store-action primary"
                        style={{ width: '100%', marginBottom: 4, justifyContent: 'center', background: 'var(--brand-gold)', color: '#FFF' }}
                      >
                        <CheckCircle2 size={16} />
                        {lang === 'es' ? 'Ver Menú y Recompensas de esta Sucursal' : 'Select this Store'}
                      </button>
                    )}
                    {st.phone && (
                      <a 
                        href={`tel:${st.phone.replace(/\s+/g, '')}`} 
                        className="btn-store-action secondary"
                        style={{ textDecoration: 'none', flex: 1, minWidth: '120px', justifyContent: 'center' }}
                      >
                        <Phone size={14} />
                        {t.btnCall}
                      </a>
                    )}
                    {st.address && (
                      <a 
                        href={`http://maps.apple.com/?q=${encodeURIComponent(st.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-store-action secondary"
                        style={{ textDecoration: 'none', flex: 1, minWidth: '120px', justifyContent: 'center' }}
                      >
                        <MapPin size={14} />
                        {t.btnDirections}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        )}

        {/* ==================== TAB 4: PROFILE & MANAGEMENT ==================== */}
        {activeTab === 'profile' && profile && (
          <div>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '32px 20px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)',
              border: '1px solid #F1F5F9',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#FAF8F5',
                border: '1.5px solid var(--brand-gold-border)',
                color: 'var(--brand-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: '700',
                margin: '0 auto 14px',
                letterSpacing: '0.02em'
              }}>
                {profile.full_name?.substring(0, 2).toUpperCase() || 'CL'}
              </div>
              
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A', margin: 0, fontFamily: 'var(--font-sans)' }}>
                  {profile.full_name || t.defaultClientName}
                </h3>
                <button 
                  onClick={() => { setEditNameText(profile.full_name || ''); setIsEditingName(true); }}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', padding: '4px' }}
                >
                  <Edit2 size={16} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', background: '#F8FAFC', padding: '16px', borderRadius: '16px', textAlign: 'left' }}>
                {/* Phone */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155' }}>
                    <div style={{ background: '#E2E8F0', padding: '8px', borderRadius: '10px' }}><Phone size={16} /></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{profile.phone || 'Sin teléfono'}</span>
                  </div>
                  <button 
                    onClick={() => { setEditPhoneText(profile.phone || ''); setIsEditingPhone(true); }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-action)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                </div>
                
                {/* Email */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155' }}>
                    <div style={{ background: '#E2E8F0', padding: '8px', borderRadius: '10px' }}><Mail size={16} /></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      {!profile.email.endsWith('@postreland.app') ? profile.email : 'Sin correo electrónico'}
                    </span>
                  </div>
                  <button 
                    onClick={() => { setEditEmailText(profile.email.endsWith('@postreland.app') ? '' : profile.email); setIsEditingEmail(true); }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-action)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                </div>
                
                {/* Birthday (Oculto temporalmente) */}
                {/*
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#334155' }}>
                    <div style={{ background: '#E2E8F0', padding: '8px', borderRadius: '10px' }}><Calendar size={16} /></div>
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      {profile.birthday_day && profile.birthday_month ? 
                        `${profile.birthday_day}/${profile.birthday_month}${profile.birthday_year ? `/${profile.birthday_year}` : ''}` 
                        : 'Sin cumpleaños'
                      }
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      setEditBirthdayDay(profile.birthday_day || 1);
                      setEditBirthdayMonth(profile.birthday_month || 1);
                      setEditBirthdayYear(profile.birthday_year || '');
                      setIsEditingBirthday(true);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--brand-action)', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Editar
                  </button>
                </div>
                */}
              </div>
            </div>

            {/* Social Links Card */}
            {(activeStore?.instagram_url || activeStore?.facebook_url || activeStore?.tiktok_url || activeStore?.google_business_url || activeStore?.tripadvisor_url) && (
              <div className="social-links-wrapper">
                <h4 className="social-links-title">{t.generalContact}</h4>
                <div className="social-grid">
                  {activeStore?.instagram_url && (
                    <a 
                      href={activeStore.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-btn"
                    >
                      <Instagram size={14} />
                      Instagram
                    </a>
                  )}
                  {activeStore?.facebook_url && (
                    <a 
                      href={activeStore.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-btn"
                    >
                      <Facebook size={14} />
                      Facebook
                    </a>
                  )}
                  {activeStore?.tiktok_url && (
                    <a 
                      href={activeStore.tiktok_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.36a6.34 6.34 0 0 0-.85-.06A6.33 6.33 0 0 0 3 15.63 6.34 6.34 0 0 0 9.34 22a6.34 6.34 0 0 0 6.34-6.34V8.47a8.28 8.28 0 0 0 4.91 1.62V6.69z"/>
                      </svg>
                      TikTok
                    </a>
                  )}
                  {activeStore?.google_business_url && (
                    <a 
                      href={activeStore.google_business_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-btn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Google
                    </a>
                  )}
                  {activeStore?.tripadvisor_url && (
                    <a 
                      href={activeStore.tripadvisor_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="social-btn"
                    >
                      <svg width="18" height="12" viewBox="50 110 412 260">
                        <path fill="#FCC419" stroke="#000a12" strokeWidth="16" d="M93 202a195 151 0 0 1 326 0v56H93" />
                        <g transform="translate(256, 257)">
                          <g fill="#000a12">
                            <path d="M-115 -97 h-77 c0 2 22 36 19 48 M0 92 -31 45 V0 H2" />
                            <circle cx="-97" cy="0" r="97" />
                            <circle cx="-97" cy="0" r="78" fill="#FFFFFF" />
                            <circle cx="-97" cy="0" r="50" />
                            <circle cx="-97" cy="0" r="33" fill="#FFFFFF" />
                          </g>
                          <g fill="#000a12" transform="scale(-1, 1)">
                            <path d="M-115 -97 h-77 c0 2 22 36 19 48 M0 92 -31 45 V0 H2" />
                            <circle cx="-97" cy="0" r="97" />
                            <circle cx="-97" cy="0" r="78" fill="#FFFFFF" />
                            <circle cx="-97" cy="0" r="50" />
                            <circle cx="-97" cy="0" r="33" fill="#FFFFFF" />
                          </g>
                          <circle cx="-97" cy="0" r="17" fill="#E53935" />
                          <circle cx="97" cy="0" r="17" fill="#00AF87" />
                        </g>
                      </svg>
                      TripAdvisor
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="profile-menu">
              {/* Language toggle row in Profile settings */}
              <div className="profile-menu-item" style={{ cursor: 'default' }}>
                <Globe size={18} style={{ color: '#78716C' }} />
                <span style={{ flex: 1 }}>{t.language}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => handleUpdateLanguage('es')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: lang === 'es' ? 'var(--brand-gold)' : 'var(--text-gray)',
                      fontSize: '11px',
                      fontWeight: lang === 'es' ? '700' : '400',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: lang === 'es' ? 'var(--brand-gold-light)' : 'transparent',
                    }}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => handleUpdateLanguage('en')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: lang === 'en' ? 'var(--brand-gold)' : 'var(--text-gray)',
                      fontSize: '11px',
                      fontWeight: lang === 'en' ? '700' : '400',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: lang === 'en' ? 'var(--brand-gold-light)' : 'transparent',
                    }}
                  >
                    EN
                  </button>
                </div>
              </div>

              <button onClick={onLogout} className="profile-menu-item">
                <LogOut size={18} style={{ color: '#78716C' }} />
                <span>{t.logout}</span>
                <ChevronRight size={16} className="chevron" />
              </button>
              
              <button 
                onClick={() => setIsShowingDeleteConfirm(true)} 
                className="profile-menu-item danger"
              >
                <Trash2 size={18} />
                <span>{t.deleteAccount}</span>
                <ChevronRight size={16} className="chevron" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Tab Navigation */}
      <nav className="bottom-nav" style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: '70px', 
        backgroundColor: '#FFFFFF', 
        borderTop: '1px solid #E2E8F0', 
        display: 'flex',
        alignItems: 'center', 
        justifyContent: 'space-around',
        zIndex: 100, 
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Inicio Tab */}
        <button 
          onClick={() => { setActiveTab('card'); setErrorMsg(null); setSuccessMsg(null); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'card' ? 'var(--brand-action)' : '#64748B',
            cursor: 'pointer',
            flex: 1,
            height: '100%',
            justifyContent: 'center'
          }}
        >
          <div style={{
            background: activeTab === 'card' ? 'var(--light-action)' : 'transparent',
            padding: '6px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <Home size={22} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
            {lang === 'es' ? 'Inicio' : 'Home'}
          </span>
        </button>

        {/* Recompensas Tab */}
        <button 
          onClick={() => { setActiveTab('rewards'); setErrorMsg(null); setSuccessMsg(null); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'rewards' ? 'var(--brand-action)' : '#64748B',
            cursor: 'pointer',
            flex: 1,
            height: '100%',
            justifyContent: 'center'
          }}
        >
          <div style={{
            background: activeTab === 'rewards' ? 'var(--light-action)' : 'transparent',
            padding: '6px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <Gift size={22} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
            {lang === 'es' ? 'Premios' : 'Rewards'}
          </span>
        </button>

        {/* Perfil Tab */}
        <button 
          onClick={() => { setActiveTab('profile'); setErrorMsg(null); setSuccessMsg(null); }}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'profile' ? 'var(--brand-action)' : '#64748B',
            cursor: 'pointer',
            flex: 1,
            height: '100%',
            justifyContent: 'center'
          }}
        >
          <div style={{
            background: activeTab === 'profile' ? 'var(--light-action)' : 'transparent',
            padding: '6px 20px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>
            <User size={22} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
            {lang === 'es' ? 'Perfil' : 'Profile'}
          </span>
        </button>
      </nav>

      {/* ==================== MODALS ==================== */}

      {/* 1. Modal: Client Present QR Code */}
      {showQRModal && profile && (
        <div className="modal-backdrop" onClick={() => setShowQRModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <h3 className="modal-title">{t.modalClientCodeTitle}</h3>
            <p className="modal-desc">{t.modalClientCodeDesc}</p>
            
            <div style={{ background: '#FAF8F5', padding: '16px', borderRadius: '24px', border: '1.5px solid var(--brand-gold-border)', marginBottom: '20px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${profile.id}`}
                alt="Código QR del Cliente"
                style={{ width: '220px', height: '220px', display: 'block', borderRadius: '8px' }}
              />
            </div>

            <div style={{ fontSize: '0.8rem', color: '#78716C', fontStyle: 'italic', wordBreak: 'break-all', marginBottom: '24px' }}>
              ID: {profile.id}
            </div>

            <button onClick={() => setShowQRModal(false)} className="btn-primary" style={{ margin: 0 }}>
              {t.btnClose}
            </button>
          </div>
        </div>
      )}

      {/* 2. Modal: Webcam QR Scanner */}
      {showScannerModal && (
        <div className="modal-backdrop" onClick={() => { stopScanner(); setShowScannerModal(false); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <h3 className="modal-title">{t.modalScanTitle}</h3>
            <p className="modal-desc">{t.modalScanDesc}</p>
            
            <div className="scanner-viewport">
              <div className="scanner-laser" />
              <div id={scannerContainerId} style={{ width: '100%', height: '100%' }} />
            </div>

            <button 
              onClick={() => { stopScanner(); setShowScannerModal(false); }} 
              className="btn-secondary" 
              style={{ width: '100%', maxWidth: '280px' }}
            >
              {t.btnCancel}
            </button>
          </div>
        </div>
      )}

      {/* 3. Modal: Active Coupon Present QR */}
      {showCouponModal && (
        <div className="modal-backdrop" onClick={() => setShowCouponModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <div className="modal-coupon-title">{showCouponModal.reward_description}</div>
            
            {(() => {
              const matchedReward = rewards.find(r => r.title === showCouponModal.reward_description);
              if (matchedReward?.description) {
                return (
                  <p style={{ fontSize: '0.85rem', color: '#475569', margin: '4px 0 14px', textAlign: 'center', lineHeight: 1.4, padding: '0 8px' }}>
                    {matchedReward.description}
                  </p>
                );
              }
              return null;
            })()}

            <p className="modal-desc">{t.modalCouponDesc}</p>
            
            <div style={{ background: '#FAF8F5', padding: '16px', borderRadius: '24px', border: '1px solid var(--brand-gold-border)', marginBottom: '20px' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${showCouponModal.id}`}
                alt="Cupón QR"
                style={{ width: '200px', height: '200px', display: 'block' }}
              />
            </div>

            <div style={{ fontSize: '0.78rem', color: '#E67E22', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '24px' }}>
              {t.modalCouponTitleCode}
            </div>

            <button onClick={() => setShowCouponModal(null)} className="btn-primary" style={{ margin: 0 }}>
              {t.btnClose}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Reward Detail & Terms */}
      {selectedRewardDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedRewardDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />

            {(selectedRewardDetail.image_url || activeStore?.logo_url) ? (
              <div style={{ width: '100%', height: '160px', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', backgroundColor: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedRewardDetail.image_url ? (
                  <img 
                    src={selectedRewardDetail.image_url} 
                    alt={selectedRewardDetail.title} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }} 
                  />
                ) : (
                  <div style={{
                    width: '94px',
                    height: '94px',
                    borderRadius: '50%',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
                    border: '3px solid #FFFFFF',
                    outline: '1.5px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <img 
                      src={activeStore?.logo_url} 
                      alt={selectedRewardDetail.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} 
                    />
                  </div>
                )}
              </div>
            ) : null}

            <span style={{
              display: 'inline-block',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--brand-gold)',
              backgroundColor: 'var(--brand-gold-light)',
              border: '1px solid var(--brand-gold-border)',
              borderRadius: '6px',
              padding: '3px 10px',
              marginBottom: '8px'
            }}>
              ⭐ {lang === 'es' ? 'RECOMPENSA DE LEALTAD' : 'LOYALTY REWARD'}
            </span>

            <h3 className="modal-title" style={{ margin: '0 0 12px', fontSize: '1.25rem' }}>
              {selectedRewardDetail.title}
            </h3>

            {selectedRewardDetail.description ? (
              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '16px',
                width: '100%',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
                  {lang === 'es' ? 'Descripción y Términos' : 'Description & Terms'}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.45 }}>
                  {selectedRewardDetail.description}
                </div>
              </div>
            ) : null}

            {/* Stars requirement */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: '#FAF8F5',
              border: '1px solid var(--brand-gold-border)',
              borderRadius: '14px',
              padding: '12px 16px',
              marginBottom: '20px'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                {lang === 'es' ? 'Estrellas requeridas:' : 'Required stars:'}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-gold)' }}>
                ★ {selectedRewardDetail.visits_cost}
              </span>
            </div>

            {(() => {
              const activeCoupon = coupons.find(c => c.reward_description === selectedRewardDetail.title && c.status === 'active');
              const hasRedeemed = allCoupons.some(c => c.reward_description === selectedRewardDetail.title && c.status === 'redeemed');
              const canRedeem = profile ? profile.visits >= selectedRewardDetail.visits_cost && !activeCoupon && !hasRedeemed : false;

              if (hasRedeemed) {
                return (
                  <div style={{ width: '100%' }}>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '12px', marginBottom: '14px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle2 size={16} />
                        {lang === 'es' ? '¡Premio canjeado con éxito en tienda!' : 'Reward already redeemed in store!'}
                      </span>
                    </div>
                    <button 
                      onClick={() => setSelectedRewardDetail(null)} 
                      className="btn-secondary" 
                      style={{ width: '100%', margin: 0 }}
                    >
                      {t.btnClose}
                    </button>
                  </div>
                );
              }

              if (activeCoupon) {
                return (
                  <button 
                    onClick={() => {
                      setSelectedRewardDetail(null);
                      setShowCouponModal(activeCoupon);
                    }} 
                    className="btn-primary" 
                    style={{ width: '100%', margin: 0 }}
                  >
                    {lang === 'es' ? 'Ver Cupón Activo 🎯' : 'View Active Coupon 🎯'}
                  </button>
                );
              }

              if (canRedeem) {
                return (
                  <button 
                    onClick={() => {
                      const rew = selectedRewardDetail;
                      setSelectedRewardDetail(null);
                      handleRedeemReward(rew);
                    }} 
                    className="btn-primary" 
                    style={{ width: '100%', margin: 0 }}
                  >
                    {lang === 'es' ? '¡Desbloquear Premio! 🎁' : 'Unlock Reward! 🎁'}
                  </button>
                );
              }

              return (
                <div style={{ width: '100%' }}>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', margin: '0 0 12px' }}>
                    {lang === 'es'
                      ? `Tienes ${profile?.visits || 0} de ${selectedRewardDetail.visits_cost} estrellas necesarias.`
                      : `You have ${profile?.visits || 0} of ${selectedRewardDetail.visits_cost} required stars.`}
                  </p>
                  <button 
                    onClick={() => setSelectedRewardDetail(null)} 
                    className="btn-secondary" 
                    style={{ width: '100%', margin: 0 }}
                  >
                    {t.btnClose}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 4. Modal: Edit User Profile Name */}
      {isEditingName && (
        <div className="modal-backdrop" onClick={() => setIsEditingName(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <h3 className="modal-title">{t.modalEditNameTitle}</h3>
            <p className="modal-desc">{t.modalEditNameDesc}</p>

            <div className="form-group" style={{ width: '100%' }}>
              <input 
                type="text" 
                value={editNameText}
                onChange={(e) => setEditNameText(e.target.value)}
                className="form-input"
                placeholder={t.editNamePlaceholder}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
              <button onClick={() => setIsEditingName(false)} className="btn-secondary" style={{ flex: 1 }}>
                {t.btnCancel}
              </button>
              <button 
                onClick={handleUpdateName} 
                className="btn-primary" 
                style={{ flex: 1, margin: 0 }}
                disabled={!editNameText.trim()}
              >
                {t.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User Phone */}
      {isEditingPhone && (
        <div className="modal-backdrop" onClick={() => setIsEditingPhone(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <h3 className="modal-title">{t.modalEditPhoneTitle}</h3>
            <p className="modal-desc">{t.modalEditPhoneDesc}</p>

            <div className="form-group" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#F5F5F4',
                  border: '1px solid #E7E5E4',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontWeight: 600,
                  color: '#44403C',
                  fontSize: '0.95rem',
                  height: '42px',
                  userSelect: 'none'
                }}>
                  +52
                </div>
                <div style={{ flex: 1 }}>
                  <input 
                    type="tel" 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editPhoneText}
                    onChange={(e) => setEditPhoneText(e.target.value.replace(/[^0-9]/g, ''))}
                    className="form-input"
                    placeholder={t.editPhonePlaceholder}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
              <button onClick={() => setIsEditingPhone(false)} className="btn-secondary" style={{ flex: 1 }}>
                {t.btnCancel}
              </button>
              <button 
                onClick={handleUpdatePhone} 
                className="btn-primary" 
                style={{ flex: 1, margin: 0 }}
                disabled={editPhoneText.replace(/[^0-9]/g, '').length < 10}
              >
                {t.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Email Modal */}
      {isEditingEmail && (
        <div className="modal-backdrop" onClick={() => setIsEditingEmail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '1.2rem', color: '#334155' }}>Editar Correo Electrónico</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
              Ingresa tu correo electrónico para recibir notificaciones y promociones especiales.
            </p>
            
            <input 
              type="email"
              value={editEmailText}
              onChange={e => setEditEmailText(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="form-input"
              style={{ marginBottom: '20px', width: '100%' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsEditingEmail(false)} className="btn-secondary" style={{ flex: 1 }}>
                {t.btnCancel || 'Cancelar'}
              </button>
              <button 
                onClick={handleUpdateEmail} 
                className="btn-primary" 
                disabled={loading || !editEmailText.trim()}
                style={{ flex: 1, margin: 0 }}
              >
                {loading ? t.loading : (t.btnSave || 'Guardar')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User Birthday (Oculto temporalmente) */}
      {/*
      {isEditingBirthday && (
        <div className="modal-backdrop" onClick={() => setIsEditingBirthday(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <h3 className="modal-title">Editar Cumpleaños</h3>
            <p className="modal-desc">Ingresa tu fecha de cumpleaños (año opcional).</p>

            <div style={{ display: 'flex', gap: '8px', width: '100%', marginBottom: '16px', marginTop: '16px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Día</label>
                <select 
                  value={editBirthdayDay} 
                  onChange={(e) => setEditBirthdayDay(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px' }}
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1.5 }}>
                <label className="form-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Mes</label>
                <select 
                  value={editBirthdayMonth} 
                  onChange={(e) => setEditBirthdayMonth(Number(e.target.value))}
                  className="form-input"
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px' }}
                >
                  {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1.2 }}>
                <label className="form-label" style={{ fontSize: '11px', display: 'block', marginBottom: '4px' }}>Año (Opcional)</label>
                <input 
                  type="number" 
                  value={editBirthdayYear}
                  onChange={(e) => setEditBirthdayYear(e.target.value === '' ? '' : Number(e.target.value))}
                  className="form-input"
                  placeholder="Año"
                  min={1920}
                  max={new Date().getFullYear()}
                  style={{ width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #E2E8F0', padding: '0 8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '12px' }}>
              <button onClick={() => setIsEditingBirthday(false)} className="btn-secondary" style={{ flex: 1 }}>
                {t.btnCancel}
              </button>
              <button 
                onClick={handleUpdateBirthday} 
                className="btn-primary" 
                style={{ flex: 1, margin: 0 }}
              >
                {t.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

      */}

      {/* 5. Modal: Delete Account Confirmation */}
      {isShowingDeleteConfirm && (
        <div className="modal-backdrop" onClick={() => setIsShowingDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle" />
            <div style={{ color: '#E74C3C', marginBottom: '16px' }}>
              <AlertTriangle size={48} />
            </div>
            <h3 className="modal-title" style={{ color: '#E74C3C' }}>{t.modalDeleteTitle}</h3>
            <p className="modal-desc" style={{ marginBottom: '24px' }}>
              {t.modalDeleteDesc}
            </p>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => setIsShowingDeleteConfirm(false)} className="btn-secondary" style={{ flex: 1 }}>
                {t.btnCancel}
              </button>
              <button 
                onClick={handleDeleteAccount} 
                className="btn-primary" 
                style={{ flex: 1, margin: 0, backgroundColor: '#E74C3C', boxShadow: '0 4px 12px rgba(231, 76, 60, 0.2)' }}
              >
                {t.deleteAccount}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ==================== CELEBRATION OVERLAY ==================== */}
      {celebrationCoupon && (
        <div
          onClick={() => setCelebrationCoupon(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            animation: 'celebFadeIn 0.4s ease',
          }}
        >
          {/* Confetti canvas */}
          <canvas
            ref={confettiCanvasRef}
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000 }}
          />

          {/* Celebration card */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #FFF8EE 0%, #FFFDF7 100%)',
              borderRadius: '28px',
              padding: '40px 32px',
              textAlign: 'center',
              maxWidth: '320px',
              width: '90%',
              boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
              border: '2px solid var(--brand-gold)',
              position: 'relative',
              zIndex: 10001,
              animation: 'celebPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          >
            <div style={{ fontSize: '5rem', marginBottom: '8px', animation: 'celebBounce 0.6s ease 0.3s both' }}>🎉</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E1A16', marginBottom: '8px', lineHeight: 1.2 }}>
              {lang === 'es' ? '¡Premio Entregado!' : 'Prize Delivered!'}
            </div>
            <div style={{
              background: 'var(--brand-gold)',
              color: 'white',
              borderRadius: '12px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '1.1rem',
              margin: '16px 0',
              boxShadow: '0 4px 15px var(--brand-gold-border)',
            }}>
              🍨 {celebrationCoupon}
            </div>
            <p style={{ color: '#78716C', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              {lang === 'es'
                ? '¡Disfrútalo! Gracias por tu visita. 💛'
                : 'Enjoy it! Thanks for visiting. 💛'}
            </p>
            <button
              onClick={() => setCelebrationCoupon(null)}
              className="btn-primary"
              style={{ margin: 0, width: '100%' }}
            >
              {lang === 'es' ? '¡Gracias! 🎊' : 'Thank you! 🎊'}
            </button>
          </div>
        </div>
      )}

      {/* Wallet Download Loading Blur Overlay */}
      {walletLoadingType && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(15, 23, 42, 0.62)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setWalletLoadingType(null);
            }
          }}
        >
          <div 
            className="wallet-loading-modal-card"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '28px 24px 22px',
              maxWidth: '320px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            {/* Close button in corner */}
            <button
              type="button"
              onClick={() => setWalletLoadingType(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B',
                fontSize: '13px',
                fontWeight: 'bold',
                lineHeight: 1
              }}
              title={lang === 'es' ? 'Cerrar' : 'Close'}
            >
              ✕
            </button>

            {/* Icon container with pulsing ring */}
            <div style={{ position: 'relative', width: '68px', height: '68px', marginBottom: '16px' }}>
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: walletLoadingType === 'apple' ? '3px solid #000000' : '3px solid #4285F4',
                  borderTopColor: 'transparent',
                  animation: 'spin 0.9s linear infinite'
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  inset: '6px',
                  borderRadius: '50%',
                  backgroundColor: walletLoadingType === 'apple' ? '#000000' : '#FFFFFF',
                  border: walletLoadingType === 'apple' ? 'none' : '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                {walletLoadingType === 'apple' ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="#FFFFFF">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 1.01-2.87-.96.04-2.12.64-2.79 1.43-.59.68-1.11 1.77-1.01 2.82 1.07.08 2.17-.63 2.79-1.38z"/>
                  </svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              {walletLoadingType === 'apple' 
                ? (lang === 'es' ? 'Preparando Apple Wallet' : 'Preparing Apple Wallet')
                : (lang === 'es' ? 'Conectando con Google Wallet' : 'Connecting to Google Wallet')}
            </h3>

            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 16px', lineHeight: 1.4 }}>
              {lang === 'es' 
                ? 'Generando tu tarjeta digital con tu código QR y visitas...'
                : 'Generating your digital pass with your QR code and visits...'}
            </p>

            {/* Animated progress bar */}
            <div 
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: '#F1F5F9',
                borderRadius: '999px',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div 
                className="wallet-progress-bar-animated"
                style={{
                  height: '100%',
                  borderRadius: '999px',
                  background: walletLoadingType === 'apple' 
                    ? 'linear-gradient(90deg, #000000, #475569, #000000)'
                    : 'linear-gradient(90deg, #4285F4, #34A853, #FBBC05, #EA4335)'
                }}
              />
            </div>

            <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '10px' }}>
              {lang === 'es' ? 'Se abrirá automáticamente en tu dispositivo' : 'It will open automatically on your device'}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes celebFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes celebPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes celebBounce {
          0%   { transform: scale(0) rotate(-20deg); }
          60%  { transform: scale(1.3) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
