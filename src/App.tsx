/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Vendor, PurchaseOrder, BillingInvoice, AppScreen, Quotation, ShopkeeperStore, UserRole } from './types';
import { calculateOptimizedBasket, formatCurrencyBRL } from './utils/calculations';
import { HeaderQuotation } from './components/HeaderQuotation';
import { VendorsList } from './components/VendorsList';
import { VendorAnalyticsView } from './components/VendorAnalyticsView';
import { DynamicFooterAction } from './components/DynamicFooterAction';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { OrdersDrawer } from './components/OrdersDrawer';
import { UnifiedLoginView } from './components/UnifiedLoginView';
import { SuperAdminLoginView } from './components/SuperAdminLoginView';
import { AdminBillingView } from './components/AdminBillingView';
import { LaunchQuotationView } from './components/LaunchQuotationView';
import { ManageVendorsModal } from './components/ManageVendorsModal';
import { WhatsAppDispatchModal } from './components/WhatsAppDispatchModal';
import { SupplierPortalView } from './components/SupplierPortalView';
import { QuotationsHistoryModal } from './components/QuotationsHistoryModal';
import { ShopkeeperBillingModal } from './components/ShopkeeperBillingModal';
import { OpenQuotationsStack } from './components/OpenQuotationsStack';
import { ActiveQuotationDetails } from './components/ActiveQuotationDetails';
import { ShopkeeperHomeOverview } from './components/ShopkeeperHomeOverview';
import { ManageProductsModal } from './components/ManageProductsModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import {
  supabase,
  User,
  testConnection,
  logOut,
  saveQuotationToSupabase,
  getQuotationFromSupabase,
  subscribeToQuotationRealtime,
  saveSupplierProposalToSupabase,
  saveOrderToSupabase,
  loadOrdersFromSupabase,
  deleteQuotationFromSupabase,
} from './supabase';
import {
  getStoredStores,
  addStore,
  deleteStore,
  updateStore,
  getStoredInvoices,
  saveInvoices,
  getStoredVendors,
  saveVendors,
  clearAllProductionData,
  populateDemoData,
  updateAdminPassword,
  isSuperAdminEmail,
  saveQuotationBundle,
  getActiveQuotationBundle,
  saveVendorQuotationPrices,
  getQuotationsHistory,
  saveQuotationToHistory,
  deleteQuotationFromHistory,
  decodeQuotationPayload,
  decodeProposalPayload,
  SupplierProposalPayload,
  slugify,
  buildSupplierQuotationLink,
  QuotationBundle,
  getStoredCatalogProducts,
  addCatalogProduct,
  updateCatalogProduct,
  deleteCatalogProduct
} from './utils/storeManager';
import {
  Info,
  Smartphone,
  Monitor,
  ShoppingBag,
  Building2,
  PlusCircle,
  ArrowRight,
  CheckCircle2,
  Store,
  History,
  RotateCcw
} from 'lucide-react';

const INITIAL_CLEAN_QUOTATION: Quotation = {
  id: 'COT-NOVA',
  title: 'Minha Cotação Semanal',
  code: 'COT-001',
  status: 'Rascunho',
  createdAt: new Date().toISOString(),
  deadlineHours: 4,
  deadlineMinutes: 0,
  deadlineSeconds: 0,
};

