import React, { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  FadeInDown,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import { SakuraParticles } from './SakuraParticles';
import { R, S, ThemeMode } from '../theme';

const PAGE_ENTERING = FadeInDown.duration(200).reduceMotion(ReduceMotion.System);

type IconComponent = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export function Page({
  children,
  contentStyle,
  scrollable = true,
}: {
  children: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}) {
  const { theme, isDark, isJapanese } = useTheme();

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {isJapanese ? <SakuraParticles /> : null}

      {scrollable ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.page, contentStyle]}
        >
          <Animated.View entering={PAGE_ENTERING} style={styles.pageContent}>
            {children}
          </Animated.View>
        </ScrollView>
      ) : (
        <View style={[styles.nonScrollable, contentStyle]}>
          <Animated.View entering={PAGE_ENTERING} style={styles.pageContent}>
            {children}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

export function AppMark({ small = false }: { small?: boolean }) {
  const { theme, isJapanese } = useTheme();

  const markBg = isJapanese ? theme.accent : theme.forest;
  const markTextColor = '#FFFFFF';

  return (
    <View
      style={[
        styles.mark,
        small && styles.markSmall,
        { backgroundColor: markBg },
      ]}
    >
      <Text style={[styles.markText, small && styles.markTextSmall, { color: markTextColor }]}>
        か
      </Text>
    </View>
  );
}

export function Eyebrow({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  const { theme } = useTheme();
  return <Text style={[styles.eyebrow, { color: color ?? theme.muted }]}>{children}</Text>;
}

export function PageHeading({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.headingRow}>
      <View style={styles.headingCopy}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Text style={[styles.heading, { color: theme.ink }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subheading, { color: theme.muted }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.ink }]}>{title}</Text>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <Text style={[styles.sectionAction, { color: theme.forest }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Surface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: theme.card,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: {
  options: { value: T; label: string; icon?: IconComponent }[];
  value: T;
  onChange: (val: T) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.segmentContainer,
        {
          backgroundColor: theme.lineSubtle,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            style={[
              styles.segmentOption,
              active && {
                backgroundColor: theme.card,
                borderColor: isDark ? theme.line : 'transparent',
                borderWidth: isDark ? 1 : 0,
                ...S.shadowSm,
              },
            ]}
          >
            {Icon ? (
              <Icon
                size={15}
                color={active ? theme.ink : theme.muted}
                strokeWidth={active ? 2.4 : 1.9}
              />
            ) : null}
            <Text
              style={[
                styles.segmentText,
                { color: active ? theme.ink : theme.muted },
                active && styles.segmentTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  style,
  labelStyle,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'quiet' | 'coral' | 'secondary' | 'danger';
  icon?: IconComponent;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}) {
  const { theme, isDark } = useTheme();

  const tone = {
    primary: {
      backgroundColor: theme.forest,
      borderColor: theme.forest,
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: theme.lineSubtle,
      borderColor: theme.line,
      color: theme.ink,
    },
    outline: {
      backgroundColor: theme.card,
      borderColor: theme.line,
      color: theme.ink,
    },
    quiet: {
      backgroundColor: theme.forestSoft,
      borderColor: theme.forestBorder,
      color: isDark ? theme.forest : theme.forestDark,
    },
    coral: {
      backgroundColor: theme.coral,
      borderColor: theme.coral,
      color: '#FFFFFF',
    },
    danger: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
      borderColor: isDark ? '#EF4444' : '#FECACA',
      color: isDark ? '#FCA5A5' : '#DC2626',
    },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      {Icon ? <Icon size={17} color={tone.color} strokeWidth={2.2} /> : null}
      <Text style={[styles.buttonText, { color: tone.color }, labelStyle]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({
  children,
  background,
  color,
  icon: Icon,
  style,
}: {
  children: React.ReactNode;
  background?: string;
  color?: string;
  icon?: IconComponent;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme, isDark } = useTheme();

  const finalBg = background ?? theme.forestSoft;
  const finalColor = color ?? (isDark ? theme.forest : theme.forestDark);

  return (
    <View style={[styles.pill, { backgroundColor: finalBg }, style]}>
      {Icon ? <Icon size={12} color={finalColor} strokeWidth={2.4} /> : null}
      <Text style={[styles.pillText, { color: finalColor }]}>{children}</Text>
    </View>
  );
}

export function ProgressBar({
  value,
  color,
  trackColor,
  height = 6,
}: {
  value: number;
  color?: string;
  trackColor?: string;
  height?: number;
}) {
  const { theme } = useTheme();
  const target = Math.min(100, Math.max(0, value));
  const progress = useSharedValue(target);
  const animatedFill = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  const finalColor = color ?? theme.forest;
  const finalTrack = trackColor ?? theme.line;

  useEffect(() => {
    progress.value = withTiming(target, {
      duration: 380,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [progress, target]);

  return (
    <View style={[styles.progressTrack, { height, backgroundColor: finalTrack }]}>
      <Animated.View style={[styles.progressFill, { backgroundColor: finalColor }, animatedFill]} />
    </View>
  );
}

export function IconTile({
  icon: Icon,
  background,
  color,
  size = 40,
}: {
  icon: IconComponent;
  background?: string;
  color?: string;
  size?: number;
}) {
  const { theme, isDark } = useTheme();

  const finalBg = background ?? theme.forestSoft;
  const finalColor = color ?? (isDark ? theme.forest : theme.forestDark);

  return (
    <View
      style={[
        styles.iconTile,
        { backgroundColor: finalBg, width: size, height: size, borderRadius: size * 0.3 },
      ]}
    >
      <Icon size={Math.round(size * 0.48)} color={finalColor} strokeWidth={2.2} />
    </View>
  );
}

export function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  subtitle,
  style,
}: {
  icon?: IconComponent;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: string | number;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();

  return (
    <Surface style={[styles.statCard, style]}>
      <View style={styles.statTop}>
        <Text style={[styles.statLabel, { color: theme.muted }]}>{label}</Text>
        {Icon ? <IconTile icon={Icon} background={iconBg} color={iconColor} size={30} /> : null}
      </View>
      <Text style={[styles.statValue, { color: theme.ink }]}>{value}</Text>
      {subtitle ? <Text style={[styles.statSub, { color: theme.faint }]}>{subtitle}</Text> : null}
    </Surface>
  );
}

export function ThemeSelector() {
  const { theme, themeMode, setThemeMode } = useTheme();

  const options: {
    mode: ThemeMode;
    label: string;
    sub: string;
    kanji: string;
    badgeColor: string;
    previewBg: string;
    previewBorder: string;
  }[] = [
    {
      mode: 'modern-light',
      label: 'Modern Light',
      sub: 'Clean Minimalist',
      kanji: '洋・昼',
      badgeColor: '#0D5247',
      previewBg: '#F8FAFC',
      previewBorder: '#E2E8F0',
    },
    {
      mode: 'modern-dark',
      label: 'Obsidian Dark',
      sub: 'Midnight Slate',
      kanji: '洋・夜',
      badgeColor: '#10B981',
      previewBg: '#0B0F17',
      previewBorder: '#1E293B',
    },
    {
      mode: 'japanese-light',
      label: 'Kyoto Washi',
      sub: 'Paper & Bamboo',
      kanji: '和・昼',
      badgeColor: '#C8392B',
      previewBg: '#F7F4EB',
      previewBorder: '#E8E1D3',
    },
    {
      mode: 'japanese-dark',
      label: 'Kyoto Midnight',
      sub: 'Lacquer & Gold Leaf',
      kanji: '和・夜',
      badgeColor: '#F6C15C',
      previewBg: '#0F0E11',
      previewBorder: '#2E2B36',
    },
  ];

  return (
    <View style={styles.themeGrid}>
      {options.map((item) => {
        const active = themeMode === item.mode;
        return (
          <Pressable
            key={item.mode}
            accessibilityRole="button"
            accessibilityLabel={`Switch theme to ${item.label}`}
            onPress={() => setThemeMode(item.mode)}
            style={({ pressed }) => [
              styles.themeTile,
              {
                backgroundColor: item.previewBg,
                borderColor: active ? theme.forest : item.previewBorder,
                borderWidth: active ? 2 : 1,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={styles.themeTileTop}>
              <View
                style={[
                  styles.themeKanjiTag,
                  { backgroundColor: item.badgeColor + (item.mode.includes('dark') ? '40' : '20') },
                ]}
              >
                <Text style={[styles.themeKanjiText, { color: item.badgeColor }]}>
                  {item.kanji}
                </Text>
              </View>
              {active ? (
                <View style={[styles.activeDot, { backgroundColor: theme.forest }]} />
              ) : null}
            </View>

            <Text
              style={[
                styles.themeTileLabel,
                { color: item.mode.includes('dark') ? '#FAF8F5' : '#0F172A' },
              ]}
            >
              {item.label}
            </Text>
            <Text
              style={[
                styles.themeTileSub,
                { color: item.mode.includes('dark') ? '#94A3B8' : '#64748B' },
              ]}
            >
              {item.sub}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ui = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  spread: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gap6: { gap: 6 },
  gap8: { gap: 8 },
  gap12: { gap: 12 },
  gap16: { gap: 16 },
  mb8: { marginBottom: 8 },
  mb12: { marginBottom: 12 },
  mb16: { marginBottom: 16 },
  mb20: { marginBottom: 20 },
  mb24: { marginBottom: 24 },
  mb28: { marginBottom: 28 },
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mt24: { marginTop: 24 },
});

const styles = StyleSheet.create({
  safe: { flex: 1 },
  page: { width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 36 },
  nonScrollable: { flex: 1, width: '100%', maxWidth: 840, alignSelf: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 },
  pageContent: { width: '100%' },
  mark: { width: 40, height: 40, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
  markSmall: { width: 32, height: 32, borderRadius: R.sm },
  markText: { fontSize: 22, fontWeight: '800', marginTop: -2 },
  markTextSmall: { fontSize: 17 },
  eyebrow: { fontSize: 11, letterSpacing: 1.1, fontWeight: '800', textTransform: 'uppercase' },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 },
  headingCopy: { flex: 1, gap: 4 },
  heading: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6, marginTop: 4 },
  subheading: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  sectionAction: { fontSize: 13, fontWeight: '700' },
  surface: {
    borderWidth: 1,
    borderRadius: R.lg,
    padding: 16,
    ...S.shadowSm,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: R.md,
    padding: 3,
    borderWidth: 1,
  },
  segmentOption: {
    flex: 1,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: R.sm,
    paddingHorizontal: 8,
  },
  segmentText: { fontSize: 12, fontWeight: '700' },
  segmentTextActive: { fontWeight: '800' },
  button: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderRadius: R.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.1 },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: R.full,
    minHeight: 26,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
  progressTrack: { width: '100%', borderRadius: R.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: R.full },
  iconTile: { alignItems: 'center', justifyContent: 'center' },
  statCard: { flex: 1, minWidth: 130, padding: 14, borderRadius: R.md },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  statLabel: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statSub: { fontSize: 11, marginTop: 3 },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeTile: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: R.md,
    gap: 4,
    ...S.shadowSm,
  },
  themeTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  themeKanjiTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: R.xs,
  },
  themeKanjiText: {
    fontSize: 10,
    fontWeight: '800',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  themeTileLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  themeTileSub: {
    fontSize: 10,
    fontWeight: '600',
  },
});
