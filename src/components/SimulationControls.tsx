import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SimulationPreset } from '../types/battery';
import { Sliders, Cpu } from 'lucide-react-native';

interface SimulationControlsProps {
  isNative: boolean;
  simulationMode: boolean;
  onToggleSimulationMode: (enabled: boolean) => void;
  currentPreset: SimulationPreset;
  onSelectPreset: (preset: SimulationPreset) => void;
}

const PRESETS: { key: SimulationPreset; label: string; watts: string; color: string }[] = [
  { key: 'SLOW_5W', label: '5W USB', watts: '5W', color: '#3B82F6' },
  { key: 'FAST_18W', label: '18W QC', watts: '18W', color: '#10B981' },
  { key: 'TURBO_33W', label: '33W Turbo', watts: '33W', color: '#F59E0B' },
  { key: 'PD_65W', label: '65W GaN', watts: '65W', color: '#EC4899' },
  { key: 'HYPER_120W', label: '120W Hyper', watts: '120W', color: '#A855F7' },
  { key: 'DISCHARGING', label: 'Unplug', watts: '0W', color: '#64748B' },
];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isNative,
  simulationMode,
  onToggleSimulationMode,
  currentPreset,
  onSelectPreset,
}) => {
  return (
    <View style={styles.container}>
      {/* Top Mode Bar */}
      <View style={styles.topBar}>
        <View style={styles.modeStatus}>
          <Cpu size={14} color={isNative ? '#10B981' : '#64748B'} />
          <Text style={styles.modeText}>
            Source: {isNative && !simulationMode ? 'Android Hardware (Native)' : 'Simulator Mode'}
          </Text>
        </View>

        {isNative && (
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => onToggleSimulationMode(!simulationMode)}
          >
            <Sliders size={13} color="#38BDF8" />
            <Text style={styles.toggleBtnText}>
              {simulationMode ? 'Use Native' : 'Simulate'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Preset Selector */}
      {(!isNative || simulationMode) && (
        <View style={styles.presetsSection}>
          <Text style={styles.presetsTitle}>TEST CHARGER PRESETS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsScroll}
          >
            {PRESETS.map((preset) => {
              const isSelected = currentPreset === preset.key;
              return (
                <TouchableOpacity
                  key={preset.key}
                  style={[
                    styles.presetPill,
                    isSelected && {
                      borderColor: preset.color,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    },
                  ]}
                  onPress={() => onSelectPreset(preset.key)}
                >
                  <View
                    style={[styles.presetDot, { backgroundColor: preset.color }]}
                  />
                  <Text
                    style={[
                      styles.presetLabel,
                      isSelected && { color: '#F8FAFC', fontWeight: '700' },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#0B1120',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  presetsSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  presetsTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  presetsScroll: {
    gap: 8,
  },
  presetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  presetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