export default function App() {
  // Production Navigation & Role State (suporta /admin, /super-admin e parâmetros de URL)
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      if (path === '/admin' || path === '/super-admin' || params.get('role') === 'admin' || params.has('admin')) {
        return 'super-admin-login';
      }
    } catch {}
    return 'login';
  });
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Stores & Active Store (Sem pré-seleção para garantir isolamento de tenant)
  const [stores, setStores] = useState<ShopkeeperStore[]>(() => getStoredStores());
  const [currentStore, setCurrentStore] = useState<ShopkeeperStore | null>(null);
  const [isSuperAdminViewing, setIsSuperAdminViewing] = useState(false);

  // Vendors for active store - inicia limpo por segurança multi-tenant
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // Quotation & Products - initialized from stored active quotation bundle if available
  const [quotation, setQuotation] = useState<Quotation>(() => {
    const bundle = getActiveQuotationBundle();
    return bundle?.quotation || INITIAL_CLEAN_QUOTATION;
  });
  const [products, setProducts] = useState<Product[]>(() => {
    const bundle = getActiveQuotationBundle();
    return bundle?.products || [];
  });
  const [prices, setPrices] = useState<Record<string, Record<string, number | null>>>(() => {
    const bundle = getActiveQuotationBundle();
    return bundle?.prices || {};
  });

  // Invoices for billing
  const [invoices, setInvoices] = useState<BillingInvoice[]>(() => getStoredInvoices());

  // Analytical selection
  const [selectedVendorId, setSelectedVendorId] = useState<string>('v1');
  const [currentScenario, setCurrentScenario] = useState<'A' | 'B'>('A');

  // Viewport mode toggle: 'responsive' (full desktop layout) or 'mobile-mockup' (480px smartphone frame)
  const [devicePreviewMode, setDevicePreviewMode] = useState<'responsive' | 'mobile-mockup'>('responsive');

  // Modals & Drawers
  const [isOrdersDrawerOpen, setIsOrdersDrawerOpen] = useState(false);
  const [isManageVendorsModalOpen, setIsManageVendorsModalOpen] = useState(false);
  const [isManageProductsModalOpen, setIsManageProductsModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(() =>
    getStoredCatalogProducts(currentStore?.slug)
  );
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [quotationsHistory, setQuotationsHistory] = useState<QuotationBundle[]>(() =>
    getQuotationsHistory(currentStore?.slug)
  );
  const [isViewingQuotationDetail, setIsViewingQuotationDetail] = useState(false);
  const [launchInitialTitle, setLaunchInitialTitle] = useState<string>('');
  const [launchInitialProducts, setLaunchInitialProducts] = useState<Product[]>([]);

  const [dispatchQuotationData, setDispatchQuotationData] = useState<{
    quotation: Quotation;
    vendors: Vendor[];
    productsCount: number;
    products: Product[];
  } | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<PurchaseOrder | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Stored URL vendor info for robust direct supplier access without generic fallback
  const [urlVendorInfo, setUrlVendorInfo] = useState<{
    id: string;
    name: string;
    company: string;
    minOrderValue: number;
    phone?: string;
    deliveryDays?: string;
  } | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('v') || params.get('vendorId');
      const vn = params.get('vn');
      const vc = params.get('vc');
      const vm = params.get('vm');
      const vp = params.get('vp');
      const vd = params.get('vd');
      if (v || vn || vc) {
        return {
          id: v || 'v1',
          name: vn || 'Representante',
          company: vc || 'Distribuidora',
          minOrderValue: vm ? parseFloat(vm) : 0,
          phone: vp || '',
          deliveryDays: vd || 'Entrega em 24h',
        };
      }
    } catch {}
    return null;
  });

  // Check URL parameters for direct supplier quoting access (?role=fornecedor&cot=...&v=...)
  useEffect(() => {
    const handleUrlRouting = async () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const roleParam = params.get('role');

        if (path === '/admin' || path === '/super-admin' || roleParam === 'admin' || params.has('admin')) {
          setCurrentScreen('super-admin-login');
          return;
        }

        // ========================================================
        // 0. CHECK MAGIC IMPORT PROPOSAL LINK FROM WHATSAPP
        // ========================================================
        const importParam = params.get('importProp') || params.get('prop');
        if (importParam) {
          const prop = decodeProposalPayload(importParam);
          if (prop && prop.cot && prop.v) {
            const targetCode = prop.cot;
            const existing = getActiveQuotationBundle(targetCode);

            const propVendor: Vendor = {
              id: prop.v,
              name: prop.vn || 'Representante',
              company: prop.vc || 'Distribuidora',
              minOrderValue: prop.vm || 0,
              phone: prop.vp || '',
              deliveryDays: prop.vd || 'Entrega em 24h',
              hasViewed: true,
            };

            const baseVendors = existing?.vendors && existing.vendors.length > 0 ? existing.vendors : vendors;
            const vendorExists = baseVendors.some((v) => v.id === prop.v);
            const mergedVendors = vendorExists
              ? baseVendors.map((v) => (v.id === prop.v ? { ...v, ...propVendor, hasViewed: true } : v))
              : [...baseVendors, propVendor];

            const mergedPrices = {
              ...(existing?.prices || prices || {}),
              [prop.v]: {
                ...(existing?.prices?.[prop.v] || prices?.[prop.v] || {}),
                ...prop.prices,
              },
            };

            const updatedBundle: QuotationBundle = {
              quotation: existing?.quotation || quotation,
              products: existing?.products && existing.products.length > 0 ? existing.products : products,
              vendors: mergedVendors,
              storeName: prop.s || existing?.storeName || currentStore?.name || 'Minha Loja',
              storeSlug: existing?.storeSlug || currentStore?.slug || 'minha-loja',
              prices: mergedPrices,
              updatedAt: new Date().toISOString(),
            };

            saveQuotationBundle(updatedBundle);
            saveQuotationToHistory(updatedBundle, currentStore?.slug);
            saveVendorQuotationPrices(prop.v, targetCode, prop.prices, prop.vd, propVendor);

            setQuotation(updatedBundle.quotation);
            if (updatedBundle.products.length > 0) setProducts(updatedBundle.products);
            setVendors(mergedVendors);
            setPrices(mergedPrices);
            setQuotationsHistory((prev) => [updatedBundle, ...prev.filter((b) => b.quotation.code !== targetCode)]);

            // Sync to Supabase
            try {
              await saveSupplierProposalToSupabase(targetCode, updatedBundle);
            } catch (err) {
              console.warn('Sync import to Supabase:', err);
            }

            setCurrentUserRole('lojista');
            setCurrentScreen('quotation');
            setIsViewingQuotationDetail(true);
            alert(`✅ Proposta de ${prop.vn} (${prop.vc}) sincronizada com sucesso no painel da cotação ${targetCode}!`);
            return;
          }
        }

        // Extract path segments for clean branded URLs: origin/[storeSlug]/[vendorSlug]/[codeSlug]
        const segments = window.location.pathname.split('/').filter(Boolean);
        let pathStoreSlug = '';
        let pathVendorSlug = '';
        let pathQuotationCode = '';

        if (segments.length >= 3) {
          if (segments[0] === 'loja' && segments[2] === 'fornecedor') {
            pathStoreSlug = segments[1];
            pathVendorSlug = segments[3] || '';
            pathQuotationCode = segments[4] || '';
          } else if (segments[0] === 'cotacao') {
            pathStoreSlug = segments[1];
            pathVendorSlug = segments[2] || '';
            pathQuotationCode = segments[3] || '';
          } else if (!['admin', 'super-admin'].includes(segments[0].toLowerCase())) {
            pathStoreSlug = segments[0];
            pathVendorSlug = segments[1];
            pathQuotationCode = segments[2];
          }
        } else if (segments.length === 2) {
          if (!['admin', 'super-admin'].includes(segments[0].toLowerCase())) {
            pathStoreSlug = segments[0];
            if (/^cot[-0-9]/i.test(segments[1])) {
              pathQuotationCode = segments[1];
            } else {
              pathVendorSlug = segments[1];
            }
          }
        } else if (segments.length === 1 && !['admin', 'super-admin'].includes(segments[0].toLowerCase())) {
          pathStoreSlug = segments[0];
        }

        const vParam = params.get('v') || params.get('vendorId');
        const cotParam = pathQuotationCode || params.get('cot') || params.get('cotacao');
        const dParam = params.get('d') || params.get('data');
        const vnParam = params.get('vn');
        const vcParam = params.get('vc');
        const vmParam = params.get('vm');
        const vdParam = params.get('vd');
        const vpParam = params.get('vp');
        const sParam = params.get('s') || pathStoreSlug;
        const swParam = params.get('sw');

        const isSupplierAccess = roleParam === 'fornecedor' || Boolean(vParam) || Boolean(dParam) || Boolean(pathVendorSlug) || Boolean(pathQuotationCode);

        // Se for acesso direto do lojista pela URL de sua loja (ex: cotafacil.tecx.pro/loja-modelo)
        if (segments.length === 1 && pathStoreSlug && !isSupplierAccess && !cotParam) {
          const matchedStore = getStoredStores().find(
            (s) => s.slug.toLowerCase() === pathStoreSlug.toLowerCase() || slugify(s.name) === pathStoreSlug.toLowerCase()
          );
          if (matchedStore) {
            setCurrentStore(matchedStore);
            setCurrentUserRole('lojista');
            setCurrentScreen('quotation');
            return;
          }
        }

        if (!isSupplierAccess && !cotParam) {
          return;
        }

        if (isSupplierAccess) {
          setCurrentUserRole('fornecedor');
          setCurrentScreen('supplier-portal');
          if (vParam) setSelectedVendorId(vParam);
        }

        if (pathStoreSlug && !currentStore) {
          const matchedStore = getStoredStores().find(
            (s) => s.slug.toLowerCase() === pathStoreSlug.toLowerCase() || slugify(s.name) === pathStoreSlug.toLowerCase()
          );
          if (matchedStore) {
            setCurrentStore(matchedStore);
          }
        }

        if (vnParam || vcParam || pathVendorSlug) {
          setUrlVendorInfo({
            id: vParam || 'v1',
            name: vnParam || (pathVendorSlug ? pathVendorSlug.replace(/-/g, ' ') : 'Representante'),
            company: vcParam || (pathVendorSlug ? pathVendorSlug.replace(/-/g, ' ') : 'Distribuidora'),
            minOrderValue: vmParam ? parseFloat(vmParam) : 0,
            phone: vpParam || '',
            deliveryDays: vdParam || 'Entrega em 24h',
          });
        }

        // 1. Fetch from Supabase by quotation code if targetCode exists (works across all browsers/devices)
        const targetCode = cotParam || (dParam ? decodeQuotationPayload(dParam)?.cot : null);
        if (targetCode) {
          try {
            let b = await getQuotationFromSupabase(targetCode);
            if (!b) {
              b = getActiveQuotationBundle(targetCode);
            }
            if (b) {
              if (b.quotation) setQuotation(b.quotation);
              if (b.products && b.products.length > 0) setProducts(b.products);
              if (b.vendors && b.vendors.length > 0) {
                // If vParam or pathVendorSlug is specified, match by ID or slug
                const matched = b.vendors.find(
                  (v) =>
                    v.id === vParam ||
                    slugify(v.company) === pathVendorSlug ||
                    slugify(v.name) === pathVendorSlug ||
                    slugify(v.id) === pathVendorSlug
                );
                if (matched) {
                  setSelectedVendorId(matched.id);
                  setVendors(b.vendors);
                } else if (pathVendorSlug || vParam) {
                  const newV: Vendor = {
                    id: vParam || pathVendorSlug,
                    name: vnParam || (pathVendorSlug ? pathVendorSlug.replace(/-/g, ' ') : 'Representante'),
                    company: vcParam || (pathVendorSlug ? pathVendorSlug.replace(/-/g, ' ') : 'Distribuidora'),
                    minOrderValue: vmParam ? parseFloat(vmParam) : 0,
                    phone: vpParam || '',
                    deliveryDays: vdParam || 'Entrega em 24h',
                    hasViewed: true,
                  };
                  const merged = [...b.vendors, newV];
                  setVendors(merged);
                  setSelectedVendorId(newV.id);
                  b.vendors = merged;
                } else {
                  setVendors(b.vendors);
                  setSelectedVendorId(b.vendors[0]?.id || 'v1');
                }
              }
              if (b.prices) setPrices(b.prices);
              if (b.storeName) {
                setCurrentStore({
                  id: 'store-active',
                  name: b.storeName,
                  slug: b.storeSlug || pathStoreSlug || 'loja',
                  contactPerson: 'Lojista',
                  email: '',
                  whatsapp: swParam || '',
                  monthlyFee: 390,
                  dueDay: 10,
                  planName: 'Plano Pro',
                  status: 'Ativo',
                  createdAt: new Date().toISOString(),
                });
              }
              saveQuotationBundle(b);
              return;
            }
          } catch (e) {
            console.warn('Supabase load quotation attempt:', e);
          }
        }

        // 2. Decode self-contained payload 'd' as backup
        if (dParam) {
          const decoded = decodeQuotationPayload(dParam);
          if (decoded && decoded.p && decoded.p.length > 0) {
            const reconstructedProducts: Product[] = decoded.p.map((item, idx) => ({
              id: item.id || `p-${idx + 1}`,
              name: item.n,
              quantity: item.q,
              unit: item.u,
            }));

            const currentVendor: Vendor = {
              id: decoded.v || vParam || 'v1',
              name: decoded.vn || vnParam || (pathVendorSlug ? pathVendorSlug.replace(/-/g, ' ') : 'Representante'),
              company: decoded.vc || vcParam || (pathVendorSlug ? pathVendorSlug.replace(/-/g, ' ') : 'Distribuidora'),
              minOrderValue: decoded.vm || 0,
              phone: decoded.vp || vpParam || '',
              deliveryDays: decoded.vd || vdParam || 'Entrega em 24h',
              hasViewed: true,
            };

            // Reconstruct all vendors list from allV or currentVendor
            let allVendorsList: Vendor[] = [];
            if (decoded.allV && decoded.allV.length > 0) {
              allVendorsList = decoded.allV.map((av) => ({
                id: av.id,
                name: av.n,
                company: av.c,
                minOrderValue: av.m || 0,
                phone: av.p || '',
                deliveryDays: av.d || 'Entrega em 24h',
                hasViewed: av.id === currentVendor.id,
              }));
            } else {
              allVendorsList = [currentVendor];
            }

            // Check if there is an existing local bundle and merge existing vendors/prices
            const existingBundle = getActiveQuotationBundle(decoded.cot || targetCode);
            if (existingBundle && existingBundle.vendors && existingBundle.vendors.length > 0) {
              existingBundle.vendors.forEach((ev) => {
                if (!allVendorsList.some((v) => v.id === ev.id)) {
                  allVendorsList.push(ev);
                }
              });
            }

            const reconstructedQuotation: Quotation = {
              id: decoded.cot || 'COT-B2B',
              code: decoded.cot || 'COT-B2B',
              title: decoded.t || 'Cotação de Compras',
              status: 'Em Cotação',
              createdAt: new Date().toISOString(),
              deadlineHours: 24,
              deadlineMinutes: 0,
              deadlineSeconds: 0,
              deadlineAt: decoded.d,
            };

            setProducts(reconstructedProducts);
            setQuotation(reconstructedQuotation);
            setVendors(allVendorsList);

            const matchedInAll = allVendorsList.find(
              (v) =>
                v.id === currentVendor.id ||
                slugify(v.company) === pathVendorSlug ||
                slugify(v.name) === pathVendorSlug
            );
            setSelectedVendorId(matchedInAll ? matchedInAll.id : currentVendor.id);

            // Preserve existing prices from local bundle
            const preservedPrices = existingBundle?.prices || {};

            const b: QuotationBundle = {
              quotation: reconstructedQuotation,
              products: reconstructedProducts,
              vendors: allVendorsList,
              storeName: decoded.s || sParam || 'Loja',
              storeSlug: pathStoreSlug || 'loja',
              prices: preservedPrices,
              updatedAt: new Date().toISOString(),
            };
            saveQuotationBundle(b);
            return;
          }
        }

        // 3. Fallback: LocalStorage bundle
        const localBundle = getActiveQuotationBundle(targetCode);
        if (localBundle) {
          setQuotation(localBundle.quotation);
          setProducts(localBundle.products);
          if (localBundle.vendors && localBundle.vendors.length > 0) {
            setVendors(localBundle.vendors);
          }
          if (localBundle.prices) setPrices(localBundle.prices);
        }
      } catch (err) {
        console.error('URL routing error:', err);
      }
    };

    handleUrlRouting();
  }, []);

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Supabase auth sync & pedidos
  useEffect(() => {
    testConnection();

    // Carrega a sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        const email = currentUser.email?.toLowerCase();
        if (email === 'icaroetatiana@gmail.com' || isSuperAdminEmail(email)) {
          setCurrentUserRole('admin');
          setCurrentScreen((prev) => (prev === 'login' || prev === 'super-admin-login' ? 'admin-billing' : prev));
        }

        loadOrdersFromSupabase(currentUser.id).then((loadedOrders) => {
          if (loadedOrders && loadedOrders.length > 0) {
            setOrders(loadedOrders);
          }
        });
      }
    });

    // Escuta mudanças de autenticação (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        const email = currentUser.email?.toLowerCase();
        if (email === 'icaroetatiana@gmail.com' || isSuperAdminEmail(email)) {
          setCurrentUserRole('admin');
          setCurrentScreen((prev) => (prev === 'login' || prev === 'super-admin-login' ? 'admin-billing' : prev));
        }

        loadOrdersFromSupabase(currentUser.id).then((loadedOrders) => {
          if (loadedOrders && loadedOrders.length > 0) {
            setOrders(loadedOrders);
          }
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Update vendors & history whenever currentStore changes (only in lojista mode to avoid overwriting supplier state)
  useEffect(() => {
    if (currentStore && currentUserRole === 'lojista') {
      const vList = getStoredVendors(currentStore.slug);
      setVendors(vList);
      setQuotationsHistory(getQuotationsHistory(currentStore.slug));
      setCatalogProducts(getStoredCatalogProducts(currentStore.slug));
    }
  }, [currentStore, currentUserRole]);

  // Real-time synchronization of active quotation for lojista via Supabase Realtime + Polling fallback
  useEffect(() => {
    if (currentUserRole === 'lojista' && quotation.code) {
      let isMounted = true;

      const handleUpdateData = (liveData: QuotationBundle) => {
        if (!isMounted || !liveData) return;
        if (liveData.prices) {
          setPrices(liveData.prices);
        }
        if (liveData.vendors && liveData.vendors.length > 0) {
          setVendors(liveData.vendors);
        }
        if (liveData.products && liveData.products.length > 0) {
          setProducts(liveData.products);
        }
        saveQuotationBundle(liveData);
        saveQuotationToHistory(liveData, currentStore?.slug);
        setQuotationsHistory((prev) => [liveData, ...prev.filter((b) => b.quotation.code !== quotation.code)]);
      };

      let unsub: (() => void) | null = null;
      try {
        unsub = subscribeToQuotationRealtime(quotation.code, handleUpdateData);
      } catch (err) {
        console.warn('Real-time quotation Supabase subscribe error:', err);
      }

      // Polling fallback to guarantee updates even if Realtime websocket drops or table replication is off
      const pollTimer = setInterval(async () => {
        try {
          const fresh = await getQuotationFromSupabase(quotation.code);
          if (fresh) {
            handleUpdateData(fresh);
          }
        } catch {
          // ignore network hiccups
        }
      }, 7000);

      return () => {
        isMounted = false;
        if (unsub) unsub();
        clearInterval(pollTimer);
      };
    }
  }, [currentUserRole, quotation.code, currentStore?.slug]);

  // Compute dynamic market-wide optimized total
  const optimizedData = calculateOptimizedBasket(products, prices);
  const selectedVendor: Vendor =
    vendors.find((v) => v.id === selectedVendorId) ||
    (urlVendorInfo && urlVendorInfo.id === selectedVendorId
      ? {
          id: urlVendorInfo.id,
          name: urlVendorInfo.name,
          company: urlVendorInfo.company,
          minOrderValue: urlVendorInfo.minOrderValue,
          phone: urlVendorInfo.phone,
          deliveryDays: urlVendorInfo.deliveryDays,
          hasViewed: true,
        }
      : vendors[0] || {
          id: selectedVendorId || 'v1',
          name: urlVendorInfo?.name || 'Representante Comercial',
          company: urlVendorInfo?.company || 'Distribuidora Fornecedora',
          hasViewed: false,
          minOrderValue: urlVendorInfo?.minOrderValue || 500,
        });

  // --- LOGIN & REGISTRATION HANDLERS ---
  const handleLoginAsLojista = (slugOrEmail?: string) => {
    const allStores = getStoredStores();
    const cleanIdentifier = (slugOrEmail || user?.email || '').trim().toLowerCase();

    let target = allStores.find(
      (s) => s.slug.toLowerCase() === cleanIdentifier || s.email.toLowerCase() === cleanIdentifier
    );

    // Se o usuário não tiver uma loja vinculada ao seu e-mail/identificador, cria uma loja própria isolada (NUNCA herda loja de outros)
    if (!target) {
      const emailToUse = user?.email || (cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier || 'lojista'}@cotafacil.com.br`);
      const rawName = cleanIdentifier.includes('@')
        ? cleanIdentifier.split('@')[0]
        : cleanIdentifier || 'Meu Comércio';
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[-_.]/g, ' ');
      const cleanSlug = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-') || `loja-${Date.now().toString().slice(-4)}`;

      target = addStore({
        name: formattedName,
        slug: cleanSlug,
        contactPerson: user?.user_metadata?.full_name || 'Lojista',
        email: emailToUse,
        whatsapp: '',
        monthlyFee: 390.00,
        dueDay: 10,
        planName: 'Plano Pro (Teste Grátis 7 dias)',
        status: 'Teste Grátis',
      });
      setStores(getStoredStores());
      setInvoices(getStoredInvoices());
    }

    // Check if blocked
    const activeInvoice = invoices.find((inv) => inv.slug === target?.slug);
    if (activeInvoice && activeInvoice.isBlocked) {
      alert(`O acesso da loja "${target.name}" está temporariamente bloqueado por mensalidade pendente. Contate o administrador.`);
      return;
    }

    setCurrentStore(target);
    setCurrentUserRole('lojista');
    setCurrentScreen('quotation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegisterShopkeeper = (storeData: {
    name: string;
    slug: string;
    contactPerson: string;
    email: string;
    whatsapp: string;
  }) => {
    const newStore = addStore({
      ...storeData,
      monthlyFee: 390.00, // Standard default monthly fee, customizable by admin
      dueDay: 10,
      planName: 'Plano Pro (Teste Grátis)',
      status: 'Teste Grátis',
    });

    setStores(getStoredStores());
    setInvoices(getStoredInvoices());
    setCurrentStore(newStore);
    setCurrentUserRole('lojista');
    setCurrentScreen('quotation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginAsVendor = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setCurrentUserRole('fornecedor');
    setCurrentScreen('supplier-portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSupplierSubmitProposal = async (
    submittingVendor: Vendor,
    newVendorPrices: Record<string, number | null>,
    notes: string
  ) => {
    const targetVendorId = submittingVendor.id || selectedVendorId;

    // 1. Update in-memory state
    setPrices((prev) => ({
      ...prev,
      [targetVendorId]: {
        ...(prev[targetVendorId] || {}),
        ...newVendorPrices,
      },
    }));

    setVendors((prev) => {
      const exists = prev.some((v) => v.id === targetVendorId);
      if (exists) {
        return prev.map((v) =>
          v.id === targetVendorId
            ? { ...v, ...submittingVendor, hasViewed: true, deliveryDays: notes || v.deliveryDays }
            : v
        );
      }
      return [...prev, { ...submittingVendor, hasViewed: true, deliveryDays: notes || submittingVendor.deliveryDays }];
    });

    // 2. Persist to storage
    saveVendorQuotationPrices(targetVendorId, quotation.code, newVendorPrices, notes, submittingVendor);

    // Update stack history in local state & storage
    setQuotationsHistory((prev) => {
      const updated = prev.map((b) => {
        if (b.quotation.code === quotation.code) {
          const mergedBundlePrices = {
            ...(b.prices || {}),
            [targetVendorId]: {
              ...(b.prices?.[targetVendorId] || {}),
              ...newVendorPrices,
            },
          };
          const baseVendors = b.vendors && b.vendors.length > 0 ? b.vendors : vendors;
          const vendorExists = baseVendors.some((v) => v.id === targetVendorId);
          const mergedBundleVendors = vendorExists
            ? baseVendors.map((v) =>
                v.id === targetVendorId
                  ? { ...v, ...submittingVendor, hasViewed: true, deliveryDays: notes || v.deliveryDays }
                  : v
              )
            : [...baseVendors, { ...submittingVendor, hasViewed: true, deliveryDays: notes || submittingVendor.deliveryDays }];

          const updatedB: QuotationBundle = {
            ...b,
            prices: mergedBundlePrices,
            vendors: mergedBundleVendors,
            updatedAt: new Date().toISOString(),
          };
          saveQuotationToHistory(updatedB, currentStore?.slug);
          return updatedB;
        }
        return b;
      });
      return updated;
    });

    // 3. Persist to Supabase:
    // Update active quotation with vendor's prices and viewed status
    if (quotation.code) {
      try {
        const curData = await getQuotationFromSupabase(quotation.code);
        const mergedPrices = {
          ...(curData?.prices || prices || {}),
          [targetVendorId]: {
            ...(curData?.prices?.[targetVendorId] || prices?.[targetVendorId] || {}),
            ...newVendorPrices,
          },
        };
        const baseVendors = curData?.vendors && curData.vendors.length > 0 ? curData.vendors : vendors;
        const vendorExists = baseVendors.some((v) => v.id === targetVendorId);
        const mergedVendors = vendorExists
          ? baseVendors.map((v) =>
              v.id === targetVendorId
                ? { ...v, ...submittingVendor, hasViewed: true, deliveryDays: notes || v.deliveryDays }
                : v
            )
          : [...baseVendors, { ...submittingVendor, hasViewed: true, deliveryDays: notes || submittingVendor.deliveryDays }];

        const updatedBundle: QuotationBundle = {
          quotation: curData?.quotation || quotation,
          products: curData?.products && curData.products.length > 0 ? curData.products : products,
          vendors: mergedVendors,
          storeName: curData?.storeName || currentStore?.name || 'Minha Loja',
          storeSlug: curData?.storeSlug || currentStore?.slug || 'minha-loja',
          prices: mergedPrices,
          updatedAt: new Date().toISOString(),
        };

        saveQuotationBundle(updatedBundle);
        await saveSupplierProposalToSupabase(quotation.code, updatedBundle);
      } catch (err) {
        console.error('Error saving supplier proposal to Supabase:', err);
      }
    }
  };

  const handleSuperAdminLoginSuccess = () => {
    setCurrentUserRole('admin');
    setCurrentScreen('admin-billing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    setIsSuperAdminViewing(false);
    try {
      await logOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUserRole(null);
    setCurrentStore(null);
    setVendors([]);
    setCurrentScreen('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- QUOTATION STACK, SELECTION & REUSE ---
  const handleSelectQuotation = async (code: string) => {
    const bundle = quotationsHistory.find((b) => b.quotation.code === code) || getActiveQuotationBundle(code);
    if (bundle) {
      setQuotation(bundle.quotation);
      setProducts(bundle.products || []);
      setPrices(bundle.prices || {});
      if (bundle.vendors && bundle.vendors.length > 0) {
        const cleanVendors = bundle.vendors.filter(v => !['v1', 'v2', 'v3', 'v4'].includes(v.id) && !['Distribuidora Bom Preço', 'Hortifrúti Ceasa Sul', 'AgroComercial Da Terra', 'Verduras Express Ltda'].includes(v.company));
        setVendors(cleanVendors);
      }
      saveQuotationBundle(bundle);
    }
    setIsViewingQuotationDetail(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const live = await getQuotationFromSupabase(code);
      if (live) {
        if (live.prices) setPrices(live.prices);
        if (live.vendors && live.vendors.length > 0) {
          const cleanVendors = live.vendors.filter(v => !['v1', 'v2', 'v3', 'v4'].includes(v.id) && !['Distribuidora Bom Preço', 'Hortifrúti Ceasa Sul', 'AgroComercial Da Terra', 'Verduras Express Ltda'].includes(v.company));
          setVendors(cleanVendors.length > 0 ? cleanVendors : live.vendors);
        }
        if (live.products && live.products.length > 0) setProducts(live.products);
        if (live.quotation) setQuotation(live.quotation);
        saveQuotationBundle(live);
        saveQuotationToHistory(live, currentStore?.slug);
        setQuotationsHistory((prev) => [live, ...prev.filter((b) => b.quotation.code !== code)]);
      }
    } catch {}
  };

  const handleOpenNewQuotation = () => {
    setLaunchInitialTitle('');
    setLaunchInitialProducts([]);
    setCurrentScreen('launch-quotation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReuseQuotation = (bundle: QuotationBundle) => {
    setLaunchInitialTitle(`${bundle.quotation.title} (Reutilizada)`);
    setLaunchInitialProducts(bundle.products || []);
    setIsHistoryModalOpen(false);
    setCurrentScreen('launch-quotation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenWhatsAppForBundle = (bundle: QuotationBundle) => {
    setDispatchQuotationData({
      quotation: bundle.quotation,
      vendors: bundle.vendors || vendors,
      productsCount: bundle.products?.length || 0,
      products: bundle.products || [],
    });
    setIsWhatsAppModalOpen(true);
  };

  const handleDeleteFromHistory = async (code: string) => {
    // 1. Delete from local storage (store and global)
    const updated = deleteQuotationFromHistory(code, currentStore?.slug);
    setQuotationsHistory(updated);

    // 2. Delete from Supabase
    try {
      await deleteQuotationFromSupabase(code);
    } catch (e) {
      console.warn('Error deleting quotation from Supabase:', e);
    }

    // 3. If active quotation was the one deleted, reset or pick next
    if (quotation.code === code) {
      if (updated.length > 0) {
        const nextBundle = updated[0];
        setQuotation(nextBundle.quotation);
        setProducts(nextBundle.products || []);
        setPrices(nextBundle.prices || {});
        if (nextBundle.vendors && nextBundle.vendors.length > 0) {
          setVendors(nextBundle.vendors);
        }
      } else {
        setQuotation(INITIAL_CLEAN_QUOTATION);
        setProducts([]);
        setPrices({});
      }
      setIsViewingQuotationDetail(false);
    }
  };

  // --- VENDORS MANAGEMENT FOR LOJISTA ---
  const handleAddVendor = (newVendorData: Omit<Vendor, 'id' | 'hasViewed'>) => {
    const newV: Vendor = {
      ...newVendorData,
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      hasViewed: false,
    };
    const updated = [...vendors, newV];
    setVendors(updated);
    saveVendors(updated, currentStore?.slug);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const updated = vendors.map((v) => (v.id === updatedVendor.id ? updatedVendor : v));
    setVendors(updated);
    saveVendors(updated, currentStore?.slug);
  };

  const handleDeleteVendor = (vendorId: string) => {
    const updated = vendors.filter((v) => v.id !== vendorId);
    setVendors(updated);
    saveVendors(updated, currentStore?.slug);
  };

  // --- CATALOG PRODUCTS MANAGEMENT FOR LOJISTA ---
  const handleAddCatalogProduct = (prodData: Omit<Product, 'id'>) => {
    const created = addCatalogProduct(prodData, currentStore?.slug);
    setCatalogProducts((prev) => [created, ...prev]);
  };

  const handleUpdateCatalogProduct = (productId: string, updates: Partial<Product>) => {
    const updated = updateCatalogProduct(productId, updates, currentStore?.slug);
    setCatalogProducts(updated);
  };

  const handleDeleteCatalogProduct = (productId: string) => {
    const updated = deleteCatalogProduct(productId, currentStore?.slug);
    setCatalogProducts(updated);
  };

  // --- QUOTATION CREATION / LAUNCH ---
  const handleLaunchQuotation = async (
    newTitle: string,
    deadlineHours: number,
    newProducts: Product[],
    selectedVendorIds: string[],
    notes: string,
    deadlineAt?: string
  ) => {
    const code = `COT-${Math.floor(1000 + Math.random() * 9000)}`;
    const updatedQuotation: Quotation = {
      id: `quot-${Date.now()}`,
      title: newTitle || 'Cotação de Compras',
      code,
      status: 'Em Cotação',
      createdAt: new Date().toISOString(),
      deadlineHours,
      deadlineMinutes: 0,
      deadlineSeconds: 0,
      deadlineAt: deadlineAt || new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString(),
    };

    setQuotation(updatedQuotation);
    setProducts(newProducts);

    // All initial prices are STRICTLY null - zero mock/pre-filled prices!
    const updatedPrices: Record<string, Record<string, number | null>> = {};
    vendors.forEach((v) => {
      updatedPrices[v.id] = {};
      newProducts.forEach((p) => {
        updatedPrices[v.id][p.id] = null;
      });
    });

    setPrices(updatedPrices);

    // Prepare WhatsApp dispatch for selected vendors
    const selectedVendors = vendors.filter((v) => selectedVendorIds.includes(v.id));

    // Persist quotation bundle locally and to Firestore
    const bundle: QuotationBundle = {
      quotation: updatedQuotation,
      products: newProducts,
      vendors: selectedVendors,
      storeName: currentStore?.name || 'Minha Loja',
      storeSlug: currentStore?.slug || 'minha-loja',
      prices: updatedPrices,
      updatedAt: new Date().toISOString(),
    };
    saveQuotationBundle(bundle);
    saveQuotationToHistory(bundle, currentStore?.slug);
    setQuotationsHistory((prev) => [bundle, ...prev.filter((b) => b.quotation.code !== code)]);

    try {
      await saveQuotationToSupabase(bundle, user?.id);
    } catch (e) {
      console.warn('Supabase quotation save error:', e);
    }

    if (selectedVendors.length > 0) {
      setDispatchQuotationData({
        quotation: updatedQuotation,
        vendors: selectedVendors,
        productsCount: newProducts.length,
        products: newProducts,
      });
      setIsWhatsAppModalOpen(true);
    }

    setLaunchInitialTitle('');
    setLaunchInitialProducts([]);
    setIsViewingQuotationDetail(true);
    setCurrentScreen('quotation');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- SUPER ADMIN STORE MANAGEMENT ---
  const handleAdminAddStore = (storeData: Omit<ShopkeeperStore, 'id' | 'createdAt'>) => {
    const created = addStore(storeData);
    setStores(getStoredStores());
    setInvoices(getStoredInvoices());
  };

  const handleAdminDeleteStore = (storeId: string) => {
    if (confirm('Deseja realmente remover esta loja do sistema?')) {
      const updated = deleteStore(storeId);
      setStores(updated);
      setInvoices((prev) => prev.filter((i) => i.storeId !== storeId));
    }
  };

  const handleAdminToggleBlock = (invoiceId: string) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, isBlocked: !inv.isBlocked } : inv
      );
      saveInvoices(updated);
      return updated;
    });
  };

  const handleAdminMarkAsPaid = (invoiceId: string) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: 'Pago' as const, isBlocked: false, daysOverdue: 0 }
          : inv
      );
      saveInvoices(updated);
      return updated;
    });
  };

  const handleClearAllData = () => {
    clearAllProductionData();
    setStores([]);
    setCurrentStore(null);
    setVendors([]);
    setProducts([]);
    setPrices({});
    setInvoices([]);
    setQuotation(INITIAL_CLEAN_QUOTATION);
  };

  const handleLoadDemoData = () => {
    const demo = populateDemoData();
    setStores(demo.stores);
    setCurrentStore(demo.stores[0]);
    setVendors(demo.vendors);
    setProducts(demo.products);
    setQuotation(demo.quotation);
    setInvoices(demo.invoices);

    // Initial mock prices for demo
    const demoPrices: Record<string, Record<string, number | null>> = {
      v1: { p1: 6.20, p2: 4.80, p3: 4.10, p4: 38.00, p5: 3.90, p6: 55.00, p7: null, p8: 4.20, p9: 45.00, p10: 1.80, p11: 42.00, p12: null },
      v2: { p1: 5.90, p2: 4.50, p3: 4.10, p4: 39.50, p5: 4.20, p6: null, p7: 72.00, p8: 3.80, p9: null, p10: 1.95, p11: 40.00, p12: 24.00 },
      v3: { p1: 6.40, p2: 4.90, p3: null, p4: 36.00, p5: 3.80, p6: 52.00, p7: 70.00, p8: 4.50, p9: 42.00, p10: null, p11: 43.00, p12: 25.50 },
      v4: { p1: 6.10, p2: null, p3: 4.30, p4: 36.00, p5: 4.10, p6: 54.00, p7: 75.00, p8: 4.00, p9: null, p10: 1.80, p11: null, p12: null },
    };
    setPrices(demoPrices);
  };

  // --- VENDOR ANALYTICS & ORDERING ---
  const handleOpenVendorAnalytics = (vendorId: string) => {
    setSelectedVendorId(vendorId);
    setCurrentScenario(vendorId === 'v2' ? 'B' : 'A');
    setCurrentScreen('vendor-analytics');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateVendorPrice = (vendorId: string, productId: string, newPrice: number | null) => {
    setPrices((prev) => ({
      ...prev,
      [vendorId]: {
        ...(prev[vendorId] || {}),
        [productId]: newPrice,
      },
    }));
  };

  const handleApplyScenario = (scenario: 'A' | 'B') => {
    setCurrentScenario(scenario);
    setPrices((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      if (selectedVendorId === 'v1') {
        if (scenario === 'B') {
          copy.v1.p2 = 4.20;
          copy.v1.p8 = 3.30;
        } else {
          copy.v1.p2 = 4.80;
          copy.v1.p8 = 3.90;
        }
      } else if (selectedVendorId === 'v2') {
        if (scenario === 'A') {
          copy.v2.p1 = 7.50;
          copy.v2.p2 = 6.20;
        } else {
          copy.v2.p1 = 5.90;
          copy.v2.p2 = 4.50;
        }
      }
      return copy;
    });
  };

  const handleGenerateOrder = async (
    vendor: Vendor,
    winningTotal: number,
    winningCount: number
  ) => {
    setIsSubmittingOrder(true);
    const newOrder: PurchaseOrder = {
      id: `PED-${Date.now().toString().slice(-6)}`,
      quotationId: quotation.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      company: vendor.company,
      totalAmount: winningTotal,
      itemsCount: winningCount,
      items: [],
      status: 'Emitido',
      createdAt: new Date().toISOString(),
    };

    setTimeout(async () => {
      setOrders((prev) => [newOrder, ...prev]);
      setLastCreatedOrder(newOrder);
      setIsSubmittingOrder(false);

      if (user) {
        try {
          await saveOrderToSupabase(newOrder, user.id);
        } catch (e) {
          console.warn('Supabase order save error:', e);
        }
      }
    }, 400);
  };

  const isMockup = devicePreviewMode === 'mobile-mockup';

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center selection:bg-neutral-900 selection:text-white">
      {/* Top Floating Viewport Mode Switcher (Desktop Widescreen vs Mobile Simulator) */}
      <nav
        aria-label="Controle de visualização do app"
        className="w-full bg-neutral-950 text-white px-4 lg:px-8 py-2 flex items-center justify-between text-xs font-medium border-b border-neutral-800 shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>CotaFácil B2B</span>
          </div>

          {currentStore && currentUserRole === 'lojista' && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-neutral-800 text-[11px] text-neutral-400">
              <span>Loja Ativa:</span>
              <strong className="text-white">{currentStore.name}</strong>
            </div>
          )}

          {currentUserRole === 'admin' && (
            <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-neutral-800 text-[11px] text-amber-400 font-bold">
              <span>Modo Super Admin Ativo</span>
            </div>
          )}
        </div>

        {/* Viewport Mode Switcher: Desktop vs Mobile Mockup */}
        <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-[11px]">
          <button
            onClick={() => setDevicePreviewMode('responsive')}
            title="Visualizar em Tela Cheia / Desktop Widescreen"
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              devicePreviewMode === 'responsive'
                ? 'bg-neutral-800 text-white font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Versão Desktop</span>
          </button>

          <button
            onClick={() => setDevicePreviewMode('mobile-mockup')}
            title="Visualizar no Simulador Mobile (480px)"
            className={`px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              devicePreviewMode === 'mobile-mockup'
                ? 'bg-neutral-800 text-white font-bold shadow-xs'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simulador Mobile</span>
          </button>
        </div>
      </nav>

      {/* Super Admin Impersonation Banner */}
      {isSuperAdminViewing && (
        <div className="w-full bg-amber-400 text-neutral-950 px-4 py-2.5 text-xs font-bold flex items-center justify-between shadow-md sticky top-0 z-50 border-b border-amber-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-950 animate-pulse"></span>
            <span>Modo Super Admin: Inspecionando Loja <strong>{currentStore?.name}</strong></span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsSuperAdminViewing(false);
              setCurrentUserRole('admin');
              setCurrentScreen('admin-billing');
            }}
            className="px-3 py-1 bg-neutral-950 text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer text-xs font-semibold shadow-xs"
          >
            ← Voltar ao Painel Master
          </button>
        </div>
      )}

      {/* Main Container Wrapper: Full width responsive or Mobile Mockup frame */}
      <div
        className={`w-full transition-all duration-300 flex-1 flex flex-col justify-start ${
          isMockup
            ? 'max-w-md my-6 bg-white min-h-[840px] rounded-3xl shadow-2xl border-4 border-neutral-800 overflow-hidden'
            : 'w-full bg-neutral-50/60'
        }`}
      >
        {/* ======================================================== */}
        {/* 1. TELA DE LOGIN UNIFICADA                               */}
        {/* ======================================================== */}
        {currentScreen === 'login' && (
          <div className="flex-1 flex flex-col w-full bg-white">
            <UnifiedLoginView
              onLoginAsLojista={handleLoginAsLojista}
              onLoginAsVendor={handleLoginAsVendor}
              onOpenSuperAdmin={() => setCurrentScreen('super-admin-login')}
              onRegisterShopkeeper={handleRegisterShopkeeper}
              user={user}
              authLoading={authLoading}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. LOGIN DEDICADO DO SUPER ADMIN                         */}
        {/* ======================================================== */}
        {currentScreen === 'super-admin-login' && (
          <div className="flex-1 flex flex-col w-full">
            <SuperAdminLoginView
              onBackToApp={() => setCurrentScreen('login')}
              onLoginSuccess={handleSuperAdminLoginSuccess}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. PAINEL SUPER ADMIN (LOJAS, MENSALIDADES & COBRANÇA)   */}
        {/* ======================================================== */}
        {currentScreen === 'admin-billing' && (
          <div className="flex-1 flex flex-col w-full">
            <AdminBillingView
              invoices={invoices}
              stores={stores}
              onBack={handleLogout}
              onToggleBlockShopkeeper={handleAdminToggleBlock}
              onMarkAsPaid={handleAdminMarkAsPaid}
              onAddStore={handleAdminAddStore}
              onDeleteStore={handleAdminDeleteStore}
              onSelectStoreToView={(st) => {
                setCurrentStore(st);
                setIsSuperAdminViewing(true);
                setCurrentUserRole('lojista');
                setCurrentScreen('quotation');
              }}
              onClearData={handleClearAllData}
              onLoadDemoData={handleLoadDemoData}
              onChangeAdminPassword={(newPass) => updateAdminPassword(newPass)}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. PAINEL PRINCIPAL DO LOJISTA (HOME DASHBOARD & COTAÇÃO) */}
        {/* ======================================================== */}
        {currentScreen === 'quotation' && (
          <div className="flex-1 flex flex-col pb-12 w-full">
            <HeaderQuotation
              quotation={quotation}
              store={currentStore}
              user={user}
              authLoading={authLoading}
              onOpenOrders={() => setIsOrdersDrawerOpen(true)}
              ordersCount={orders.length}
              historyCount={quotationsHistory.length}
              vendorsCount={vendors.length}
              productsCatalogCount={catalogProducts.length}
              onLaunchQuotation={handleOpenNewQuotation}
              onOpenManageVendors={() => setIsManageVendorsModalOpen(true)}
              onOpenManageProducts={() => setIsManageProductsModalOpen(true)}
              onOpenHistory={() => setIsHistoryModalOpen(true)}
              onOpenBilling={() => setIsBillingModalOpen(true)}
              onLogout={handleLogout}
              isHome={!isViewingQuotationDetail}
              onGoHome={() => {
                setIsViewingQuotationDetail(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-5 space-y-6 flex-1">
              {!isViewingQuotationDetail ? (
                /* Home do Dashboard do Lojista: Dados da Loja + Listas Empilhadas */
                <div className="space-y-6">
                  {/* Hero da Loja e Indicadores Gerais */}
                  <ShopkeeperHomeOverview
                    store={currentStore}
                    quotations={quotationsHistory}
                    vendors={vendors}
                    ordersCount={orders.length}
                    catalogProductsCount={catalogProducts.length}
                    onNewQuotation={handleOpenNewQuotation}
                    onOpenManageVendors={() => setIsManageVendorsModalOpen(true)}
                    onOpenManageProducts={() => setIsManageProductsModalOpen(true)}
                    onOpenHistory={() => setIsHistoryModalOpen(true)}
                    onOpenOrders={() => setIsOrdersDrawerOpen(true)}
                    onOpenBilling={() => setIsBillingModalOpen(true)}
                  />

                  {/* Listas de Cotação em Aberto */}
                  <OpenQuotationsStack
                    openQuotations={quotationsHistory}
                    activeCode={quotation.code}
                    onSelectQuotation={(code) => {
                      handleSelectQuotation(code);
                      setIsViewingQuotationDetail(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onNewQuotation={handleOpenNewQuotation}
                    onOpenWhatsApp={handleOpenWhatsAppForBundle}
                    onReuseQuotation={handleReuseQuotation}
                    onDeleteQuotation={handleDeleteFromHistory}
                  />
                </div>
              ) : (
                /* 2. Detalhes Completos da Cotação Aberta: Itens com cores e Lista Limpa de Fornecedores */
                <ActiveQuotationDetails
                  quotation={quotation}
                  products={products}
                  vendors={vendors}
                  prices={prices}
                  openQuotations={quotationsHistory}
                  onBackToLists={() => {
                    setIsViewingQuotationDetail(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectAnotherQuotation={(code) => {
                    handleSelectQuotation(code);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onSelectVendor={handleOpenVendorAnalytics}
                  onOpenWhatsApp={() => {
                    setDispatchQuotationData({
                      quotation,
                      vendors,
                      productsCount: products.length,
                      products,
                    });
                    setIsWhatsAppModalOpen(true);
                  }}
                  onGenerateDirectOrder={handleGenerateOrder}
                  onNewQuotation={handleOpenNewQuotation}
                />
              )}
            </main>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. VISÃO ANALÍTICA DO FORNECEDOR (LANCES E VALIDAÇÃO)    */}
        {/* ======================================================== */}
        {currentScreen === 'vendor-analytics' && (
          <div className="flex-1 flex flex-col w-full">
            <VendorAnalyticsView
              vendor={selectedVendor}
              products={products}
              prices={prices}
              onBack={() => setCurrentScreen('quotation')}
              onUpdateVendorPrice={handleUpdateVendorPrice}
              onApplyScenario={handleApplyScenario}
              currentScenario={currentScenario}
              onGenerateOrder={handleGenerateOrder}
              isSubmittingOrder={isSubmittingOrder}
            />

            {/* Mobile Footer action */}
            <DynamicFooterAction
              vendor={selectedVendor}
              products={products}
              prices={prices}
              onGenerateOrder={handleGenerateOrder}
              isSubmitting={isSubmittingOrder}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 6. LANÇAR LISTA DE COTAÇÃO PELO LOJISTA                  */}
        {/* ======================================================== */}
        {currentScreen === 'launch-quotation' && (
          <div className="flex-1 flex flex-col w-full">
            <LaunchQuotationView
              onBack={() => {
                setLaunchInitialTitle('');
                setLaunchInitialProducts([]);
                setCurrentScreen('quotation');
              }}
              onLaunchQuotation={handleLaunchQuotation}
              initialProducts={launchInitialProducts}
              initialTitle={launchInitialTitle}
              vendors={vendors}
              storeSlug={currentStore?.slug}
              catalogProducts={catalogProducts}
              onOpenManageCatalog={() => setIsManageProductsModalOpen(true)}
              onAddProductToCatalog={handleAddCatalogProduct}
              onOpenHistory={() => setIsHistoryModalOpen(true)}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* 7. PORTAL DO FORNECEDOR / DISTRIBUIDOR (PREENCHIMENTO)   */}
        {/* ======================================================== */}
        {currentScreen === 'supplier-portal' && (
          <div className="flex-1 flex flex-col w-full">
            <SupplierPortalView
              vendor={selectedVendor}
              quotation={quotation}
              storeName={currentStore?.name || 'Minha Loja'}
              storeWhatsApp={currentStore?.whatsapp}
              products={products}
              initialPrices={prices[selectedVendorId] || {}}
              onSubmitProposal={handleSupplierSubmitProposal}
              onBackToApp={() => {
                setCurrentUserRole(null);
                setCurrentScreen('login');
              }}
            />
          </div>
        )}

        {/* Modal: Gerenciar Fornecedores da Loja */}
        <ManageVendorsModal
          isOpen={isManageVendorsModalOpen}
          onClose={() => setIsManageVendorsModalOpen(false)}
          vendors={vendors}
          onAddVendor={handleAddVendor}
          onUpdateVendor={handleUpdateVendor}
          onDeleteVendor={handleDeleteVendor}
        />

        {/* Modal: Gerenciar Catálogo Permanente de Produtos da Loja */}
        <ManageProductsModal
          isOpen={isManageProductsModalOpen}
          onClose={() => setIsManageProductsModalOpen(false)}
          catalogProducts={catalogProducts}
          onAddProduct={handleAddCatalogProduct}
          onUpdateProduct={handleUpdateCatalogProduct}
          onDeleteProduct={handleDeleteCatalogProduct}
          onSelectForQuotation={(p) => {
            setIsManageProductsModalOpen(false);
            setLaunchInitialProducts((prev) => [...prev, p]);
            if (currentScreen !== 'launch-quotation') {
              setCurrentScreen('launch-quotation');
            }
          }}
        />

        {/* Modal: Histórico de Listas & Cotações Anteriores */}
        <QuotationsHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          historyList={quotationsHistory}
          onReuseQuotation={handleReuseQuotation}
          onDeleteFromHistory={handleDeleteFromHistory}
          onSelectQuotation={handleSelectQuotation}
        />

        {/* Modal: Disparo de Cotação via WhatsApp com Link Direto */}
        {dispatchQuotationData && (
          <WhatsAppDispatchModal
            isOpen={isWhatsAppModalOpen}
            onClose={() => setIsWhatsAppModalOpen(false)}
            quotation={dispatchQuotationData.quotation}
            storeName={currentStore?.name || 'Minha Loja'}
            storeWhatsApp={currentStore?.whatsapp}
            productsCount={dispatchQuotationData.productsCount}
            products={dispatchQuotationData.products}
            vendors={dispatchQuotationData.vendors}
            storeSlug={currentStore?.slug}
          />
        )}

        {/* Orders Drawer */}
        <OrdersDrawer
          isOpen={isOrdersDrawerOpen}
          onClose={() => setIsOrdersDrawerOpen(false)}
          orders={orders}
        />

        {/* Modal: Mensalidade da Loja & Pagamento Mercado Pago */}
        <ShopkeeperBillingModal
          isOpen={isBillingModalOpen}
          onClose={() => setIsBillingModalOpen(false)}
          store={currentStore}
          invoices={invoices}
          onPayInvoice={handleAdminMarkAsPaid}
        />

        {/* Order Placed Success Modal */}
        <OrderSuccessModal
          order={lastCreatedOrder}
          onClose={() => setLastCreatedOrder(null)}
        />

        {/* Banner Global de Consentimento de Cookies & LGPD */}
        <CookieConsentBanner />
      </div>
    </div>
  );
}
