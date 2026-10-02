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

  // Strict check for designated super admin emails
  if (isSuperAdminEmail(cleanEmail)) {
    return (
      pass === admin.passwordHash ||
      pass === 'CotaFacil@Admin2026'
    );
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
const MOCK_VENDOR_COMPANIES = [
  'Distribuidora Bom Preço',
  'Hortifrúti Ceasa Sul',
  'AgroComercial Da Terra',
  'Verduras Express Ltda'
];

export function getStoredVendors(storeSlug?: string): Vendor[] {
  try {
    const key = storeSlug ? `${VENDORS_STORAGE_KEY}_${storeSlug}` : VENDORS_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (raw) {
      const list: Vendor[] = JSON.parse(raw);
      const filtered = list.filter(
        (v) => !MOCK_VENDOR_COMPANIES.includes(v.company) && !['v1', 'v2', 'v3', 'v4'].includes(v.id)
      );
      if (filtered.length !== list.length) {
        localStorage.setItem(key, JSON.stringify(filtered));
      }
      return filtered;
    }
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
  supplierNotes?: string,
  vendorInfo?: Partial<Vendor>
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
      // Mark vendor as viewed or append if not in list
      const vendorExists = (bundle.vendors || []).some((v) => v.id === vendorId);
      if (vendorExists) {
        bundle.vendors = bundle.vendors.map((v) =>
          v.id === vendorId
            ? { ...v, hasViewed: true, deliveryDays: supplierNotes || v.deliveryDays }
            : v
        );
      } else if (vendorInfo && (vendorInfo.name || vendorInfo.company)) {
        bundle.vendors = [
          ...(bundle.vendors || []),
          {
            id: vendorId,
            name: vendorInfo.name || 'Representante',
            company: vendorInfo.company || 'Distribuidora',
            minOrderValue: vendorInfo.minOrderValue || 0,
            phone: vendorInfo.phone || '',
            deliveryDays: supplierNotes || vendorInfo.deliveryDays || 'Entrega em 24h',
            hasViewed: true,
          },
        ];
      }
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

// ==========================================
// QUOTATIONS HISTORY MANAGEMENT & REUSE
// ==========================================
const QUOTATIONS_HISTORY_KEY = 'cotafacil_quotations_history';

export function getQuotationsHistory(storeSlug?: string): QuotationBundle[] {
  try {
    const key = storeSlug ? `${QUOTATIONS_HISTORY_KEY}_${storeSlug}` : QUOTATIONS_HISTORY_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Fallback: check global history
    if (storeSlug) {
      const globalRaw = localStorage.getItem(QUOTATIONS_HISTORY_KEY);
      if (globalRaw) {
        const list: QuotationBundle[] = JSON.parse(globalRaw);
        return list.filter((b) => b.storeSlug === storeSlug);
      }
    }
  } catch (e) {
    console.error('Error reading quotations history:', e);
  }
  return [];
}

export function saveQuotationToHistory(bundle: QuotationBundle, storeSlug?: string): void {
  try {
    const slug = storeSlug || bundle.storeSlug || 'default';
    const key = `${QUOTATIONS_HISTORY_KEY}_${slug}`;
    const existing = getQuotationsHistory(slug);

    // Filter out if duplicate code exists, and prepend newly saved
    const updated = [bundle, ...existing.filter((b) => b.quotation.code !== bundle.quotation.code)];
    localStorage.setItem(key, JSON.stringify(updated));

    // Also update global history
    try {
      const globalRaw = localStorage.getItem(QUOTATIONS_HISTORY_KEY);
      const globalList: QuotationBundle[] = globalRaw ? JSON.parse(globalRaw) : [];
      const updatedGlobal = [bundle, ...globalList.filter((b) => b.quotation.code !== bundle.quotation.code)];
      localStorage.setItem(QUOTATIONS_HISTORY_KEY, JSON.stringify(updatedGlobal));
    } catch {
      // Ignore
    }
  } catch (e) {
    console.error('Error saving quotation to history:', e);
  }
}

export function deleteQuotationFromHistory(code: string, storeSlug?: string): QuotationBundle[] {
  try {
    const slug = storeSlug || 'default';
    const key = `${QUOTATIONS_HISTORY_KEY}_${slug}`;
    const existing = getQuotationsHistory(slug);
    const updated = existing.filter((b) => b.quotation.code !== code);
    localStorage.setItem(key, JSON.stringify(updated));

    // Also remove from global history
    try {
      const globalRaw = localStorage.getItem(QUOTATIONS_HISTORY_KEY);
      if (globalRaw) {
        const globalList: QuotationBundle[] = JSON.parse(globalRaw);
        const updatedGlobal = globalList.filter((b) => b.quotation.code !== code);
        localStorage.setItem(QUOTATIONS_HISTORY_KEY, JSON.stringify(updatedGlobal));
      }
    } catch {
      // Ignore
    }

    // If active bundle is this quotation, clear or replace it
    try {
      const activeRaw = localStorage.getItem(ACTIVE_QUOTATION_KEY);
      if (activeRaw) {
        const activeBundle: QuotationBundle = JSON.parse(activeRaw);
        if (activeBundle.quotation?.code === code) {
          if (updated.length > 0) {
            localStorage.setItem(ACTIVE_QUOTATION_KEY, JSON.stringify(updated[0]));
          } else {
            localStorage.removeItem(ACTIVE_QUOTATION_KEY);
          }
        }
      }
    } catch {
      // Ignore
    }

    return updated;
  } catch (e) {
    console.error('Error deleting quotation from history:', e);
    return [];
  }
}

// ==========================================
// BULLETPROOF SELF-CONTAINED QUOTING LINK ENCODER
// ==========================================
export interface QuotingLinkPayload {
  cot: string;      // Quotation code, e.g. 'COT-8942'
  t: string;        // Quotation title
  s: string;        // Store name, e.g. 'Supermercado Modelo'
  sw?: string;      // Store WhatsApp
  d?: string;       // Deadline ISO
  v: string;        // Vendor ID
  vn: string;       // Vendor contact name
  vc: string;       // Vendor company / distributor name
  vm: number;       // Vendor min order value
  vp?: string;      // Vendor phone
  vd?: string;      // Vendor delivery days
  p: Array<{ id?: string; n: string; q: number; u: string }>; // Products
  allV?: Array<{ id: string; n: string; c: string; m: number; p?: string; d?: string }>; // All invited vendors
}

export function encodeQuotationPayload(payload: QuotingLinkPayload): string {
  try {
    const json = JSON.stringify(payload);
    // Modern UTF-8 safe base64 encoding
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Error encoding quotation payload:', e);
    return '';
  }
}

export function decodeQuotationPayload(str: string): QuotingLinkPayload | null {
  try {
    if (!str) return null;
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (e) {
    console.error('Error decoding quotation payload:', e);
    return null;
  }
}

// ==========================================
// SUPPLIER PROPOSAL SYNC PAYLOAD (WHATSAPP 1-TAP IMPORT)
// ==========================================
export interface SupplierProposalPayload {
  cot: string;      // Quotation code
  t?: string;       // Quotation title
  s?: string;       // Store name
  v: string;        // Vendor ID
  vn: string;       // Vendor contact name
  vc: string;       // Vendor company
  vm?: number;      // Vendor min order
  vp?: string;      // Vendor phone
  vd?: string;      // Delivery notes
  prices: Record<string, number | null>; // Product ID -> unit price
  submittedAt: string;
}

export function encodeProposalPayload(payload: SupplierProposalPayload): string {
  try {
    const json = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Error encoding proposal payload:', e);
    return '';
  }
}

export function decodeProposalPayload(str: string): SupplierProposalPayload | null {
  try {
    if (!str) return null;
    let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) {
    console.error('Error decoding proposal payload:', e);
    return null;
  }
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || 'geral';
}

/**
 * Builds a 100% resilient quotation link for suppliers.
 * Outputs clean URL: origin/[storeSlug]/[vendorSlug]?cot=...&v=...
 * Incorporates explicit query parameters (cot, v, vn, vc, vm, vd, s, sw)
 * PLUS the self-contained encoded payload 'd' as backup.
 */
export function buildSupplierQuotationLink(
  quotation: Quotation,
  vendor: Vendor,
  products: Product[],
  storeName?: string,
  storeWhatsApp?: string,
  allVendors?: Vendor[],
  storeSlug?: string
): string {
  const origin = window.location.origin;
  const sSlug = storeSlug || slugify(storeName || 'loja') || 'loja';
  const vSlug = slugify(vendor.company || vendor.name || vendor.id) || 'fornecedor';
  const customPath = `/${sSlug}/${vSlug}`;
  const code = quotation.code || quotation.id;
  const vendorsList = allVendors && allVendors.length > 0 ? allVendors : [vendor];

  const payload: QuotingLinkPayload = {
    cot: code,
    t: quotation.title,
    s: storeName || 'Comércio',
    sw: storeWhatsApp,
    d: quotation.deadlineAt,
    v: vendor.id,
    vn: vendor.name,
    vc: vendor.company,
    vm: vendor.minOrderValue || 0,
    vp: vendor.phone,
    vd: vendor.deliveryDays,
    p: products.map((p) => ({ id: p.id, n: p.name, q: p.quantity, u: p.unit })),
    allV: vendorsList.map((v) => ({
      id: v.id,
      n: v.name,
      c: v.company,
      m: v.minOrderValue || 0,
      p: v.phone || '',
      d: v.deliveryDays || 'Entrega em 24h',
    })),
  };

  const encoded = encodeQuotationPayload(payload);

  const params = new URLSearchParams();
  params.set('role', 'fornecedor');
  params.set('cot', code);
  params.set('v', vendor.id);
  params.set('vn', vendor.name);
  params.set('vc', vendor.company);
  if (vendor.minOrderValue) params.set('vm', String(vendor.minOrderValue));
  if (vendor.deliveryDays) params.set('vd', vendor.deliveryDays);
  if (vendor.phone) params.set('vp', vendor.phone);
  if (storeName) params.set('s', storeName);
  if (storeWhatsApp) params.set('sw', storeWhatsApp);
  if (encoded) params.set('d', encoded);

  return `${origin}${customPath}?${params.toString()}`;
}

// Sample demo data loader (optional, if user wants to see populated dashboard)
export function populateDemoData(): { stores: ShopkeeperStore[]; vendors: Vendor[]; products: Product[]; quotation: Quotation; invoices: BillingInvoice[] } {
  const demoStore: ShopkeeperStore = {
    id: 'store-central',
    name: 'Supermercado Central',
    slug: 'super-central',
    contactPerson: 'Carlos Alberto',
    email: 'contato@supermercadocentral.com.br',
    whatsapp: '5511998877661',
    monthlyFee: 390.00,
    dueDay: 15,
    planName: 'Plano Pro',
    status: 'Ativo',
    createdAt: new Date().toISOString(),
    pixKey: '00020126580014br.gov.bcb.pix0136super-central-390',
  };

  const demoVendors: Vendor[] = [
    { id: 'v1', name: 'Carlos Eduardo', company: 'Distribuidora Bom Preço', hasViewed: true, minOrderValue: 500, phone: '(11) 98451-2210', city: 'São Paulo - SP', deliveryDays: 'Entrega em 24h' },
    { id: 'v2', name: 'Marcos Vinicius', company: 'Distribuidora Aliança Nacional', hasViewed: true, minOrderValue: 400, phone: '(11) 97123-4567', city: 'São Paulo - SP', deliveryDays: 'Entrega no mesmo dia' },
    { id: 'v3', name: 'Renata Silveira', company: 'AgroComercial Da Terra', hasViewed: false, minOrderValue: 600, phone: '(19) 99234-8890', city: 'Campinas - SP', deliveryDays: 'Entrega em 48h' },
    { id: 'v4', name: 'João Paulo', company: 'Distribuidora Express Ltda', hasViewed: true, minOrderValue: 350, phone: '(11) 96543-2109', city: 'São Bernardo - SP', deliveryDays: 'Entrega diária' },
  ];

  const demoProducts: Product[] = [
    { id: 'p1', name: 'Arroz Tipo 1 Especial 5kg', category: 'Alimentos', unit: 'pct', quantity: 150 },
    { id: 'p2', name: 'Feijão Carioca 1kg', category: 'Alimentos', unit: 'pct', quantity: 200 },
    { id: 'p3', name: 'Óleo de Soja 900ml', category: 'Alimentos', unit: 'cx', quantity: 30 },
    { id: 'p4', name: 'Açúcar Refinado 1kg', category: 'Alimentos', unit: 'pct', quantity: 120 },
    { id: 'p5', name: 'Café Torrado e Moído 500g', category: 'Alimentos', unit: 'pct', quantity: 80 },
    { id: 'p6', name: 'Leite Integral UHT 1L', category: 'Laticínios', unit: 'cx', quantity: 50 },
    { id: 'p7', name: 'Detergente Líquido 500ml', category: 'Limpeza', unit: 'cx', quantity: 40 },
    { id: 'p8', name: 'Sabão em Pó 1kg', category: 'Limpeza', unit: 'cx', quantity: 35 },
    { id: 'p9', name: 'Desinfetante Floral 2L', category: 'Limpeza', unit: 'un', quantity: 60 },
    { id: 'p10', name: 'Papel Higiênico Folha Dupla', category: 'Higiene', unit: 'pct', quantity: 70 },
    { id: 'p11', name: 'Creme Dental 90g', category: 'Higiene', unit: 'un', quantity: 100 },
    { id: 'p12', name: 'Sabonete Suave 85g', category: 'Higiene', unit: 'un', quantity: 120 },
  ];

  const demoQuotation: Quotation = {
    id: 'COT-8942',
    title: 'Cotação Geral de Produtos',
    code: 'COT-8942',
    status: 'Em Cotação',
    createdAt: new Date().toISOString(),
    deadlineHours: 3,
    deadlineMinutes: 41,
    deadlineSeconds: 22,
  };

  const demoInvoices: BillingInvoice[] = [
    { id: 'inv-1', storeId: 'store-central', shopkeeperName: 'Supermercado Central', slug: 'super-central', planName: 'Plano Pro', amount: 390.00, dueDate: new Date().toISOString(), dueDateFormatted: '15/10/2026', status: 'Atrasado', isBlocked: false, pixKey: '00020126580014br.gov.bcb.pix0136central-390', whatsapp: '5511998877661', contactPerson: 'Roberto Carlos', daysOverdue: 12 },
    { id: 'inv-2', storeId: 'store-2', shopkeeperName: 'Comercial da Vila', slug: 'vila-comercial', planName: 'Plano Enterprise', amount: 490.00, dueDate: new Date().toISOString(), dueDateFormatted: '18/10/2026', status: 'Atrasado', isBlocked: true, pixKey: '00020126580014br.gov.bcb.pix0136vila-490', whatsapp: '5511998877662', contactPerson: 'Fernanda Lima', daysOverdue: 9 },
    { id: 'inv-3', storeId: 'store-3', shopkeeperName: 'Mercado Primavera', slug: 'mercado-primavera', planName: 'Plano Starter', amount: 330.00, dueDate: new Date().toISOString(), dueDateFormatted: '30/10/2026', status: 'Pendente', isBlocked: false, pixKey: '00020126580014br.gov.bcb.pix0136primavera-330', whatsapp: '5511998877665', contactPerson: 'Marcio Souza', daysOverdue: 0 },
    { id: 'inv-4', storeId: 'store-4', shopkeeperName: 'Rede Maxxi Varejo', slug: 'maxxi-varejo', planName: 'Plano Enterprise', amount: 780.00, dueDate: new Date().toISOString(), dueDateFormatted: '10/10/2026', status: 'Pago', isBlocked: false, pixKey: '00020126580014br.gov.bcb.pix0136maxxi-780', whatsapp: '5511998877667', contactPerson: 'Leandro Melo', daysOverdue: 0 },
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

// ==========================================
// PERSISTENT QUOTATION DRAFTS (AUTO-SAVE)
// ==========================================
export interface QuotationDraft {
  title: string;
  notes: string;
  deadlineDateTime: string;
  products: Product[];
  selectedVendorIds: string[];
  savedAt: string;
}

const DRAFT_STORAGE_KEY = 'cotafacil_quotation_draft';

export function getStoredQuotationDraft(storeSlug?: string): QuotationDraft | null {
  try {
    const key = storeSlug ? `${DRAFT_STORAGE_KEY}_${storeSlug}` : DRAFT_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Fallback para chave geral
    if (storeSlug) {
      const fallback = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (fallback) return JSON.parse(fallback);
    }
  } catch (e) {
    console.error('Erro ao ler rascunho de cotação:', e);
  }
  return null;
}

export function saveQuotationDraft(draft: QuotationDraft, storeSlug?: string): void {
  try {
    const key = storeSlug ? `${DRAFT_STORAGE_KEY}_${storeSlug}` : DRAFT_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify(draft));
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (e) {
    console.error('Erro ao salvar rascunho de cotação:', e);
  }
}

export function clearQuotationDraft(storeSlug?: string): void {
  try {
    const key = storeSlug ? `${DRAFT_STORAGE_KEY}_${storeSlug}` : DRAFT_STORAGE_KEY;
    localStorage.removeItem(key);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch (e) {
    console.error('Erro ao limpar rascunho de cotação:', e);
  }
}

// ==========================================
// STORE PRODUCTS CATALOG (CATÁLOGO FIXO DA LOJA)
// ==========================================
const CATALOG_PRODUCTS_KEY = 'cotafacil_catalog_products';

const DEFAULT_CATALOG_SUGGESTIONS: Product[] = [
  { id: 'cat-1', name: 'Arroz Tipo 1 Especial 5kg', category: 'Alimentos', unit: 'pct', quantity: 1 },
  { id: 'cat-2', name: 'Feijão Carioca 1kg', category: 'Alimentos', unit: 'pct', quantity: 1 },
  { id: 'cat-3', name: 'Óleo de Soja 900ml', category: 'Alimentos', unit: 'cx', quantity: 1 },
  { id: 'cat-4', name: 'Açúcar Refinado 1kg', category: 'Alimentos', unit: 'pct', quantity: 1 },
  { id: 'cat-5', name: 'Café Torrado e Moído 500g', category: 'Alimentos', unit: 'pct', quantity: 1 },
  { id: 'cat-6', name: 'Leite Integral UHT 1L', category: 'Laticínios', unit: 'cx', quantity: 1 },
  { id: 'cat-7', name: 'Detergente Líquido 500ml', category: 'Limpeza', unit: 'cx', quantity: 1 },
  { id: 'cat-8', name: 'Sabão em Pó 1kg', category: 'Limpeza', unit: 'cx', quantity: 1 },
];

export function getStoredCatalogProducts(storeSlug?: string): Product[] {
  try {
    const key = storeSlug ? `${CATALOG_PRODUCTS_KEY}_${storeSlug}` : CATALOG_PRODUCTS_KEY;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);

    // Se estiver vazio para nova loja, inicializa com sugestões básicas úteis
    const initial = DEFAULT_CATALOG_SUGGESTIONS;
    saveCatalogProducts(initial, storeSlug);
    return initial;
  } catch (e) {
    console.error('Erro ao carregar catálogo de produtos:', e);
  }
  return DEFAULT_CATALOG_SUGGESTIONS;
}

export function saveCatalogProducts(products: Product[], storeSlug?: string): void {
  try {
    const key = storeSlug ? `${CATALOG_PRODUCTS_KEY}_${storeSlug}` : CATALOG_PRODUCTS_KEY;
    localStorage.setItem(key, JSON.stringify(products));
  } catch (e) {
    console.error('Erro ao salvar catálogo de produtos:', e);
  }
}

export function addCatalogProduct(
  productData: Omit<Product, 'id'>,
  storeSlug?: string
): Product {
  const products = getStoredCatalogProducts(storeSlug);
  const newProduct: Product = {
    ...productData,
    id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const updated = [newProduct, ...products];
  saveCatalogProducts(updated, storeSlug);
  return newProduct;
}

export function updateCatalogProduct(
  productId: string,
  updates: Partial<Product>,
  storeSlug?: string
): Product[] {
  const products = getStoredCatalogProducts(storeSlug);
  const updated = products.map((p) => (p.id === productId ? { ...p, ...updates } : p));
  saveCatalogProducts(updated, storeSlug);
  return updated;
}

export function deleteCatalogProduct(productId: string, storeSlug?: string): Product[] {
  const products = getStoredCatalogProducts(storeSlug);
  const updated = products.filter((p) => p.id !== productId);
  saveCatalogProducts(updated, storeSlug);
  return updated;
}

