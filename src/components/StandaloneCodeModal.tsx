import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneCodeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // We can fetch or inline the standalone HTML template
  const copyToClipboard = async () => {
    try {
      const response = await fetch('/standalone.html');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadFile = async () => {
    try {
      const response = await fetch('/standalone.html');
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cotafacil-b2b-standalone.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-neutral-200 shadow-2xl">
        <div className="px-4 py-3.5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-neutral-700" />
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Arquivo Único em HTML5 + Tailwind CDN
              </h3>
              <p className="text-[11px] text-neutral-500">
                standalone.html — Código puro, zero bundlers, pronto para rodar no navegador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs text-neutral-600 leading-relaxed">
            Este arquivo foi estruturado rigorosamente com os <strong>3 Passos</strong> solicitados:
            <ul className="list-disc list-inside mt-1.5 space-y-0.5 text-neutral-700">
              <li><strong>Passo 1:</strong> Cabeçalho fixo, card de Valor Total Otimizado, lista de fornecedores com badge de visualização e progresso.</li>
              <li><strong>Passo 2:</strong> Visão analítica com as 4 regras de cores suaves (Em Branco, Mais Caro pastel, Melhor Preço verde pastel, Empatado azul pastel).</li>
              <li><strong>Passo 3:</strong> Rodapé dinâmico com validação de pedido mínimo e simulação do <strong>Cenário A</strong> e <strong>Cenário B</strong>.</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Código Copiado!' : 'Copiar Código HTML5'}</span>
            </button>
            <button
              onClick={downloadFile}
              className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-neutral-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .html</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
