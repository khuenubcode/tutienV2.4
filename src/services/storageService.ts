
import { PlayerState, Realm, LogEntry } from '../types';
import { getRandomSpiritRoot, getRandomTechnique } from '../gameData';
import { getRandomThemeQuest } from '../data/themeQuestData';
import { getRandomWorldTheme } from '../data/worldThemeData';
import { getRandomLocationName } from '../data/mapData';
import { getRandomCostume } from '../data/costumes';
import { REALMS } from '../data/worldData';

const STORAGE_KEY_PROFILE = 'tu_tien_profile';
const STORAGE_KEY_LOGS = 'tu_tien_logs';

export const saveProfileLocal = (profile: PlayerState) => {
  localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
};

export const getProfileLocal = (): PlayerState | null => {
  const data = localStorage.getItem(STORAGE_KEY_PROFILE);
  if (!data) return null;
  const profile = JSON.parse(data);
  
  // Migration logic would go here if needed...
  
  return profile;
};

export const saveLogLocal = (userId: string, message: string, type: LogEntry['type']) => {
  const logs = getLogsLocal();
  const newLog: LogEntry = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    message,
    type,
    timestamp: new Date().toISOString(),
  };
  const updatedLogs = [newLog, ...logs].slice(0, 50); // Giữ tối đa 50 nhật ký
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(updatedLogs));
  return updatedLogs;
};

export const getLogsLocal = (): LogEntry[] => {
  const data = localStorage.getItem(STORAGE_KEY_LOGS);
  if (!data) return [];
  return JSON.parse(data);
};
