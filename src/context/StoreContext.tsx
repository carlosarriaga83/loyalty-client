import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_STORE_ID } from '../supabaseClient';
import { apiRequest } from '../loyaltyApi';

export interface Store {
  id: string;
  name: string;
  domain?: string | null;
  slug?: string | null;
  address?: string;
  phone?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  promo_banner_title?: string | null;
  promo_banner_subtitle?: string | null;
  promo_banner_image_url?: string | null;
  promo_banner_badge?: string | null;
  promo_banner_active?: boolean;
  facebook_url?: string | null;
  instagram_url?: string | null;
  tiktok_url?: string | null;
  google_business_url?: string | null;
  tripadvisor_url?: string | null;
}

interface StoreContextType {
  currentStore: Store | null;
  storeId: string;
  setStoreId: (id: string) => void;
  allStores: Store[];
  loading: boolean;
  isSingleStore: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({
  currentStore: null,
  storeId: '',
  setStoreId: () => {},
  allStores: [],
  loading: true,
  isSingleStore: false,
  refreshStores: async () => {},
});

// Helper to normalize strings for comparison and slug matching
const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const applyStoreTheme = (store: Store) => {
  if (store.primary_color) {
    document.documentElement.style.setProperty('--brand-gold', store.primary_color);
    document.documentElement.style.setProperty('--brand-gold-hover', store.primary_color);
    document.documentElement.style.setProperty('--brand-gold-border', `${store.primary_color}40`);
    document.documentElement.style.setProperty('--brand-gold-light', `${store.primary_color}1A`);
  }
  if (store.secondary_color) {
    const sec = store.secondary_color.trim().toLowerCase();
    if (sec !== '#ffffff' && sec !== '#fff' && sec !== 'white' && sec !== 'rgb(255,255,255)') {
      document.documentElement.style.setProperty('--brand-action', store.secondary_color);
    }
  }
  try {
    const themeData = {
      id: store.id,
      slug: store.slug,
      domain: store.domain,
      primary_color: store.primary_color,
      secondary_color: store.secondary_color,
      name: store.name,
      logo_url: store.logo_url
    };
    localStorage.setItem('client_cached_theme', JSON.stringify(themeData));

    let map: Record<string, any> = {};
    try {
      map = JSON.parse(localStorage.getItem('client_store_themes') || '{}');
    } catch {}
    if (store.id) map[store.id.toLowerCase()] = themeData;
    if (store.slug) map[store.slug.toLowerCase()] = themeData;
    if (store.domain) map[store.domain.toLowerCase()] = themeData;
    localStorage.setItem('client_store_themes', JSON.stringify(map));
  } catch {
    // Ignore storage errors
  }

  setTimeout(() => {
    document.documentElement.classList.remove('preload');
  }, 100);
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [storeId, setStoreIdState] = useState<string>('');
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isSingleStore, setIsSingleStore] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Helper to persist and switch store
  const setStoreId = (id: string) => {
    if (!id) return;
    setStoreIdState(id);
    localStorage.setItem('client_selected_store_id', id);
  };

