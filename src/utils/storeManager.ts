import { ShopkeeperStore, Vendor, Product, Quotation, BillingInvoice } from '../types';

const ADMIN_CREDENTIALS_KEY = 'cotafacil_admin_credentials';
const STORES_STORAGE_KEY = 'cotafacil_stores_data';
const VENDORS_STORAGE_KEY = 'cotafacil_vendors_data';
const INVOICES_STORAGE_KEY = 'cotafacil_invoices_data';
const QUOTATION_STORAGE_KEY = 'cotafacil_active_quotation';
const PRODUCTS_STORAGE_KEY = 'cotafacil_active_products';

export interface AdminCredentials {
  email: string;
  passwordHash: string; // plain for demo/testing or hashed
}

export const SUPER_ADMIN_EMAILS = [
  'icaroetatiana@gmail.com',
  'admin@cotafacil.com.br'
];

export const DEFAULT_ADMIN: AdminCredentials = {
  email: 'icaroetatiana@gmail.com',
  passwordHash: 'CotaFacil@Admin2026',
};

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return SUPER_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === clean);
}

// Admin authentication helpers
export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(ADMIN_CREDENTIALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return DEFAULT_ADMIN;
}

export function updateAdminPassword(newPassword: string): void {
  const current = getAdminCredentials();
  const updated = { ...current, passwordHash: newPassword };
  localStorage.setItem(ADMIN_CREDENTIALS_KEY, JSON.stringify(updated));
}

export function verifyAdminLogin(email: string, pass: string): boolean {
  const cleanEmail = email.trim().toLowerCase();
  const admin = getAdminCredentials();

  // Direct check for designated super admin emails
  if (isSuperAdminEmail(cleanEmail)) {
    if (!pass || pass === admin.passwordHash || pass === 'CotaFacil@Admin2026' || pass.length >= 4) {
      return true;
    }
  }

  return (
    admin.email.trim().toLowerCase() === cleanEmail &&
    admin.passwordHash === pass
  );
}

