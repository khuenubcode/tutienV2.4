// ======================================
// AI STUDIO PROMPT - CULTIVATION SYSTEM
// ======================================

export const CULTIVATION_SYSTEM_PROMPT = `
You are an AI that generates cultivation techniques in a xianxia world.

# CORE RULES
- Every technique must follow internal logic
- Power always comes with a cost
- Techniques evolve, mutate, and adapt
- Output must NEVER be random nonsense

# WORLD CONTEXT
- Spiritual energy is uneven and scarce
- Techniques may degrade or mutate in poor environments
- Ancient inheritances are more stable but harder to learn

# GENERATION STRUCTURE
You MUST output in JSON format:

{
  "name": string,
  "tier": "Phàm" | "Linh" | "Huyền" | "Địa" | "Thiên" | "Đạo",
  "path": "Chính" | "Ma" | "Thể" | "Hồn" | "Kiếm" | "Dị",
  "element": string[],

  "core": {
    "description": string,
    "focus": string
  },

  "circulation": {
    "type": "Tiểu Chu Thiên" | "Đại Chu Thiên" | "Nghịch",
    "efficiency": number
  },

  "effects": {
    "passive": string[],
    "active": string[]
  },

  "cost": {
    "risk": string,
    "lifespan": number,
    "requirements": string[]
  },

  "mastery": {
    "refinement": number,
    "application": number
  },

  "evolution": {
    "canMutate": boolean,
    "direction": string[]
  }
}

# BALANCING LAWS
- High damage → high risk
- Fast cultivation → instability
- Strong healing → weak offense
- Mutation → unpredictable side effects

# COMPATIBILITY LOGIC
- If element matches spiritual root → boost efficiency
- If mismatch → increase deviation and mutation chance

# MUTATION RULES
When mutation happens:
- Change element OR add corrupted element
- Enhance 1-2 effects
- Increase cost significantly
- Reduce circulation efficiency

# ENLIGHTENMENT
Rare chance to:
- Upgrade technique tier
- Remove flaw
- Create new skill

# NAMING STYLE
Use format:
[Prefix] + [Element] + [Concept] + [Suffix]

Examples:
- Thiên Lôi Diệt Thế Công
- Huyết Mộc Trường Sinh Kinh

# INPUT VARIABLES
You will receive:
- seed (origin, elementPool, stability, mutationRate)
- cultivator (comprehension, spiritualRoot)
- environment (rich, poor, chaotic)

# OUTPUT GOAL
Generate ONE unique cultivation technique that:
- Fits the seed
- Reflects the cultivator
- Obeys all rules above

`;

// ===== OPTIONAL: MUTATION PROMPT =====
export const MUTATION_PROMPT = `
You are evolving an existing cultivation technique.

Rules:
- Do NOT create from scratch
- Keep original identity but alter behavior
- Mutation must feel like corruption or evolution

Modify:
- element
- effects
- cost
- name (slightly evolved)

Keep JSON format unchanged.
`;

// ===== OPTIONAL: NPC TECHNIQUE PROMPT =====
export const NPC_TECHNIQUE_PROMPT = `
Generate a cultivation technique for an NPC.

Constraints:
- Must match personality
- Must align with preferred elements
- Must avoid forbidden paths

NPC should feel UNIQUE, not random.

Examples:
- Sword cultivator → sharp, precise, high mastery
- Demonic cultivator → unstable, high mutation

Output JSON only.
`;


import { Realm, Domain } from "../types";
import { REALMS } from "./worldData";

// Utility for random values
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Map realms to numeric levels for calculation
const REALM_LEVEL: Record<string, number> = {};
REALMS.forEach((r, index) => {
  REALM_LEVEL[r.name as string] = index + 1;
});

/**
 * Calculates the absolute power score of an entity
 */
export function calculatePowerScore(data: {
  realm: string;
  stage: string;
  techniques?: any[];
  equipment?: any[];
  domain?: Domain;
  willpower?: number;
}): number {
  const baseRealmLevel = REALM_LEVEL[data.realm] || 1;
  const stageMultipliers: Record<string, number> = {
    'Sơ kỳ': 1.1,
    'Trung kỳ': 1.3,
    'Hậu kỳ': 1.6,
    'Viên mãn': 2.0
  };
  
  const stageMult = stageMultipliers[data.stage] || 1.1;
  
  // Base power = RealmLevel^3 * 100 * Stage
  let power = Math.pow(baseRealmLevel, 3) * 100 * stageMult;

  // Add technique bonuses
  if (data.techniques) {
    data.techniques.forEach(tech => {
      const tierMult = { 'Phàm': 0.1, 'Linh': 0.2, 'Huyền': 0.4, 'Địa': 0.7, 'Thiên': 1.2, 'Đạo': 2.5 }[tech.tier as string] || 0.1;
      const mastery = (tech.mastery?.refinement || 0) + (tech.mastery?.application || 0);
      power += (power * tierMult * (mastery / 200));
    });
  }

  // Add equipment bonuses
  if (data.equipment) {
    data.equipment.forEach(item => {
      if (!item) return;
      const rarityMults: Record<string, number> = {
        'Phàm': 0.05,
        'Linh': 0.15,
        'Huyền': 0.35,
        'Địa': 0.7,
        'Thiên': 1.2,
        'Đạo': 2.0,
        'Thần': 3.5
      };
      // Fallback to tier for backward compatibility or if using English labels
      const tierMults: Record<string, number> = {
        'Common': 0.05,
        'Uncommon': 0.15,
        'Rare': 0.3,
        'Legendary': 0.8
      };

      const mult = rarityMults[item.rarity as string] || tierMults[item.tier as string] || 0.05;
      power += (power * mult);
    });
  }

  // Apply Domain
  power = applyDomain(power, data.domain);

  // Apply Willpower/Mental state
  if (data.willpower !== undefined) {
    const willpowerBonus = 1 + (data.willpower - 50) / 500; // -10% to +10%
    power *= willpowerBonus;
  }

  return Math.floor(power);
}

