
import { PlayerState } from '../types';

const STORAGE_KEY = 'thien_dao_story_save';

export const saveGame = (state: PlayerState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game:', error);
  }
};

export const loadGame = (): PlayerState | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
};

export const clearSave = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};
