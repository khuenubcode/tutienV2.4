// cultivation_timeline_system.ts

// ===== KHÁI NIỆM CỐT LÕI =====
// Thế giới vận hành theo:
// - Thiên thời (chu kỳ)
// - Linh khí (thịnh – suy)
// - Nhân quả (hành động tích lũy)
// - Đại kiếp (biến cố lớn)

// ===== TYPES =====

export type EraPhase =
  | "SPIRIT_LOW"     // linh khí suy
  | "SPIRIT_RISE"    // linh khí tăng
  | "SPIRIT_PEAK"    // cực thịnh
  | "SPIRIT_DECAY";  // suy tàn

export interface HeavenlyCycle {
  year: number;
  month: number;
  day: number;

  phase: EraPhase;
  spiritualDensity: number; // 0–1

  karmaFlux: number;        // biến động nhân quả
  dangerLevel: number;      // độ hỗn loạn
}

export type DaoEventType =
  | "TRIBULATION"         // thiên kiếp
  | "SECRET_REALM"        // bí cảnh
  | "ANCIENT_AWAKEN"      // cổ di tích thức tỉnh
  | "DEMON_RISE"          // ma đạo trỗi dậy
  | "HEAVENLY_OPPORTUNITY"; // cơ duyên lớn

export interface DaoEvent {
  id: string;
  type: DaoEventType;

  startYear: number;
  duration: number;

  intensity: number; // 0–1
  regionId?: string;

  active: boolean;
}

// ===== CORE =====

export interface CultivationTimeline {
  cycle: HeavenlyCycle;
  events: DaoEvent[];
  lastTriggeredYear?: number;
  lastCombatTriggeredYear?: number;
  lastEventType: DaoEventType | null;
  consecutiveCount: number;
}

// ===== INIT =====

export function initCultivationTimeline(): CultivationTimeline {
  return {
    cycle: {
      year: 1,
      month: 1,
      day: 1,
      phase: "SPIRIT_LOW",
      spiritualDensity: 0.2,
      karmaFlux: 0.1,
      dangerLevel: 0.1,
    },
    events: [],
    lastTriggeredYear: -5, // Allow starting events early
    lastCombatTriggeredYear: -50,
    lastEventType: null,
    consecutiveCount: 0,
  };
}

// ===== UPDATE =====

export function advanceTime(tl: CultivationTimeline, daysPassed: number = 360) {
  // Convert current to total days (0-based)
  const c = tl.cycle;
  let totalDays = (c.year - 1) * 360 + (c.month - 1) * 30 + (c.day - 1);
  
  totalDays += Math.max(0, Math.floor(daysPassed));
  
  // Calculate new year, month, day
  const oldYear = c.year;
  c.year = Math.floor(totalDays / 360) + 1;
  c.month = Math.floor((totalDays % 360) / 30) + 1;
  c.day = (totalDays % 30) + 1;

  // Only trigger yearly events if year changed
  if (c.year !== oldYear) {
    updatePhase(tl);
    updateEvents(tl);
    maybeTriggerDaoEvent(tl);
  }
}

// ===== CHU KỲ LINH KHÍ =====

function updatePhase(tl: CultivationTimeline) {
  const y = tl.cycle.year % 100; // chu kỳ 100 năm

  if (y < 25) setPhase(tl, "SPIRIT_LOW", 0.2);
  else if (y < 50) setPhase(tl, "SPIRIT_RISE", 0.5);
  else if (y < 75) setPhase(tl, "SPIRIT_PEAK", 1.0);
  else setPhase(tl, "SPIRIT_DECAY", 0.4);

  // hệ quả
  tl.cycle.karmaFlux = tl.cycle.spiritualDensity * rand(0.5, 1.5);
  tl.cycle.dangerLevel = 1 - tl.cycle.spiritualDensity * 0.5;
}

function setPhase(
  tl: CultivationTimeline,
  phase: EraPhase,
  density: number
) {
  tl.cycle.phase = phase;
  tl.cycle.spiritualDensity = density;
}

// ===== EVENT =====

function updateEvents(tl: CultivationTimeline) {
  for (const ev of tl.events) {
    if (!ev.active) continue;

    if (tl.cycle.year > ev.startYear + ev.duration) {
      ev.active = false;
    }
  }
}

function maybeTriggerDaoEvent(tl: CultivationTimeline) {
  const GENERIC_COOLDOWN = 10;
  const COMBAT_COOLDOWN = 30;
  
  const lastYear = tl.lastTriggeredYear || -100;
  if (tl.cycle.year - lastYear < GENERIC_COOLDOWN) return;

  const baseChance = tl.cycle.spiritualDensity;

  if (Math.random() < baseChance * 0.05) {
    const eventType = pickEvent(tl);
    if (!eventType) return;

    const event = generateDaoEvent(tl, eventType);
    
    // Anti-spam for combat events
    const isCombat = event.type === 'TRIBULATION' || event.type === 'DEMON_RISE';
    
    if (isCombat) {
        const lastCombatYear = tl.lastCombatTriggeredYear || -100;
        if (tl.cycle.year - lastCombatYear < COMBAT_COOLDOWN) return;
        tl.lastCombatTriggeredYear = tl.cycle.year;
    }

    tl.events.push(event);
    tl.lastTriggeredYear = tl.cycle.year;
  }
}

function pickEvent(tl: CultivationTimeline): DaoEventType | null {
  const types: DaoEventType[] = [
    "TRIBULATION",
    "SECRET_REALM",
    "ANCIENT_AWAKEN",
    "DEMON_RISE",
    "HEAVENLY_OPPORTUNITY",
  ];

  const type = types[Math.floor(Math.random() * types.length)];
  
  if (type === tl.lastEventType) {
      if (tl.consecutiveCount >= 2) return null; // Already triggered 2 times, this would be 3rd
      tl.consecutiveCount += 1;
  } else {
      tl.lastEventType = type;
      tl.consecutiveCount = 0;
  }
  
  return type;
}

// ===== GENERATE =====

function generateDaoEvent(tl: CultivationTimeline, type: DaoEventType): DaoEvent {
  return {
    id: "dao_" + Date.now(),
    type,
    startYear: tl.cycle.year,
    duration: randInt(5, 30),
    intensity: Math.random(),
    regionId: randomRegion(),
    active: true,
  };
}

// ===== ÁP DỤNG ẢNH HƯỞNG =====

export function applyCultivationEffects(
  tl: CultivationTimeline,
  state: any
) {
  const cycle = tl.cycle;

  // 1. LINH KHÍ
  state.spiritualGain *= cycle.spiritualDensity;

  // 2. NGUY HIỂM
  state.danger += cycle.dangerLevel;

  // 3. EVENT
  for (const ev of tl.events) {
    if (!ev.active) continue;

    switch (ev.type) {
      case "TRIBULATION":
        state.breakthroughRisk += ev.intensity;
        break;

      case "SECRET_REALM":
        state.hasSecretRealm = true;
        break;

      case "ANCIENT_AWAKEN":
        state.spawnBossRate += ev.intensity;
        break;

      case "DEMON_RISE":
        state.hostility += ev.intensity;
        break;

      case "HEAVENLY_OPPORTUNITY":
        state.luck += ev.intensity;
        break;
    }
  }

  return state;
}

// ===== HELPERS =====

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomRegion(): string {
  const ids = ["tier_1","tier_2","tier_3","tier_4","tier_5"];
  return ids[Math.floor(Math.random() * ids.length)];
}
