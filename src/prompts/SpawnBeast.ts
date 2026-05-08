// beast_spawn_system.ts

import { MapRegion } from "../types";

// ===== TYPES =====

export interface SpawnContext {
  playerRealmLevel: number;  // level trong REALMS
  timeOfDay: "day" | "night";
  dangerLevel: number;       // 0–1 (khu vực hiện tại)
  isDeepZone: boolean;       // có phải vùng sâu / cấm khu
}

export interface BeastSpawn {
  name: string;
  rarity: "common" | "rare" | "elite" | "boss";
  level: number; // tương ứng realm level
}

// ===== CORE =====

export function spawnBeast(
  region: MapRegion,
  ctx: SpawnContext
): BeastSpawn {

  // 1. LỌC THEO TRẦN TU VI KHU VỰC
  const regionCap = parseRealmCap(region.cap);

  // 2. LEVEL SPAWN (bám theo player nhưng bị giới hạn bởi region)
  const baseLevel = Math.min(
    ctx.playerRealmLevel + randInt(-1, 2),
    regionCap
  );

  // 3. CHỌN LOÀI
  const pool = region.commonBeasts;

  let beastName = weightedPick(pool);

  // 4. RARITY LOGIC
  let rarity: BeastSpawn["rarity"] = "common";

  const dangerFactor = ctx.dangerLevel + (ctx.isDeepZone ? 0.3 : 0);

  if (Math.random() < 0.05 + dangerFactor * 0.2) {
    rarity = "boss";
  } else if (Math.random() < 0.15 + dangerFactor * 0.3) {
    rarity = "elite";
  } else if (Math.random() < 0.3) {
    rarity = "rare";
  }

  // 5. TIME MODIFIER
  if (ctx.timeOfDay === "night") {
    if (Math.random() < 0.3) {
      rarity = upgradeRarity(rarity);
    }
  }

  // 6. DEEP ZONE BONUS
  if (ctx.isDeepZone) {
    rarity = upgradeRarity(rarity);
  }

  // 7. FINAL ADJUST
  const finalLevel = adjustLevelByRarity(baseLevel, rarity);

  return {
    name: beastName,
    rarity,
    level: finalLevel,
  };
}

// ===== HELPERS =====

function parseRealmCap(cap: string): number {
  if (cap.includes("Trúc Cơ")) return 2;
  if (cap.includes("Kim Đan")) return 3;
  if (cap.includes("Nguyên Anh")) return 4;
  if (cap.includes("Hóa Thần")) return 5;
  if (cap.includes("Luyện Hư")) return 6;
  return 1;
}

function adjustLevelByRarity(level: number, rarity: string): number {
  switch (rarity) {
    case "common": return level;
    case "rare": return level + 1;
    case "elite": return level + 2;
    case "boss": return level + 3;
    default: return level;
  }
}

function upgradeRarity(r: BeastSpawn["rarity"]): BeastSpawn["rarity"] {
  switch (r) {
    case "common": return "rare";
    case "rare": return "elite";
    case "elite": return "boss";
    default: return "boss";
  }
}

function weightedPick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}