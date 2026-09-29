import React, { useState } from 'react';
import { BillingInvoice, InvoiceStatus, ShopkeeperStore } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';
import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  Check,
  Ban,
  Unlock,
  MessageCircle,
  Search,
  CheckCircle2,
  Clock,
  TrendingUp,
  Building2,
  Plus,
  Trash2,
  Edit,
  KeyRound,
  RotateCcw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Store,
  DollarSign
} from 'lucide-react';

interface Props {
  invoices: BillingInvoice[];
  stores: ShopkeeperStore[];
  onBack: () => void;
  onToggleBlockShopkeeper: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
  onAddStore: (storeData: Omit<ShopkeeperStore, 'id' | 'createdAt'>) => void;
  onDeleteStore: (storeId: string) => void;
  onSelectStoreToView?: (store: ShopkeeperStore) => void;
  onClearData: () => void;
  onLoadDemoData: () => void;
  onChangeAdminPassword: (newPass: string) => void;
}

export const AdminBillingView: React.FC<Props> = ({
  invoices,
  stores,
  onBack,
  onToggleBlockShopkeeper,
  onMarkAsPaid,
  onAddStore,
  onDeleteStore,
  onSelectStoreToView,
  onClearData,
  onLoadDemoData,
  onChangeAdminPassword,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'stores' | 'invoices' | 'settings'>('stores');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | InvoiceStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal para Criar Loja / Lojista
  const [isNewStoreModalOpen, setIsNewStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreSlug, setNewStoreSlug] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newMonthlyFee, setNewMonthlyFee] = useState('390,00');
  const [newDueDay, setNewDueDay] = useState(10);
  const [newPlanName, setNewPlanName] = useState('Plano Pro');
  const [newStoreStatus, setNewStoreStatus] = useState<'Ativo' | 'Teste Grátis'>('Ativo');
  const [newPixKey, setNewPixKey] = useState('');

  // Password change state
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);

  // Computations
  const overdueInvoices = invoices.filter((inv) => inv.status === 'Atrasado');
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  const totalMonthlyRevenue = stores.length > 0
    ? stores.reduce((sum, s) => sum + s.monthlyFee, 0)
    : invoices.reduce((sum, inv) => sum + inv.amount, 0);

  const totalPaidRevenue = invoices
    .filter((inv) => inv.status === 'Pago')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSlugify = (name: string) => {
    setNewStoreName(name);
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setNewStoreSlug(slug);
  };

  const handleCreateStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      alert('Preencha o nome da loja.');
      return;
    }

    const fee = parseFloat(newMonthlyFee.replace('.', '').replace(',', '.'));
    const validFee = isNaN(fee) || fee < 0 ? 390 : fee;

    onAddStore({
      name: newStoreName.trim(),
      slug: newStoreSlug.trim() || `loja-${Date.now().toString().slice(-4)}`,
      contactPerson: newContactPerson.trim() || 'Responsável',
      email: newEmail.trim() || 'contato@loja.com.br',
      whatsapp: newWhatsapp.replace(/\D/g, '') || '5511999999999',
      monthlyFee: validFee,
      dueDay: Number(newDueDay) || 10,
      planName: newPlanName,
      status: newStoreStatus,
      pixKey: newPixKey.trim() || `00020126580014br.gov.bcb.pix0136${newStoreSlug || 'loja'}-${validFee}`,
    });

    // Reset and close
    setNewStoreName('');
    setNewStoreSlug('');
    setNewContactPerson('');
    setNewEmail('');
    setNewWhatsapp('');
    setNewMonthlyFee('390,00');
    setNewPixKey('');
    setIsNewStoreModalOpen(false);

    showToast(`Loja cadastrada com sucesso! Mensalidade de ${formatCurrencyBRL(validFee)} gerada.`);
  };

  const handleCopyPix = async (invoice: BillingInvoice) => {
    try {
      await navigator.clipboard.writeText(invoice.pixKey);
      showToast(`Chave Pix de ${formatCurrencyBRL(invoice.amount)} copiada com sucesso!`);
    } catch (e) {
      console.error(e);
    }
  };

  const openWhatsAppBilling = (invoice: BillingInvoice) => {
    const text = encodeURIComponent(
      `Olá ${invoice.contactPerson}, referente à mensalidade do CotaFácil B2B (${formatCurrencyBRL(invoice.amount)}) com vencimento em ${invoice.dueDateFormatted}. Segue a chave Pix para regularização:\n\n${invoice.pixKey}`
    );
    window.open(`https://wa.me/${invoice.whatsapp}?text=${text}`, '_blank');
  };

  const handleSaveNewPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPassInput.trim().length < 6) {
      alert('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    onChangeAdminPassword(newAdminPassInput.trim());
    setPassChangeSuccess(true);
    setNewAdminPassInput('');
    setTimeout(() => setPassChangeSuccess(false), 4000);
    showToast('Senha de Super Admin alterada com sucesso!');
  };

  // Filtered lists
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedFilter !== 'ALL' && inv.status !== selectedFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        inv.shopkeeperName.toLowerCase().includes(q) ||
        inv.slug.toLowerCase().includes(q) ||
        inv.contactPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredStores = stores.filter((s) => {
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col pb-16 bg-neutral-50/50 min-h-screen">
      {/* Sticky Topbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 lg:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 hover:text-neutral-950 py-1.5 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-neutral-500" />
              <span>Sair do Admin</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base lg:text-lg font-bold tracking-tight text-neutral-900">
                  Painel de Controle Super Admin
                </h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 tracking-wider">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Gestão de Lojistas, Cadastro de Lojas, Faturamento e Configurações Gerais
              </p>
            </div>
          </div>

          {/* Super Admin Top Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs">
            <button
              onClick={() => setActiveAdminTab('stores')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === 'stores'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Lojas / Lojistas ({stores.length})</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('invoices')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === 'invoices'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Cobranças & MRR</span>
            </button>
            <button
              onClick={() => setActiveAdminTab('settings')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === 'settings'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Segurança</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-5 space-y-5 flex-1">
        {/* Toast Alert Feedback */}
        {toastMessage && (
          <div className="p-3 bg-neutral-900 text-white text-xs rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-neutral-400 hover:text-white px-1 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 1: GESTÃO DE LOJISTAS E CRIAÇÃO DE LOJAS             */}
        {/* ======================================================== */}
        {activeAdminTab === 'stores' && (
          <div className="space-y-5">
            {/* Header com Botão "+ Cadastrar Novo Lojista" */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
              <div>
                <h2 className="text-sm font-bold text-neutral-900">
                  Lojas & Lojistas Cadastrados
                </h2>
                <p className="text-xs text-neutral-500">
                  Crie novos lojistas, defina o valor personalizado de mensalidade e gerencie o status de acesso.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsNewStoreModalOpen(true)}
                className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Cadastrar Novo Lojista</span>
              </button>
            </div>

            {/* Lista de Lojas Cadastradas */}
            {stores.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-neutral-300 p-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Nenhum lojista cadastrado ainda</h3>
                  <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Seu sistema está pronto para produção com a base zerada. Clique no botão acima para cadastrar sua primeira loja ou aguarde novos lojistas se auto-cadastrarem na tela inicial.
                  </p>
                </div>
                <button
                  onClick={() => setIsNewStoreModalOpen(true)}
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-neutral-900 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Cadastrar Primeiro Lojista</span>
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
                <div className="p-3.5 border-b border-neutral-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Total: {stores.length} {stores.length === 1 ? 'Loja' : 'Lojas'}
                  </span>
                  <div className="text-xs text-neutral-500">
                    MRR Total Contratado: <strong className="font-mono-num text-neutral-900">{formatCurrencyBRL(totalMonthlyRevenue)}</strong>
                  </div>
                </div>

                <div className="divide-y divide-neutral-100">
                  {stores.map((store) => (
                    <div
                      key={store.id}
                      className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-neutral-50/70 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-neutral-900">{store.name}</span>
                          <span className="text-xs text-neutral-400 font-mono-num">/{store.slug}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                            {store.planName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              store.status === 'Ativo'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : store.status === 'Teste Grátis'
                                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {store.status}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-500 flex items-center gap-3 flex-wrap">
                          <span>Responsável: <strong className="text-neutral-700">{store.contactPerson}</strong></span>
                          <span>•</span>
                          <span>WhatsApp: <strong className="text-neutral-700 font-mono-num">+{store.whatsapp}</strong></span>
                          <span>•</span>
                          <span>Vencimento: todo dia <strong>{store.dueDay}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right pr-2">
                          <div className="text-[10px] text-neutral-400">Mensalidade:</div>
                          <div className="text-base font-extrabold font-mono-num text-neutral-900">
                            {formatCurrencyBRL(store.monthlyFee)}
                          </div>
                        </div>

                        {onSelectStoreToView && (
                          <button
                            onClick={() => onSelectStoreToView(store)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold cursor-pointer"
                            title="Entrar na visão deste lojista para auditar a cotação"
                          >
                            Acessar Painel
                          </button>
                        )}

                        <button
                          onClick={() => onDeleteStore(store.id)}
                          className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir Lojista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: COBRANÇAS, FATURAMENTO & INADIMPLÊNCIA            */}
        {/* ======================================================== */}
        {activeAdminTab === 'invoices' && (
          <div className="space-y-5">
            {/* 4 Executive KPI Cards on Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* KPI 1: Inadimplência Ativa */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-white shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Inadimplência
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-mono-num">
                    Mês Atual
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-extrabold tracking-tight text-white font-mono-num">
                    {overdueCount} {overdueCount === 1 ? 'lojista' : 'lojistas'}
                  </div>
                  <div className="text-xs text-rose-300 font-medium mt-0.5 font-mono-num">
                    {formatCurrencyBRL(overdueAmount)} pendentes
                  </div>
                </div>
              </div>

              {/* KPI 2: MRR Contratado */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">MRR Contratado</span>
                  <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-extrabold tracking-tight text-neutral-900 font-mono-num">
                    {formatCurrencyBRL(totalMonthlyRevenue)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {stores.length || invoices.length} assinaturas no SaaS
                  </div>
                </div>
              </div>

              {/* KPI 3: Receita Paga */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Receita Paga</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-extrabold tracking-tight text-emerald-700 font-mono-num">
                    {formatCurrencyBRL(totalPaidRevenue)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {invoices.filter((i) => i.status === 'Pago').length} faturas quitadas no mês
                  </div>
                </div>
              </div>

              {/* KPI 4: Taxa de Adimplência */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Adimplência</span>
                  <span className="text-[10px] text-neutral-400 font-mono-num">Meta: 90%</span>
                </div>
                <div className="mt-2.5">
                  <div className="text-2xl font-extrabold tracking-tight text-neutral-900 font-mono-num">
                    {invoices.length > 0 ? Math.round(((invoices.length - overdueCount) / invoices.length) * 100) : 100}%
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    Regularidade operacional
                  </div>
                </div>
              </div>
            </div>

            {/* Toolbar: Search, Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-2xs">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por lojista, responsável ou slug..."
                  className="w-full pl-9 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden focus:bg-white focus:border-neutral-900 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                <button
                  onClick={() => setSelectedFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer ${
                    selectedFilter === 'ALL'
                      ? 'bg-neutral-900 text-white font-semibold shadow-xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80'
                  }`}
                >
                  Todos ({invoices.length})
                </button>
                <button
                  onClick={() => setSelectedFilter('Atrasado')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedFilter === 'Atrasado'
                      ? 'bg-rose-600 text-white font-semibold shadow-xs'
                      : 'bg-rose-50 text-rose-800 border border-rose-200/80 hover:bg-rose-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Atrasados ({overdueCount})
                </button>
                <button
                  onClick={() => setSelectedFilter('Pendente')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedFilter === 'Pendente'
                      ? 'bg-amber-600 text-white font-semibold shadow-xs'
                      : 'bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Pendentes ({invoices.filter((i) => i.status === 'Pendente').length})
                </button>
                <button
                  onClick={() => setSelectedFilter('Pago')}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    selectedFilter === 'Pago'
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Pagos ({invoices.filter((i) => i.status === 'Pago').length})
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
              {filteredInvoices.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  Nenhuma fatura encontrada para este filtro.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      <th className="py-3 px-4">Lojista / Slug</th>
                      <th className="py-3 px-4">Contato / WhatsApp</th>
                      <th className="py-3 px-4">Plano</th>
                      <th className="py-3 px-4">Vencimento</th>
                      <th className="py-3 px-4">Mensalidade</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Acesso</th>
                      <th className="py-3 px-4 text-right">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-xs">
                    {filteredInvoices.map((invoice) => {
                      const isOverdue = invoice.status === 'Atrasado';
                      const isPaid = invoice.status === 'Pago';
                      const isPending = invoice.status === 'Pendente';

                      return (
                        <tr
                          key={invoice.id}
                          className={`hover:bg-neutral-50/80 transition-colors ${
                            isOverdue ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-neutral-900">{invoice.shopkeeperName}</div>
                            <div className="text-[11px] text-neutral-400 font-mono-num">/{invoice.slug}</div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600">
                            <div>{invoice.contactPerson}</div>
                            <div className="text-[11px] text-neutral-400 font-mono-num">+{invoice.whatsapp}</div>
                          </td>
                          <td className="py-3.5 px-4 text-neutral-600">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-[11px] font-medium text-neutral-700">
                              {invoice.planName}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono-num text-neutral-700">
                            {invoice.dueDateFormatted}
                            {isOverdue && invoice.daysOverdue ? (
                              <span className="block text-[10px] text-rose-600 font-semibold">
                                {invoice.daysOverdue} dias atrasado
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4 font-mono-num font-bold text-neutral-900">
                            {formatCurrencyBRL(invoice.amount)}
                          </td>
                          <td className="py-3.5 px-4">
                            {isPaid && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Pago
                              </span>
                            )}
                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Pendente
                              </span>
                            )}
                            {isOverdue && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                Atrasado
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {invoice.isBlocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-900 text-white">
                                <Ban className="w-2.5 h-2.5" />
                                Bloqueado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Liberado
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyPix(invoice)}
                                className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 cursor-pointer"
                                title="Copiar chave Pix do Lojista"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openWhatsAppBilling(invoice)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-pointer"
                                title="Enviar mensagem de cobrança no WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onToggleBlockShopkeeper(invoice.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                  invoice.isBlocked
                                    ? 'bg-neutral-900 text-white'
                                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {invoice.isBlocked ? 'Desbloquear' : 'Bloquear'}
                              </button>
                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => onMarkAsPaid(invoice.id)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                                >
                                  Pago
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: SEGURANÇA E CONFIGURAÇÕES DO SISTEMA              */}
        {/* ======================================================== */}
        {activeAdminTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Alteração de Senha */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <KeyRound className="w-5 h-5 text-neutral-700" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Alterar Senha do Super Admin
                </h3>
              </div>

              <form onSubmit={handleSaveNewPassword} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                    Nova Senha de Acesso
                  </label>
                  <input
                    type="password"
                    value={newAdminPassInput}
                    onChange={(e) => setNewAdminPassInput(e.target.value)}
                    placeholder="Digite a nova senha segura..."
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Salvar Nova Senha
                </button>

                {passChangeSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Senha atualizada com sucesso no sistema.</span>
                  </div>
                )}
              </form>
            </div>

            {/* Gerenciamento de Base de Dados (Teste Real Zerado) */}
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
                <RotateCcw className="w-5 h-5 text-neutral-700" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Gerenciamento da Base de Dados
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2 text-xs text-neutral-600">
                <p>
                  Para realizar um <strong>teste real de produção</strong>, você pode zerar os dados a qualquer momento e cadastrar suas próprias lojas, listas e fornecedores.
                </p>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja zerar os dados para iniciar seus testes reais do zero?')) {
                        onClearData();
                        showToast('Base de dados zerada com sucesso!');
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 text-xs font-bold cursor-pointer"
                  >
                    Zerar Dados (Base Limpa para Produção)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onLoadDemoData();
                      showToast('Dados de demonstração carregados com sucesso!');
                    }}
                    className="px-3 py-2 rounded-xl bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-200 text-xs font-semibold cursor-pointer"
                  >
                    Carregar Dados de Exemplo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: CADASTRAR NOVO LOJISTA / LOJA                     */}
      {/* ======================================================== */}
      {isNewStoreModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-neutral-200 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Cadastrar Novo Lojista / Loja
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Insira os dados do lojista e defina o valor personalizado da mensalidade
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewStoreModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-base font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStoreSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                    Nome da Loja / Razão Social *
                  </label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => handleSlugify(e.target.value)}
                    placeholder="Ex: Sacolão da Família"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                    Slug da Loja (Link de Acesso) *
                  </label>
                  <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs">
                    <span className="text-neutral-400 select-none">/</span>
                    <input
                      type="text"
                      value={newStoreSlug}
                      onChange={(e) => setNewStoreSlug(e.target.value)}
                      placeholder="sacolao-familia"
                      required
                      className="w-full bg-transparent border-none focus:outline-hidden text-neutral-900 font-mono-num pl-1"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                    Nome do Responsável / Lojista *
                  </label>
                  <input
                    type="text"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="Ex: Carlos Alberto"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                    WhatsApp (com DDD) *
                  </label>
                  <input
                    type="text"
                    value={newWhatsapp}
                    onChange={(e) => setNewWhatsapp(e.target.value)}
                    placeholder="Ex: 5511998877661"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 font-mono-num focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                  E-mail do Lojista
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="contato@sacolaofamilia.com.br"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                />
              </div>

              {/* Faturamento e Mensalidade personalizada */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Configuração de Mensalidade & Faturamento</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                      Valor da Mensalidade (R$) *
                    </label>
                    <input
                      type="text"
                      value={newMonthlyFee}
                      onChange={(e) => setNewMonthlyFee(e.target.value)}
                      placeholder="390,00"
                      required
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold font-mono-num text-neutral-900 focus:outline-hidden focus:border-neutral-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                      Dia do Vencimento
                    </label>
                    <select
                      value={newDueDay}
                      onChange={(e) => setNewDueDay(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                    >
                      <option value={5}>Dia 05</option>
                      <option value={10}>Dia 10</option>
                      <option value={15}>Dia 15</option>
                      <option value={20}>Dia 20</option>
                      <option value={25}>Dia 25</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                      Plano SaaS
                    </label>
                    <select
                      value={newPlanName}
                      onChange={(e) => setNewPlanName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                    >
                      <option value="Plano Starter">Starter</option>
                      <option value="Plano Pro">Pro</option>
                      <option value="Plano Enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                    Chave Pix para Cobrança (opcional)
                  </label>
                  <input
                    type="text"
                    value={newPixKey}
                    onChange={(e) => setNewPixKey(e.target.value)}
                    placeholder="Chave Pix ou Copia e Cola (ou deixe em branco para gerar automática)"
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 font-mono-num focus:outline-hidden focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewStoreModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cadastrar e Ativar Loja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
