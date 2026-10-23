import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { ConversionResult } from '../utils/converter';

interface DataOutputPanelProps {
  conversionResult: ConversionResult;
}

export const DataOutputPanel: React.FC<DataOutputPanelProps> = ({
  conversionResult,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'table'>('text');

  const {
    formattedText,
    cards,
    totalCardsCount,
    uniqueCardsCount,
    uniqueSetsCount,
    warningsCount,
    correctedLettersCount,
    correctedCards,
    mappedSetsCount,
    mappedSets,
  } = conversionResult;

  const handleCopy = async () => {
    if (!formattedText) return;
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleDownload = () => {
    if (!formattedText) return;
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `deck-ligamagic-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFoilCsv = () => {
    if (cards.length === 0) return;
    const header = 'Quantidade,Nome,Edicao,Numero,Foil';
    const rows = cards.map(
      (c) =>
        `"${c.quantity}","${c.name}","${c.setCode}","${c.collectorNumber}","${c.isFoil ? 'FOIL' : ''}"`
    );
    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `colecao-ligamagic-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasFoil = cards.some((c) => c.isFoil);

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              2. Saída LigaMagic (Prioridade 1: Edição + Nº)
            </h2>
            <p className="text-[11px] text-slate-400">
              Formato de máxima precisão pronto para copiar e colar
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        {cards.length > 0 && (
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Texto</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-800 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Tabela</span>
            </button>
          </div>
        )}
      </div>

      {/* Discreet Auto-Correction Badge Bar (Letters in number & Set Mapping) */}
      {(correctedLettersCount > 0 || mappedSetsCount > 0) && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-300 text-[11px]">
              Otimizações Automáticas LigaMagic:
            </span>
            {correctedLettersCount > 0 && (
              <span
                title="Letras em números de colecionador foram removidas para evitar erros de sintaxe na LigaMagic (ex: 18a -> 18)"
                className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 text-[11px] font-mono border border-emerald-500/30"
              >
                {correctedLettersCount}x nº com letras (18a → 18)
              </span>
            )}
            {mappedSetsCount > 0 && (
              <span
                title="Siglas internacionais do ManaBox adaptadas para o código oficial da LigaMagic (ex: TLA -> TLE para Avatar)"
                className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 text-[11px] font-mono border border-indigo-500/30"
              >
                {mappedSetsCount}x sigla de edição (TLA → TLE)
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-400/90 font-medium ml-auto">
            Garantia de 100% compatibilidade
          </span>
        </div>
      )}

      {/* Main Output / Textarea / Table Container */}
      <div className="relative flex-1 flex flex-col rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden">
        {activeTab === 'text' ? (
          <textarea
            readOnly
            value={formattedText}
            placeholder="O resultado convertido para a LigaMagic aparecerá aqui..."
            className="w-full flex-1 min-h-[300px] p-3.5 bg-transparent font-mono text-xs sm:text-[13px] text-emerald-300 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed selection:bg-emerald-500/30 selection:text-emerald-200"
            spellCheck={false}
          />
        ) : (
          <div className="w-full flex-1 min-h-[300px] overflow-y-auto p-2">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="py-2 px-2.5 font-semibold">Qtd</th>
                  <th className="py-2 px-3 font-semibold">Nome da Carta</th>
                  <th className="py-2 px-2 font-semibold">Edição</th>
                  <th className="py-2 px-2 font-semibold">Nº</th>
                  <th className="py-2 px-3 font-semibold text-right">LigaMagic Linha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cards.map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-slate-900/40">
                    <td className="py-2 px-2.5 font-mono font-bold text-amber-400">{c.quantity}</td>
                    <td className="py-2 px-3 font-medium text-slate-100 flex items-center gap-1.5 flex-wrap">
                      <span>{c.name}</span>
                      {c.isFoil && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          FOIL
                        </span>
                      )}
                      {c.hadLetterInNumber && c.originalCollectorNumber !== c.collectorNumber && (
                        <span
                          title={`Original: ${c.originalCollectorNumber} -> Ajustado: ${c.collectorNumber}`}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono"
                        >
                          {c.originalCollectorNumber} → {c.collectorNumber}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2">
                      {c.setCode ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            {c.setCode}
                          </span>
                          {c.wasSetMapped && c.originalSetCode && (
                            <span
                              title={`ManaBox: ${c.originalSetCode} -> LigaMagic: ${c.setCode}`}
                              className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono"
                            >
                              {c.originalSetCode}→{c.setCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-400">
                      {c.collectorNumber || '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-xs text-emerald-400 truncate max-w-[200px]">
                      {formattedText.split('\n')[i] || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Counter Summary Bar */}
        <div className="px-3.5 py-2.5 border-t border-slate-800 bg-slate-900/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total:</span>
              <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {totalCardsCount} {totalCardsCount === 1 ? 'carta' : 'cartas'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Únicas:</span>
              <span className="font-semibold text-slate-200">
                {uniqueCardsCount}
              </span>
            </div>

            {uniqueSetsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Edições:</span>
                <span className="font-semibold text-slate-200">
                  {uniqueSetsCount}
                </span>
              </div>
            )}

            {warningsCount > 0 && (
              <div className="flex items-center gap-1 text-amber-400/90" title={`${warningsCount} cartas sem número ou edição`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{warningsCount} avisos</span>
              </div>
            )}
          </div>

          <a
            href="https://www.ligamagic.com.br/?view=dks/importar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition underline underline-offset-2 ml-auto"
          >
            <span>Abrir Importador LigaMagic</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className={`grid grid-cols-1 ${hasFoil ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2.5`}>
        {/* Copy Button (In Highlight) */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!formattedText}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 scale-[0.99]'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black shadow-amber-500/20 hover:shadow-amber-500/40 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-5 h-5 text-white animate-bounce" />
              <span className="text-white">Copiado para a Área de Transferência!</span>
            </>
          ) : (
            <>
              <Copy className="w-5 h-5 text-slate-950" />
              <span>Copiar para a Área de Transferência</span>
            </>
          )}
        </button>

        {/* Download .txt button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!formattedText}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 text-indigo-400" />
          <span>Baixar .TXT (Decks)</span>
        </button>

        {/* Download Foil CSV button if any foil cards exist */}
        {hasFoil && (
          <button
            type="button"
            onClick={handleDownloadFoilCsv}
            disabled={!formattedText}
            className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl font-medium text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-indigo-300 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Baixar CSV Coleção (Foil)</span>
          </button>
        )}
      </div>
    </div>
  );
};
