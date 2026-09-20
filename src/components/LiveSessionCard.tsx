import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChargingSession } from '../types/battery';
import { Timer, Flame, TrendingUp, BatteryCharging, Battery } from 'lucide-react-native';

interface LiveSessionCardProps {
  activeSession: ChargingSession | null;
  currentLevel: number;
  isCharging: boolean;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = ({
  activeSession,
  currentLevel,
  isCharging,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isCharging || !activeSession) {
    return (
      <View style={styles.idleCard}>
        <Battery size={18} color="#475569" />
        <Text style={styles.idleText}>
          Plug into a charger to track session wattage & energy delivered.
        </Text>
      </View>
    );
  }

  const levelGain = Math.max(0, currentLevel - activeSession.startLevel);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveIndicatorRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.headerTitle}>ACTIVE CHARGING SESSION</Text>
        </View>
        <Text style={styles.timerText}>{formatDuration(activeSession.durationSeconds)}</Text>
      </View>

      <View style={styles.statsRow}>
        {/* Energy Delivered */}
        <View style={styles.statItem}>
          <View style={styles.statLabelRow}>
            <Flame size={13} color="#F59E0B" />
            <Text style={styles.statLabel}>ENERGY</Text>
          </View>
          <Text style={styles.statValue}>
            {activeSession.energyWh.toFixed(3)}
            <Text style={styles.statUnit}> Wh</Text>
          </Text>
        </View>

        {/* Peak Watts */}
        <View style={styles.statItem}>
          <View style={styles.statLabelRow}>
            <TrendingUp size={13} color="#10B981" />
            <Text style={styles.statLabel}>PEAK</Text>
          </View>
          <Text style={styles.statValue}>
            {activeSession.peakWatts.toFixed(1)}
            <Text style={styles.statUnit}> W</Text>
          </Text>
        </View>

        {/* Avg Watts */}
        <View style={styles.statItem}>
          <View style={styles.statLabelRow}>
            <Timer size={13} color="#06B6D4" />
            <Text style={styles.statLabel}>AVERAGE</Text>
          </View>
          <Text style={styles.statValue}>
            {activeSession.averageWatts.toFixed(1)}
            <Text style={styles.statUnit}> W</Text>
          </Text>
        </View>

        {/* Gain */}
        <View style={styles.statItem}>
          <View style={styles.statLabelRow}>
            <BatteryCharging size={13} color="#8B5CF6" />
            <Text style={styles.statLabel}>GAIN</Text>
          </View>
          <Text style={styles.statValue}>
            +{levelGain}
            <Text style={styles.statUnit}> %</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 10,
    marginBottom: 10,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    fontVariant: ['tabular-nums'],
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  idleCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#0B1120',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  idleText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
});
