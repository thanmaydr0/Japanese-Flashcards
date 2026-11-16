import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Check, LockKeyhole, Route } from 'lucide-react-native';
import { KANA_CARDS } from '../../src/data/kana';
import {
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
import {
  currentLessonIndex,
  formatDays,
  getPlanEstimate,
  isLessonUnlocked,
  LEARNING_PATH,
  lessonProgress,
} from '../../src/lib/learning';
import { C, R, S } from '../../src/theme';

export default function PathScreen() {
  const { state, setPreferredScript } = useLearning();
  const { theme } = useTheme();
  const activeIndex = currentLessonIndex(state);
  const days = getPlanEstimate(state);

  const startLesson = (id: string) => {
    const nextLesson = LEARNING_PATH.find((entry) => entry.id === id);
    if (nextLesson && nextLesson.script !== 'mixed') setPreferredScript(nextLesson.script);
    router.push({ pathname: '/(tabs)/practice', params: { lesson: id } });
  };

  return (
    <Page contentStyle={styles.page}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Eyebrow color={theme.forest}>STRUCTURED CURRICULUM</Eyebrow>
        <Text style={[styles.pageTitle, { color: theme.ink }]}>Learning Roadmap</Text>
        <Text style={[styles.pageSubtitle, { color: theme.muted }]}>
          Master Japanese kana systematically. Complete each milestone to unlock the next.
        </Text>
      </View>

      {/* Plan Summary Surface */}
      <Surface style={styles.planSummaryCard}>
        <View style={styles.summaryTop}>
          <IconTile icon={Route} background={theme.forestSoft} color={theme.forest} size={36} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.summaryTitle, { color: theme.ink }]}>
              Milestone {activeIndex + 1} of {LEARNING_PATH.length}
            </Text>
            <Text style={[styles.summarySub, { color: theme.muted }]}>
              ~{formatDays(days)} estimated at {state.dailyMinutes} min/day
            </Text>
          </View>
          <View style={[styles.summaryProgressBadge, { backgroundColor: theme.lineSubtle }]}>
            <Text style={[styles.summaryProgressText, { color: theme.forest }]}>
              {Math.round((activeIndex / LEARNING_PATH.length) * 100)}% Done
            </Text>
          </View>
        </View>
        <ProgressBar
          value={(activeIndex / LEARNING_PATH.length) * 100}
          color={theme.forest}
          height={6}
        />
      </Surface>

      {/* Milestones List */}
      <View style={styles.milestonesSection}>
        <SectionTitle title="Milestones" />

        {LEARNING_PATH.map((lesson, index) => {
          const progress = lessonProgress(lesson, state);
          const unlocked = isLessonUnlocked(index, state);
          const active = index === activeIndex;
          const complete = progress.percent >= 0.72;
          const scriptLabel =
            lesson.script === 'mixed'
              ? 'Both Scripts'
              : lesson.script === 'hiragana'
                ? 'Hiragana'
                : 'Katakana';

          return (
            <View key={lesson.id} style={styles.milestoneRow}>
              {/* Timeline Connector */}
              <View style={styles.timelineCol}>
                <View
                  style={[
                    styles.timelineNode,
                    { backgroundColor: theme.surface, borderColor: theme.line },
                    complete && { backgroundColor: theme.accent, borderColor: theme.accent },
                    active && { backgroundColor: theme.forest, borderColor: theme.forest },
                    !unlocked && { backgroundColor: theme.lineSubtle, borderColor: theme.line },
                  ]}
                >
                  {complete ? (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                  ) : unlocked ? (
                    <Text
                      style={[
                        styles.timelineNodeNum,
                        { color: active ? '#FFFFFF' : theme.muted },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  ) : (
                    <LockKeyhole size={13} color={theme.faint} />
                  )}
                </View>
                {index < LEARNING_PATH.length - 1 ? (
                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: theme.line },
                      complete && { backgroundColor: theme.accent },
                    ]}
                  />
                ) : null}
              </View>

              {/* Milestone Card */}
              <Surface
                style={[
                  styles.milestoneCard,
                  active && {
                    borderColor: theme.forestBorder,
                    backgroundColor: theme.surfaceRaised,
                    borderWidth: 1.5,
                  },
                  !unlocked && {
                    opacity: 0.65,
                    backgroundColor: theme.lineSubtle,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={[ui.row, ui.gap6]}>
                    <Pill background={theme.forestSoft} color={theme.forest}>
                      {scriptLabel.toUpperCase()}
                    </Pill>
                    {active ? (
                      <Pill background={theme.coralSoft} color={theme.coral}>
                        CURRENT
                      </Pill>
                    ) : complete ? (
                      <Pill background={theme.accentSoft} color={theme.accent}>
                        SOLID
                      </Pill>
                    ) : null}
                  </View>
                  <Text style={[styles.cardDuration, { color: theme.muted }]}>
                    {lesson.duration} MIN
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.cardTitle,
                      { color: theme.ink },
                      !unlocked && { color: theme.muted },
                    ]}
                  >
                    {lesson.title}
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.muted }]}>
                    {lesson.subtitle}
                  </Text>

                  {lesson.content !== 'words' ? (
                    <View style={styles.previewChipsRow}>
                      {KANA_CARDS.filter(
                        (c) =>
                          c.script === (lesson.script === 'mixed' ? 'hiragana' : lesson.script) &&
                          lesson.groups.includes(c.group)
                      )
                        .slice(0, 6)
                        .map((c) => (
                          <View
                            key={c.id}
                            style={[
                              styles.previewChip,
                              { backgroundColor: theme.lineSubtle, borderColor: theme.line },
                            ]}
                          >
                            <Text style={[styles.previewChipText, { color: theme.forest }]}>
                              {c.character}
                            </Text>
                          </View>
                        ))}
                    </View>
                  ) : null}
                </View>

                <View style={[styles.cardFooter, { borderTopColor: theme.lineSubtle }]}>
                  <View style={styles.progressRow}>
                    <Text style={[styles.progressText, { color: theme.muted }]}>
                      {progress.mastered} of {progress.total} skills solid
                    </Text>
                    <Text style={[styles.progressPercent, { color: theme.ink }]}>
                      {Math.round(progress.percent * 100)}%
                    </Text>
                  </View>
                  <ProgressBar
                    value={progress.percent * 100}
                    color={complete ? theme.accent : theme.forest}
                    height={5}
                  />

                  {unlocked ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => startLesson(lesson.id)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        {
                          backgroundColor: active ? theme.forest : theme.forestSoft,
                          borderColor: active ? theme.forest : theme.forestBorder,
                        },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          { color: active ? '#FFFFFF' : theme.forest },
                        ]}
                      >
                        {complete
                          ? 'Review Milestone'
                          : active
                            ? 'Continue Practice'
                            : 'Open Milestone'}
                      </Text>
                      <ArrowRight
                        size={15}
                        color={active ? '#FFFFFF' : theme.forest}
                        strokeWidth={2.4}
                      />
                    </Pressable>
                  ) : (
                    <View style={styles.lockedBar}>
                      <LockKeyhole size={13} color={theme.faint} />
                      <Text style={[styles.lockedBarText, { color: theme.faint }]}>
                        Complete Milestone {index} to unlock
                      </Text>
                    </View>
                  )}
                </View>
              </Surface>
            </View>
          );
        })}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingBottom: 32,
  },
  topHeader: {
    marginBottom: 16,
    gap: 4,
  },
  pageTitle: {
    color: C.ink,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    color: C.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  planSummaryCard: {
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTitle: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  summarySub: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  summaryProgressBadge: {
    backgroundColor: C.lineSubtle,
    borderRadius: R.sm,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  summaryProgressText: {
    color: C.forest,
    fontSize: 11,
    fontWeight: '800',
  },
  milestonesSection: {
    gap: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  timelineCol: {
    width: 28,
    alignItems: 'center',
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: R.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineNodeComplete: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  timelineNodeActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  timelineNodeLocked: {
    backgroundColor: C.lineSubtle,
    borderColor: C.line,
  },
  timelineNodeNum: {
    fontSize: 11,
    fontWeight: '800',
    color: C.muted,
  },
  timelineNodeNumActive: {
    color: '#FFFFFF',
  },
  timelineLine: {
    position: 'absolute',
    width: 2,
    top: 28,
    bottom: -10,
    backgroundColor: C.line,
  },
  timelineLineComplete: {
    backgroundColor: '#059669',
  },
  milestoneCard: {
    flex: 1,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  milestoneCardActive: {
    borderColor: C.forestBorder,
    backgroundColor: '#FEFFFE',
    ...S.shadowMd,
  },
  milestoneCardLocked: {
    opacity: 0.65,
    backgroundColor: C.lineSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDuration: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardBody: {
    gap: 3,
  },
  cardTitle: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardTitleLocked: {
    color: C.muted,
  },
  cardSubtitle: {
    color: C.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  previewChipsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  previewChip: {
    width: 26,
    height: 26,
    borderRadius: R.xs,
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewChipText: {
    color: C.forest,
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: C.lineSubtle,
    paddingTop: 10,
    gap: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  progressPercent: {
    color: C.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.forestSoft,
    borderWidth: 1,
    borderColor: C.forestBorder,
    borderRadius: R.sm,
    paddingHorizontal: 12,
    minHeight: 38,
    marginTop: 4,
  },
  actionButtonActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  actionButtonText: {
    color: C.forest,
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  lockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  lockedBarText: {
    color: C.faint,
    fontSize: 11,
    fontWeight: '600',
  },
});
