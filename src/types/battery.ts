export interface BatteryStats {
  watts: number;
  isCharging: boolean;
  status: 'charging' | 'discharging' | 'full' | 'not_charging' | 'unknown';
  plugType: 'ac' | 'usb' | 'wireless' | 'none';
  voltageMv: number;
  voltageV: number;
  currentMa: number;
  currentUa: number;
  rawCurrent: number;
  batteryLevel: number;
  temperatureC: number;
  timestamp: number;
}

export interface ChargingSession {
  id: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  startLevel: number;
  endLevel: number;
  peakWatts: number;
  averageWatts: number;
  energyWh: number;
  plugType: 'ac' | 'usb' | 'wireless' | 'none';
}

export type SimulationPreset =
  | 'DISCHARGING'
  | 'SLOW_5W'
  | 'FAST_18W'
  | 'TURBO_33W'
  | 'PD_65W'
  | 'HYPER_120W';

export interface ChargingTier {
  label: string;
  color: string;
  glowColor: string;
  textColor: string;
  minWatts: number;
}
