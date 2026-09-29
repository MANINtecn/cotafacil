export interface ShopkeeperStore {
  id: string;
  name: string;
  slug: string;
  contactPerson: string;
  email: string;
  whatsapp: string;
  monthlyFee: number;
  dueDay: number;
  planName: string;
  status: 'Ativo' | 'Bloqueado' | 'Teste Grátis';
  createdAt: string;
  trialEndsAt?: string;
  pixKey?: string;
  notes?: string;
}

export interface Product {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  benchmarkPrice?: number;
}

export interface Vendor {
  id: string;
  name: string;
  company: string;
  hasViewed: boolean;
  minOrderValue: number;
  phone?: string;
  city?: string;
  deliveryDays?: string;
}

export type PriceStatus = 'blank' | 'expensive' | 'best' | 'tied';

export type InvoiceStatus = 'Pago' | 'Pendente' | 'Atrasado';

export interface BillingInvoice {
  id: string;
  storeId?: string;
  shopkeeperName: string;
  slug: string;
  planName: string;
  amount: number;
  dueDate: string; // ISO date string or formatted date
  dueDateFormatted: string;
  status: InvoiceStatus;
  isBlocked: boolean;
  pixKey: string;
  whatsapp: string;
  contactPerson: string;
  daysOverdue?: number;
}

export type AppScreen =
  | 'login'
  | 'super-admin-login'
  | 'quotation'
  | 'vendor-analytics'
  | 'supplier-portal'
  | 'admin-billing'
  | 'launch-quotation'
  | 'manage-vendors';

export type UserRole = 'lojista' | 'fornecedor' | 'admin';

export interface ProductPriceAnalysis {
  product: Product;
  vendorPrice: number | null; // null if unquoted
  bestPrice: number | null;
  bestVendorNames: string[];
  status: PriceStatus;
  subtotal: number; // vendorPrice * quantity (or 0 if null)
  diffFromBestPercentage: number; // 0 if best or blank, > 0 if expensive
}

export interface Quotation {
  id: string;
  title: string;
  code: string;
  status: 'Em Cotação' | 'Finalizada' | 'Rascunho';
  createdAt: string;
  deadlineHours: number;
  deadlineMinutes: number;
  deadlineSeconds: number;
  deadlineAt?: string;
}

export interface PurchaseOrder {
  id: string;
  quotationId: string;
  vendorId: string;
  vendorName: string;
  company: string;
  totalAmount: number;
  itemsCount: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
    status: PriceStatus;
  }[];
  status: 'Emitido' | 'Aprovado' | 'Enviado';
  createdAt: string;
}
