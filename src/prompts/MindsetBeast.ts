// beast_ai.ts
import { CombatUnit } from '../types';

// ===== TYPES =====

export type BeastLevel =
  | "LOW"        // Luyện Khí / Trúc Cơ
  | "MID"        // Kim Đan
  | "HIGH"       // Nguyên Anh
  | "LORD";      // Hóa Thần / Hóa hình

export interface BeastInstinct {
  hunger: number;        // đói (0–1)
  aggression: number;    // hung bạo
  caution: number;       // cẩn trọng
  territorial: number;   // ý thức lãnh địa
  pack: number;          // xu hướng bầy đàn
  bloodline: number;     // áp lực huyết mạch (tiến hóa / bảo vệ con)
}

export interface Beast {
  name: string;
  level: BeastLevel;
  hp: number;            // 0–1 (chuẩn hóa)
  instinct: BeastInstinct;
}

export interface BeastContext {
  targetPower: number;   // sức mạnh mục tiêu (0–1)
  isInTerritory: boolean;
  isInjured: boolean;
  hasOffspringNearby: boolean;
  foodValue: number;     // giá trị làm thức ăn (0–1)
  threatLevel: number;   // nguy hiểm tổng thể (0–1)
  packCount: number;     // số lượng đồng loại trong trận (1+)
  isNight: boolean;      // ban đêm (tăng hung tính cho một số loài)
  habitatMatch: boolean; // có nằm trong môi trường sống tự nhiên không?
}

export type BeastAction =
  | "ATTACK"
  | "AMBUSH"
  | "RETREAT"
  | "IGNORE"
  | "HIDE"
  | "CALL_PACK"
  | "DEFEND_TERRITORY";

// ===== CORE =====

export function decideBeastAction(
  beast: Beast,
  ctx: BeastContext
): BeastAction {

  const score: Record<BeastAction, number> = {
    ATTACK: 0,
    AMBUSH: 0,
    RETREAT: 0,
    IGNORE: 0,
    HIDE: 0,
    CALL_PACK: 0,
    DEFEND_TERRITORY: 0,
  };

  const i = beast.instinct;

  // ===== 1. BẢN NĂNG CƠ BẢN =====

  const hungerDrive = i.hunger * ctx.foodValue;
  const fear = ctx.threatLevel * i.caution;
  const aggression = i.aggression;

  // ===== 2. ATTACK =====
  score.ATTACK += hungerDrive;
  score.ATTACK += aggression;
  score.ATTACK -= fear;
  score.ATTACK -= ctx.targetPower;

  // ===== 3. AMBUSH =====
  score.AMBUSH += hungerDrive * 0.7;
  score.AMBUSH += getAmbushBonus(beast.level);
  score.AMBUSH -= ctx.threatLevel * 0.5;

  // ===== 4. RETREAT =====
  score.RETREAT += fear;
  score.RETREAT += ctx.targetPower;
  score.RETREAT += ctx.isInjured ? 0.5 : 0;

  // ===== 5. IGNORE =====
  score.IGNORE += (1 - hungerDrive);
  score.IGNORE += i.caution * 0.3;

  // ===== 6. HIDE =====
  if (ctx.isInjured) {
    score.HIDE += i.caution;
    score.HIDE += 0.3;
  }

  // ===== 7. CALL PACK =====
  if (i.pack > 0.3) {
    score.CALL_PACK += i.pack * 2;
    score.CALL_PACK += ctx.targetPower * 0.8;
    score.CALL_PACK += ctx.isInjured ? 1.5 : 0; // Gọi cứu viện khi bị thương
    score.CALL_PACK -= (ctx.packCount - 1) * 0.5; // Giảm ưu tiên nếu đã có đồng đội
  }

  // ===== 8. DEFEND TERRITORY =====
  if (ctx.isInTerritory) {
    score.DEFEND_TERRITORY += i.territorial * 1.5;
    score.DEFEND_TERRITORY += aggression;
    score.DEFEND_TERRITORY -= ctx.isInjured ? 0.3 : 0;
  }

  // ===== 9. OFFSPRING TRIGGER =====
  if (ctx.hasOffspringNearby) {
    score.ATTACK += i.bloodline * 2;
    score.DEFEND_TERRITORY += i.bloodline * 2;
    score.RETREAT -= 1.0; // Tử chiến bảo vệ con
  }

  // ===== NIGHT MODIFIER =====
  if (ctx.isNight) {
    score.ATTACK += 0.5;
    score.AMBUSH += 0.8;
    score.IGNORE -= 0.4;
  }

  // ===== 10. HABITAT BONUS =====
  if (ctx.habitatMatch) {
    score.DEFEND_TERRITORY += 0.6;
    score.HIDE += 0.4;
    score.ATTACK += 0.2;
  }

  // ===== 11. LEVEL MODIFIER =====
  applyLevelModifier(beast.level, score);

  // ===== 11. CHỌN HÀNH ĐỘNG =====
  return weightedRandom(score);
}

