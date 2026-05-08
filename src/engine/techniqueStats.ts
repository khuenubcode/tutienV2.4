import { TechniqueQuality, SkillType } from "../types";

export const calculateSkillValue = (type: SkillType, multiplier: number): number => {
  return Math.floor((type === 'damage' ? 50 : 30) * multiplier);
};

export const calculateCooldown = (multiplier: number): number => {
  return Math.max(2, 5 - Math.floor(multiplier / 1.5));
};

export const calculateCooldownMs = (cooldownSeconds: number, defaultMinMs: number = 2000): number => {
  return Math.max(defaultMinMs, (cooldownSeconds || 0) * 1000);
};

export const calculateManaCost = (multiplier: number): number => {
  return Math.floor(10 * multiplier);
};

export const getEffectChance = (qualityMultiplier: number, isDamage: boolean): number => {
  if (isDamage) {
    return 0.2 + (qualityMultiplier / 20);
  } else {
    return 0.3 + (qualityMultiplier / 30);
  }
};
