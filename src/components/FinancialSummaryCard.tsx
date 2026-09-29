import React from 'react';
import { formatCurrencyBRL } from '../utils/calculations';
import { TrendingDown, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
  totalOptimized: number;
  itemsWithQuotes: number;
  totalItems: number;
  savingsPercentage?: number;
}

export const FinancialSummaryCard: React.FC<Props> = ({
  totalOptimized,
  itemsWithQuotes,
  totalItems,
  savingsPercentage = 18.4,
}) => {
  const estimatedSavingsValue = totalOptimized * (savingsPercentage / 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* Primary Card: Valor Total Otimizado (Spans 2 cols on md/lg) */}
      <div className="md:col-span-2 p-5 rounded-2xl bg-neutral-900 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <div className="font-semibold tracking-wide uppercase text-[11px] text-neutral-300">
              <span>Resumo do Mercado</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-[10px] text-emerald-400 font-semibold border border-neutral-700/60">
              Menor Custo Possível
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-neutral-400 font-medium">
              Valor Total Otimizado
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono-num tracking-tight text-white mt-1">
              {formatCurrencyBRL(totalOptimized)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              <strong className="text-white font-mono-num">{itemsWithQuotes}</strong> de {totalItems} produtos precificados
            </span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <TrendingDown className="w-4 h-4" />
            <span>Economia de {savingsPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Secondary Companion Card on Desktop: Economia Real & Agilidade */}
      <div className="p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Economia Estimada</span>
          </div>

          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-emerald-700">
              ~{formatCurrencyBRL(estimatedSavingsValue)}
            </div>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Diferença em relação aos preços de tabela dos concorrentes mais caros.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            <span>Validação de Mínimos</span>
          </div>
          <span className="font-semibold text-neutral-800">4 Fornecedores</span>
        </div>
      </div>
    </div>
  );
};
