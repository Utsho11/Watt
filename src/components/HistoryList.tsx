import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ChargingSession } from '../types/battery';
import {
  History,
  Trash2,
  Zap,
  Clock,
  BatteryCharging,
  Flame,
} from 'lucide-react-native';

interface HistoryListProps {
  sessions: ChargingSession[];
  isLoading: boolean;
  onClearHistory: () => void;
  onRemoveSession: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  sessions,
  isLoading,
  onClearHistory,
  onRemoveSession,
}) => {
  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to remove all recorded charging sessions?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearHistory },
      ]
    );
  };

  const renderSessionItem = ({ item }: { item: ChargingSession }) => {
    const levelDelta = item.endLevel - item.startLevel;

    return (
      <View style={styles.sessionCard}>
        <View style={styles.cardTop}>
          <View style={styles.dateRow}>
            <Clock size={13} color="#94A3B8" />
            <Text style={styles.dateText}>{formatDate(item.startTime)}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.durationText}>{formatDuration(item.durationSeconds)}</Text>
          </View>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => onRemoveSession(item.id)}
          >
            <Trash2 size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsRow}>
          {/* Energy */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <Flame size={12} color="#F59E0B" />
              <Text style={styles.metricLabel}>ENERGY</Text>
            </View>
            <Text style={styles.metricValue}>
              {item.energyWh.toFixed(2)}
              <Text style={styles.metricUnit}> Wh</Text>
            </Text>
          </View>

          {/* Peak Watts */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <Zap size={12} color="#10B981" />
              <Text style={styles.metricLabel}>PEAK</Text>
            </View>
            <Text style={styles.metricValue}>
              {item.peakWatts.toFixed(1)}
              <Text style={styles.metricUnit}> W</Text>
            </Text>
          </View>

          {/* Avg Watts */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <Zap size={12} color="#06B6D4" />
              <Text style={styles.metricLabel}>AVG</Text>
            </View>
            <Text style={styles.metricValue}>
              {item.averageWatts.toFixed(1)}
              <Text style={styles.metricUnit}> W</Text>
            </Text>
          </View>

          {/* Level Gain */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <BatteryCharging size={12} color="#8B5CF6" />
              <Text style={styles.metricLabel}>LEVEL</Text>
            </View>
            <Text style={styles.metricValue}>
              {item.startLevel}% → {item.endLevel}%
            </Text>
            <Text style={styles.gainBadge}>
              {levelDelta >= 0 ? `+${levelDelta}%` : `${levelDelta}%`}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <History size={16} color="#38BDF8" />
          <Text style={styles.sectionTitle}>CHARGING LOG</Text>
          <Text style={styles.countBadge}>{sessions.length}</Text>
        </View>
        {sessions.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Recorded Sessions Yet</Text>
          <Text style={styles.emptySubtext}>
            Connect your device to a charger to start recording session wattage and energy delivery.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false} // Nested inside root ScrollView
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.8,
  },
  countBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 8,
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
  listContent: {
    gap: 10,
  },
  sessionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  dotSeparator: {
    color: '#475569',
    fontSize: 10,
  },
  durationText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'flex-start',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
  },
  gainBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  emptyContainer: {
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
});
