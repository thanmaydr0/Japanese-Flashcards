import React from 'react';
import { Tabs } from 'expo-router';
import {
  BookOpenCheck,
  Compass,
  House,
  Layers3,
  UserRound,
} from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';

const iconMap = {
  index: House,
  path: Compass,
  practice: BookOpenCheck,
  kana: Layers3,
  profile: UserRound,
} as const;

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = iconMap[route.name as keyof typeof iconMap] ?? House;
        return {
          headerShown: false,
          sceneStyle: { backgroundColor: theme.bg },
          tabBarActiveTintColor: theme.tabActive,
          tabBarInactiveTintColor: theme.tabInactive,
          tabBarStyle: {
            height: 68,
            paddingTop: 8,
            paddingBottom: 8,
            backgroundColor: theme.tabBg,
            borderTopColor: theme.tabBorder,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused }) => (
            <Icon size={20} color={color} strokeWidth={focused ? 2.4 : 1.8} />
          ),
          tabBarHideOnKeyboard: true,
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="path" options={{ title: 'Curriculum' }} />
      <Tabs.Screen name="practice" options={{ title: 'Practice' }} />
      <Tabs.Screen name="kana" options={{ title: 'Kana Chart' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
