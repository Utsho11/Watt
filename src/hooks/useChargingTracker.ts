import { useState, useEffect, useRef, useCallback } from 'react';
import { BatteryStats, ChargingSession, SimulationPreset } from '../types/battery';
import {
  isNativeBatteryModuleAvailable,
  startNativeTracking,
  stopNativeTracking,
  subscribeToBatteryUpdates,
} from '../services/battery/batteryNative';
import { generateSimulatedBatteryStats } from '../services/battery/batterySimulator';
import {
  getStoredSessions,
  saveChargingSession,
  clearAllChargingSessions,
  deleteChargingSession,
} from '../services/storage/sessionStorage';

const ROLLING_WINDOW_SIZE = 8;

export function useChargingTracker() {
  const [isNative] = useState(isNativeBatteryModuleAvailable);
  // Default to simulation if native module is not available
  const [simulationMode, setSimulationMode] = useState(!isNativeBatteryModuleAvailable);
  const [simulationPreset, setSimulationPreset] = useState<SimulationPreset>('FAST_18W');

  const [stats, setStats] = useState<BatteryStats>(() => {
    return generateSimulatedBatteryStats('FAST_18W');
  });

  const [smoothedWatts, setSmoothedWatts] = useState<number>(18.0);
  const [activeSession, setActiveSession] = useState<ChargingSession | null>(null);
  const [sessions, setSessions] = useState<ChargingSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const wattWindowRef = useRef<number[]>([]);
  const activeSessionRef = useRef<ChargingSession | null>(null);
  const lastUpdateTimestampRef = useRef<number>(Date.now());
  const sampleCountRef = useRef<number>(0);
  const wattSumRef = useRef<number>(0);

  // Load history from AsyncStorage on mount
  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    const loaded = await getStoredSessions();
    setSessions(loaded);
    setIsLoadingSessions(false);
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Handler for receiving a new battery stats update
  const processBatteryUpdate = useCallback((newStats: BatteryStats) => {
    const now = Date.now();
    const dtSeconds = Math.max(0.5, Math.min(5, (now - lastUpdateTimestampRef.current) / 1000));
    lastUpdateTimestampRef.current = now;

    // Rolling average smoothing
    const window = wattWindowRef.current;
    window.push(newStats.watts);
    if (window.length > ROLLING_WINDOW_SIZE) {
      window.shift();
    }
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length;
    setSmoothedWatts(+avg.toFixed(2));
    setStats(newStats);

    // Active session tracking lifecycle
    if (newStats.isCharging) {
      if (!activeSessionRef.current) {
        // Charging started
        const initialSession: ChargingSession = {
          id: `session_${now}_${Math.random().toString(36).substr(2, 6)}`,
          startTime: now,
          endTime: now,
          durationSeconds: 0,
          startLevel: newStats.batteryLevel,
          endLevel: newStats.batteryLevel,
          peakWatts: newStats.watts,
          averageWatts: newStats.watts,
          energyWh: 0,
          plugType: newStats.plugType,
        };
        sampleCountRef.current = 1;
        wattSumRef.current = newStats.watts;
        activeSessionRef.current = initialSession;
        setActiveSession(initialSession);
      } else {
        // Continue active session
        const current = activeSessionRef.current;
        sampleCountRef.current += 1;
        wattSumRef.current += newStats.watts;

        const deltaWh = (newStats.watts * dtSeconds) / 3600.0;
        const totalWh = +(current.energyWh + deltaWh).toFixed(4);
        const durationSec = Math.round((now - current.startTime) / 1000);
        const peak = Math.max(current.peakWatts, newStats.watts);
        const avgWatts = +(wattSumRef.current / sampleCountRef.current).toFixed(2);

        const updatedSession: ChargingSession = {
          ...current,
          endTime: now,
          durationSeconds: durationSec,
          endLevel: newStats.batteryLevel,
          peakWatts: peak,
          averageWatts: avgWatts,
          energyWh: totalWh,
          plugType: newStats.plugType,
        };
        activeSessionRef.current = updatedSession;
        setActiveSession(updatedSession);
      }
    } else {
      // Not charging: if a session was active, finalize and persist it
      if (activeSessionRef.current) {
        const completed = activeSessionRef.current;
        // Only save sessions longer than 3 seconds
        if (completed.durationSeconds >= 3) {
          saveChargingSession(completed).then(() => {
            refreshSessions();
          });
        }
        activeSessionRef.current = null;
        setActiveSession(null);
        sampleCountRef.current = 0;
        wattSumRef.current = 0;
      }
    }
  }, [refreshSessions]);

  // Track either native module or simulation
  useEffect(() => {
    if (!simulationMode && isNative) {
      startNativeTracking();
      const unsubscribe = subscribeToBatteryUpdates((data) => {
        processBatteryUpdate(data);
      });
      return () => {
        unsubscribe();
        stopNativeTracking();
      };
    } else {
      // Simulation mode interval: ticks every 1.5 seconds
      const interval = setInterval(() => {
        const simulated = generateSimulatedBatteryStats(simulationPreset);
        processBatteryUpdate(simulated);
      }, 1500);

      // Trigger immediate tick
      processBatteryUpdate(generateSimulatedBatteryStats(simulationPreset));

      return () => clearInterval(interval);
    }
  }, [simulationMode, isNative, simulationPreset, processBatteryUpdate]);

  const clearHistory = useCallback(async () => {
    await clearAllChargingSessions();
    setSessions([]);
  }, []);

  const removeSession = useCallback(async (id: string) => {
    const updated = await deleteChargingSession(id);
    setSessions(updated);
  }, []);

  return {
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
    refreshSessions,
  };
}
