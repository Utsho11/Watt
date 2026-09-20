import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BatteryStats } from '../types/battery';
import { Activity, Gauge, BatteryCharging, Thermometer, Cable, Radio } from 'lucide-react-native';

interface MetricsGridProps {
  stats: BatteryStats;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ stats }) => {
  const getTempColor = (tempC: number) => {
    if (tempC < 35) return '#10B981'; // Green
    if (tempC < 40) return '#F59E0B'; // Amber
    return '#EF4444'; // Red
  };

  const getPlugLabel = () => {
    switch (stats.plugType) {
      case 'ac':
        return 'Wall Charger (AC)';
      case 'usb':
        return 'USB Port';
      case 'wireless':
        return 'Wireless Qi';
      default:
        return stats.isCharging ? 'Connected' : 'Battery (Unplugged)';
    }
  };

  const tempColor = getTempColor(stats.temperatureC);

  return (
    <View style={styles.container}>
      {/* 2x2 Primary Hardware Telemetry Grid */}
      <View style={styles.grid}>
        {/* Voltage Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Gauge size={16} color="#38BDF8" />
            <Text style={styles.cardTitle}>VOLTAGE</Text>
          </View>
          <Text style={styles.primaryMetric}>
            {stats.voltageV > 0 ? stats.voltageV.toFixed(2) : (stats.voltageMv / 1000).toFixed(2)}
            <Text style={styles.metricUnit}> V</Text>
          </Text>
          <Text style={styles.subMetric}>
            {stats.voltageMv} mV
          </Text>
        </View>

        {/* Current Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Activity size={16} color="#A855F7" />
            <Text style={styles.cardTitle}>CURRENT</Text>
          </View>
          <Text style={styles.primaryMetric}>
            {Math.abs(stats.currentMa).toLocaleString()}
            <Text style={styles.metricUnit}> mA</Text>
          </Text>
          <Text style={styles.subMetric}>
            {(Math.abs(stats.currentMa) / 1000).toFixed(2)} A
          </Text>
        </View>

        {/* Battery Level Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BatteryCharging size={16} color="#10B981" />
            <Text style={styles.cardTitle}>BATTERY LEVEL</Text>
          </View>
          <Text style={styles.primaryMetric}>
            {stats.batteryLevel}
            <Text style={styles.metricUnit}> %</Text>
          </Text>
          {/* Mini progress bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, Math.max(0, stats.batteryLevel))}%` },
              ]}
            />
          </View>
        </View>

        {/* Temperature Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Thermometer size={16} color={tempColor} />
            <Text style={styles.cardTitle}>TEMPERATURE</Text>
          </View>
          <Text style={[styles.primaryMetric, { color: tempColor }]}>
            {stats.temperatureC.toFixed(1)}
            <Text style={styles.metricUnit}> °C</Text>
          </Text>
          <Text style={styles.subMetric}>
            {stats.temperatureC < 35 ? 'Cool' : stats.temperatureC < 40 ? 'Normal' : 'Hot'}
          </Text>
        </View>
      </View>

      {/* Source Connection Banner */}
      <View style={styles.sourceBanner}>
        <View style={styles.sourceRow}>
          {stats.plugType === 'wireless' ? (
            <Radio size={16} color="#94A3B8" />
          ) : (
            <Cable size={16} color="#94A3B8" />
          )}
          <Text style={styles.sourceLabel}>Power Source:</Text>
          <Text style={styles.sourceValue}>{getPlugLabel()}</Text>
        </View>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: stats.isCharging ? '#10B981' : '#64748B' },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  primaryMetric: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  subMetric: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  sourceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0B1120',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sourceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
