import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Button, Eyebrow, Page, Surface } from '../src/components/ui';
import { useLearning } from '../src/context/LearningContext';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/lib/supabase';

export default function AuthCallbackScreen() {
  const url = Linking.useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const { refreshCloudProgress } = useLearning();
  const { theme } = useTheme();
  const [message, setMessage] = useState('Confirming your email and restoring your progress…');

  useEffect(() => {
    if (!url || handledUrl.current === url) return;
    handledUrl.current = url;

    let active = true;
    const finishSignUp = async () => {
      if (!supabase) throw new Error('Supabase is not configured in this build.');

      const fragment = url.split('#')[1]?.split('?')[0] ?? '';
      const query = url.split('?')[1]?.split('#')[0] ?? '';
      const params = new URLSearchParams(fragment || query);
      const authError = params.get('error_description') ?? params.get('error');
      if (authError) throw new Error(authError);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error('This confirmation link is incomplete or has expired. Please sign in and request a new link.');
      }

      await refreshCloudProgress();
      if (active) router.replace('/(tabs)');
    };

    void finishSignUp().catch((error: unknown) => {
      if (!active) return;
      setMessage(error instanceof Error ? error.message : 'We could not confirm your email. Please try again.');
    });

    return () => {
      active = false;
    };
  }, [refreshCloudProgress, url]);

  const failed = message !== 'Confirming your email and restoring your progress…';

  return (
    <Page contentStyle={styles.page}>
      <Surface style={styles.card}>
        <View style={styles.copy}>
          <Eyebrow color={theme.forest}>YOUR KANA PATH</Eyebrow>
          <Text style={[styles.title, { color: theme.ink }]}>
            {failed ? 'Email confirmation' : 'Finishing sign-up'}
          </Text>
          <Text accessibilityRole={failed ? 'alert' : undefined} style={[styles.message, { color: failed ? theme.coral : theme.muted }]}>
            {message}
          </Text>
        </View>
        {failed ? <Button label="Back to account" onPress={() => router.replace('/account' as never)} variant="outline" /> : null}
      </Surface>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: 'center' },
  card: { gap: 22, padding: 20 },
  copy: { gap: 8 },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4 },
  message: { fontSize: 14, lineHeight: 20 },
});
