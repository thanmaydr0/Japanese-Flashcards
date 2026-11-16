import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, LockKeyhole, Mail, UserRound } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { Button, Eyebrow, Page, Surface } from '../src/components/ui';
import { useLearning } from '../src/context/LearningContext';
import { useTheme } from '../src/context/ThemeContext';
import { supabase } from '../src/lib/supabase';
import { R } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

type FormMode = 'create' | 'signIn';

const GOOGLE_REDIRECT = 'kanapath://google-auth';

function authErrorMessage(message: string) {
  if (message.toLowerCase().includes('manual linking')) {
    return 'Google sign-up is not enabled for this Supabase project yet. Turn on Google in Authentication → Providers, then try again.';
  }
  if (message.toLowerCase().includes('provider is not enabled')) {
    return 'Google sign-up needs the Google provider enabled in Authentication → Providers.';
  }
  return message;
}

export default function AccountScreen() {
  const { mode: requestedMode } = useLocalSearchParams<{ mode?: string }>();
  const { refreshCloudProgress } = useLearning();
  const { theme } = useTheme();
  const [modeOverride, setModeOverride] = useState<{ requestedMode: string | undefined; mode: FormMode } | null>(null);
  const mode = modeOverride && modeOverride.requestedMode === requestedMode
    ? modeOverride.mode
    : requestedMode === 'signIn' ? 'signIn' : 'create';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const selectMode = (nextMode: FormMode) => {
    setModeOverride({ requestedMode, mode: nextMode });
    setMessage('');
  };

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setAnonymous(data.user?.is_anonymous ?? true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setAnonymous(session?.user.is_anonymous ?? true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submitEmail = async () => {
    if (!supabase) {
      setMessage('Cloud accounts are unavailable because Supabase is not configured in this build.');
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setMessage('Enter your email and password to continue.');
      return;
    }
    if (mode === 'create' && password.length < 8) {
      setMessage('Choose a password with at least 8 characters.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) throw error;
        await refreshCloudProgress();
        router.back();
        return;
      }

      const { data: current } = await supabase.auth.getSession();
      if (current.session?.user.is_anonymous) {
        const { error } = await supabase.auth.updateUser({ email: cleanEmail, password });
        if (error) throw error;
        await refreshCloudProgress();
        setMessage('Check your inbox to confirm your email. Your study progress is linked to this account.');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { emailRedirectTo: 'kanapath://auth-callback' },
        });
        if (error) throw error;
        if (data.session) {
          await refreshCloudProgress();
          router.back();
        } else {
          setMessage('Check your inbox to confirm your email and finish creating your account.');
        }
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Account sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      setMessage('Cloud accounts are unavailable because Supabase is not configured in this build.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const { data: current } = await supabase.auth.getSession();
      const options = { redirectTo: GOOGLE_REDIRECT, skipBrowserRedirect: true } as const;
      let response = current.session
        ? await supabase.auth.linkIdentity({ provider: 'google', options })
        : await supabase.auth.signInWithOAuth({ provider: 'google', options });
      if (response.error && current.session?.user.is_anonymous) {
        response = await supabase.auth.signInWithOAuth({ provider: 'google', options });
      }
      if (response.error) throw response.error;
      if (!response.data.url) throw new Error('Google did not return a sign-in link.');

      const result = await WebBrowser.openAuthSessionAsync(response.data.url, GOOGLE_REDIRECT);
      if (result.type !== 'success') return;
      const fragment = result.url.split('#')[1] ?? '';
      const query = result.url.split('?')[1]?.split('#')[0] ?? '';
      const params = new URLSearchParams(fragment || query);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (!accessToken || !refreshToken) {
        const oauthError = params.get('error_description') ?? params.get('error');
        throw new Error(oauthError ?? 'Google sign-in did not return a session. Check the Supabase OAuth redirect settings.');
      }
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
      await refreshCloudProgress();
      router.back();
    } catch (error) {
      setMessage(error instanceof Error ? authErrorMessage(error.message) : 'Google sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page contentStyle={styles.page}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
        <ArrowLeft size={19} color={theme.ink} />
        <Text style={[styles.backText, { color: theme.inkSecondary }]}>Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Eyebrow color={theme.forest}>YOUR JAPY ACCOUNT</Eyebrow>
        <Text style={[styles.title, { color: theme.ink }]}>
          {mode === 'create' ? 'Create your account' : 'Welcome back'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>Your streak, lessons, and card mastery will follow you to your next device.</Text>
      </View>

      {userEmail && !anonymous ? (
        <Surface style={styles.signedInCard}>
          <UserRound size={22} color={theme.forest} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.signedInLabel, { color: theme.forest }]}>Signed in</Text>
            <Text style={[styles.signedInEmail, { color: theme.ink }]}>{userEmail}</Text>
          </View>
        </Surface>
      ) : null}

      <Surface style={styles.formCard}>
        <View style={[styles.modeRow, { backgroundColor: theme.lineSubtle, borderColor: theme.line }]}>
          {([
            ['create', 'Create account'],
            ['signIn', 'Sign in'],
          ] as const).map(([value, label]) => {
            const selected = mode === value;
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                key={value}
                onPress={() => {
                  selectMode(value);
                }}
                style={[
                  styles.modeOption,
                  selected && [styles.modeOptionSelected, { backgroundColor: theme.surface }],
                ]}
              >
                <Text
                  style={[
                    styles.modeText,
                    { color: selected ? theme.ink : theme.muted },
                    selected && styles.modeTextSelected,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>EMAIL</Text>
          <View style={[styles.inputWrap, { borderColor: theme.line, backgroundColor: theme.surface }]}>
            <Mail size={17} color={theme.muted} />
            <TextInput
              accessibilityLabel="Email address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.faint}
              returnKeyType="next"
              style={[styles.input, { color: theme.ink }]}
              textContentType="emailAddress"
              value={email}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: theme.muted }]}>PASSWORD</Text>
          <View style={[styles.inputWrap, { borderColor: theme.line, backgroundColor: theme.surface }]}>
            <LockKeyhole size={17} color={theme.muted} />
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
              onChangeText={setPassword}
              placeholder={mode === 'create' ? 'At least 8 characters' : 'Your password'}
              placeholderTextColor={theme.faint}
              returnKeyType="go"
              secureTextEntry
              onSubmitEditing={() => void submitEmail()}
              style={[styles.input, { color: theme.ink }]}
              textContentType={mode === 'create' ? 'newPassword' : 'password'}
              value={password}
            />
          </View>
        </View>

        {message ? (
          <Text
            accessibilityRole="alert"
            style={[styles.message, { color: theme.forest, backgroundColor: theme.forestSoft }]}
          >
            {message}
          </Text>
        ) : null}

        <Button
          label={mode === 'create' ? 'Create account with email' : 'Sign in with email'}
          onPress={() => void submitEmail()}
          disabled={busy}
          icon={busy ? undefined : Mail}
        />

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.line }]} />
          <Text style={[styles.dividerText, { color: theme.faint }]}>OR</Text>
          <View style={[styles.divider, { backgroundColor: theme.line }]} />
        </View>

        <Button
          label="Continue with Google"
          onPress={() => void signInWithGoogle()}
          disabled={busy}
          variant="outline"
        />
        {busy ? <ActivityIndicator color={theme.forest} style={styles.spinner} /> : null}
      </Surface>

      <Text style={[styles.privacyNote, { color: theme.faint }]}>
        {userEmail && !anonymous
          ? 'Your account is connected. Your study progress syncs securely.'
          : 'Email accounts keep your current guest progress. Google sign-up needs the Google provider enabled in your Supabase Auth settings.'}
      </Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 36 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 6, paddingRight: 12 },
  backText: { fontSize: 13, fontWeight: '700' },
  header: { gap: 5, marginTop: 16, marginBottom: 18 },
  title: { fontSize: 27, fontWeight: '900', letterSpacing: -0.6 },
  subtitle: { fontSize: 13, lineHeight: 18 },
  signedInCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12 },
  signedInLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  signedInEmail: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  formCard: { padding: 16, gap: 15 },
  modeRow: { flexDirection: 'row', padding: 3, borderRadius: R.md, borderWidth: 1 },
  modeOption: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: R.sm, paddingHorizontal: 6 },
  modeOptionSelected: {},
  modeText: { fontSize: 12, fontWeight: '700' },
  modeTextSelected: { fontWeight: '800' },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: R.md, borderWidth: 1 },
  input: { flex: 1, minHeight: 46, fontSize: 14, paddingVertical: 8 },
  message: { fontSize: 12, lineHeight: 17, borderRadius: R.sm, padding: 10 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 10, fontWeight: '800' },
  spinner: { marginTop: -4 },
  privacyNote: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 14 },
});
