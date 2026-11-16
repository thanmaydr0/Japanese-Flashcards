import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Check, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { AccountAccessCard } from '../src/components/AccountAccessCard';
import {
  AppMark,
  Button,
  Eyebrow,
  Page,
  ProgressBar,
  Surface,
} from '../src/components/ui';
import { useLearning } from '../src/context/LearningContext';
import { useTheme } from '../src/context/ThemeContext';
import { formatDays, getPlanEstimate } from '../src/lib/learning';
import { C, R, S } from '../src/theme';

const DAILY_OPTIONS = [10, 15, 20, 30, 45, 60];

function minutesLabel(value: number) {
  return value === 60 ? '1 hour' : `${value} min`;
}

export default function WelcomeScreen() {
  const { state, loaded, completeSetup } = useLearning();
  const { theme } = useTheme();
  const [selectedMinutes, setSelectedMinutes] = useState(20);

  useEffect(() => {
    if (loaded && state.setupCompleted) router.replace('/(tabs)');
  }, [loaded, state.setupCompleted]);

  if (!loaded || state.setupCompleted) {
    return <View style={[styles.loading, { backgroundColor: theme.bg }]} />;
  }

  const estimate = getPlanEstimate({ ...state, dailyMinutes: selectedMinutes });

  const begin = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeSetup(selectedMinutes);
    router.replace('/(tabs)');
  };

  return (
    <Page contentStyle={styles.page}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <AppMark />
        <View>
          <Text style={[styles.brandTitle, { color: theme.ink }]}>Japy</Text>
          <Text style={[styles.brandSubtitle, { color: theme.muted }]}>Japanese Reading & Writing</Text>
        </View>
      </View>

      {/* Hero Pitch */}
      <View style={styles.heroSection}>
        <Eyebrow color={theme.forest}>PROFESSIONAL JAPANESE FOUNDATIONS</Eyebrow>
        <Text style={[styles.heroTitle, { color: theme.ink }]}>Master Kana with Daily Precision</Text>
        <Text style={[styles.heroLead, { color: theme.muted }]}>
          A structured, distraction-free curriculum designed to build instinctive recognition and correct stroke memory for Hiragana and Katakana.
        </Text>
      </View>

      {/* Sample Kana Showcase */}
      <Surface style={[styles.showcaseCard, { backgroundColor: theme.lineSubtle }]}>
        <View style={styles.showcaseKanaRow}>
          {[
            { kana: 'あ', romaji: 'a' },
            { kana: 'か', romaji: 'ka' },
            { kana: 'さ', romaji: 'sa' },
            { kana: 'た', romaji: 'ta' },
            { kana: 'な', romaji: 'na' },
          ].map((item) => (
            <View
              key={item.kana}
              style={[
                styles.kanaTile,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
            >
              <Text style={[styles.kanaTileGlyph, { color: theme.forest }]}>{item.kana}</Text>
              <Text style={[styles.kanaTileRomaji, { color: theme.muted }]}>{item.romaji}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.showcaseText, { color: theme.muted }]}>
          Traditional calligraphy grid · Spaced-repetition recall · Native pronunciation
        </Text>
      </Surface>

      {/* Target Setup */}
      <View style={styles.setupSection}>
        <View style={styles.setupHeader}>
          <Clock size={18} color={theme.forest} />
          <Text style={[styles.setupQuestion, { color: theme.ink }]}>Select your daily study target</Text>
        </View>

        <View style={styles.optionsGrid}>
          {DAILY_OPTIONS.map((minutes) => {
            const active = selectedMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                accessibilityRole="button"
                accessibilityLabel={`${minutes} minutes per day`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  void Haptics.selectionAsync();
                  setSelectedMinutes(minutes);
                }}
                style={[
                  styles.timeOption,
                  { backgroundColor: theme.surface, borderColor: theme.line },
                  active && { backgroundColor: theme.forest, borderColor: theme.forest },
                ]}
              >
                <Text
                  style={[
                    styles.timeVal,
                    { color: active ? '#FFFFFF' : theme.ink },
                  ]}
                >
                  {minutesLabel(minutes)}
                </Text>
                <Text
                  style={[
                    styles.timeDesc,
                    { color: active ? 'rgba(255,255,255,0.85)' : theme.muted },
                  ]}
                >
                  {minutes <= 15 ? 'Casual' : minutes <= 30 ? 'Recommended' : 'Intensive'}
                </Text>
                {active ? (
                  <View style={[styles.checkBadge, { backgroundColor: theme.coral }]}>
                    <Check size={10} color="#FFFFFF" strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Dynamic Forecast Surface */}
        <Surface style={styles.forecastCard}>
          <View style={styles.forecastHeader}>
            <View>
              <Text style={[styles.forecastLabel, { color: theme.muted }]}>PROJECTED MASTERY TIMELINE</Text>
              <Text style={[styles.forecastValue, { color: theme.forest }]}>~{formatDays(estimate)}</Text>
            </View>
            <View style={[styles.badgeMini, { backgroundColor: theme.forestSoft }]}>
              <Text style={[styles.badgeMiniText, { color: theme.forest }]}>Both Scripts</Text>
            </View>
          </View>
          <ProgressBar value={20} color={theme.forest} height={6} />
          <Text style={[styles.forecastSub, { color: theme.muted }]}>
            Estimated for complete Hiragana and Katakana fluency at {minutesLabel(selectedMinutes).toLowerCase()} a day. Your pace dynamically updates as you learn.
          </Text>
        </Surface>

        <AccountAccessCard heading="Save your progress" />

        {/* Start Button */}
        <Button
          label="Start Learning Path"
          onPress={begin}
          icon={ArrowRight}
          variant="primary"
          style={styles.startButton}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: C.bg },
  page: {
    paddingVertical: 24,
    gap: 20,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandTitle: {
    color: C.ink,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  brandSubtitle: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  heroSection: {
    gap: 6,
  },
  heroTitle: {
    color: C.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroLead: {
    color: C.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  showcaseCard: {
    padding: 16,
    gap: 14,
    backgroundColor: C.lineSubtle,
  },
  showcaseKanaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kanaTile: {
    flex: 1,
    maxWidth: 58,
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: R.sm,
    borderWidth: 1,
    borderColor: C.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    ...S.shadowSm,
  },
  kanaTileGlyph: {
    color: C.forest,
    fontSize: 22,
    fontWeight: '700',
  },
  kanaTileRomaji: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  showcaseText: {
    color: C.muted,
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  setupSection: {
    gap: 12,
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setupQuestion: {
    color: C.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeOption: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 90,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.md,
    padding: 12,
    position: 'relative',
    ...S.shadowSm,
  },
  timeOptionActive: {
    backgroundColor: C.forest,
    borderColor: C.forest,
  },
  timeVal: {
    color: C.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  timeValActive: {
    color: '#FFFFFF',
  },
  timeDesc: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  timeDescActive: {
    color: '#D1E7DD',
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastCard: {
    padding: 16,
    gap: 10,
  },
  forecastHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  forecastLabel: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  forecastValue: {
    color: C.forest,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  badgeMini: {
    backgroundColor: C.forestSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: R.xs,
  },
  badgeMiniText: {
    color: C.forest,
    fontSize: 10,
    fontWeight: '800',
  },
  forecastSub: {
    color: C.muted,
    fontSize: 11,
    lineHeight: 16,
  },
  startButton: {
    minHeight: 52,
    marginTop: 6,
  },
});
