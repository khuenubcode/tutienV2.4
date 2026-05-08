import { PlayerState, CultivationTechnique, Equipment } from '../types';
import { calculateCoreStats } from '../engine/corestat';
import { calculatePowerScore } from '../data/powerscale';
import { calculateMasteryBonus } from './techniqueStats';

export interface CalculatedStats {
  maxHealth: number;
  maxMana: number;
  attack: number;
  defense: number;
  powerScore: number;
  // Secondary stats
  speed: number;
  accuracy: number;
  critChance: number;
  critDamage: number;
  luck: number;
  breakthroughChance: number;
}

const tierMap: Record<string, number> = { 'Phàm': 1, 'Linh': 1.5, 'Huyền': 2.2, 'Địa': 3.5, 'Thiên': 6, 'Đạo': 12 };

/**
 * Centrally calculates all player metrics from current state.
 * Use this to ensure UI consistency.
 */
export function calculateAllPlayerStats(state: PlayerState): CalculatedStats {
  if (!state.isInitialized && !state.name) {
    return {
      maxHealth: 100,
      maxMana: 50,
      attack: 20,
      defense: 15,
      powerScore: 100,
      speed: 10,
      accuracy: 60,
      critChance: 5,
      critDamage: 150,
      luck: 10,
      breakthroughChance: 50
    };
  }

  // 1. Core Stats (HP, MP, ATK, DEF)
  const primaryTech = (state.masteredTechniques || [])[0] || {
    tier: 'Phàm',
    circulation: { efficiency: 10 },
    mastery: { refinement: 0, application: 0 }
  };

  const subRealmMap: Record<string, number> = { "Sơ kỳ": 0, "Trung kỳ": 1, "Hậu kỳ": 2, "Đại viên mãn": 3, "Viên mãn": 3 };
  const stageNum = subRealmMap[state.stage] || 0;

  const { maxHealth: baseHp, maxMana: baseMp, attack: baseAtk, defense: baseDef, speed: coreSpeed, accuracy: coreAccuracy } = calculateCoreStats({
    realm: state.realmLevel,
    stage: stageNum,
    body: state.body,
    spirit: state.spirit,
    foundation: state.foundation,
    spiritualRoot: { purity: state.spiritualRoot?.purity || 50 },
    technique: {
      tier: tierMap[primaryTech.tier || 'Phàm'] || 1,
      circulationEfficiency: primaryTech.circulation?.efficiency || 10,
      mastery: primaryTech.mastery || { refinement: 0, application: 0 }
    }
  });

  // 2. Technique Multipliers
  const masteredTechs = state.masteredTechniques || [];
  const techBonuses = calculateMasteryBonus(masteredTechs);

  // 3. Equipment Bonuses
  let equippedAttack = 0;
  let equippedDefense = 0;
  let equippedHealth = 0;
  let equippedMana = 0;
  let equippedSpeed = 0;
  let equippedAccuracy = 0;
  
  const equipped = state.equippedItems || {};
  const equippedList = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean) as Equipment[];
  
  equippedList.forEach(item => {
    if (item.stats) {
      if (item.stats.attack) equippedAttack += item.stats.attack;
      if (item.stats.defense) equippedDefense += item.stats.defense;
      if (item.stats.health) equippedHealth += item.stats.health;
      if (item.stats.mana) equippedMana += item.stats.mana;
      if (item.stats.speed) equippedSpeed += item.stats.speed;
      if (item.stats.accuracy) equippedAccuracy += item.stats.accuracy;
    }
  });

  // Calculate final base totals with multipliers
  const finalMaxHealth = Math.floor(baseHp * techBonuses.healthMult) + equippedHealth;
  const finalMaxMana = baseMp + equippedMana;
  const finalAttack = Math.floor(baseAtk * techBonuses.attackMult) + equippedAttack;
  const finalDefense = Math.floor(baseDef * techBonuses.defenseMult) + equippedDefense;

  // 4. Power Score
  const powerScore = calculatePowerScore({
    realm: state.realm,
    stage: state.stage,
    techniques: state.masteredTechniques,
    equipment: equippedList,
    domain: state.domain,
    willpower: 100 
  });

  // 5. Secondary Stats (Example formulas)
  const reputation = (state as any).reputation || 0;
  const luck = 15 + (state.foundation * 0.3) + (reputation * 0.02);
  const speed = coreSpeed + (state.spirit * 0.3) + (state.body * 0.2) + equippedSpeed;
  const accuracy = coreAccuracy + (state.spirit * 0.5) + (state.foundation * 0.2) + luck / 5 + equippedAccuracy;
  const critChance = 10 + (state.spirit * 0.25) + (state.foundation * 0.1) + (primaryTech.mastery?.application || 0) / 15;
  const critDamage = 160 + (state.body * 0.6) + (primaryTech.mastery?.application || 0) / 1.5;
  
  // 6. Breakthrough Chance (Base 60% for early game comfort)
  // Factors: Foundation (Căn Cơ), Purity (Độ Thuần), Luck (Vận May), and accumulated Bonus
  let breakthroughChance = 60 
    + (state.foundation / 8) 
    + ((state.spiritualRoot?.purity || 0) / 15) 
    + (luck / 4)
    + (state.breakthroughBonus || 0);
  
  // Cap between 5% and 95%
  breakthroughChance = Math.min(95, Math.max(5, breakthroughChance));

  return {
    maxHealth: finalMaxHealth,
    maxMana: finalMaxMana,
    attack: finalAttack,
    defense: finalDefense,
    powerScore,
    speed: Math.floor(speed),
    accuracy: Math.floor(accuracy),
    critChance: Math.floor(critChance),
    critDamage: Math.floor(critDamage),
    luck: Math.floor(luck),
    breakthroughChance: Math.floor(breakthroughChance)
  };
}
