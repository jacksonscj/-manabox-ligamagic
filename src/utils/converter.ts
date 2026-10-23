/**
 * ManaBox to LigaMagic / Liga Mestre Card Converter Engine
 * Handles CSV, TSV, Semicolon-delimited, and Plain Text exports from ManaBox.
 */

export type OutputFormat =
  | 'priority'       // 2 Lightning Bolt (2X2) 60  <- Formato prioritário LigaMagic
  | 'brackets_set'   // 2 Lightning Bolt [2X2]
  | 'prefixed_set'   // 2 [2X2] Lightning Bolt
  | 'simple_name';   // 2 Lightning Bolt

export type CollectorNumberHandling =
  | 'digits_only'          // 18a -> 18 (Padrão e Recomendado: LigaMagic só aceita números)
  | 'omit_if_has_letters'  // 18a -> omitir número e usar apenas edição: 1 High Tide (FEM)
  | 'raw';                 // manter exatamente 18a

export interface MappedSetInfo {
  cardName: string;
  originalSet: string;
  mappedSet: string;
}

export interface ConverterOptions {
  format: OutputFormat;
  consolidateDuplicates: boolean; // Soma cartas repetidas da mesma edição/número
  cleanSplitCardNames: boolean;   // Limpa split cards ou mantém 'Fire // Ice'
  cleanFoilTags: boolean;         // Remove tags como *F*, (Foil), etc.
  skipBasicLandsNumber: boolean;  // Opcional para manter ou simplificar terrenos básicos
  collectorNumberHandling: CollectorNumberHandling; // Tratamento de letras em números (ex: 18a)
  mapSetCodesToLigaMagic: boolean; // Mapeia códigos de edição internacionais para a sigla exata da LigaMagic (ex: TLA -> TLE)
}

export interface ParsedCard {
  id: string;
  quantity: number;
  name: string;
  setCode: string;
  originalSetCode?: string;
  wasSetMapped?: boolean;
  collectorNumber: string;
  originalCollectorNumber?: string;
  hadLetterInNumber?: boolean;
  rawLine?: string;
  isFoil?: boolean;
  condition?: string;
  language?: string;
  warning?: string;
}

export interface CorrectedCardInfo {
  name: string;
  setCode: string;
  originalNumber: string;
  correctedNumber: string;
}

export interface ConversionResult {
  formattedText: string;
  cards: ParsedCard[];
  totalCardsCount: number; // Soma de todas as quantidades
  uniqueCardsCount: number; // Quantidade de linhas/cartas distintas
  uniqueSetsCount: number; // Quantidade de edições diferentes
  warningsCount: number;
  correctedLettersCount: number; // Quantidade de cartas que tinham letras no número (ex: 18a)
  correctedCards: CorrectedCardInfo[];
  mappedSetsCount: number; // Quantidade de edições traduzidas do padrão Scryfall/ManaBox para LigaMagic
  mappedSets: MappedSetInfo[];
  unrecognizedLines: string[];
}

/**
 * Mapping dictionary from Scryfall / ManaBox set codes to LigaMagic official set codes.
 * Ensures cards like Avatar (TLA -> TLE) receive the correct edition icon and prices on LigaMagic.
 */
export const MANABOX_TO_LIGAMAGIC_SET_MAP: Record<string, string> = {
  // Avatar: The Last Airbender (ManaBox exports TLA, LigaMagic is TLE)
  'TLA': 'TLE',
  'TLAC': 'TLE',
  'ATLA': 'TLE',
  
  // The List
  'PLIST': 'PLST',
  
  // Mystery Booster
  'FMB1': 'MB1',
  'MB1': 'MB1',
  
  // Jumpstart
  'J20': 'JMP',
  'J25': 'FDNJ25',
  
  // Masterpieces / Special Series
  'MPS_AKH': 'MS3',
  'MPS_KLD': 'MS2',
  'MPS': 'MS2',
  'EXP': 'EXP',
  'BFZEXP': 'EXP',
};

/**
 * Normalizes set codes to ensure 100% recognition by LigaMagic.
 */
