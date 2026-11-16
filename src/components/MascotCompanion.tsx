import React, { useMemo, useState } from 'react';
import {
  Animated,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';
import { useLearning } from '../context/LearningContext';
import { useTheme } from '../context/ThemeContext';
import {
  getMascotMood,
  MascotMood,
  syncDynamicMascotIcon,
} from '../lib/dynamicIcon';
import { R, S } from '../theme';
import { Eyebrow, Pill, Surface } from './ui';

const MASCOT_IMAGES: Record<MascotMood, ImageSourcePropType> = {
  default: require('../../assets/kana-path-icon.png'),
  afternoon: require('../../assets/kana-path-afternoon-icon.png'),
  evening: require('../../assets/kana-path-evening-icon.png'),
  night: require('../../assets/kana-path-night-icon.png'),
  streak: require('../../assets/kana-path-streak-icon.png'),
  legendary: require('../../assets/kana-path-legendary-icon.png'),
};

const MOOD_DATA: { mood: MascotMood; label: string; tag: string }[] = [
  { mood: 'default', label: 'Morning', tag: 'Cheerful' },
  { mood: 'afternoon', label: 'Midday', tag: 'Focus' },
  { mood: 'evening', label: 'Dusk', tag: 'Urgent' },
  { mood: 'night', label: 'Night', tag: 'Sleepy' },
  { mood: 'streak', label: 'On Fire', tag: 'Protected' },
  { mood: 'legendary', label: 'Master', tag: '7+ Days' },
];

export function MascotCompanion() {
  const { state } = useLearning();
  const { theme } = useTheme();

  const dynamicInfo = useMemo(
    () => getMascotMood(state.streak, state.lastStudyDay),
    [state.streak, state.lastStudyDay]
  );

  const [activeMood, setActiveMood] = useState<MascotMood>(dynamicInfo.mood);
  const [bounceAnim] = useState(() => new Animated.Value(1));

  const triggerBounce = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounceAnim.setValue(1);
    Animated.sequence([
      Animated.spring(bounceAnim, {
        toValue: 1.15,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.spring(bounceAnim, {
        toValue: 1.0,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const selectMood = (m: MascotMood) => {
    void Haptics.selectionAsync();
    setActiveMood(m);
    triggerBounce();
    void syncDynamicMascotIcon(state.streak, state.lastStudyDay, new Date(), m).catch(() => undefined);
  };

  const currentDialogue = useMemo(() => {
    if (activeMood === dynamicInfo.mood) return dynamicInfo.dialogue;
    switch (activeMood) {
      case 'default':
        return 'Ohayou gozaimasu! Ready for morning kana?';
      case 'afternoon':
        return "Focus time! Headband on, let's practice!";
      case 'evening':
        return "Don't let our streak break! Please review! 🥺";
      case 'night':
        return 'Almost bedtime... Quick review before sleep? 🌙';
      case 'streak':
        return 'Streak secured for today! Flame on!';
      case 'legendary':
        return 'Sensational! 7+ Day Master Streak! 👑';
    }
  }, [activeMood, dynamicInfo]);

  return (
    <Surface style={[styles.card, { borderColor: theme.line }]}>
      <View style={styles.topRow}>
        <View style={styles.metaCol}>
          <View style={styles.badgeRow}>
            <Eyebrow color={theme.forest}>PIXEL MASCOT</Eyebrow>
            <Pill background={theme.forestSoft} color={theme.forest}>
              {activeMood.toUpperCase()}
            </Pill>
          </View>
          <Text style={[styles.title, { color: theme.ink }]}>Kitsune Sensei</Text>
          <Text style={[styles.speechBubble, { color: theme.muted, backgroundColor: theme.lineSubtle }]}>
            “{currentDialogue}”
          </Text>
        </View>

        {/* Mascot Avatar Frame */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tap Kitsune mascot for cheer"
          onPress={triggerBounce}
          style={styles.avatarWrap}
        >
          <Animated.View
            style={[
              styles.avatarFrame,
              { borderColor: theme.line, backgroundColor: theme.surface },
              { transform: [{ scale: bounceAnim }] },
            ]}
          >
            <Image
              source={MASCOT_IMAGES[activeMood]}
              style={styles.mascotImg}
              resizeMode="cover"
            />
            <View style={[styles.sparkleBadge, { backgroundColor: theme.coral }]}>
              <Sparkles size={11} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </Animated.View>
        </Pressable>
      </View>

      {/* Mood Selector Strip */}
      <View style={[styles.selectorBar, { borderTopColor: theme.lineSubtle }]}>
        <Text style={[styles.selectorHeading, { color: theme.faint }]}>
          DAILY MOOD:
        </Text>
        <View style={styles.chipRow}>
          {MOOD_DATA.map((item) => {
            const isSelected = activeMood === item.mood;
            return (
              <Pressable
                key={item.mood}
                accessibilityRole="button"
                accessibilityLabel={`${item.label} mood: ${item.tag}`}
                onPress={() => selectMood(item.mood)}
                style={[
                  styles.moodChip,
                  { backgroundColor: theme.lineSubtle, borderColor: theme.line },
                  isSelected && {
                    backgroundColor: theme.forestSoft,
                    borderColor: theme.forestBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.moodChipLabel,
                    { color: isSelected ? theme.forest : theme.muted },
                    isSelected && { fontWeight: '800' },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 14,
    borderRadius: R.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  metaCol: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  speechBubble: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    fontStyle: 'italic',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: R.sm,
    marginTop: 4,
  },
  avatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrame: {
    width: 76,
    height: 76,
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    ...S.shadowSm,
  },
  mascotImg: {
    width: '100%',
    height: '100%',
  },
  sparkleBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorBar: {
    borderTopWidth: 1,
    paddingTop: 10,
    gap: 8,
  },
  selectorHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  moodChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: R.full,
    borderWidth: 1,
  },
  moodChipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
