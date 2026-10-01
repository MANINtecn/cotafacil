import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Building2,
  Calendar,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Receipt,
  Download,
  Lock,
  ChevronRight
} from 'lucide-react';
import { ShopkeeperStore, BillingInvoice } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';
import { useSystemSettings } from '../utils/systemSettings';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  store: ShopkeeperStore | null | undefined;
  invoices: BillingInvoice[];
  onPayInvoice: (invoiceId: string) => void;
}

export const ShopkeeperBillingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  store,
  invoices,
  onPayInvoice,
}) => {
  const { mercadoPago } = useSystemSettings();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | 'custom_mp'>('pix');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pixTimeRemaining, setPixTimeRemaining] = useState(15 * 60); // 15 mins

  // Credit Card Form
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [installments, setInstallments] = useState(1);

  // Custom plug & play Mercado Pago override for store
  const [customKeyEnabled, setCustomKeyEnabled] = useState(false);
  const [customPublicKey, setCustomPublicKey] = useState('');

  // Identify current invoice for this store
  const storeInvoices = invoices.filter(
    (inv) => inv.storeId === store?.id || inv.slug === store?.slug
  );
  const pendingInvoice = storeInvoices.find((inv) => inv.status !== 'Pago') || storeInvoices[0];

  const feeAmount = store?.monthlyFee ?? mercadoPago.defaultMonthlyFee ?? 390.0;
  const currentInvoiceId = pendingInvoice?.id || `inv-store-${store?.id || 'demo'}`;

  // Countdown for Pix expiration
  useEffect(() => {
    if (!isOpen || paymentSuccess) return;
    const interval = setInterval(() => {
      setPixTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, paymentSuccess]);

  if (!isOpen) return null;

  // Format MM:SS for countdown
  const minutes = Math.floor(pixTimeRemaining / 60);
  const seconds = pixTimeRemaining % 60;
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Generate dynamic Pix Copia e Cola code (Mercado Pago format)
  const pixCode = `00020126580014br.gov.bcb.pix0136${mercadoPago.publicKey ? 'mp-' + mercadoPago.publicKey.slice(-8) : 'cotafacil-pay'}-${store?.slug || 'lojista'}520400005303986540${feeAmount.toFixed(2)}5802BR5916COTAFACIL B2B LTDA6009SAO PAULO62070503***6304A1B2`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSimulatePaymentApproval = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      if (pendingInvoice) {
        onPayInvoice(pendingInvoice.id);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-6 border border-neutral-200 shadow-2xl my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900">
                  Assinatura & Mensalidade da Loja
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Mercado Pago
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {store?.name || 'Sua Loja'} • Vencimento todo dia {store?.dueDay || 10}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {paymentSuccess ? (
          /* Payment Success Confirmation View */
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-black text-neutral-900">
                Pagamento Confirmado pelo Mercado Pago!
              </h4>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Sua mensalidade no valor de <strong>{formatCurrencyBRL(feeAmount)}</strong> foi liquidada com sucesso. Seu acesso e limite de cotações estão 100% liberados.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 max-w-sm mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Transação Mercado Pago:</span>
                <span className="font-mono-num font-bold text-neutral-900">MP-TX-{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Data e Hora:</span>
                <span className="font-medium text-neutral-800">{new Date().toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Status:</span>
                <span className="font-bold text-emerald-600">Aprovado (Liquidado)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-all"
            >
              Fechar e Voltar ao Painel
            </button>
          </div>
        ) : (
          <>
            {/* Store Subscription Overview Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {store?.planName || 'Plano Pro B2B'}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono-num">
                    /{store?.slug || 'loja'}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono-num text-white">
                  {formatCurrencyBRL(feeAmount)}
                  <span className="text-xs font-normal text-neutral-400 ml-1">/mês</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="text-neutral-400 block">Próximo Vencimento</span>
                  <span className="font-bold text-emerald-400">
                    Dia {store?.dueDay || 10} do mês corrente
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'pix'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Pix Instantâneo</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                  Aprovação Imediata
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit_card')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  paymentMethod === 'credit_card'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-sky-600" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            {/* Pix Tab */}
            {paymentMethod === 'pix' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
                  {/* Visual QR Code Generator */}
                  <div className="w-40 h-40 bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-xs shrink-0 flex flex-col items-center justify-center relative">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        pixCode
                      )}`}
                      alt="QR Code Pix Mercado Pago"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center font-black text-xs shadow-md border border-white">
                        Pix
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <span className="text-xs font-bold text-neutral-900">
                          Pague pelo app do seu banco
                        </span>
                        <div className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-mono-num font-bold">
                          <Clock className="w-3 h-3" />
                          <span>Expira em {formattedTimer}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Abra o app do seu banco, escolha Pix &gt; Ler QR Code ou cole a chave abaixo. A confirmação é instantânea.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="p-2.5 bg-white border border-neutral-200 rounded-xl font-mono text-[11px] text-neutral-600 truncate select-all">
                        {pixCode}
                      </div>

                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {copiedPix ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedPix ? 'Código Pix Copiado com Sucesso!' : 'Copiar Código Pix (Copia e Cola)'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulate / Verify Callback Button */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Após pagar no banco, a baixa automática é processada pelo webhook em poucos segundos.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulatePaymentApproval}
                    disabled={isProcessing}
                    className="w-full sm:w-auto py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{isProcessing ? 'Verificando no Mercado Pago...' : 'Confirmar Pagamento'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Credit Card Tab */}
            {paymentMethod === 'credit_card' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSimulatePaymentApproval();
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Número do Cartão
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Nome Impresso no Cartão
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="NOME COMO NO CARTÃO"
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs uppercase text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      Validade (MM/AA)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                      CVV (Código de Segurança)
                    </label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      required
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                    Parcelamento
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-hidden focus:bg-white focus:border-neutral-900 cursor-pointer"
                  >
                    <option value={1}>1x de {formatCurrencyBRL(feeAmount)} (sem juros)</option>
                    <option value={2}>2x de {formatCurrencyBRL(feeAmount / 2)}</option>
                    <option value={3}>3x de {formatCurrencyBRL(feeAmount / 3)}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isProcessing
                      ? 'Processando no Mercado Pago...'
                      : `Pagar ${formatCurrencyBRL(feeAmount)} com Mercado Pago`}
                  </span>
                </button>
              </form>
            )}

            {/* Plug & Play Gateway Details Note */}
            <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Processado com segurança via Mercado Pago Gateway</span>
              </span>
              <span className="font-mono-num">
                {mercadoPago.environment === 'production' ? 'Modo Produção' : 'Modo Sandbox'}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
