import { Product, Vendor, Quotation, BillingInvoice } from './types';

export const initialQuotation: Quotation = {
  id: 'cot-geral-2026-04',
  title: 'Cotação Geral de Produtos',
  code: 'COT-8942',
  status: 'Em Cotação',
  createdAt: '2026-09-25T08:00:00Z',
  deadlineHours: 3,
  deadlineMinutes: 42,
  deadlineSeconds: 15,
};

export const initialProducts: Product[] = [
  { id: 'p1', name: 'Tomate Italiano Especial', category: 'Legumes', quantity: 200, unit: 'kg', benchmarkPrice: 6.50 },
  { id: 'p2', name: 'Batata Lavada Ágata', category: 'Tubérculos', quantity: 300, unit: 'kg', benchmarkPrice: 4.80 },
  { id: 'p3', name: 'Cebola Amarela Nacional', category: 'Legumes', quantity: 150, unit: 'kg', benchmarkPrice: 5.20 },
  { id: 'p4', name: 'Cenoura Selecionada', category: 'Legumes', quantity: 100, unit: 'kg', benchmarkPrice: 4.50 },
  { id: 'p5', name: 'Alface Americana Hidropônica', category: 'Folhagens', quantity: 80, unit: 'un', benchmarkPrice: 3.20 },
  { id: 'p6', name: 'Banana Prata Climatizada', category: 'Frutas', quantity: 120, unit: 'kg', benchmarkPrice: 5.90 },
  { id: 'p7', name: 'Maçã Gala Nacional Cat-1', category: 'Frutas', quantity: 90, unit: 'kg', benchmarkPrice: 8.40 },
  { id: 'p8', name: 'Laranja Pera Rio Seleção', category: 'Frutas', quantity: 180, unit: 'kg', benchmarkPrice: 3.80 },
  { id: 'p9', name: 'Pimentão Verde Caixa', category: 'Legumes', quantity: 50, unit: 'kg', benchmarkPrice: 7.10 },
  { id: 'p10', name: 'Manga Palmer Premium', category: 'Frutas', quantity: 70, unit: 'kg', benchmarkPrice: 6.80 },
  { id: 'p11', name: 'Abobrinha Italiana Verde', category: 'Legumes', quantity: 60, unit: 'kg', benchmarkPrice: 4.90 },
  { id: 'p12', name: 'Melancia Redonda Doce', category: 'Frutas', quantity: 150, unit: 'kg', benchmarkPrice: 2.90 },
];

export const initialVendors: Vendor[] = [
  {
    id: 'v1',
    name: 'Carlos Silva',
    company: 'Distribuidora Boa Vista',
    hasViewed: true,
    minOrderValue: 2400.00,
    phone: '(11) 98451-2210',
    city: 'São Paulo - SP',
    deliveryDays: 'Entrega em 24h',
  },
  {
    id: 'v2',
    name: 'Renato Gomes',
    company: 'Atacado & Distribuição Central',
    hasViewed: true,
    minOrderValue: 1200.00,
    phone: '(11) 97103-9944',
    city: 'Campinas - SP',
    deliveryDays: 'Entrega diária',
  },
  {
    id: 'v3',
    name: 'Marcos Souza',
    company: 'Comercial Aliança Distribuidora',
    hasViewed: true,
    minOrderValue: 1000.00,
    phone: '(19) 99234-1188',
    city: 'Valinhos - SP',
    deliveryDays: 'Seg/Qua/Sex',
  },
  {
    id: 'v4',
    name: 'Juliana Mendes',
    company: 'Distribuidora Aliança Nacional',
    hasViewed: false,
    minOrderValue: 800.00,
    phone: '(11) 96510-4402',
    city: 'Atibaia - SP',
    deliveryDays: 'Terça e Quinta',
  },
];

