import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChargingSession } from '../../types/battery';

const STORAGE_KEY = '@charging_tracker_sessions_v1';

export async function getStoredSessions(): Promise<ChargingSession[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: ChargingSession[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load charging sessions from AsyncStorage:', e);
    return [];
  }
}

export async function saveChargingSession(session: ChargingSession): Promise<void> {
  try {
    const currentSessions = await getStoredSessions();
    // Prepend latest session first
    const updated = [session, ...currentSessions.filter(s => s.id !== session.id)].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save charging session to AsyncStorage:', e);
  }
}

export async function deleteChargingSession(id: string): Promise<ChargingSession[]> {
  try {
    const currentSessions = await getStoredSessions();
    const updated = currentSessions.filter(s => s.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete charging session:', e);
    return [];
  }
}

export async function clearAllChargingSessions(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear charging sessions:', e);
  }
}
