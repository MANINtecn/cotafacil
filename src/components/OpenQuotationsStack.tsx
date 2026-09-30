import React, { useState } from 'react';
import { QuotationBundle } from '../utils/storeManager';
import {
  Layers,
  PlusCircle,
  CheckCircle2,
  Clock,
  Package,
  Users,
  MessageCircle,
  RotateCcw,
  Trash2,
  ChevronRight,
  TrendingDown,
  X,
  AlertTriangle
} from 'lucide-react';
import { formatCurrencyBRL } from '../utils/calculations';

interface Props {
  openQuotations: QuotationBundle[];
  activeCode: string;
  onSelectQuotation: (code: string) => void;
  onNewQuotation: () => void;
  onOpenWhatsApp: (bundle: QuotationBundle) => void;
  onReuseQuotation: (bundle: QuotationBundle) => void;
  onDeleteQuotation: (code: string) => void;
}

export const OpenQuotationsStack: React.FC<Props> = ({
  openQuotations,
  activeCode,
  onSelectQuotation,
  onNewQuotation,
  onOpenWhatsApp,
  onReuseQuotation,
  onDeleteQuotation,
}) => {
  const [bundleToDelete, setBundleToDelete] = useState<QuotationBundle | null>(null);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const handleCardClick = (code: string) => {
    onSelectQuotation(code);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-neutral-300 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header of Open Lists Stack */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b-2 border-neutral-200">
        <div>
          <h2 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
            Listas de Cotação em Aberto
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Suas cotações em andamento. Clique em qualquer lista para abrir todos os produtos, preços e menores propostas.
          </p>
        </div>
      </div>

      {/* Grid of Stacked Open Lists */}
      {openQuotations.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 space-y-2">
          <Package className="w-8 h-8 text-neutral-400 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-800">Nenhuma lista aberta no momento</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Clique em <strong>"Lançar Nova Lista"</strong> para cadastrar seus itens e disparar para os fornecedores.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {openQuotations.map((bundle) => {
            const isActive = activeCode === bundle.quotation.code;
            const productsCount = bundle.products?.length || 0;
            const vendorsCount = bundle.vendors?.length || 0;

            // Count suppliers who provided at least one price
            let responsesCount = 0;
            if (bundle.prices) {
              Object.entries(bundle.prices).forEach(([, pMap]) => {
                if (pMap && Object.values(pMap).some((val) => val !== null && val !== undefined && val > 0)) {
                  responsesCount += 1;
                }
              });
            }

            // Calculate Economia Estimada for THIS specific quotation bundle
            let totalMinPrice = 0;
            let estimatedSavings = 0;

            (bundle.products || []).forEach((prod) => {
              const quotesForProd: number[] = [];
              if (bundle.prices) {
                Object.values(bundle.prices).forEach((vendorPrices) => {
                  const p = vendorPrices?.[prod.id];
                  if (p !== null && p !== undefined && p > 0) {
                    quotesForProd.push(p);
                  }
                });
              }

              if (quotesForProd.length > 0) {
                const minP = Math.min(...quotesForProd);
                totalMinPrice += minP * prod.quantity;

                if (quotesForProd.length >= 2) {
                  const maxP = Math.max(...quotesForProd);
                  estimatedSavings += (maxP - minP) * prod.quantity;
                }
              }
            });

            return (
              <div
                key={bundle.quotation.code}
                onClick={() => handleCardClick(bundle.quotation.code)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                  isActive
                    ? 'border-emerald-600 bg-white ring-4 ring-emerald-500/15 shadow-md'
                    : 'border-neutral-300 hover:border-neutral-900 bg-neutral-50/70 hover:bg-white shadow-2xs'
                }`}
              >
                {/* Active Indicator Banner */}
                {isActive && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      Visualizando Esta Lista Agora
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Ativa
                    </span>
                  </div>
                )}

                {/* List Title & Code */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono-num font-extrabold px-2 py-0.5 rounded-md bg-neutral-900 text-white border border-neutral-800">
                      {bundle.quotation.code}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-neutral-200/90 text-neutral-800">
                      {bundle.quotation.status || 'Aberta'}
                    </span>
                  </div>

                  <h3 className="font-black text-sm text-neutral-950 leading-snug line-clamp-1">
                    {bundle.quotation.title}
                  </h3>

                  {/* Metadata Chips: Itens & Respostas */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <div className="inline-flex items-center gap-1 font-bold text-neutral-800 bg-white px-2 py-1 rounded-lg border border-neutral-300">
                      <Package className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{productsCount} {productsCount === 1 ? 'item' : 'itens'}</span>
                    </div>

                    <div className="inline-flex items-center gap-1 font-bold text-neutral-800 bg-white px-2 py-1 rounded-lg border border-neutral-300">
                      <Users className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{responsesCount} de {vendorsCount} {vendorsCount === 1 ? 'resposta' : 'respostas'}</span>
                    </div>
                  </div>

                  {/* Economia Estimada daquela lista entre os fornecedores */}
                  <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-center justify-between text-xs shadow-2xs">
                    <div className="flex items-center gap-1.5 text-emerald-950 font-bold">
                      <TrendingDown className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Economia Estimada:</span>
                    </div>
                    <div className="font-mono-num font-black text-sm text-emerald-800">
                      {estimatedSavings > 0 ? (
                        formatCurrencyBRL(estimatedSavings)
                      ) : responsesCount >= 2 ? (
                        'R$ 0,00'
                      ) : responsesCount === 1 ? (
                        <span className="text-[11px] font-bold text-emerald-700">1 resposta</span>
                      ) : (
                        <span className="text-[11px] font-normal text-neutral-400">Aguardando preços</span>
                      )}
                    </div>
                  </div>

                  {totalMinPrice > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-neutral-600 px-0.5">
                      <span>Menor preço cotado:</span>
                      <strong className="font-mono-num text-neutral-900">{formatCurrencyBRL(totalMinPrice)}</strong>
                    </div>
                  )}

                  {bundle.quotation.createdAt && (
                    <div className="text-[11px] text-neutral-400 flex items-center gap-1 pt-0.5">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      <span>Aberta em: {formatDate(bundle.quotation.createdAt)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons on Card */}
                <div
                  className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1.5">
                    {/* Disparar WhatsApp */}
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(bundle)}
                      title="Enviar links desta cotação no WhatsApp dos fornecedores"
                      className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </button>

                    {/* Reutilizar */}
                    <button
                      type="button"
                      onClick={() => onReuseQuotation(bundle)}
                      title="Reutilizar os produtos desta lista em uma nova cotação"
                      className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                      <span className="hidden sm:inline">Reutilizar</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCardClick(bundle.quotation.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                        isActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-400/50'
                          : 'bg-neutral-950 hover:bg-neutral-800 text-white'
                      }`}
                    >
                      <span>Abrir Lista</span>
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBundleToDelete(bundle);
                      }}
                      title="Excluir lista"
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Deletion Confirmation Modal - Zero browser window.confirm */}
      {bundleToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setBundleToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-neutral-300 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setBundleToDelete(null)}
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-neutral-950">
                Excluir Lista de Cotação?
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Tem certeza que deseja excluir permanentemente a lista{' '}
                <strong className="text-neutral-950 font-bold">"{bundleToDelete.quotation.title}"</strong> (código{' '}
                <span className="font-mono-num font-bold text-neutral-900">{bundleToDelete.quotation.code}</span>)?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 space-y-1">
              <div className="flex items-center justify-between">
                <span>Produtos cadastrados:</span>
                <strong className="text-neutral-900 font-bold">{bundleToDelete.products?.length || 0} itens</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Fornecedores participantes:</span>
                <strong className="text-neutral-900 font-bold">{bundleToDelete.vendors?.length || 0} fornecedores</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBundleToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const code = bundleToDelete.quotation.code;
                  setBundleToDelete(null);
                  onDeleteQuotation(code);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sim, Excluir Lista</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
