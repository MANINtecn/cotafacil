import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Smartphone, X, Share, PlusSquare, Sparkles } from 'lucide-react';

const PWA_DISMISS_KEY = 'cotafacil_pwa_banner_dismissed';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isNativePromptReady, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    try {
      const dismissedUntil = localStorage.getItem(PWA_DISMISS_KEY);
      if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  if (isInstalled || !isInstallable || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      // Dismiss for 24 hours
      localStorage.setItem(PWA_DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    } catch {
      // ignore
    }
  };

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const result = await install();
      if (result === 'guide' || isIOS) {
        setShowGuide(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <>
      {/* Floating Bottom Banner */}
      <aside
        aria-label="Instalar Aplicativo CotaFácil"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-neutral-950 text-white p-4 rounded-3xl shadow-2xl border-2 border-neutral-800 animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-192x192.png"
              alt="CotaFácil App"
              className="w-12 h-12 rounded-2xl border border-neutral-700 bg-neutral-900 object-cover shrink-0 shadow-xs"
              onError={(e) => {
                // Fallback to icon SVG if png fails
                (e.currentTarget as HTMLImageElement).src = '/icon.svg';
              }}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  App Disponível
                </span>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight mt-0.5">
                Instalar CotaFácil
              </h4>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Adicione à tela inicial para abrir em tela cheia com 1 toque.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3.5 pt-3 border-t border-neutral-800 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            disabled={installing}
            className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-neutral-950 text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-neutral-950" />
            <span>{installing ? 'Instalando...' : 'Instalar Agora'}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="px-3 py-2.5 text-neutral-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-neutral-900 transition-colors cursor-pointer"
          >
            Depois
          </button>
        </div>
      </aside>

      {/* Guide Modal for iOS Safari / Manual Installation */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 text-white p-6 shadow-2xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {isIOS ? 'Instalar no iPhone / iPad' : 'Instalar no Navegador'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <p>
                    No Safari, toque no botão <strong>Compartilhar</strong> (<Share className="w-3.5 h-3.5 inline text-sky-400" />) na barra inferior.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <p>
                    Role a lista para baixo e toque em <strong>Adicionar à Tela de Início</strong> (<PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />).
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <p>
                    Toque em <strong>Adicionar</strong> no canto superior direito. Pronto! O app aparecerá na sua tela inicial.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-neutral-300">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <p>
                    Toque no menu <strong>⋮ (três pontinhos)</strong> no canto superior direito do seu navegador.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <p>
                    Selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <p>
                    Confirme a instalação. O ícone do CotaFácil será adicionado ao seu celular ou computador!
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
