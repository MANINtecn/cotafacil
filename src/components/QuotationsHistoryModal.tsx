import React, { useState } from 'react';
import { QuotationBundle } from '../utils/storeManager';
import {
  History,
  RotateCcw,
  Calendar,
  Package,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { formatCurrencyBRL } from '../utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  historyList: QuotationBundle[];
  onReuseQuotation: (bundle: QuotationBundle) => void;
  onDeleteFromHistory: (code: string) => void;
  onSelectQuotation?: (code: string) => void;
}

export const QuotationsHistoryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  historyList,
  onReuseQuotation,
  onDeleteFromHistory,
  onSelectQuotation,
}) => {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return isoString;
    }
  };

  const toggleExpand = (code: string) => {
    setExpandedCode((prev) => (prev === code ? null : code));
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 border-2 border-neutral-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Histórico de Listas & Cotações
              </h3>
              <p className="text-xs text-neutral-500">
                Veja suas listas anteriores e clique em "Reutilizar" para editar quantidades e lançar uma nova cotação rapidamente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800 text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* History List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {historyList.length === 0 ? (
            <div className="p-10 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-200 rounded-2xl space-y-2">
              <Package className="w-8 h-8 text-neutral-300 mx-auto" />
              <div className="font-bold text-neutral-600 text-sm">Nenhuma lista no histórico ainda</div>
              <p className="text-neutral-400 max-w-sm mx-auto">
                Assim que você disparar sua primeira lista de cotação, ela ficará salva aqui para você reutilizar quando quiser.
              </p>
            </div>
          ) : (
            historyList.map((bundle) => {
              const isExpanded = expandedCode === bundle.quotation.code;
              const productsCount = bundle.products?.length || 0;
              const vendorsCount = bundle.vendors?.length || 0;

              return (
                <div
                  key={bundle.quotation.code}
                  className="p-4 rounded-2xl border-2 border-neutral-200 hover:border-neutral-300 bg-white shadow-2xs space-y-3 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-neutral-900">
                          {bundle.quotation.title}
                        </span>
                        <span className="text-[11px] font-mono-num font-bold px-2 py-0.5 rounded-full bg-neutral-900 text-white">
                          {bundle.quotation.code}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {bundle.quotation.status}
                        </span>
                      </div>

                      <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Criada em: <strong>{formatDate(bundle.quotation.createdAt || bundle.updatedAt)}</strong></span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-neutral-700">
                          <Package className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{productsCount} {productsCount === 1 ? 'produto' : 'produtos'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-neutral-700">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{vendorsCount} {vendorsCount === 1 ? 'fornecedor' : 'fornecedores'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {onSelectQuotation && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectQuotation(bundle.quotation.code);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs transition-all"
                          title="Abrir e auditar esta lista no painel agora"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Abrir no Painel</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpand(bundle.quotation.code)}
                        className="px-2.5 py-1.5 rounded-xl border-2 border-neutral-300 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>{isExpanded ? 'Ocultar' : 'Ver Itens'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => onReuseQuotation(bundle)}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all border border-black"
                        title="Reutilizar os produtos desta lista em uma nova cotação"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Reutilizar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteFromHistory(bundle.quotation.code)}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Excluir do histórico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items Preview */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-neutral-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                        Produtos cadastrados nesta lista:
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {bundle.products?.map((p, idx) => (
                          <div
                            key={p.id || idx}
                            className="p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs flex items-center justify-between"
                          >
                            <span className="font-semibold text-neutral-800 truncate pr-1">
                              {p.name}
                            </span>
                            <span className="font-mono-num font-bold text-neutral-600 shrink-0 uppercase">
                              {p.quantity} {p.unit}
                            </span>
                          </div>
                        ))}
                      </div>

                      {bundle.vendors && bundle.vendors.length > 0 && (
                        <div className="pt-1 text-[11px] text-neutral-500">
                          <strong>Fornecedores convocados:</strong>{' '}
                          {bundle.vendors.map((v) => v.company || v.name).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div className="text-xs text-neutral-500">
            {historyList.length} {historyList.length === 1 ? 'lista salva' : 'listas salvas'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
