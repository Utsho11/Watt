import { BatteryStats, SimulationPreset } from '../../types/battery';

interface PresetConfig {
  targetWatts: number;
  voltageV: number;
  isCharging: boolean;
  plugType: 'ac' | 'usb' | 'wireless' | 'none';
  status: 'charging' | 'discharging' | 'full' | 'not_charging' | 'unknown';
  tempBase: number;
}

const PRESET_CONFIGS: Record<SimulationPreset, PresetConfig> = {
  DISCHARGING: {
    targetWatts: 0,
    voltageV: 3.85,
    isCharging: false,
    plugType: 'none',
    status: 'discharging',
    tempBase: 29.5,
  },
  SLOW_5W: {
    targetWatts: 5.0,
    voltageV: 5.0,
    isCharging: true,
    plugType: 'usb',
    status: 'charging',
    tempBase: 31.0,
  },
  FAST_18W: {
    targetWatts: 18.2,
    voltageV: 9.0,
    isCharging: true,
    plugType: 'ac',
    status: 'charging',
    tempBase: 33.8,
  },
  TURBO_33W: {
    targetWatts: 32.8,
    voltageV: 11.0,
    isCharging: true,
    plugType: 'ac',
    status: 'charging',
    tempBase: 36.2,
  },
  PD_65W: {
    targetWatts: 63.5,
    voltageV: 20.0,
    isCharging: true,
    plugType: 'ac',
    status: 'charging',
    tempBase: 38.5,
  },
  HYPER_120W: {
    targetWatts: 118.0,
    voltageV: 20.0,
    isCharging: true,
    plugType: 'ac',
    status: 'charging',
    tempBase: 41.0,
  },
};

let currentLevel = 42.0;

export function generateSimulatedBatteryStats(preset: SimulationPreset): BatteryStats {
  const config = PRESET_CONFIGS[preset];

  // Add small natural thermal and electrochemical fluctuation
  const jitterWatts = config.isCharging
    ? (Math.random() - 0.5) * (config.targetWatts * 0.05)
    : 0;

  const watts = Math.max(0, +(config.targetWatts + jitterWatts).toFixed(2));
  const voltageJitter = (Math.random() - 0.5) * 0.08;
  const voltageV = +(config.voltageV + voltageJitter).toFixed(2);
  const voltageMv = Math.round(voltageV * 1000);

  // Compute current in mA: P = V * I -> I = P / V
  const currentAmps = voltageV > 0 ? (watts / voltageV) : 0;
  const currentMa = Math.round(currentAmps * 1000);
  const currentUa = currentMa * 1000;

  // Increment/decrement battery level subtly
  if (config.isCharging) {
    const chargeIncrement = (watts / 65) * 0.04;
    currentLevel = Math.min(100, +(currentLevel + chargeIncrement).toFixed(2));
  } else {
    currentLevel = Math.max(1, +(currentLevel - 0.01).toFixed(2));
  }

  const tempJitter = (Math.random() - 0.5) * 0.4;
  const temperatureC = +(config.tempBase + tempJitter).toFixed(1);

  return {
    watts,
    isCharging: config.isCharging,
    status: config.status,
    plugType: config.plugType,
    voltageMv,
    voltageV,
    currentMa,
    currentUa,
    rawCurrent: currentUa,
    batteryLevel: Math.round(currentLevel),
    temperatureC,
    timestamp: Date.now(),
  };
}

export function resetSimulatedBatteryLevel(level: number = 42): void {
  currentLevel = level;
}
