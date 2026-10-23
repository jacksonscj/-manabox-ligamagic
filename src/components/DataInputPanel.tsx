import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, Trash2, Sparkles, FileSpreadsheet, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { SAMPLE_MANABOX_CSV, SAMPLE_MANABOX_TEXT } from '../utils/converter';

interface DataInputPanelProps {
  rawText: string;
  onChangeText: (text: string) => void;
  fileName?: string;
  onSetFileName: (name?: string) => void;
}

export const DataInputPanel: React.FC<DataInputPanelProps> = ({
  rawText,
  onChangeText,
  fileName,
  onSetFileName,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        onChangeText(content);
        onSetFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleLoadCsvSample = () => {
    onChangeText(SAMPLE_MANABOX_CSV);
    onSetFileName('manabox-export-sample.csv');
  };

  const handleLoadTextSample = () => {
    onChangeText(SAMPLE_MANABOX_TEXT);
    onSetFileName('manabox-deck-sample.txt');
  };

  const handleClear = () => {
    onChangeText('');
    onSetFileName(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const lineCount = rawText ? rawText.trim().split(/\r?\n/).filter(Boolean).length : 0;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Upload className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              1. Entrada de Dados (ManaBox)
            </h2>
            <p className="text-[11px] text-slate-400">
              Cole o CSV/Texto ou arraste seu arquivo exportado
            </p>
          </div>
        </div>

        {/* Quick Sample Buttons & Clear */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleLoadCsvSample}
            title="Preencher com um arquivo CSV real exportado pelo ManaBox"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Exemplo CSV</span>
          </button>

          <button
            type="button"
            onClick={handleLoadTextSample}
            title="Preencher com lista de texto simples do ManaBox"
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition"
          >
            <FileText className="w-3 h-3" />
            <span>Exemplo Texto</span>
          </button>

          {rawText && (
            <button
              type="button"
              onClick={handleClear}
              title="Limpar texto inserido"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Zone / Textarea Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex-1 flex flex-col rounded-xl border transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40'
            : 'border-slate-800 bg-slate-950/70 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50'
        }`}
      >
        <textarea
          value={rawText}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={`Cole aqui os dados do ManaBox...

Exemplo CSV:
"Card Name","Set Code","Collector Number","Quantity"
"Lightning Bolt","2x2","60","4"
"Sol Ring","c21","263","1"

Ou lista de texto:
4 Lightning Bolt (2x2) 60
1 Sol Ring [c21] #263`}
          className="w-full flex-1 min-h-[300px] p-3.5 bg-transparent font-mono text-xs sm:text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
          spellCheck={false}
        />

        {/* Drag Overlay if dragging file */}
        {isDragging && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center pointer-events-none p-4 text-center">
            <ArrowDownCircle className="w-10 h-10 text-amber-400 animate-bounce mb-2" />
            <p className="text-sm font-semibold text-white">Solte seu arquivo .csv ou .txt aqui</p>
            <p className="text-xs text-slate-400 mt-1">Processamento 100% no navegador (offline)</p>
          </div>
        )}

        {/* File upload prompt bar at the bottom */}
        <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 rounded-b-xl">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept=".csv,.txt,.tsv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition cursor-pointer"
            >
              <Upload className="w-3 h-3 text-amber-400" />
              <span>Selecionar Arquivo (.csv / .txt)</span>
            </button>

            {fileName && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2 py-0.5 rounded-md truncate max-w-[180px]">
                <FileText className="w-3 h-3 shrink-0" />
                <span className="truncate">{fileName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-[11px] text-slate-500">
            <span>{lineCount} {lineCount === 1 ? 'linha' : 'linhas'}</span>
            <span>•</span>
            <span>{rawText.length} caracteres</span>
          </div>
        </div>
      </div>
    </div>
  );
};
