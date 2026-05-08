import { StoredNPC, Combatant, Realm, NPCPersonality } from '../types';
import { getRandomPersonality } from '../data/npcPersonalities';

const NPC_STORAGE_KEY = 'cultivation_world_npcs';

export const saveNPCsLocal = (npcs: StoredNPC[]) => {
  localStorage.setItem(NPC_STORAGE_KEY, JSON.stringify(npcs));
};

export const getNPCsLocal = (): StoredNPC[] => {
  const data = localStorage.getItem(NPC_STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error parsing NPCs from local storage", e);
    return [];
  }
};

export const addNPCLocal = (npc: StoredNPC) => {
  const npcs = getNPCsLocal();
  const existingIdx = npcs.findIndex(n => n.id === npc.id);
  
  if (existingIdx >= 0) {
    npcs[existingIdx] = npc;
  } else {
    npcs.push(npc);
  }
  
  saveNPCsLocal(npcs);
};

export const convertToStoredNPC = (combatant: Combatant, realm: Realm, subRealm: number): StoredNPC => {
  return {
    id: combatant.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: combatant.name,
    realm: realm,
    subRealm: subRealm,
    gender: combatant.gender,
    costume: combatant.costume,
    spiritRoot: combatant.spiritRoot || "Thiên Phú Linh Căn",
    personality: combatant.personality || getRandomPersonality(),
    stats: {
      hp: combatant.hp,
      maxHp: combatant.maxHp,
      atk: combatant.atk,
      def: combatant.def,
      spd: combatant.spd
    },
    learnedTechniques: combatant.learnedTechniques || [],
    equipment: combatant.equipment || {},
    inventory: combatant.inventory || [],
    relation: 0,
    isAlive: true,
    lastEncountered: new Date().toISOString()
  };
};

export const deleteNPCLocal = (id: string) => {
  const npcs = getNPCsLocal().filter(n => n.id !== id);
  saveNPCsLocal(npcs);
};

export const getNPCLocal = (id: string): StoredNPC | undefined => {
  return getNPCsLocal().find(n => n.id === id);
};

export const updateNPCLocal = (npc: StoredNPC) => {
  const npcs = getNPCsLocal();
  const index = npcs.findIndex(n => n.id === npc.id);
  if (index >= 0) {
    npcs[index] = { ...npc, lastEncountered: new Date().toISOString() };
    saveNPCsLocal(npcs);
  }
};

export const updateNPCRelation = (id: string, delta: number) => {
  const npcs = getNPCsLocal();
  const npc = npcs.find(n => n.id === id);
  if (npc) {
    npc.relation = Math.max(-100, Math.min(100, npc.relation + delta));
    npc.lastEncountered = new Date().toISOString();
    saveNPCsLocal(npcs);
  }
};

export const addNPCNote = (id: string, note: string) => {
  const npcs = getNPCsLocal();
  const npc = npcs.find(n => n.id === id);
  if (npc) {
    const timestamp = new Date().toLocaleString('vi-VN');
    const newNote = `[${timestamp}] ${note}`;
    npc.notes = npc.notes ? `${npc.notes}\n${newNote}` : newNote;
    saveNPCsLocal(npcs);
  }
};

export const findNPCByName = (name: string): StoredNPC | undefined => {
  return getNPCsLocal().find(n => n.name === name);
};
