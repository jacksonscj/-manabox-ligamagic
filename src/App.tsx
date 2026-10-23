/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { DataInputPanel } from './components/DataInputPanel';
import { DataOutputPanel } from './components/DataOutputPanel';
import { PWAExportModal } from './components/PWAExportModal';
import { OfflineBanner } from './components/OfflineBanner';
import {
  ConverterOptions,
  convertManaBoxToLigaMagic,
  SAMPLE_MANABOX_CSV,
} from './utils/converter';

/**
 * Padrão fixo otimizado para a LigaMagic:
 * - Prioridade 1 (Edição + Colecionador para precisão máxima)
 * - Mapeamento automático de siglas internacionais (ex: TLA -> TLE)
 * - Sanitização de números com letras (ex: 18a -> 18) para evitar erro de sintaxe
 * - Consolidação de repetidas e remoção de tags de foil no texto do deck
 */
const LIGAMAGIC_PRIORITY_OPTIONS: ConverterOptions = {
  format: 'priority',
  consolidateDuplicates: true,
  cleanSplitCardNames: false,
  cleanFoilTags: true,
  skipBasicLandsNumber: false,
  collectorNumberHandling: 'digits_only',
  mapSetCodesToLigaMagic: true,
};

export default function App() {
  const [rawText, setRawText] = useState<string>(SAMPLE_MANABOX_CSV);
  const [fileName, setFileName] = useState<string | undefined>('manabox-export-sample.csv');
  const [showSourceModal, setShowSourceModal] = useState<boolean>(false);

  // Conversão instantânea no formato de máxima prioridade da LigaMagic
  const conversionResult = useMemo(() => {
    return convertManaBoxToLigaMagic(rawText, LIGAMAGIC_PRIORITY_OPTIONS);
  }, [rawText]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header with PWA installation & branding */}
      <Header onOpenSourceModal={() => setShowSourceModal(true)} />

      {/* Main Workspace - 2 Columns (Input / Output) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch flex-1">
          {/* Column 1: Input */}
          <DataInputPanel
            rawText={rawText}
            onChangeText={setRawText}
            fileName={fileName}
            onSetFileName={setFileName}
          />

          {/* Column 2: Output */}
          <DataOutputPanel
            conversionResult={conversionResult}
          />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3.5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>ManaBox para LigaMagic PWA • Formato Prioritário de Máxima Precisão</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSourceModal(true)}
              className="text-slate-400 hover:text-white transition underline underline-offset-2"
            >
              Ver index.html, manifest.json e service-worker.js
            </button>
            <a
              href="https://www.ligamagic.com.br/?view=dks/importar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition"
            >
              Importador LigaMagic
            </a>
          </div>
        </div>
      </footer>

      {/* Standalone Vanilla Code modal */}
      <PWAExportModal
        isOpen={showSourceModal}
        onClose={() => setShowSourceModal(false)}
      />

      {/* Offline notification banner */}
      <OfflineBanner />
    </div>
  );
}
