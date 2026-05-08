/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElementType } from './data/element_system';
import { Skill } from './data/skill_generator';
import { BeastLevel, BeastInstinct } from './prompts/MindsetBeast';

export type { Skill };

export type RealmLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Difficulty = 'Dễ' | 'Thường' | 'Khó' | 'Hồng Hoang';
export type StoryLength = 'Ngắn' | 'Bình thường' | 'Dài';
export type WeatherType = 'Nắng' | 'Mưa' | 'Tuyết' | 'Sương mù' | 'U ám' | 'Sấm sét';
export interface Realm {
  name: string;
  level: number;
  description: string;
  stages: string[];
}

export interface Sect {
  name: string;
  align: 'Chính' | 'Tà' | 'Trung Lập' | 'Ma';
  specialty: string;
  description: string;
}

export interface Talent {
  name: string;
  rank: 'Phàm' | 'Linh' | 'Địa' | 'Thiên' | 'Tiên' | 'Thần';
  effect: string;
}

export interface Background {
  id: string;
  name: string;
  description: string;
  startingItems: InventoryItem[];
  startingReputation: Record<string, number>;
  passive: string;
}

export interface Recipe {
  id: string;
  name: string;
  materials: Record<string, number>;
  result: string;
  description: string;
}

export interface Domain {
  name: string;
  element: string;
  strength: number; // 0-100
  stability: number; // 0-100
  effects: {
    buffSelf: string[];
    debuffEnemy: string[];
  };
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity: Rarity;
  amount: number;
  element?: ElementType;
  value?: number;
}

export interface NPCPersonality {
  rationality: number; // 0-100: Cảm tính ↔ Lý trí
  bravery: number;     // 0-100: Hèn nhát ↔ Gan lì
  morality: number;    // 0-100: Ma tính ↔ Nhân tính
  ambition: number;    // 0-100: An phận ↔ Tham vọng
}

export interface StoredNPC {
  id: string;
  name: string;
  realm: Realm;
  subRealm: number;
  gender: string;
  costume: string;
  spiritRoot: string;
  personality: NPCPersonality;
  stats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
  };
  learnedTechniques: any[];
  equipment: any;
  inventory: any[];
  relation: number;
  isAlive: boolean;
  lastEncountered: string;
  notes?: string;
}

export interface Combatant {
  id?: string;
  name: string;
  gender: string;
  costume: string;
  spiritRoot?: string;
  personality?: NPCPersonality;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  learnedTechniques?: any[];
  equipment?: any;
  inventory?: any[];
}

export interface NPC {
  id: string;
  name: string;
  temporaryName: string;
  isNameRevealed: boolean;
  alias?: string;
  nickname?: string;
  age: number;
  gender: string;
  style: string;
  powerLevel: string;
  realm: string;
  personality: string;
  personalityTraits?: NPCPersonality;
  innerSelf: string;
  background: string;
  faction: string;
  alignment: string;
  positionX?: number;
  positionY?: number;
  relationship: number; // Affinity 0-1000
  virginity: string;
  currentOutfit: string;
  eyeColor?: string;
  hairStyle?: string;
  clothing?: string;
  bodyDescription: Record<string, string>;
  libido: number;
  willpower: number;
  lust: number;
  fetish: string;
  sexualPreferences: string[];
  sexualArchetype: string;
  physicalLust: string;
  soulAmbition: string;
  shortTermGoal: string;
  longTermDream: string;
  mood: string;
  impression: string;
  currentOpinion: string;
  witnessedEvents: string[];
  knowledgeBase: string[];
  conditions: { name: string; type: 'temporary' | 'permanent'; description: string }[];
  network: { npcId: string; npcName: string; relation: string; description: string; affinity?: number }[];
  type: string; // Relationship with MC (e.g. "Chị gái", "Người lạ")
  inventory: InventoryItem[];
  skills: Skill[];
  combatSkills?: Skill[];
  element?: ElementType;
  voice: string;
  aura: string;
  physiologicalResponse: string;
  readinessState: string;
  iq?: number;
  mindset?: string;
  signaturePose: string;
  sensitivePoints: string;
  secrets: string;
  status: 'alive' | 'dead';
  powerScore?: number;
  attack?: number;
  defense?: number;
  maxHealth?: number;
  maxMana?: number;
  health?: number;
  mana?: number;
  speed?: number;
  accuracy?: number;
  luck?: number;
  domain?: Domain;
}

