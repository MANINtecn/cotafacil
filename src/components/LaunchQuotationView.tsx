import React, { useState } from 'react';
import { Product, Vendor } from '../types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onLaunchQuotation: (
    title: string,
    deadlineHours: number,
    products: Product[],
    selectedVendorIds: string[],
    notes: string,
    deadlineAt?: string
  ) => void;
  initialProducts: Product[];
  vendors: Vendor[];
}

export const LaunchQuotationView: React.FC<Props> = ({
  onBack,
  onLaunchQuotation,
  initialProducts,
  vendors,
}) => {
  // Empty values by default - no hardcoded/mock text
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);

  // Helper to format default deadline: 2 days ahead at 18:00
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    d.setHours(18, 0, 0, 0);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const [deadlineDateTime, setDeadlineDateTime] = useState(getDefaultDeadline());

  // New item inputs - completely clean without hortifruti categories
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<string>('1');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Selected vendors for quotation
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(
    vendors.map((v) => v.id)
  );

  const handleAddProduct = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemName.trim()) {
      setValidationError('Digite o nome do produto antes de adicionar.');
      return;
    }

    setValidationError(null);
    const parsedQty = parseFloat(newItemQty.replace(',', '.'));
    const validQty = isNaN(parsedQty) || parsedQty <= 0 ? 1 : parsedQty;

    const newProd: Product = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newItemName.trim(),
      quantity: validQty,
      unit: newItemUnit,
    };

    setProductsList((prev) => [...prev, newProd]);
    setNewItemName('');
    setNewItemQty('1');
  };

  const handleRemoveProduct = (id: string) => {
    setProductsList((prev) => prev.filter((p) => p.id !== id));
  };

  const handleUpdateProductQty = (id: string, newQtyStr: string) => {
    const parsed = parseFloat(newQtyStr.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) return;
    setProductsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: parsed } : p))
    );
  };

  const handleToggleVendor = (vendorId: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const formatDeadlineReadable = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (productsList.length === 0) {
      setValidationError('Adicione pelo menos um produto na lista para disparar a cotação.');
      return;
    }

    if (selectedVendorIds.length === 0) {
      setValidationError('Selecione pelo menos um fornecedor para receber a cotação.');
      return;
    }

    const targetDate = new Date(deadlineDateTime);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
    const calculatedHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

    onLaunchQuotation(
      title.trim() || 'Nova Cotação de Compras',
      calculatedHours,
      productsList,
      selectedVendorIds,
      notes.trim(),
      targetDate.toISOString()
    );
  };

  const nowMinIso = new Date().toISOString().slice(0, 16);

  return (
    <div className="flex-1 flex flex-col pb-16 bg-neutral-50/50 min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 py-1.5 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-500" />
              <span>Voltar</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-bold tracking-tight text-neutral-900">
                  Lançar Nova Lista de Cotação
                </h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 tracking-wider">
                  Cotação B2B
                </span>
              </div>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Cadastre os produtos da compra, defina a data de encerramento e notifique os fornecedores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Disparar Cotação</span>
            <span className="sm:hidden">Disparar</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-5 space-y-6 flex-1">
        {/* Error notification */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Quotation details + Product List */}
          <div className="lg:col-span-8 space-y-5">
            {/* Box 1: Dados da Cotação */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  1. Dados da Cotação
                </h2>
                <span className="text-[11px] text-neutral-400">Etapa 1 de 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Title */}
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                    Nome da Lista / Título da Compra *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Digite o título da lista de compras"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                  />
                </div>

                {/* Calendar / Datetime picker */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide flex items-center justify-between">
                    <span>Encerramento da Cotação *</span>
                    <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  </label>
                  <input
                    type="datetime-local"
                    min={nowMinIso}
                    value={deadlineDateTime}
                    onChange={(e) => setDeadlineDateTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-hidden transition-all cursor-pointer shadow-xs"
                  />
                </div>
              </div>

              {deadlineDateTime && (
                <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>
                    A cotação receberá propostas até:{' '}
                    <strong className="text-neutral-900 font-bold capitalize">
                      {formatDeadlineReadable(deadlineDateTime)}
                    </strong>
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                  Instruções ou Observações para os Fornecedores (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações ou instruções para os fornecedores"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Box 2: Produtos da Cotação */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  2. Produtos da Cotação ({productsList.length} itens)
                </h2>
                <span className="text-[11px] text-neutral-500">Adicione os itens manualmente</span>
              </div>

              {/* Add New Product Form - Clean without category */}
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Adicionar Item
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Nome do Produto */}
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProduct();
                        }
                      }}
                      placeholder="Nome do produto"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProduct();
                        }
                      }}
                      placeholder="Qtd"
                      className="w-full px-3 py-2.5 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs font-mono-num font-bold text-neutral-900 focus:outline-hidden transition-all shadow-xs"
                    />
                  </div>

                  {/* Unidade */}
                  <div className="sm:col-span-2">
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full px-2.5 py-2.5 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs font-bold text-neutral-800 focus:outline-hidden transition-all cursor-pointer shadow-xs uppercase"
                    >
                      <option value="un">UN (Unidade)</option>
                      <option value="cx">CX (Caixa)</option>
                      <option value="sc">SC (Saco)</option>
                      <option value="kg">KG (Quilo)</option>
                      <option value="bdj">BDJ (Bandeja)</option>
                      <option value="pc">PC (Peça)</option>
                      <option value="mt">MT (Metro)</option>
                      <option value="lt">LT (Litro)</option>
                    </select>
                  </div>

                  {/* Botão Adicionar */}
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddProduct}
                      className="w-full py-2.5 px-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Inserir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Vertical List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {productsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-200 rounded-xl space-y-1">
                    <div className="font-semibold text-neutral-600">Nenhum produto na lista ainda</div>
                    <p className="text-[11px] text-neutral-400">
                      Digite o nome do produto e a quantidade no campo acima para adicionar itens à cotação.
                    </p>
                  </div>
                ) : (
                  productsList.map((product, index) => (
                    <div
                      key={product.id}
                      className="p-3.5 rounded-xl border-2 border-neutral-200 hover:border-neutral-300 bg-white flex items-center justify-between gap-3 shadow-2xs text-xs transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono-num font-bold text-neutral-400 text-xs w-6 text-right shrink-0">
                          #{index + 1}
                        </span>

                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 truncate text-xs">
                            {product.name}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-lg border border-neutral-200">
                          <span className="text-neutral-500 text-[11px]">Qtd:</span>
                          <input
                            type="text"
                            defaultValue={product.quantity}
                            onBlur={(e) => handleUpdateProductQty(product.id, e.target.value)}
                            className="w-14 px-1 py-0.5 text-center font-mono-num font-bold text-neutral-900 bg-white border border-neutral-300 rounded text-xs focus:outline-hidden focus:border-neutral-900"
                          />
                          <span className="text-neutral-800 font-bold uppercase text-[11px] w-7">
                            {product.unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover produto da lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Suppliers Selection & Summary */}
          <div className="lg:col-span-4 space-y-5">
            {/* Box 3: Fornecedores a Notificar */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Fornecedores a Notificar
                </h2>
                <span className="text-[11px] font-mono-num font-bold text-neutral-600">
                  {selectedVendorIds.length} selecionados
                </span>
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed">
                Selecione os fornecedores cadastrados que receberão esta lista para preencher preços:
              </p>

              <div className="space-y-2">
                {vendors.length === 0 ? (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-500 text-center">
                    Nenhum fornecedor cadastrado na sua loja. Você pode cadastrar fornecedores pelo botão no cabeçalho.
                  </div>
                ) : (
                  vendors.map((vendor) => {
                    const isSelected = selectedVendorIds.includes(vendor.id);
                    return (
                      <div
                        key={vendor.id}
                        onClick={() => handleToggleVendor(vendor.id)}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'border-neutral-900 bg-neutral-50 shadow-2xs'
                            : 'border-neutral-200 bg-white opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-neutral-900 truncate">
                            {vendor.company}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            Contato: {vendor.name} • Pedido Mínimo: R$ {vendor.minOrderValue.toFixed(2)}
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-neutral-900 border-neutral-900 text-white'
                              : 'border-neutral-300 bg-white'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Box 4: Resumo & Disparo */}
            <div className="bg-neutral-900 text-white rounded-2xl p-5 shadow-xs space-y-4">
              <div className="space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Resumo da Operação
                </div>
                <div className="text-xl font-bold tracking-tight">
                  Pronto para cotar
                </div>
              </div>

              <div className="space-y-2 text-xs text-neutral-300 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <span>Total de produtos:</span>
                  <strong className="text-white font-mono-num">{productsList.length} itens</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fornecedores selecionados:</span>
                  <strong className="text-white font-mono-num">{selectedVendorIds.length} convidados</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Encerramento:</span>
                  <strong className="text-emerald-400 font-medium capitalize truncate max-w-[170px] text-right">
                    {formatDeadlineReadable(deadlineDateTime) || 'Data definida'}
                  </strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-100 active:scale-[0.99] text-neutral-950 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Disparar Lista & Iniciar Cotação</span>
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
