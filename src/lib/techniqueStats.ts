import { CultivationTechnique } from '../types';

export interface TechniqueStats {
  averageMastery: number;
  tierMultiplier: number;
  attackMultiplier: number;
  defenseMultiplier: number;
  healthMultiplier: number;
  displayText: string;
}

export interface EnrichedTechnique extends CultivationTechnique {
  stats: TechniqueStats;
}

const TIER_MULTIPLIERS: Record<string, number> = {
  'Phàm': 1.0,
  'Linh': 1.5,
  'Huyền': 2.5,
  'Địa': 4.0,
  'Thiên': 7.0,
  'Đạo': 15.0
};

export interface MasteryBonus {
  attackMult: number;
  defenseMult: number;
  healthMult: number;
  synergy: number;
}

/**
 * Calculates display stats for a specific cultivation technique.
 */
export function getTechniqueStats(tech: CultivationTechnique): TechniqueStats {
  const refinement = tech.mastery?.refinement || 0;
  const application = tech.mastery?.application || 0;
  const averageMastery = Math.floor((refinement + application) / 2);
  
  const tierMultiplier = TIER_MULTIPLIERS[tech.tier || 'Phàm'] || 1.0;
  
  // Base effectiveness based on mastery, tier and level
  const levelFactor = 1 + (tech.level || 1) * 0.05;
  const masteryFactor = 1 + (averageMastery / 100);
  
  const totalTierMult = tierMultiplier * levelFactor * masteryFactor;
  
  // These could be derived from the specific effects defined in the tech
  const attackMultiplier = (tech.effects?.stats?.attackMult || 1.0) * totalTierMult;
  const defenseMultiplier = (tech.effects?.stats?.defenseMult || 1.0) * totalTierMult;
  const healthMultiplier = (tech.effects?.stats?.healthMult || 1.0) * totalTierMult;

  let displayText = `${tech.name || 'Công Pháp'} (Cấp ${tech.level || 1})`;
  if (averageMastery >= 100) displayText += ' - Viên Mãn';
  else if (averageMastery >= 80) displayText += ' - Đại Thành';
  else if (averageMastery >= 50) displayText += ' - Tiểu Thành';
  else displayText += ' - Sơ Thành';

  return {
    averageMastery,
    tierMultiplier: totalTierMult,
    attackMultiplier,
    defenseMultiplier,
    healthMultiplier,
    displayText
  };
}

/**
 * Calculates synergies between techniques
 */
export function calculateSynergy(techniques: CultivationTechnique[]) {
  const activeTechs = (techniques || []).filter(t => t.isActive);
  if (activeTechs.length <= 1) return 1.0;

  // Elemental Resonance: Bonus if multiple techniques share an element
  const elements = activeTechs.flatMap(t => t.element);
  const elementCounts: Record<string, number> = {};
  elements.forEach(e => {
    elementCounts[e] = (elementCounts[e] || 0) + 1;
  });

  let resonanceBonus = 0;
  Object.values(elementCounts).forEach(count => {
    if (count > 1) resonanceBonus += (count - 1) * 0.1; // 10% per matching element
  });

  // Path Synergy: Bonus if same path
  const paths = activeTechs.map(t => t.path);
  const pathCounts: Record<string, number> = {};
  paths.forEach(p => {
    pathCounts[p] = (pathCounts[p] || 0) + 1;
  });

  let pathBonus = 0;
  Object.values(pathCounts).forEach(count => {
    if (count > 1) pathBonus += (count - 1) * 0.15; // 15% per matching path
  });

  return 1.0 + resonanceBonus + pathBonus;
}

/**
 * Calculates the total bonus across all mastered techniques.
 * Used for centralizing player stat calculations.
 */
export function calculateMasteryBonus(techniques: CultivationTechnique[]): MasteryBonus {
  const activeTechs = (techniques || []).filter(t => t.isActive);
  const synergy = calculateSynergy(techniques);

  if (activeTechs.length === 0) {
    if ((techniques || []).length > 0) {
      const stats = getTechniqueStats(techniques[0]);
      return {
        attackMult: stats.attackMultiplier,
        defenseMult: stats.defenseMultiplier,
        healthMult: stats.healthMultiplier,
        synergy: 1.0
      };
    }
    return { attackMult: 1.0, defenseMult: 1.0, healthMult: 1.0, synergy: 1.0 };
  }

  const baseBonus = activeTechs.reduce((acc, tech) => {
    const stats = getTechniqueStats(tech);
    // Secondary techniques give 30% effectiveness if not main (main is the first one)
    const effectiveness = tech.id === activeTechs[0]?.id ? 1.0 : 0.3;

    return {
      attackMult: acc.attackMult + (stats.attackMultiplier - 1) * effectiveness,
      defenseMult: acc.defenseMult + (stats.defenseMultiplier - 1) * effectiveness,
      healthMult: acc.healthMult + (stats.healthMultiplier - 1) * effectiveness
    };
  }, { attackMult: 1.0, defenseMult: 1.0, healthMult: 1.0 });

  return {
    attackMult: baseBonus.attackMult * synergy,
    defenseMult: baseBonus.defenseMult * synergy,
    healthMult: baseBonus.healthMult * synergy,
    synergy
  };
}

/**
 * Helper to enrich techniques with their calculated stats
 */
export function getEnrichedTechniques(techniques: CultivationTechnique[]): EnrichedTechnique[] {
  return (techniques || []).map(tech => ({
    ...tech,
    stats: getTechniqueStats(tech)
  }));
}
