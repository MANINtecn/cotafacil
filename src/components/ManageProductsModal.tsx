import React, { useState, useMemo } from 'react';
import { Product, ShopkeeperStore } from '../types';
import {
  Package,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  X,
  Layers,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { ProductImportModal } from './ProductImportModal';
import { formatCurrencyBRL } from '../utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  catalogProducts: Product[];
  store?: ShopkeeperStore | null;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onDeleteProduct: (productId: string) => void;
  onImportBatch?: (products: Array<Omit<Product, 'id'> | Product>, replaceAll: boolean) => void;
  onSelectForQuotation?: (product: Product) => void;
  onOpenBilling?: () => void;
}

const ITEMS_PER_PAGE = 25;

export const ManageProductsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  catalogProducts,
  store,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onImportBatch,
  onSelectForQuotation,
  onOpenBilling,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Form inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('un');
  const [code, setCode] = useState('');
  const [benchmarkPrice, setBenchmarkPrice] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingProductId(null);
    setName('');
    setCategory('');
    setUnit('un');
    setCode('');
    setBenchmarkPrice('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleStartEdit = (product: Product) => {
    setEditingProductId(product.id);
    setName(product.name);
    setCategory(product.category || '');
    setUnit(product.unit || 'un');
    setCode(product.code || '');
    setBenchmarkPrice(product.benchmarkPrice ? String(product.benchmarkPrice) : '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingProductId(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Informe o nome do produto.');
      return;
    }

    const priceNum = benchmarkPrice ? parseFloat(benchmarkPrice.replace(',', '.')) : undefined;

    if (editingProductId) {
      onUpdateProduct(editingProductId, {
        name: name.trim(),
        category: category.trim() || undefined,
        unit: unit.trim().toLowerCase(),
        code: code.trim() || undefined,
        benchmarkPrice: priceNum && priceNum > 0 ? priceNum : undefined,
      });
    } else {
      onAddProduct({
        name: name.trim(),
        category: category.trim() || undefined,
        quantity: 1,
        unit: unit.trim().toLowerCase(),
        code: code.trim() || undefined,
        benchmarkPrice: priceNum && priceNum > 0 ? priceNum : undefined,
      });
    }

    setIsFormOpen(false);
    setEditingProductId(null);
    setName('');
    setCategory('');
    setCode('');
    setBenchmarkPrice('');
  };

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return catalogProducts;
    return catalogProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        p.unit.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q))
      );
    });
  }, [catalogProducts, searchTerm]);

  // Reset page when search changes
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const currentSafePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (currentSafePage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentSafePage]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 space-y-5 border-2 border-neutral-200 shadow-2xl my-6 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-neutral-950">
                    Catálogo de Produtos da Loja
                  </h3>
                  <span className="text-[11px] font-mono-num font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
                    {catalogProducts.length.toLocaleString('pt-BR')} itens cadastrados
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Gerencie seu catálogo de compras. Importe até 100.000 produtos via planilha de estoque, NF-e ou cadastre manualmente.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-800 text-lg font-bold p-1.5 rounded-xl hover:bg-neutral-100 cursor-pointer transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top actions: Search & Modality Triggers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por nome, SKU/código ou categoria..."
                className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-300 focus:border-neutral-950 rounded-xl text-xs font-semibold text-neutral-900 focus:outline-hidden transition-all placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Import Modal Button (Superpower Pro) */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                title="Importar planilha de estoque (CSV/Excel), XML de Nota Fiscal ou Foto"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Importar em Massa (Pro)</span>
              </button>

              {!isFormOpen && (
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Cadastrar Manual</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Drawer / Accordion */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border-2 border-neutral-400 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>
                    {editingProductId ? 'Editar Produto do Catálogo' : 'Novo Produto para o Catálogo'}
                  </span>
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Importar via Estoque / NF-e</span>
                  </button>
                  <span className="text-neutral-300">|</span>
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="text-xs text-neutral-500 hover:text-neutral-900 font-bold cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Code / SKU */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700">
                    Código / SKU (opcional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ex: CAB-25, 78912..."
                    className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-mono-num font-semibold focus:outline-hidden"
                  />
                </div>

                {/* Product Name */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Arroz Tipo 1 Especial 5kg"
                    required
                    className="w-full px-3 py-2 bg-white border-2 border-neutral-800 rounded-xl text-xs text-neutral-900 font-bold focus:outline-hidden focus:border-emerald-600 shadow-xs"
                  />
                </div>

                {/* Unit */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700">
                    Unidade Padrão *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border-2 border-neutral-800 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden uppercase cursor-pointer"
                  >
                    <option value="un">UN (Unidade)</option>
                    <option value="cx">CX (Caixa)</option>
                    <option value="pct">PCT (Pacote)</option>
                    <option value="kg">KG (Quilo)</option>
                    <option value="sc">SC (Saco)</option>
                    <option value="lt">LT (Litro)</option>
                    <option value="rl">RL (Rolo)</option>
                    <option value="bdj">BDJ (Bandeja)</option>
                    <option value="pc">PC (Peça)</option>
                    <option value="mt">MT (Metro)</option>
                  </select>
                </div>

                {/* Category */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700">
                    Categoria (opcional)
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Alimentos, Limpeza, Elétrica..."
                    className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-semibold focus:outline-hidden"
                  />
                </div>

                {/* Benchmark Price */}
                <div className="sm:col-span-6 space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700">
                    Preço de Custo / Referência (opcional)
                  </label>
                  <input
                    type="text"
                    value={benchmarkPrice}
                    onChange={(e) => setBenchmarkPrice(e.target.value)}
                    placeholder="Ex: 18.90"
                    className="w-full px-3 py-2 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 rounded-xl text-xs text-neutral-900 font-mono-num font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{editingProductId ? 'Salvar Alterações' : 'Salvar no Catálogo'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Products List */}
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500 border-2 border-dashed border-neutral-200 rounded-2xl space-y-2">
                <Package className="w-8 h-8 text-neutral-400 mx-auto" />
                <div className="font-bold text-neutral-800">Nenhum produto encontrado</div>
                <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
                  {searchTerm
                    ? 'Nenhum item corresponde à sua pesquisa. Tente outro termo.'
                    : 'Cadastre os produtos que sua loja costuma cotar ou importe o arquivo do seu estoque.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Importar Estoque / NF-e</span>
                  </button>
                  {!isFormOpen && (
                    <button
                      type="button"
                      onClick={handleStartAdd}
                      className="px-3.5 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cadastrar Manual</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              paginatedProducts.map((prod, index) => {
                const itemGlobalIndex = (currentSafePage - 1) * ITEMS_PER_PAGE + index + 1;
                return (
                  <div
                    key={prod.id}
                    className="p-3 sm:p-3.5 rounded-xl border-2 border-neutral-200 hover:border-neutral-600 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono-num font-bold text-neutral-400 text-xs w-8 text-right shrink-0">
                        #{itemGlobalIndex}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-950 text-xs truncate">
                            {prod.name}
                          </span>
                          {prod.code && (
                            <span className="text-[10px] font-mono-num text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded shrink-0">
                              SKU: {prod.code}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700">
                            {prod.unit}
                          </span>
                          {prod.category && (
                            <span className="text-[10px] text-neutral-500 font-medium truncate">
                              • {prod.category}
                            </span>
                          )}
                          {prod.benchmarkPrice && prod.benchmarkPrice > 0 && (
                            <span className="text-[10px] font-mono-num font-bold text-emerald-700">
                              • Custo Ref: {formatCurrencyBRL(prod.benchmarkPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 shrink-0">
                      {onSelectForQuotation && (
                        <button
                          type="button"
                          onClick={() => onSelectForQuotation(prod)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Inserir na lista de cotação atual"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Inserir</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(prod)}
                        className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                        title="Editar produto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remover "${prod.name}" do catálogo permanente?`)) {
                            onDeleteProduct(prod.id);
                          }
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Remover produto do catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination Controls (when more than 25 products) */}
          {filteredProducts.length > ITEMS_PER_PAGE && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-neutral-100 text-xs">
              <span className="text-neutral-500 font-mono-num">
                Exibindo {(currentSafePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentSafePage * ITEMS_PER_PAGE, filteredProducts.length)} de{' '}
                <strong>{filteredProducts.length.toLocaleString('pt-BR')}</strong> produtos
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentSafePage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <span className="px-2 font-mono-num font-bold text-neutral-800">
                  {currentSafePage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={currentSafePage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 text-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1 font-bold"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Dica: Produtos do catálogo aparecem no seletor automático ao lançar uma nova lista de cotação.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold cursor-pointer transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      {/* Multimodal Batch Import Modal */}
      <ProductImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        store={store}
        onImportBatch={(items, replaceAll) => {
          if (onImportBatch) {
            onImportBatch(items, replaceAll);
          }
        }}
        onOpenBilling={onOpenBilling}
      />
    </>
  );
};