export function normalizeSetCodeForLigaMagic(
  rawCode: string,
  mapToLigaMagic: boolean = true
): { setCode: string; originalSetCode: string; wasMapped: boolean } {
  if (!rawCode) return { setCode: '', originalSetCode: '', wasMapped: false };
  const original = rawCode.trim().toUpperCase();
  if (!mapToLigaMagic) {
    return { setCode: original, originalSetCode: original, wasMapped: false };
  }
  const mapped = MANABOX_TO_LIGAMAGIC_SET_MAP[original];
  if (mapped && mapped !== original) {
    return { setCode: mapped, originalSetCode: original, wasMapped: true };
  }
  return { setCode: original, originalSetCode: original, wasMapped: false };
}

/**
 * Robust RFC 4180 compliant CSV line parser.
 * Correctly handles quotes, commas inside card names (e.g. "Jace, the Mind Sculptor"),
 * escaped quotes (""), and varied delimiters.
 */
export function parseDelimitedLine(line: string, delimiter: string = ','): string[] {
  const values: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped double quote
        currentVal += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (!inQuotes && char === delimiter) {
      values.push(currentVal.trim());
      currentVal = '';
      i++;
      continue;
    }

    currentVal += char;
    i++;
  }

  values.push(currentVal.trim());
  return values;
}

/**
 * Autodetects whether the delimiter is comma, semicolon or tab.
 */