// ===== LEVEL LOGIC =====

function applyLevelModifier(
  level: BeastLevel,
  score: Record<BeastAction, number>
) {
  switch (level) {
    case "LOW":
      score.ATTACK += 0.3;
      score.RETREAT -= 0.2;
      break;

    case "MID":
      score.AMBUSH += 0.3;
      break;

    case "HIGH":
      score.AMBUSH += 0.5;
      score.RETREAT += 0.3;
      break;

    case "LORD":
      score.AMBUSH += 0.7;
      score.IGNORE += 0.3;
      score.CALL_PACK += 0.5;
      break;
  }
}

function getAmbushBonus(level: BeastLevel): number {
  switch (level) {
    case "LOW": return 0.1;
    case "MID": return 0.3;
    case "HIGH": return 0.6;
    case "LORD": return 0.8;
  }
}

export interface BeastDecision {
  action: BeastAction;
  priority: number; // 0-1
  reason: string;
}

export function getBeastDecision(
  beast: CombatUnit,
  participants: CombatUnit[],
  currentRegion: string
): BeastDecision {
  if (!beast.isBeast || !beast.beastData) {
    return { action: "ATTACK", priority: 1, reason: "Phản xạ chiến đấu cơ bản." };
  }

  const player = participants.find(p => p.isPlayer);
  if (!player) return { action: "IGNORE", priority: 0, reason: "Không có mục tiêu." };

  const hpRatio = beast.hp / beast.maxHp;
  const targetPowerRatio = player.realmLevel > 0 ? (player.realmLevel / 10) : 0.1;

  // Count teammates of same type
  const teammates = participants.filter(p => !p.isPlayer && p.name.includes(beast.name) && p.isAlive);

  const ctx: BeastContext = {
    targetPower: targetPowerRatio,
    isInTerritory: true, // Thường là đang trong lãnh địa khi combat
    isInjured: hpRatio < 0.4,
    hasOffspringNearby: false,
    foodValue: 0.5,
    threatLevel: (targetPowerRatio * 0.7) + ((1 - hpRatio) * 0.3),
    packCount: teammates.length,
    isNight: false, // Có thể truyền thêm từ state nếu có hệ thống thời gian
    habitatMatch: beast.beastData.habitat.includes(currentRegion)
  };

  const beastParams: Beast = {
    name: beast.name,
    level: beast.beastData.level,
    hp: hpRatio,
    instinct: beast.beastData.instinct
  };

  const action = decideBeastAction(beastParams, ctx);
  
  let reason = "";
  switch(action) {
    case "ATTACK": reason = "Bản năng hung hãn trỗi dậy, tập trung tấn công."; break;
    case "AMBUSH": reason = "Dình rập sơ hở, chờ đợi thời cơ công kích."; break;
    case "RETREAT": reason = "Cảnh giác cao độ, bắt đầu tìm đường rút lui."; break;
    case "IGNORE": reason = "Không cảm thấy bị đe dọa mạnh mẽ."; break;
    case "HIDE": reason = "Ẩn mình vào bóng tối, chờ đợi thời cơ."; break;
    case "CALL_PACK": reason = "Gầm thét gọi bầy! Tình thế nguy hiểm."; break;
    case "DEFEND_TERRITORY": reason = "Tử chiến bảo vệ lãnh thổ!"; break;
  }

  return { action, priority: 1, reason };
}

// ===== RANDOM =====

function weightedRandom(scores: Record<string, number>): any {
  const entries = Object.entries(scores);
  const total = entries.reduce((s, [, v]) => s + Math.max(v, 0), 0);

  if (total <= 0) return "IGNORE";

  let r = Math.random() * total;

  for (const [k, v] of entries) {
    r -= Math.max(v, 0);
    if (r <= 0) return k;
  }

  return "IGNORE";
}