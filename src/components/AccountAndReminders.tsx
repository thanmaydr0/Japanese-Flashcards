import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { useLearning } from '../context/LearningContext';
import { useTheme } from '../context/ThemeContext';
import { loadReminderSettings, ReminderSettings, REMINDER_TIMES, updateStudyReminders } from '../lib/notifications';
import { C, R } from '../theme';
import { AccountAccessCard } from './AccountAccessCard';
import { IconTile, SectionTitle, Surface } from './ui';

export function AccountAndReminders() {
  const { state } = useLearning();
  const { theme, isDark } = useTheme();
  const [settings, setSettings] = useState<ReminderSettings>({ enabled: false, hour: 19, remotePushRegistered: false });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadReminderSettings().then((saved) => {
      setSettings(saved);
      setLoaded(true);
    });
  }, []);

  const update = async (next: ReminderSettings) => {
    setSaving(true);
    try {
      const saved = await updateStudyReminders(state, next);
      setSettings(saved);
    } catch (error) {
      Alert.alert(
        'Notifications are off',
        error instanceof Error && error.message.includes('permission')
          ? 'Allow notifications in your device settings to get a friendly reminder.'
          : 'We could not update your reminder. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedTime = REMINDER_TIMES.find((time) => time.hour === settings.hour)?.label ?? '7 PM';

  return (
    <View style={styles.container}>
      <AccountAccessCard />

      <View style={styles.section}>
        <SectionTitle title="Study Reminders" />
        <Surface style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <IconTile icon={BellRing} background={theme.coralSoft} color={theme.coral} size={38} />
            <View style={styles.copy}>
              <Text style={[styles.cardTitle, { color: theme.ink }]}>A nudge from your fox</Text>
              <Text style={[styles.cardSub, { color: theme.muted }]}>One playful reminder on days you haven’t studied yet.</Text>
            </View>
            <Switch
              accessibilityLabel="Daily Japanese study reminders"
              value={settings.enabled}
              disabled={!loaded || saving}
              onValueChange={(enabled) => void update({ ...settings, enabled })}
              trackColor={{ false: theme.line, true: theme.forestBorder }}
              thumbColor={settings.enabled ? theme.forest : (isDark ? '#334155' : '#FFFFFF')}
            />
          </View>

          {settings.enabled ? (
            <>
              <View style={styles.timeRow}>
                <Text style={[styles.timeLabel, { color: theme.muted }]}>REMIND ME</Text>
                {REMINDER_TIMES.map((time) => {
                  const active = time.hour === settings.hour;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={`Set reminder time to ${time.label}`}
                      disabled={saving}
                      key={time.hour}
                      onPress={() => void update({ ...settings, hour: time.hour })}
                      style={[
                        styles.timeOption,
                        {
                          backgroundColor: active ? theme.forest : theme.lineSubtle,
                          borderColor: active ? theme.forest : theme.line,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          { color: active ? '#FFFFFF' : theme.muted },
                          active && styles.timeTextActive,
                        ]}
                      >
                        {time.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.deliveryNote, { color: theme.faint }]}>
                {settings.remotePushRegistered
                  ? `Firebase device token saved · ${selectedTime} local time`
                  : `On-device reminder set for ${selectedTime}. Cloud push delivery needs the secure Firebase sender to be enabled.`}
              </Text>
            </>
          ) : null}
        </Surface>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  section: { marginTop: 16 },
  copy: { flex: 1, gap: 3 },
  cardTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  cardSub: { color: C.muted, fontSize: 11, lineHeight: 16 },
  reminderCard: { padding: 14, gap: 14 },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeLabel: { color: C.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, marginRight: 'auto' },
  timeOption: {
    minHeight: 34,
    minWidth: 48,
    paddingHorizontal: 8,
    borderRadius: R.full,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionActive: { borderColor: C.forest, backgroundColor: C.forest },
  timeText: { color: C.muted, fontSize: 11, fontWeight: '800' },
  timeTextActive: { color: '#FFFFFF' },
  deliveryNote: { color: C.faint, fontSize: 10, lineHeight: 15 },
});
