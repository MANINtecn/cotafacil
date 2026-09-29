import React, { useState } from 'react';
import { Vendor, Product, Quotation } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';
import {
  CheckCircle2,
  Clock,
  Building2,
  Phone,
  Truck,
  Send,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  Store
} from 'lucide-react';

interface Props {
  vendor: Vendor;
  quotation: Quotation;
  storeName: string;
  storeWhatsApp?: string;
  products: Product[];
  initialPrices?: Record<string, number | null>;
  onSubmitProposal: (prices: Record<string, number | null>, notes: string) => void;
  onBackToApp?: () => void;
}

export const SupplierPortalView: React.FC<Props> = ({
  vendor,
  quotation,
  storeName,
  storeWhatsApp,
  products,
  initialPrices = {},
  onSubmitProposal,
  onBackToApp,
}) => {
  // Local state for supplier's input prices
  const [pricesState, setPricesState] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    products.forEach((p) => {
      const val = initialPrices[p.id];
      init[p.id] = val !== null && val !== undefined ? String(val).replace('.', ',') : '';
    });
    return init;
  });

  const [deliveryNotes, setDeliveryNotes] = useState(vendor.deliveryDays || 'Entrega em 24h');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Calculate parsed numerical prices
  const parsedPrices: Record<string, number | null> = {};
  let totalProposal = 0;
  let quotedCount = 0;

  products.forEach((p) => {
    const raw = pricesState[p.id] || '';
    const num = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      parsedPrices[p.id] = Math.round(num * 100) / 100;
      totalProposal += parsedPrices[p.id]! * p.quantity;
      quotedCount += 1;
    } else {
      parsedPrices[p.id] = null;
    }
  });

  // Minimum order validation (from supplier's own perspective)
  const minOrder = vendor.minOrderValue || 0;
  const minOrderMet = totalProposal >= minOrder;
  const deficit = Math.max(0, minOrder - totalProposal);
  const minPercent = minOrder > 0 ? Math.min(100, Math.round((totalProposal / minOrder) * 100)) : 100;

  const handlePriceChange = (productId: string, value: string) => {
    // Only allow numbers and one comma/dot
    const clean = value.replace(/[^0-9.,]/g, '');
    setPricesState((prev) => ({
      ...prev,
      [productId]: clean,
    }));
    if (isSubmitted) {
      setIsSubmitted(false);
    }
  };

  const handleSaveAndSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (quotedCount === 0) {
      setErrorNotice('Informe o preço de pelo menos um produto antes de enviar a proposta.');
      return;
    }

    setErrorNotice(null);
    onSubmitProposal(parsedPrices, deliveryNotes);
    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDeadlineReadable = () => {
    if (quotation.deadlineAt) {
      try {
        return new Intl.DateTimeFormat('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(quotation.deadlineAt));
      } catch {
        return `${quotation.deadlineHours} horas`;
      }
    }
    return `${quotation.deadlineHours} horas`;
  };

  const handleNotifyShopkeeperWhatsApp = () => {
    const rawPhone = (storeWhatsApp || '').replace(/\D/g, '');
    const cleanPhone = rawPhone.length === 10 || rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
    const msg =
      `Olá, loja *${storeName}*!\n\n` +
      `Aqui é *${vendor.name}* da distribuidora *${vendor.company}*.\n` +
      `Acabei de preencher e enviar a proposta de preços para a cotação *${quotation.title}* (${quotation.code}).\n\n` +
      `📦 *Itens cotados:* ${quotedCount} de ${products.length}\n` +
      `💰 *Valor total da nossa proposta:* ${formatCurrencyBRL(totalProposal)}\n` +
      `🚚 *Prazo de entrega informado:* ${deliveryNotes}\n\n` +
      `Obrigado pela preferência!`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center selection:bg-neutral-900 selection:text-white pb-20">
      {/* Top Navbar */}
      <header className="w-full bg-neutral-950 text-white px-4 lg:px-8 py-3.5 border-b border-neutral-800 shadow-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-black text-sm">
              <Store className="w-4 h-4 text-neutral-950" />
            </div>
            <div>
              <div className="text-xs text-neutral-400 leading-tight">
                Cotação aberta pela loja:
              </div>
              <div className="text-sm font-bold text-white tracking-tight">
                {storeName || 'Loja Solicitante'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono-num font-bold px-2.5 py-1 rounded-full bg-neutral-800 text-emerald-400 border border-neutral-700">
              {quotation.code || 'COT-B2B'}
            </span>
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="text-xs text-neutral-400 hover:text-white px-2 py-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Painel Geral
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full px-4 lg:px-8 pt-6 space-y-6">
        {/* Welcome Banner for the Supplier */}
        <div className="bg-white rounded-3xl p-6 border-2 border-neutral-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Portal do Fornecedor & Distribuidor
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight mt-0.5">
                Olá, {vendor.name} ({vendor.company})!
              </h1>
            </div>

            <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs">
              <Clock className="w-4 h-4 text-neutral-500" />
              <span>
                Prazo limite:{' '}
                <strong className="text-neutral-900 font-bold capitalize">
                  {getDeadlineReadable()}
                </strong>
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-600 leading-relaxed">
            A loja <strong>{storeName}</strong> selecionou sua distribuidora para cotar os itens abaixo. Digite o seu valor unitário para cada produto. Você pode cotar quantos itens desejar. Se não tiver algum produto em estoque, basta deixar o campo em branco.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-500 pt-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-neutral-400" />
              <span>Distribuidora: <strong className="text-neutral-800">{vendor.company}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-neutral-400" />
              <span>WhatsApp: <strong className="text-neutral-800">{vendor.phone || 'Cadastrado'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-neutral-400" />
              <span>Pedido Mínimo Exigido: <strong className="text-neutral-800 font-mono-num">{formatCurrencyBRL(vendor.minOrderValue)}</strong></span>
            </div>
          </div>
        </div>

        {/* Success Confirmation Toast/Banner */}
        {isSubmitted && (
          <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-900">
                  Proposta Enviada com Sucesso!
                </h3>
                <p className="text-xs text-emerald-800">
                  Seus preços foram registrados no sistema da loja <strong>{storeName}</strong>. O lojista fará a apuração da cotação.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-emerald-200/80 text-xs">
              <div className="font-semibold text-emerald-900">
                Total da sua proposta: <strong className="text-sm font-bold font-mono-num">{formatCurrencyBRL(totalProposal)}</strong> ({quotedCount} produtos)
              </div>

              <button
                type="button"
                onClick={handleNotifyShopkeeperWhatsApp}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Avisar a Loja no WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorNotice && (
          <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{errorNotice}</span>
            </div>
            <button
              onClick={() => setErrorNotice(null)}
              className="text-rose-500 hover:text-rose-900 font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Products List & Quoting Form */}
        <form onSubmit={handleSaveAndSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Products List (8 cols on desktop) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    Lista de Produtos Solicitados ({products.length} itens)
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Informe o seu preço unitário (por {products[0]?.unit || 'unidade'}) para cada item
                  </p>
                </div>

                <span className="text-xs font-mono-num font-bold px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700">
                  {quotedCount} de {products.length} cotados
                </span>
              </div>

              {products.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl">
                  Nenhum produto cadastrado nesta cotação no momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {products.map((product, index) => {
                    const priceRaw = pricesState[product.id] || '';
                    const parsed = parseFloat(priceRaw.replace(/\./g, '').replace(',', '.'));
                    const validPrice = !isNaN(parsed) && parsed > 0 ? parsed : null;
                    const subtotal = validPrice !== null ? validPrice * product.quantity : null;

                    return (
                      <div
                        key={product.id}
                        className={`p-4 rounded-2xl border-2 transition-all bg-white shadow-2xs space-y-3 ${
                          validPrice !== null
                            ? 'border-neutral-900/40 bg-neutral-50/30'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Product Info */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span className="font-mono-num font-bold text-xs text-neutral-400 w-6 pt-0.5 text-right shrink-0">
                              #{index + 1}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-neutral-900 leading-tight">
                                {product.name}
                              </div>
                              <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                                <span>Quantidade solicitada:</span>
                                <strong className="font-mono-num text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md font-bold">
                                  {product.quantity} {product.unit.toUpperCase()}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* Price Input & Subtotal */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block text-right">
                                Preço Unitário (R$ / {product.unit})
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-xs font-bold text-neutral-500 pointer-events-none">
                                  R$
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={priceRaw}
                                  onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                  placeholder="0,00"
                                  className="w-32 pl-9 pr-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs font-mono-num font-bold text-neutral-900 focus:outline-hidden transition-all text-right shadow-xs"
                                />
                              </div>
                            </div>

                            {/* Subtotal Display */}
                            <div className="w-28 text-right space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                                Subtotal
                              </span>
                              <div className="font-mono-num font-bold text-xs text-neutral-900 py-2">
                                {subtotal !== null ? (
                                  <span className="text-emerald-700 font-extrabold">
                                    {formatCurrencyBRL(subtotal)}
                                  </span>
                                ) : (
                                  <span className="text-neutral-400 font-normal">—</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Summary (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-3xl p-5 border-2 border-neutral-200/90 shadow-2xs space-y-4">
              <div className="pb-3 border-b border-neutral-100">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Resumo da sua Proposta
                </span>
                <div className="text-2xl font-black font-mono-num text-neutral-900 tracking-tight mt-0.5">
                  {formatCurrencyBRL(totalProposal)}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  {quotedCount} de {products.length} itens precificados
                </div>
              </div>

              {/* Minimum Order Gauge for this supplier */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-600 font-medium">Seu Pedido Mínimo:</span>
                  <span className="font-bold font-mono-num text-neutral-900">
                    {formatCurrencyBRL(minOrder)}
                  </span>
                </div>

                <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      minOrderMet ? 'bg-emerald-500' : 'bg-neutral-800'
                    }`}
                    style={{ width: `${minPercent}%` }}
                  />
                </div>

                <div className="text-[11px]">
                  {minOrderMet ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sua proposta atinge o seu pedido mínimo ({minPercent}%)
                    </span>
                  ) : (
                    <span className="text-amber-800 font-medium">
                      Faltam <strong>{formatCurrencyBRL(deficit)}</strong> para atingir seu pedido mínimo ({minPercent}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery time note */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Prazo / Observação de Entrega</span>
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ex: Entrega em 24h com frete grátis"
                  className="w-full px-3 py-2 bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-300 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 focus:outline-hidden transition-all font-semibold"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-neutral-950 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Salvar e Enviar Proposta</span>
              </button>

              <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
                Ao enviar, seus preços ficam salvos para a loja avaliar e aprovar o pedido. Você pode atualizar seus valores antes do encerramento da cotação.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
