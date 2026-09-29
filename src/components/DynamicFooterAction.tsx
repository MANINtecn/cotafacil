import React from 'react';
import { Vendor, Product } from '../types';
import { formatCurrencyBRL, analyzeVendor } from '../utils/calculations';
import { ShoppingBag, Lock, CheckCircle2 } from 'lucide-react';

interface Props {
  vendor: Vendor;
  products: Product[];
  prices: Record<string, Record<string, number | null>>;
  onGenerateOrder: (vendor: Vendor, winningTotal: number, winningCount: number) => void;
  isSubmitting?: boolean;
}

export const DynamicFooterAction: React.FC<Props> = ({
  vendor,
  products,
  prices,
  onGenerateOrder,
  isSubmitting = false,
}) => {
  const analysis = analyzeVendor(vendor.id, products, prices, vendor);
  const { winningAmount, winningCount, minOrderMet, deficit } = analysis;

  return (
    <footer className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-4 py-3 shadow-lg">
      {/* Resumo do Pedido: Ganhando vs Pedido Mínimo */}
      <div className="flex items-center justify-between text-xs mb-2.5">
        <div className="flex flex-col">
          <span className="text-[11px] text-neutral-500 font-medium">
            Ganhando na cotação:
          </span>
          <span className="text-sm font-bold font-mono-num text-neutral-900 flex items-center gap-1">
            {formatCurrencyBRL(winningAmount)}
            <span className="text-[10px] font-normal text-neutral-400">
              ({winningCount} {winningCount === 1 ? 'item' : 'itens'})
            </span>
          </span>
        </div>

        <div className="h-6 w-px bg-neutral-200" />

        <div className="flex flex-col text-right">
          <span className="text-[11px] text-neutral-500 font-medium">
            Pedido Mínimo exigido:
          </span>
          <span className="text-sm font-bold font-mono-num text-neutral-700">
            {formatCurrencyBRL(vendor.minOrderValue)}
          </span>
        </div>
      </div>

      {/* Botão Dinâmico 'Gerar Pedido' */}
      {!minOrderMet ? (
        /* CENÁRIO A: Valor ganho < mínimo */
        <div className="space-y-1">
          <button
            disabled
            type="button"
            className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-semibold cursor-not-allowed border border-neutral-200/90 flex items-center justify-center gap-2 select-none"
          >
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Gerar Pedido</span>
          </button>
          
          <div className="text-center text-[11px] text-neutral-500 font-medium">
            Faltam <span className="font-semibold text-neutral-700 font-mono-num">{formatCurrencyBRL(deficit)}</span> para o pedido mínimo
          </div>
        </div>
      ) : (
        /* CENÁRIO B: Valor ganho >= mínimo */
        <button
          onClick={() => onGenerateOrder(vendor, winningAmount, winningCount)}
          disabled={isSubmitting}
          type="button"
          className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          )}
          <span>Gerar Pedido ({formatCurrencyBRL(winningAmount)})</span>
        </button>
      )}
    </footer>
  );
};
