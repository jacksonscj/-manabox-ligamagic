import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, Code2, Globe } from 'lucide-react';

interface PWAExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAExportModal: React.FC<PWAExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'index' | 'manifest' | 'sw'>('index');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const manifestContent = `{
  "id": "/",
  "name": "ManaBox para LigaMagic - Conversor PWA",
  "short_name": "Mana2Liga",
  "description": "Converta exportações do ManaBox para o formato exato de importação da LigaMagic e Liga Mestre.",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#0f172a",
  "background_color": "#0f172a",
  "categories": ["utilities", "games", "productivity"],
  "icons": [
    {
      "src": "/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/pwa-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}`;

  const serviceWorkerContent = `/**
 * Service Worker para ManaBox para LigaMagic PWA
 * Suporte completo offline e cache de assets
 */
const CACHE_NAME = 'manabox-ligamagic-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
      return cached || network;
    })
  );
});`;

  const vanillaIndexHtml = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ManaBox para LigaMagic - PWA</title>
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#0f172a" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8">
  <div class="max-w-5xl mx-auto space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-white">ManaBox → LigaMagic</h1>
        <p class="text-xs text-slate-400">Conversor PWA offline de cartas para LigaMagic</p>
      </div>
      <div id="pwa-status" class="text-xs px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
        PWA Pronto
      </div>
    </header>

    <!-- Opções -->
    <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
      <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Formato LigaMagic</label>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <label class="flex items-center gap-2 p-3 bg-slate-950 border border-amber-500 rounded-lg cursor-pointer">
          <input type="radio" name="format" value="priority" checked class="text-amber-500">
          <span class="text-xs font-bold text-amber-400">1. (EDICAO) NUMERO</span>
        </label>
        <label class="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
          <input type="radio" name="format" value="brackets" class="text-indigo-500">
          <span class="text-xs font-bold text-indigo-300">2. [EDICAO]</span>
        </label>
        <label class="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
          <input type="radio" name="format" value="prefixed" class="text-sky-500">
          <span class="text-xs font-bold text-sky-300">3. [EDICAO] Nome</span>
        </label>
        <label class="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer">
          <input type="radio" name="format" value="simple" class="text-purple-500">
          <span class="text-xs font-bold text-purple-300">4. Apenas Nome</span>
        </label>
      </div>
      <label class="flex items-center gap-2 text-xs text-slate-300 pt-2 cursor-pointer">
        <input type="checkbox" id="consolidate" checked class="rounded">
        <span>Consolidar e somar cartas repetidas da mesma edição/número</span>
      </label>
    </div>

    <!-- Conversor Input e Output -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold">1. Entrada (ManaBox CSV / Texto)</h2>
          <button id="load-sample" class="text-xs text-amber-400 underline">Carregar Exemplo</button>
        </div>
        <textarea id="input-text" rows="14" class="w-full bg-slate-950 p-3 rounded-lg font-mono text-xs border border-slate-800 focus:outline-none" placeholder="Cole aqui o CSV ou lista exportada do ManaBox..."></textarea>
      </div>

      <div class="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
        <div class="flex justify-between items-center">
          <h2 class="text-sm font-semibold">2. Saída LigaMagic</h2>
          <span id="card-counter" class="text-xs font-bold text-amber-400">Total: 0 cartas</span>
        </div>
        <textarea id="output-text" readonly rows="14" class="w-full bg-slate-950 p-3 rounded-lg font-mono text-xs border border-slate-800 text-emerald-400 focus:outline-none"></textarea>
        <button id="copy-btn" class="w-full py-3 bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 rounded-lg text-sm transition">
          Copiar para a Área de Transferência
        </button>
      </div>
    </div>
  </div>

  <script>
    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js');
    }

    const inputArea = document.getElementById('input-text');
    const outputArea = document.getElementById('output-text');
    const counter = document.getElementById('card-counter');
    const copyBtn = document.getElementById('copy-btn');
    const sampleBtn = document.getElementById('load-sample');
    const consolidateBox = document.getElementById('consolidate');

    function parseCSVLine(line) {
      const res = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQ && line[i+1] === '"') { cur += '"'; i++; }
          else { inQ = !inQ; }
        } else if (c === ',' && !inQ) {
          res.push(cur.trim()); cur = '';
        } else {
          cur += c;
        }
      }
      res.push(cur.trim());
      return res;
    }

    const SET_MAP = {
      'TLA': 'TLE',
      'TLAC': 'TLE',
      'ATLA': 'TLE',
      'PLIST': 'PLST',
      'FMB1': 'MB1',
      'J20': 'JMP',
      'J25': 'FDNJ25'
    };

    function normalizeSet(code) {
      if (!code) return '';
      const upper = code.toUpperCase().trim();
      return SET_MAP[upper] || upper;
    }

    function convert() {
      const raw = inputArea.value.trim();
      if (!raw) { outputArea.value = ''; counter.textContent = 'Total: 0 cartas'; return; }
      
      const lines = raw.split(/\\r?\\n/).map(l => l.trim()).filter(Boolean);
      const isCsv = /card\\s*name|set\\s*code|quantity/i.test(lines[0]);
      const format = document.querySelector('input[name="format"]:checked').value;
      const consolidate = consolidateBox.checked;

      let cards = [];
      if (isCsv) {
        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const nIdx = headers.findIndex(h => h.includes('name'));
        const sIdx = headers.findIndex(h => h.includes('set'));
        const numIdx = headers.findIndex(h => h.includes('number') || h.includes('collector'));
        const qIdx = headers.findIndex(h => ['quantity', 'qty', 'count'].includes(h));

        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[nIdx] || '';
          if (!name) continue;
          const set = normalizeSet(cols[sIdx] || '');
          // Remove letras para evitar erro na LigaMagic (ex: 18a -> 18)
          const num = (cols[numIdx] || '').replace(/^[#№]\\s*/, '').replace(/\\D/g, '').trim();
          const qty = parseInt(cols[qIdx], 10) || 1;
          cards.push({ name, set, num, qty });
        }
      } else {
        lines.forEach(l => {
          const m = l.match(/^(\\d+)[xX]?\\s+(.+?)\\s+[\\(\\[]([A-Za-z0-9_-]+)[\\)\\]]\\s*[#№]?([A-Za-z0-9★\\.-]*)/);
          if (m) {
            // Remove letras para compatibilidade com LigaMagic (ex: 18a -> 18)
            const cleanNum = (m[4]||'').replace(/\\D/g, '').trim();
            const set = normalizeSet(m[3] || '');
            cards.push({ qty: parseInt(m[1], 10) || 1, name: m[2].trim(), set, num: cleanNum });
          } else {
            const m2 = l.match(/^(\\d+)[xX]?\\s+(.+)$/);
            if (m2) cards.push({ qty: parseInt(m2[1], 10) || 1, name: m2[2].trim(), set: '', num: '' });
          }
        });
      }

      if (consolidate) {
        const map = new Map();
        cards.forEach(c => {
          const key = (c.name + '|||' + c.set + '|||' + c.num).toLowerCase();
          if (map.has(key)) map.get(key).qty += c.qty;
          else map.set(key, { ...c });
        });
        cards = Array.from(map.values());
      }

      let total = 0;
      const formatted = cards.map(c => {
        total += c.qty;
        if (format === 'priority') {
          return c.set && c.num ? \`\${c.qty} \${c.name} (\${c.set}) \${c.num}\` : (c.set ? \`\${c.qty} \${c.name} (\${c.set})\` : \`\${c.qty} \${c.name}\`);
        }
        if (format === 'brackets') return c.set ? \`\${c.qty} \${c.name} [\${c.set}]\` : \`\${c.qty} \${c.name}\`;
        if (format === 'prefixed') return c.set ? \`\${c.qty} [\${c.set}] \${c.name}\` : \`\${c.qty} \${c.name}\`;
        return \`\${c.qty} \${c.name}\`;
      });

      outputArea.value = formatted.join('\\n');
      counter.textContent = \`Total: \${total} cartas (\${cards.length} únicas)\`;
    }

    inputArea.addEventListener('input', convert);
    consolidateBox.addEventListener('change', convert);
    document.querySelectorAll('input[name="format"]').forEach(r => r.addEventListener('change', convert));

    sampleBtn.addEventListener('click', () => {
      inputArea.value = \`"Card Name","Set Code","Collector Number","Quantity"\\n"Lightning Bolt","2x2","60","4"\\n"Sol Ring","c21","263","1"\\n"Demonic Tutor","uma","93","1"\`;
      convert();
    });

    copyBtn.addEventListener('click', () => {
      if (!outputArea.value) return;
      navigator.clipboard.writeText(outputArea.value).then(() => {
        copyBtn.textContent = 'Copiado!';
        setTimeout(() => copyBtn.textContent = 'Copiar para a Área de Transferência', 2000);
      });
    });
  </script>
</body>
</html>`;

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'manifest':
        return manifestContent;
      case 'sw':
        return serviceWorkerContent;
      case 'index':
      default:
        return vanillaIndexHtml;
    }
  };

  const getCurrentFilename = () => {
    switch (activeTab) {
      case 'manifest':
        return 'manifest.json';
      case 'sw':
        return 'service-worker.js';
      case 'index':
      default:
        return 'index.html';
    }
  };

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCurrent = () => {
    const content = getCurrentContent();
    const filename = getCurrentFilename();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Código Fonte Completo da PWA</h3>
              <p className="text-xs text-slate-400">Arquivos prontos para executar em qualquer servidor estático ou hospedar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-slate-950 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('index')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'index'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              index.html
            </button>
            <button
              onClick={() => setActiveTab('manifest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'manifest'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              manifest.json
            </button>
            <button
              onClick={() => setActiveTab('sw')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'sw'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              service-worker.js
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={handleDownloadCurrent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar {getCurrentFilename()}</span>
            </button>
          </div>
        </div>

        {/* Code View Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {getCurrentContent()}
          </pre>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>Totalmente autossuficiente: não requer Node.js nem build para rodar a versão estática.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