export interface StoredBeast {
  id: string;
  name: string;
  species: string;
  level: number;
  rarity: 'common' | 'rare' | 'elite' | 'boss';
  element: ElementType;
  stats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
    mana: number;
    maxMana: number;
  };
  instinct: BeastInstinct;
  isAlive: boolean;
  lastEncountered: string;
  notes?: string;
  drops: string[];
  habitat: string[];
}

export interface Beast {
  id: string;
  name: string;
  species: string;
  level: number;
  rarity: 'common' | 'rare' | 'elite' | 'boss';
  element: ElementType;
  habitat: string[];
  drops: string[];
  instinct: BeastInstinct;
  description: string;
  stats: {
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    speed: number;
    accuracy: number;
    mana: number;
    maxMana: number;
  };
  talents: Skill[]; // Beasts use talents instead of techniques
  status: 'alive' | 'dead';
}

export type Rarity = 'Phàm' | 'Linh' | 'Huyền' | 'Địa' | 'Thiên' | 'Đạo' | 'Thần';

export interface Equipment {
  name: string;
  rarity: Rarity;
  tier: string;
  realm: string;
  type: string;
  origin: string;
  main_effect: string;
  sub_effect: string;
  restriction: string;
  sentience: {
    level: 'none' | 'weak' | 'active' | 'independent';
    note: string;
  };
  backlash: string;
  stats?: {
    attack?: number;
    defense?: number;
    health?: number;
    mana?: number;
    speed?: number;
    accuracy?: number;
  };
  evolution_paths: string[];
  fate_quest: {
    trigger: string;
    chain: string[];
  };
  lore_hook: string;
}

export interface CultivationTechnique {
  id: string;
  name: string;
  tier: 'Phàm' | 'Linh' | 'Huyền' | 'Địa' | 'Thiên' | 'Đạo';
  path: 'Chính' | 'Ma' | 'Thể' | 'Hồn' | 'Kiếm' | 'Dị';
  element: ElementType[];
  level: number;
  maxLevel: number;
  experience: number;
  isActive: boolean;
  core: {
    description?: string; // Tạm giữ để tương thích ngược
    origin?: string;
    characteristics?: string;
    focus: 'Body' | 'Spirit' | 'Foundation' | 'Balanced';
  };
  circulation: {
    type: 'Tiểu Chu Thiên' | 'Đại Chu Thiên' | 'Nghịch';
    efficiency: number;
  };
  effects: {
    passive: string[];
    active: string[];
    stats?: {
      attackMult?: number;
      defenseMult?: number;
      healthMult?: number;
    };
  };
  cost: {
    risk: string;
    lifespan: number;
    requirements: string[];
  };
  mastery: {
    refinement: number;
    application: number;
  };
  evolution: {
    canMutate: boolean;
    direction: string[];
  };
}

export interface MapRegion {
  id: string; // Unique identifier (e.g. 'continent_east', 'sect_thanh_van')
  type: 'Continent' | 'City' | 'Sect' | 'Mountain' | 'Forest' | 'River' | 'Sea' | 'Dungeon' | 'ForbiddenZone';
  continentId?: string; // ID of the parent continent if applicable
  tierId: string;
  name: string;
  discovered: boolean;
  description: string;
  positionX?: number;
  positionY?: number;
  linhKhi: string;
  cap: string; // Max realm limit
  terrain: string;
  difficulty: number; // 1-10
  commonBeasts: string[];
  connectedRegionIds: string[];
  ownerFaction?: string;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  position: Vector2D;
  velocity?: Vector2D;
  speed: number;
  damage: number;
  accuracy: number;
  element: ElementType;
  isCrit: boolean;
  skillId: string;
  effects?: ActiveEffect[];
}

