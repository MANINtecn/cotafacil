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
