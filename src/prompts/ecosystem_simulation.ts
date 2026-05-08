// ecosystem_simulation.ts

import { MapRegion } from "../types";

// ===== TYPES =====

export type DietType = "herbivore" | "carnivore" | "omnivore";

export interface Species {
  name: string;
  diet: DietType;
  basePower: number;     // 0–1
  reproduction: number;  // tốc độ sinh sản
}

export interface Population {
  species: Species;
  count: number;
}

export interface EcosystemRegion {
  region: MapRegion;
  populations: Population[];
}

// ===== SAMPLE SPECIES DB =====
// (có thể expand thêm sau)

export const SPECIES_DB: Record<string, Species> = {
  "Thanh Phong Lang": { name: "Thanh Phong Lang", diet: "carnivore", basePower: 0.4, reproduction: 0.2 },
  "Dã Hồ": { name: "Dã Hồ", diet: "omnivore", basePower: 0.3, reproduction: 0.3 },
  "Lôi Thỏ": { name: "Lôi Thỏ", diet: "herbivore", basePower: 0.1, reproduction: 0.6 },

  "Xích Diễm Hổ": { name: "Xích Diễm Hổ", diet: "carnivore", basePower: 0.7, reproduction: 0.1 },
  "Man Ngưu": { name: "Man Ngưu", diet: "herbivore", basePower: 0.5, reproduction: 0.25 },

  "Huyết Lang": { name: "Huyết Lang", diet: "carnivore", basePower: 0.6, reproduction: 0.2 },
  "Thi Hổ": { name: "Thi Hổ", diet: "carnivore", basePower: 0.8, reproduction: 0.05 },
};

// ===== INIT =====

export function initEcosystem(region: MapRegion): EcosystemRegion {
  const populations: Population[] = region.commonBeasts.map(name => ({
    species: SPECIES_DB[name],
    count: randInt(20, 100),
  }));

  return { region, populations };
}

// ===== TICK UPDATE =====

export function updateEcosystem(ecosystem: EcosystemRegion) {
  const pops = ecosystem.populations;

  // 1. SINH SẢN
  for (const pop of pops) {
    const growth = pop.count * pop.species.reproduction;
    pop.count += Math.floor(growth);
  }

  // 2. SĂN MỒI
  for (const predator of pops) {
    if (predator.species.diet === "herbivore") continue;

    for (const prey of pops) {
      if (prey === predator) continue;

      // herbivore bị ăn mạnh nhất
      let preyFactor =
        prey.species.diet === "herbivore" ? 1 :
        prey.species.diet === "omnivore" ? 0.6 : 0.3;

      const powerDiff = predator.species.basePower - prey.species.basePower;

      const huntChance = 0.1 + powerDiff * 0.5;

      if (Math.random() < huntChance) {
        const kill = Math.floor(prey.count * 0.1 * preyFactor);
        prey.count = Math.max(0, prey.count - kill);
      }
    }
  }

  // 3. CHẾT TỰ NHIÊN (overpopulation control)
  for (const pop of pops) {
    if (pop.count > 200) {
      pop.count -= Math.floor(pop.count * 0.2);
    }
  }

  // 4. TUYỆT CHỦNG / PHỤC HỒI
  for (const pop of pops) {
    if (pop.count <= 0) {
      // hồi sinh chậm (tái sinh hệ sinh thái)
      pop.count = randInt(5, 15);
    }
  }

  return ecosystem;
}

// ===== PLAYER IMPACT =====

export function applyPlayerHunting(
  ecosystem: EcosystemRegion,
  targetName: string,
  killAmount: number
) {
  const pop = ecosystem.populations.find(p => p.species.name === targetName);
  if (!pop) return;

  pop.count = Math.max(0, pop.count - killAmount);
}

// ===== SPAWN WEIGHT FROM ECOSYSTEM =====

export function getSpawnWeights(ecosystem: EcosystemRegion) {
  const total = ecosystem.populations.reduce((s, p) => s + p.count, 0);

  return ecosystem.populations.map(p => ({
    name: p.species.name,
    weight: p.count / total
  }));
}

// ===== HELPERS =====

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}