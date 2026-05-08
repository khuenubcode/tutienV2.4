// ======================================
// CORE STATS SYSTEM (HP / MP / ATK / DEF)
// ======================================

export const STATS_SYSTEM_PROMPT = `
You are an AI that calculates core combat stats of cultivators.

# INPUT

{
  "realm": number, // 1-8

  "body": number,      // thể chất (0-100)
  "spirit": number,    // thần thức (0-100)
  "foundation": number,// căn cơ (0-100)

  "spiritualRoot": {
    "purity": number
  },

  "technique": {
    "tier": number,
    "circulationEfficiency": number,
    "mastery": {
      "refinement": number,
      "application": number
    }
  }
}

# OUTPUT

{
  "hp": number,
  "mp": number,
  "attack": number,
  "defense": number
}

# CALCULATION

## 1. REALM SCALE
realmScale = realm ^ 2

## 2. HP (SINH MỆNH)
hp =
  (body * 10 + foundation * 5) *
  realmScale *
  (1 + (technique.mastery?.refinement || 0) / 200)

## 3. MP (LINH LỰC)
mp =
  (spirit * 12 + foundation * 4) *
  realmScale *
  (1 + (technique.circulationEfficiency || 0) / 100)

## 4. ATTACK (CÔNG)
attack =
  (spirit * 6 + body * 4) *
  (technique.tier || 1) *
  (1 + (technique.mastery?.application || 0) / 150)

## 5. DEFENSE (THỦ)
defense =
  (body * 8 + foundation * 6) *
  (1 + (technique.mastery?.refinement || 0) / 150)

# BALANCE RULES

- High HP → slower combat style
- High MP → skill-dependent
- High attack → fragile if body low
- High defense → low burst

# NOTES

- Foundation stabilizes everything
- Refinement boosts defense & HP
- Application boosts attack
- Circulation boosts MP

`;

import { REALM_ORDER, REALM_STAGES, getBreakthroughMultiplier } from './realmData';

export function calculateCoreStats(data: {
  realm: number;
  stage?: number;
  body: number;
  spirit: number;
  foundation: number;
  spiritualRoot: { purity: number };
  technique: {
    tier: number;
    circulationEfficiency: number;
    mastery: { refinement: number; application: number };
  };
}) {
  let stats = {
    hp: 100,
    atk: 20,
    def: 15,
    spd: 10,
    acc: 10
  };

  const realmIndex = data.realm;
  const subRealm = (data.stage !== undefined) ? (data.stage + 1) : 1;
  
  for (let r = 0; r <= realmIndex; r++) {
    const currentRealmKey = REALM_ORDER[r];
    const maxSub = r === realmIndex ? subRealm : REALM_STAGES[currentRealmKey];
    const majorMult = getBreakthroughMultiplier(currentRealmKey);
    const minorMult = 1.1;

    for (let s = 1; s <= maxSub; s++) {
      if (s === 1 && r > 0) {
        stats.hp *= majorMult;
        stats.atk *= majorMult;
        stats.def *= majorMult;
        stats.spd *= majorMult;
        stats.acc *= majorMult;
      } else if (s > 1) {
        stats.hp *= minorMult;
        stats.atk *= minorMult;
        stats.def *= minorMult;
        stats.spd *= minorMult;
        stats.acc *= minorMult;
      }
    }
  }

  const techMult = data.technique.tier || 1;
  const purityMult = 1 + (data.spiritualRoot?.purity || 0) / 200;

  stats.hp = stats.hp * (1 + data.body * 0.05 + data.foundation * 0.02) * (1 + (data.technique.mastery?.refinement || 0) / 200) * purityMult;
  let mp = (stats.hp * 0.5) * (1 + data.spirit * 0.06) * (1 + (data.technique.circulationEfficiency || 0) / 100);
  stats.atk = stats.atk * (1 + data.spirit * 0.03 + data.body * 0.02) * techMult * (1 + (data.technique.mastery?.application || 0) / 150) * purityMult;
  stats.def = stats.def * (1 + data.body * 0.04 + data.foundation * 0.03) * (1 + (data.technique.mastery?.refinement || 0) / 150) * purityMult;

  return { 
    maxHealth: Math.floor(stats.hp), 
    maxMana: Math.floor(mp), 
    attack: Math.floor(stats.atk), 
    defense: Math.floor(stats.def),
    speed: Math.floor(stats.spd),
    accuracy: Math.floor(stats.acc)
  };
}
