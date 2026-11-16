import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  Eye,
  EyeOff,
  PenTool,
  Search,
  Volume2,
  X,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  Button,
  Page,
  Pill,
  ProgressBar,
  SegmentedControl,
  Surface,
  ui,
} from '../../src/components/ui';
import { KANA_CARDS, KanaCard, KanaKind, Script, WORD_CARDS } from '../../src/data/kana';
import { useLearning } from '../../src/context/LearningContext';
import { useTheme } from '../../src/context/ThemeContext';
import { useJapaneseSpeech } from '../../src/hooks/useJapaneseSpeech';
import { getMastery } from '../../src/lib/learning';
import { C, R, S } from '../../src/theme';

type GridCell = {
  card: KanaCard | null;
  romajiLabel: string;
};

type TableRow = {
  rowLabel: string;
  cells: GridCell[];
};

// Standard Gojuon structure: columns are A, I, U, E, O
const BASIC_ROWS: { label: string; group: string; sounds: (string | null)[] }[] = [
  { label: 'Vowels', group: 'vowels', sounds: ['a', 'i', 'u', 'e', 'o'] },
  { label: 'K row', group: 'k', sounds: ['ka', 'ki', 'ku', 'ke', 'ko'] },
  { label: 'S row', group: 's', sounds: ['sa', 'shi', 'su', 'se', 'so'] },
  { label: 'T row', group: 't', sounds: ['ta', 'chi', 'tsu', 'te', 'to'] },
  { label: 'N row', group: 'n', sounds: ['na', 'ni', 'nu', 'ne', 'no'] },
  { label: 'H row', group: 'h', sounds: ['ha', 'hi', 'fu', 'he', 'ho'] },
  { label: 'M row', group: 'm', sounds: ['ma', 'mi', 'mu', 'me', 'mo'] },
  { label: 'Y row', group: 'y', sounds: ['ya', null, 'yu', null, 'yo'] },
  { label: 'R row', group: 'r', sounds: ['ra', 'ri', 'ru', 're', 'ro'] },
  { label: 'W row', group: 'w', sounds: ['wa', null, null, null, 'wo'] },
  { label: 'N row', group: 'n-final', sounds: ['n', null, null, null, null] },
];

const DAKUTEN_ROWS: { label: string; sounds: string[] }[] = [
  { label: 'G row', sounds: ['ga', 'gi', 'gu', 'ge', 'go'] },
  { label: 'Z row', sounds: ['za', 'ji', 'zu', 'ze', 'zo'] },
  { label: 'D row', sounds: ['da', 'ji (di)', 'zu (du)', 'de', 'do'] },
  { label: 'B row', sounds: ['ba', 'bi', 'bu', 'be', 'bo'] },
  { label: 'P row', sounds: ['pa', 'pi', 'pu', 'pe', 'po'] },
];

const YOON_ROWS: { label: string; sounds: string[] }[] = [
  { label: 'K', sounds: ['kya', 'kyu', 'kyo'] },
  { label: 'S', sounds: ['sha', 'shu', 'sho'] },
  { label: 'C', sounds: ['cha', 'chu', 'cho'] },
  { label: 'N', sounds: ['nya', 'nyu', 'nyo'] },
  { label: 'H', sounds: ['hya', 'hyu', 'hyo'] },
  { label: 'M', sounds: ['mya', 'myu', 'myo'] },
  { label: 'R', sounds: ['rya', 'ryu', 'ryo'] },
  { label: 'G', sounds: ['gya', 'gyu', 'gyo'] },
  { label: 'J', sounds: ['ja', 'ju', 'jo'] },
  { label: 'B', sounds: ['bya', 'byu', 'byo'] },
  { label: 'P', sounds: ['pya', 'pyu', 'pyo'] },
];

