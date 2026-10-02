import React from 'react';
import { ShopkeeperStore, Vendor } from '../types';
import { QuotationBundle } from '../utils/storeManager';
import { formatCurrencyBRL } from '../utils/calculations';
import {
  Store,
  Layers,
  Building2,
  ShoppingCart,
  TrendingDown,
  PlusCircle,
  History,
  Phone,
  ArrowRight,
  CreditCard,
  Package
} from 'lucide-react';

interface Props {
  store?: ShopkeeperStore | null;
  quotations: QuotationBundle[];
  vendors: Vendor[];
  ordersCount: number;
  catalogProductsCount?: number;
  onNewQuotation: () => void;
  onOpenManageVendors: () => void;
  onOpenManageProducts?: () => void;
  onOpenHistory: () => void;
  onOpenOrders: () => void;
  onOpenBilling?: () => void;
}

export const ShopkeeperHomeOverview: React.FC<Props> = ({
  store,
  quotations,
  vendors,
  ordersCount,
  catalogProductsCount = 0,
  onNewQuotation,
  onOpenManageVendors,
  onOpenManageProducts,
  onOpenHistory,
  onOpenOrders,
  onOpenBilling,
}) => {
  // Calculate total real savings across all open quotations comparing suppliers' full proposals
  let totalEstimatedSavingsAllLists = 0;

  quotations.forEach((bundle) => {
    const vendorTotalsList: number[] = [];
    if (bundle.vendors && bundle.prices) {
      bundle.vendors.forEach((v) => {
        let vTotal = 0;
        let quotedAny = false;
        (bundle.products || []).forEach((prod) => {
          const p = bundle.prices?.[v.id]?.[prod.id];
          if (p !== null && p !== undefined && p > 0) {
            vTotal += p * prod.quantity;
            quotedAny = true;
          }
        });
        if (quotedAny && vTotal > 0) {
          vendorTotalsList.push(vTotal);
        }
      });
    }

    if (vendorTotalsList.length >= 2) {
      const minVendor = Math.min(...vendorTotalsList);
      const maxVendor = Math.max(...vendorTotalsList);
      totalEstimatedSavingsAllLists += Math.max(0, maxVendor - minVendor);
    }
  });

  return (
    <div className="space-y-4">
      {/* 1. Store Identity & Welcome Hero Card */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border-2 border-neutral-800 space-y-5 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center font-bold shrink-0 border border-white/10 shadow-inner">
              <Store className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Painel Principal
                </span>
                <span className="text-xs text-neutral-400 font-mono-num">
                  /{store?.slug || 'minha-loja'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
                {store?.name || 'Minha Loja'}
              </h1>
              <p className="text-xs text-neutral-400 max-w-xl">
                Central unificada de compras B2B: gerencie cotações empilhadas, compare menores preços e feche pedidos diretos com distribuidores.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons in Hero */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onOpenBilling && (
              <button
                type="button"
                onClick={onOpenBilling}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-800 text-white text-xs font-bold transition-all border border-neutral-700/80 shadow-xs cursor-pointer"
                title="Pagar mensalidade da loja com Mercado Pago"
              >
                <CreditCard className="w-4 h-4 text-sky-400" />
                <span>Mensalidade • Mercado Pago</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNewQuotation}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 text-xs font-black transition-all shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 shrink-0 text-neutral-950" />
              <span>Lançar Nova Lista</span>
            </button>
          </div>
        </div>

        {/* 2. Key Store Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-neutral-800/80 relative z-10">
          <div className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-extrabold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Listas em Aberto</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono-num text-white">
              {quotations.length}
            </div>
            <span className="text-[10px] text-neutral-400 block truncate">
              {quotations.length === 1 ? '1 cotação ativa' : `${quotations.length} cotações ativas`}
            </span>
          </div>

          <div
            onClick={onOpenManageVendors}
            className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1 cursor-pointer hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-extrabold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fornecedores</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono-num text-white">
              {vendors.length}
            </div>
            <span className="text-[10px] text-neutral-400 block truncate hover:text-white">
              {vendors.length === 1 ? '1 cadastrado (gerenciar)' : `${vendors.length} cadastrados (gerenciar)`}
            </span>
          </div>

          <div
            onClick={onOpenManageProducts}
            className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1 cursor-pointer hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-extrabold uppercase tracking-wider">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span>Catálogo</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono-num text-white">
              {catalogProductsCount}
            </div>
            <span className="text-[10px] text-neutral-400 block truncate hover:text-white">
              {catalogProductsCount === 1 ? '1 item (gerenciar)' : `${catalogProductsCount} itens (gerenciar)`}
            </span>
          </div>

          <div
            onClick={onOpenOrders}
            className="p-3.5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-1 cursor-pointer hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-extrabold uppercase tracking-wider">
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pedidos Emitidos</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono-num text-white">
              {ordersCount}
            </div>
            <span className="text-[10px] text-neutral-400 block truncate hover:text-white">
              {ordersCount === 1 ? '1 pedido gerado' : `${ordersCount} pedidos gerados`}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider">
              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Economia Estimada Total</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono-num text-emerald-300">
              {totalEstimatedSavingsAllLists > 0
                ? formatCurrencyBRL(totalEstimatedSavingsAllLists)
                : 'R$ 0,00'}
            </div>
            <span className="text-[10px] text-emerald-400/80 block truncate">
              {totalEstimatedSavingsAllLists > 0
                ? 'Nas cotações em aberto'
                : 'Aguardando mais lances'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
