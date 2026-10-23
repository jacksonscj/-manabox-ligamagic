import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, FileCode2, ExternalLink, Sparkles, Check, RotateCw } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface HeaderProps {
  onOpenSourceModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSourceModal }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 3000);
    }
  };

  const handleForceRefresh = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) {
          await r.unregister();
        }
      }
    } catch (e) {
      console.warn(e);
    }
    window.location.reload();
  };

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-indigo-600 to-purple-700 p-0.5 shadow-lg shadow-indigo-950/50 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                <img src="/icon.svg" alt="Mana2Liga Logo" className="w-7 h-7 object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
                  ManaBox <span className="text-amber-400 font-black">→</span> LigaMagic
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full">
                  PWA
                </span>
                {!isOnline && (
                  <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full animate-pulse">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Conversor rápido de coleções e decks para importação na LigaMagic &amp; Liga Mestre
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Force Refresh / Cache Purge button */}
            <button
              onClick={handleForceRefresh}
              title="Limpar cache e recarregar a versão mais recente"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Recarregar</span>
            </button>

            {/* View Standalone Vanilla Source code button */}
            <button
              onClick={onOpenSourceModal}
              title="Ver e descarregar código fonte Vanilla PWA (index.html, manifest.json, service-worker.js)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg transition"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Código Fonte</span> PWA
            </button>

            {/* Install button for Chromium / Desktop / Android */}
            {isInstallable && !isInstalled && (
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-lg shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition transform active:scale-95 cursor-pointer"
              >
                {installSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Instalado!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Instalar App</span>
                  </>
                )}
              </button>
            )}

            {/* iOS Safari Install Button */}
            {isIOS && !isInstalled && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Instalar no iOS</span>
              </button>
            )}

            {/* Installed Badge */}
            {isInstalled && (
              <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-lg">
                <Check className="w-3.5 h-3.5" /> App Instalada
              </span>
            )}
          </div>
        </div>
      </header>

      {/* iOS Install Instruction Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Instalar no iPhone / iPad</h3>
                <p className="text-xs text-slate-400">Como adicionar à tela de início</p>
              </div>
            </div>

            <ol className="space-y-3 text-sm text-slate-300 my-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Toque no botão <strong>Compartilhar</strong> (ícone de quadrado com seta para cima) na barra do Safari.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>Confirme em <strong>Adicionar</strong> no canto superior direito.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium text-slate-200 transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
