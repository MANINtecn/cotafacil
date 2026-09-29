/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Product, Vendor, PurchaseOrder, BillingInvoice, AppScreen, Quotation, ShopkeeperStore, UserRole } from './types';
import { calculateOptimizedBasket, formatCurrencyBRL } from './utils/calculations';
import { HeaderQuotation } from './components/HeaderQuotation';
import { FinancialSummaryCard } from './components/FinancialSummaryCard';
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
import { auth, db, testConnection, handleFirestoreError, OperationType, logOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
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
  QuotationBundle
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
  Store
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
  // Production Navigation & Role State
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('login');
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Stores & Active Store
  const [stores, setStores] = useState<ShopkeeperStore[]>(() => getStoredStores());
  const [currentStore, setCurrentStore] = useState<ShopkeeperStore | null>(() => {
    const list = getStoredStores();
    return list.length > 0 ? list[0] : null;
  });

  // Vendors for active store
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const initialList = getStoredStores();
    const activeSlug = initialList.length > 0 ? initialList[0].slug : undefined;
    return getStoredVendors(activeSlug);
  });

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
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [dispatchQuotationData, setDispatchQuotationData] = useState<{
    quotation: Quotation;
    vendors: Vendor[];
    productsCount: number;
  } | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<PurchaseOrder | null>(null);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Check URL parameters for direct supplier quoting access (?role=fornecedor&v=...)
  useEffect(() => {
    const handleUrlRouting = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const roleParam = params.get('role');
        const vParam = params.get('v') || params.get('vendorId');
        const cotParam = params.get('cot') || params.get('cotacao');

        // 1. Try to load the specific quotation bundle from localStorage
        let bundle = getActiveQuotationBundle(cotParam);

        // 2. If not found in localStorage or accessed from mobile/another browser, fetch from Firestore
        if ((!bundle || bundle.products.length === 0) && cotParam) {
          try {
            const snap = await getDoc(doc(db, 'quotations', cotParam));
            if (snap.exists()) {
              bundle = snap.data() as QuotationBundle;
              saveQuotationBundle(bundle);
            }
          } catch (e) {
            console.warn('Firestore load quotation attempt:', e);
          }
        }

        if (bundle) {
          setQuotation(bundle.quotation);
          setProducts(bundle.products);
          if (bundle.vendors && bundle.vendors.length > 0) {
            setVendors(bundle.vendors);
          }
          if (bundle.prices) {
            setPrices(bundle.prices);
          }
        }

        // 3. Direct vendor routing into Supplier Quoting Portal
        if (roleParam === 'fornecedor' || vParam) {
          if (vParam) setSelectedVendorId(vParam);
          setCurrentUserRole('fornecedor');
          setCurrentScreen('supplier-portal');
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

  // Firebase auth sync
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        const email = currentUser.email?.toLowerCase();
        // Check if the signed in Google account is the Super Admin
        if (email === 'icaroetatiana@gmail.com' || isSuperAdminEmail(email)) {
          setCurrentUserRole('admin');
          setCurrentScreen((prev) => (prev === 'login' || prev === 'super-admin-login' ? 'admin-billing' : prev));
        }

        try {
          const q = query(
            collection(db, 'orders'),
            where('userId', '==', currentUser.uid)
          );
          const snap = await getDocs(q);
          const loadedOrders: PurchaseOrder[] = [];
          snap.forEach((docItem) => {
            loadedOrders.push(docItem.data() as PurchaseOrder);
          });
          if (loadedOrders.length > 0) {
            setOrders(loadedOrders);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, 'orders');
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Update vendors whenever currentStore changes
  useEffect(() => {
    if (currentStore) {
      const vList = getStoredVendors(currentStore.slug);
      setVendors(vList);
    }
  }, [currentStore]);

  // Compute dynamic market-wide optimized total
  const optimizedData = calculateOptimizedBasket(products, prices);
  const selectedVendor = vendors.find((v) => v.id === selectedVendorId) || vendors[0] || {
    id: 'v1',
    name: 'Representante',
    company: 'Distribuidora',
    hasViewed: false,
    minOrderValue: 500,
  };

  // --- LOGIN & REGISTRATION HANDLERS ---
  const handleLoginAsLojista = (slugOrEmail?: string) => {
    const allStores = getStoredStores();
    let target = allStores.find(
      (s) => s.slug === slugOrEmail || s.email.toLowerCase() === slugOrEmail?.toLowerCase()
    );

    // If not found but stores exist, pick first; or if completely empty, prompt or create
    if (!target && allStores.length > 0) {
      target = allStores[0];
    } else if (!target) {
      // Create a clean store for this user
      target = addStore({
        name: slugOrEmail ? slugOrEmail.replace(/[-_]/g, ' ') : 'Meu Comércio',
        slug: slugOrEmail || 'minha-loja',
        contactPerson: 'Lojista',
        email: 'contato@minhaloja.com.br',
        whatsapp: '5511999999999',
        monthlyFee: 390.00,
        dueDay: 10,
        planName: 'Plano Pro',
        status: 'Ativo',
      });
      setStores(getStoredStores());
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
    newVendorPrices: Record<string, number | null>,
    notes: string
  ) => {
    // 1. Update in-memory state
    setPrices((prev) => ({
      ...prev,
      [selectedVendorId]: {
        ...(prev[selectedVendorId] || {}),
        ...newVendorPrices,
      },
    }));

    setVendors((prev) =>
      prev.map((v) =>
        v.id === selectedVendorId
          ? { ...v, hasViewed: true, deliveryDays: notes || v.deliveryDays }
          : v
      )
    );

    // 2. Persist to storage
    saveVendorQuotationPrices(selectedVendorId, quotation.code, newVendorPrices, notes);

    // 3. Persist to Firestore if available
    try {
      if (quotation.code) {
        await setDoc(
          doc(db, 'quotations', quotation.code),
          {
            prices: {
              [selectedVendorId]: newVendorPrices,
            },
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      console.warn('Firestore proposal update optional:', e);
    }
  };

  const handleSuperAdminLoginSuccess = () => {
    setCurrentUserRole('admin');
    setCurrentScreen('admin-billing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    setCurrentUserRole(null);
    setCurrentScreen('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // --- QUOTATION CREATION / LAUNCH ---
  const handleLaunchQuotation = (
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

    // Generate initial competitive price proposals for selected suppliers
    const updatedPrices: Record<string, Record<string, number | null>> = {};
    vendors.forEach((v) => {
      updatedPrices[v.id] = {};
      const shouldParticipate = selectedVendorIds.includes(v.id);
      newProducts.forEach((p) => {
        if (!shouldParticipate) {
          updatedPrices[v.id][p.id] = null;
        } else {
          const base = p.unit === 'cx' ? 45 : p.unit === 'sc' ? 35 : p.unit === 'un' || p.unit === 'pc' ? 18.5 : 8.5;
          const randomFactor = 0.85 + Math.random() * 0.3;
          const val = Math.round(base * randomFactor * 10) / 10;
          updatedPrices[v.id][p.id] = val;
        }
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
      storeName: currentStore?.name || 'A Casa do Senhor',
      storeSlug: currentStore?.slug || 'minha-loja',
      prices: updatedPrices,
      updatedAt: new Date().toISOString(),
    };
    saveQuotationBundle(bundle);

    try {
      setDoc(doc(db, 'quotations', code), bundle, { merge: true }).catch((err) =>
        console.warn('Firestore quotation save notice:', err)
      );
    } catch (e) {
      console.warn('Firestore quotation save error:', e);
    }

    if (selectedVendors.length > 0) {
      const firstVendor = selectedVendors[0];
      if (firstVendor && firstVendor.phone) {
        const digits = firstVendor.phone.replace(/\D/g, '');
        const cleanPhone = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
        const link = `${window.location.origin}${window.location.pathname}?role=fornecedor&v=${firstVendor.id}&cot=${code}`;
        const deadlineStr = deadlineAt
          ? new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(deadlineAt))
          : `${deadlineHours} horas`;

        const msg = `Olá, *${firstVendor.name}* (${firstVendor.company})!\n\n` +
          `Aqui é da loja *${currentStore?.name || 'Comércio'}*.\n` +
          `Acabamos de abrir uma nova cotação: *${updatedQuotation.title}* (${code}).\n\n` +
          `📦 *Total de itens:* ${newProducts.length} produtos\n` +
          `⏰ *Prazo final para resposta:* ${deadlineStr}\n\n` +
          `Acesse o link direto abaixo para preencher os seus preços:\n` +
          `👉 ${link}\n\n` +
          `Aguardamos sua melhor proposta. Obrigado!`;

        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
        try {
          window.open(waUrl, '_blank');
        } catch {
          // Handled in modal
        }
      }

      setDispatchQuotationData({
        quotation: updatedQuotation,
        vendors: selectedVendors,
        productsCount: newProducts.length,
      });
      setIsWhatsAppModalOpen(true);
    }

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
          await setDoc(doc(db, 'orders', newOrder.id), {
            ...newOrder,
            userId: user.uid,
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, 'orders');
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
        {/* 4. PAINEL PRINCIPAL DO LOJISTA (COTAÇÃO & AUDITORIA)     */}
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
              onLaunchQuotation={() => setCurrentScreen('launch-quotation')}
              onOpenManageVendors={() => setIsManageVendorsModalOpen(true)}
              onLogout={handleLogout}
            />

            <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-5 space-y-6 flex-1">
              {/* Onboarding Guide se o lojista ainda não tiver fornecedores ou produtos */}
              {vendors.length === 0 && (
                <div className="p-6 rounded-3xl bg-neutral-900 text-white shadow-xl space-y-4 border border-neutral-800">
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <span>Guia de Início Rápido do Lojista</span>
                  </div>

                  <div>
                    <h2 className="text-xl font-bold tracking-tight">
                      Bem-vindo ao CotaFácil B2B, {currentStore?.name || 'Lojista'}!
                    </h2>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xl leading-relaxed">
                      Sua conta está criada e pronta para uso em produção. Para realizar sua primeira cotação inteligente com cálculo de menor preço, siga os 3 passos:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <div className="font-bold text-xs text-white">Cadastre Fornecedores</div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        Adicione seus distribuidores, contatos de WhatsApp e pedido mínimo.
                      </p>
                      <button
                        onClick={() => setIsManageVendorsModalOpen(true)}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-white text-neutral-950 font-bold text-[11px] hover:bg-neutral-100 transition-colors cursor-pointer"
                      >
                        + Cadastrar Fornecedores
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                        2
                      </span>
                      <div className="font-bold text-xs text-white">Monte sua Lista</div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        Cadastre seus produtos com nome, quantidade e unidade.
                      </p>
                      <button
                        onClick={() => setCurrentScreen('launch-quotation')}
                        className="w-full py-1.5 px-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-[11px] hover:bg-emerald-400 transition-colors cursor-pointer"
                      >
                        + Lançar Lista
                      </button>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-neutral-950 font-black text-xs flex items-center justify-center">
                        3
                      </span>
                      <div className="font-bold text-xs text-white">Audite Menores Preços</div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        O sistema calcula o menor preço e valida o pedido mínimo em tempo real.
                      </p>
                      <div className="text-[10px] text-neutral-500 font-mono-num pt-1">
                        Zero ruído operacional
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial KPI Cards */}
              <FinancialSummaryCard
                totalOptimized={optimizedData.totalOptimized}
                itemsWithQuotes={optimizedData.itemsWithQuotes}
                totalItems={optimizedData.totalItems}
              />

              {/* Responsive 2-Column Section on Desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side: Suppliers Grid / Vertical list (Spans 8 cols on desktop) */}
                <div className="lg:col-span-8 space-y-4">
                  {vendors.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-dashed border-neutral-300 text-center space-y-3">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900">Nenhum fornecedor vinculado a esta loja</h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Cadastre os distribuidores que você costuma cotar.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsManageVendorsModalOpen(true)}
                        className="py-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                      >
                        + Cadastrar Primeiro Fornecedor
                      </button>
                    </div>
                  ) : (
                    <VendorsList
                      vendors={vendors}
                      products={products}
                      prices={prices}
                      onSelectVendor={handleOpenVendorAnalytics}
                    />
                  )}

                  {/* Dica de Produtividade */}
                  <div className="p-4 rounded-2xl border border-neutral-200/90 bg-white shadow-2xs text-xs text-neutral-600 flex items-start gap-3">
                    <Info className="w-4 h-4 text-neutral-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-neutral-900 block mb-0.5">Dica Operacional:</span>
                      <p className="leading-relaxed text-neutral-600">
                        O algoritmo cruza os valores unitários de cada representante e calcula o menor preço de balcão disponível. Clique em qualquer fornecedor para inspecionar os lances item a item e conferir se ele atinge o <strong>Pedido Mínimo</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Side: Desktop Cesta de Produtos em Cotação (Spans 4 cols on desktop) */}
                <div className="hidden lg:block lg:col-span-4 bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-neutral-700" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                        Cesta de Produtos ({products.length})
                      </h3>
                    </div>
                    <button
                      onClick={() => setCurrentScreen('launch-quotation')}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nova Lista</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {products.length === 0 ? (
                      <div className="p-6 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                        Nenhum produto cadastrado nesta lista. Clique em "+ Nova Lista" para lançar.
                      </div>
                    ) : (
                      products.map((p) => {
                        const itemOpt = optimizedData.itemDetails.find((d) => d.productId === p.id);
                        return (
                          <div
                            key={p.id}
                            className="p-2.5 rounded-xl border border-neutral-100 hover:border-neutral-200 bg-neutral-50/50 hover:bg-neutral-50 transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-semibold text-neutral-900 truncate max-w-[170px]">{p.name}</div>
                              <div className="text-[11px] text-neutral-500">
                                Qtd: <span className="font-mono-num font-medium text-neutral-700">{p.quantity} {p.unit}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {itemOpt?.minPrice ? (
                                <div>
                                  <div className="text-xs font-bold font-mono-num text-emerald-700">
                                    {formatCurrencyBRL(itemOpt.minPrice)}
                                  </div>
                                  <div className="text-[10px] text-neutral-400">menor oferta</div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-neutral-400">—</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                    <span className="text-neutral-500">Total Otimizado:</span>
                    <span className="font-mono-num font-bold text-sm text-neutral-900">
                      {formatCurrencyBRL(optimizedData.totalOptimized)}
                    </span>
                  </div>
                </div>
              </div>
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
              onBack={() => setCurrentScreen('quotation')}
              onLaunchQuotation={handleLaunchQuotation}
              initialProducts={products}
              vendors={vendors}
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
              storeName={currentStore?.name || 'A Casa do Senhor'}
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

        {/* Modal: Disparo de Cotação via WhatsApp com Link Direto */}
        {dispatchQuotationData && (
          <WhatsAppDispatchModal
            isOpen={isWhatsAppModalOpen}
            onClose={() => setIsWhatsAppModalOpen(false)}
            quotation={dispatchQuotationData.quotation}
            storeName={currentStore?.name || 'Comércio'}
            productsCount={dispatchQuotationData.productsCount}
            vendors={dispatchQuotationData.vendors}
          />
        )}

        {/* Orders Drawer */}
        <OrdersDrawer
          isOpen={isOrdersDrawerOpen}
          onClose={() => setIsOrdersDrawerOpen(false)}
          orders={orders}
        />

        {/* Order Placed Success Modal */}
        <OrderSuccessModal
          order={lastCreatedOrder}
          onClose={() => setLastCreatedOrder(null)}
        />
      </div>
    </div>
  );
}
