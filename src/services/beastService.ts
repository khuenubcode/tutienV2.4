import { StoredBeast } from '../types';

const BEAST_STORAGE_KEY = 'cultivation_world_beasts';

export const saveBeastsLocal = (beasts: StoredBeast[]) => {
  localStorage.setItem(BEAST_STORAGE_KEY, JSON.stringify(beasts));
};

export const getBeastsLocal = (): StoredBeast[] => {
  const data = localStorage.getItem(BEAST_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing Beasts from local storage", e);
    return [];
  }
};

export const addBeastLocal = (beast: StoredBeast) => {
  const beasts = getBeastsLocal();
  const existingIdx = beasts.findIndex(b => b.id === beast.id);
  
  if (existingIdx >= 0) {
    beasts[existingIdx] = beast;
  } else {
    beasts.push(beast);
  }
  
  saveBeastsLocal(beasts);
};

export const deleteBeastLocal = (id: string) => {
  const beasts = getBeastsLocal().filter(b => b.id !== id);
  saveBeastsLocal(beasts);
};
