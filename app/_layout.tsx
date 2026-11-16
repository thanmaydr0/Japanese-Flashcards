import React, { useEffect } from 'react';
import { AppState } from 'react-native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LearningProvider, useLearning } from '../src/context/LearningContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { syncDynamicMascotIcon } from '../src/lib/dynamicIcon';
import { scheduleStudyReminder } from '../src/lib/notifications';

function AppNavigation() {
  const { state, loaded } = useLearning();
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (!loaded) return;
    const refreshDeviceFeatures = () => {
      void syncDynamicMascotIcon(state.streak, state.lastStudyDay).catch(() => undefined);
      void scheduleStudyReminder(state).catch(() => undefined);
    };
    refreshDeviceFeatures();
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') refreshDeviceFeatures();
    });
    return () => subscription.remove();
  }, [loaded, state]);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ title: 'Japy', headerShown: true }}>
          <Stack.Header style={{ backgroundColor: theme.bg, shadowColor: 'transparent' }} />
          <Stack.Toolbar placement="right" tintColor={theme.ink}>
            <Stack.Toolbar.Button
              accessibilityLabel="Open profile and settings"
              onPress={() => router.push('/(tabs)/profile' as never)}
            >
              Profile
            </Stack.Toolbar.Button>
          </Stack.Toolbar>
        </Stack.Screen>
        <Stack.Screen name="account" />
        <Stack.Screen name="auth-callback" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LearningProvider>
          <AppNavigation />
        </LearningProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