export function detectDelimiter(headerLine: string): string {
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

/**
 * Cleans card names from common export artifacts.
 */
export function cleanCardName(name: string, cleanSplit: boolean = false): string {
  let cleaned = name.trim();

  // Remove surrounding quotes if any remain
  cleaned = cleaned.replace(/^["']+|["']+$/g, '');

  // Strip trailing foil/rarity tags like *F*, (Foil), [Foil], (Borderless), etc. if mixed in name
  cleaned = cleaned.replace(/\s*[\(\[\*](foil|etched|showcase|extended art|borderless|retro frame)[\)\]\*]/gi, '');

  if (cleanSplit) {
    // If user desires only first part of split cards "Wear // Tear" -> "Wear"
    if (cleaned.includes(' // ')) {
      cleaned = cleaned.split(' // ')[0].trim();
    }
  }

  return cleaned.trim();
}

/**
 * Processes collector numbers according to LigaMagic compatibility rules.
 * LigaMagic's deck importer strictly requires collector numbers to be digits only (e.g. "18" instead of "18a").
 * Suffix letters like "a", "b", "★" trigger syntax errors in LigaMagic.
 */
export function processCollectorNumber(
  num: string,
  handling: CollectorNumberHandling = 'digits_only'
): { cleaned: string; raw: string; hadLetters: boolean } {
  if (!num) return { cleaned: '', raw: '', hadLetters: false };
  let raw = num.trim();
  raw = raw.replace(/^[#№]\s*/, '');
  raw = raw.replace(/^no\.\s*/i, '');

  // Detect if there are letters or special characters (like 18a, 35b, ★, etc.)
  const hadLetters = /[a-zA-Z★†\/\._-]/.test(raw);

  let cleaned = raw;
  if (handling === 'digits_only') {
    // LigaMagic requirement: digits only (e.g. 18a -> 18, 35b -> 35, 12★ -> 12)
    const digitsOnly = raw.replace(/\D/g, '');
    cleaned = digitsOnly;
  } else if (handling === 'omit_if_has_letters') {
    if (hadLetters) {
      cleaned = '';
    }
  } else {
    cleaned = raw;
  }

  return { cleaned, raw, hadLetters };
}

export function cleanCollectorNumber(
  num: string,
  handling: CollectorNumberHandling = 'digits_only'
): string {
  return processCollectorNumber(num, handling).cleaned;
}

/**
 * Parses raw input from ManaBox (CSV or Text) and formats it for LigaMagic.
 */
export function convertManaBoxToLigaMagic(
  rawInput: string,
  options: ConverterOptions
): ConversionResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      formattedText: '',
      cards: [],
      totalCardsCount: 0,
      uniqueCardsCount: 0,
      uniqueSetsCount: 0,
      warningsCount: 0,
      correctedLettersCount: 0,
      correctedCards: [],
      mappedSetsCount: 0,
      mappedSets: [],
      unrecognizedLines: [],
    };
  }

  const lines = rawInput.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return {
      formattedText: '',
      cards: [],
      totalCardsCount: 0,
      uniqueCardsCount: 0,
      uniqueSetsCount: 0,
      warningsCount: 0,
      correctedLettersCount: 0,
      correctedCards: [],
      mappedSetsCount: 0,
      mappedSets: [],
      unrecognizedLines: [],
    };
  }

  // Determine if input is CSV/TSV or plain text
  const firstLine = lines[0];
  const isLikelyCsvHeader =
    /card\s*name|set\s*code|collector\s*number|quantity|binder\s*name|rarity|condition/i.test(firstLine);

  const parsedCards: ParsedCard[] = [];
  const unrecognizedLines: string[] = [];

  if (isLikelyCsvHeader) {
    const delimiter = detectDelimiter(firstLine);
    const rawHeaders = parseDelimitedLine(firstLine, delimiter).map((h) =>
      h.toLowerCase().replace(/[^a-z0-9]/g, '')
    );

    // Map column indices
    let nameIdx = rawHeaders.findIndex((h) =>
      ['cardname', 'name', 'card'].includes(h)
    );
    let setIdx = rawHeaders.findIndex((h) =>
      ['setcode', 'set', 'edition', 'expansion'].includes(h)
    );
    let numberIdx = rawHeaders.findIndex((h) =>
      ['collectornumber', 'number', 'collector', 'cardnumber', 'cn'].includes(h)
    );
    let qtyIdx = rawHeaders.findIndex((h) =>
      ['quantity', 'qty', 'count', 'qtd', 'amount'].includes(h)
    );
    let foilIdx = rawHeaders.findIndex((h) => ['foil', 'isfoil'].includes(h));
    let condIdx = rawHeaders.findIndex((h) => ['condition', 'cond'].includes(h));
    let langIdx = rawHeaders.findIndex((h) => ['language', 'lang'].includes(h));

    // Fallbacks if header labels were slightly different
    if (nameIdx === -1) {
      nameIdx = rawHeaders.findIndex((h) => h.includes('name'));
    }
    if (setIdx === -1) {
      setIdx = rawHeaders.findIndex((h) => h.includes('set') && !h.includes('name'));
    }
    if (numberIdx === -1) {
      numberIdx = rawHeaders.findIndex((h) => h.includes('number') || h.includes('collector'));
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const cols = parseDelimitedLine(line, delimiter);
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      const rawName = nameIdx !== -1 && cols[nameIdx] ? cols[nameIdx] : '';
      if (!rawName) {
        unrecognizedLines.push(line);
        continue;
      }

      const cardName = cleanCardName(rawName, options.cleanSplitCardNames);
      const rawSet = (setIdx !== -1 && cols[setIdx] ? cols[setIdx] : '').trim().toUpperCase();
      const { setCode, originalSetCode, wasMapped: wasSetMapped } = normalizeSetCodeForLigaMagic(
        rawSet,
        options.mapSetCodesToLigaMagic
      );
      const rawNum = numberIdx !== -1 && cols[numberIdx] ? cols[numberIdx] : '';
      const { cleaned: collectorNumber, raw: originalCollectorNumber, hadLetters } = processCollectorNumber(
        rawNum,
        options.collectorNumberHandling
      );
      
      let quantity = 1;
      if (qtyIdx !== -1 && cols[qtyIdx]) {
        const parsedQty = parseInt(cols[qtyIdx].replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsedQty) && parsedQty > 0) {
          quantity = parsedQty;
        }
      }

      const isFoil = foilIdx !== -1 && cols[foilIdx] ? /foil|true|yes|1|etched/i.test(cols[foilIdx]) : false;
      const condition = condIdx !== -1 && cols[condIdx] ? cols[condIdx] : undefined;
      const language = langIdx !== -1 && cols[langIdx] ? cols[langIdx] : undefined;

      let warning: string | undefined;
      if (!setCode) {
        warning = 'Sem código de edição';
      } else if (!collectorNumber && options.format === 'priority') {
        warning = 'Sem número de colecionador (usará fallback)';
      } else if (hadLetters && originalCollectorNumber !== collectorNumber) {
        warning = `Nº de colecionador corrigido: "${originalCollectorNumber}" → "${collectorNumber}" (LigaMagic exige apenas números)`;
      }

      parsedCards.push({
        id: `csv-${i}-${cardName}-${setCode}-${collectorNumber}`,
        quantity,
        name: cardName,
        setCode,
        originalSetCode,
        wasSetMapped,
        collectorNumber,
        originalCollectorNumber,
        hadLetterInNumber: hadLetters,
        rawLine: line,
        isFoil,
        condition,
        language,
        warning,
      });
    }
  } else {
    // Parse text-based export or line-by-line format
    // Examples:
    // "2 Lightning Bolt (2X2) 60"
    // "1 High Tide (FEM) 18a"
    // "1 Fire Lord Azula (TLA) 220"
    // "1x Sol Ring [C21] #263"
    // "4 Counterspell (EMA) 43 *F*"
    // "1 Black Lotus [LEA]"
    // "3 Dark Ritual"
    lines.forEach((line, idx) => {
      // Ignore comment lines or header-like leftovers
      if (line.startsWith('//') || line.startsWith('#') || line.toLowerCase().startsWith('sideboard')) {
        return;
      }

      // Regex 1: Full format with parentheses or brackets and collector number
      // e.g.: "2 Lightning Bolt (2X2) 60" or "1 High Tide (FEM) 18a" or "1 Fire Lord Azula (TLA) 220"
      const regexWithNumber = /^(\d+)[xX]?\s+(.+?)\s+[\(\[]([A-Za-z0-9_-]+)[\)\]]\s+[#№]?([A-Za-z0-9★\.\/\-]+)(.*)$/;
      const matchWithNumber = line.match(regexWithNumber);

      if (matchWithNumber) {
        const qty = parseInt(matchWithNumber[1], 10) || 1;
        const name = cleanCardName(matchWithNumber[2], options.cleanSplitCardNames);
        const rawSet = matchWithNumber[3].trim().toUpperCase();
        const { setCode, originalSetCode, wasMapped: wasSetMapped } = normalizeSetCodeForLigaMagic(
          rawSet,
          options.mapSetCodesToLigaMagic
        );
        const rawNum = matchWithNumber[4];
        const { cleaned: collectorNumber, raw: originalCollectorNumber, hadLetters } = processCollectorNumber(
          rawNum,
          options.collectorNumberHandling
        );
        const trailing = matchWithNumber[5] || '';
        const isFoil = /\*F\*|foil|etched/i.test(trailing);

        let warning: string | undefined;
        if (hadLetters && originalCollectorNumber !== collectorNumber) {
          warning = `Nº de colecionador corrigido: "${originalCollectorNumber}" → "${collectorNumber}" (evita erro na LigaMagic)`;
        }

        parsedCards.push({
          id: `txt-${idx}-${name}-${setCode}-${collectorNumber}`,
          quantity: qty,
          name,
          setCode,
          originalSetCode,
          wasSetMapped,
          collectorNumber,
          originalCollectorNumber,
          hadLetterInNumber: hadLetters,
          rawLine: line,
          isFoil,
          warning,
        });
        return;
      }

      // Regex 2: Format with Edition only, no collector number
      // e.g.: "2 Lightning Bolt (2X2)" or "1 Sol Ring [C21]"
      const regexSetOnly = /^(\d+)[xX]?\s+(.+?)\s+[\(\[]([A-Za-z0-9_-]+)[\)\]](.*)$/;
      const matchSetOnly = line.match(regexSetOnly);

      if (matchSetOnly) {
        const qty = parseInt(matchSetOnly[1], 10) || 1;
        const name = cleanCardName(matchSetOnly[2], options.cleanSplitCardNames);
        const rawSet = matchSetOnly[3].trim().toUpperCase();
        const { setCode, originalSetCode, wasMapped: wasSetMapped } = normalizeSetCodeForLigaMagic(
          rawSet,
          options.mapSetCodesToLigaMagic
        );
        const trailing = matchSetOnly[4] || '';
        const isFoil = /\*F\*|foil|etched/i.test(trailing);

        parsedCards.push({
          id: `txt-${idx}-${name}-${setCode}`,
          quantity: qty,
          name,
          setCode,
          originalSetCode,
          wasSetMapped,
          collectorNumber: '',
          rawLine: line,
          isFoil,
          warning: options.format === 'priority' ? 'Sem número de colecionador' : undefined,
        });
        return;
      }

      // Regex 3: Prefixed edition e.g. "2 [2X2] Lightning Bolt" or "1 (DOM) Opt"
      const regexPrefixed = /^(\d+)[xX]?\s+[\(\[]([A-Za-z0-9_-]+)[\)\]]\s+(.+)$/;
      const matchPrefixed = line.match(regexPrefixed);

      if (matchPrefixed) {
        const qty = parseInt(matchPrefixed[1], 10) || 1;
        const rawSet = matchPrefixed[2].trim().toUpperCase();
        const { setCode, originalSetCode, wasMapped: wasSetMapped } = normalizeSetCodeForLigaMagic(
          rawSet,
          options.mapSetCodesToLigaMagic
        );
        const name = cleanCardName(matchPrefixed[3], options.cleanSplitCardNames);

        parsedCards.push({
          id: `txt-${idx}-${name}-${setCode}`,
          quantity: qty,
          name,
          setCode,
          originalSetCode,
          wasSetMapped,
          collectorNumber: '',
          rawLine: line,
        });
        return;
      }

      // Regex 4: Plain name with quantity e.g. "4 Lightning Bolt" or "1x Black Lotus"
      const regexSimpleQty = /^(\d+)[xX]?\s+(.+)$/;
      const matchSimpleQty = line.match(regexSimpleQty);

      if (matchSimpleQty) {
        const qty = parseInt(matchSimpleQty[1], 10) || 1;
        const name = cleanCardName(matchSimpleQty[2], options.cleanSplitCardNames);

        parsedCards.push({
          id: `txt-${idx}-${name}`,
          quantity: qty,
          name,
          setCode: '',
          collectorNumber: '',
          rawLine: line,
          warning: 'Sem edição especificada',
        });
        return;
      }

      // If line is just a card name without quantity (default 1)
      if (line.length > 1 && !line.includes('---')) {
        const name = cleanCardName(line, options.cleanSplitCardNames);
        parsedCards.push({
          id: `txt-${idx}-${name}`,
          quantity: 1,
          name,
          setCode: '',
          collectorNumber: '',
          rawLine: line,
          warning: 'Sem quantidade nem edição (assumido 1x)',
        });
        return;
      }

      unrecognizedLines.push(line);
    });
  }

  // Handle duplicate consolidation if enabled
  let finalCards = parsedCards;
  if (options.consolidateDuplicates) {
    const cardMap = new Map<string, ParsedCard>();

    for (const card of parsedCards) {
      // Key based on Name + Set + CollectorNumber
      const key = `${card.name.toLowerCase()}|||${card.setCode.toLowerCase()}|||${card.collectorNumber.toLowerCase()}`;
      if (cardMap.has(key)) {
        const existing = cardMap.get(key)!;
        existing.quantity += card.quantity;
      } else {
        cardMap.set(key, { ...card });
      }
    }

    finalCards = Array.from(cardMap.values());
  }

  // Format into LigaMagic output format
  const formattedLines: string[] = [];
  const setCodesSet = new Set<string>();
  const correctedCards: CorrectedCardInfo[] = [];
  const mappedSets: MappedSetInfo[] = [];
  let totalCardsCount = 0;
  let warningsCount = 0;

  for (const card of finalCards) {
    totalCardsCount += card.quantity;
    if (card.setCode) setCodesSet.add(card.setCode);
    if (card.warning) warningsCount++;

    if (
      card.originalCollectorNumber &&
      card.originalCollectorNumber !== card.collectorNumber &&
      card.hadLetterInNumber
    ) {
      correctedCards.push({
        name: card.name,
        setCode: card.setCode,
        originalNumber: card.originalCollectorNumber,
        correctedNumber: card.collectorNumber || '(sem número)',
      });
    }

    if (card.wasSetMapped && card.originalSetCode && card.originalSetCode !== card.setCode) {
      if (!mappedSets.some((m) => m.originalSet === card.originalSetCode && m.mappedSet === card.setCode)) {
        mappedSets.push({
          cardName: card.name,
          originalSet: card.originalSetCode,
          mappedSet: card.setCode,
        });
      }
    }

    const line = formatCardForLigaMagic(card, options.format);
    formattedLines.push(line);
  }

  return {
    formattedText: formattedLines.join('\n'),
    cards: finalCards,
    totalCardsCount,
    uniqueCardsCount: finalCards.length,
    uniqueSetsCount: setCodesSet.size,
    warningsCount,
    correctedLettersCount: correctedCards.length,
    correctedCards,
    mappedSetsCount: mappedSets.length,
    mappedSets,
    unrecognizedLines,
  };
}

/**
 * Formats a single parsed card into one of the four LigaMagic accepted formats.
 */
export function formatCardForLigaMagic(card: ParsedCard, format: OutputFormat): string {
  const qty = card.quantity > 0 ? card.quantity : 1;
  const name = card.name.trim();
  const set = card.setCode ? card.setCode.toUpperCase() : '';
  const num = card.collectorNumber ? card.collectorNumber.trim() : '';

  switch (format) {
    case 'priority':
      // LigaMagic Formato 2 prioritário: 2 Nome da Carta (EDICAO) NUMERO
      if (set && num) {
        return `${qty} ${name} (${set}) ${num}`;
      } else if (set) {
        return `${qty} ${name} (${set})`;
      } else {
        return `${qty} ${name}`;
      }

    case 'brackets_set':
      // LigaMagic Formato 3: 3 Nome da Carta [EDICAO]
      if (set) {
        return `${qty} ${name} [${set}]`;
      }
      return `${qty} ${name}`;

    case 'prefixed_set':
      // LigaMagic Formato 4: 4 [EDICAO] Nome da Carta
      if (set) {
        return `${qty} [${set}] ${name}`;
      }
      return `${qty} ${name}`;

    case 'simple_name':
    default:
      // LigaMagic Formato 1: 1 Nome da Carta
      return `${qty} ${name}`;
  }
}

/**
 * Realistic sample ManaBox CSV export data for demonstration.
 */
export const SAMPLE_MANABOX_CSV = `"Binder Name","Card Name","Set Code","Set Name","Collector Number","Foil","Rarity","Quantity","Mana Cost","Type","Purchase Price","Condition","Language"
"Modern Burn","Lightning Bolt","2x2","Double Masters 2022","60","normal","uncommon","4","{R}","Instant","1.20","NM","English"
"Modern Burn","Monastery Swiftspear","ima","Iconic Masters","140","foil","uncommon","4","{R}","Creature — Human Monk","0.90","NM","English"
"Modern Burn","Eidolon of the Great Revel","a25","Masters 25","128","normal","rare","4","{R}{R}","Enchantment Creature","8.50","NM","English"
"Commander Staples","Sol Ring","c21","Commander 2021","263","foil","uncommon","1","{1}","Artifact","2.00","NM","English"
"Commander Staples","Demonic Tutor","uma","Ultimate Masters","93","normal","rare","1","{1}{B}","Sorcery","38.00","NM","English"
"Commander Staples","Lim-Dûl's Vault","all","Alliances","192","normal","uncommon","1","{U}{B}","Instant","3.50","LP","English"
"Commander Staples","Wear // Tear","dgm","Dragon's Maze","135","normal","uncommon","1","{1}{R} // {W}","Instant","0.40","NM","English"
"Commander Staples","High Tide","fem","Fallen Empires","18a","normal","common","1","{U}","Instant","2.50","NM","English"
"Commander Staples","Cyclonic Rift","rtr","Return to Ravnica","35","normal","rare","1","{1}{U}","Instant","32.00","NM","English"
"Sideboard","Smash to Smithereens","ori","Magic Origins","163","normal","common","3","{1}{R}","Instant","0.20","NM","English"`;

/**
 * Realistic sample ManaBox text list.
 */
export const SAMPLE_MANABOX_TEXT = `4 Lightning Bolt (2x2) 60
4 Monastery Swiftspear (ima) 140 *F*
4 Eidolon of the Great Revel (a25) 128
1 High Tide (fem) 18a
1 Sol Ring [c21] #263
1 Demonic Tutor (uma) 93
1 Wear // Tear (dgm) 135
2 Command Tower (cmr) 350
1 Cyclonic Rift (rtr) 35
3 Smash to Smithereens (ori) 163`;
