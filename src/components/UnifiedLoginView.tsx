import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, Store, Truck, ArrowRight, CheckCircle2, TrendingDown, Clock, ShieldCheck, KeyRound, ShieldAlert } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { User } from 'firebase/auth';
import { isSuperAdminEmail } from '../utils/storeManager';

interface Props {
  onLoginAsLojista: (slug?: string) => void;
  onLoginAsVendor: (vendorId: string) => void;
  onOpenSuperAdmin: () => void;
  onRegisterShopkeeper?: (store: { name: string; slug: string; contactPerson: string; email: string; whatsapp: string }) => void;
  user: User | null;
  authLoading: boolean;
}

export const UnifiedLoginView: React.FC<Props> = ({
  onLoginAsLojista,
  onLoginAsVendor,
  onOpenSuperAdmin,
  onRegisterShopkeeper,
  user,
  authLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'lojista' | 'fornecedor'>('lojista');
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrSlug, setEmailOrSlug] = useState('');
  const [password, setPassword] = useState('');
  const [vendorCode, setVendorCode] = useState('');
  const [vendorPassword, setVendorPassword] = useState('');
  const [selectedVendorQuick, setSelectedVendorQuick] = useState<'v1' | 'v2'>('v1');
  const [notice, setNotice] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Self-registration modal for new lojistas
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regStoreName, setRegStoreName] = useState('');
  const [regSlug, setRegSlug] = useState('');
  const [regContact, setRegContact] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleSlugify = (name: string) => {
    setRegStoreName(name);
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setRegSlug(slug);
  };

  const handleSubmitLojista = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginAsLojista(emailOrSlug);
  };

  const handleSubmitVendor = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginAsVendor(selectedVendorQuick);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setNotice(null);
    try {
      const gUser = await signInWithGoogle();
      if (gUser) {
        const uEmail = gUser.email?.toLowerCase();
        if (uEmail === 'icaroetatiana@gmail.com' || isSuperAdminEmail(uEmail)) {
          // Designated Super Admin
          onOpenSuperAdmin();
        } else {
          onLoginAsLojista(gUser.email || undefined);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Falha ao autenticar com o Google.';
      setNotice(`Erro ao autenticar com o Google: ${msg}`);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStoreName.trim()) return;

    if (onRegisterShopkeeper) {
      onRegisterShopkeeper({
        name: regStoreName.trim(),
        slug: regSlug.trim() || `loja-${Date.now().toString().slice(-4)}`,
        contactPerson: regContact.trim() || 'Lojista',
        email: regEmail.trim() || 'loja@exemplo.com.br',
        whatsapp: regWhatsapp.replace(/\D/g, '') || '5511999999999',
      });
    } else {
      onLoginAsLojista(regSlug);
    }
    setIsRegisterModalOpen(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-32px)]">
      {/* Desktop Left Showcase Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-950 text-white p-12 flex-col justify-between relative overflow-hidden border-r border-neutral-800">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-neutral-950 flex items-center justify-center font-extrabold text-lg font-mono-num shadow-sm">
              C•
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">CotaFácil B2B</span>
              <span className="block text-[11px] text-neutral-400">Enterprise Procurement Suite</span>
            </div>
          </div>

          <div className="space-y-4 max-w-md pt-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Menor Preço de Mercado Entre Fornecedores
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
              A melhor cotação do seu hortifrúti em minutos, não em horas.
            </h2>

            <p className="text-sm text-neutral-400 leading-relaxed">
              Cruze automaticamente preços unitários de múltiplos fornecedores e representantes. O sistema valida pedidos mínimos, evita perdas e garante compras no melhor preço do dia.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md pt-4">
            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <TrendingDown className="w-4 h-4" />
                <span>18.4% Economia</span>
              </div>
              <div className="text-xs text-neutral-400">Média comprovada nas compras semanais de hortifrúti</div>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Ruído</span>
              </div>
              <div className="text-xs text-neutral-400">Validação automática de pedido mínimo por fornecedor</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-500">
          <span>Suporte 24/7 para Ceasas e Redes Varejistas</span>
          <span>v2.4 Enterprise</span>
        </div>
      </div>

      {/* Login Form Right Column */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-12 py-10 max-w-md mx-auto w-full">
        <div className="w-full space-y-6">
          {/* Brand header on mobile */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neutral-900 text-white shadow-xs border border-neutral-800 lg:hidden">
              <span className="font-extrabold text-xl tracking-tighter font-mono-num">C•</span>
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-neutral-900">
                Acesse sua conta
              </h1>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Plataforma de Cotações Inteligentes
              </p>
            </div>
          </div>

          {notice && (
            <div className="p-3 rounded-xl bg-neutral-100 text-neutral-700 text-xs">
              {notice}
            </div>
          )}

          {/* Abas Rápidas (Tabs) */}
          <div className="bg-neutral-100 p-1 rounded-xl flex items-center border border-neutral-200">
            <button
              type="button"
              onClick={() => setActiveTab('lojista')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'lojista'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Sou Lojista</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fornecedor')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'fornecedor'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Sou Fornecedor</span>
            </button>
          </div>

          {/* TAB 1: SOU LOJISTA */}
          {activeTab === 'lojista' && (
            <div className="space-y-4">
              {/* Login rápido com Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                className="w-full py-3 px-4 bg-white hover:bg-neutral-50 text-neutral-800 font-bold rounded-xl text-xs border-2 border-neutral-300 hover:border-neutral-400 active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-neutral-800/30 border-t-neutral-800 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continuar com o Google</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  ou acesse com e-mail / slug
                </span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              <form onSubmit={handleSubmitLojista} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-700 tracking-wide uppercase">
                    E-mail ou Slug da Loja
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={emailOrSlug}
                      onChange={(e) => setEmailOrSlug(e.target.value)}
                      placeholder="Digite o e-mail ou slug da sua loja"
                      required
                      className="w-full pl-10 pr-3.5 py-3 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                    />
                  </div>
                  <p className="text-[10px] text-neutral-400">
                    Acesse via seu slug personalizado ou e-mail de cadastro.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-700 tracking-wide uppercase">
                      Senha
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Instruções de recuperação foram enviadas ao seu e-mail.')}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 font-medium cursor-pointer"
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha de acesso"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden transition-all font-mono shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Botão Secundário: Criar Conta / Teste Grátis */}
                <div className="pt-1 text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl border-2 border-neutral-200 text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Criar uma conta (Teste Grátis por 7 dias)
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SOU FORNECEDOR / REPRESENTANTE */}
          {activeTab === 'fornecedor' && (
            <form onSubmit={handleSubmitVendor} className="space-y-4">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 leading-relaxed">
                Área para representantes auditarem os lances e digitarem seus preços unitários por produto:
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                  Selecione sua Distribuidora / Empresa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVendorQuick('v1')}
                    className={`p-2.5 rounded-xl border-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                      selectedVendorQuick === 'v1'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-white hover:border-neutral-400'
                    }`}
                  >
                    Distribuidora Bom Preço
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVendorQuick('v2')}
                    className={`p-2.5 rounded-xl border-2 text-left text-xs font-semibold transition-all cursor-pointer ${
                      selectedVendorQuick === 'v2'
                        ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                        : 'border-neutral-300 bg-neutral-50 text-neutral-700 hover:bg-white hover:border-neutral-400'
                    }`}
                  >
                    Hortifrúti Ceasa Sul
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-700 uppercase tracking-wide">
                  Código de Representante
                </label>
                <input
                  type="text"
                  value={vendorCode}
                  onChange={(e) => setVendorCode(e.target.value)}
                  placeholder="Digite seu código (ex: REP-8942)"
                  className="w-full px-3.5 py-3 bg-white border-2 border-neutral-300 hover:border-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 rounded-xl text-xs text-neutral-900 placeholder-neutral-400 focus:outline-hidden transition-all shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold shadow-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>Acessar Cotação Ativa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Footer: Discrete Super Admin link */}
          <div className="pt-6 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={onOpenSuperAdmin}
              className="text-[11px] text-neutral-400 hover:text-neutral-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3 h-3 text-neutral-400" />
              <span>Acesso Administrativo (Super Admin)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Auto-cadastro de Novo Lojista (Teste Grátis 7 dias) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-neutral-200 shadow-2xl my-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Criar Conta de Lojista
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Teste grátis por 7 dias com todas as funções liberadas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                  Nome do seu Comércio / Loja *
                </label>
                <input
                  type="text"
                  value={regStoreName}
                  onChange={(e) => handleSlugify(e.target.value)}
                  placeholder="Ex: Sacolão São Paulo"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                  Slug da Loja (Link Personalizado) *
                </label>
                <div className="flex items-center bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-neutral-400 font-mono">app.cotafacil.com/</span>
                  <input
                    type="text"
                    value={regSlug}
                    onChange={(e) => setRegSlug(e.target.value)}
                    placeholder="sacolao-sp"
                    required
                    className="w-full bg-transparent border-none focus:outline-hidden text-neutral-900 font-mono-num font-semibold pl-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                    Seu Nome *
                  </label>
                  <input
                    type="text"
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={regWhatsapp}
                    onChange={(e) => setRegWhatsapp(e.target.value)}
                    placeholder="11988887777"
                    required
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 font-mono-num focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="seuemail@comercio.com"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-700 uppercase">
                  Crie uma Senha *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>7 Dias de Acesso Total Gratuito</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Cadastre seus fornecedores, lance suas cotações e economize na feira sem nenhum compromisso.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-xs text-neutral-500 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Ativar Teste Grátis</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
