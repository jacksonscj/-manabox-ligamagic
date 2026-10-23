import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDelimitedLine,
  cleanCardName,
  cleanCollectorNumber,
  processCollectorNumber,
  convertManaBoxToLigaMagic,
  formatCardForLigaMagic,
  SAMPLE_MANABOX_CSV,
  SAMPLE_MANABOX_TEXT
} from '../src/utils/converter.ts';

test('parseDelimitedLine handles quotes and commas inside card names', () => {
  const line = '"Commander","Jace, the Mind Sculptor","2xm","Double Masters","383","normal","mythic","1"';
  const parsed = parseDelimitedLine(line, ',');
  assert.equal(parsed[1], 'Jace, the Mind Sculptor');
  assert.equal(parsed[2], '2xm');
  assert.equal(parsed[4], '383');
});

test('processCollectorNumber strips letters like 18a -> 18 for LigaMagic', () => {
  assert.equal(cleanCollectorNumber('#60'), '60');
  assert.equal(cleanCollectorNumber('# 263'), '263');
  assert.equal(cleanCollectorNumber('No. 12'), '12');
  
  // Specific LigaMagic fix for "18a", "35b", "12★"
  assert.equal(cleanCollectorNumber('18a', 'digits_only'), '18');
  assert.equal(cleanCollectorNumber('350b', 'digits_only'), '350');
  assert.equal(cleanCollectorNumber('18a', 'omit_if_has_letters'), '');
  assert.equal(cleanCollectorNumber('18a', 'raw'), '18a');
});

test('convertManaBoxToLigaMagic fixes High Tide (FEM) 18a error', () => {
  const rawInput = '1 High Tide (FEM) 18a';
  
  // Test default digits_only handling
  const resultDigits = convertManaBoxToLigaMagic(rawInput, {
    format: 'priority',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  assert.equal(resultDigits.formattedText, '1 High Tide (FEM) 18');
  assert.equal(resultDigits.correctedLettersCount, 1);
  assert.equal(resultDigits.correctedCards[0].originalNumber, '18a');
  assert.equal(resultDigits.correctedCards[0].correctedNumber, '18');

  // Test omit_if_has_letters handling
  const resultOmit = convertManaBoxToLigaMagic(rawInput, {
    format: 'priority',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'omit_if_has_letters',
  });

  assert.equal(resultOmit.formattedText, '1 High Tide (FEM)');
});

test('convertManaBoxToLigaMagic maps TLA (Avatar) to TLE for LigaMagic', () => {
  const rawInput = `1 Fire Lord Azula (TLA) 220
1 Ozai, the Phoenix King (TLA) 235
1 Azula, Cunning Usurper (TLA) 208`;

  const result = convertManaBoxToLigaMagic(rawInput, {
    format: 'priority',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
    mapSetCodesToLigaMagic: true,
  });

  const lines = result.formattedText.split('\n');
  assert.equal(lines[0], '1 Fire Lord Azula (TLE) 220');
  assert.equal(lines[1], '1 Ozai, the Phoenix King (TLE) 235');
  assert.equal(lines[2], '1 Azula, Cunning Usurper (TLE) 208');
  assert.equal(result.mappedSetsCount, 1);
  assert.equal(result.mappedSets[0].originalSet, 'TLA');
  assert.equal(result.mappedSets[0].mappedSet, 'TLE');
});

test('convertManaBoxToLigaMagic priority format from ManaBox CSV', () => {
  const result = convertManaBoxToLigaMagic(SAMPLE_MANABOX_CSV, {
    format: 'priority',
    consolidateDuplicates: true,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  assert.equal(result.cards.length, 10);
  assert.equal(result.totalCardsCount, 21); // 4+4+4+1+1+1+1+1+1+3 = 21 cards
  
  // Verify Lightning Bolt format
  const lines = result.formattedText.split('\n');
  assert.equal(lines[0], '4 Lightning Bolt (2X2) 60');
  assert.equal(lines[1], '4 Monastery Swiftspear (IMA) 140');
  assert.equal(lines[3], '1 Sol Ring (C21) 263');
  assert.equal(lines[6], '1 Wear // Tear (DGM) 135');
  assert.equal(lines[7], '1 High Tide (FEM) 18'); // Corrected 18a -> 18!
});

test('convertManaBoxToLigaMagic brackets format', () => {
  const result = convertManaBoxToLigaMagic(SAMPLE_MANABOX_CSV, {
    format: 'brackets_set',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  const lines = result.formattedText.split('\n');
  assert.equal(lines[0], '4 Lightning Bolt [2X2]');
  assert.equal(lines[3], '1 Sol Ring [C21]');
});

test('convertManaBoxToLigaMagic prefixed brackets format', () => {
  const result = convertManaBoxToLigaMagic('1 Sol Ring (C21) 263', {
    format: 'prefixed_set',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  assert.equal(result.formattedText, '1 [C21] Sol Ring');
});

test('convertManaBoxToLigaMagic simple name format', () => {
  const result = convertManaBoxToLigaMagic('4 Lightning Bolt (2X2) 60', {
    format: 'simple_name',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  assert.equal(result.formattedText, '4 Lightning Bolt');
});

test('convertManaBoxToLigaMagic handles text export with foil and hash symbols', () => {
  const rawText = `4x Lightning Bolt (2x2) #60
1x Sol Ring [c21] #263 *F*
1 Demonic Tutor (uma) 93`;

  const result = convertManaBoxToLigaMagic(rawText, {
    format: 'priority',
    consolidateDuplicates: false,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  const lines = result.formattedText.split('\n');
  assert.equal(lines[0], '4 Lightning Bolt (2X2) 60');
  assert.equal(lines[1], '1 Sol Ring (C21) 263');
  assert.equal(lines[2], '1 Demonic Tutor (UMA) 93');
});

test('duplicate consolidation sums quantities', () => {
  const raw = `2 Lightning Bolt (2X2) 60
2 Lightning Bolt (2X2) 60`;

  const result = convertManaBoxToLigaMagic(raw, {
    format: 'priority',
    consolidateDuplicates: true,
    cleanSplitCardNames: false,
    cleanFoilTags: true,
    skipBasicLandsNumber: false,
    collectorNumberHandling: 'digits_only',
  });

  assert.equal(result.cards.length, 1);
  assert.equal(result.cards[0].quantity, 4);
  assert.equal(result.formattedText, '4 Lightning Bolt (2X2) 60');
});
