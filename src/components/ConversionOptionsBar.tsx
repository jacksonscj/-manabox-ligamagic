import React from 'react';
import { Settings2, Sparkles, Layers, SlidersHorizontal, CheckSquare, Square } from 'lucide-react';
import { OutputFormat, ConverterOptions } from '../utils/converter';

interface ConversionOptionsBarProps {
  options: ConverterOptions;
  onChangeOptions: (newOptions: ConverterOptions) => void;
}

export const ConversionOptionsBar: React.FC<ConversionOptionsBarProps> = ({
  options,
  onChangeOptions,
}) => {
  const handleFormatChange = (format: OutputFormat) => {
    onChangeOptions({ ...options, format });
  };

  const toggleConsolidate = () => {
    onChangeOptions({ ...options, consolidateDuplicates: !options.consolidateDuplicates });
  };

  const toggleCleanSplit = () => {
    onChangeOptions({ ...options, cleanSplitCardNames: !options.cleanSplitCardNames });
  };

  const toggleCleanFoil = () => {
    onChangeOptions({ ...options, cleanFoilTags: !options.cleanFoilTags });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Title & Format selector */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-amber-400" />
            Formato de Saída (LigaMagic / Liga Mestre)
          </label>
          <span className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Recomendado: Máxima Precisão
          </span>
        </div>

        {/* 4 Format Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Format 1 - Priority */}
          <button
            type="button"
            onClick={() => handleFormatChange('priority')}
            className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer relative ${
              options.format === 'priority'
                ? 'bg-amber-500/10 border-amber-500/80 text-white shadow-sm ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-400">1. Prioritário (Edição + Nº)</span>
              {options.format === 'priority' && (
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20"></span>
              )}
            </div>
            <code className="text-xs font-mono text-slate-200 block truncate">
              2 Lightning Bolt (2X2) 60
            </code>
            <p className="text-[11px] text-slate-400 mt-1">
              Garante a arte, edição e foil exatos na Liga.
            </p>
          </button>

          {/* Format 2 - Brackets */}
          <button
            type="button"
            onClick={() => handleFormatChange('brackets_set')}
            className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer relative ${
              options.format === 'brackets_set'
                ? 'bg-indigo-500/10 border-indigo-500/80 text-white shadow-sm ring-1 ring-indigo-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-400">2. Colchetes [Edição]</span>
              {options.format === 'brackets_set' && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20"></span>
              )}
            </div>
            <code className="text-xs font-mono text-slate-200 block truncate">
              2 Lightning Bolt [2X2]
            </code>
            <p className="text-[11px] text-slate-400 mt-1">
              Edição em maiúsculas sem número.
            </p>
          </button>

          {/* Format 3 - Prefixed Brackets */}
          <button
            type="button"
            onClick={() => handleFormatChange('prefixed_set')}
            className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer relative ${
              options.format === 'prefixed_set'
                ? 'bg-sky-500/10 border-sky-500/80 text-white shadow-sm ring-1 ring-sky-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-sky-400">3. Prefixo [Edição]</span>
              {options.format === 'prefixed_set' && (
                <span className="w-2 h-2 rounded-full bg-sky-400 ring-4 ring-sky-400/20"></span>
              )}
            </div>
            <code className="text-xs font-mono text-slate-200 block truncate">
              2 [2X2] Lightning Bolt
            </code>
            <p className="text-[11px] text-slate-400 mt-1">
              Edição antecedendo o nome.
            </p>
          </button>

          {/* Format 4 - Simple Name */}
          <button
            type="button"
            onClick={() => handleFormatChange('simple_name')}
            className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer relative ${
              options.format === 'simple_name'
                ? 'bg-purple-500/10 border-purple-500/80 text-white shadow-sm ring-1 ring-purple-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-purple-400">4. Apenas Nome</span>
              {options.format === 'simple_name' && (
                <span className="w-2 h-2 rounded-full bg-purple-400 ring-4 ring-purple-400/20"></span>
              )}
            </div>
            <code className="text-xs font-mono text-slate-200 block truncate">
              2 Lightning Bolt
            </code>
            <p className="text-[11px] text-slate-400 mt-1">
              Sem especificar edição (preço médio).
            </p>
          </button>
        </div>
      </div>

      {/* Auxiliary Toggles */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          Ajustes finos:
        </span>

        {/* Map set codes to LigaMagic official codes */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-200 hover:text-white transition">
          <input
            type="checkbox"
            checked={options.mapSetCodesToLigaMagic}
            onChange={() =>
              onChangeOptions({ ...options, mapSetCodesToLigaMagic: !options.mapSetCodesToLigaMagic })
            }
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-amber-300">Corrigir siglas para a LigaMagic</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/40 px-1.5 py-0.2 rounded">
              TLA → TLE (Avatar)
            </span>
          </span>
        </label>

        {/* Consolidate duplicates */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={options.consolidateDuplicates}
            onChange={toggleConsolidate}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Somar quantidades de cartas repetidas</span>
        </label>

        {/* Clean foil tags */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={options.cleanFoilTags}
            onChange={toggleCleanFoil}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Remover sufixos <code>*F*</code> / <code>(Foil)</code></span>
        </label>

        {/* Split cards handling */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition">
          <input
            type="checkbox"
            checked={options.cleanSplitCardNames}
            onChange={toggleCleanSplit}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
          />
          <span>Simplificar cartas duplas (ex: <code>Wear</code> em vez de <code>Wear // Tear</code>)</span>
        </label>
      </div>

      {/* Special LigaMagic compatibility setting for Collector Numbers with letters (e.g. 18a) */}
      <div className="pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5 text-xs bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-semibold text-slate-300">
            Tratamento de Letras no Nº da Coleção (ex: <code>High Tide (FEM) 18a</code>):
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
            <input
              type="radio"
              name="collectorNumberHandling"
              value="digits_only"
              checked={options.collectorNumberHandling === 'digits_only'}
              onChange={() => onChangeOptions({ ...options, collectorNumberHandling: 'digits_only' })}
              className="text-amber-500 bg-slate-950 border-slate-700"
            />
            <span className="font-medium text-amber-300">Apenas dígitos (18a → 18) <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">Evita Erro</span></span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white ml-2">
            <input
              type="radio"
              name="collectorNumberHandling"
              value="omit_if_has_letters"
              checked={options.collectorNumberHandling === 'omit_if_has_letters'}
              onChange={() => onChangeOptions({ ...options, collectorNumberHandling: 'omit_if_has_letters' })}
              className="text-amber-500 bg-slate-950 border-slate-700"
            />
            <span>Omitir número (ex: <code>High Tide (FEM)</code>)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-white ml-2">
            <input
              type="radio"
              name="collectorNumberHandling"
              value="raw"
              checked={options.collectorNumberHandling === 'raw'}
              onChange={() => onChangeOptions({ ...options, collectorNumberHandling: 'raw' })}
              className="text-amber-500 bg-slate-950 border-slate-700"
            />
            <span>Manter original (<code>18a</code>)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
