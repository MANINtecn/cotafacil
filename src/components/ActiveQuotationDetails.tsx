import React from 'react';
import { Product, Vendor, Quotation } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';
import { QuotationBundle } from '../utils/storeManager';
import {
  Check,
  CheckCircle2,
  Clock,
  Package,
  Users,
  Building2,
  Phone,
  Truck,
  TrendingDown,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  MessageCircle,
  ShoppingCart,
  Percent,
  PlusCircle
} from 'lucide-react';

interface Props {
  quotation: Quotation;
  products: Product[];
  vendors: Vendor[];
  prices: Record<string, Record<string, number | null>>;
  onSelectVendor: (vendorId: string) => void;
  onOpenWhatsApp: () => void;
  onGenerateDirectOrder?: (vendor: Vendor, total: number, count: number) => void;
  onNewQuotation: () => void;
  onBackToLists?: () => void;
  openQuotations?: QuotationBundle[];
  onSelectAnotherQuotation?: (code: string) => void;
}

export const ActiveQuotationDetails: React.FC<Props> = ({
  quotation,
  products,
  vendors,
  prices,
  onSelectVendor,
  onOpenWhatsApp,
  onGenerateDirectOrder,
  onNewQuotation,
  onBackToLists,
  openQuotations,
  onSelectAnotherQuotation,
}) => {
  // 1. Analyze each product across all participating suppliers
  const productsAnalysis = products.map((product, index) => {
    const quotesForProduct: {
      vendor: Vendor;
      price: number | null;
      subtotal: number | null;
    }[] = vendors.map((v) => {
      const p = prices[v.id]?.[product.id];
      const valid = p !== null && p !== undefined && p > 0 ? p : null;
      return {
        vendor: v,
        price: valid,
        subtotal: valid !== null ? valid * product.quantity : null,
      };
    });

    const validQuotes = quotesForProduct.filter((q) => q.price !== null && q.price > 0);
    const hasQuotes = validQuotes.length > 0;

    let bestPrice: number | null = null;
    let worstPrice: number | null = null;
    let bestVendor: Vendor | null = null;

    if (hasQuotes) {
      bestPrice = Math.min(...validQuotes.map((q) => q.price!));
      worstPrice = Math.max(...validQuotes.map((q) => q.price!));
      const matchBest = validQuotes.find((q) => q.price === bestPrice);
      if (matchBest) {
        bestVendor = matchBest.vendor;
      }
    }

    return {
      product,
      index,
      quotes: quotesForProduct,
      validQuotes,
      hasQuotes,
      bestPrice,
      worstPrice,
      bestVendor,
      estimatedSavings:
        bestPrice !== null && worstPrice !== null && worstPrice > bestPrice
          ? (worstPrice - bestPrice) * product.quantity
          : 0,
    };
  });

  // 2. Analyze each vendor in this quotation to calculate competitiveness percentage
  const vendorsAnalysis = vendors.map((vendor) => {
    let quotedCount = 0;
    let totalOffered = 0;
    let winningCount = 0;
    let winningAmount = 0;

    products.forEach((p) => {
      const vPrice = prices[vendor.id]?.[p.id];
      if (vPrice !== null && vPrice !== undefined && vPrice > 0) {
        quotedCount += 1;
        totalOffered += vPrice * p.quantity;

        // Check if this vendor has the best (lowest) price for this product
        const allQuotesForP = vendors
          .map((otherV) => prices[otherV.id]?.[p.id])
          .filter((val): val is number => val !== null && val !== undefined && val > 0);

        if (allQuotesForP.length > 0) {
          const minP = Math.min(...allQuotesForP);
          if (vPrice === minP) {
            winningCount += 1;
            winningAmount += vPrice * p.quantity;
          }
        }
      }
    });

    const percentQuoted = products.length > 0 ? Math.round((quotedCount / products.length) * 100) : 0;
    const competitivenessPercent = products.length > 0 ? Math.round((winningCount / products.length) * 100) : 0;
    const minOrder = vendor.minOrderValue || 0;
    const minOrderMet = totalOffered >= minOrder;
    const deficit = Math.max(0, minOrder - totalOffered);

    return {
      vendor,
      quotedCount,
      percentQuoted,
      totalOffered,
      winningCount,
      winningAmount,
      competitivenessPercent,
      minOrderMet,
      deficit,
      minOrder,
    };
  });

  // Sort vendors by who is most competitive (% of best prices)
  const sortedVendors = [...vendorsAnalysis].sort(
    (a, b) => b.competitivenessPercent - a.competitivenessPercent || b.winningCount - a.winningCount
  );

  // Overall totals for active quotation
  let totalOptimizedBasket = 0;
  let totalQuotationSavings = 0;
  productsAnalysis.forEach((pa) => {
    if (pa.bestPrice !== null) {
      totalOptimizedBasket += pa.bestPrice * pa.product.quantity;
      totalQuotationSavings += pa.estimatedSavings;
    }
  });

  return (
    <div id="detalhes-cotacao-ativa" className="space-y-5 pt-2 scroll-mt-6">
      {/* 1. Header Card of Active Selected Quotation */}
      <div className="bg-white rounded-3xl border-2 border-neutral-300 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-neutral-200">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono-num font-black px-2.5 py-1 rounded-lg bg-neutral-900 text-white border border-neutral-800">
                {quotation.code}
              </span>
              <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {quotation.status || 'Em Cotação'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
              {quotation.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 pt-0.5">
              <span className="flex items-center gap-1 font-bold text-neutral-800">
                <Package className="w-3.5 h-3.5 text-neutral-500" />
                <span>{products.length} {products.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-neutral-800">
                <Users className="w-3.5 h-3.5 text-neutral-500" />
                <span>{vendors.length} {vendors.length === 1 ? 'fornecedor convocado' : 'fornecedores convocados'}</span>
              </span>
              {quotation.deadlineAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-neutral-500">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Prazo: {new Date(quotation.deadlineAt).toLocaleDateString('pt-BR')}</span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 text-xs font-black transition-all shadow-xs border-2 border-emerald-600 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar no WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Highlighted Key Metrics Bar (Economia Estimada + Progresso das Respostas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-950 font-extrabold text-[11px] uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-emerald-700" />
              <span>Economia Estimada da Lista</span>
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono-num text-emerald-800">
              {totalQuotationSavings > 0 ? (
                formatCurrencyBRL(totalQuotationSavings)
              ) : vendors.length >= 2 ? (
                'R$ 0,00'
              ) : (
                <span className="text-sm font-bold text-emerald-700">Aguardando mais lances</span>
              )}
            </div>
            <span className="text-[10px] text-emerald-900/80 block">
              Diferença entre o menor lance e a maior oferta
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border-2 border-neutral-300 space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-500 block">
              Progresso das Respostas
            </span>
            <div className="text-base sm:text-xl font-black text-neutral-950 font-mono-num">
              {vendorsAnalysis.filter((v) => v.quotedCount > 0).length} de {vendors.length} fornecedores responderam
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Atualizações salvas em tempo real
            </span>
          </div>
        </div>
      </div>

      {/* 2. Products Table & Comparative Prices (Line-by-line list optimized for lojistas) */}
      <div className="bg-white rounded-3xl border-2 border-neutral-300 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b-2 border-neutral-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
              Itens Solicitados & Comparativo de Preços
            </h2>
            <p className="text-xs text-neutral-500">
              Visualização linha por linha: <strong className="text-emerald-700">Verde</strong> para menor preço, <strong className="text-rose-700">Vermelho</strong> para preço mais caro, <strong className="text-neutral-500">Cinza/Branco</strong> aguardando proposta.
            </p>
          </div>
          <span className="text-xs font-mono-num font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-300 shrink-0">
            {products.length} {products.length === 1 ? 'item' : 'itens'}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500">
            Nenhum produto cadastrado nesta lista.
          </div>
        ) : (
          <div className="divide-y-2 divide-neutral-100">
            {productsAnalysis.map(({ product, index, quotes, validQuotes, bestPrice, worstPrice, bestVendor }) => {
              return (
                <div
                  key={product.id}
                  className="py-3 px-2 sm:px-3 hover:bg-neutral-50/80 rounded-xl transition-colors space-y-2"
                >
                  {/* Top Line: Item Number, Product Name, Quantity and Best Price Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono-num font-black text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md shrink-0">
                        #{index + 1}
                      </span>
                      <span className="font-extrabold text-sm sm:text-base text-neutral-950 truncate">
                        {product.name}
                      </span>
                      <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 rounded-md font-mono-num font-black text-neutral-900 text-xs uppercase shrink-0">
                        {product.quantity} {product.unit}
                      </span>
                    </div>

                    {/* Best Price Quick Highlight */}
                    {bestPrice !== null ? (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-bold shrink-0 self-start sm:self-auto">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Menor: <strong className="font-mono-num font-black text-emerald-900">{formatCurrencyBRL(bestPrice)}</strong></span>
                        <span className="text-[11px] text-emerald-700 font-normal">({bestVendor?.company || bestVendor?.name})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-neutral-400 italic bg-neutral-50 px-2.5 py-0.5 rounded-lg border border-neutral-200 shrink-0 self-start sm:self-auto">
                        Aguardando cotação
                      </span>
                    )}
                  </div>

                  {/* Bottom Line: Compact horizontal row of supplier bids */}
                  <div className="flex items-center gap-2 flex-wrap pl-0 sm:pl-8">
                    <span className="text-[11px] font-bold uppercase text-neutral-400 shrink-0 mr-1 hidden sm:inline">
                      Lances:
                    </span>
                    {quotes.map(({ vendor, price }) => {
                      const isBlank = price === null || price === undefined || price <= 0;
                      const isBest = !isBlank && bestPrice !== null && price === bestPrice;
                      const isExpensive = !isBlank && bestPrice !== null && price > bestPrice;

                      let chipStyle = 'bg-white border-neutral-300 text-neutral-700';
                      let chipText = !isBlank ? formatCurrencyBRL(price!) : '—';
                      let diffTag = null;

                      if (isBlank) {
                        chipStyle = 'bg-neutral-50 border-neutral-200 text-neutral-400';
                        chipText = '—';
                      } else if (isBest) {
                        chipStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-2xs';
                        diffTag = <span className="text-[10px] text-emerald-700 font-bold ml-1">✓ Menor</span>;
                      } else if (isExpensive) {
                        const diff = Math.round(((price - bestPrice!) / bestPrice!) * 100);
                        chipStyle = 'bg-rose-50 border-rose-300 text-rose-950';
                        diffTag = <span className="text-[10px] text-rose-700 font-bold ml-1">+{diff}%</span>;
                      }

                      return (
                        <div
                          key={vendor.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${chipStyle}`}
                          title={`${vendor.company}: ${!isBlank ? formatCurrencyBRL(price!) : 'Sem lance'}`}
                        >
                          <span className="font-semibold text-neutral-800">{vendor.company}:</span>
                          <span className="font-mono-num font-bold">{chipText}</span>
                          {diffTag}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Clean Suppliers List with Competitiveness Percentage & Direct Ordering */}
      <div className="bg-white rounded-3xl border-2 border-neutral-300 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b-2 border-neutral-200">
          <div>
            <h2 className="text-base sm:text-lg font-black text-neutral-950 tracking-tight">
              Fornecedores que Receberam esta Cotação
            </h2>
            <p className="text-xs text-neutral-500">
              Veja a porcentagem de competitividade de cada distribuidor, inspecione a proposta completa ou gere o pedido.
            </p>
          </div>
          <span className="text-xs font-mono-num font-bold text-neutral-600 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-300 shrink-0">
            {vendors.length} {vendors.length === 1 ? 'fornecedor' : 'fornecedores'}
          </span>
        </div>

        {vendors.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-500">
            Nenhum fornecedor vinculado a esta cotação.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedVendors.map(
              ({
                vendor,
                quotedCount,
                percentQuoted,
                totalOffered,
                winningCount,
                competitivenessPercent,
                minOrderMet,
                deficit,
                minOrder,
              }) => {
                return (
                  <div
                    key={vendor.id}
                    className="p-4 sm:p-5 rounded-2xl border-2 border-neutral-300 bg-white hover:border-neutral-900 transition-all shadow-xs flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Company & Viewed Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-sm text-neutral-950 truncate">
                              {vendor.company}
                            </h3>
                            <span className="text-xs text-neutral-500 block truncate">
                              Repr: <strong className="text-neutral-800 font-semibold">{vendor.name}</strong>
                            </span>
                          </div>
                        </div>

                        {vendor.hasViewed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 shrink-0">
                            <Eye className="w-3 h-3 text-emerald-600" />
                            Já Visualizou
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200 shrink-0">
                            <EyeOff className="w-3 h-3 text-neutral-400" />
                            Não Visualizou
                          </span>
                        )}
                      </div>

                      {/* Porcentagem de Competitividade (Quem tá na frente) */}
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-neutral-800 flex items-center gap-1">
                            <Percent className="w-3.5 h-3.5 text-emerald-600" />
                            Menor Preço nos Itens:
                          </span>
                          <span className="font-black font-mono-num text-sm text-emerald-800">
                            {competitivenessPercent}% ({winningCount} de {products.length} itens)
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${competitivenessPercent}%` }}
                          />
                        </div>

                        <div className="text-[11px] text-neutral-500 flex items-center justify-between pt-0.5">
                          <span>Preenchimento: <strong>{quotedCount} de {products.length} ({percentQuoted}%)</strong></span>
                          <span>Proposta Total: <strong className="font-mono-num text-neutral-900">{formatCurrencyBRL(totalOffered)}</strong></span>
                        </div>
                      </div>

                      {/* Minimum Order Status */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-100">
                        <div className="flex items-center gap-1.5 text-neutral-600">
                          <Truck className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Pedido Mínimo ({formatCurrencyBRL(minOrder)}):</span>
                        </div>
                        <div>
                          {minOrderMet ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Atinge o mínimo
                            </span>
                          ) : (
                            <span className="text-amber-800 font-semibold text-[11px]">
                              Faltam {formatCurrencyBRL(deficit)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Inspecionar Proposta e Gerar Pedido */}
                    <div className="pt-2 border-t border-neutral-200 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectVendor(vendor.id)}
                        className="flex-1 py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Ver os preços e lances detalhados deste fornecedor"
                      >
                        <span>Ver Lances / Inspecionar</span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {vendor.phone && (
                        <a
                          href={`https://wa.me/${vendor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Olá, ${vendor.name} (${vendor.company})!\nEstamos analisando sua proposta para a cotação ${quotation.title} (${quotation.code}).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
};
