import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  Undo2,
  Volume2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import Animated, { FadeInDown, FadeOutUp, LinearTransition, ReduceMotion } from 'react-native-reanimated';
import { PracticeCanvas, PracticeCanvasRef } from '../../src/components/PracticeCanvas';
import { Button, Eyebrow, Page, Pill, ProgressBar, SegmentedControl, Surface, ui } from '../../src/components/ui';
import { useLearning } from '../../src/context/LearningContext';
import { useTheme } from '../../src/context/ThemeContext';
import { KanaCard, Script, WordCard } from '../../src/data/kana';
import {
  cardCharacter,
  currentLessonIndex,
  getNextCard,
  isWordCard,
  LEARNING_PATH,
  StudyMode,
} from '../../src/lib/learning';
import { C, R, S } from '../../src/theme';

const SCRIPT_OPTIONS: { value: Script | 'mixed'; label: string }[] = [
  { value: 'hiragana', label: 'Hiragana' },
  { value: 'katakana', label: 'Katakana' },
];
const MIXED_SCRIPT_OPTIONS: { value: Script | 'mixed'; label: string }[] = [
  ...SCRIPT_OPTIONS,
  { value: 'mixed', label: 'Both' },
];

const CARD_MOTION = FadeInDown.duration(200).reduceMotion(ReduceMotion.System);
const CARD_EXIT = FadeOutUp.duration(120).reduceMotion(ReduceMotion.System);
const LAYOUT_MOTION = LinearTransition.duration(160).reduceMotion(ReduceMotion.System);