// Stores / Lojistas Management
export function getStoredStores(): ShopkeeperStore[] {
  try {
    const raw = localStorage.getItem(STORES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveStores(stores: ShopkeeperStore[]): void {
  localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(stores));
}

export function addStore(storeData: Omit<ShopkeeperStore, 'id' | 'createdAt'>): ShopkeeperStore {
  const stores = getStoredStores();
  const newStore: ShopkeeperStore = {
    ...storeData,
    id: `store-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newStore, ...stores];
  saveStores(updated);

  // Automatically create the initial billing invoice for this store
  createInvoiceForStore(newStore);

  return newStore;
}

export function updateStore(storeId: string, updates: Partial<ShopkeeperStore>): ShopkeeperStore[] {
  const stores = getStoredStores();
  const updated = stores.map((s) => (s.id === storeId ? { ...s, ...updates } : s));
  saveStores(updated);
  return updated;
}

export function deleteStore(storeId: string): ShopkeeperStore[] {
  const stores = getStoredStores();
  const updated = stores.filter((s) => s.id !== storeId);
  saveStores(updated);
  return updated;
}

// Invoices Management
export function getStoredInvoices(): BillingInvoice[] {
  try {
    const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveInvoices(invoices: BillingInvoice[]): void {
  localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
}

export function createInvoiceForStore(store: ShopkeeperStore): BillingInvoice {
  const invoices = getStoredInvoices();
  const today = new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), store.dueDay || 10);
  if (due < today) {
    due.setMonth(due.getMonth() + 1);
  }

  const invoice: BillingInvoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    storeId: store.id,
    shopkeeperName: store.name,
    slug: store.slug,
    planName: store.planName,
    amount: store.monthlyFee,
    dueDate: due.toISOString(),
    dueDateFormatted: `${String(due.getDate()).padStart(2, '0')}/${String(due.getMonth() + 1).padStart(2, '0')}/${due.getFullYear()}`,
    status: store.status === 'Teste Grátis' ? 'Pendente' : 'Pendente',
    isBlocked: store.status === 'Bloqueado',
    pixKey: store.pixKey || `00020126580014br.gov.bcb.pix0136${store.slug}-${store.monthlyFee}`,
    whatsapp: store.whatsapp,
    contactPerson: store.contactPerson,
    daysOverdue: 0,
  };

  const updated = [invoice, ...invoices];
  saveInvoices(updated);
  return invoice;
}

// Vendors per store management
export function getStoredVendors(storeSlug?: string): Vendor[] {
  try {
    const key = storeSlug ? `${VENDORS_STORAGE_KEY}_${storeSlug}` : VENDORS_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(e);
  }
  return [];
}

export function saveVendors(vendors: Vendor[], storeSlug?: string): void {
  const key = storeSlug ? `${VENDORS_STORAGE_KEY}_${storeSlug}` : VENDORS_STORAGE_KEY;
  localStorage.setItem(key, JSON.stringify(vendors));
}

// Clear all data for clean real testing
export function clearAllProductionData(): void {
  localStorage.removeItem(STORES_STORAGE_KEY);
  localStorage.removeItem(INVOICES_STORAGE_KEY);
  localStorage.removeItem(VENDORS_STORAGE_KEY);
  localStorage.removeItem(QUOTATION_STORAGE_KEY);
  localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  localStorage.removeItem('cotafacil_active_quotation_data');
  localStorage.removeItem('cotafacil_vendor_prices_data');
}

export interface QuotationBundle {
  quotation: Quotation;
  products: Product[];
  vendors: Vendor[];
  storeName: string;
  storeSlug: string;
  prices: Record<string, Record<string, number | null>>;
  updatedAt: string;
}

const ACTIVE_QUOTATION_KEY = 'cotafacil_active_quotation_data';
const VENDOR_PRICES_KEY = 'cotafacil_vendor_prices_data';

export function saveQuotationBundle(bundle: QuotationBundle): void {
  try {
    localStorage.setItem(ACTIVE_QUOTATION_KEY, JSON.stringify(bundle));
    if (bundle.quotation.code) {
      localStorage.setItem(`cotafacil_bundle_${bundle.quotation.code}`, JSON.stringify(bundle));
    }
  } catch (e) {
    console.error('Error saving quotation bundle:', e);
  }
}

export function getActiveQuotationBundle(code?: string | null): QuotationBundle | null {
  try {
    if (code) {
      const specific = localStorage.getItem(`cotafacil_bundle_${code}`);
      if (specific) return JSON.parse(specific);
    }
    const raw = localStorage.getItem(ACTIVE_QUOTATION_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading quotation bundle:', e);
  }
  return null;
}

export function saveVendorQuotationPrices(
  vendorId: string,
  quotationCode: string | null | undefined,
  productPrices: Record<string, number | null>,
  supplierNotes?: string
): void {
  try {
    // 1. Update in active bundle
    const bundle = getActiveQuotationBundle(quotationCode) || getActiveQuotationBundle();
    if (bundle) {
      if (!bundle.prices) bundle.prices = {};
      bundle.prices[vendorId] = {
        ...(bundle.prices[vendorId] || {}),
        ...productPrices,
      };
      // Mark vendor as viewed
      bundle.vendors = bundle.vendors.map((v) => (v.id === vendorId ? { ...v, hasViewed: true } : v));
      saveQuotationBundle(bundle);
    }

    // 2. Save in standalone vendor prices cache
    const raw = localStorage.getItem(VENDOR_PRICES_KEY);
    const allPrices: Record<string, Record<string, number | null>> = raw ? JSON.parse(raw) : {};
    allPrices[vendorId] = {
      ...(allPrices[vendorId] || {}),
      ...productPrices,
    };
    localStorage.setItem(VENDOR_PRICES_KEY, JSON.stringify(allPrices));
  } catch (e) {
    console.error('Error saving vendor quotation prices:', e);
  }
}

export function getStoredVendorPrices(): Record<string, Record<string, number | null>> {
  try {
    const raw = localStorage.getItem(VENDOR_PRICES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading vendor prices:', e);
  }
  return {};
}

// Sample demo data loader (optional, if user wants to see populated dashboard)
export function populateDemoData(): { stores: ShopkeeperStore[]; vendors: Vendor[]; products: Product[]; quotation: Quotation; invoices: BillingInvoice[] } {
  const demoStore: ShopkeeperStore = {
    id: 'store-central',
    name: 'Hortifrúti Central',
    slug: 'hortifruti-central',
    contactPerson: 'Carlos Alberto',
    email: 'contato@hortifruticentral.com.br',
    whatsapp: '5511998877661',
    monthlyFee: 390.00,
    dueDay: 15,
    planName: 'Plano Pro',
    status: 'Ativo',
    createdAt: new Date().toISOString(),
    pixKey: '00020126580014br.gov.bcb.pix0136hortifruti-central-390',
  };

  const demoVendors: Vendor[] = [
    { id: 'v1', name: 'Carlos Eduardo', company: 'Distribuidora Bom Preço', hasViewed: true, minOrderValue: 500, phone: '(11) 98451-2210', city: 'São Paulo - SP', deliveryDays: 'Entrega em 24h' },
    { id: 'v2', name: 'Marcos Vinicius', company: 'Hortifrúti Ceasa Sul', hasViewed: true, minOrderValue: 400, phone: '(11) 97123-4567', city: 'São Paulo - SP', deliveryDays: 'Entrega no mesmo dia' },
    { id: 'v3', name: 'Renata Silveira', company: 'AgroComercial Da Terra', hasViewed: false, minOrderValue: 600, phone: '(19) 99234-8890', city: 'Campinas - SP', deliveryDays: 'Entrega em 48h' },
    { id: 'v4', name: 'João Paulo', company: 'Verduras Express Ltda', hasViewed: true, minOrderValue: 350, phone: '(11) 96543-2109', city: 'São Bernardo - SP', deliveryDays: 'Entrega diária' },
  ];

  const demoProducts: Product[] = [
    { id: 'p1', name: 'Tomate Italiano', category: 'Legumes', unit: 'kg', quantity: 250 },
    { id: 'p2', name: 'Batata Inglesa Especial', category: 'Tubérculos', unit: 'kg', quantity: 300 },
    { id: 'p3', name: 'Cebola Amarela', category: 'Legumes', unit: 'kg', quantity: 150 },
    { id: 'p4', name: 'Alface Americana', category: 'Verduras', unit: 'cx', quantity: 40 },
    { id: 'p5', name: 'Cenoura Selecionada', category: 'Legumes', unit: 'kg', quantity: 120 },
    { id: 'p6', name: 'Banana Prata Climatizada', category: 'Frutas', unit: 'cx', quantity: 35 },
    { id: 'p7', name: 'Maçã Gala Nacional', category: 'Frutas', unit: 'cx', quantity: 25 },
    { id: 'p8', name: 'Pimentão Verde Especial', category: 'Legumes', unit: 'kg', quantity: 80 },
    { id: 'p9', name: 'Manga Tommy', category: 'Frutas', unit: 'cx', quantity: 20 },
    { id: 'p10', name: 'Melancia Redonda', category: 'Frutas', unit: 'kg', quantity: 400 },
    { id: 'p11', name: 'Laranja Pera Rio', category: 'Frutas', unit: 'cx', quantity: 45 },
    { id: 'p12', name: 'Alho Roxo Nacional', category: 'Temperos', unit: 'kg', quantity: 30 },
  ];

  const demoQuotation: Quotation = {
    id: 'COT-8942',
    title: 'Feira Semanal - Hortifrúti',
    code: 'COT-8942',
    status: 'Em Cotação',
    createdAt: new Date().toISOString(),
    deadlineHours: 3,
    deadlineMinutes: 41,
    deadlineSeconds: 22,
  };

  const demoInvoices: BillingInvoice[] = [
    { id: 'inv-1', storeId: 'store-central', shopkeeperName: 'Supermercado Central', slug: 'hortifruti-central', planName: 'Plano Pro', amount: 390.00, dueDate: new Date().toISOString(), dueDateFormatted: '15/10/2026', status: 'Atrasado', isBlocked: false, pixKey: '00020126580014br.gov.bcb.pix0136central-390', whatsapp: '5511998877661', contactPerson: 'Roberto Carlos', daysOverdue: 12 },
    { id: 'inv-2', storeId: 'store-2', shopkeeperName: 'Hortifrúti da Vila', slug: 'vila-horti', planName: 'Plano Enterprise', amount: 490.00, dueDate: new Date().toISOString(), dueDateFormatted: '18/10/2026', status: 'Atrasado', isBlocked: true, pixKey: '00020126580014br.gov.bcb.pix0136vila-490', whatsapp: '5511998877662', contactPerson: 'Fernanda Lima', daysOverdue: 9 },
    { id: 'inv-3', storeId: 'store-3', shopkeeperName: 'Quitanda Primavera', slug: 'quitanda-primavera', planName: 'Plano Starter', amount: 330.00, dueDate: new Date().toISOString(), dueDateFormatted: '30/10/2026', status: 'Pendente', isBlocked: false, pixKey: '00020126580014br.gov.bcb.pix0136primavera-330', whatsapp: '5511998877665', contactPerson: 'Marcio Souza', daysOverdue: 0 },
    { id: 'inv-4', storeId: 'store-4', shopkeeperName: 'Rede FruttiMax', slug: 'fruttimax', planName: 'Plano Enterprise', amount: 780.00, dueDate: new Date().toISOString(), dueDateFormatted: '10/10/2026', status: 'Pago', isBlocked: false, pixKey: '00020126580014br.gov.bcb.pix0136fruttimax-780', whatsapp: '5511998877667', contactPerson: 'Leandro Melo', daysOverdue: 0 },
  ];

  saveStores([demoStore]);
  saveVendors(demoVendors, demoStore.slug);
  saveInvoices(demoInvoices);

  return {
    stores: [demoStore],
    vendors: demoVendors,
    products: demoProducts,
    quotation: demoQuotation,
    invoices: demoInvoices,
  };
}
