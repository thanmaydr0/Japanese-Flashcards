import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import { LearningState } from './learning';
import { ensureCloudUser } from './cloud';
import { supabase } from './supabase';

const SETTINGS_KEY = 'kana-path:study-reminders:v1';
const REMINDER_KIND = 'daily-study-reminder';
const CHANNEL_ID = 'study-reminders';

export const REMINDER_TIMES = [
  { hour: 18, label: '6 PM' },
  { hour: 19, label: '7 PM' },
  { hour: 20, label: '8 PM' },
] as const;

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  remotePushRegistered: boolean;
};

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: false,
  hour: 19,
  remotePushRegistered: false,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(saved) as Partial<ReminderSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      hour: REMINDER_TIMES.some((time) => time.hour === parsed.hour) ? parsed.hour! : DEFAULT_SETTINGS.hour,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function saveReminderSettings(settings: ReminderSettings) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

async function prepareAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Study reminders',
    description: 'Friendly nudges for your daily Japanese practice.',
    importance: AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180, 100, 180],
    lightColor: '#0D5247',
    sound: 'default',
  });
}

async function cancelStudyReminder() {
  const pending = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    pending
      .filter((item) => item.content.data?.kind === REMINDER_KIND)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
}

function reminderCopy(state: LearningState) {
  if (state.adhdModeEnabled) {
    return {
      title: 'A small Japy step is ready',
      body: 'Try one short round of five kana cards. You can stop whenever you like.',
    };
  }
  if (state.streak >= 7) {
    return {
      title: 'Your fox is doing a victory dance 🦊',
      body: `Keep that ${state.streak}-day streak glowing with a tiny kana session.`,
    };
  }
  if (state.streak > 0) {
    return {
      title: 'Psst, your kana are waiting 🦊',
      body: `One little lesson keeps your ${state.streak}-day streak going.`,
    };
  }
  return {
    title: 'A tiny Japanese lesson?',
    body: 'Your fox found a few fresh flashcards. Come say こんにちは!',
  };
}

export async function scheduleStudyReminder(state: LearningState) {
  const settings = await loadReminderSettings();
  await cancelStudyReminder();
  if (!settings.enabled) return;

  const now = new Date();
  const next = new Date(now);
  next.setHours(settings.hour, 0, 0, 0);
  if (state.lastStudyDay === dayKey(now) || next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  const copy = reminderCopy(state);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      sound: 'default',
      data: { kind: REMINDER_KIND },
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: next,
      channelId: CHANNEL_ID,
    },
  });
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function registerFirebaseToken(hour: number) {
  if (Platform.OS !== 'android' || !supabase) return false;
  try {
    const [pushToken, user] = await Promise.all([
      Notifications.getDevicePushTokenAsync(),
      ensureCloudUser(),
    ]);
    if (!user || pushToken.type !== 'android') return false;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const { error } = await supabase.from('push_devices').upsert(
      {
        user_id: user.id,
        token: String(pushToken.data),
        platform: 'android',
        enabled: true,
        timezone,
        reminder_hour: hour,
        reminder_minute: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' },
    );
    return !error;
  } catch {
    return false;
  }
}

async function disableFirebaseToken() {
  if (Platform.OS !== 'android' || !supabase) return;
  try {
    const [pushToken, user] = await Promise.all([
      Notifications.getDevicePushTokenAsync(),
      ensureCloudUser(),
    ]);
    if (!user || pushToken.type !== 'android') return;
    await supabase
      .from('push_devices')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('token', String(pushToken.data));
  } catch {
    // Local reminders can be disabled even when cloud sync is offline.
  }
}

export async function updateStudyReminders(
  state: LearningState,
  settings: ReminderSettings,
): Promise<ReminderSettings> {
  await prepareAndroidChannel();
  if (!settings.enabled) {
    await cancelStudyReminder();
    await disableFirebaseToken();
    const nextSettings = { ...settings, remotePushRegistered: false };
    await saveReminderSettings(nextSettings);
    return nextSettings;
  }

  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw new Error('Notification permission was not granted.');

  const remotePushRegistered = await registerFirebaseToken(settings.hour);
  const nextSettings = { ...settings, remotePushRegistered };
  await saveReminderSettings(nextSettings);
  await scheduleStudyReminder({ ...state, lastStudyDay: state.lastStudyDay });
  return nextSettings;
}
