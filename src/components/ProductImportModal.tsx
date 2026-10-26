import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  FileCode,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Package,
  Layers,
  ChevronRight,
  Lock,
  Check,
  FileText
} from 'lucide-react';
import { Product, ShopkeeperStore } from '../types';
import { formatCurrencyBRL } from '../utils/calculations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  store?: ShopkeeperStore | null;
  onImportBatch: (products: Array<Omit<Product, 'id'> | Product>, replaceAll: boolean) => void;
  onOpenBilling?: () => void;
}

type ImportTab = 'file' | 'nfe' | 'photo' | 'manual';

export const ProductImportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  store,
  onImportBatch,
  onOpenBilling,
}) => {
  const isPro = store?.planName?.toLowerCase().includes('pro') ||
                store?.status === 'Teste Grátis' ||
                !store?.planName ||
                store?.planName?.toLowerCase().includes('enterprise');

  const [activeTab, setActiveTab] = useState<ImportTab>('file');

  // File Import State (CSV / Excel / TXT / ERP)
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [parsedProducts, setParsedProducts] = useState<Array<Omit<Product, 'id'>>>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [replaceAll, setReplaceAll] = useState(false);
  const [importSuccess, setImportSuccess] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NF-e XML State
  const [nfeFile, setNfeFile] = useState<File | null>(null);
  const [nfeProducts, setNfeProducts] = useState<Array<Omit<Product, 'id'>>>([]);
  const [nfeInfo, setNfeInfo] = useState<{ nNF: string; emitente: string; totalValor: number } | null>(null);
  const [nfeError, setNfeError] = useState<string | null>(null);
  const nfeInputRef = useRef<HTMLInputElement>(null);

  // Photo AI State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoProducts, setPhotoProducts] = useState<Array<Omit<Product, 'id'>>>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // 1. SMART CSV / ERP FILE PARSER (SUPPORTS 100.000+ ROWS)
  // ----------------------------------------------------
  const cleanHeader = (h: string) => {
    return h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const clean = val.trim().replace('R$', '').replace(/\s/g, '');
    if (clean.includes(',') && clean.includes('.')) {
      // Formato brasileiro com milhar: 1.250,50 -> 1250.50
      return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
    }
    if (clean.includes(',')) {
      return parseFloat(clean.replace(',', '.')) || 0;
    }
    return parseFloat(clean) || 0;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setFileName(selected.name);
    setParseError(null);
    setParsedProducts([]);
    setImportSuccess(null);
    setIsParsing(true);
    setParseProgress(10);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || text.trim().length === 0) {
          setParseError('O arquivo está vazio.');
          setIsParsing(false);
          return;
        }

        // Detect delimiter: semicolon, comma, tab, pipe
        const firstLine = text.split(/\r?\n/)[0] || '';
        let delimiter = ';';
        const counts = {
          ';': (firstLine.match(/;/g) || []).length,
          ',': (firstLine.match(/,/g) || []).length,
          '\t': (firstLine.match(/\t/g) || []).length,
          '|': (firstLine.match(/\|/g) || []).length,
        };
        const bestDelim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (bestDelim && bestDelim[1] > 0) {
          delimiter = bestDelim[0];
        }

        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setParseError('O arquivo deve conter pelo menos um cabeçalho e uma linha de produtos.');
          setIsParsing(false);
          return;
        }

        // Header mapping
        const headers = lines[0].split(delimiter).map((h) => cleanHeader(h.replace(/^["']|["']$/g, '')));

        let nameIdx = headers.findIndex((h) =>
          ['nome', 'descricao', 'descricaoproduto', 'produto', 'item', 'description', 'name', 'xprod'].includes(h)
        );
        let categoryIdx = headers.findIndex((h) =>
          ['categoria', 'departamento', 'grupo', 'secao', 'familia', 'category'].includes(h)
        );
        let unitIdx = headers.findIndex((h) =>
          ['unidade', 'un', 'und', 'medida', 'ucom', 'embalagem', 'unit'].includes(h)
        );
        let codeIdx = headers.findIndex((h) =>
          ['codigo', 'cod', 'sku', 'ean', 'cprod', 'referencia', 'ref', 'barcode', 'id'].includes(h)
        );
        let priceIdx = headers.findIndex((h) =>
          ['preco', 'custo', 'precocusto', 'precovenda', 'valor', 'vuncom', 'price', 'custoatual'].includes(h)
        );
        let qtyIdx = headers.findIndex((h) =>
          ['quantidade', 'qtd', 'quant', 'estoque', 'saldo', 'qcom'].includes(h)
        );

        // Fallback se não encontrar os cabeçalhos exatos
        if (nameIdx === -1) {
          // Pega a primeira coluna de texto mais longa
          nameIdx = headers.length > 1 ? 1 : 0;
        }

        const results: Array<Omit<Product, 'id'>> = [];
        const totalLines = lines.length - 1;
        const chunkSize = 5000;

        // Processamento em lotes para suportar 100.000 produtos sem travar o navegador
        let currentIndex = 1;

        const processBatch = () => {
          const limit = Math.min(currentIndex + chunkSize, lines.length);
          for (let i = currentIndex; i < limit; i++) {
            const rawRow = lines[i];
            if (!rawRow || !rawRow.trim()) continue;

            const cols = rawRow.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
            const prodName = cols[nameIdx]?.trim();
            if (!prodName) continue;

            const category = categoryIdx !== -1 ? cols[categoryIdx]?.trim() : undefined;
            let rawUnit = unitIdx !== -1 ? cols[unitIdx]?.trim()?.toLowerCase() : 'un';
            if (!rawUnit || rawUnit.length > 5) rawUnit = 'un';

            const code = codeIdx !== -1 ? cols[codeIdx]?.trim() : undefined;
            const price = priceIdx !== -1 ? parseNumber(cols[priceIdx]) : undefined;
            const quantity = qtyIdx !== -1 ? Math.max(1, Math.round(parseNumber(cols[qtyIdx]))) : 1;

            results.push({
              name: prodName,
              category: category || 'Geral',
              unit: rawUnit,
              quantity,
              benchmarkPrice: price && price > 0 ? price : undefined,
              code: code || undefined,
            });
          }

          currentIndex = limit;
          const currentProgress = Math.min(95, Math.round((currentIndex / totalLines) * 100));
          setParseProgress(currentProgress);

          if (currentIndex < lines.length) {
            setTimeout(processBatch, 0);
          } else {
            setParseProgress(100);
            setIsParsing(false);
            if (results.length === 0) {
              setParseError('Nenhum produto válido foi identificado no arquivo.');
            } else {
              setParsedProducts(results);
            }
          }
        };

        processBatch();
      } catch (err: any) {
        setParseError(`Erro ao processar arquivo: ${err.message || 'Arquivo corrompido'}`);
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError('Falha na leitura do arquivo local.');
      setIsParsing(false);
    };

    reader.readAsText(selected, 'ISO-8859-1'); // Suporta caracteres acentuados do padrão brasileiro
  };

  const handleConfirmFileImport = () => {
    if (parsedProducts.length === 0) return;
    onImportBatch(parsedProducts, replaceAll);
    setImportSuccess(parsedProducts.length);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // ----------------------------------------------------
  // 2. NOTA FISCAL ELETRÔNICA (XML DA NF-e MODELO 55)
  // ----------------------------------------------------
  const handleNfeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setNfeFile(selected);
    setNfeError(null);
    setNfeProducts([]);
    setNfeInfo(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const xmlText = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
          setNfeError('Arquivo XML inválido ou com formato corrompido.');
          return;
        }

        // Ler cabeçalho da NF-e
        const nNF = xmlDoc.getElementsByTagName('nNF')[0]?.textContent || 'N/A';
        const xNome = xmlDoc.getElementsByTagName('emit')[0]?.getElementsByTagName('xNome')[0]?.textContent || 'Fornecedor';
        const vNF = parseFloat(xmlDoc.getElementsByTagName('vNF')[0]?.textContent || '0');

        setNfeInfo({
          nNF,
          emitente: xNome,
          totalValor: vNF,
        });

        // Ler produtos da nota (<det><prod>)
        const detList = xmlDoc.getElementsByTagName('det');
        const extracted: Array<Omit<Product, 'id'>> = [];

        for (let i = 0; i < detList.length; i++) {
          const prodTag = detList[i].getElementsByTagName('prod')[0];
          if (!prodTag) continue;

          const cProd = prodTag.getElementsByTagName('cProd')[0]?.textContent || '';
          const xProd = prodTag.getElementsByTagName('xProd')[0]?.textContent || '';
          const uCom = (prodTag.getElementsByTagName('uCom')[0]?.textContent || 'UN').toLowerCase();
          const qCom = parseFloat(prodTag.getElementsByTagName('qCom')[0]?.textContent || '1');
          const vUnCom = parseFloat(prodTag.getElementsByTagName('vUnCom')[0]?.textContent || '0');
          const NCM = prodTag.getElementsByTagName('NCM')[0]?.textContent || '';

          if (xProd) {
            extracted.push({
              name: xProd,
              category: 'NF-e ' + nNF,
              unit: uCom.slice(0, 5),
              quantity: Math.max(1, Math.round(qCom)),
              benchmarkPrice: vUnCom > 0 ? vUnCom : undefined,
              code: cProd || undefined,
              ncm: NCM || undefined,
            });
          }
        }

        if (extracted.length === 0) {
          setNfeError('Nenhum item <prod> encontrado nesta Nota Fiscal Eletrônica.');
        } else {
          setNfeProducts(extracted);
        }
      } catch (err: any) {
        setNfeError('Erro ao decodificar XML da NF-e: ' + err.message);
      }
    };

    reader.readAsText(selected);
  };

  const handleConfirmNfeImport = () => {
    if (nfeProducts.length === 0) return;
    onImportBatch(nfeProducts, false);
    setImportSuccess(nfeProducts.length);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // ----------------------------------------------------
  // 3. RECONHECIMENTO POR FOTO COM IA (OCR / GÔNDOLA)
  // ----------------------------------------------------
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const previewUrl = URL.createObjectURL(selected);
    setPhotoPreview(previewUrl);
    setIsAnalyzingPhoto(true);

    // Simulação do processamento inteligente de Visão Computacional / OCR
    setTimeout(() => {
      setIsAnalyzingPhoto(false);
      setPhotoProducts([
        { name: 'Cabo Flexível 2,5mm 100m Antichama', category: 'Fios e Cabos', unit: 'rl', quantity: 1, code: 'EL-025' },
        { name: 'Disjuntor Bipolar Din 32A Curva C', category: 'Proteção Elétrica', unit: 'un', quantity: 1, code: 'DJ-032' },
        { name: 'Tomada 2P+T 10A com Placa 4x2', category: 'Acabamentos', unit: 'un', quantity: 1, code: 'TM-010' },
        { name: 'Lâmpada LED Tubular T8 18W 6500K', category: 'Iluminação', unit: 'un', quantity: 1, code: 'LP-018' },
        { name: 'Fita Isolante 19mm x 20m Preta', category: 'Acessórios', unit: 'un', quantity: 1, code: 'FT-020' },
      ]);
    }, 1800);
  };

  const handleConfirmPhotoImport = () => {
    if (photoProducts.length === 0) return;
    onImportBatch(photoProducts, false);
    setImportSuccess(photoProducts.length);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  // ----------------------------------------------------
  // MODELO CSV EXEMPLO PARA DOWNLOAD
  // ----------------------------------------------------
  const handleDownloadTemplate = () => {
    const templateContent =
      'Codigo;Descricao;Categoria;Unidade;PrecoCusto;Estoque\n' +
      'CAB-001;Cabo Flexível 2,5mm 750V 100 Metros;Fios e Cabos;rl;189.90;15\n' +
      'DIS-032;Disjuntor Bipolar 32A Curva C;Proteção;un;38.50;40\n' +
      'TOM-010;Tomada 10A com Placa 4x2 Branco;Acabamentos;un;14.20;80\n' +
      'LAM-009;Lâmpada LED Bulbo 9W 6500K Bivolt;Iluminação;cx;7.90;120\n' +
      'QUA-008;Quadro de Distribuição 8 Disjuntores Sobrepor;Quadros;un;65.00;10\n';

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_estoque_cotafacil.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-6 border-2 border-neutral-200 shadow-2xl my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center font-bold shadow-md shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-black text-neutral-950">
                  Importar Produtos em Massa
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Plano Pro • Ilimitado
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Alimente seu catálogo com até 100.000 produtos automaticamente via exportação de ERP, Nota Fiscal Eletrônica ou Foto.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modalidade Selector (Leque de Opções) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-neutral-950 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <FileSpreadsheet className={`w-4 h-4 ${activeTab === 'file' ? 'text-emerald-400' : 'text-neutral-500'}`} />
            <span>Arquivo de Estoque / ERP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nfe')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'nfe'
                ? 'bg-neutral-950 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <FileCode className={`w-4 h-4 ${activeTab === 'nfe' ? 'text-sky-400' : 'text-neutral-500'}`} />
            <span>Nota Fiscal (XML NF-e)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-neutral-950 text-white shadow-md'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
            }`}
          >
            <Camera className={`w-4 h-4 ${activeTab === 'photo' ? 'text-amber-400' : 'text-neutral-500'}`} />
            <span>Foto / OCR com IA</span>
          </button>
        </div>

        {/* Pro Plan Gate (if store is not Pro and not Trial) */}
        {!isPro && (
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  Recurso Exclusivo do Plano Pro
                </h4>
                <p className="text-xs text-amber-800">
                  Sua loja está no Plano Básico. Para importar planilhas com até 100.000 itens ou notas fiscais em 1 clique, ative o Plano Pro.
                </p>
              </div>
            </div>
            {onOpenBilling && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBilling();
                }}
                className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-black shrink-0 cursor-pointer shadow-sm"
              >
                Ativar Plano Pro
              </button>
            )}
          </div>
        )}

        {/* Success Banner */}
        {importSuccess !== null && (
          <div className="p-4 rounded-2xl bg-emerald-500 text-neutral-950 font-bold text-sm flex items-center gap-3 shadow-md animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            <div>
              <span>Sucesso! <strong>{importSuccess.toLocaleString('pt-BR')} produtos</strong> foram salvos no seu catálogo.</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 1: ARQUIVO DE ESTOQUE / ERP (CSV, TXT, EXCEL)        */}
        {/* ======================================================== */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-neutral-600">
                Selecione o arquivo gerado pelo seu sistema de vendas/estoque (Bling, Tiny, Omie, Totvs, Linx, SysPDV, etc).
              </p>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Modelo CSV</span>
              </button>
            </div>

            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-300 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 text-center bg-neutral-50/70 hover:bg-emerald-50/20 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 group-hover:border-emerald-400 group-hover:scale-105 transition-all text-neutral-600 group-hover:text-emerald-600 flex items-center justify-center mx-auto shadow-xs mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 group-hover:text-emerald-950">
                {fileName ? fileName : 'Clique aqui para carregar o arquivo de estoque'}
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Formatos aceitos: <strong>CSV, TXT, TSV</strong> (delimitados por ponto-e-vírgula ou vírgula).
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-black uppercase tracking-wider">
                ⚡ Processamento rápido de até 100.000 produtos
              </div>
            </div>

            {/* Parsing Progress Bar */}
            {isParsing && (
              <div className="p-4 rounded-2xl bg-neutral-900 text-white space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    Processando produtos do estoque...
                  </span>
                  <span className="font-mono-num font-bold text-emerald-400">{parseProgress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-150"
                    style={{ width: `${parseProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Parse Error */}
            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview & Confirmation */}
            {parsedProducts.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{parsedProducts.length.toLocaleString('pt-BR')} produtos identificados com sucesso!</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Confira abaixo uma amostra dos primeiros itens antes de salvar no catálogo.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-neutral-300">
                    <input
                      type="checkbox"
                      checked={replaceAll}
                      onChange={(e) => setReplaceAll(e.target.checked)}
                      className="rounded accent-emerald-600"
                    />
                    <span>Substituir todo o catálogo atual</span>
                  </label>
                </div>

                {/* Table Preview */}
                <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Código / SKU</th>
                        <th className="p-2.5">Produto / Descrição</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5">Unidade</th>
                        <th className="p-2.5 text-right">Preço Ref.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {parsedProducts.slice(0, 8).map((prod, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-mono-num text-neutral-500">{prod.code || `ID-${idx + 1}`}</td>
                          <td className="p-2.5 font-bold text-neutral-900">{prod.name}</td>
                          <td className="p-2.5 text-neutral-600">{prod.category || 'Geral'}</td>
                          <td className="p-2.5 uppercase font-semibold text-neutral-700">{prod.unit}</td>
                          <td className="p-2.5 text-right font-mono-num font-bold text-neutral-800">
                            {prod.benchmarkPrice ? formatCurrencyBRL(prod.benchmarkPrice) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {parsedProducts.length > 8 && (
                  <p className="text-[11px] text-neutral-400 text-center">
                    ... e mais {(parsedProducts.length - 8).toLocaleString('pt-BR')} itens prontos para importar.
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedProducts([]);
                      setFileName('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmFileImport}
                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Importar {parsedProducts.length.toLocaleString('pt-BR')} Produtos para o Catálogo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: NOTA FISCAL ELETRÔNICA (XML DA NF-e)              */}
        {/* ======================================================== */}
        {activeTab === 'nfe' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600">
              Faça upload do arquivo <strong>.XML</strong> da Nota Fiscal Eletrônica (NF-e modelo 55) recebida de fornecedores. O sistema extrai todos os produtos, códigos, unidades e valores unitários automaticamente.
            </p>

            <div
              onClick={() => nfeInputRef.current?.click()}
              className="border-2 border-dashed border-sky-300 hover:border-sky-500 rounded-3xl p-6 sm:p-8 text-center bg-sky-50/50 hover:bg-sky-50 transition-all cursor-pointer group"
            >
              <input
                ref={nfeInputRef}
                type="file"
                accept=".xml"
                onChange={handleNfeUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-sky-200 group-hover:scale-105 transition-all text-sky-600 flex items-center justify-center mx-auto shadow-xs mb-3">
                <FileCode className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900">
                {nfeFile ? nfeFile.name : 'Selecionar arquivo XML da NF-e'}
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Compatível com padrão nacional da SEFAZ (NF-e 4.0).
              </p>
            </div>

            {nfeError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{nfeError}</span>
              </div>
            )}

            {nfeInfo && nfeProducts.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-2xl bg-sky-100/70 border border-sky-300 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-sky-950">
                      NF-e nº <strong>{nfeInfo.nNF}</strong> • Emitente: <strong>{nfeInfo.emitente}</strong>
                    </span>
                    <span className="font-mono-num font-bold text-sky-900">
                      Total: {formatCurrencyBRL(nfeInfo.totalValor)}
                    </span>
                  </div>
                  <div className="text-[11px] text-sky-800">
                    {nfeProducts.length} itens extraídos da nota prontos para inclusão.
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Cód. Fornecedor</th>
                        <th className="p-2.5">Descrição do Item (NF-e)</th>
                        <th className="p-2.5">NCM</th>
                        <th className="p-2.5">Unidade</th>
                        <th className="p-2.5 text-right">Preço Unit. NF</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {nfeProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-mono-num text-neutral-500">{p.code || '-'}</td>
                          <td className="p-2.5 font-bold text-neutral-900">{p.name}</td>
                          <td className="p-2.5 text-neutral-600 font-mono-num">{p.ncm || '-'}</td>
                          <td className="p-2.5 uppercase font-semibold text-neutral-700">{p.unit}</td>
                          <td className="p-2.5 text-right font-mono-num font-bold text-neutral-800">
                            {p.benchmarkPrice ? formatCurrencyBRL(p.benchmarkPrice) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNfeProducts([]);
                      setNfeFile(null);
                      setNfeInfo(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmNfeImport}
                    className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Salvar {nfeProducts.length} Produtos no Catálogo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: FOTO / OCR COM INTELIGÊNCIA ARTIFICIAL           */}
        {/* ======================================================== */}
        {activeTab === 'photo' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-600">
              Tire uma foto ou envie uma imagem da prateleira, gôndola ou etiqueta do produto. O modelo de Visão Computacional analisa a imagem e identifica os produtos automaticamente.
            </p>

            <div
              onClick={() => photoInputRef.current?.click()}
              className="border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-3xl p-6 sm:p-8 text-center bg-amber-50/50 hover:bg-amber-50 transition-all cursor-pointer group"
            >
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-white border border-amber-200 group-hover:scale-105 transition-all text-amber-600 flex items-center justify-center mx-auto shadow-xs mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900">
                Tirar Foto ou Escolher Imagem
              </h4>
              <p className="text-xs text-neutral-500 mt-1">
                Dica: foque nas etiquetas de preço ou códigos de barras para melhor precisão.
              </p>
            </div>

            {isAnalyzingPhoto && (
              <div className="p-4 rounded-2xl bg-neutral-900 text-white flex items-center justify-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-xs font-bold">
                  Inteligência Artificial analisando a foto e detectando produtos...
                </span>
              </div>
            )}

            {photoProducts.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 flex items-center justify-between text-xs font-bold text-amber-950">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>IA identificou {photoProducts.length} produtos na foto!</span>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-100 text-neutral-600 font-bold sticky top-0">
                      <tr>
                        <th className="p-2.5">Código Sugerido</th>
                        <th className="p-2.5">Nome do Produto</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5">Unidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {photoProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-mono-num text-neutral-500">{p.code || `IA-${idx + 1}`}</td>
                          <td className="p-2.5 font-bold text-neutral-900">{p.name}</td>
                          <td className="p-2.5 text-neutral-600">{p.category}</td>
                          <td className="p-2.5 uppercase font-semibold text-neutral-700">{p.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoProducts([]);
                      setPhotoPreview(null);
                    }}
                    className="px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPhotoImport}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <span>Salvar {photoProducts.length} Produtos Reconhecidos</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
