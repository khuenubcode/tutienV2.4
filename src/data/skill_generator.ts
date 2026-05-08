// =====================================================
// SKILL GENERATOR SYSTEM (Procedural Skills)
// =====================================================

import { ElementType, getReaction } from './element_system';
import { ActiveEffect } from '../types';
import { createEffect } from './statusEffectData';

// =====================================================
// TYPES
// =====================================================

export type SkillType = 'ACTIVE' | 'PASSIVE';
export type TargetType = 'SINGLE' | 'AOE' | 'SELF';

export interface Skill {
  id: string;
  name: string;
  type: SkillType;
  element: ElementType | ElementType[];
  targetType: TargetType;
  baseDamage: number;
  scaling: number; // % scaling with attack/spirit
  cost: number; // mana cost
  cooldown: number;
  effects?: ActiveEffect[];
  description: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  originTechnique?: string;
}

export interface GenerateSkillParams {
  level: number;
  elements: ElementType[];
  rarity?: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
  type?: 'OFFENSIVE' | 'DEFENSIVE' | 'UTILITY';
}

// =====================================================
// HELPERS
// =====================================================

let _id = Date.now();
function uid() {
  _id += 1;
  return `skill_${_id}`;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  if (!arr || arr.length === 0) return undefined as any;
  return arr[rand(0, arr.length - 1)];
}

// =====================================================
// NAME GENERATOR
// =====================================================

const PREFIX: Record<string, string[]> = {
  HOA: ['Xích Diễm', 'Hỏa Long', 'Phần Thiên', 'Liệt Dương'],
  THUY: ['Hàn Băng', 'Nhược Thủy', 'Lạc Hà', 'Thanh Hải'],
  MOC: ['Thanh Mộc', 'Trường Sinh', 'Bích Diệp', 'Thiên Liên'],
  KIM: ['Thái Ất', 'Canh Kim', 'Kiếm Khí', 'Bạch Đế'],
  THO: ['Huyền Vân', 'Thăng Long', 'Tứ Tượng', 'Địa Long'],
  LOI: ['Thiên Lôi', 'U Minh Lôi', 'Cửu Thiên', 'Tử Tiêu'],
  PHONG: ['Thần Phong', 'Toái Nguyệt', 'Hư Vô', 'Sát Na'],
  BANG: ['Vạn Niên', 'Cực Hàn', 'Tuyết Ảnh', 'Hàn Minh'],
  QUANG: ['Đại Nhật', 'Hạo Nhiên', 'Thánh Quang', 'Cực Lạc'],
  AM: ['Hoàng Tuyền', 'U Hồn', 'Quỷ Sát', 'Tịch Diệt'],
};

const SUFFIX = ['Trảm', 'Ấn', 'Chưởng', 'Kiếm', 'Bạo', 'Thuật', 'Lệnh', 'Finger', 'Burst', 'Wave'];

function generateName(elements: ElementType[]): string {
  const el = pick(elements);
  const prefix = pick(PREFIX[el] || ['Huyền', 'Thiên', 'Cổ']);
  const suffix = pick(SUFFIX);
  return `${prefix} ${suffix}`;
}

// =====================================================
// EFFECT GENERATOR
// =====================================================

function generateEffects(element: ElementType, level: number, rarityMultiplier: number): ActiveEffect[] {
  const effects: ActiveEffect[] = [];
  const power = level * rarityMultiplier;

  switch (element) {
    case 'HOA':
      effects.push(createEffect('burn', 3));
      break;
    case 'THUY':
      effects.push(createEffect('spd_down', 2));
      break;
    case 'LOI':
      if (Math.random() < 0.3 * rarityMultiplier) effects.push(createEffect('stun', 1));
      break;
    case 'BANG':
      if (Math.random() < 0.2 * rarityMultiplier) effects.push(createEffect('freeze', 1));
      break;
    case 'MOC':
      effects.push(createEffect('poison', 4));
      break;
    case 'KIM':
      effects.push(createEffect('atk_up', 2)); // map bleed to atk_up for self or something, actually we just push an effect, let's map to def_down or weaken
      break;
    case 'THO':
      effects.push(createEffect('def_up', 3));
      break;
    case 'PHONG':
      effects.push(createEffect('spd_down', 2));
      break;
    case 'QUANG':
      effects.push(createEffect('regen', 3));
      break;
    case 'AM':
      effects.push(createEffect('weaken', 3));
      break;
  }

  return effects;
}

