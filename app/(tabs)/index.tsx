import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Flame,
  Layers3,
  Target,
} from 'lucide-react-native';
import { KANA_CARDS, Script } from '../../src/data/kana';
import { MascotCompanion } from '../../src/components/MascotCompanion';
import {
  AppMark,
  Button,
  Eyebrow,
  IconTile,
  Page,
  Pill,
  ProgressBar,
  SectionTitle,
  Surface,
  ui,
} from '../../src/components/ui';
import { useLearning } from '../../src/context/LearningContext';
import { useTheme } from '../../src/context/ThemeContext';
import { askForStudyNudge } from '../../src/lib/cloud';
import {
  accuracyPercent,
  currentLessonIndex,
  getMastery,
  getPlanEstimate,
  LEARNING_PATH,
  masteryCounts,
  suggestedFocus,
} from '../../src/lib/learning';
import { C, R, S } from '../../src/theme';

function scriptProgress(script: Script, state: ReturnType<typeof useLearning>['state']) {
  const prefix = script === 'hiragana' ? 'h-' : 'k-';
  const cards = KANA_CARDS.filter((card) => card.id.startsWith(prefix));
  let mastered = 0;
  for (const card of cards) {
    for (const mode of ['read', 'write'] as const) {
      if ((getMastery(state, card.id, mode)?.streak ?? 0) >= 3) mastered += 1;
    }
  }
  const total = cards.length * 2;
  return {
    mastered,
    total,
    percent: total ? Math.round((mastered / total) * 100) : 0,
  };
}