// Price map: [vendorId][productId] = price
// Configured so that:
// - Vendor 1 (Carlos Silva) in Default mode represents Scenario A (Falta para o mínimo)
// - Vendor 2 (Renato Gomes) represents Scenario B (Atingiu o pedido mínimo)
// - There are items with best price (green), tied price (blue), expensive price (red), and blank (unquoted)
export const initialPrices: Record<string, Record<string, number | null>> = {
  // Vendor 1: Carlos Silva - Distribuidora Boa Vista (Min: R$ 2.400,00)
  // Has winning items + tied items, but total is around R$ 1.950,00 (Falta R$ 450,00 for R$ 2.400)
  v1: {
    p1: 5.90, // Best price (Emerald) - 200kg * 5.90 = 1.180,00
    p2: 4.80, // Expensive (Red) vs v2's 4.40
    p3: 4.90, // Tied with v2 (Sky blue) - 150kg * 4.90 = 735,00
    p4: 4.50, // Expensive vs v3's 4.10
    p5: 3.40, // Expensive vs v2's 2.90
    p6: 5.80, // Expensive vs v2's 5.40
    p7: 8.60, // Expensive vs v3's 8.10
    p8: 3.90, // Expensive vs v2's 3.60
    p9: 7.20, // Expensive vs v2's 6.80
    p10: 7.10, // Expensive vs v2's 6.50
    p11: 4.80, // Expensive vs v2's 4.50
    p12: 3.10, // Expensive vs v2's 2.70
  },

  // Vendor 2: Renato Gomes - Ceasa Verde Atacado (Min: R$ 1.200,00)
  // Wins multiple items, exceeding R$ 1.200 easily (around R$ 2.650,00 winning) -> Scenario B
  v2: {
    p1: 6.20, // Expensive vs v1
    p2: 4.40, // Best price (Emerald) - 300kg * 4.40 = 1.320,00 -> Alone passes 1.200!
    p3: 4.90, // Tied with v1 (Sky blue) - 150kg * 4.90 = 735,00
    p4: 4.40, // Expensive vs v3
    p5: 2.90, // Best price (Emerald) - 80un * 2.90 = 232,00
    p6: 5.40, // Best price (Emerald) - 120kg * 5.40 = 648,00
    p7: 8.50, // Expensive vs v3
    p8: 3.60, // Best price (Emerald) - 180kg * 3.60 = 648,00
    p9: 6.80, // Best price (Emerald) - 50kg * 6.80 = 340,00
    p10: 6.50, // Best price (Emerald) - 70kg * 6.50 = 455,00
    p11: 4.50, // Best price (Emerald) - 60kg * 4.50 = 270,00
    p12: 2.70, // Best price (Emerald) - 150kg * 2.70 = 405,00
  },

  // Vendor 3: Marcos Souza - Frutas & Cia Distribuidora (Min: R$ 1.000,00)
  // Has 9 of 12 quoted, 3 blanks (null)
  v3: {
    p1: 6.40,
    p2: 4.60,
    p3: 5.10,
    p4: 4.10, // Best price (Emerald) - 100kg * 4.10 = 410,00
    p5: null, // Blank (Not quoted)
    p6: 5.70,
    p7: 8.10, // Best price (Emerald) - 90kg * 8.10 = 729,00
    p8: null, // Blank
    p9: 7.40,
    p10: 6.90,
    p11: null, // Blank
    p12: 2.95,
  },

  // Vendor 4: Juliana Mendes - Terra Viva Hortifrúti (Has not viewed yet, 0 quoted)
  v4: {
    p1: null,
    p2: null,
    p3: null,
    p4: null,
    p5: null,
    p6: null,
    p7: null,
    p8: null,
    p9: null,
    p10: null,
    p11: null,
    p12: null,
  }
};

