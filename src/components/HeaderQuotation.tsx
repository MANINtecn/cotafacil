import React, { useState, useEffect } from 'react';
import { Quotation, ShopkeeperStore } from '../types';
import { User } from '../supabase';
import { Clock, ShoppingCart, Store, Building2, LogOut, PlusCircle, History, CreditCard } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  quotation: Quotation;
  store?: ShopkeeperStore | null;
  user: User | null;
  authLoading: boolean;
  onOpenOrders: () => void;
  ordersCount: number;
  historyCount?: number;
  vendorsCount?: number;
  onLaunchQuotation?: () => void;
  onOpenManageVendors?: () => void;
  onOpenHistory?: () => void;
  onOpenBilling?: () => void;
  onLogout?: () => void;
  isHome?: boolean;
  onGoHome?: () => void;
}

export const HeaderQuotation: React.FC<Props> = ({
  quotation,
  store,
  user,
  authLoading,
  onOpenOrders,
  ordersCount,
  historyCount = 0,
  vendorsCount = 0,
  onLaunchQuotation,
  onOpenManageVendors,
  onOpenHistory,
  onOpenBilling,
  onLogout,
  isHome = false,
  onGoHome,
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
        {/* Left Side: Store Dashboard Home vs Single Quotation View */}
        {isHome ? (
          /* ======================================================== */
          /* 1. HOME DASHBOARD HEADER (DADOS DA LOJA & CENTRAL)       */
          /* ======================================================== */
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  Painel do Lojista
                </span>
                {store && (
                  <span className="text-[11px] text-neutral-400 font-mono-num font-semibold">
                    /{store.slug}
                  </span>
                )}
              </div>

              <span className="text-neutral-300 hidden sm:inline">•</span>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800 text-[11px] font-bold">
                <span>{historyCount} {historyCount === 1 ? 'Lista em Aberto' : 'Listas em Aberto'}</span>
              </div>

              {vendorsCount > 0 && (
                <>
                  <span className="text-neutral-300 hidden sm:inline">•</span>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-medium">
                    <span>{vendorsCount} {vendorsCount === 1 ? 'Fornecedor' : 'Fornecedores'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <h1 className="text-lg lg:text-2xl font-black tracking-tight text-neutral-950">
                {store ? store.name : 'A Casa do Senhor'}
              </h1>
              <span className="text-xs text-neutral-500 hidden sm:inline">
                Central de Cotações & Compras B2B
              </span>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* 2. QUOTATION DETAIL HEADER (DENTRO DA LISTA SELECIONADA)  */
          /* ======================================================== */
          <div className="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
            {onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                title="Voltar ao início do painel da loja"
              >
                <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Início</span>
              </button>
            )}

            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>{quotation.status || 'Em Cotação'}</span>
              </div>

              <span className="text-neutral-300 hidden sm:inline">•</span>

              {/* Countdown Badge */}
              <div className="inline-flex items-center gap-1.5 text-xs text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200/80">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span>Restam:</span>
                <span className="font-mono-num font-bold text-neutral-900">{timeFormatted}</span>
              </div>

              <span className="text-neutral-300 hidden sm:inline">•</span>

              <span className="text-xs text-neutral-500 font-mono-num font-semibold">
                {quotation.code}
              </span>
            </div>
          </div>
        )}

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

          {/* Mensalidade & Mercado Pago Trigger */}
          {onOpenBilling && (
            <button
              onClick={onOpenBilling}
              title="Ver mensalidade da loja e realizar pagamento com Mercado Pago"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-900 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200 transition-colors shadow-2xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-sky-600" />
              <span>Mensalidade</span>
            </button>
          )}

          {/* Gerenciar Fornecedores Trigger - shown on Home */}
          {isHome && onOpenManageVendors && (
            <button
              onClick={onOpenManageVendors}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-xl border border-neutral-200/80 transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Fornecedores</span>
            </button>
          )}

          {/* Histórico de Listas Trigger - shown on Home */}
          {isHome && onOpenHistory && (
            <button
              onClick={onOpenHistory}
              title="Ver histórico de listas anteriores para reutilizar"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200/80 px-3 py-1.5 rounded-xl border border-neutral-200/80 transition-colors cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-neutral-600" />
              <span>Histórico</span>
              {historyCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-neutral-800 text-white text-[10px] font-bold flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {/* PWA Install Trigger */}
          <PWAInstallButton variant="compact" />

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