// =====================================================
// MAIN GENERATOR
// =====================================================

export function generateSkill(params: GenerateSkillParams): Skill {
  const { level, elements = [], rarity = 'COMMON', type = 'OFFENSIVE' } = params;

  // Rarity Constants
  const RARITY_MAP = {
    'COMMON': { mult: 1.0, color: '#94a3b8', maxEffects: 1, aoeChance: 0.1 },
    'RARE': { mult: 1.3, color: '#3b82f6', maxEffects: 1, aoeChance: 0.2 },
    'EPIC': { mult: 1.7, color: '#a855f7', maxEffects: 2, aoeChance: 0.4 },
    'LEGENDARY': { mult: 2.2, color: '#f59e0b', maxEffects: 2, aoeChance: 0.6 },
    'MYTHIC': { mult: 3.0, color: '#ef4444', maxEffects: 3, aoeChance: 0.8 },
  };

  const rData = RARITY_MAP[rarity];
  
  // Element Bias
  let damageBias = 1.0;
  let costBias = 1.0;
  let cooldownBias = 1.0;

  if (elements.includes('HOA')) damageBias += 0.2;
  if (elements.includes('THO')) { damageBias -= 0.1; cooldownBias -= 0.1; }
  if (elements.includes('PHONG')) { damageBias -= 0.1; cooldownBias -= 0.2; }
  if (elements.includes('LOI')) { damageBias += 0.1; costBias += 0.2; }

  // Base Stats
  const basePower = level * 12; // Buffed from 10 to 12
  const dmgRoll = rand(80, 120) / 100;
  const scaling = Math.floor(rand(100, 200) * rData.mult);
  
  // AOE Logic influenced by rarity and level
  const baseAoeChance = rData.aoeChance;
  const levelAoeBonus = Math.min(0.2, level / 250); // Small bonus for level
  const finalAoeChance = Math.min(0.95, baseAoeChance + levelAoeBonus + (elements.length > 1 ? 0.2 : 0));
  
  const targetType: TargetType = Math.random() < finalAoeChance ? 'AOE' : 'SINGLE';
  const targetMult = targetType === 'AOE' ? 0.65 : 1.0; // AOE does less per target

  const finalDamage = Math.floor(basePower * dmgRoll * rData.mult * damageBias * targetMult);
  
  // Balanced Cost/Cooldown
  const powerScore = (finalDamage * (scaling / 100)) / (targetType === 'AOE' ? 0.65 : 1);
  const cost = Math.max(10, Math.floor((powerScore / 5) * costBias));
  const cooldown = Math.max(1, Math.min(8, Math.floor((powerScore / 50) * cooldownBias)));

  // Effects
  let effects: ActiveEffect[] = [];
  const shuffledElements = [...elements].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(shuffledElements.length, rData.maxEffects); i++) {
    effects = effects.concat(generateEffects(shuffledElements[i], level, rData.mult));
  }

  // Dual Element Synergy
  let description = `Gây ${finalDamage} sát thương (${scaling}% Tấn công).`;
  if (elements.length >= 2) {
    const reaction = getReaction(elements[0], elements[1]);
    if (reaction.effect) {
      description += ` Kích hoạt cộng hưởng ${reaction.effect} (x${reaction.multiplier}).`;
    }
  }

  return {
    id: uid(),
    name: generateName(elements),
    type: 'ACTIVE',
    element: elements.length === 1 ? elements[0] : elements,
    targetType,
    baseDamage: finalDamage,
    scaling,
    cost,
    cooldown,
    effects,
    rarity,
    description: `${description} Tiêu hao ${cost} linh lực. Hồi chiêu ${cooldown} lượt.`
  };
}

// =====================================================
// EXAMPLE
// =====================================================
/*
const skill = generateSkill({
  level: 10,
  elements: ['HOA', 'LOI'],
  rarity: 'EPIC'
});

console.log(skill);
*/
