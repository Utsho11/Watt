import { ChargingTier } from '../types/battery';

export const CHARGING_TIERS: Record<string, ChargingTier> = {
  IDLE: {
    label: 'DISCHARGING',
    color: '#64748B',
    glowColor: 'rgba(100, 116, 139, 0.25)',
    textColor: '#94A3B8',
    minWatts: 0,
  },
  STANDARD: {
    label: 'STANDARD CHARGE',
    color: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.4)',
    textColor: '#60A5FA',
    minWatts: 0.5,
  },
  FAST: {
    label: 'FAST CHARGE',
    color: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.5)',
    textColor: '#34D399',
    minWatts: 10,
  },
  SUPER: {
    label: 'SUPER CHARGE',
    color: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.5)',
    textColor: '#FBBF24',
    minWatts: 25,
  },
  TURBO: {
    label: 'TURBO HYPER CHARGE',
    color: '#EC4899',
    glowColor: 'rgba(236, 72, 153, 0.6)',
    textColor: '#F472B6',
    minWatts: 45,
  },
};

export function getChargingTier(watts: number, isCharging: boolean): ChargingTier {
  if (!isCharging || watts <= 0.2) {
    return CHARGING_TIERS.IDLE;
  }
  if (watts >= 45) {
    return CHARGING_TIERS.TURBO;
  }
  if (watts >= 25) {
    return CHARGING_TIERS.SUPER;
  }
  if (watts >= 10) {
    return CHARGING_TIERS.FAST;
  }
  return CHARGING_TIERS.STANDARD;
}
