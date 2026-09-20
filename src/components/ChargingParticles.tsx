import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';

interface ChargingParticlesProps {
  watts: number;
  isCharging: boolean;
  color: string;
}

const { width } = Dimensions.get('window');
const PARTICLE_COUNT = 12;

interface SingleParticleProps {
  index: number;
  watts: number;
  isCharging: boolean;
  color: string;
}

const SingleParticle: React.FC<SingleParticleProps> = ({
  index,
  watts,
  isCharging,
  color,
}) => {
  const progress = useSharedValue(0);

  // Distribute particles across horizontal width
  const xOffset = ((index / (PARTICLE_COUNT - 1)) - 0.5) * (width * 0.7);
  const size = 3 + (index % 4) * 1.5;

  useEffect(() => {
    if (isCharging && watts > 0.5) {
      // Dynamic speed: 65W+ -> ~800ms travel, 18W -> ~1400ms, 5W -> ~2200ms
      const duration = Math.max(700, 2400 - watts * 20);
      const delay = (index * duration) / PARTICLE_COUNT;

      progress.value = 0;
      progress.value = withDelay(
        delay,
        withRepeat(
          withTiming(1, {
            duration,
            easing: Easing.linear,
          }),
          -1,
          false
        )
      );
    } else {
      progress.value = withTiming(0, { duration: 500 });
    }
  }, [isCharging, watts, index, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [90, -130]);
    const opacity = interpolate(
      progress.value,
      [0, 0.2, 0.8, 1],
      [0, isCharging ? 0.9 : 0, isCharging ? 0.9 : 0, 0]
    );
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.6, 1.2, 0.4]);

    return {
      transform: [
        { translateX: xOffset },
        { translateY },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const ChargingParticles: React.FC<ChargingParticlesProps> = ({
  watts,
  isCharging,
  color,
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <SingleParticle
          key={i}
          index={i}
          watts={watts}
          isCharging={isCharging}
          color={color}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});
