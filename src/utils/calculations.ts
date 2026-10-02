import { Product, Vendor, ProductPriceAnalysis, PriceStatus } from '../types';

export interface VendorSummary {
  vendor: Vendor;
  quotedCount: number;
  totalCount: number;
  winningAmount: number;
  winningCount: number;
  deficit: number;
  minOrderMet: boolean;
}

export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatNumberBR(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Higieniza o input de valor monetário:
 * - Converte automaticamente qualquer ponto (.) em vírgula (,)
 * - Bloqueia caracteres que não sejam números ou vírgula
 * - Garante no máximo 1 vírgula e até 2 casas decimais
 */
export function sanitizeCurrencyInput(raw: string): string {
  if (!raw) return '';
  // Substitui qualquer ponto digitado por vírgula
  let val = raw.replace(/\./g, ',');
  // Remove tudo que não for dígito numérico ou vírgula
  val = val.replace(/[^0-9,]/g, '');

  const parts = val.split(',');
  if (parts.length > 2) {
    // Se digitou mais de uma vírgula, preserva apenas a primeira
    val = parts[0] + ',' + parts.slice(1).join('');
  }

  const normalizedParts = val.split(',');
  if (normalizedParts.length === 2 && normalizedParts[1].length > 2) {
    // Limita centavos a 2 dígitos decimais
    val = normalizedParts[0] + ',' + normalizedParts[1].slice(0, 2);
  }

  return val;
}

/**
 * Converte de forma segura o valor monetário em número float.
 * Trata tanto valores com vírgula ("100,50") quanto com ponto decimal isolado ("100.50"),
 * impedindo que "100.50" seja tratado como milhar/milhão.
 */
export function parseCurrencyValue(raw: string | number | null | undefined): number {
  if (raw === null || raw === undefined) return 0;
  if (typeof raw === 'number') return isNaN(raw) ? 0 : raw;
  const str = String(raw).trim();
  if (!str) return 0;

  // Se tiver vírgula, a vírgula é o separador decimal
  if (str.includes(',')) {
    const clean = str.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  // Se vier com ponto e tiver 1 ou 2 casas decimais no final (ex: "100.50" ou "12.5")
  if (/^\d+\.\d{1,2}$/.test(str)) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.round(num * 100) / 100;
  }

  // Se tiver múltiplos pontos (ex: "1.000.500") ou número inteiro
  const clean = str.replace(/[^0-9]/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Calculates the dynamically optimized total across all products,
 * picking only the best (lowest) available market price for each item.
 */
export function calculateOptimizedBasket(
  products: Product[],
  prices: Record<string, Record<string, number | null>>
) {
  let totalOptimized = 0;
  let itemsWithQuotes = 0;
  let totalItems = products.length;

  const itemDetails = products.map((product) => {
    let minPrice: number | null = null;
    let winningVendors: string[] = [];

    Object.entries(prices).forEach(([vId, vPrices]) => {
      const p = vPrices[product.id];
      if (typeof p === 'number' && p > 0) {
        if (minPrice === null || p < minPrice) {
          minPrice = p;
          winningVendors = [vId];
        } else if (p === minPrice) {
          winningVendors.push(vId);
        }
      }
    });

    if (minPrice !== null) {
      totalOptimized += product.quantity * minPrice;
      itemsWithQuotes++;
    }

    return {
      productId: product.id,
      minPrice,
      winningVendors,
    };
  });

  return {
    totalOptimized,
    itemsWithQuotes,
    totalItems,
    isComplete: itemsWithQuotes === totalItems,
    itemDetails,
  };
}

/**
 * Calculates analytical line-by-line comparison for a specific vendor
 */
export function analyzeVendor(
  vendorId: string,
  products: Product[],
  prices: Record<string, Record<string, number | null>>,
  vendor: Vendor
): {
  items: ProductPriceAnalysis[];
  winningAmount: number;
  winningCount: number;
  quotedCount: number;
  totalCount: number;
  minOrderMet: boolean;
  deficit: number;
} {
  const vendorPrices = prices[vendorId] || {};
  let winningAmount = 0;
  let winningCount = 0;
  let quotedCount = 0;

  const items: ProductPriceAnalysis[] = products.map((product) => {
    const vPrice = vendorPrices[product.id] ?? null;

    // Collect all quotes for this product across all vendors
    let lowestPrice: number | null = null;
    let lowestVendorIds: string[] = [];

    Object.entries(prices).forEach(([otherVId, pMap]) => {
      const p = pMap[product.id];
      if (typeof p === 'number' && p > 0) {
        if (lowestPrice === null || p < lowestPrice) {
          lowestPrice = p;
          lowestVendorIds = [otherVId];
        } else if (p === lowestPrice) {
          lowestVendorIds.push(otherVId);
        }
      }
    });

    let status: PriceStatus = 'blank';
    let diffPercentage = 0;
    const subtotal = vPrice !== null ? vPrice * product.quantity : 0;

    if (vPrice === null || vPrice === undefined || vPrice <= 0) {
      status = 'blank';
    } else {
      quotedCount++;
      if (lowestPrice !== null) {
        if (vPrice === lowestPrice) {
          if (lowestVendorIds.length > 1) {
            status = 'tied';
          } else {
            status = 'best';
          }
          winningAmount += subtotal;
          winningCount++;
        } else if (vPrice > lowestPrice) {
          status = 'expensive';
          diffPercentage = ((vPrice - lowestPrice) / lowestPrice) * 100;
        }
      } else {
        // Only this vendor quoted
        status = 'best';
        winningAmount += subtotal;
        winningCount++;
      }
    }

    return {
      product,
      vendorPrice: vPrice,
      bestPrice: lowestPrice,
      bestVendorNames: lowestVendorIds,
      status,
      subtotal,
      diffFromBestPercentage: Math.round(diffPercentage),
    };
  });

  const minOrderMet = winningAmount >= vendor.minOrderValue;
  const deficit = Math.max(0, vendor.minOrderValue - winningAmount);

  return {
    items,
    winningAmount,
    winningCount,
    quotedCount,
    totalCount: products.length,
    minOrderMet,
    deficit,
  };
}
