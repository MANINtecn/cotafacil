import React from 'react';
import { PurchaseOrder } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';
import { Check, X, FileText, Send, Building2 } from 'lucide-react';

interface Props {
  order: PurchaseOrder | null;
  onClose: () => void;
}

export const OrderSuccessModal: React.FC<Props> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-neutral-200 shadow-xl space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
          <Check className="w-6 h-6 stroke-[2.5]" />
        </div>

        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            Pedido Emitido com Sucesso
          </span>
          <h3 className="text-base font-bold text-neutral-900">
            {order.company}
          </h3>
          <p className="text-xs text-neutral-500">
            Pedido de compra <strong>{order.id}</strong> validado e registrado.
          </p>
        </div>

        {/* Financial Recap Box */}
        <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span>Representante:</span>
            <span className="font-medium text-neutral-800">{order.vendorName}</span>
          </div>
          <div className="flex items-center justify-between text-neutral-500">
            <span>Itens Vencedores:</span>
            <span className="font-semibold text-neutral-800">{order.itemsCount} produtos</span>
          </div>
          <div className="flex items-center justify-between border-t border-neutral-200/80 pt-2 text-neutral-900 font-bold">
            <span>Valor Total Aprovado:</span>
            <span className="font-mono-num text-sm text-emerald-700">
              {formatCurrencyBRL(order.totalAmount)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all active:scale-[0.99] cursor-pointer"
        >
          Voltar ao Painel
        </button>
      </div>
    </div>
  );
};
