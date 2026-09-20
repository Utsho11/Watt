import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { X, Zap, Flame, Thermometer, Gauge, Activity } from 'lucide-react-native';
import { BatteryStats, ChargingSession } from '../types/battery';
import { getChargingTier } from '../utils/chargingTiers';
import { ChargingParticles } from './ChargingParticles';

interface FullscreenChargingModalProps {
  visible: boolean;
  onClose: () => void;
  stats: BatteryStats;
  smoothedWatts: number;
  activeSession: ChargingSession | null;
}

const { width, height } = Dimensions.get('window');
const CORE_SIZE = Math.min(width * 0.72, 280);

export const FullscreenChargingModal: React.FC<FullscreenChargingModalProps> = ({
  visible,
  onClose,
  stats,
  smoothedWatts,
  activeSession,
}) => {
  const tier = getChargingTier(smoothedWatts, stats.isCharging);

  const pulseAnim = useSharedValue(0);
  const spinAnim = useSharedValue(0);
  const spinCounterAnim = useSharedValue(0);

  useEffect(() => {
    if (visible && stats.isCharging) {
      const durationMs = Math.max(550, 1600 - smoothedWatts * 14);

      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1, { duration: durationMs * 0.5, easing: Easing.bezier(0.25, 1, 0.5, 1) }),
          withTiming(0, { duration: durationMs * 0.5, easing: Easing.bezier(0.5, 0, 0.75, 0) })
        ),
        -1,
        true
      );

      const spinDuration = Math.max(1200, 4200 - smoothedWatts * 35);
      spinAnim.value = withRepeat(
        withTiming(360, { duration: spinDuration, easing: Easing.linear }),
        -1,
        false
      );

      spinCounterAnim.value = withRepeat(
        withTiming(-360, { duration: spinDuration * 1.4, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      pulseAnim.value = 0;
      spinAnim.value = 0;
      spinCounterAnim.value = 0;
    }
  }, [visible, stats.isCharging, smoothedWatts, pulseAnim, spinAnim, spinCounterAnim]);

  const outerPulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.18]);
    const opacity = interpolate(pulseAnim.value, [0, 1], [0.35, 0.9]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const innerPulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.08]);
    return {
      transform: [{ scale }],
    };
  });

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinAnim.value}deg` }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinCounterAnim.value}deg` }],
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Background Particles */}
        <ChargingParticles
          watts={smoothedWatts}
          isCharging={stats.isCharging}
          color={tier.color}
        />

        {/* Top Header Row */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>CHARGING SYSTEM</Text>
            <Text style={[styles.headerSubtitle, { color: tier.textColor }]}>
              {tier.label}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Center Reactor Animation */}
        <View style={styles.centerSection}>
          {/* Outer Pulsing Wave Ring */}
          <Animated.View
            style={[
              styles.vortexRing,
              styles.outerRing,
              {
                borderColor: tier.color,
                shadowColor: tier.color,
              },
              outerPulseStyle,
            ]}
          />

          {/* Rotating Dashed Orbital Ring 1 */}
          <Animated.View
            style={[
              styles.vortexRing,
              styles.orbitRing1,
              { borderColor: tier.color },
              ring1Style,
            ]}
          />

          {/* Counter-Rotating Orbital Ring 2 */}
          <Animated.View
            style={[
              styles.vortexRing,
              styles.orbitRing2,
              { borderColor: tier.textColor },
              ring2Style,
            ]}
          />

          {/* Central Reactor Sphere */}
          <Animated.View
            style={[
              styles.coreCircle,
              {
                borderColor: tier.color,
                shadowColor: tier.color,
              },
              innerPulseStyle,
            ]}
          >
            <Zap size={26} color={tier.color} fill={tier.color} />

            <View style={styles.wattNumberRow}>
              <Text style={[styles.wattNumber, { color: tier.color }]}>
                {stats.isCharging ? smoothedWatts.toFixed(1) : '0.0'}
              </Text>
              <Text style={[styles.wattUnit, { color: tier.textColor }]}>W</Text>
            </View>

            <Text style={styles.batteryPercentText}>
              {stats.batteryLevel}% CHARGED
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Telemetry HUD */}
        <View style={styles.bottomHud}>
          <View style={styles.hudCard}>
            <Gauge size={14} color="#38BDF8" />
            <Text style={styles.hudLabel}>VOLTAGE</Text>
            <Text style={styles.hudValue}>
              {stats.voltageV.toFixed(2)} V
            </Text>
          </View>

          <View style={styles.hudCard}>
            <Activity size={14} color="#A855F7" />
            <Text style={styles.hudLabel}>CURRENT</Text>
            <Text style={styles.hudValue}>
              {Math.abs(stats.currentMa).toLocaleString()} mA
            </Text>
          </View>

          <View style={styles.hudCard}>
            <Flame size={14} color="#F59E0B" />
            <Text style={styles.hudLabel}>ENERGY</Text>
            <Text style={styles.hudValue}>
              {activeSession ? activeSession.energyWh.toFixed(2) : '0.00'} Wh
            </Text>
          </View>

          <View style={styles.hudCard}>
            <Thermometer size={14} color="#10B981" />
            <Text style={styles.hudLabel}>TEMP</Text>
            <Text style={styles.hudValue}>
              {stats.temperatureC.toFixed(1)} °C
            </Text>
          </View>
        </View>

        {/* Tap to exit prompt */}
        <TouchableOpacity style={styles.dismissPrompt} onPress={onClose}>
          <Text style={styles.dismissText}>Tap anywhere or close to exit</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#040711',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  headerInfo: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CORE_SIZE + 80,
  },
  vortexRing: {
    position: 'absolute',
    borderRadius: 9999,
  },
  outerRing: {
    width: CORE_SIZE + 50,
    height: CORE_SIZE + 50,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 24,
    elevation: 8,
  },
  orbitRing1: {
    width: CORE_SIZE + 24,
    height: CORE_SIZE + 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.7,
  },
  orbitRing2: {
    width: CORE_SIZE + 38,
    height: CORE_SIZE + 38,
    borderWidth: 1.5,
    borderStyle: 'dotted',
    opacity: 0.5,
  },
  coreCircle: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: 9999,
    backgroundColor: '#0B1120',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 12,
  },
  wattNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  wattNumber: {
    fontSize: 64,
    fontWeight: '900',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  wattUnit: {
    fontSize: 24,
    fontWeight: '800',
    marginLeft: 4,
    marginBottom: 10,
  },
  batteryPercentText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginTop: 4,
  },
  bottomHud: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  hudCard: {
    flex: 1,
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  hudLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  hudValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  dismissPrompt: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 11,
    color: '#475569',
  },
});
