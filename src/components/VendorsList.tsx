import React from 'react';
import { Vendor, Product } from '../types';
import { formatCurrencyBRL, analyzeVendor } from '../utils/calculations';
import { ChevronRight, CheckCircle2, Eye, EyeOff, Building2, Truck, ArrowUpRight } from 'lucide-react';

interface Props {
  vendors: Vendor[];
  products: Product[];
  prices: Record<string, Record<string, number | null>>;
  onSelectVendor: (vendorId: string) => void;
}

export const VendorsList: React.FC<Props> = ({
  vendors,
  products,
  prices,
  onSelectVendor,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Representantes & Fornecedores ({vendors.length})
        </h2>
        <span className="text-xs text-neutral-400">
          Selecione para auditar preços em tempo real
        </span>
      </div>

      {/* Responsive Grid on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {vendors.map((vendor) => {
          const analysis = analyzeVendor(vendor.id, products, prices, vendor);
          const percentProgress = Math.round((analysis.quotedCount / products.length) * 100);

          return (
            <button
              key={vendor.id}
              onClick={() => onSelectVendor(vendor.id)}
              className="w-full text-left p-4 rounded-2xl border-2 border-neutral-300 bg-white hover:bg-neutral-50/70 hover:border-neutral-900 transition-all active:scale-[0.99] cursor-pointer group shadow-xs flex flex-col justify-between gap-3 relative"
            >
              <div className="space-y-2 w-full">
                {/* Header: Company + Has Viewed Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-colors flex items-center justify-center shrink-0 text-neutral-600">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-sm text-neutral-900 tracking-tight block truncate group-hover:text-neutral-950">
                        {vendor.company}
                      </span>
                      <span className="text-xs text-neutral-500 block truncate">
                        Repr.: <strong className="font-medium text-neutral-700">{vendor.name}</strong>
                      </span>
                    </div>
                  </div>

                  {vendor.hasViewed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                      <Eye className="w-3 h-3 text-emerald-600" />
                      Já Visualizou
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 shrink-0">
                      <EyeOff className="w-3 h-3 text-neutral-400" />
                      Não Visualizou
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>Preenchimento da lista:</span>
                    <span className="font-medium text-neutral-700 font-mono-num">
                      {analysis.quotedCount} de {products.length} itens ({percentProgress}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        analysis.quotedCount === products.length
                          ? 'bg-emerald-500'
                          : analysis.quotedCount > 0
                          ? 'bg-neutral-600'
                          : 'bg-transparent'
                      }`}
                      style={{ width: `${percentProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Winning amount & min order value */}
              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs w-full">
                <div>
                  <div className="text-[11px] text-neutral-500">Ganhando na cotação:</div>
                  <div className="font-mono-num font-bold text-sm text-emerald-700">
                    {formatCurrencyBRL(analysis.winningAmount)}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-neutral-400">Pedido Mínimo:</div>
                  <div className="font-mono-num text-xs font-semibold text-neutral-700">
                    {formatCurrencyBRL(vendor.minOrderValue)}
                  </div>
                </div>

                <div className="text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-0.5 transition-all p-1 rounded-lg bg-neutral-50 group-hover:bg-neutral-100">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
