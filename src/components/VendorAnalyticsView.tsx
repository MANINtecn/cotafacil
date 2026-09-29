import React, { useState } from 'react';
import { Vendor, Product, PriceStatus } from '../types';
import { formatCurrencyBRL, analyzeVendor } from '../utils/calculations';
import { ArrowLeft, Eye, EyeOff, AlertCircle, Check, HelpCircle, Building2, Phone, MapPin, Truck, CheckCircle2, Lock } from 'lucide-react';

interface Props {
  vendor: Vendor;
  products: Product[];
  prices: Record<string, Record<string, number | null>>;
  onBack: () => void;
  onUpdateVendorPrice: (vendorId: string, productId: string, price: number | null) => void;
  onApplyScenario: (scenario: 'A' | 'B') => void;
  currentScenario: 'A' | 'B';
  onGenerateOrder?: (vendor: Vendor, winningTotal: number, winningCount: number) => void;
  isSubmittingOrder?: boolean;
}

export const VendorAnalyticsView: React.FC<Props> = ({
  vendor,
  products,
  prices,
  onBack,
  onUpdateVendorPrice,
  onApplyScenario,
  currentScenario,
  onGenerateOrder,
  isSubmittingOrder = false,
}) => {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPriceInput, setEditPriceInput] = useState<string>('');

  const analysis = analyzeVendor(vendor.id, products, prices, vendor);
  const { winningAmount, winningCount, minOrderMet, deficit, quotedCount } = analysis;
  const minPercent = Math.min(100, Math.round((winningAmount / vendor.minOrderValue) * 100));

  const startEdit = (productId: string, currentVal: number | null) => {
    setEditingProductId(productId);
    setEditPriceInput(currentVal !== null ? currentVal.toFixed(2) : '');
  };

  const saveEdit = (productId: string) => {
    const parsed = parseFloat(editPriceInput.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) {
      onUpdateVendorPrice(vendor.id, productId, null);
    } else {
      onUpdateVendorPrice(vendor.id, productId, Math.round(parsed * 100) / 100);
    }
    setEditingProductId(null);
  };

  return (
    <div className="flex-1 flex flex-col pb-36 lg:pb-12 max-w-7xl mx-auto w-full px-4 lg:px-8 pt-4">
      {/* Sticky Sub-Header with Back Button and Quick Scenario Switcher */}
      <div className="sticky top-0 lg:static z-30 bg-white/95 backdrop-blur-md border border-neutral-200/90 rounded-2xl px-4 lg:px-6 py-3.5 shadow-2xs mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 py-1.5 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 transition-colors group cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-500 group-hover:text-neutral-800 transition-transform group-hover:-translate-x-0.5" />
              <span>Voltar à Cotação</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base lg:text-lg font-bold text-neutral-900 tracking-tight">
                  {vendor.company}
                </h2>
                {vendor.hasViewed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    <Eye className="w-3 h-3 text-emerald-600" />
                    Já Visualizou
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                    <EyeOff className="w-3 h-3 text-neutral-400" />
                    Não Visualizou
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 flex items-center gap-2">
                <span>Repr: <strong className="text-neutral-700">{vendor.name}</strong></span>
                <span>•</span>
                <span>Mínimo: <strong className="font-mono-num text-neutral-800">{formatCurrencyBRL(vendor.minOrderValue)}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Scenario Toggle Pill */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline">Simulação:</span>
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
              <button
                onClick={() => onApplyScenario('A')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentScenario === 'A'
                    ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Simular fornecedor sem atingir o pedido mínimo"
              >
                Cenário A (Falta Mínimo)
              </button>
              <button
                onClick={() => onApplyScenario('B')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  currentScenario === 'B'
                    ? 'bg-white text-neutral-900 shadow-xs border border-neutral-200/80 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
                title="Simular fornecedor atingindo o pedido mínimo"
              >
                Cenário B (Mínimo Atingido)
              </button>
            </div>
          </div>
        </div>

        {/* Visual Color Legend Bar */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between flex-wrap gap-2 text-[11px] text-neutral-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-medium text-emerald-950">Melhor Preço</span>
            <span className="text-neutral-400 text-[10px] hidden sm:inline">(Ganhando o item)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            <span className="font-medium text-sky-950">Empatado</span>
            <span className="text-neutral-400 text-[10px] hidden sm:inline">(Menor preço dividido)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
            <span className="font-medium text-rose-950">Mais Caro</span>
            <span className="text-neutral-400 text-[10px] hidden sm:inline">(Concorrente ofereceu menor)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-300 shrink-0" />
            <span className="font-medium text-neutral-500">Em Branco</span>
            <span className="text-neutral-400 text-[10px] hidden sm:inline">(Não precificado)</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop: 8 cols items + 4 cols sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Products List & Analytics Table (Spans 8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span className="font-bold uppercase tracking-wider text-[11px]">
              Itens da Cotação ({products.length})
            </span>
            <span className="font-mono-num">
              {quotedCount} de {products.length} cotados por este representante
            </span>
          </div>

          <div className="space-y-2">
            {analysis.items.map(({ product, vendorPrice, bestPrice, status, subtotal, diffFromBestPercentage }) => {
              let containerClasses = '';
              let badgeComponent = null;

              if (status === 'blank') {
                containerClasses = 'bg-neutral-50/70 border-neutral-200/80 text-neutral-400';
                badgeComponent = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-200/60 text-neutral-600">
                    Em Branco
                  </span>
                );
              } else if (status === 'best') {
                containerClasses = 'bg-emerald-50/80 border-emerald-200 text-emerald-950';
                badgeComponent = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <Check className="w-2.5 h-2.5" />
                    Melhor Preço
                  </span>
                );
              } else if (status === 'tied') {
                containerClasses = 'bg-sky-50/80 border-sky-200 text-sky-950';
                badgeComponent = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                    Preço Empatado
                  </span>
                );
              } else if (status === 'expensive') {
                containerClasses = 'bg-rose-50/80 border-rose-200 text-rose-950';
                badgeComponent = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                    +{diffFromBestPercentage}% mais caro
                  </span>
                );
              }

              const isEditing = editingProductId === product.id;

              return (
                <div
                  key={product.id}
                  className={`p-3.5 sm:p-4 rounded-xl border transition-all ${containerClasses} flex items-center justify-between gap-3 shadow-2xs`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                        {product.name}
                      </span>
                      {product.category && (
                        <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 bg-white/70 rounded border border-neutral-200/60">
                          {product.category}
                        </span>
                      )}
                      {badgeComponent}
                    </div>

                    <div className="text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
                      <span>
                        Qtd: <strong className="font-mono-num text-neutral-800">{product.quantity} {product.unit}</strong>
                      </span>
                      <span className="text-neutral-300">•</span>
                      
                      {status === 'blank' ? (
                        <span className="text-neutral-400">Fornecedor ainda não preencheu este item</span>
                      ) : status === 'expensive' && bestPrice !== null ? (
                        <span className="text-rose-700 font-mono-num font-medium">
                          Menor oferta concorrente: {formatCurrencyBRL(bestPrice)}
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-mono-num font-semibold">
                          Subtotal Ofertado: {formatCurrencyBRL(subtotal)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price column with inline editing */}
                  <div className="text-right shrink-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-neutral-500">R$</span>
                        <input
                          type="text"
                          value={editPriceInput}
                          onChange={(e) => setEditPriceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(product.id);
                            if (e.key === 'Escape') setEditingProductId(null);
                          }}
                          autoFocus
                          className="w-16 px-1.5 py-0.5 text-xs font-mono-num font-bold bg-white border border-neutral-300 rounded text-neutral-900 focus:outline-hidden focus:ring-1 focus:ring-neutral-900"
                        />
                        <button
                          onClick={() => saveEdit(product.id)}
                          className="text-[10px] font-bold bg-neutral-900 text-white px-2 py-1 rounded cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEdit(product.id, vendorPrice)}
                        className="cursor-pointer group/price select-none"
                        title="Toque para editar o valor simulado"
                      >
                        {vendorPrice !== null ? (
                          <div className="text-sm sm:text-base font-mono-num font-extrabold tracking-tight">
                            {status === 'best' ? (
                              <span className="text-emerald-950 group-hover/price:underline">
                                {formatCurrencyBRL(vendorPrice)}
                              </span>
                            ) : status === 'tied' ? (
                              <span className="text-sky-950 group-hover/price:underline">
                                {formatCurrencyBRL(vendorPrice)}
                              </span>
                            ) : (
                              <span className="text-rose-900 group-hover/price:underline">
                                {formatCurrencyBRL(vendorPrice)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-base font-mono-num font-bold text-neutral-400 group-hover/price:text-neutral-600">
                            —
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-400">
                          por {product.unit} (clique p/ editar)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Desktop Executive Validation Sidebar (Spans 4 cols on desktop, hidden on small screen) */}
        <div className="hidden lg:block lg:col-span-4 sticky top-6 space-y-4">
          <div className="p-5 bg-white border border-neutral-200/90 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Auditoria do Pedido
              </span>
              <span className="text-xs font-mono-num text-neutral-400">
                {winningCount} itens ganhos
              </span>
            </div>

            {/* Vendor Profile Brief */}
            <div className="space-y-1.5 text-xs text-neutral-600">
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-semibold text-neutral-900">{vendor.company}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>{vendor.phone || '(11) 98451-2210'}</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-500">
                <Truck className="w-3.5 h-3.5 text-neutral-400" />
                <span>{vendor.deliveryDays || 'Entrega em 24h'}</span>
              </div>
            </div>

            {/* Gauge Progress to Min Order */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Meta do Pedido Mínimo:</span>
                <span className="font-bold font-mono-num text-neutral-900">{minPercent}%</span>
              </div>
              <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    minOrderMet ? 'bg-emerald-500' : 'bg-neutral-800'
                  }`}
                  style={{ width: `${minPercent}%` }}
                />
              </div>
            </div>

            {/* Financial Comparison Box */}
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Ganhando na cotação:</span>
                <span className="font-bold font-mono-num text-sm text-neutral-900">
                  {formatCurrencyBRL(winningAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Pedido Mínimo exigido:</span>
                <span className="font-bold font-mono-num text-neutral-700">
                  {formatCurrencyBRL(vendor.minOrderValue)}
                </span>
              </div>
            </div>

            {/* Action Validation Button */}
            {!minOrderMet ? (
              <div className="space-y-1.5 pt-1">
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-100 text-neutral-400 text-xs font-semibold cursor-not-allowed border border-neutral-200 flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Gerar Pedido</span>
                </button>
                <div className="text-center text-[11px] text-neutral-500 font-medium">
                  Faltam <span className="font-bold text-neutral-800 font-mono-num">{formatCurrencyBRL(deficit)}</span> para o pedido mínimo
                </div>
              </div>
            ) : (
              <button
                onClick={() => onGenerateOrder && onGenerateOrder(vendor, winningAmount, winningCount)}
                disabled={isSubmittingOrder}
                className="w-full py-3.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingOrder ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>Gerar Pedido ({formatCurrencyBRL(winningAmount)})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
