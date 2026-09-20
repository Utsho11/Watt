import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Zap, History, Activity } from 'lucide-react-native';

import { useChargingTracker } from './src/hooks/useChargingTracker';
import { LiveWattageHero } from './src/components/LiveWattageHero';
import { MetricsGrid } from './src/components/MetricsGrid';
import { LiveSessionCard } from './src/components/LiveSessionCard';
import { HistoryList } from './src/components/HistoryList';
import { SimulationControls } from './src/components/SimulationControls';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const {
    stats,
    smoothedWatts,
    activeSession,
    sessions,
    isLoadingSessions,
    isNative,
    simulationMode,
    setSimulationMode,
    simulationPreset,
    setSimulationPreset,
    clearHistory,
    removeSession,
  } = useChargingTracker();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Main App Container */}
      <View style={styles.container}>
        {/* Top App Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.logoBadge}>
              <Zap size={18} color="#10B981" fill="#10B981" />
            </View>
            <View>
              <Text style={styles.appTitle}>WATT TRACKER</Text>
              <Text style={styles.appSubtitle}>Real-time Android Charging Telemetry</Text>
            </View>
          </View>

          {/* Navigation Pill Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'live' && styles.tabButtonActive]}
              onPress={() => setActiveTab('live')}
            >
              <Activity size={14} color={activeTab === 'live' ? '#F8FAFC' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
                Live
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
              onPress={() => setActiveTab('history')}
            >
              <History size={14} color={activeTab === 'history' ? '#F8FAFC' : '#64748B'} />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                Logs ({sessions.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content Area */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Simulation & Hardware Control Bar */}
          <SimulationControls
            isNative={isNative}
            simulationMode={simulationMode}
            onToggleSimulationMode={setSimulationMode}
            currentPreset={simulationPreset}
            onSelectPreset={setSimulationPreset}
          />

          {activeTab === 'live' ? (
            <>
              {/* Reactive Live Wattage Hero Ring */}
              <LiveWattageHero
                watts={stats.watts}
                smoothedWatts={smoothedWatts}
                isCharging={stats.isCharging}
              />

              {/* Active Session Telemetry Card */}
              <LiveSessionCard
                activeSession={activeSession}
                currentLevel={stats.batteryLevel}
                isCharging={stats.isCharging}
              />

              {/* Hardware Telemetry Grid (V, mA, %, Temp) */}
              <MetricsGrid stats={stats} />
            </>
          ) : (
            /* History & Log Screen */
            <HistoryList
              sessions={sessions}
              isLoading={isLoadingSessions}
              onClearHistory={clearHistory}
              onRemoveSession={removeSession}
            />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080B10',
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#080B10',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#080B10',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1.2,
  },
  appSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#1E293B',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
});
