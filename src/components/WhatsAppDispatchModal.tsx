import React, { useState } from 'react';
import { Vendor, Quotation, Product } from '../types';
import { MessageCircle, Check, Copy, ExternalLink, Send, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { buildSupplierQuotationLink } from '../utils/storeManager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  quotation: Quotation;
  storeName: string;
  storeWhatsApp?: string;
  productsCount: number;
  products?: Product[];
  vendors: Vendor[];
  storeSlug?: string;
}

export const WhatsAppDispatchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  quotation,
  storeName,
  storeWhatsApp,
  productsCount,
  products = [],
  vendors,
  storeSlug,
}) => {
  const [openedVendors, setOpenedVendors] = useState<string[]>([]);
  const [copiedVendorId, setCopiedVendorId] = useState<string | null>(null);
  const [copiedMessageVendorId, setCopiedMessageVendorId] = useState<string | null>(null);

  if (!isOpen) return null;

  const getVendorLink = (vendor: Vendor) => {
    return buildSupplierQuotationLink(quotation, vendor, products, storeName, storeWhatsApp, vendors, storeSlug);
  };

  const getDeadlineReadable = () => {
    if (quotation.deadlineAt) {
      try {
        return new Intl.DateTimeFormat('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date(quotation.deadlineAt));
      } catch {
        return `${quotation.deadlineHours} horas`;
      }
    }
    return `${quotation.deadlineHours} horas`;
  };

  const getGreetingRecipient = (vendor: Vendor) => {
    const rawName = (vendor.name || '').trim();
    const rawCompany = (vendor.company || '').trim();

    if (!rawName && !rawCompany) return '';
    if (!rawName) return `*${rawCompany}*`;
    if (!rawCompany) return `*${rawName}*`;

    // Se nome e empresa forem iguais (ex: Distribuidora X e Distribuidora X)
    if (rawName.toLowerCase() === rawCompany.toLowerCase()) {
      return `*${rawCompany}*`;
    }

    // Se um contém o outro
    if (rawCompany.toLowerCase().includes(rawName.toLowerCase())) {
      return `*${rawCompany}*`;
    }
    if (rawName.toLowerCase().includes(rawCompany.toLowerCase())) {
      return `*${rawName}*`;
    }

    // Se forem distintos (ex: Carlos e Distribuidora Bom Preço)
    return `*${rawName}* (${rawCompany})`;
  };

  const getMessageText = (vendor: Vendor) => {
    const link = getVendorLink(vendor);
    const deadline = getDeadlineReadable();
    const recipient = getGreetingRecipient(vendor);
    const sName = (storeName || '').trim();

    const greetingLine = recipient ? `Olá, ${recipient}!\n\n` : `Olá!\n\n`;
    const storeLine = sName ? `Aqui é da loja *${sName}*.\n` : '';

    return (
      greetingLine +
      storeLine +
      `Acabamos de abrir uma nova cotação: *${quotation.title}* (${quotation.code || 'B2B'}).\n\n` +
      `📦 *Total de itens:* ${productsCount} produtos\n` +
      `⏰ *Prazo final para resposta:* ${deadline}\n\n` +
      `Acesse o link direto abaixo para preencher os seus preços:\n` +
      `${link}\n\n` +
      `Aguardamos sua melhor proposta. Obrigado!`
    );
  };


  const handleOpenWhatsApp = (vendor: Vendor) => {
    const digits = (vendor.phone || '').replace(/\D/g, '');
    const cleanPhone = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
    const msg = getMessageText(vendor);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;

    setOpenedVendors((prev) => (prev.includes(vendor.id) ? prev : [...prev, vendor.id]));
    window.open(waUrl, '_blank');
  };

  const handleDispatchAll = () => {
    // Sequentially open WhatsApp for all vendors so popups are not blocked
    vendors.forEach((vendor, idx) => {
      setTimeout(() => {
        handleOpenWhatsApp(vendor);
      }, idx * 600);
    });
  };

  const handleCopyLink = async (vendor: Vendor) => {
    const link = getVendorLink(vendor);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedVendorId(vendor.id);
      setTimeout(() => setCopiedVendorId(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleCopyMessage = async (vendor: Vendor) => {
    const msg = getMessageText(vendor);
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedMessageVendorId(vendor.id);
      setTimeout(() => setCopiedMessageVendorId(null), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 border-2 border-neutral-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-xs">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">
                  Cotação Iniciada com Sucesso!
                </h3>
                <span className="text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                  {quotation.code || 'COT-001'}
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Clique no botão de cada fornecedor abaixo para abrir o WhatsApp direto com o link da cotação
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800 text-lg font-bold p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-600">
            <div>
              <strong>Lista:</strong> {quotation.title}
            </div>
            <div>
              <strong>Itens:</strong> {productsCount} produtos
            </div>
            <div>
              <strong>Encerramento:</strong> <span className="capitalize">{getDeadlineReadable()}</span>
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 leading-tight">
            Cada link contém o identificador exclusivo do fornecedor para ele preencher os preços unitários sem precisar de login.
          </p>
        </div>

        {/* Quick Action: Send to All Suppliers */}
        <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-300 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
          <div>
            <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>Disparo Geral de WhatsApp</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Acione todos os <strong>{vendors.length} fornecedores</strong> de uma só vez ou clique em cada distribuidor individualmente abaixo.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDispatchAll}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Disparar para Todos ({vendors.length})</span>
          </button>
        </div>

        {/* Vendors List with 1-click WhatsApp buttons */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {vendors.map((vendor, index) => {
            const hasOpened = openedVendors.includes(vendor.id);
            const isCopied = copiedVendorId === vendor.id;
            const isMsgCopied = copiedMessageVendorId === vendor.id;

            return (
              <div
                key={vendor.id}
                className="p-4 rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 bg-white shadow-2xs space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{vendor.company}</span>
                      {hasOpened ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Aberto no WhatsApp
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                          Pendente de Envio
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-2">
                      <span>Contato: <strong className="text-neutral-700">{vendor.name}</strong></span>
                      <span>•</span>
                      <span className="font-mono-num font-semibold text-neutral-800">
                        {vendor.phone || 'Sem telefone'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyLink(vendor)}
                      className="px-2.5 py-1.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Copiar link da cotação"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-neutral-500" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(vendor)}
                      className="hidden sm:flex px-2.5 py-1.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-semibold items-center gap-1 cursor-pointer transition-colors"
                      title="Copiar mensagem pronta"
                    >
                      {isMsgCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Texto Copiado!</span>
                        </>
                      ) : (
                        <span>Copiar Texto</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(vendor)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Abrir WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Direct link preview */}
                <div className="px-3 py-1.5 rounded-xl bg-neutral-50 border border-neutral-200 text-[11px] font-mono-num text-neutral-600 flex items-center justify-between gap-2 overflow-hidden">
                  <span className="truncate text-neutral-500">{getVendorLink(vendor)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-500">
            {openedVendors.length} de {vendors.length} fornecedores acionados
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Concluir e Acompanhar Cotação</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
