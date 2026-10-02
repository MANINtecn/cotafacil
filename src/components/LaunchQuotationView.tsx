import React, { useState, useEffect } from 'react';
import { Product, Vendor } from '../types';
import {
  getStoredQuotationDraft,
  saveQuotationDraft,
  clearQuotationDraft,
  QuotationDraft
} from '../utils/storeManager';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Package,
  Layers,
  Save,
  Sparkles
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
  initialTitle?: string;
  vendors: Vendor[];
  storeSlug?: string;
  catalogProducts?: Product[];
  onOpenManageCatalog?: () => void;
  onAddProductToCatalog?: (product: Omit<Product, 'id'>) => void;
  onOpenHistory?: () => void;
}

export const LaunchQuotationView: React.FC<Props> = ({
  onBack,
  onLaunchQuotation,
  initialProducts,
  initialTitle = '',
  vendors,
  storeSlug,
  catalogProducts = [],
  onOpenManageCatalog,
  onAddProductToCatalog,
  onOpenHistory,
}) => {
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

  // Verifica se existe rascunho anterior salvo para este lojista
  const savedDraft = !initialProducts || initialProducts.length === 0 ? getStoredQuotationDraft(storeSlug) : null;

  const [title, setTitle] = useState(() => initialTitle || savedDraft?.title || '');
  const [notes, setNotes] = useState(() => savedDraft?.notes || '');
  const [deadlineDateTime, setDeadlineDateTime] = useState(() => savedDraft?.deadlineDateTime || getDefaultDeadline());
  const [productsList, setProductsList] = useState<Product[]>(() => {
    if (initialProducts && initialProducts.length > 0) return initialProducts;
    if (savedDraft?.products && savedDraft.products.length > 0) return savedDraft.products;
    return [];
  });
  const [draftNotice, setDraftNotice] = useState<string | null>(() => {
    if (savedDraft && savedDraft.products && savedDraft.products.length > 0 && (!initialProducts || initialProducts.length === 0)) {
      return `Rascunho recuperado automaticamente com ${savedDraft.products.length} itens.`;
    }
    return null;
  });

  // Selected vendors for quotation
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>(() => {
    if (savedDraft?.selectedVendorIds && savedDraft.selectedVendorIds.length > 0) {
      return savedDraft.selectedVendorIds;
    }
    return vendors.map((v) => v.id);
  });

  // New item inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState<string>('1');
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [saveToCatalogToo, setSaveToCatalogToo] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync state if initialProducts or initialTitle changes (e.g. from reusing a list from history)
  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProductsList(initialProducts);
      setDraftNotice(null);
    }
  }, [initialProducts]);

  useEffect(() => {
    if (initialTitle) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  // AUTO-SAVE: Salva rascunho em tempo real sempre que produtos ou dados mudam
  useEffect(() => {
    if (productsList.length > 0 || title.trim().length > 0) {
      const draft: QuotationDraft = {
        title,
        notes,
        deadlineDateTime,
        products: productsList,
        selectedVendorIds,
        savedAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      saveQuotationDraft(draft, storeSlug);
    }
  }, [title, notes, deadlineDateTime, productsList, selectedVendorIds, storeSlug]);

  const handleClearDraft = () => {
    if (confirm('Deseja realmente limpar todos os itens deste rascunho e começar uma lista do zero?')) {
      clearQuotationDraft(storeSlug);
      setTitle('');
      setNotes('');
      setProductsList([]);
      setDraftNotice(null);
    }
  };

  // Trata a seleção de um produto a partir do catálogo
  const handleSelectFromCatalog = (catId: string) => {
    setSelectedCatalogId(catId);
    if (!catId) return;

    const found = catalogProducts.find((p) => p.id === catId);
    if (found) {
      setNewItemName(found.name);
      setNewItemUnit(found.unit || 'un');
    }
  };

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
      unit: newItemUnit.toLowerCase(),
    };

    setProductsList((prev) => [...prev, newProd]);

    // Se o usuário optou por cadastrar no catálogo fixo da loja
    if (saveToCatalogToo && onAddProductToCatalog) {
      onAddProductToCatalog({
        name: newItemName.trim(),
        quantity: 1,
        unit: newItemUnit.toLowerCase(),
      });
    }

    setNewItemName('');
    setNewItemQty('1');
    setSelectedCatalogId('');
    setSaveToCatalogToo(false);
  };

  const handleRemoveProduct = (id: string) => {
    setProductsList((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (updated.length === 0 && !title.trim()) {
        clearQuotationDraft(storeSlug);
      }
      return updated;
    });
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

    // Ao disparar com sucesso, limpa o rascunho pendente
    clearQuotationDraft(storeSlug);

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
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 tracking-wider">
                  Cotação B2B
                </span>
              </div>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Cadastre os produtos da compra, defina a data de encerramento e notifique os fornecedores
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {productsList.length > 0 && (
              <button
                type="button"
                onClick={handleClearDraft}
                className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer hidden sm:flex items-center gap-1.5"
                title="Limpar rascunho e começar do zero"
              >
                <Trash2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Limpar Lista</span>
              </button>
            )}

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
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-5 space-y-5 flex-1">
        {/* Banner de Rascunho Persistente Recuperado */}
        {draftNotice && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <Save className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold truncate">
                {draftNotice}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleClearDraft}
                className="text-amber-800 hover:text-amber-950 font-bold underline px-2 py-0.5 text-xs cursor-pointer"
              >
                Limpar Rascunho
              </button>
              <button
                type="button"
                onClick={() => setDraftNotice(null)}
                className="text-amber-600 hover:text-amber-900 font-bold px-2 py-0.5 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {validationError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{validationError}</span>
            </div>
            <button
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner para Reutilizar Lista Anterior */}
        {onOpenHistory && (
          <div className="p-4 rounded-2xl bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Deseja reaproveitar uma lista anterior?</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Histórico
                  </span>
                </h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Recupere os produtos de uma compra anterior com 1 clique e edite apenas as quantidades e itens necessários.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenHistory}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reutilizar do Histórico</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Quotation details + Product List */}
          <div className="lg:col-span-8 space-y-5">
            {/* Box 1: Dados da Cotação */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200/90 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800 flex items-center gap-2">
                  <span>1. Dados da Cotação</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                    Salvamento Automático Ativo
                  </span>
                </h2>
                <span className="text-[11px] text-neutral-400">Etapa 1 de 2</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Title */}
                <div className="sm:col-span-7 space-y-1">
                  <label className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                    Nome da Lista / Título da Compra *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Reposição Semanal de Mercearia"
                    required
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-neutral-700 hover:border-neutral-900 focus:border-neutral-950 rounded-xl text-xs text-neutral-950 font-bold placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                  />
                </div>

                {/* Calendar / Datetime picker */}
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide flex items-center justify-between">
                    <span>Encerramento da Cotação *</span>
                    <Calendar className="w-3.5 h-3.5 text-neutral-700" />
                  </label>
                  <input
                    type="datetime-local"
                    min={nowMinIso}
                    value={deadlineDateTime}
                    onChange={(e) => setDeadlineDateTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border-2 border-neutral-700 hover:border-neutral-900 focus:border-neutral-950 rounded-xl text-xs text-neutral-950 font-bold focus:outline-hidden transition-all cursor-pointer shadow-xs"
                  />
                </div>
              </div>

              {deadlineDateTime && (
                <div className="p-2.5 bg-neutral-50 rounded-xl border-2 border-neutral-300 text-xs text-neutral-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-700 shrink-0" />
                  <span>
                    A cotação receberá propostas até:{' '}
                    <strong className="text-neutral-950 font-extrabold capitalize">
                      {formatDeadlineReadable(deadlineDateTime)}
                    </strong>
                  </span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-neutral-800 uppercase tracking-wide">
                  Instruções ou Observações para os Fornecedores (opcional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Entregar pela manhã na rua lateral; conferência imediata"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-neutral-700 hover:border-neutral-900 focus:border-neutral-950 rounded-xl text-xs text-neutral-950 placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Box 2: Produtos da Cotação */}
            <div className="bg-white rounded-2xl border-2 border-neutral-200/90 p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    2. Produtos da Cotação ({productsList.length} {productsList.length === 1 ? 'item' : 'itens'})
                  </h2>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onOpenManageCatalog && (
                    <button
                      type="button"
                      onClick={onOpenManageCatalog}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-neutral-950 py-1.5 px-3 rounded-xl border-2 border-neutral-300 hover:border-neutral-900 bg-white transition-all cursor-pointer shadow-2xs"
                      title="Gerenciar Catálogo Permanente da Loja"
                    >
                      <Package className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Catálogo de Produtos</span>
                    </button>
                  )}

                  {onOpenHistory && (
                    <button
                      type="button"
                      onClick={onOpenHistory}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-800 hover:text-neutral-950 py-1.5 px-3 rounded-xl border-2 border-neutral-300 hover:border-neutral-900 bg-neutral-50 hover:bg-neutral-100 transition-all cursor-pointer shadow-2xs"
                      title="Carregar itens de uma lista anterior"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="hidden sm:inline">Reutilizar Lista Anterior</span>
                      <span className="sm:hidden">Histórico</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Add New Product Form with Catalog Combobox */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50/90 border-2 border-neutral-400 space-y-3.5 shadow-xs">
                {/* Cabeçalho do Bloco de Adicionar Produto */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Adicionar Produto à Lista</span>
                  </div>

                  {catalogProducts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-neutral-600">Puxar do Catálogo:</span>
                      <select
                        value={selectedCatalogId}
                        onChange={(e) => handleSelectFromCatalog(e.target.value)}
                        className="px-2.5 py-1 bg-white border-2 border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:border-emerald-600 cursor-pointer shadow-2xs max-w-[200px] truncate"
                      >
                        <option value="">Selecione do catálogo...</option>
                        {catalogProducts.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.unit})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* Nome do Produto */}
                  <div className="sm:col-span-6">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => {
                        setNewItemName(e.target.value);
                        if (selectedCatalogId) setSelectedCatalogId('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProduct();
                        }
                      }}
                      placeholder="Nome do produto (ex: Arroz Tipo 1 5kg)"
                      className="w-full px-3.5 py-2.5 bg-white border-2 border-neutral-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-bold text-neutral-950 placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
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
                      placeholder="Qtd (ex: 10)"
                      className="w-full px-3 py-2.5 bg-white border-2 border-neutral-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-mono-num font-black text-neutral-950 focus:outline-hidden transition-all shadow-xs text-center"
                    />
                  </div>

                  {/* Unidade */}
                  <div className="sm:col-span-2">
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value)}
                      className="w-full px-2.5 py-2.5 bg-white border-2 border-neutral-900 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/20 rounded-xl text-xs font-black text-neutral-950 focus:outline-hidden transition-all cursor-pointer shadow-xs uppercase"
                    >
                      <option value="un">UN (Unidade)</option>
                      <option value="cx">CX (Caixa)</option>
                      <option value="pct">PCT (Pacote)</option>
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
                      className="w-full py-2.5 px-3 bg-neutral-950 hover:bg-neutral-800 active:scale-[0.98] text-white rounded-xl text-xs font-black transition-all shadow-sm border-2 border-black cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Inserir</span>
                    </button>
                  </div>
                </div>

                {/* Opção para salvar este item também no catálogo permanente */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-600">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-950">
                    <input
                      type="checkbox"
                      checked={saveToCatalogToo}
                      onChange={(e) => setSaveToCatalogToo(e.target.checked)}
                      className="rounded text-neutral-950 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Salvar também no Catálogo Permanente da loja</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 hidden sm:inline">
                    Pressione Enter para inserir direto
                  </span>
                </div>
              </div>

              {/* Products Vertical List - ULTRA OTIMIZADO PARA MOBILE */}
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {productsList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-neutral-400 border-2 border-dashed border-neutral-300 rounded-xl space-y-1">
                    <div className="font-bold text-neutral-700">Nenhum produto na lista ainda</div>
                    <p className="text-[11px] text-neutral-500">
                      Digite o nome do produto acima ou escolha do seu catálogo permanente para montar a cotação.
                    </p>
                  </div>
                ) : (
                  productsList.map((product, index) => (
                    <div
                      key={product.id}
                      className="p-3 sm:p-3.5 rounded-2xl border-2 border-neutral-300 hover:border-neutral-800 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 shadow-2xs text-xs transition-colors"
                    >
                      {/* LINHA 1 NO MOBILE: Nome do produto com largura total e destaque legível */}
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-mono-num font-bold text-neutral-400 text-xs w-6 text-right shrink-0 pt-0.5 sm:pt-0">
                          #{index + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="font-extrabold text-neutral-950 text-xs sm:text-sm break-words leading-tight">
                            {product.name}
                          </div>
                        </div>
                      </div>

                      {/* LINHA 2 NO MOBILE (ou alinhado à direita no desktop): Controles compactos */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pl-8 sm:pl-0 pt-1.5 sm:pt-0 border-t border-neutral-100 sm:border-t-0">
                        {/* Caixa de Qtd enxuta */}
                        <div className="flex items-center gap-1.5 bg-neutral-50 px-2.5 py-1 rounded-xl border-2 border-neutral-800 shadow-2xs">
                          <span className="text-neutral-700 font-bold text-[11px]">Qtd:</span>
                          <input
                            type="text"
                            defaultValue={product.quantity}
                            onBlur={(e) => handleUpdateProductQty(product.id, e.target.value)}
                            className="w-14 sm:w-16 px-1.5 py-0.5 text-center font-mono-num font-black text-neutral-950 bg-white border border-neutral-700 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-md text-xs focus:outline-hidden transition-all shadow-xs"
                          />
                          <span className="text-neutral-950 font-black uppercase text-xs w-6 sm:w-7 text-center">
                            {product.unit}
                          </span>
                        </div>

                        {/* Botão de Excluir Item */}
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
                <span className="text-[10px] font-mono-num uppercase tracking-wider text-emerald-400 font-bold block">
                  Resumo do Lançamento
                </span>
                <div className="text-xl font-bold tracking-tight">
                  {productsList.length} {productsList.length === 1 ? 'Produto' : 'Produtos'} na Lista
                </div>
                <div className="text-xs text-neutral-400">
                  {selectedVendorIds.length} fornecedores selecionados para receber link direto via WhatsApp
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Encerramento:</span>
                  <strong className="text-white font-medium text-right truncate max-w-[180px]">
                    {deadlineDateTime ? new Date(deadlineDateTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '48 horas'}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Status inicial:</span>
                  <strong className="text-emerald-400 font-bold">Em Cotação</strong>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 text-xs font-black transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Send className="w-4 h-4 text-neutral-950" />
                <span>Disparar Cotação Agora</span>
              </button>

              <p className="text-[10px] text-neutral-400 text-center leading-relaxed">
                Ao disparar, a lista é gravada em tempo real e você poderá enviar as mensagens via WhatsApp para cada distribuidor com 1 clique.
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};
