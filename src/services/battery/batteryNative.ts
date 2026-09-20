import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import { BatteryStats } from '../../types/battery';

const { BatteryModule } = NativeModules;

export const isNativeBatteryModuleAvailable =
  Platform.OS === 'android' &&
  BatteryModule != null &&
  typeof BatteryModule.startTracking === 'function';

let batteryEmitter: NativeEventEmitter | null = null;
if (isNativeBatteryModuleAvailable && BatteryModule) {
  try {
    batteryEmitter = new NativeEventEmitter(BatteryModule);
  } catch (e) {
    console.warn('Could not initialize Battery NativeEventEmitter:', e);
  }
}

export function startNativeTracking(): void {
  if (isNativeBatteryModuleAvailable && BatteryModule) {
    try {
      BatteryModule.startTracking();
    } catch (e) {
      console.warn('Failed to start native battery tracking:', e);
    }
  }
}

export function stopNativeTracking(): void {
  if (isNativeBatteryModuleAvailable && BatteryModule) {
    try {
      BatteryModule.stopTracking();
    } catch (e) {
      console.warn('Failed to stop native battery tracking:', e);
    }
  }
}

export async function getNativeBatteryStats(): Promise<BatteryStats | null> {
  if (isNativeBatteryModuleAvailable && BatteryModule?.getBatteryStats) {
    try {
      return await BatteryModule.getBatteryStats();
    } catch (e) {
      console.warn('Failed to get native battery stats:', e);
      return null;
    }
  }
  return null;
}

export function subscribeToBatteryUpdates(
  callback: (stats: BatteryStats) => void
): () => void {
  if (!isNativeBatteryModuleAvailable || !batteryEmitter) {
    return () => {};
  }

  const subscription = batteryEmitter.addListener('onBatteryUpdate', (data: any) => {
    callback(data as BatteryStats);
  });

  return () => {
    subscription.remove();
  };
}
