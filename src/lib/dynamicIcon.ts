import * as AppIcon from 'expo-quick-actions/icon';

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export type MascotMood = 'default' | 'afternoon' | 'evening' | 'night' | 'streak' | 'legendary';
export type DynamicIconName = 'afternoon' | 'evening' | 'night' | 'streak' | 'legendary' | null;

export function activeStreak(streak: number, lastStudyDay: string | null, now = new Date()) {
  if (!lastStudyDay || streak <= 0) return 0;
  const today = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return lastStudyDay === today || lastStudyDay === dayKey(yesterday) ? streak : 0;
}

export function getMascotMood(streak: number, lastStudyDay: string | null, now = new Date()): {
  mood: MascotMood;
  iconName: DynamicIconName;
  dialogue: string;
  subtext: string;
} {
  const currentStreak = activeStreak(streak, lastStudyDay, now);
  const today = dayKey(now);
  const studiedToday = lastStudyDay === today;

  if (currentStreak >= 7) {
    return {
      mood: 'legendary',
      iconName: 'legendary',
      dialogue: 'Sensational! 7+ Day Master Streak!',
      subtext: 'Kitsune Sensei has donned the golden crown & shades.',
    };
  }

  if (studiedToday && currentStreak > 0) {
    return {
      mood: 'streak',
      iconName: 'streak',
      dialogue: 'Streak secured for today! Flame on!',
      subtext: 'Practice is locked in. The fiery fox aura is blazing.',
    };
  }

  const hour = now.getHours();

  if (hour >= 5 && hour < 12) {
    return {
      mood: 'default',
      iconName: null,
      dialogue: 'Ohayou gozaimasu! Ready for morning kana?',
      subtext: 'A calm 10-minute session will set up your day.',
    };
  }

  if (hour >= 12 && hour < 18) {
    return {
      mood: 'afternoon',
      iconName: 'afternoon',
      dialogue: "Focus time! Headband on, let's practice!",
      subtext: 'Take a quick study break before evening.',
    };
  }

  if (hour >= 18 && hour < 22) {
    return {
      mood: 'evening',
      iconName: 'evening',
      dialogue: "Don't let our streak break! Please review! 🥺",
      subtext: 'Only a few hours left before midnight reset!',
    };
  }

  // Late night (22:00 to 04:59)
  return {
    mood: 'night',
    iconName: 'night',
    dialogue: 'Almost bedtime... Quick review before sleep? 🌙',
    subtext: 'Kitsune is getting sleepy, but believes in you!',
  };
}

export function iconForStreak(streak: number): DynamicIconName {
  if (streak >= 7) return 'legendary';
  if (streak > 0) return 'streak';
  return null;
}

export async function syncStreakIcon(streak: number) {
  if (!AppIcon.isSupported || !AppIcon.getIcon || !AppIcon.setIcon) return;
  const nextIcon = iconForStreak(streak);
  const currentIcon = await AppIcon.getIcon();
  const isDefault = currentIcon === null || currentIcon === 'Default';
  if ((nextIcon === null && isDefault) || currentIcon === nextIcon) return;
  await AppIcon.setIcon(nextIcon);
}

export async function syncDynamicMascotIcon(
  streak: number,
  lastStudyDay: string | null,
  now = new Date(),
  manualOverride?: MascotMood | null
) {
  if (!AppIcon.isSupported || !AppIcon.getIcon || !AppIcon.setIcon) return;
  const nextIcon = manualOverride
    ? manualOverride === 'default'
      ? null
      : (manualOverride as DynamicIconName)
    : getMascotMood(streak, lastStudyDay, now).iconName;

  const currentIcon = await AppIcon.getIcon();
  const isDefault = currentIcon === null || currentIcon === 'Default';
  if ((nextIcon === null && isDefault) || currentIcon === nextIcon) return;
  await AppIcon.setIcon(nextIcon);
}