  const fetchStoresAndResolve = async () => {
    try {
      const { stores } = await apiRequest<{ stores: Store[] }>('/stores');

      if (stores.length === 0) {
        const defaultStore: Store = {
          id: DEFAULT_STORE_ID || 'c3ad358a-6412-412e-87f9-8c50986b3298',
          name: 'Postreland',
          slug: 'postreland',
          logo_url: '/logo.png',
          primary_color: '#D1A153',
          secondary_color: '#1C1917',
          promo_banner_title: 'Club de Lealtad & Recompensas',
          promo_banner_subtitle: 'Acumula visitas y canjea deliciosas recompensas'
        };
        setAllStores([defaultStore]);
        setCurrentStore(defaultStore);
        setStoreIdState(defaultStore.id);
        applyStoreTheme(defaultStore);
        setLoading(false);
        return;
      }

      setAllStores(stores);

      // =========================================================================
      // DYNAMIC MULTI-TENANT WHITE-LABEL STORE RESOLUTION
      // =========================================================================
      let resolvedStore: Store | undefined;
      let matchedByTenantDomain = false;

      const hostname = window.location.hostname.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const urlStoreParam = urlParams.get('store')?.toLowerCase() || urlParams.get('slug')?.toLowerCase();

      const isSingleStoreEnv = import.meta.env.VITE_SINGLE_STORE_MODE === 'true';

      // 0️⃣ Priority 0: Environment Single Store Mode (e.g. dev:lorenza)
      if (isSingleStoreEnv && DEFAULT_STORE_ID) {
        resolvedStore = stores.find((s) => s.id === DEFAULT_STORE_ID);
        if (resolvedStore) matchedByTenantDomain = true;
      }

      // 1️⃣ Priority 1: Query Param in URL (?store=lorenza or ?store=UUID)
      if (!resolvedStore && urlStoreParam) {
        resolvedStore = stores.find(
          (s) =>
            s.id.toLowerCase() === urlStoreParam ||
            (s.slug && s.slug.toLowerCase() === urlStoreParam) ||
            (s.domain && s.domain.toLowerCase().includes(urlStoreParam)) ||
            slugify(s.name) === urlStoreParam ||
            slugify(s.name).includes(urlStoreParam) ||
            urlStoreParam.includes(slugify(s.name))
        );
        if (resolvedStore) matchedByTenantDomain = true;
      }

      // 2️⃣ Priority 2: Custom Domain & Brand Hostname Match (e.g. club.lorenzatulum.com, lorenzatulum.com, postreland.com)
      if (!resolvedStore && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
        resolvedStore = stores.find((s) => {
          const sSlug = s.slug ? slugify(s.slug) : '';
          const sNameSlug = slugify(s.name); // e.g. "lorenza-tulum"
          const sNameCompact = sNameSlug.replace(/-/g, ''); // e.g. "lorenzatulum"
          const firstWord = sNameSlug.split('-')[0]; // e.g. "lorenza"

          // Exact or partial configured domain match
          if (s.domain && (s.domain.toLowerCase() === hostname || hostname.includes(s.domain.toLowerCase()) || s.domain.toLowerCase().includes(hostname))) {
            return true;
          }

          // Hostname contains full compact store name (e.g. "club.lorenzatulum.com".includes("lorenzatulum"))
          if (sNameCompact.length >= 4 && hostname.includes(sNameCompact)) {
            return true;
          }

          // Hostname contains hyphenated store slug (e.g. "lorenza-tulum")
          if (sNameSlug.length >= 4 && hostname.includes(sNameSlug)) {
            return true;
          }

          // Check domain segments / subdomains (e.g. lorenza.productibot.com, club.lorenzatulum.com)
          const parts = hostname.split('.');
          for (const part of parts) {
            const cleanPart = part.replace(/-client$/, '').toLowerCase();
            if (['www', 'app', 'club', 'api', 'dev', 'stage', 'loyalty', 'client', 'com', 'mx', 'co', 'net', 'org'].includes(cleanPart)) {
              continue;
            }
            if (sSlug && (cleanPart === sSlug || cleanPart.includes(sSlug))) return true;
            if (cleanPart === sNameCompact || cleanPart === sNameSlug || cleanPart === firstWord) return true;
            if (cleanPart.includes(sNameCompact) || (firstWord.length >= 4 && cleanPart.includes(firstWord))) return true;
          }

          return false;
        });
        if (resolvedStore) matchedByTenantDomain = true;
      }

      // 4️⃣ Priority 4: LocalStorage cached store
      if (!resolvedStore) {
        const cachedId = localStorage.getItem('client_selected_store_id');
        if (cachedId) {
          resolvedStore = stores.find((s) => s.id === cachedId);
        }
      }

      // 5️⃣ Priority 5: Optional ENV default or first store
      if (!resolvedStore) {
        if (DEFAULT_STORE_ID) {
          resolvedStore = stores.find((s) => s.id === DEFAULT_STORE_ID);
        }
        if (!resolvedStore && stores.length > 0) {
          resolvedStore = stores[0];
        }
      }

      if (resolvedStore) {
        setIsSingleStore(matchedByTenantDomain);
        setStoreIdState(resolvedStore.id);
        setCurrentStore(resolvedStore);
        applyStoreTheme(resolvedStore);
        localStorage.setItem('client_selected_store_id', resolvedStore.id);
        document.title = `${resolvedStore.name} - Club de Lealtad`;
      }
    } catch (err) {
      console.error('Error al resolver tienda dinámica en client-app:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoresAndResolve();
  }, []);

  // Update currentStore whenever storeId changes
  useEffect(() => {
    if (storeId && allStores.length > 0) {
      const match = allStores.find((s) => s.id === storeId);
      if (match) {
        setCurrentStore(match);
        applyStoreTheme(match);
        document.title = `${match.name} - Club de Lealtad`;
      }
    }
  }, [storeId, allStores]);

  return (
    <StoreContext.Provider
      value={{
        currentStore,
        storeId,
        setStoreId,
        allStores,
        loading,
        isSingleStore,
        refreshStores: fetchStoresAndResolve,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(StoreContext);
