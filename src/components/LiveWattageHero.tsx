import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Zap, ZapOff } from 'lucide-react-native';
import { getChargingTier } from '../utils/chargingTiers';

interface LiveWattageHeroProps {
  watts: number;
  smoothedWatts: number;
  isCharging: boolean;
}

const { width } = Dimensions.get('window');
const RING_SIZE = Math.min(width * 0.68, 260);

export const LiveWattageHero: React.FC<LiveWattageHeroProps> = ({
  watts,
  smoothedWatts,
  isCharging,
}) => {
  const tier = getChargingTier(smoothedWatts, isCharging);

  // Pulse animation driver
  const pulseAnim = useSharedValue(0);
  const rotationAnim = useSharedValue(0);

  useEffect(() => {
    if (isCharging && smoothedWatts > 0.2) {
      // Dynamic duration: faster pulse for higher wattage
      // 5W -> ~1600ms, 30W -> ~1000ms, 65W+ -> ~650ms
      const durationMs = Math.max(650, 1800 - smoothedWatts * 16);

      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: durationMs * 0.5, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
          withTiming(0, { duration: durationMs * 0.5, easing: Easing.bezier(0.5, 0, 0.75, 0) })
        ),
        -1,
        true
      );

      // Orbital rotation speed scales with wattage
      const rotSpeed = Math.max(1200, 4500 - smoothedWatts * 40);
      rotationAnim.value = withRepeat(
        withTiming(360, { duration: rotSpeed, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      // Calm idle breathing
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotationAnim.value = 0;
    }
  }, [isCharging, smoothedWatts, pulseAnim, rotationAnim]);

  const outerRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, isCharging ? 1.14 : 1.04]);
    const opacity = interpolate(pulseAnim.value, [0, 1], [0.3, isCharging ? 0.85 : 0.45]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const middleRingStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, isCharging ? 1.07 : 1.02]);
    const opacity = interpolate(pulseAnim.value, [0, 1], [0.5, isCharging ? 0.95 : 0.6]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const iconGlowStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, isCharging ? 1.15 : 1.0]);
    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Outer Pulse Waves */}
      <Animated.View
        style={[
          styles.waveRing,
          styles.outerRing,
          {
            borderColor: tier.color,
            shadowColor: tier.color,
          },
          outerRingStyle,
        ]}
      />

      <Animated.View
        style={[
          styles.waveRing,
          styles.middleRing,
          {
            borderColor: tier.color,
            shadowColor: tier.color,
          },
          middleRingStyle,
        ]}
      />

      {/* Main Energy Core Circle */}
      <View
        style={[
          styles.coreCircle,
          {
            borderColor: tier.color,
            shadowColor: tier.color,
          },
        ]}
      >
        {/* Top Icon Badge */}
        <Animated.View style={[styles.iconContainer, iconGlowStyle]}>
          {isCharging ? (
            <Zap size={22} color={tier.color} fill={tier.color} />
          ) : (
            <ZapOff size={20} color="#64748B" />
          )}
        </Animated.View>

        {/* Wattage Number Readout */}
        <View style={styles.wattageRow}>
          <Text style={[styles.wattageValue, { color: tier.color }]}>
            {isCharging ? smoothedWatts.toFixed(1) : '0.0'}
          </Text>
          <Text style={[styles.wattageUnit, { color: tier.textColor }]}>W</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.tierBadge, { backgroundColor: tier.glowColor }]}>
          <Text style={[styles.tierBadgeText, { color: tier.textColor }]}>
            {tier.label}
          </Text>
        </View>

        {/* Sub-label showing instant vs smoothed */}
        {isCharging && Math.abs(watts - smoothedWatts) > 0.3 && (
          <Text style={styles.instantaneousText}>
            Instant: {watts.toFixed(1)}W
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: RING_SIZE + 60,
    marginVertical: 12,
  },
  waveRing: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
  },
  outerRing: {
    width: RING_SIZE + 44,
    height: RING_SIZE + 44,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 6,
  },
  middleRing: {
    width: RING_SIZE + 22,
    height: RING_SIZE + 22,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
  },
  coreCircle: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: 9999,
    backgroundColor: '#0F172A',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 12,
    padding: 16,
  },
  iconContainer: {
    marginBottom: 4,
  },
  wattageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  wattageValue: {
    fontSize: 54,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    lineHeight: 62,
  },
  wattageUnit: {
    fontSize: 22,
    fontWeight: '700',
    marginLeft: 4,
    marginBottom: 8,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 8,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  instantaneousText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
});
