import React from 'react';
import { PurchaseOrder } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';
import { X, CheckCircle2, Calendar, ShoppingCart } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orders: PurchaseOrder[];
}

export const OrdersDrawer: React.FC<Props> = ({ isOpen, onClose, orders }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-xs flex justify-end">
      <div className="bg-white w-full max-w-sm h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-neutral-600" />
            <h2 className="text-sm font-bold text-neutral-900">
              Pedidos de Compra Gerados ({orders.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-neutral-400 text-xs">
              Nenhum pedido gerado ainda.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-900 text-sm">{order.company}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                    {order.status}
                  </span>
                </div>
                <div className="text-neutral-500 flex items-center justify-between text-[11px]">
                  <span>Repr: {order.vendorName}</span>
                  <span className="font-mono-num">{order.itemsCount} itens ganhos</span>
                </div>
                <div className="border-t border-neutral-200/80 pt-2 flex items-center justify-between font-bold text-neutral-900">
                  <span>Total:</span>
                  <span className="font-mono-num text-emerald-700 text-sm">
                    {formatCurrencyBRL(order.totalAmount)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
