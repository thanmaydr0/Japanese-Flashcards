import React, { useEffect } from 'react';
import { AppState, Pressable, Text } from 'react-native';
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
        <Stack.Screen
          name="(tabs)"
          options={{
            title: 'Japy',
            headerShown: true,
            headerStyle: { backgroundColor: theme.bg },
            headerTintColor: theme.ink,
            headerShadowVisible: false,
            headerRight: () => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open profile and settings"
                hitSlop={8}
                onPress={() => router.push('/(tabs)/profile' as never)}
                style={({ pressed }) => ({
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Text style={{ color: theme.ink, fontSize: 14, fontWeight: '700' }}>
                  Profile
                </Text>
              </Pressable>
            ),
          }}
        />
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