export default function PracticeScreen() {
  const { state, gradeCard, setPreferredScript, adhdModeRevision } = useLearning();
  const { theme } = useTheme();
  const { lesson: lessonParam } = useLocalSearchParams<{ lesson?: string }>();
  const lessonId = Array.isArray(lessonParam) ? lessonParam[0] : lessonParam;
  const lesson = LEARNING_PATH.find((entry) => entry.id === lessonId);

  const [modeChoice, setModeChoice] = useState<{ lessonId?: string; value: StudyMode }>({ value: 'read' });
  const [deckChoice] = useState<{ lessonId?: string; value: 'kana' | 'words' | 'mixed' }>({ value: 'kana' });
  const [scriptChoice, setScriptChoice] = useState<{ lessonId?: string; value: Script | 'mixed' }>({ value: 'mixed' });

  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const [focusRound, setFocusRound] = useState({ revision: adhdModeRevision, count: 0, complete: false, paused: false });
  const [showPracticeOptions, setShowPracticeOptions] = useState(false);
  const activeFocusRound = focusRound.revision === adhdModeRevision
    ? focusRound
    : { revision: adhdModeRevision, count: 0, complete: false, paused: false };

  const canvasRef = useRef<PracticeCanvasRef>(null);

  const mode = modeChoice.lessonId === lessonId ? modeChoice.value : 'read';
  const deck = lesson?.content === 'kana'
    ? 'kana'
    : lesson?.content === 'words'
      ? 'words'
      : lesson?.content === 'mixed'
        ? deckChoice.lessonId === lessonId ? deckChoice.value : 'mixed'
        : deckChoice.lessonId === lessonId
          ? deckChoice.value
          : 'words';

  const script: Script | 'mixed' = lesson?.script === 'mixed'
    ? scriptChoice.lessonId === lessonId ? scriptChoice.value : 'mixed'
    : lesson ? lesson.script : state.preferredScript;

  const scriptOptions = lesson?.script === 'mixed'
    ? MIXED_SCRIPT_OPTIONS
    : lesson ? SCRIPT_OPTIONS.filter((option) => option.value === lesson.script) : SCRIPT_OPTIONS;

  const card = useMemo(() => {
    const groups = lesson?.content === 'kana' && lesson.script === script ? lesson.groups : [];
    return getNextCard(script, mode, deck, state, groups);
  }, [deck, lesson, mode, script, state]);

  const answerShown = revealedCardId === card.id;
  const character = cardCharacter(card);
  const word = isWordCard(card);
  const answer = card.romaji;
  const progressLine = state.adhdModeEnabled
    ? Math.min(100, Math.round((activeFocusRound.count / 5) * 100))
    : Math.min(100, ((state.totalAnswers % 10) + 1) * 10);

  const advanceFocusRound = () => {
    setFocusRound((previous) => {
      const current = previous.revision === adhdModeRevision
        ? previous
        : { revision: adhdModeRevision, count: 0, complete: false, paused: false };
      const count = current.count + 1;
      return { ...current, count, complete: count >= 5 };
    });
  };

  const startAnotherRound = () => {
    setFocusRound({ revision: adhdModeRevision, count: 0, complete: false, paused: false });
  };

  const returnToToday = () => router.navigate('/(tabs)/index' as never);

  const handleStrokeCount = useCallback((count: number) => {
    setStrokeCount(count);
  }, []);

  const chooseMode = (nextMode: StudyMode) => {
    void Haptics.selectionAsync();
    setModeChoice({ lessonId, value: nextMode });
    setRevealedCardId(null);
    setStrokeCount(0);
    setResetSignal((v) => v + 1);
  };

  const chooseScript = (nextScript: Script | 'mixed') => {
    void Haptics.selectionAsync();
    setScriptChoice({ lessonId, value: nextScript });
    if (nextScript !== 'mixed') setPreferredScript(nextScript);
    setRevealedCardId(null);
    setStrokeCount(0);
    setResetSignal((v) => v + 1);
  };

  const speak = () => {
    void Haptics.selectionAsync();
    Speech.speak(character, { language: 'ja-JP', rate: 0.78, pitch: 1.0 });
  };

  const grade = (correct: boolean) => {
    void Haptics.notificationAsync(
      correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
    gradeCard(card, mode, correct);
    if (state.adhdModeEnabled) advanceFocusRound();
    setRevealedCardId(null);
    setStrokeCount(0);
    setResetSignal((v) => v + 1);
  };

  const undoStroke = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    canvasRef.current?.undo();
  };

  const clearStrokes = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    canvasRef.current?.clear();
  };

  const toggleHint = () => {
    void Haptics.selectionAsync();
    setShowHint((prev) => !prev);
  };

  return (
    <Page contentStyle={styles.page}>
      {state.adhdModeEnabled && (activeFocusRound.complete || activeFocusRound.paused) ? (
        <Surface style={styles.focusRoundCard}>
          <Eyebrow color={theme.forest}>{activeFocusRound.paused ? 'PAUSED' : 'ROUND COMPLETE'}</Eyebrow>
          <Text style={[styles.focusRoundTitle, { color: theme.ink }]}>
            {activeFocusRound.paused ? 'Your progress is saved.' : 'That was five cards.'}
          </Text>
          <Text style={[styles.focusRoundDescription, { color: theme.muted }]}>
            {activeFocusRound.paused
              ? 'Take the time you need. You can start another short round whenever you are ready.'
              : 'Pause here or choose another short round. There is no need to rush.'}
          </Text>
          <Button
            label={activeFocusRound.paused ? 'Start another 5-card round' : 'Continue with 5 more'}
            onPress={startAnotherRound}
            icon={Check}
            style={styles.focusRoundAction}
          />
          {!activeFocusRound.paused ? (
            <Button
              label="Pause for now"
              onPress={() => setFocusRound({ ...activeFocusRound, paused: true })}
              variant="outline"
              style={styles.focusRoundAction}
            />
          ) : (
            <Button
              label="Back to Today"
              onPress={returnToToday}
              variant="outline"
              style={styles.focusRoundAction}
            />
          )}
        </Surface>
      ) : (
      <>
      {/* Top Navigation & Mode Switcher Bar */}
      <View style={styles.navBar}>
        {lesson ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to milestones"
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.lineSubtle, borderColor: theme.line }]}
          >
            <ArrowLeft size={18} color={theme.ink} />
            <Text style={[styles.backLessonText, { color: theme.ink }]}>M{currentLessonIndex(state) + 1}</Text>
          </Pressable>
        ) : null}

        {state.adhdModeEnabled ? (
          <View style={styles.focusRoundBadge}>
            <Text style={[styles.focusRoundBadgeTitle, { color: theme.ink }]}>Short round</Text>
            <Text style={[styles.focusRoundBadgeText, { color: theme.muted }]}>{activeFocusRound.count} of 5 done</Text>
          </View>
        ) : null}

        {!state.adhdModeEnabled || showPracticeOptions ? (
          <SegmentedControl<StudyMode>
            style={styles.modeSegment}
            value={mode}
            onChange={chooseMode}
            options={[
              { value: 'read', label: 'Read & Recall' },
              { value: 'write', label: 'Write Stroke' },
            ]}
          />
        ) : null}

        {(!state.adhdModeEnabled || showPracticeOptions) && scriptOptions.length > 1 ? (
          <View style={[styles.scriptSelector, { backgroundColor: theme.lineSubtle, borderColor: theme.line }]}>
            {scriptOptions.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => chooseScript(opt.value)}
                style={[
                  styles.scriptChip,
                  script === opt.value && { backgroundColor: theme.card, ...S.shadowSm },
                ]}
              >
                <Text
                  style={[
                    styles.scriptChipText,
                    { color: script === opt.value ? theme.forest : theme.muted },
                  ]}
                >
                  {opt.label === 'Hiragana' ? 'あ' : opt.label === 'Katakana' ? 'ア' : 'All'}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {state.adhdModeEnabled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showPracticeOptions }}
            accessibilityLabel={showPracticeOptions ? 'Hide practice options' : 'Show practice options'}
            onPress={() => setShowPracticeOptions((visible) => !visible)}
            style={[styles.optionsButton, { borderColor: theme.line, backgroundColor: theme.lineSubtle }]}
          >
            <Text style={[styles.optionsButtonText, { color: theme.ink }]}>{showPracticeOptions ? 'Hide' : 'Options'}</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Progress Strip */}
      <View style={styles.progressRow}>
        <View style={styles.progressTextRow}>
          <Text style={[styles.progressLabel, { color: theme.muted }]}>
            {state.adhdModeEnabled ? 'ONE SHORT ROUND' : lesson ? lesson.title.toUpperCase() : mode === 'read' ? 'RECALL SESSION' : 'WRITING PRACTICE'}
          </Text>
          <Text style={[styles.progressCount, { color: theme.faint }]}>
            {state.adhdModeEnabled ? `Card ${Math.min(activeFocusRound.count + 1, 5)} of 5` : `${state.totalAnswers} completed`}
          </Text>
        </View>
        <ProgressBar value={progressLine} color={theme.forest} height={4} />
      </View>

      {/* Main Workspace Area */}
      {mode === 'read' ? (
        <Animated.View
          key={`${card.id}:${mode}`}
          entering={CARD_MOTION}
          exiting={CARD_EXIT}
          layout={LAYOUT_MOTION}
          style={styles.readContainer}
        >
          {/* Flashcard with tap-to-reveal */}
          <Surface style={styles.readCard}>
            <View style={styles.cardHeader}>
              <Pill
                background={word ? theme.blueSoft : theme.forestSoft}
                color={word ? theme.blue : theme.forest}
              >
                {word ? (card as WordCard).level.toUpperCase() : (card as KanaCard).kind.toUpperCase()}
              </Pill>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Listen to pronunciation"
                onPress={speak}
                style={[styles.audioButton, { backgroundColor: theme.forestSoft, borderColor: theme.forestBorder }]}
              >
                <Volume2 size={18} color={theme.forest} />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={answerShown ? `Character ${character}` : 'Tap to reveal answer'}
              onPress={() => {
                if (!answerShown) {
                  void Haptics.selectionAsync();
                  setRevealedCardId(card.id);
                }
              }}
              style={styles.characterArea}
            >
              <Text
                style={[
                  styles.characterText,
                  { color: theme.ink },
                  word && (character.length > 6 ? styles.characterWordLong : styles.characterWord),
                ]}
              >
                {character}
              </Text>

              {answerShown ? (
                <View style={styles.revealedInfo}>
                  <Text style={[styles.romajiText, { color: theme.forest }]}>{answer}</Text>
                  {word ? <Text style={[styles.meaningText, { color: theme.muted }]}>{(card as WordCard).meaning}</Text> : null}
                </View>
              ) : (
                <View style={[styles.tapPromptContainer, { backgroundColor: theme.lineSubtle }]}>
                  <Text style={[styles.tapPrompt, { color: theme.muted }]}>Tap card or button to reveal answer</Text>
                </View>
              )}
            </Pressable>

            <View style={[styles.cardFooter, { borderTopColor: theme.lineSubtle }]}>
              {!answerShown ? (
                <Button
                  label="Reveal Answer"
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setRevealedCardId(card.id);
                  }}
                  variant="primary"
                  style={styles.actionBtnFull}
                />
              ) : (
                <View style={styles.buttonRow}>
                  <Button
                    label="Needs Practice"
                    onPress={() => grade(false)}
                    variant="outline"
                    icon={RotateCcw}
                    style={styles.buttonHalf}
                  />
                  <Button
                    label="Got It"
                    onPress={() => grade(true)}
                    variant="primary"
                    icon={Check}
                    style={styles.buttonHalf}
                  />
                </View>
              )}
            </View>
          </Surface>
        </Animated.View>
      ) : (
        <Animated.View
          key={`${card.id}:${mode}`}
          entering={CARD_MOTION}
          exiting={CARD_EXIT}
          layout={LAYOUT_MOTION}
          style={styles.writeContainer}
        >
          {/* Prompt Header */}
          <Surface style={styles.writePromptCard}>
            <View style={styles.writePromptContent}>
              <View style={[ui.row, ui.gap8]}>
                <Pill background={theme.forestSoft} color={theme.forest}>
                  {card.script.toUpperCase()} · {word ? 'WORD' : 'KANA'}
                </Pill>
              </View>
              <View style={styles.promptMainRow}>
                <Text style={[styles.promptSound, { color: theme.ink }]}>{answer}</Text>
                {word ? <Text style={[styles.promptWordMeaning, { color: theme.muted }]}>{(card as WordCard).meaning}</Text> : null}
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Hear pronunciation"
              onPress={speak}
              style={[styles.audioButton, { backgroundColor: theme.forestSoft, borderColor: theme.forestBorder }]}
            >
              <Volume2 size={20} color={theme.forest} />
            </Pressable>
          </Surface>

          {/* Canvas Workspace with Integrated HUD Controls */}
          <View style={styles.canvasWorkspace}>
            {/* Canvas HUD Tools */}
            <View style={styles.canvasHudBar}>
              <View style={[styles.strokeBadge, { backgroundColor: theme.lineSubtle, borderColor: theme.line }]}>
                <Text style={[styles.strokeBadgeText, { color: theme.muted }]}>
                  {strokeCount} {strokeCount === 1 ? 'stroke' : 'strokes'}
                </Text>
              </View>

              <View style={styles.hudActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showHint ? 'Hide guide watermark' : 'Show guide watermark'}
                  onPress={toggleHint}
                  style={[
                    styles.hudButton,
                    { backgroundColor: theme.card, borderColor: theme.line },
                    showHint && { backgroundColor: theme.forestSoft, borderColor: theme.forestBorder },
                  ]}
                >
                  {showHint ? <EyeOff size={15} color={theme.forest} /> : <Eye size={15} color={theme.muted} />}
                  <Text
                    style={[
                      styles.hudButtonText,
                      { color: theme.ink },
                      showHint && { color: theme.forest, fontWeight: '800' },
                    ]}
                  >
                    Guide
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Undo last stroke"
                  disabled={strokeCount === 0}
                  onPress={undoStroke}
                  style={[
                    styles.hudButton,
                    { backgroundColor: theme.card, borderColor: theme.line },
                    strokeCount === 0 && { opacity: 0.45, backgroundColor: theme.lineSubtle },
                  ]}
                >
                  <Undo2 size={15} color={strokeCount === 0 ? theme.faint : theme.ink} />
                  <Text
                    style={[
                      styles.hudButtonText,
                      { color: strokeCount === 0 ? theme.faint : theme.ink },
                    ]}
                  >
                    Undo
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear canvas"
                  disabled={strokeCount === 0}
                  onPress={clearStrokes}
                  style={[
                    styles.hudButton,
                    { backgroundColor: theme.card, borderColor: theme.line },
                    strokeCount === 0 && { opacity: 0.45, backgroundColor: theme.lineSubtle },
                  ]}
                >
                  <Trash2 size={15} color={strokeCount === 0 ? theme.faint : '#DC2626'} />
                  <Text
                    style={[
                      styles.hudButtonText,
                      { color: strokeCount === 0 ? theme.faint : '#DC2626' },
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Drawing Canvas with Overlay Support */}
            <PracticeCanvas
              key={`${card.id}:${mode}:${resetSignal}`}
              ref={canvasRef}
              target={character}
              showHint={showHint || answerShown}
              hintOpacity={answerShown ? 0.4 : 0.25}
              onStrokeCountChange={handleStrokeCount}
            />
          </View>

          {/* Bottom Action / Grading Area */}
          <Surface style={styles.writeActionCard}>
            {answerShown ? (
              <View style={styles.comparisonArea}>
                <View style={[styles.comparisonHeader, { backgroundColor: theme.lineSubtle }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.comparisonLabel, { color: theme.muted }]}>MODEL OVERLAY ACTIVE</Text>
                    <Text style={[styles.comparisonHint, { color: theme.faint }]}>
                      Compare your stroke balance with the guide above
                    </Text>
                  </View>
                  <View style={[styles.comparisonGlyphBox, { backgroundColor: theme.card, borderColor: theme.line }]}>
                    <Text style={[styles.comparisonGlyph, { color: theme.forest }]}>{character}</Text>
                  </View>
                </View>
                <View style={styles.buttonRow}>
                  <Button
                    label="Needs Practice"
                    onPress={() => grade(false)}
                    variant="outline"
                    icon={RotateCcw}
                    style={styles.buttonHalf}
                  />
                  <Button
                    label="Looks Good"
                    onPress={() => grade(true)}
                    variant="primary"
                    icon={Check}
                    style={styles.buttonHalf}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                <Button
                  label="Show Model"
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setRevealedCardId(card.id);
                    setShowHint(true);
                  }}
                  variant="outline"
                  icon={Eye}
                  style={styles.buttonHalf}
                />
                <Button
                  label="Check & Compare"
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setRevealedCardId(card.id);
                  }}
                  disabled={strokeCount === 0}
                  variant="primary"
                  icon={Check}
                  style={styles.buttonHalf}
                />
              </View>
            )}
          </Surface>
        </Animated.View>
      )}
      </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 24,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  focusRoundBadge: {
    flex: 1,
    gap: 1,
  },
  focusRoundBadgeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  focusRoundBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  optionsButton: {
    minHeight: 36,
    borderWidth: 1,
    borderRadius: R.sm,
    justifyContent: 'center',
    paddingHorizontal: 9,
  },
  optionsButtonText: {
    fontSize: 11,
    fontWeight: '700',
  },
  focusRoundCard: {
    marginTop: 20,
    padding: 22,
    gap: 14,
  },
  focusRoundTitle: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
  },
  focusRoundDescription: {
    fontSize: 14,
    lineHeight: 21,
  },
  focusRoundAction: {
    width: '100%',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    paddingHorizontal: 10,
    minHeight: 38,
  },
  backLessonText: {
    color: C.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  modeSegment: {
    flex: 1,
  },
  scriptSelector: {
    flexDirection: 'row',
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    padding: 3,
    gap: 3,
  },
  scriptChip: {
    minHeight: 32,
    paddingHorizontal: 9,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptChipActive: {
    backgroundColor: '#FFFFFF',
    ...S.shadowSm,
  },
  scriptChipText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  scriptChipTextActive: {
    color: C.forest,
    fontWeight: '800',
  },
  progressRow: {
    marginBottom: 14,
    gap: 6,
  },
  progressTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  progressCount: {
    color: C.faint,
    fontSize: 11,
    fontWeight: '600',
  },
  readContainer: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  readCard: {
    minHeight: 380,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioButton: {
    width: 42,
    height: 42,
    borderRadius: R.md,
    backgroundColor: C.forestSoft,
    borderWidth: 1,
    borderColor: C.forestBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  characterText: {
    color: C.ink,
    fontSize: 104,
    lineHeight: 116,
    fontWeight: '600',
    textAlign: 'center',
  },
  characterWord: {
    fontSize: 48,
    lineHeight: 58,
  },
  characterWordLong: {
    fontSize: 32,
    lineHeight: 42,
  },
  revealedInfo: {
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  romajiText: {
    color: C.forest,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  meaningText: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  tapPromptContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: R.full,
    backgroundColor: C.lineSubtle,
    marginTop: 14,
  },
  tapPrompt: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.lineSubtle,
    paddingTop: 16,
  },
  actionBtnFull: {
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  buttonHalf: {
    flex: 1,
  },
  writeContainer: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 12,
  },
  writePromptCard: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  writePromptContent: {
    flex: 1,
    gap: 4,
  },
  promptMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  promptSound: {
    color: C.ink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  promptWordMeaning: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  canvasWorkspace: {
    width: '100%',
    gap: 8,
  },
  canvasHudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  strokeBadge: {
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  strokeBadgeText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  hudActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.sm,
    paddingHorizontal: 9,
    paddingVertical: 6,
    ...S.shadowSm,
  },
  hudButtonActive: {
    backgroundColor: C.forestSoft,
    borderColor: C.forestBorder,
  },
  hudButtonDisabled: {
    opacity: 0.45,
    backgroundColor: C.lineSubtle,
    elevation: 0,
    shadowOpacity: 0,
  },
  hudButtonText: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '700',
  },
  hudButtonTextActive: {
    color: C.forest,
    fontWeight: '800',
  },
  hudButtonTextDisabled: {
    color: C.faint,
  },
  writeActionCard: {
    padding: 14,
    marginTop: 2,
  },
  comparisonArea: {
    gap: 12,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.lineSubtle,
    borderRadius: R.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  comparisonLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  comparisonHint: {
    color: C.faint,
    fontSize: 11,
    marginTop: 2,
  },
  comparisonGlyphBox: {
    width: 44,
    height: 44,
    borderRadius: R.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    ...S.shadowSm,
  },
  comparisonGlyph: {
    color: C.forest,
    fontSize: 26,
    fontWeight: '700',
  },
});