export default function KanaChartScreen() {
  const { state, setPreferredScript } = useLearning();
  const { theme } = useTheme();
  const { speak: speakJapanese } = useJapaneseSpeech();
  const [script, setScript] = useState<Script>(state.preferredScript);
  const [kind, setKind] = useState<KanaKind>('basic');
  const [query, setQuery] = useState('');
  const [showRomaji, setShowRomaji] = useState(true);
  const [selected, setSelected] = useState<KanaCard | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'mastered' | 'learning'>('all');

  const changeScript = (next: Script) => {
    void Haptics.selectionAsync();
    setScript(next);
    setPreferredScript(next);
    setSelected(null);
  };

  const speak = (card: KanaCard) => {
    void Haptics.selectionAsync();
    void speakJapanese(card.character);
  };

  const scriptCards = useMemo(
    () => KANA_CARDS.filter((card) => card.script === script),
    [script]
  );

  const masteredCount = useMemo(() => {
    return scriptCards.filter(
      (card) => (getMastery(state, card.id, 'read')?.streak ?? 0) >= 3
    ).length;
  }, [scriptCards, state]);

  const exampleWords = useMemo(() => {
    if (!selected) return [];
    return WORD_CARDS.filter(
      (w) => w.script === selected.script && w.text.includes(selected.character)
    ).slice(0, 2);
  }, [selected]);

  // Build grid based on kind
  const tableRows: TableRow[] = useMemo(() => {
    const cards = scriptCards.filter((card) => card.kind === kind);
    const normalized = query.trim().toLowerCase();

    if (kind === 'basic') {
      return BASIC_ROWS.map((rowDef) => {
        const cells: GridCell[] = rowDef.sounds.map((sound) => {
          if (!sound) return { card: null, romajiLabel: '' };
          const card = cards.find((c) => c.romaji === sound) ?? null;
          return { card, romajiLabel: sound };
        });

        // Filter if query active
        if (normalized) {
          const hasMatch = cells.some(
            (c) =>
              c.card &&
              (c.card.character.includes(normalized) ||
                c.card.romaji.toLowerCase().includes(normalized))
          );
          if (!hasMatch) return null;
        }

        return { rowLabel: rowDef.label, cells };
      }).filter((r): r is TableRow => Boolean(r));
    }

    if (kind === 'dakuten') {
      return DAKUTEN_ROWS.map((rowDef) => {
        const cells: GridCell[] = rowDef.sounds.map((sound) => {
          const card = cards.find((c) => c.romaji === sound) ?? null;
          return { card, romajiLabel: sound };
        });

        if (normalized) {
          const hasMatch = cells.some(
            (c) =>
              c.card &&
              (c.card.character.includes(normalized) ||
                c.card.romaji.toLowerCase().includes(normalized))
          );
          if (!hasMatch) return null;
        }

        return { rowLabel: rowDef.label, cells };
      }).filter((r): r is TableRow => Boolean(r));
    }

    // Yoon (Blends)
    return YOON_ROWS.map((rowDef) => {
      const cells: GridCell[] = rowDef.sounds.map((sound) => {
        const card = cards.find((c) => c.romaji === sound) ?? null;
        return { card, romajiLabel: sound };
      });

      if (normalized) {
        const hasMatch = cells.some(
          (c) =>
            c.card &&
            (c.card.character.includes(normalized) ||
              c.card.romaji.toLowerCase().includes(normalized))
        );
        if (!hasMatch) return null;
      }

      return { rowLabel: rowDef.label, cells };
    }).filter((r): r is TableRow => Boolean(r));
  }, [kind, query, scriptCards]);

  const columnHeaders = kind === 'yoon' ? ['YA', 'YU', 'YO'] : ['A', 'I', 'U', 'E', 'O'];

  return (
    <Page contentStyle={styles.page}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.title}>Kana Reference</Text>
          <Text style={styles.subtitle}>
            {masteredCount} of {scriptCards.length} characters mastered ({Math.round((masteredCount / scriptCards.length) * 100)}%)
          </Text>
        </View>
        <ProgressBar
          value={(masteredCount / scriptCards.length) * 100}
          color={theme.forest}
          height={6}
        />
      </View>

      {/* Script & Category Controls */}
      <View style={styles.controlsGroup}>
        <View style={styles.topControlsRow}>
          <SegmentedControl<Script>
            style={styles.scriptSegment}
            value={script}
            onChange={changeScript}
            options={[
              { value: 'hiragana', label: 'Hiragana (あ)' },
              { value: 'katakana', label: 'Katakana (ア)' },
            ]}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showRomaji ? 'Hide romaji phonetics' : 'Show romaji phonetics'}
            onPress={() => setShowRomaji((v) => !v)}
            style={[styles.romajiButton, { backgroundColor: theme.card, borderColor: theme.line }]}
          >
            {showRomaji ? <EyeOff size={15} color={theme.forest} /> : <Eye size={15} color={theme.muted} />}
            <Text style={[styles.romajiBtnText, { color: theme.muted }, showRomaji && { color: theme.forest, fontWeight: '800' }]}>
              Romaji
            </Text>
          </Pressable>
        </View>

        <SegmentedControl<KanaKind>
          value={kind}
          onChange={(nextKind) => {
            void Haptics.selectionAsync();
            setKind(nextKind);
            setSelected(null);
          }}
          options={[
            { value: 'basic', label: 'Basic (46)' },
            { value: 'dakuten', label: 'Voiced (25)' },
            { value: 'yoon', label: 'Blends (33)' },
          ]}
        />

        {/* Search Bar & Status Filter */}
        <View style={[styles.searchBar, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <Search size={15} color={theme.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search romaji (e.g. 'shi') or kana..."
            placeholderTextColor={theme.faint}
            autoCapitalize="none"
            style={[styles.searchInput, { color: theme.ink }]}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <X size={15} color={theme.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Status Filter Pills */}
        <View style={styles.filterPillsRow}>
          {(
            [
              { value: 'all', label: `All (${scriptCards.length})` },
              { value: 'mastered', label: `Solid (${masteredCount})` },
              { value: 'learning', label: `To Practice (${scriptCards.length - masteredCount})` },
            ] as const
          ).map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setStatusFilter(filter.value);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: active ? theme.forest : theme.lineSubtle,
                    borderColor: active ? theme.forest : theme.line,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: active ? '#FFFFFF' : theme.muted },
                    active && styles.filterPillTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Selected Character Detail Card */}
      {selected ? (
        <Surface style={[styles.inspectorCard, { backgroundColor: theme.forestSoft, borderColor: theme.forestBorder }]}>
          <View style={styles.inspectorTopRow}>
            <View style={[styles.inspectorGlyphBox, { backgroundColor: theme.card, borderColor: theme.forestBorder }]}>
              <Text style={[styles.inspectorGlyph, { color: theme.forest }]}>{selected.character}</Text>
            </View>
            <View style={styles.inspectorContent}>
              <View style={[ui.row, ui.gap6]}>
                <Pill background={theme.forestSoft} color={theme.forest}>
                  {selected.script.toUpperCase()}
                </Pill>
                <Pill background={theme.lineSubtle} color={theme.muted}>
                  {selected.kind.toUpperCase()}
                </Pill>
              </View>
              <Text style={[styles.inspectorRomaji, { color: theme.ink }]}>{selected.romaji}</Text>
            </View>
            <View style={styles.inspectorActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Listen"
                onPress={() => speak(selected)}
                style={[styles.inspectorAudioBtn, { backgroundColor: theme.card, borderColor: theme.forestBorder }]}
              >
                <Volume2 size={18} color={theme.forest} />
              </Pressable>
              <Button
                label="Practice"
                icon={PenTool}
                onPress={() => router.push('/(tabs)/practice')}
                variant="primary"
                style={styles.inspectorPracticeBtn}
              />
            </View>
          </View>

          {exampleWords.length > 0 ? (
            <View style={[styles.exampleWordsSection, { borderTopColor: theme.forestBorder }]}>
              <Text style={[styles.exampleWordsLabel, { color: theme.forest }]}>COMMON VOCABULARY EXAMPLES</Text>
              <View style={styles.exampleWordsList}>
                {exampleWords.map((word) => (
                  <View key={word.id} style={[styles.exampleWordChip, { backgroundColor: theme.card, borderColor: theme.forestBorder }]}>
                    <Text style={[styles.exampleWordText, { color: theme.forest }]}>{word.text}</Text>
                    <Text style={[styles.exampleWordRomaji, { color: theme.muted }]}>({word.romaji})</Text>
                    <Text style={[styles.exampleWordMeaning, { color: theme.ink }]}>· {word.meaning}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </Surface>
      ) : null}

      {/* Traditional Gojuon Matrix Table */}
      <Surface style={styles.tableCard}>
        {/* Table Column Headers */}
        <View style={styles.tableHeaderRow}>
          <View style={styles.rowLabelCell} />
          {columnHeaders.map((header) => (
            <View key={header} style={styles.columnHeaderCell}>
              <Text style={styles.columnHeaderText}>{header}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        {tableRows.map((row) => (
          <View key={row.rowLabel} style={styles.gridRow}>
            <View style={styles.rowLabelCell}>
              <Text style={styles.rowLabelText}>{row.rowLabel}</Text>
            </View>
            {row.cells.map((cell, cIndex) => {
              if (!cell.card) {
                return <View key={cIndex} style={styles.emptyCell} />;
              }
              const card = cell.card;
              const isSelected = selected?.id === card.id;
              const isMastered =
                (getMastery(state, card.id, 'read')?.streak ?? 0) >= 3;
              const isDimmed =
                statusFilter !== 'all' &&
                (statusFilter === 'mastered' ? !isMastered : isMastered);

              return (
                <Pressable
                  key={card.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${card.character}, ${card.romaji}`}
                  onPress={() => {
                    setSelected(card);
                    speak(card);
                  }}
                  style={({ pressed }) => [
                    styles.kanaCell,
                    {
                      backgroundColor: isSelected ? theme.forest : theme.card,
                      borderColor: isSelected ? theme.forest : theme.line,
                    },
                    isDimmed && styles.kanaCellDimmed,
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {isMastered ? (
                    <View
                      style={[
                        styles.masteredIndicator,
                        { backgroundColor: isSelected ? '#FFFFFF' : theme.forest },
                      ]}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.kanaCellGlyph,
                      { color: isSelected ? '#FFFFFF' : theme.ink },
                    ]}
                  >
                    {card.character}
                  </Text>
                  {showRomaji ? (
                    <Text
                      style={[
                        styles.kanaCellRomaji,
                        { color: isSelected ? 'rgba(255,255,255,0.85)' : theme.muted },
                      ]}
                    >
                      {card.romaji}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </Surface>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 32,
  },
  topHeader: {
    marginBottom: 14,
    gap: 8,
  },
  title: {
    color: C.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  controlsGroup: {
    gap: 10,
    marginBottom: 14,
  },
  topControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scriptSegment: {
    flex: 1,
  },
  romajiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 10,
    minHeight: 38,
    ...S.shadowSm,
  },
  romajiBtnText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  romajiBtnTextActive: {
    color: C.forest,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 12,
    minHeight: 40,
    ...S.shadowSm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.ink,
    paddingVertical: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterPill: {
    flex: 1,
    minHeight: 32,
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  filterPillActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  filterPillText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inspectorCard: {
    padding: 14,
    gap: 12,
    marginBottom: 14,
    backgroundColor: C.forestSoft,
    borderColor: C.forestBorder,
  },
  inspectorTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exampleWordsSection: {
    borderTopWidth: 1,
    borderTopColor: C.forestBorder,
    paddingTop: 10,
    gap: 6,
  },
  exampleWordsLabel: {
    color: C.forest,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  exampleWordsList: {
    gap: 4,
  },
  exampleWordChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: R.xs,
    borderWidth: 1,
    borderColor: C.forestBorder,
  },
  exampleWordText: {
    color: C.forest,
    fontSize: 13,
    fontWeight: '800',
  },
  exampleWordRomaji: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  exampleWordMeaning: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '500',
  },
  kanaCellDimmed: {
    opacity: 0.22,
  },
  inspectorGlyphBox: {
    width: 52,
    height: 52,
    borderRadius: R.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.forestBorder,
  },
  inspectorGlyph: {
    color: C.forest,
    fontSize: 32,
    fontWeight: '700',
  },
  inspectorContent: {
    flex: 1,
    gap: 3,
  },
  inspectorRomaji: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  inspectorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inspectorAudioBtn: {
    width: 40,
    height: 40,
    borderRadius: R.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.forestBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectorPracticeBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
  },
  tableCard: {
    padding: 10,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.lineSubtle,
    paddingBottom: 8,
    marginBottom: 4,
  },
  rowLabelCell: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  rowLabelText: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  columnHeaderCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnHeaderText: {
    color: C.faint,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  kanaCell: {
    flex: 1,
    minHeight: 52,
    aspectRatio: 1,
    marginHorizontal: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  kanaCellActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  kanaCellGlyph: {
    color: C.ink,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 26,
  },
  kanaCellGlyphActive: {
    color: '#FFFFFF',
  },
  kanaCellRomaji: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  kanaCellRomajiActive: {
    color: '#D1E7DD',
  },
  emptyCell: {
    flex: 1,
    minHeight: 52,
    aspectRatio: 1,
    marginHorizontal: 2,
  },
  masteredIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.forest,
  },
});
