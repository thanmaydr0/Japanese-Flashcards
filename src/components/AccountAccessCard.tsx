import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, UserRound } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { C, R } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { IconTile, SectionTitle, Surface } from './ui';

type AuthMode = 'create' | 'signIn';

export function AccountAccessCard({ heading = 'Your Account' }: { heading?: string }) {
  const { theme } = useTheme();
  const [email, setEmail] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(true);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setEmail(data.session?.user.email ?? null);
      setAnonymous(data.session?.user.is_anonymous ?? true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
      setAnonymous(session?.user.is_anonymous ?? true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const openAccount = (mode: AuthMode) => {
    router.push({ pathname: '/account', params: { mode } } as never);
  };

  const connected = Boolean(email && !anonymous);

  return (
    <View style={styles.section}>
      <SectionTitle title={heading} />
      <Surface style={styles.card}>
        <View style={styles.accountRow}>
          <IconTile icon={UserRound} background={theme.forestSoft} color={theme.forest} size={38} />
          <View style={styles.copy}>
            <Text style={[styles.cardTitle, { color: theme.ink }]}>
              {connected ? 'Account connected' : 'Keep your progress safe'}
            </Text>
            <Text style={[styles.cardSub, { color: theme.muted }]}>
              {connected
                ? email
                : 'Sync your lessons across devices with email or Google.'}
            </Text>
          </View>
          {connected ? <ChevronRight size={20} color={theme.forest} /> : null}
        </View>

        {connected ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openAccount('signIn')}
            style={[styles.manageAction, { borderColor: theme.line }]}
          >
            <Text style={[styles.secondaryText, { color: theme.ink }]}>Manage account</Text>
          </Pressable>
        ) : (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Create an account with email or Google"
              onPress={() => openAccount('create')}
              style={({ pressed }) => [
                styles.action,
                styles.primaryAction,
                { backgroundColor: theme.forest, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Text style={styles.primaryText}>Create account</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in to an existing account"
              onPress={() => openAccount('signIn')}
              style={({ pressed }) => [
                styles.action,
                styles.secondaryAction,
                { backgroundColor: theme.lineSubtle, borderColor: theme.line, opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={[styles.secondaryText, { color: theme.ink }]}>Sign in</Text>
            </Pressable>
          </View>
        )}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  card: { gap: 14, padding: 14 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 3 },
  cardTitle: { color: C.ink, fontSize: 14, fontWeight: '800' },
  cardSub: { color: C.muted, fontSize: 11, lineHeight: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { minHeight: 42, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: R.md, paddingHorizontal: 10 },
  primaryAction: {},
  secondaryAction: { borderWidth: 1 },
  primaryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  secondaryText: { color: C.ink, fontSize: 12, fontWeight: '800' },
  manageAction: { minHeight: 42, borderWidth: 1, borderRadius: R.md, alignItems: 'center', justifyContent: 'center' },
});
