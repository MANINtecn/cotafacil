import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, Info, X, Database, Save, UserCheck } from 'lucide-react';

const COOKIE_STORAGE_KEY = 'cotafacil_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!consent) {
        // Exibe após 800ms para uma entrada suave
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage bloqueado ou em modo privado restrito
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify({
        accepted: true,
        date: new Date().toISOString(),
      }));
    } catch {}
    setIsVisible(false);
    setIsDetailsModalOpen(false);
  };

  if (!isVisible && !isDetailsModalOpen) return null;

  return (
    <>
      {/* Banner Flutuante no Rodapé */}
      {isVisible && (
        <aside
          aria-label="Aviso de cookies e privacidade"
          className="fixed bottom-3 sm:bottom-5 left-3 sm:left-6 right-3 sm:right-6 sm:max-w-2xl sm:mx-auto z-50 bg-neutral-950/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-neutral-700 shadow-2xl animate-in fade-in slide-in-from-bottom duration-300"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Cookie className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Privacidade, Cookies & Persistência Local
                  </h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                    LGPD
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Utilizamos cookies e armazenamento local para manter sua sessão segura, salvar rascunhos de cotações em tempo real (para você não perder itens se fechar a tela) e conectar lojistas a fornecedores da sua região.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Saber Mais
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-black transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aceitar e Continuar</span>
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Modal Explicativo Detalhado de Cookies e LGPD */}
      {isDetailsModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border-2 border-neutral-200 shadow-2xl my-6">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold">
                  <Cookie className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-950">
                    Para que servem os Cookies no CotaFácil?
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Transparência sobre uso de dados e armazenamento do sistema
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-700 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
              <p>
                Os <strong>cookies</strong> e o <strong>armazenamento local (localStorage)</strong> são arquivos digitais leves guardados no seu próprio navegador para garantir que o sistema funcione com máxima agilidade e sem perda de trabalho. No CotaFácil, eles têm 4 finalidades essenciais:
              </p>

              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <Save className="w-4 h-4 text-emerald-600" />
                    <span>1. Rascunhos Persistentes de Cotação (Auto-save)</span>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Enquanto você adiciona produtos a uma lista, o CotaFácil grava instantaneamente no navegador. Se o celular fechar o aplicativo ou a internet oscilar, ao retornar a sua lista estará intacta, sem necessidade de digitar tudo do zero.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>2. Sessão Segura e Identificação</span>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Mantém sua loja autenticada com segurança no Supabase, evitando que você precise fazer login a cada clique ou troca de aba.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Conexão Regional entre Fornecedores e Lojistas</span>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Os dados comerciais de distribuidores e representantes (como cidade, telefone e ramo) são armazenados para que, no futuro, a plataforma indique automaticamente fornecedores próximos da localização de cada lojista.
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                  <div className="font-bold text-neutral-900 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>4. Performance e Funcionamento Offline/PWA</span>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Permite que o aplicativo carregue em milissegundos e suporte uso no modo aplicativo instalado (PWA) em celulares Android e iOS.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-neutral-700 hover:bg-neutral-100 font-bold text-xs cursor-pointer transition-colors"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Entendi e Aceito</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
