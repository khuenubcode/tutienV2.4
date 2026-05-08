// event_system.ts
// Integrated Event + Chain System (auto roll chain)

export type EventType =
  | "fortune"
  | "combat"
  | "cultivation"
  | "disaster"
  | "faction"
  | "trade"
  | "explore"
  | "npc"
  | "karma"
  | "legendary"
  | "chain"

export type Alignment = "good" | "bad" | "neutral"
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

export interface GameState {
  player: {
    hp: number
    mp: number
    realm: string
    luck: number
    karma?: number
    position: { x: number; y: number; region: string }
    status: string[]
  }
}

export interface EventMeta {
  alignment: Alignment
  rarity: Rarity
}

export interface EventResult {
  summary: string
  rewards?: string[]
  effects?: string[]
  startCombat?: boolean
  enemy?: string
  choices?: ChoiceOption[]
  chainStart?: string // NEW: trigger chain
}

export interface ChoiceOption {
  id: string
  text: string
  condition?: (state: GameState) => boolean
  outcome: (state: GameState) => EventResult
}

export interface GameEvent {
  id: string
  type: EventType
  meta: EventMeta
  weight: number
  condition?: (state: GameState) => boolean
  execute: (state: GameState) => EventResult
}

// ----------------------
// Rarity + Alignment
// ----------------------

const rarityWeights: Record<Rarity, number> = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 8,
  legendary: 2
}

function rollRarity(): Rarity {
  const total = Object.values(rarityWeights).reduce((a, b) => a + b, 0)
  let roll = Math.random() * total

  for (const r of Object.keys(rarityWeights) as Rarity[]) {
    if (roll < rarityWeights[r]) return r
    roll -= rarityWeights[r]
  }
  return "common"
}

function rollAlignment(state: GameState): Alignment {
  const luck = state.player.luck || 0
  const karma = state.player.karma || 0

  let good = 20 + luck * 2
  let bad = 20 + Math.max(0, -karma) * 2
  let neutral = 60 - (good + bad) / 2

  const total = good + bad + neutral
  let roll = Math.random() * total

  if (roll < good) return "good"
  roll -= good
  if (roll < bad) return "bad"
  return "neutral"
}

// ----------------------
// Event Pool
// ----------------------

const eventPool: GameEvent[] = [
  {
    id: "normal_combat",
    type: "combat",
    meta: { alignment: "bad", rarity: "common" },
    weight: 10,
    execute: (state) => ({
      summary: "Một yêu thú bất ngờ tập kích.",
      startCombat: true,
      enemy: getEnemyByRegion(state.player.position.region)
    })
  },
  {
    id: "random_encounter",
    type: "explore",
    meta: { alignment: "neutral", rarity: "common" },
    weight: 20,
    execute: () => ({
      summary: "Bạn đi ngang qua một khu rừng tĩnh lặng, cảnh vật hữu tình nhưng không có gì đặc biệt xảy ra.",
    })
  },
  {
    id: "weather_change_bad",
    type: "disaster",
    meta: { alignment: "bad", rarity: "uncommon" },
    weight: 5,
    execute: () => ({
      summary: "Thời tiết đột nhiên chuyển biến xấu, linh khí trở nên rối loạn. Bạn có cảm giác bất an.",
    })
  },
  {
    id: "weather_change_good",
    type: "fortune",
    meta: { alignment: "good", rarity: "uncommon" },
    weight: 5,
    execute: () => ({
      summary: "Linh khí hội tụ, thiên thời địa lợi, là lúc thích hợp để ngộ thiện.",
    })
  },

  {
    id: "rare_fortune",
    type: "fortune",
    meta: { alignment: "good", rarity: "rare" },
    weight: 5,
    execute: () => ({
      summary: "Ngươi phát hiện một cơ duyên hiếm.",
      rewards: ["rare_item"]
    })
  },

  {
    id: "chain_trigger_cave",
    type: "chain",
    meta: { alignment: "neutral", rarity: "epic" },
    weight: 3,
    execute: () => ({
      summary: "Một động phủ cổ hiện ra trước mắt...",
      chainStart: "ancient_cave_chain"
    })
  }
]

// ----------------------
// Core Roll
// ----------------------

export function rollEvent(state: GameState): GameEvent | null {
  const rarity = rollRarity()
  const alignment = rollAlignment(state)

  const candidates = eventPool.filter(
    (e) =>
      e.meta.rarity === rarity &&
      e.meta.alignment === alignment &&
      (!e.condition || e.condition(state))
  )

  if (candidates.length === 0) {
    // fallback to nothing if no valid event exists to avoid spamming combat
    return null;
  }

  const totalWeight = candidates.reduce((sum, e) => sum + e.weight, 0)
  let roll = Math.random() * totalWeight

  for (const e of candidates) {
    if (roll < e.weight) return e
    roll -= e.weight
  }

  return candidates[0]
}

export function triggerEvent(state: GameState): EventResult | null {
  if (Math.random() > 0.3) return null // 30% chance
  const event = rollEvent(state)
  if (!event) return null

  const result = event.execute(state)

  // AUTO CHAIN HOOK
  if (result.chainStart) {
    return {
      ...result,
      summary: result.summary + " (Chuỗi sự kiện bắt đầu)"
    }
  }

  return result
}

export function resolveChoice(
  state: GameState,
  choice: ChoiceOption
): EventResult {
  return choice.outcome(state)
}

// ----------------------
// Helpers
// ----------------------

function getEnemyByRegion(region: string): string {
  switch (region) {
    case "Ma Đạo":
      return randomFrom(["Huyết Ma", "Quỷ Tu", "Thi Ma"])
    case "Chính Đạo":
      return randomFrom(["Yêu Lang", "Linh Thú"])
    case "Sa Mạc":
      return randomFrom(["Sa Trùng", "Cốt Yêu"])
    default:
      return "Tán Tu"
  }
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
