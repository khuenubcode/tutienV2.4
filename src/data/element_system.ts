// ============================================
// ELEMENT SYSTEM - FULL IMPLEMENTATION
// ============================================

export type ElementType =
  | 'KIM'
  | 'MOC'
  | 'THUY'
  | 'HOA'
  | 'THO'
  | 'LOI'
  | 'BANG'
  | 'PHONG'
  | 'QUANG'
  | 'AM'
  | 'KHONG_GIAN'
  | 'THOI_GIAN'
  | 'SINH_TU'
  | 'HU_VO'
  | 'VẬT LÝ';

// =============================
// CORE STATS
// =============================
export interface ElementStats {
  affinity: Partial<Record<ElementType, number>>; // % bonus
  power: Partial<Record<ElementType, number>>; // % damage bonus
  resist: Partial<Record<ElementType, number>>; // % reduction
  penetration: Partial<Record<ElementType, number>>; // ignore resist
}

export interface CombatContext {
  attacker: ElementStats;
  defender: ElementStats;
  attackerElement: ElementType;
  defenderElement: ElementType;
  baseDamage: number;
}

// =============================
// COUNTER SYSTEM
// =============================
const COUNTER_MATRIX: Partial<Record<ElementType, ElementType>> = {
  MOC: 'THO',
  THO: 'THUY',
  THUY: 'HOA',
  HOA: 'KIM',
  KIM: 'MOC'
};

export function getCounterMultiplier(
  attacker: ElementType,
  defender: ElementType
): number {
  if (COUNTER_MATRIX[attacker] === defender) return 1.25; // strong
  if (COUNTER_MATRIX[defender] === attacker) return 0.75; // weak
  return 1.0;
}

// =============================
// REACTION SYSTEM
// =============================
export type ReactionResult = {
  multiplier: number;
  effect?: string;
};

export function getReaction(
  a: ElementType,
  b: ElementType
): ReactionResult {
  const combo = [a, b].sort().join('_');

  switch (combo) {
    case 'HOA_MOC':
      return { multiplier: 1.3, effect: 'AOE_BURN' };

    case 'THUY_LOI':
      return { multiplier: 1.2, effect: 'CHAIN_STUN' };

    case 'HOA_THUY':
      return { multiplier: 1.4, effect: 'EXPLOSION' };

    case 'BANG_THUY':
      return { multiplier: 1.1, effect: 'FREEZE' };

    case 'BANG_HOA':
      return { multiplier: 1.5, effect: 'MELT' };

    case 'HOA_PHONG':
      return { multiplier: 1.25, effect: 'SPREAD_FIRE' };

    case 'LOI_PHONG':
      return { multiplier: 1.35, effect: 'SUPER_CONDUCT' };

    case 'AM_QUANG':
      return { multiplier: 1.8, effect: 'ANNIHILATION' };

    case 'THO_KIM':
      return { multiplier: 0.8, effect: 'FORTIFY' };

    case 'AM_HU_VO':
      return { multiplier: 2.0, effect: 'VOID_ERASURE' };

    case 'SINH_TU_KHONG_GIAN':
      return { multiplier: 1.6, effect: 'DIMENSIONAL_TEAR' };

    default:
      return { multiplier: 1.0 };
  }
}

// =============================
// DAMAGE CALCULATION
// =============================
export function calculateDamage(ctx: CombatContext) {
  const { attacker, defender, attackerElement, defenderElement, baseDamage } = ctx;

  const power = attacker.power[attackerElement] || 0;
  const resist = defender.resist[attackerElement] || 0;
  const penetration = attacker.penetration[attackerElement] || 0;

  const effectiveResist = Math.max(0, resist - penetration);

  const counter = getCounterMultiplier(attackerElement, defenderElement);
  const reaction = getReaction(attackerElement, defenderElement);

  const finalDamage =
    baseDamage *
    (1 + power / 100) *
    counter *
    reaction.multiplier *
    (1 - effectiveResist / 100);

  return {
    damage: Math.max(0, Math.floor(finalDamage)),
    reaction: reaction.effect || null
  };
}

// =============================
// INTERRUPT SYSTEM
// =============================
export interface InterruptContext {
  lightningPower: number;
  speedDiff: number;
  targetStability: number;
}

export function calculateInterruptChance(ctx: InterruptContext): number {
  const chance = ctx.lightningPower + ctx.speedDiff - ctx.targetStability;
  return Math.max(0, Math.min(100, chance));
}

// =============================
// ADVANCED RULES
// =============================
export function applyAdvancedOverride(
  attacker: ElementType,
  defender: ElementType
): number {
  if (attacker === 'HU_VO') return 1.5;
  if (attacker === 'SINH_TU' && defender === 'MOC') return 1.4;
  if (attacker === 'KHONG_GIAN' && defender === 'PHONG') return 1.3;
  return 1.0;
}

// =============================
// FINAL PIPELINE
// =============================
export function computeFinalDamage(ctx: CombatContext) {
  const base = calculateDamage(ctx);
  const override = applyAdvancedOverride(
    ctx.attackerElement,
    ctx.defenderElement
  );

  return {
    damage: Math.floor(base.damage * override),
    reaction: base.reaction
  };
}

// =============================
// EXAMPLE USAGE
// =============================
/*
const result = computeFinalDamage({
  attacker: {
    affinity: { HOA: 20 },
    power: { HOA: 50 },
    resist: {},
    penetration: { HOA: 10 }
  },
  defender: {
    affinity: {},
    power: {},
    resist: { HOA: 30 },
    penetration: {}
  },
  attackerElement: 'HOA',
  defenderElement: 'MOC',
  baseDamage: 1000
});

console.log(result);
*/
