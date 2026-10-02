import React from 'react';
import { ShieldCheck, CheckCircle2, Building2, MapPin, Lock, FileText, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const SupplierTermsModal: React.FC<Props> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border-2 border-neutral-200 shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-950">
                Termos de Uso de Dados & Privacidade B2B
              </h3>
              <p className="text-xs text-neutral-500">
                Consentimento para divulgação e conexão regional com lojistas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-800 text-lg font-bold p-1 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 text-xs text-neutral-700 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Conexão Comercial Estratégica</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              O CotaFácil armazena com segurança os dados cadastrais da sua distribuidora para conectar você com mais lojistas e compradores da sua região geográfica.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5 text-neutral-800">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">1. Dados Armazenados</h4>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Razão social, nome fantasia, nome do representante de contato, telefone/WhatsApp comercial, cidade/estado de atuação e condições padrão (pedido mínimo e prazo médio de entrega).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5 text-neutral-800">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">2. Finalidade: Indicação a Lojistas Próximos</h4>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Os dados são utilizados pela plataforma para sugerir sua distribuidora quando novos supermercados, mercearias e comércios da sua região abrirem cotações de produtos do seu segmento, ampliando suas vendas sem custo de intermediação.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5 text-neutral-800">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">3. Blindagem de Preços e Concorrência</h4>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  Seus preços e propostas permanecem 100% confidenciais. Nenhum fornecedor concorrente tem acesso aos valores ou tabelas que você submete.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0 mt-0.5 text-neutral-800">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-neutral-900">4. Conformidade com a LGPD</h4>
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  O tratamento de dados é realizado em estrita conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Você pode solicitar atualização ou remoção dos seus dados a qualquer momento pelo suporte da TECX SoftHouse.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-neutral-700 hover:bg-neutral-100 font-bold text-xs cursor-pointer transition-colors"
          >
            Fechar
          </button>
          {onAccept && (
            <button
              type="button"
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Li e Concordo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