export interface ActiveEffect {
  id: string;
  type: 'buff' | 'debuff';
  name: string;
  isDot?: boolean;
  dotType?: 'current' | 'max';
  value?: number;
  stacks?: number;
  maxStacks?: number;
  duration: number;
  description: string;
  stat?: 'atk' | 'def' | 'spd';
  multiplier?: number;
}

export interface CombatUnit {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  critChance?: number;
  critDamage?: number;
  luck: number; // Added luck
  element: ElementType;
  skills: Skill[];
  isPlayer: boolean;
  isAlive: boolean;
  realmLevel: number;
  cooldowns: Record<string, number>; // Maps skill ID to timestamp when it becomes available again
  activeEffects: ActiveEffect[];
  isBeast?: boolean;
  beastData?: {
    level: BeastLevel;
    instinct: BeastInstinct;
    habitat: string[];
  };
  position: Vector2D;
  targetPosition?: Vector2D; // where the unit wants to move
  actionTimer: number; // For AI decision intervals
  lastTickTime?: number; // Internal for effect processing
  hitboxSize?: number; // Visual hitbox size for hit detection
  isEscaping?: boolean; // Tactic to run away
}

export interface CombatState {
  participants: CombatUnit[];
  projectiles: Projectile[];
  logs: string[];
  isFinished: boolean;
  winnerId?: string;
  lastUpdate: number;
  rewards?: InventoryItem[];
  rewardsClaimed?: boolean;
}

export interface ChronicleEntry {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  importance: 'common' | 'important' | 'monumental';
  category: 'player_choice' | 'fate' | 'world' | 'combat';
}

export interface PlayerState {
  name: string;
  realm: string;
  stage: string;
  realmLevel: number;
  body: number;
  spirit: number;
  foundation: number;
  spiritualRoot: {
    purity: number;
    type: string;
  };
  linhCan: string;
  talent: string;
  background: string;
  tuVi: number;
  tuViCapacity: number;
  breakthroughChance: number;
  breakthroughBonus: number; // Modifiers from failures/successes
  cultivationFocus: 'Body' | 'Spirit' | 'Foundation' | 'Balanced';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  reputation: number;
  karma: number;
  factionsReputation: Record<string, number>;
  resources: Record<string, number>;
  knownRecipes: string[];
  inventory: InventoryItem[];
  skills: Skill[];
  masteredTechniques: CultivationTechnique[];
  element?: ElementType;
  combatSkills?: Skill[];
  domain?: Domain;
  powerScore: number;
  attack: number;
  defense: number;
  speed: number;
  accuracy: number;
  critChance: number;
  critDamage: number;
  luck: number;
  equipment: Equipment[];
  equippedItems: {
    weapon?: Equipment;
    armor?: Equipment;
    accessory?: Equipment;
  };
  assets: { name: string; description: string }[];
  identities: string[];
  history: GameHistoryItem[];
  npcs: NPC[];
  currentLocation: string;
  positionX?: number;
  positionY?: number;
  chronicles: string;
  chronicleEntries: ChronicleEntry[];
  mapData?: MapRegion[];
  worldEquipments?: Equipment[];
  worldTechniques?: CultivationTechnique[];
  worldNPCs?: NPC[];
  worldBeasts?: any[];
  timeline: any; // Using any for now to avoid circular import or define it here
  gender: 'Nam' | 'Nữ';
  difficulty: Difficulty;
  customApiKey?: string;
  storyLength: StoryLength;
  weather: WeatherType;
  isInitialized: boolean;
  isNsfwEnabled: boolean;
  isCombat: boolean;
  combatState?: CombatState;
  
  // Arc management
  currentArcName?: string;
  archivedArcs?: {
    arcName: string;
    events: GameHistoryItem[];
    archivedAt: number;
    finalState: string;
  }[];
}

export interface GameHistoryItem {
  story: string;
  actionTaken?: string;
  timestamp: number;
  metadata?: {
    learnedTechnique?: string;
    foundEquipment?: string;
    realmUpgrade?: string;
  };
}
