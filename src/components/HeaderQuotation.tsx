import React, { useState, useEffect } from 'react';
import { Quotation, ShopkeeperStore } from '../types';
import { User } from 'firebase/auth';
import { Clock, ShoppingCart, Store, Building2, LogOut, PlusCircle } from 'lucide-react';

interface Props {
  quotation: Quotation;
  store?: ShopkeeperStore | null;
  user: User | null;
  authLoading: boolean;
  onOpenOrders: () => void;
  ordersCount: number;
  onLaunchQuotation?: () => void;
  onOpenManageVendors?: () => void;
  onLogout?: () => void;
}

export const HeaderQuotation: React.FC<Props> = ({
  quotation,
  store,
  user,
  authLoading,
  onOpenOrders,
  ordersCount,
  onLaunchQuotation,
  onOpenManageVendors,
  onLogout,
}) => {
  // Real-time ticking countdown supporting deadlineAt date or hours
  const getInitialSeconds = (q: Quotation) => {
    if (q.deadlineAt) {
      const diffMs = new Date(q.deadlineAt).getTime() - Date.now();
      return Math.max(0, Math.floor(diffMs / 1000));
    }
    return q.deadlineHours * 3600 + q.deadlineMinutes * 60 + q.deadlineSeconds;
  };

  const [secondsLeft, setSecondsLeft] = useState(() => getInitialSeconds(quotation));

  useEffect(() => {
    setSecondsLeft(getInitialSeconds(quotation));
  }, [quotation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  const timeFormatted = days > 0
    ? `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 lg:px-8 py-3 lg:py-4 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left Side: Store Name, Title, Status & Countdown */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-neutral-500">
                {store ? store.name : 'Painel do Lojista'}
              </span>
              {store && (
                <span className="text-[10px] text-neutral-400 font-mono-num">
                  /{store.slug}
                </span>
              )}
            </div>

            <span className="text-neutral-300 hidden sm:inline">•</span>

            {/* Status Badge */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {quotation.status}
            </div>

            <span className="text-neutral-300 hidden sm:inline">•</span>

            {/* Countdown Badge */}
            <div className="inline-flex items-center gap-1 text-xs text-neutral-600 bg-neutral-50 px-2 py-0.5 rounded-full border border-neutral-200/80">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Restam:</span>
              <span className="font-mono-num font-bold text-neutral-900">{timeFormatted}</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <h1 className="text-base lg:text-xl font-bold tracking-tight text-neutral-900">
              {quotation.title}
            </h1>
            <span className="text-xs text-neutral-400 font-mono-num hidden sm:inline">
              Código: {quotation.code}
            </span>
          </div>
        </div>

        {/* Right Side: Primary Lojista Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Orders Counter Trigger */}
          {ordersCount > 0 && (
            <button
              onClick={onOpenOrders}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span>{ordersCount} {ordersCount === 1 ? 'Pedido Emitido' : 'Pedidos Emitidos'}</span>
            </button>
          )}

          {/* Gerenciar Fornecedores Trigger */}
          {onOpenManageVendors && (
            <button
              onClick={onOpenManageVendors}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-xl border border-neutral-200/80 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Fornecedores</span>
            </button>
          )}

          {/* Lançar Nova Lista Trigger */}
          {onLaunchQuotation && (
            <button
              onClick={onLaunchQuotation}
              title="Criar e lançar nova lista de compras/cotação"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lançar Lista</span>
            </button>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair da Loja"
              className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
