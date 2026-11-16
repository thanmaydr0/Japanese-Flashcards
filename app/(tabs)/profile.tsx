import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Cloud,
  Flame,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Volume2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { AccountAndReminders } from '../../src/components/AccountAndReminders';
import {
  Button,
  Eyebrow,
  IconTile,
  Page,
  Pill,
  ProgressBar,
  SectionTitle,
  Surface,
  ThemeSelector,
} from '../../src/components/ui';
import { useTheme } from '../../src/context/ThemeContext';
import { useLearning } from '../../src/context/LearningContext';
import { accuracyPercent, getPlanEstimate, masteryCounts } from '../../src/lib/learning';
import { supabaseConfigured } from '../../src/lib/supabase';
import { C, R } from '../../src/theme';

const GOALS = [10, 15, 20, 30, 45, 60];

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function PaceScreen() {
  const { state, changeDailyMinutes, resetProgress, setAdhdModeEnabled } = useLearning();
  const { theme, isDark } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const counts = masteryCounts(state);
  const estimate = getPlanEstimate(state);
  const accuracy = accuracyPercent(state);

  const testVoice = () => {
    void Haptics.selectionAsync();
    Speech.speak('こんにちは、日本語の勉強を始めましょう', { language: 'ja-JP', rate: 0.8 });
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetProgress();
    setConfirmReset(false);
    Alert.alert('Progress Reset', 'Your study records and streaks have been cleared.');
  };

  const weekly = useMemo(() => {
    const items: { label: string; count: number; today: boolean }[] = [];
    const now = new Date();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(now);
      day.setDate(now.getDate() - offset);
      const key = localKey(day);
      const count = state.answerLog.filter((entry) => localKey(new Date(entry.at)) === key).length;
      items.push({
        label: day.toLocaleDateString('en-US', { weekday: 'narrow' }),
        count,
        today: offset === 0,
      });
    }
    return items;
  }, [state.answerLog]);

  const maxActivity = Math.max(1, ...weekly.map((entry) => entry.count));
  const weeklyTotal = weekly.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Page contentStyle={styles.page}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Eyebrow color={theme.forest}>PROFILE & SETTINGS</Eyebrow>
        <Text style={[styles.pageTitle, { color: theme.ink }]}>Your Profile</Text>
        <Text style={[styles.pageSubtitle, { color: theme.muted }]}>
          Manage your account, appearance, and study preferences.
        </Text>
      </View>

      <AccountAndReminders />

      <View style={styles.sectionContainer}>
        <SectionTitle title="Study Support" />
        <Surface style={styles.focusModeCard}>
          <View style={styles.focusModeHeader}>
            <View style={styles.focusModeCopy}>
              <Text style={[styles.focusModeTitle, { color: theme.ink }]}>ADHD mode</Text>
              <Text style={[styles.focusModeDescription, { color: theme.muted }]}>A calmer study flow with one clear next step and short five-card practice rounds.</Text>
            </View>
            <Switch
              accessibilityLabel="ADHD mode"
              accessibilityHint="Simplifies the Today screen and adds short, optional practice rounds. This is a display and study preference, not a diagnosis."
              value={state.adhdModeEnabled}
              onValueChange={setAdhdModeEnabled}
              trackColor={{ false: theme.line, true: theme.forestBorder }}
              thumbColor={state.adhdModeEnabled ? theme.forest : (isDark ? '#334155' : '#FFFFFF')}
            />
          </View>
          <Text style={[styles.focusModePrivacy, { color: theme.faint }]}>This preference is saved with your learning settings. It does not record an ADHD diagnosis.</Text>
        </Surface>
      </View>

      <View style={styles.sectionContainer}>
        <SectionTitle title="Appearance" />
        <ThemeSelector />
      </View>

      {/* Primary KPI Grid */}
      <View style={styles.kpiGrid}>
        <Surface style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Text style={[styles.kpiLabel, { color: theme.muted }]}>STREAK</Text>
            <IconTile icon={Flame} background={theme.coralSoft} color={theme.coral} size={30} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.ink }]}>{state.streak}d</Text>
          <Text style={[styles.kpiSub, { color: theme.faint }]}>Consecutive study</Text>
        </Surface>

        <Surface style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Text style={[styles.kpiLabel, { color: theme.muted }]}>RETENTION</Text>
            <IconTile icon={Award} background={theme.forestSoft} color={theme.forest} size={30} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.ink }]}>{accuracy}%</Text>
          <Text style={[styles.kpiSub, { color: theme.faint }]}>Recall accuracy</Text>
        </Surface>

        <Surface style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Text style={[styles.kpiLabel, { color: theme.muted }]}>MASTERY</Text>
            <IconTile icon={CheckCircle2} background={theme.blueSoft} color={theme.blue} size={30} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.ink }]}>{counts.percent}%</Text>
          <Text style={[styles.kpiSub, { color: theme.faint }]}>
            {counts.mastered}/{counts.total} skills
          </Text>
        </Surface>

        <Surface style={styles.kpiCard}>
          <View style={styles.kpiTop}>
            <Text style={[styles.kpiLabel, { color: theme.muted }]}>REPS</Text>
            <IconTile icon={Layers3} background={theme.lineSubtle} color={theme.muted} size={30} />
          </View>
          <Text style={[styles.kpiValue, { color: theme.ink }]}>{state.totalAnswers}</Text>
          <Text style={[styles.kpiSub, { color: theme.faint }]}>Cards reviewed</Text>
        </Surface>
      </View>

      {/* 7-Day Activity Chart */}
      <View style={styles.sectionContainer}>
        <SectionTitle title="Weekly Activity" />
        <Surface style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={[styles.chartTitle, { color: theme.ink }]}>{weeklyTotal} prompts</Text>
              <Text style={[styles.chartSubtitle, { color: theme.muted }]}>Completed in past 7 days</Text>
            </View>
            <Pill background={theme.forestSoft} color={theme.forest} icon={BarChart3}>
              ACTIVITY
            </Pill>
          </View>

          <View style={styles.chartBars}>
            {weekly.map((item, index) => {
              const heightPercent = item.count > 0 ? Math.max(16, (item.count / maxActivity) * 100) : 6;
              return (
                <View key={index} style={styles.chartBarCol}>
                  <Text style={[styles.chartBarValue, { color: theme.muted }]}>{item.count > 0 ? item.count : ''}</Text>
                  <View style={[styles.barTrack, { backgroundColor: theme.lineSubtle }]}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPercent}%` },
                        { backgroundColor: item.today ? theme.forest : theme.forestBorder },
                      ]}
                    />
                  </View>
                  <Text style={[styles.chartDayLabel, { color: item.today ? theme.forest : theme.muted }]}>
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </Surface>
      </View>

      {/* Daily Study Goal Configuration */}
      <View style={styles.sectionContainer}>
        <SectionTitle title="Daily Study Target" />
        <Surface style={styles.goalConfigCard}>
          <View style={styles.goalHeader}>
            <IconTile icon={Clock} background={theme.forestSoft} color={theme.forest} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.goalTitle, { color: theme.ink }]}>
                {state.dailyMinutes === 60 ? '1 Hour' : `${state.dailyMinutes} Minutes`} per day
              </Text>
              <Text style={[styles.goalSub, { color: theme.muted }]}>
                Estimated ~{estimate} days to master both Hiragana & Katakana
              </Text>
            </View>
          </View>

          <View style={styles.goalOptionsRow}>
            {GOALS.map((minutes) => {
              const active = state.dailyMinutes === minutes;
              return (
                <Pressable
                  key={minutes}
                  accessibilityRole="button"
                  accessibilityLabel={`Set daily goal to ${minutes} minutes`}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    changeDailyMinutes(minutes);
                  }}
                  style={[
                    styles.goalPill,
                    { backgroundColor: active ? theme.forest : theme.lineSubtle, borderColor: active ? theme.forest : theme.line },
                  ]}
                >
                  <Text style={[styles.goalPillText, { color: active ? '#FFFFFF' : theme.ink }]}>
                    {minutes === 60 ? '1h' : `${minutes}m`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.goalForecast}>
            <Text style={[styles.goalForecastLabel, { color: theme.muted }]}>CURRICULUM FORECAST</Text>
            <ProgressBar value={counts.percent} color={theme.forest} height={6} />
            <Text style={[styles.goalForecastText, { color: theme.faint }]}>
              At {state.dailyMinutes} min/day, your foundation estimate automatically tunes based on your recall accuracy.
            </Text>
          </View>
        </Surface>
      </View>

      {/* Audio Engine & Preferences */}
      <View style={styles.sectionContainer}>
        <SectionTitle title="Audio & Hardware" />
        <Surface style={styles.utilityCard}>
          <View style={styles.utilityContent}>
            <IconTile icon={Volume2} background={theme.forestSoft} color={theme.forest} size={34} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.utilityTitle, { color: theme.ink }]}>Japanese Pronunciation Engine</Text>
              <Text style={[styles.utilitySub, { color: theme.muted }]}>
                Powered by native ja-JP text-to-speech synthesis
              </Text>
            </View>
          </View>
          <Button
            label="Test Audio"
            onPress={testVoice}
            variant="outline"
            icon={Volume2}
            style={styles.utilityButton}
          />
        </Surface>
      </View>

      {/* Sync & Security Status */}
      <Surface style={styles.syncCard}>
        <IconTile
          icon={supabaseConfigured ? ShieldCheck : Cloud}
          background={supabaseConfigured ? theme.forestSoft : theme.lineSubtle}
          color={supabaseConfigured ? theme.forest : theme.muted}
          size={36}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.syncTitle, { color: theme.ink }]}>
            {supabaseConfigured ? 'Cloud Sync Active' : 'Offline Local Storage'}
          </Text>
          <Text style={[styles.syncDesc, { color: theme.muted }]}>
            {supabaseConfigured
              ? 'Your study progress and streaks are synced securely.'
              : 'All flashcard reviews and writing streaks are saved securely on this device.'}
          </Text>
        </View>
      </Surface>

      {/* Data Management Section */}
      <View style={styles.sectionContainer}>
        <SectionTitle title="Data Management" />
        <Surface style={styles.dangerCard}>
          <View style={styles.utilityContent}>
            <IconTile icon={RotateCcw} background="#FEE2E2" color="#DC2626" size={34} />
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerTitle}>Reset Learning History</Text>
              <Text style={styles.dangerSub}>
                {confirmReset
                  ? 'Tap again to permanently clear all review streaks and card mastery.'
                  : 'Clear all local flashcard progress and restart from zero.'}
              </Text>
            </View>
          </View>
          <Button
            label={confirmReset ? 'Confirm Reset' : 'Reset Progress'}
            onPress={handleReset}
            variant={confirmReset ? 'danger' : 'outline'}
            style={styles.utilityButton}
          />
        </Surface>
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
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: 14,
    gap: 4,
  },
  kpiTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  kpiValue: {
    color: C.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  kpiSub: {
    color: C.faint,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 16,
  },
  focusModeCard: {
    padding: 16,
    gap: 10,
  },
  focusModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  focusModeCopy: {
    flex: 1,
    gap: 4,
  },
  focusModeTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  focusModeDescription: {
    fontSize: 12,
    lineHeight: 17,
  },
  focusModePrivacy: {
    fontSize: 10,
    lineHeight: 14,
  },
  chartCard: {
    padding: 16,
    gap: 14,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitle: {
    color: C.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  chartSubtitle: {
    color: C.muted,
    fontSize: 11,
    marginTop: 1,
  },
  chartBars: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingTop: 10,
  },
  chartBarCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  chartBarValue: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    height: 14,
  },
  barTrack: {
    width: '100%',
    flex: 1,
    backgroundColor: C.lineSubtle,
    borderRadius: R.xs,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: C.forestBorder,
    borderRadius: R.xs,
  },
  barFillToday: {
    backgroundColor: C.forest,
  },
  chartDayLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  chartDayLabelToday: {
    color: C.forest,
    fontWeight: '900',
  },
  goalConfigCard: {
    padding: 16,
    gap: 16,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalTitle: {
    color: C.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  goalSub: {
    color: C.muted,
    fontSize: 12,
    marginTop: 2,
  },
  goalOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  goalPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: R.sm,
    backgroundColor: C.lineSubtle,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPillActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  goalPillText: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  goalPillTextActive: {
    color: '#FFFFFF',
  },
  goalForecast: {
    borderTopWidth: 1,
    borderTopColor: C.lineSubtle,
    paddingTop: 12,
    gap: 8,
  },
  goalForecastLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  goalForecastText: {
    color: C.faint,
    fontSize: 11,
    lineHeight: 16,
  },
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    marginTop: 14,
  },
  syncTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  syncDesc: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  utilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  utilityContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  utilityTitle: {
    color: C.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  utilitySub: {
    color: C.muted,
    fontSize: 11,
    marginTop: 2,
  },
  utilityButton: {
    minHeight: 38,
    paddingHorizontal: 12,
  },
  dangerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  dangerTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '800',
  },
  dangerSub: {
    color: '#B91C1C',
    fontSize: 11,
    marginTop: 2,
  },
});
