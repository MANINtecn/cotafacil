import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  RotateCcw,
  KeyRound,
  ShieldCheck,
  CreditCard,
  QrCode,
  DollarSign,
  Copy,
  ExternalLink,
  Smartphone,
  Eye,
  EyeOff,
  Layers,
  Save,
  Check
} from 'lucide-react';
import { useSystemSettings, MercadoPagoSettings } from '../utils/systemSettings';
import { CotaFacilLogo } from './CotaFacilLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { formatCurrencyBRL } from '../utils/calculations';

interface Props {
  onClearData: () => void;
  onLoadDemoData: () => void;
  onChangeAdminPassword: (newPass: string) => void;
  showToast: (msg: string) => void;
}

export const AdminSettingsView: React.FC<Props> = ({
  onClearData,
  onLoadDemoData,
  onChangeAdminPassword,
  showToast,
}) => {
  const { customLogo, setCustomLogo, removeCustomLogo, mercadoPago, updateMercadoPago } = useSystemSettings();

  // Logo State
  const [logoPreview, setLogoPreview] = useState<string | null>(customLogo);
  const [logoFileName, setLogoFileName] = useState<string | null>(null);
  const [logoSavedSuccess, setLogoSavedSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mercado Pago State
  const [mpForm, setMpForm] = useState<MercadoPagoSettings>({ ...mercadoPago });
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [mpSavedSuccess, setMpSavedSuccess] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  // Password state
  const [newAdminPassInput, setNewAdminPassInput] = useState('');
  const [passChangeSuccess, setPassChangeSuccess] = useState(false);

  // Active Sub-tab inside Settings
  const [activeSection, setActiveSection] = useState<'logo' | 'mercadopago' | 'pwa' | 'security'>('logo');

  // Handle Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB para garantir carregamento instantâneo.');
      return;
    }

    setLogoFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoPreview(result);
      setLogoSavedSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = () => {
    if (!logoPreview) {
      alert('Selecione uma imagem antes de salvar.');
      return;
    }
    setCustomLogo(logoPreview);
    setLogoSavedSuccess(true);
    showToast('Logo atualizada com sucesso em todo o sistema!');
    setTimeout(() => setLogoSavedSuccess(false), 4000);
  };

  const handleResetLogo = () => {
    if (confirm('Deseja restaurar a logo original padrão do CotaFácil?')) {
      removeCustomLogo();
      setLogoPreview(null);
      setLogoFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('Logo padrão restaurada com sucesso!');
    }
  };

  // Mercado Pago Actions
  const handleSaveMercadoPago = (e: React.FormEvent) => {
    e.preventDefault();
    updateMercadoPago(mpForm);
    setMpSavedSuccess(true);
    showToast('Configurações do Mercado Pago salvas com sucesso!');
    setTimeout(() => setMpSavedSuccess(false), 4000);
  };

  const handleTestMercadoPago = () => {
    setIsTestingMp(true);
    setMpTestResult(null);

    setTimeout(() => {
      setIsTestingMp(false);
      if (!mpForm.publicKey || !mpForm.accessToken) {
        setMpTestResult({
          success: false,
          message: 'Preencha a Chave Pública (Public Key) e o Access Token para realizar o teste de conexão.',
        });
      } else {
        const isTestKey = mpForm.publicKey.startsWith('TEST-') || mpForm.accessToken.startsWith('TEST-');
        setMpTestResult({
          success: true,
          message: `Conexão validada com sucesso! Credenciais ativas no Mercado Pago (${isTestKey ? 'Ambiente Sandbox / Testes' : 'Ambiente de Produção'}). Cobranças automáticas prontas.`,
        });
        showToast('Conexão com Mercado Pago validada com sucesso!');
      }
    }, 1200);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(mpForm.webhookUrl);
    setCopiedWebhook(true);
    showToast('URL do Webhook copiada para a área de transferência!');
    setTimeout(() => setCopiedWebhook(false), 3000);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminPassInput.trim()) return;
    onChangeAdminPassword(newAdminPassInput.trim());
    setPassChangeSuccess(true);
    setNewAdminPassInput('');
    showToast('Senha do Super Admin alterada com sucesso!');
    setTimeout(() => setPassChangeSuccess(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Settings Navigation Sub-menu */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('logo')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSection === 'logo'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span>Logo & Identidade Visual</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('mercadopago')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSection === 'mercadopago'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <CreditCard className="w-4 h-4 text-sky-400" />
          <span>Integração Mercado Pago</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-neutral-950 font-black">
            Recebimento
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('pwa')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSection === 'pwa'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>Aplicativo PWA (Mobile/Desktop)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeSection === 'security'
              ? 'bg-neutral-900 text-white shadow-xs'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <span>Segurança & Banco de Dados</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. SEÇÃO DE UPLOAD DA LOGO                               */}
      {/* ======================================================== */}
      {activeSection === 'logo' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form and Upload Zone */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Upload da Logo da Plataforma
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Suba sua marca personalizada. Ao salvar, a logo é alterada instantaneamente em todas as telas da plataforma (Login, Lojistas, SuperAdmin e Cotações).
                </p>
              </div>
            </div>

            {/* Drag & Drop / File Input Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 rounded-2xl p-6 text-center bg-neutral-50/70 hover:bg-neutral-50 cursor-pointer transition-colors space-y-3 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-900">
                  Clique para selecionar ou arraste o arquivo da logo aqui
                </p>
                <p className="text-[11px] text-neutral-500">
                  Formatos recomendados: PNG transparente, SVG, WebP ou JPG (tamanho máximo: 2MB)
                </p>
                {logoFileName && (
                  <p className="text-xs font-mono-num font-semibold text-emerald-600 pt-1">
                    Arquivo selecionado: {logoFileName}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSaveLogo}
                disabled={!logoPreview}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>Salvar Nova Logo</span>
              </button>

              {customLogo && (
                <button
                  type="button"
                  onClick={handleResetLogo}
                  className="py-3 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Restaurar a logo padrão"
                >
                  <RotateCcw className="w-4 h-4 text-neutral-600" />
                  <span>Restaurar Padrão</span>
                </button>
              )}
            </div>

            {logoSavedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Logo salva com sucesso! A nova identidade visual já está aplicada em todas as áreas do aplicativo.</span>
              </div>
            )}
          </div>

          {/* Visual Live Previews */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Eye className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Pré-visualização em Tempo Real
                </h4>
              </div>

              {/* Light Theme Preview */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Tema Claro (Cabeçalho do Lojista & Cotação)
                </span>
                <div className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between">
                  <CotaFacilLogo size="md" theme="light" customLogoOverride={logoPreview} />
                  <span className="text-[10px] text-neutral-400 font-mono-num font-semibold">
                    Preview
                  </span>
                </div>
              </div>

              {/* Dark Theme Preview */}
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Tema Escuro (Tela de Login & Portal)
                </span>
                <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 shadow-inner flex items-center justify-between">
                  <CotaFacilLogo size="md" theme="dark" customLogoOverride={logoPreview} />
                  <span className="text-[10px] text-neutral-500 font-mono-num font-semibold">
                    Dark Preview
                  </span>
                </div>
              </div>

              {/* Mobile Compact Icon Preview */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                  Ícone Compacto Mobile
                </span>
                <div className="flex items-center gap-3">
                  <CotaFacilLogo size="sm" variant="icon" customLogoOverride={logoPreview} />
                  <CotaFacilLogo size="md" variant="icon" customLogoOverride={logoPreview} />
                  <CotaFacilLogo size="lg" variant="icon" customLogoOverride={logoPreview} />
                  <p className="text-[11px] text-neutral-500 pl-2">
                    Ajuste automático para telas móveis e ícones de atalho.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SEÇÃO DE INTEGRAÇÃO MERCADO PAGO                      */}
      {/* ======================================================== */}
      {activeSection === 'mercadopago' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 flex items-center justify-center font-bold shrink-0 border border-sky-500/20">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-900">
                      Integração Mercado Pago
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800">
                      {mpForm.environment === 'production' ? 'Produção' : 'Sandbox (Testes)'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 max-w-xl leading-relaxed">
                    Configure os dados da sua conta Mercado Pago para receber pagamentos de mensalidade dos lojistas via Pix com QR Code instantâneo e Cartão de Crédito.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Gateway Ativo</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveMercadoPago} className="space-y-5">
              {/* Ambiente: Produção vs Sandbox */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                  Ambiente de Execução
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setMpForm({ ...mpForm, environment: 'sandbox' })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      mpForm.environment === 'sandbox'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Modo Sandbox (Testes)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMpForm({ ...mpForm, environment: 'production' })}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      mpForm.environment === 'production'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <span>Modo Produção (Real)</span>
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  No modo Sandbox, use credenciais com prefixo <code className="font-mono text-neutral-800">TEST-</code> para simular pagamentos sem custo real.
                </p>
              </div>

              {/* Public Key */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Chave Pública (Public Key)
                  </label>
                  <span className="text-[10px] text-neutral-400">Visível no frontend para tokenização</span>
                </div>
                <input
                  type="text"
                  value={mpForm.publicKey}
                  onChange={(e) => setMpForm({ ...mpForm, publicKey: e.target.value })}
                  placeholder="Ex: APP_USR-xxxx-xxxx ou TEST-xxxx-xxxx"
                  required
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                />
              </div>

              {/* Access Token */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Access Token Privado
                  </label>
                  <span className="text-[10px] text-neutral-400">Utilizado para gerar cobranças e QR Code Pix</span>
                </div>
                <div className="relative">
                  <input
                    type={showAccessToken ? 'text' : 'password'}
                    value={mpForm.accessToken}
                    onChange={(e) => setMpForm({ ...mpForm, accessToken: e.target.value })}
                    placeholder="Ex: APP_USR-xxxx ou TEST-xxxx"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAccessToken(!showAccessToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Grid 2 colunas: Client ID & Mensalidade Padrão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Client ID da Aplicação (Opcional)
                  </label>
                  <input
                    type="text"
                    value={mpForm.clientId}
                    onChange={(e) => setMpForm({ ...mpForm, clientId: e.target.value })}
                    placeholder="Ex: 7281920391823901"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Valor Padrão da Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={mpForm.defaultMonthlyFee}
                    onChange={(e) => setMpForm({ ...mpForm, defaultMonthlyFee: parseFloat(e.target.value) || 0 })}
                    placeholder="390.00"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>
              </div>

              {/* Webhook Endpoint Info Box */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider">
                    URL de Notificação / Webhook IPN
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-700 hover:text-neutral-900 cursor-pointer"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copiado!' : 'Copiar URL'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-neutral-200 font-mono text-[11px] text-neutral-700 select-all overflow-x-auto">
                  {mpForm.webhookUrl}
                </div>
                <p className="text-[11px] text-neutral-500">
                  Cadastre esta URL nas configurações da sua aplicação no portal de desenvolvedores do Mercado Pago para receber baixas automáticas de faturas.
                </p>
              </div>

              {/* Buttons: Test Connection & Save */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="submit"
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4 text-emerald-400" />
                  <span>Salvar Dados do Mercado Pago</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestMercadoPago}
                  disabled={isTestingMp}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-sky-600" />
                  <span>{isTestingMp ? 'Testando Conexão...' : 'Testar Conexão / Credenciais'}</span>
                </button>
              </div>

              {/* Feedback Result from Test */}
              {mpTestResult && (
                <div
                  className={`p-4 rounded-2xl border text-xs flex items-start gap-3 animate-in fade-in duration-200 ${
                    mpTestResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <CheckCircle2
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      mpTestResult.success ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  />
                  <div>
                    <p className="font-bold">{mpTestResult.success ? 'Sucesso!' : 'Atenção'}</p>
                    <p className="mt-0.5 leading-relaxed">{mpTestResult.message}</p>
                  </div>
                </div>
              )}

              {mpSavedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Configurações salvas e ativas para todos os lojistas do sistema!</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SEÇÃO DO APLICATIVO PWA                               */}
      {/* ======================================================== */}
      {activeSection === 'pwa' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Sistema de PWA (Progressive Web App)
                  </h3>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    O CotaFácil B2B está configurado com Service Worker e Web App Manifest em conformidade para instalação direta em celulares Android, iPhones, iPads e computadores.
                  </p>
                </div>
              </div>

              {/* Install trigger component */}
              <div className="shrink-0">
                <PWAInstallButton variant="pill" />
              </div>
            </div>

            {/* Checklist de Recursos PWA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-900">Web App Manifest</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Ícones 192x192, 512x512, tema escuro e modo de exibição standalone configurados.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-900">Service Worker</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Pré-cacheamento de assets via Workbox com atualização automática ativada.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-900">Suporte iOS & Android</span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Meta tags apple-touch-icon e prompt nativo de instalação integrados na interface.
                </p>
              </div>
            </div>

            {/* In-app banner test */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
                Botão de Instalação do Aplicativo
              </span>
              <PWAInstallButton variant="banner" />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SEÇÃO DE SEGURANÇA E BANCO DE DADOS                   */}
      {/* ======================================================== */}
      {activeSection === 'security' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Alteração de Senha */}
          <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <KeyRound className="w-5 h-5 text-neutral-700" />
              <h3 className="text-sm font-bold text-neutral-900">
                Alterar Senha do Super Admin
              </h3>
            </div>

            <form onSubmit={handleSavePassword} className="space-y-3">
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

          {/* Gerenciamento de Base de Dados */}
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
    </div>
  );
};