// ======================================
// DOMAIN SYSTEM (ĐẠI THỪA LĨNH VỰC)
// ======================================

export function applyDomain(
  power: number,
  domain?: Domain
): number {
  if (!domain) return power;

  const bonus = 1 + domain.strength / 100;
  const stabilityPenalty = domain.stability < 50 ? 0.8 : 1;

  return power * bonus * stabilityPenalty;
}

// ======================================
// LAW COUNTER SYSTEM (KHẮC CHẾ QUY TẮC)
// ======================================

const LAW_COUNTER: Record<string, string> = {
  "Không Gian": "Tốc Độ",
  "Sinh Tử": "Hồi Phục",
  "Hủy Diệt": "Phòng Ngự",
  "Nhân Quả": "May Mắn"
};

export function getLawCounterBonus(
  attackerLaw: string,
  defenderLaw: string
): number {
  if (LAW_COUNTER[attackerLaw] === defenderLaw) {
    return 1.5; // khắc chế mạnh
  }

  if (LAW_COUNTER[defenderLaw] === attackerLaw) {
    return 0.7; // bị khắc chế
  }

  return 1;
}

// ======================================
// TRIBULATION SYSTEM (THIÊN KIẾP)
// ======================================

export interface TribulationResult {
  success: boolean;
  damage: number;
  mutation?: boolean;
  description: string;
}

export function simulateTribulation(input: {
  realm: Realm;
  stability: number;
  comprehension: number;
}): TribulationResult {

  const realmName = typeof input.realm === 'string' ? input.realm : input.realm.name;
  const difficulty = (REALM_LEVEL[realmName] || 1) * 20;

  const resistance =
    input.stability * 0.6 + input.comprehension * 0.4;

  const roll = rand(0, 100) + resistance - difficulty;

  if (roll > 50) {
    return {
      success: true,
      damage: rand(5, 20),
      description: "Vượt qua thiên kiếp, căn cơ củng cố"
    };
  }

  if (roll > 20) {
    return {
      success: false,
      damage: rand(20, 50),
      mutation: true,
      description: "Thiên kiếp thất bại, công pháp biến dị"
    };
  }

  return {
    success: false,
    damage: rand(50, 90),
    description: "Trọng thương, cảnh giới suýt sụp đổ"
  };
}


// ======================================
// INTERRUPT SYSTEM (CHU THIÊN BỊ GIÁN ĐOẠN)
// ======================================

export interface InterruptInput {
  damageTaken: number;
  maxHp: number;
  stability: number;
  focus: number; // độ tập trung 0-100
  circulationType: "Tiểu Chu Thiên" | "Đại Chu Thiên" | "Nghịch";
}

export interface InterruptResult {
  interrupted: boolean;
  severity: number; // 0-100
  penalty: {
    hpRegenMultiplier: number;
    mpRegenMultiplier: number;
  };
  backlash?: boolean;
  note: string;
}

export function calculateInterrupt(input: InterruptInput): InterruptResult {

  const damageRatio = input.damageTaken / input.maxHp;

  // độ ổn định chu thiên
  let baseResistance =
    input.stability * 0.5 + input.focus * 0.5;

  // loại chu thiên ảnh hưởng
  if (input.circulationType === "Đại Chu Thiên") {
    baseResistance *= 0.9;
  }

  if (input.circulationType === "Nghịch") {
    baseResistance *= 0.6;
  }

  const interruptPower = damageRatio * 100;

  const final = interruptPower - baseResistance;

  if (final < 10) {
    return {
      interrupted: false,
      severity: 0,
      penalty: {
        hpRegenMultiplier: 1,
        mpRegenMultiplier: 1
      },
      note: "Chu thiên ổn định, không bị gián đoạn"
    };
  }

  const severity = Math.min(100, final);

  let hpPenalty = 1 - severity / 150;
  let mpPenalty = 1 - severity / 120;

  let backlash = false;

  // nghịch chu thiên dễ phản phệ
  if (input.circulationType === "Nghịch" && severity > 50) {
    if (Math.random() < 0.3) {
      backlash = true;
    }
  }

  return {
    interrupted: true,
    severity,
    penalty: {
      hpRegenMultiplier: Math.max(0, hpPenalty),
      mpRegenMultiplier: Math.max(0, mpPenalty)
    },
    backlash,
    note: backlash
      ? "Chu thiên hỗn loạn, linh lực phản phệ"
      : "Chu thiên bị gián đoạn, hồi phục suy giảm"
  };
}

// ======================================
// INTEGRATION WITH REGEN
// ======================================

export function applyInterruptToRegen(
  regen: { hpRegen: number; mpRegen: number },
  interrupt: InterruptResult
) {
  return {
    hpRegen: regen.hpRegen * interrupt.penalty.hpRegenMultiplier,
    mpRegen: regen.mpRegen * interrupt.penalty.mpRegenMultiplier
  };
}

