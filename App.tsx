import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Zap, History, Activity, Maximize2 } from 'lucide-react-native';

import { useChargingTracker } from './src/hooks/useChargingTracker';
import { LiveWattageHero } from './src/components/LiveWattageHero';
import { MetricsGrid } from './src/components/MetricsGrid';
import { LiveSessionCard } from './src/components/LiveSessionCard';
import { HistoryList } from './src/components/HistoryList';
import { SimulationControls } from './src/components/SimulationControls';
import { FullscreenChargingModal } from './src/components/FullscreenChargingModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [showFullscreenAnim, setShowFullscreenAnim] = useState(false);

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
            <Image
              source={require('./assets/icon.png')}
              style={styles.logoImage}
            />
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
              {/* Reactive Live Wattage Hero Ring (Tap to enter Fullscreen mode) */}
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setShowFullscreenAnim(true)}
              >
                <LiveWattageHero
                  watts={stats.watts}
                  smoothedWatts={smoothedWatts}
                  isCharging={stats.isCharging}
                />
              </TouchableOpacity>

              {/* Fullscreen Animation Mode Button */}
              <TouchableOpacity
                style={styles.fullscreenBtn}
                onPress={() => setShowFullscreenAnim(true)}
              >
                <Maximize2 size={13} color="#38BDF8" />
                <Text style={styles.fullscreenBtnText}>
                  Fullscreen Charging Animation
                </Text>
              </TouchableOpacity>

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

        {/* Immersive Fullscreen Charging Animation Modal */}
        <FullscreenChargingModal
          visible={showFullscreenAnim}
          onClose={() => setShowFullscreenAnim(false)}
          stats={stats}
          smoothedWatts={smoothedWatts}
          activeSession={activeSession}
        />
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
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 9,
    borderRadius: 10,
  },
  fullscreenBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