export default function TodayScreen() {
  const { state } = useLearning();
  const { theme, isDark, isJapanese } = useTheme();
  const [cloudNudge, setCloudNudge] = useState<string | null>(null);

  const focus = cloudNudge || suggestedFocus(state);
  const activeMilestoneIndex = currentLessonIndex(state);
  const currentLesson = LEARNING_PATH[activeMilestoneIndex];
  const counts = masteryCounts(state);
  const accuracy = accuracyPercent(state);
  const estimate = getPlanEstimate(state);

  const hProgress = useMemo(() => scriptProgress('hiragana', state), [state]);
  const kProgress = useMemo(() => scriptProgress('katakana', state), [state]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const answeredToday = state.answerLog.filter((entry) => {
    const date = new Date(entry.at);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` === todayKey;
  }).length;
  const dailyGoal = Math.max(8, Math.round(state.dailyMinutes / 1.5));
  const goalProgress = Math.min(100, Math.round((answeredToday / dailyGoal) * 100));

  useEffect(() => {
    let active = true;
    askForStudyNudge(state).then((nudge) => {
      if (active && nudge) setCloudNudge(nudge);
    });
    return () => {
      active = false;
    };
  }, [state]);

  const openPractice = () => router.push('/(tabs)/practice');
  const openMilestone = () => {
    router.push({
      pathname: '/(tabs)/practice',
      params: { lesson: currentLesson.id },
    });
  };

  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const weekDays = useMemo(() => {
    const days: { label: string; active: boolean; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hasStudied = state.answerLog.some((e) => {
        const ed = new Date(e.at);
        return (
          `${ed.getFullYear()}-${String(ed.getMonth() + 1).padStart(2, '0')}-${String(ed.getDate()).padStart(2, '0')}` ===
          key
        );
      });
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'narrow' }),
        active: hasStudied,
        isToday: i === 0,
      });
    }
    return days;
  }, [state.answerLog]);

  const milestoneKanaPreview = useMemo(() => {
    if (currentLesson.content === 'words') return [];
    const script = currentLesson.script === 'mixed' ? 'hiragana' : currentLesson.script;
    return KANA_CARDS.filter(
      (c) => c.script === script && currentLesson.groups.includes(c.group)
    )
      .slice(0, 5)
      .map((c) => c.character);
  }, [currentLesson]);

  return (
    <Page contentStyle={styles.page}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={[ui.row, ui.gap12]}>
          <AppMark />
          <View>
            <Text style={[styles.brandTitle, { color: theme.ink }]}>Japy</Text>
            <View style={[ui.row, ui.gap6]}>
              <Calendar size={12} color={theme.muted} />
              <Text style={[styles.dateSubtitle, { color: theme.muted }]}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        <Pill
          background={state.streak > 0 ? theme.coralSoft : theme.lineSubtle}
          color={state.streak > 0 ? theme.coral : theme.muted}
          icon={Flame}
        >
          {state.streak > 0 ? `${state.streak} DAY STREAK` : 'NO STREAK YET'}
        </Pill>
      </View>

      {/* 7-Day Mini Streak Tracker */}
      <Surface style={styles.weekStreakCard}>
        <View style={styles.weekStreakHeader}>
          <Text style={[styles.weekStreakLabel, { color: theme.muted }]}>WEEKLY CONSISTENCY</Text>
          <Text style={[styles.weekStreakCounter, { color: theme.forest }]}>
            {weekDays.filter((d) => d.active).length} / 7 days active
          </Text>
        </View>
        <View style={styles.weekStreakRow}>
          {weekDays.map((day, idx) => (
            <View key={idx} style={styles.weekStreakDay}>
              <View
                style={[
                  styles.weekStreakDot,
                  {
                    backgroundColor: day.active ? theme.forest : theme.lineSubtle,
                    borderColor: day.active ? theme.forest : theme.line,
                  },
                  day.isToday && { borderColor: theme.coral, borderWidth: 2 },
                ]}
              >
                {day.active ? <CheckCircle2 size={12} color="#FFFFFF" /> : null}
              </View>
              <Text
                style={[
                  styles.weekStreakDayLabel,
                  { color: day.isToday ? theme.coral : theme.muted },
                ]}
              >
                {day.label}
              </Text>
            </View>
          ))}
        </View>
      </Surface>

      {/* Hero: Active Study Milestone */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: isJapanese
              ? (isDark ? '#1A1820' : '#23493C')
              : (isDark ? '#141D2D' : '#0B2F29'),
            borderColor: isJapanese ? theme.accent : theme.forestBorder,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroBadgeRow}>
            <Pill background="rgba(255, 255, 255, 0.15)" color="#FFFFFF">
              MILESTONE {activeMilestoneIndex + 1} OF {LEARNING_PATH.length}
            </Pill>
            <Text style={styles.heroTimeLabel}>{currentLesson.duration} MIN SESSION</Text>
          </View>
          <Text style={styles.heroTitle}>{currentLesson.title}</Text>
          <Text style={styles.heroSubtitle}>{currentLesson.subtitle}</Text>

          {milestoneKanaPreview.length > 0 ? (
            <View style={styles.kanaChipsRow}>
              {milestoneKanaPreview.map((kana) => (
                <View key={kana} style={styles.heroKanaChip}>
                  <Text style={styles.heroKanaChipText}>{kana}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.heroFooter}>
          <Button
            label="Continue Milestone"
            onPress={openMilestone}
            icon={ArrowRight}
            style={styles.heroButton}
            labelStyle={styles.heroButtonText}
          />
        </View>
      </View>

      {/* Daily Performance Cards */}
      <View style={styles.gridTwo}>
        {/* Daily Goal */}
        <Surface style={styles.goalCard}>
          <View style={styles.cardHeader}>
            <View style={[ui.row, ui.gap8]}>
              <IconTile icon={Target} background={theme.coralSoft} color={theme.coral} size={32} />
              <View>
                <Text style={[styles.cardTitle, { color: theme.ink }]}>Daily Goal</Text>
                <Text style={[styles.cardCaption, { color: theme.muted }]}>{state.dailyMinutes} min target</Text>
              </View>
            </View>
            <Text style={[styles.goalProgressValue, { color: theme.ink }]}>
              {answeredToday}
              <Text style={[styles.goalProgressTotal, { color: theme.faint }]}>/{dailyGoal}</Text>
            </Text>
          </View>
          <ProgressBar value={goalProgress} color={theme.coral} height={6} />
          <View style={styles.cardFoot}>
            <Text style={[styles.cardFootMuted, { color: theme.muted }]}>
              {goalProgress >= 100
                ? 'Target reached for today!'
                : `${Math.max(0, dailyGoal - answeredToday)} prompts remaining`}
            </Text>
          </View>
        </Surface>

        {/* Foundation Estimate */}
        <Surface style={styles.goalCard}>
          <View style={styles.cardHeader}>
            <View style={[ui.row, ui.gap8]}>
              <IconTile icon={CheckCircle2} background={theme.forestSoft} color={theme.forest} size={32} />
              <View>
                <Text style={[styles.cardTitle, { color: theme.ink }]}>Fluency Forecast</Text>
                <Text style={[styles.cardCaption, { color: theme.muted }]}>At current study pace</Text>
              </View>
            </View>
            <Text style={[styles.forecastValue, { color: theme.forest }]}>~{estimate}d</Text>
          </View>
          <ProgressBar value={counts.percent} color={theme.forest} height={6} />
          <View style={styles.cardFoot}>
            <Text style={[styles.cardFootMuted, { color: theme.muted }]}>
              {counts.mastered} of {counts.total} skills solid ({counts.percent}%)
            </Text>
          </View>
        </Surface>
      </View>

      {/* Daily Mascot Companion & Dynamic App Icon */}
      <MascotCompanion />

      {/* Script Proficiency Section */}
      <View style={styles.sectionContainer}>
        <SectionTitle
          title="Script Proficiency"
          action="View Chart"
          onAction={() => router.push('/(tabs)/kana')}
        />

        <View style={styles.gridTwo}>
          {/* Hiragana */}
          <Surface style={styles.scriptCard}>
            <View style={styles.scriptHeader}>
              <View style={[styles.scriptGlyphBox, { backgroundColor: theme.forestSoft }]}>
                <Text style={[styles.scriptGlyph, { color: theme.forest }]}>あ</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scriptName, { color: theme.ink }]}>Hiragana</Text>
                <Text style={[styles.scriptDesc, { color: theme.muted }]}>Native Japanese sounds</Text>
              </View>
              <Text style={[styles.scriptPercent, { color: theme.ink }]}>{hProgress.percent}%</Text>
            </View>
            <ProgressBar value={hProgress.percent} color={theme.forest} height={6} />
            <View style={styles.scriptFooter}>
              <Text style={[styles.scriptStatText, { color: theme.muted }]}>
                {hProgress.mastered} / {hProgress.total} skills mastered
              </Text>
            </View>
          </Surface>

          {/* Katakana */}
          <Surface style={styles.scriptCard}>
            <View style={styles.scriptHeader}>
              <View style={[styles.scriptGlyphBox, { backgroundColor: theme.blueSoft }]}>
                <Text style={[styles.scriptGlyph, { color: theme.blue }]}>ア</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scriptName, { color: theme.ink }]}>Katakana</Text>
                <Text style={[styles.scriptDesc, { color: theme.muted }]}>Loanwords and emphasis</Text>
              </View>
              <Text style={[styles.scriptPercent, { color: theme.ink }]}>{kProgress.percent}%</Text>
            </View>
            <ProgressBar value={kProgress.percent} color={theme.blue} height={6} />
            <View style={styles.scriptFooter}>
              <Text style={[styles.scriptStatText, { color: theme.muted }]}>
                {kProgress.mastered} / {kProgress.total} skills mastered
              </Text>
            </View>
          </Surface>
        </View>
      </View>

      {/* Performance Statistics */}
      <View style={styles.sectionContainer}>
        <SectionTitle title="Session Metrics" />
        <View style={styles.metricsRow}>
          <Surface style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>RETENTION</Text>
              <Award size={15} color={theme.forest} />
            </View>
            <Text style={[styles.metricValue, { color: theme.ink }]}>{accuracy}%</Text>
            <Text style={[styles.metricSub, { color: theme.faint }]}>Recent recall</Text>
          </Surface>

          <Surface style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>TOTAL REPS</Text>
              <Layers3 size={15} color={theme.coral} />
            </View>
            <Text style={[styles.metricValue, { color: theme.ink }]}>{state.totalAnswers}</Text>
            <Text style={[styles.metricSub, { color: theme.faint }]}>Cards practiced</Text>
          </Surface>

          <Surface style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={[styles.metricLabel, { color: theme.muted }]}>MASTERY</Text>
              <Target size={15} color={theme.blue} />
            </View>
            <Text style={[styles.metricValue, { color: theme.ink }]}>
              {counts.mastered}
              <Text style={[styles.metricValueTotal, { color: theme.faint }]}>/{counts.total}</Text>
            </Text>
            <Text style={[styles.metricSub, { color: theme.faint }]}>Skills solid</Text>
          </Surface>
        </View>
      </View>

      {/* Focus Recommendation */}
      <Surface style={styles.focusCard}>
        <View style={styles.focusHeader}>
          <IconTile icon={BookOpen} background={theme.forestSoft} color={theme.forest} size={34} />
          <View style={{ flex: 1 }}>
            <Eyebrow color={theme.forest}>RECOMMENDED FOCUS</Eyebrow>
            <Text style={[styles.focusTitle, { color: theme.ink }]}>{focus}</Text>
          </View>
        </View>
        <Button
          label="Start Quick Practice"
          onPress={openPractice}
          variant="outline"
          icon={ArrowRight}
          style={styles.focusButton}
        />
      </Surface>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  brandTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  dateSubtitle: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  weekStreakCard: {
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  weekStreakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekStreakLabel: {
    color: C.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  weekStreakCounter: {
    color: C.forest,
    fontSize: 11,
    fontWeight: '700',
  },
  weekStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekStreakDay: {
    alignItems: 'center',
    gap: 4,
  },
  weekStreakDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekStreakDotActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  weekStreakDotToday: {
    borderColor: C.coral,
    borderWidth: 2,
  },
  weekStreakDayLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  weekStreakDayLabelToday: {
    color: C.coral,
    fontWeight: '900',
  },
  kanaChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  heroKanaChip: {
    width: 28,
    height: 28,
    borderRadius: R.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroKanaChipText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: C.forestDark,
    borderRadius: R.xl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#164E43',
    ...S.shadowMd,
  },
  heroTop: {
    gap: 8,
    marginBottom: 18,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTimeLabel: {
    color: '#A7D4C8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  heroSubtitle: {
    color: '#CDE5DF',
    fontSize: 13,
    lineHeight: 18,
  },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    minHeight: 44,
  },
  heroButtonText: {
    color: C.forestDark,
    fontWeight: '800',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    flex: 1,
    minWidth: 260,
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  cardCaption: {
    color: C.muted,
    fontSize: 11,
    marginTop: 1,
  },
  goalProgressValue: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  goalProgressTotal: {
    color: C.faint,
    fontSize: 13,
    fontWeight: '600',
  },
  forecastValue: {
    color: C.forest,
    fontSize: 20,
    fontWeight: '900',
  },
  cardFoot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFootMuted: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 20,
  },
  scriptCard: {
    flex: 1,
    minWidth: 260,
    padding: 14,
    gap: 10,
  },
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scriptGlyphBox: {
    width: 36,
    height: 36,
    borderRadius: R.sm,
    backgroundColor: C.forestSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scriptGlyph: {
    color: C.forest,
    fontSize: 20,
    fontWeight: '700',
  },
  scriptName: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  scriptDesc: {
    color: C.muted,
    fontSize: 11,
  },
  scriptPercent: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  scriptFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scriptStatText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: C.ink,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  metricValueTotal: {
    color: C.faint,
    fontSize: 13,
    fontWeight: '600',
  },
  metricSub: {
    color: C.faint,
    fontSize: 11,
  },
  focusCard: {
    marginTop: 20,
    padding: 16,
    gap: 14,
  },
  focusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  focusTitle: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 19,
  },
  focusButton: {
    minHeight: 42,
  },
});