export const initialInvoices: BillingInvoice[] = [
  {
    id: 'fat-2026-081',
    shopkeeperName: 'Supermercado Central da Vila',
    slug: 'super-central',
    planName: 'Plano Pro (Até 50 Cotações)',
    amount: 390.00,
    dueDate: '2026-09-18',
    dueDateFormatted: '18/09/2026',
    status: 'Atrasado',
    isBlocked: false,
    daysOverdue: 7,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405390.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***6304E8A1',
    whatsapp: '5511998421099',
    contactPerson: 'Fernando Silveira',
  },
  {
    id: 'fat-2026-082',
    shopkeeperName: 'Supermercado Estrela do Sul',
    slug: 'super-estrela',
    planName: 'Plano Enterprise Ilimitado',
    amount: 490.00,
    dueDate: '2026-09-20',
    dueDateFormatted: '20/09/2026',
    status: 'Atrasado',
    isBlocked: true, // Already blocked access
    daysOverdue: 5,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405490.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***63047B12',
    whatsapp: '5511984123300',
    contactPerson: 'Marcio Andrade',
  },
  {
    id: 'fat-2026-083',
    shopkeeperName: 'Mercado & Mercearia Da Fazenda',
    slug: 'mercado-fazenda',
    planName: 'Plano Starter (Até 15 Cotações)',
    amount: 290.00,
    dueDate: '2026-09-22',
    dueDateFormatted: '22/09/2026',
    status: 'Atrasado',
    isBlocked: false,
    daysOverdue: 3,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405290.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***63044C99',
    whatsapp: '5519992348811',
    contactPerson: 'Luciana Martins',
  },
  {
    id: 'fat-2026-084',
    shopkeeperName: 'Empório Central do Bairro',
    slug: 'emporio-central',
    planName: 'Plano Pro (Até 50 Cotações)',
    amount: 390.00,
    dueDate: '2026-09-28',
    dueDateFormatted: '28/09/2026',
    status: 'Pendente',
    isBlocked: false,
    daysOverdue: 0,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405390.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***6304A152',
    whatsapp: '5511977114422',
    contactPerson: 'Ricardo Toledo',
  },
  {
    id: 'fat-2026-085',
    shopkeeperName: 'Comercial Primavera Gourmet',
    slug: 'comercial-primavera',
    planName: 'Plano Starter (Até 15 Cotações)',
    amount: 290.00,
    dueDate: '2026-09-30',
    dueDateFormatted: '30/09/2026',
    status: 'Pendente',
    isBlocked: false,
    daysOverdue: 0,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405290.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***6304F29D',
    whatsapp: '5511961125588',
    contactPerson: 'Tatiane Pires',
  },
  {
    id: 'fat-2026-086',
    shopkeeperName: 'Hipermercado Bom Preço Litoral',
    slug: 'bompreco-litoral',
    planName: 'Plano Enterprise Ilimitado',
    amount: 590.00,
    dueDate: '2026-09-10',
    dueDateFormatted: '10/09/2026',
    status: 'Pago',
    isBlocked: false,
    daysOverdue: 0,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405590.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***630488CD',
    whatsapp: '5513988771100',
    contactPerson: 'Eduardo Guimarães',
  },
  {
    id: 'fat-2026-087',
    shopkeeperName: 'Rede Vale Verde Comércio',
    slug: 'valeverde-comercio',
    planName: 'Plano Enterprise Ilimitado',
    amount: 590.00,
    dueDate: '2026-09-12',
    dueDateFormatted: '12/09/2026',
    status: 'Pago',
    isBlocked: false,
    daysOverdue: 0,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405590.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***6304EE31',
    whatsapp: '5511974442211',
    contactPerson: 'Patrícia Nogueira',
  },
  {
    id: 'fat-2026-088',
    shopkeeperName: 'Mercado Popular São Bento',
    slug: 'popular-saobento',
    planName: 'Plano Pro (Até 50 Cotações)',
    amount: 390.00,
    dueDate: '2026-09-15',
    dueDateFormatted: '15/09/2026',
    status: 'Pago',
    isBlocked: false,
    daysOverdue: 0,
    pixKey: '00020126580014br.gov.bcb.pix0136e9575b6b-01bd-4b98-8d57-05e6d3977e375204000053039865405390.005802BR5925COTAFACIL SAAS B2B6009SAO PAULO62070503***63046129',
    whatsapp: '5511993321155',
    contactPerson: 'Bento Carneiro',
  },
];

