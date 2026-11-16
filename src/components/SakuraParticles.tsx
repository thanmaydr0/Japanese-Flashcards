import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PETAL_COUNT = 12;

type PetalConfig = {
  id: number;
  startX: number;
  size: number;
  duration: number;
  delay: number;
  swayDist: number;
};

const PETALS: PetalConfig[] = Array.from({ length: PETAL_COUNT }, (_, index) => ({
  id: index,
  startX: Math.random() * SCREEN_WIDTH,
  size: 14 + Math.random() * 10,
  duration: 6500 + Math.random() * 4500,
  delay: index * 600,
  swayDist: 25 + Math.random() * 35,
}));

function SakuraPetal({ config, color }: { config: PetalConfig; color: string }) {
  const translateY = useSharedValue(-40);
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Vertical fall
    translateY.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(SCREEN_HEIGHT + 60, {
          duration: config.duration,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Horizontal sway
    translateX.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(config.swayDist, { duration: config.duration / 4, easing: Easing.inOut(Easing.quad) }),
          withTiming(-config.swayDist, { duration: config.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: config.duration / 4, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      )
    );

    // Tumbling rotation
    rotation.value = withDelay(
      config.delay,
      withRepeat(
        withTiming(360, {
          duration: config.duration * 0.8,
          easing: Easing.linear,
        }),
        -1,
        false
      )
    );

    // Fade in / out
    opacity.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(0.75, { duration: 800 }),
          withTiming(0.75, { duration: config.duration - 2000 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      )
    );
  }, [config, opacity, rotation, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.petalContainer,
        {
          left: config.startX,
          width: config.size,
          height: config.size * 1.3,
        },
        animatedStyle,
      ]}
    >
      <Svg viewBox="0 0 30 40" width="100%" height="100%">
        {/* Curved organic cherry blossom petal shape */}
        <Path
          d="M15 0 C24 8, 30 22, 22 34 C16 40, 14 40, 8 34 C0 22, 6 8, 15 0 Z"
          fill={color}
        />
      </Svg>
    </Animated.View>
  );
}

export function SakuraParticles() {
  const { isJapanese, isDark } = useTheme();

  if (!isJapanese) return null;

  const petalColor = isDark ? 'rgba(244, 114, 182, 0.45)' : 'rgba(224, 107, 132, 0.55)';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {PETALS.map((config) => (
        <SakuraPetal key={config.id} config={config} color={petalColor} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  petalContainer: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
});
