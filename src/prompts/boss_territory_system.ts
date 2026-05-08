// boss_territory_system.ts

import { MapRegion } from "../types";

// ===== TYPES =====

export interface Boss {
  name: string;
  level: number;
  regionId: string;

  territoryRadius: number;     // phạm vi lãnh địa
  aggression: number;          // mức độ tấn công
  intelligence: number;        // mức độ mưu (0–1)

  isAlive: boolean;
  respawnTime: number;         // ticks
  currentRespawn: number;

  position: { x: number; y: number };

  patrolType: "static" | "patrol" | "roam";
}

export interface BossTerritory {
  boss: Boss;
  influence: number; // ảnh hưởng lên spawn (0–1)
}

// ===== INFLUENCE TO SPAWN =====

export function applyBossInfluence(
  spawnRate: number,
  boss: Boss,
  distance: number
): number {
  if (!boss.isAlive) return spawnRate;

  if (distance < boss.territoryRadius) {
    // giảm spawn thường, tăng elite
    return spawnRate * 0.5;
  }

  return spawnRate;
}

// ===== REACTION =====

export function bossReact(
  boss: Boss,
  playerPower: number,
  distance: number
): "ATTACK" | "WARN" | "IGNORE" {

  if (!boss.isAlive) return "IGNORE";

  const threat = playerPower / boss.level;

  if (distance < boss.territoryRadius * 0.3) {
    if (threat < 0.8) return "ATTACK";
    if (boss.intelligence > 0.7) return "WARN";
    return "ATTACK";
  }

  if (distance < boss.territoryRadius) {
    return boss.aggression > 0.5 ? "ATTACK" : "WARN";
  }

  return "IGNORE";
}
