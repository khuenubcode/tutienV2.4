/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { PlayerState, GameHistoryItem, WeatherType, MapRegion, CombatUnit, CombatState, Skill, NPC, Difficulty, InventoryItem, Rarity, ChronicleEntry } from '../types';
import { loadGame, saveGame, clearSave } from '../services/saveService';
import { getChroniclesSummary } from '../lib/chronicleUtils';
import { getCounterMultiplier, getReaction, ElementType } from '../data/element_system';
import { REALMS } from '../data/worldData';
import { INITIAL_NPCS } from '../data/npcData';
import { calculatePowerScore } from '../data/powerscale';
import { calculateAllPlayerStats } from '../lib/playerStats';
import { generateSkill } from '../data/skill_generator';
import { initCultivationTimeline, advanceTime, } from '../data/cultivation_timeline_system';
import { TIME_UNIT_DAYS } from '../data/timename';
import { BEAST_DATABASE, BeastDefinition } from '../data/beastDatabase';
import { getBaseStats, getRandomBeastName, getRandomBeastSkillName } from '../data/enemyData';
import { ITEM_DATABASE } from '../data/items_database';
import { calculateCooldownMs } from '../engine/techniqueStats';
import {
  createEffect,
  addEffect,
  applyEffectsToStats,
  processTurnEffects,
  isHardControlled
} from '../data/statusEffectData';

const generateCombatRewards = (enemies: CombatUnit[], playerLuck: number, difficulty: string): InventoryItem[] => {
  const drops: InventoryItem[] = [];
  
  // Difficulty multiplier
  const diffMult = difficulty === 'Hồng Hoang' ? 2.0 : difficulty === 'Khó' ? 1.5 : 1.0;
  const luckMult = 1 + (playerLuck / 100);

  enemies.forEach(enemy => {
    if (enemy.isBeast && enemy.beastData) {
      // Find the beast definition to get the loot table
      const beastId = Object.keys(BEAST_DATABASE).find(k => BEAST_DATABASE[k].id === enemy.id || BEAST_DATABASE[k].name === enemy.name);
      const beastDef = beastId ? BEAST_DATABASE[beastId] : null;

      if (beastDef && beastDef.lootTable) {
        beastDef.lootTable.forEach(loot => {
          const adjustedChance = loot.chance * diffMult * luckMult;
          if (Math.random() < adjustedChance) {
            const itemDef = ITEM_DATABASE[loot.itemId];
            if (itemDef) {
              const amount = Math.floor(Math.random() * (loot.maxAmount - loot.minAmount + 1)) + loot.minAmount;
              drops.push({
                ...itemDef,
                amount
              });
            }
          }
        });
      }
    } else {
      // Humanoids/NPCs might drop items from their inventory or random pills
      if (Math.random() < 0.3 * diffMult) {
        const rewardKeys = ['heal_pill', 'mana_pill'];
        const randomKey = rewardKeys[Math.floor(Math.random() * rewardKeys.length)];
        const itemDef = ITEM_DATABASE[randomKey];
        if (itemDef) {
          drops.push({ ...itemDef, amount: 1 });
        }
      }
    }
  });

  // Consolidate identical items
  const consolidated: Record<string, InventoryItem> = {};
  drops.forEach(d => {
    if (consolidated[d.id]) {
      consolidated[d.id].amount += d.amount;
    } else {
      consolidated[d.id] = { ...d };
    }
  });

  return Object.values(consolidated);
};


const INITIAL_PLAYER_STATE: PlayerState = {
  name: '',
  gender: 'Nam',
  difficulty: 'Thường',
  realm: REALMS[0].name,
  stage: REALMS[0].stages[0],
  realmLevel: 0,
  body: 10,
  spirit: 10,
  foundation: 10,
  spiritualRoot: {
    purity: 50,
    type: 'Kim'
  },
  linhCan: '',
  talent: '',
  background: '',
  tuVi: 0,
  tuViCapacity: 100,
  breakthroughChance: 50,
  breakthroughBonus: 0,
  cultivationFocus: 'Balanced',
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  reputation: 0,
  karma: 0,
  factionsReputation: {},
  resources: {},
  knownRecipes: ['heal_pill', 'mana_pill'],
  inventory: [],
  skills: [],
  combatSkills: [
    {
      id: 'basic_attack',
      name: 'Đánh Thường',
      type: 'ACTIVE',
      element: 'VẬT LÝ',
      targetType: 'SINGLE',
      baseDamage: 10,
      scaling: 100,
      cost: 0,
      cooldown: 0,
      description: 'Đòn tấn công vật lý cơ bản.',
      rarity: 'COMMON'
    }
  ],
  element: 'KIM',
  masteredTechniques: [],
  equipment: [],
  equippedItems: {
    weapon: undefined,
    armor: undefined,
    accessory: undefined
  },
  assets: [],
  identities: [],
  powerScore: 100,
  attack: 20,
  defense: 15,
  speed: 10,
  critChance: 5,
  critDamage: 150,
  luck: 10,
  accuracy: 60,
  history: [],
  npcs: INITIAL_NPCS,
  currentLocation: 'Phàm Giới (Thanh Thạch Thành)',
  positionX: 0,
  positionY: 0,
  chronicles: '[TÓM TẮT CỐT TRUYỆN CHÍNH]: Hành trình chưa bắt đầu.\n[NHÂN VẬT & QUAN HỆ QUAN TRỌNG]: Chưa có.\n[KỲ NGỘ & BẢO VẬT TỐI CAO]: Chưa có.\n[DÒNG THỜI GIAN SỰ KIỆN LỚN (TIMELINE)]:\n- Khởi đầu cuộc hành trình.',
  chronicleEntries: [],
  mapData: [],
  worldEquipments: [],
  worldTechniques: [],
  worldNPCs: [],
  worldBeasts: [],
  timeline: initCultivationTimeline(),
  storyLength: 'Bình thường',
  weather: 'Nắng',
  isInitialized: false,
  isNsfwEnabled: false,
  isCombat: false
};

const getSavedState = (): PlayerState => {
  if (typeof window === 'undefined') return INITIAL_PLAYER_STATE;
  const saved = loadGame();
  if (saved) {
    try {
      const parsed = saved;
      // Ensure history is not empty if we were initialized
      if (parsed.isInitialized && (!parsed.history || parsed.history.length === 0)) {
        return INITIAL_PLAYER_STATE;
      }
      return {
        ...INITIAL_PLAYER_STATE,
        ...parsed,
        spiritualRoot: {
          ...INITIAL_PLAYER_STATE.spiritualRoot,
          ...(parsed.spiritualRoot || {})
        },
        equippedItems: {
          ...INITIAL_PLAYER_STATE.equippedItems,
          ...(parsed.equippedItems || {})
        },
        factionsReputation: parsed.factionsReputation || INITIAL_PLAYER_STATE.factionsReputation,
        resources: parsed.resources || INITIAL_PLAYER_STATE.resources,
        inventory: parsed.inventory || INITIAL_PLAYER_STATE.inventory,
        skills: parsed.skills || INITIAL_PLAYER_STATE.skills,
        combatSkills: parsed.combatSkills || INITIAL_PLAYER_STATE.combatSkills,
        masteredTechniques: (parsed.masteredTechniques || []).map((t: any, idx: number) => ({
          id: `tech_${idx}_${Date.now()}`,
          ...t,
          core: {
            focus: 'Balanced',
            description: '',
            ...(t.core || {})
          }
        })),
        equipment: (parsed.equipment || INITIAL_PLAYER_STATE.equipment).map((e: any) => ({ ...e, rarity: e.rarity || 'Phàm' })),
        assets: parsed.assets || INITIAL_PLAYER_STATE.assets,
        history: parsed.history || INITIAL_PLAYER_STATE.history,
        mapData: parsed.mapData || INITIAL_PLAYER_STATE.mapData,
        worldEquipments: parsed.worldEquipments || INITIAL_PLAYER_STATE.worldEquipments,
        worldTechniques: parsed.worldTechniques || INITIAL_PLAYER_STATE.worldTechniques,
        worldNPCs: parsed.worldNPCs || INITIAL_PLAYER_STATE.worldNPCs,
        worldBeasts: parsed.worldBeasts || INITIAL_PLAYER_STATE.worldBeasts,
        timeline: parsed.timeline || INITIAL_PLAYER_STATE.timeline,
        isCombat: parsed.isCombat || false,
        combatState: parsed.combatState
      };
    } catch (e) {
      console.error("Failed to load saved state", e);
      return INITIAL_PLAYER_STATE;
    }
  }
  return INITIAL_PLAYER_STATE;
};

export function useGameState() {
  const [state, setState] = useState<PlayerState>(getSavedState);

  // Auto-save on state change
  useEffect(() => {
    saveGame(state);
  }, [state]);

  // Recalculate stats whenever relevant state changes
  useEffect(() => {
    if (state.name) {
      const allStats = calculateAllPlayerStats(state);

      if (
        allStats.attack !== state.attack || 
        allStats.defense !== state.defense || 
        allStats.maxHealth !== state.maxHealth || 
        allStats.maxMana !== state.maxMana ||
        allStats.powerScore !== state.powerScore ||
        allStats.speed !== state.speed ||
        allStats.critChance !== state.critChance ||
        allStats.critDamage !== state.critDamage ||
        allStats.luck !== state.luck ||
        allStats.accuracy !== state.accuracy ||
        allStats.breakthroughChance !== state.breakthroughChance
      ) {
        setState(prev => ({ 
          ...prev, 
          attack: allStats.attack, 
          defense: allStats.defense, 
          maxHealth: allStats.maxHealth, 
          maxMana: allStats.maxMana,
          powerScore: allStats.powerScore,
          speed: allStats.speed,
          accuracy: allStats.accuracy,
          critChance: allStats.critChance,
          critDamage: allStats.critDamage,
          luck: allStats.luck,
          breakthroughChance: allStats.breakthroughChance,
          // Sync current health/mana if they exceed new max
          health: Math.min(prev.health, allStats.maxHealth),
          mana: Math.min(prev.mana, allStats.maxMana)
        }));
      }
    }
  }, [
    state.realmLevel,
    state.body,
    state.spirit,
    state.foundation,
    state.spiritualRoot?.purity,
    state.masteredTechniques,
    state.equippedItems,
    state.realm,
    state.stage,
    state.domain,
    state.name
  ]);

  // Death Logic
  useEffect(() => {
    if (state.isInitialized && state.health <= 0 && !state.isCombat) {
      // In a text-based game, death could be a reset or a special story event
      // For now, let's just alert and we could later add a specific death screen
      console.log("Nhân vật đã vẫn lạc...");
    }
  }, [state.health, state.isInitialized, state.isCombat]);

  const initPlayer = useCallback((data: Partial<PlayerState>) => {
    setState(prev => ({
      ...prev,
      ...data,
      isInitialized: true
    }));
  }, []);

  const resetGame = useCallback(() => {
    // Clear persistence
    clearSave();
    sessionStorage.clear();
    
    // Attempt to clear Cache Storage
    if ('caches' in window) {
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).catch(err => console.error("Cache clear error:", err));
    }

    // Reset state
    setState(INITIAL_PLAYER_STATE);
    
    // Force reload to clear any remaining in-memory cache/AI context
    window.location.href = window.location.origin + window.location.pathname;
  }, []);

  const updateStats = useCallback((updates: any) => {
    setState(prev => {
      let newState = { ...prev };
      
      if (updates.tuViChange !== undefined) {
        const change = Number(updates.tuViChange);
        if (!isNaN(change) && isFinite(change)) {
          // Cap tuVi change to 5% of capacity per action to prevent "infinite" jumps from AI
          const cappedChange = Math.min(change, newState.tuViCapacity * 0.05);
          newState.tuVi = Math.max(0, Math.min(newState.tuViCapacity, newState.tuVi + cappedChange));
        }
      }
      if (updates.healthChange !== undefined) {
        const change = Number(updates.healthChange);
        if (!isNaN(change)) {
          newState.health = Math.max(0, Math.min(prev.maxHealth || 100, prev.health + change));
        }
      }
      if (updates.manaChange !== undefined) {
        const change = Number(updates.manaChange);
        if (!isNaN(change)) {
          newState.mana = Math.max(0, Math.min(prev.maxMana || 50, prev.mana + change));
        }
      }
      if (updates.reputationChange) newState.reputation += updates.reputationChange;
      if (updates.karmaChange) newState.karma += updates.karmaChange;
      if (updates.body !== undefined) newState.body = updates.body;
      if (updates.spirit !== undefined) newState.spirit = updates.spirit;
      if (updates.foundation !== undefined) newState.foundation = updates.foundation;
      if (updates.spiritualRoot) {
        newState.spiritualRoot = { ...prev.spiritualRoot, ...updates.spiritualRoot };
      }
      if (updates.talent) newState.talent = updates.talent;
      if (updates.linhCan) newState.linhCan = updates.linhCan;
      if (updates.background) newState.background = updates.background;
      if (updates.element) newState.element = updates.element;
      
      // Extended realm/tuVi support
      if (updates.realm) newState.realm = updates.realm;
      if (updates.stage) newState.stage = updates.stage;
      if (updates.realmLevel !== undefined) newState.realmLevel = updates.realmLevel;
      if (updates.tuVi !== undefined) {
        const val = Number(updates.tuVi);
        if (!isNaN(val) && isFinite(val)) {
          newState.tuVi = Math.max(0, Math.min(newState.tuViCapacity, val));
        }
      }
      if (updates.tuViCapacity !== undefined) {
        const val = Number(updates.tuViCapacity);
        if (!isNaN(val) && isFinite(val) && val > 0) {
          newState.tuViCapacity = val;
        }
      }
      
      // New structure support
      if (updates.inventoryAdd) {
        newState.inventory = [...(prev.inventory || []), ...updates.inventoryAdd];
      }
      if (updates.inventoryRemove && Array.isArray(updates.inventoryRemove)) {
        const removeNames = updates.inventoryRemove.map(n => typeof n === 'string' ? n.toLowerCase() : String(n));
        newState.inventory = (prev.inventory || []).filter(item => !removeNames.some(rn => item.name.toLowerCase().includes(rn) || rn.includes(item.name.toLowerCase())));
      }
      if (updates.skillsAdd) {
        newState.skills = [...(prev.skills || []), ...updates.skillsAdd];
      }
      if (updates.combatSkillsAdd && Array.isArray(updates.combatSkillsAdd)) {
        const validSkills = updates.combatSkillsAdd.map((s: any, idx: number) => ({
          ...s,
          id: s.id || `combat_skill_${Date.now()}_${idx}`,
          name: s.name || 'Vô Danh Kỹ',
          baseDamage: typeof s.baseDamage === 'number' ? s.baseDamage : 15,
          scaling: typeof s.scaling === 'number' ? s.scaling : 100,
          cost: typeof s.cost === 'number' ? s.cost : 10,
          cooldown: typeof s.cooldown === 'number' ? s.cooldown : 3,
          element: s.element || 'VẬT LÝ',
          targetType: s.targetType || s.target || 'SINGLE',
          rarity: s.rarity || 'COMMON',
          type: s.type || 'ACTIVE',
          description: s.description || 'Chưa rõ huyền cơ.'
        }));
        newState.combatSkills = [...(prev.combatSkills || []), ...validSkills];
      }
      if (updates.assetsAdd) {
        newState.assets = [...(prev.assets || []), ...updates.assetsAdd];
      }
      if (updates.locationUpdate && typeof updates.locationUpdate === 'string') {
        newState.currentLocation = updates.locationUpdate;
        
        // Auto-sync position if mapData exists and coordinates weren't explicitly provided
        if (newState.mapData && updates.positionX === undefined && updates.positionY === undefined) {
          const locLower = updates.locationUpdate.toLowerCase();
          const region = newState.mapData.find(r => 
            r.name.toLowerCase().includes(locLower) || 
            locLower.includes(r.name.toLowerCase()) ||
            r.id === updates.locationUpdate
          );
          if (region && region.positionX !== undefined && region.positionY !== undefined) {
            newState.positionX = region.positionX;
            newState.positionY = region.positionY;
          }
        }
      }
      if (updates.positionX !== undefined) {
        newState.positionX = updates.positionX;
      }
      if (updates.positionY !== undefined) {
        newState.positionY = updates.positionY;
      }
      
      if (updates.discoveredRegionIds && Array.isArray(updates.discoveredRegionIds)) {
        if (newState.mapData) {
          newState.mapData = newState.mapData.map(region => ({
            ...region,
            discovered: region.discovered || 
                        updates.discoveredRegionIds!.includes(region.id) ||
                        updates.discoveredRegionIds!.some((idOrName: string) => 
                          region.name.toLowerCase().includes(idOrName.toLowerCase()) || 
                          idOrName.toLowerCase().includes(region.name.toLowerCase())
                        )
          }));
        }
      }

      // Update faction reputation if provided
      if (updates.factionUpdates && typeof updates.factionUpdates === 'object') {
        newState.factionsReputation = { ...(prev.factionsReputation || {}) };
        Object.entries(updates.factionUpdates).forEach(([faction, change]) => {
          newState.factionsReputation[faction] = (newState.factionsReputation[faction] || 0) + (change as number);
        });
      }

      // Update resources if provided
      if (updates.resourceUpdates && typeof updates.resourceUpdates === 'object') {
        newState.resources = { ...(prev.resources || {}) };
        Object.entries(updates.resourceUpdates).forEach(([res, change]) => {
          newState.resources[res] = Math.max(0, (newState.resources[res] || 0) + (change as number));
        });
      }

      return newState;
    });
  }, []);

  const craftItem = useCallback((recipe: any) => {
    setState(prev => {
      const materials = recipe.materials || {};
      const resources = prev.resources || {};
      const canCraft = Object.entries(materials as Record<string, number>).every(([res, amount]) => (resources[res] || 0) >= amount);
      if (!canCraft) return prev;

      const newResources = { ...resources };
      Object.entries(materials as Record<string, number>).forEach(([res, amount]) => {
        newResources[res] -= amount;
      });

      const itemDef = Object.values(ITEM_DATABASE).find(i => i.name === recipe.result) || {
        id: `crafted_${Date.now()}`,
        name: recipe.result,
        description: 'Luyện chế phẩm',
        type: 'CONSUMABLE',
        rarity: 'Phàm' as Rarity,
        amount: 1
      };

      const newItem: InventoryItem = {
        ...itemDef,
        amount: 1
      };

      const newInventory = [...prev.inventory];
      const existing = newInventory.find(i => i.id === newItem.id);
      if (existing) {
        existing.amount += 1;
      } else {
        newInventory.push(newItem);
      }

      return {
        ...prev,
        resources: newResources,
        inventory: newInventory
      };
    });
  }, []);

  const equipItem = useCallback((item: any) => {
    setState(prev => {
      const type = item.type.toLowerCase();
      let slot: 'weapon' | 'armor' | 'accessory' = 'accessory';
      
      if (type.includes('kiếm') || type.includes('đao') || type.includes('vũ khí')) slot = 'weapon';
      else if (type.includes('giáp') || type.includes('y phục')) slot = 'armor';
      
      return {
        ...prev,
        equippedItems: {
          ...prev.equippedItems,
          [slot]: item
        }
      };
    });
  }, []);

  const unequipItem = useCallback((slot: 'weapon' | 'armor' | 'accessory') => {
    setState(prev => ({
      ...prev,
      equippedItems: {
        ...prev.equippedItems,
        [slot]: undefined
      }
    }));
  }, []);

  const consumeItem = useCallback((itemId: string) => {
    setState(prev => {
      const itemIndex = prev.inventory.findIndex(i => i.id === itemId);
      if (itemIndex === -1) return prev;
      
      const item = prev.inventory[itemIndex];
      // Assuming item type 'CONSUMABLE' means it can be used
      if (item.type !== 'CONSUMABLE') return prev;

      // Apply effect (simple implementation based on item name for now as a demo)
      let healthChange = 0;
      let manaChange = 0;
      if (item.name.includes('Đan hồi máu')) healthChange = 30;
      if (item.name.includes('Đan hồi mana')) manaChange = 20;
      
      const newInventory = [...prev.inventory];
      if (item.amount > 1) {
        newInventory[itemIndex] = { ...item, amount: item.amount - 1 };
      } else {
        newInventory.splice(itemIndex, 1);
      }

      return {
        ...prev,
        inventory: newInventory,
        health: Math.min(prev.maxHealth, prev.health + healthChange),
        mana: Math.min(prev.maxMana, prev.mana + manaChange)
      };
    });
  }, []);

  const addHistory = useCallback((
    story: string, 
    actionTaken?: string, 
    newNpcs?: any[], 
    chronicles?: string, 
    weather?: WeatherType, 
    mapData?: MapRegion[], 
    newEquipment?: any, 
    newTechnique?: any, 
    newBeasts?: any[], 
    timePassed?: { unit: string, value: number },
    chronicleEntry?: ChronicleEntry
  ) => {
    setState(prev => {
      let updatedNpcs = [...(prev.npcs || [])];
      if (newNpcs) {
        newNpcs.forEach(n => {
          const idx = updatedNpcs.findIndex(old => old.id === n.id || old.name === (n.name || n.temporaryName));
          if (idx >= 0) {
            // Prevent accidental resurrection
            const wasDead = updatedNpcs[idx].status === 'dead';
            const isAliveNow = n.status === 'alive';
            
            let mergedStatus = wasDead ? 'dead' : (n.status || updatedNpcs[idx].status);
            
            updatedNpcs[idx] = { 
              ...updatedNpcs[idx], 
              ...n,
              status: mergedStatus as any
            };
          } else {
            // New NPC: Ensure defaults
            const newNpcWithDefaults = {
              status: 'alive',
              health: 100,
              maxHealth: 100,
              attack: 10,
              defense: 5,
              speed: 10,
              mana: 50,
              maxMana: 50,
              realm: 'Phàm Nhân',
              age: 20,
              inventory: [],
              skills: [],
              relationship: 0,
              isNameRevealed: n.isNameRevealed ?? false,
              ...n,
              id: n.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
            updatedNpcs.push(newNpcWithDefaults);
          }
        });
      }

      const updatedEquipment = newEquipment 
        ? [...(prev.equipment || []), { ...newEquipment, rarity: newEquipment.rarity || 'Phàm' }] 
        : (prev.equipment || []);
      
      const updatedBeasts = newBeasts
        ? [...(prev.worldBeasts || []), ...newBeasts]
        : (prev.worldBeasts || []);
      
      let updatedTechniques = [...(prev.masteredTechniques || [])];
      let updatedCombatSkills = [...(prev.combatSkills || [])];
      let extraHistory: GameHistoryItem[] = [];
      let nextRealmLevel = prev.realmLevel;
      let nextRealm = prev.realm;
      let nextStage = prev.stage;
      let historyMetadata: any = {};

      if (newEquipment) {
        historyMetadata.foundEquipment = newEquipment.name;
      }

      if (newTechnique) {
        const alreadyHas = updatedTechniques.find(t => t.name === newTechnique.name);
        if (!alreadyHas) {
          const techWithDefaults = {
            ...newTechnique,
            id: newTechnique.id || `tech_${Date.now()}`,
            level: newTechnique.level || 1,
            maxLevel: newTechnique.maxLevel || 10,
            experience: newTechnique.experience || 0,
            isActive: updatedTechniques.length === 0, // Auto-activate if it's the first one
            circulation: {
              type: 'Chu Thiên',
              efficiency: 100,
              path: [],
              ...(newTechnique.circulation || {})
            },
            mastery: {
              refinement: 10,
              application: 5,
              ...(newTechnique.mastery || {})
            },
            core: {
              focus: 'Balanced',
              description: '',
              ...(newTechnique.core || {})
            }
          };
          updatedTechniques.push(techWithDefaults);
          historyMetadata.learnedTechnique = newTechnique.name;
          
          // If player is still a Phàm Nhân (Realm 0), upgrade to Luyện Khí (Realm 1)
          if (prev.realmLevel === 0) {
            nextRealmLevel = 1;
            const realmData = REALMS.find(r => r.level === 1);
            if (realmData) {
              nextRealm = realmData.name;
              nextStage = realmData.stages[0];
            }
            historyMetadata.realmUpgrade = nextRealm;
            extraHistory.push({
              story: `[Đột Phá] Thông qua việc lĩnh hội ${newTechnique.name}, bạn đã cảm ứng được linh khí, chính thức bước vào con đường tu tiên (Luyện Khí Tầng 1)!`,
              timestamp: Date.now() + 1
            });
          }

          // Generate a combat skill for the new technique
          const newSkill = generateSkill({
            level: Math.max(1, nextRealmLevel) * 10,
            elements: techWithDefaults.element,
            rarity: techWithDefaults.tier === 'Thiên' || techWithDefaults.tier === 'Đạo' ? 'MYTHIC' : 
                    techWithDefaults.tier === 'Địa' ? 'LEGENDARY' :
                    techWithDefaults.tier === 'Huyền' ? 'EPIC' : 
                    techWithDefaults.tier === 'Linh' ? 'RARE' : 'COMMON'
          });
          newSkill.originTechnique = techWithDefaults.name;
          updatedCombatSkills.push(newSkill);
          extraHistory.push({
            story: `[Ngộ Đạo] Bạn đã lĩnh hội được tuyệt học mới thông qua ${techWithDefaults.name}: ${newSkill.name}!`,
            timestamp: Date.now() + 1
          });
        }
      }

      // Advance timeline
      let updatedTimeline = { ...prev.timeline };
      let daysPassed = 30; // default 1 tháng
      if (timePassed && timePassed.unit && typeof timePassed.value === 'number') {
         let multiplier = TIME_UNIT_DAYS[timePassed.unit.toLowerCase()] || 1;
         daysPassed = timePassed.value * multiplier;
      }
      advanceTime(updatedTimeline, daysPassed);
      
      let nextHealth = prev.health;
      let nextMana = prev.mana;
      
      if (!prev.isCombat) {
          const hpRegen = Math.floor(prev.maxHealth * 0.02 + (prev.realmLevel || 0) * 2);
          const mpRegen = Math.floor(prev.maxMana * 0.03 + (prev.realmLevel || 0) * 3);
          nextHealth = Math.min(prev.maxHealth, prev.health + hpRegen);
          nextMana = Math.min(prev.maxMana, prev.mana + mpRegen);
      }

      return {
        ...prev,
        realm: nextRealm,
        realmLevel: nextRealmLevel,
        stage: nextStage,
        history: [...(prev.history || []), { story, actionTaken, timestamp: Date.now(), metadata: historyMetadata }, ...extraHistory],
        npcs: updatedNpcs,
        equipment: updatedEquipment,
        masteredTechniques: updatedTechniques,
        combatSkills: updatedCombatSkills,
        chronicles: getChroniclesSummary(
          chronicleEntry ? [...(prev.chronicleEntries || []), chronicleEntry] : (prev.chronicleEntries || [])
        ).recentEventsDescription,
        chronicleEntries: chronicleEntry ? [...(prev.chronicleEntries || []), chronicleEntry] : (prev.chronicleEntries || []),
        weather: weather || (prev.weather as any),
        mapData: mapData || prev.mapData,
        worldBeasts: updatedBeasts,
        timeline: updatedTimeline,
        health: nextHealth,
        mana: nextMana
      };
    });
  }, []);

  const startNewArc = useCallback((arcName: string) => {
    setState(prev => ({
      ...prev,
      currentArcName: arcName,
      archivedArcs: [
        ...(prev.archivedArcs || []),
        {
          arcName: prev.currentArcName || 'Khởi Đầu',
          events: prev.history,
          archivedAt: Date.now(),
          finalState: prev.chronicles
        }
      ],
      history: [] // Reset history for the new arc session
    }));
  }, []);

  const toggleNsfw = useCallback(() => {
    setState(prev => ({ ...prev, isNsfwEnabled: !prev.isNsfwEnabled }));
  }, []);

  const updateCustomApiKey = useCallback((key: string) => {
    const sanitizedKey = key.replace(/[^\x20-\x7E]/g, "").trim();
    setState(prev => ({ ...prev, customApiKey: sanitizedKey }));
  }, []);

  const updateStoryLength = useCallback((length: PlayerState['storyLength']) => {
    setState(prev => ({ ...prev, storyLength: length }));
  }, []);

  const startCombat = useCallback((enemies: any[]) => {
    try {
      setState(prev => {
        let playerSkills = prev.combatSkills || [];
        const basicAttack: Skill = {
          id: 'basic_attack',
          name: 'Đấm Tay Đôi',
          description: 'Chiêu thức bản năng khi chưa có pháp lực hoặc cạn kiệt linh lực.',
          type: 'ACTIVE',
          baseDamage: Math.ceil((prev.attack || 10) * 0.2),
          scaling: 100,
          element: 'VẬT LÝ' as ElementType,
          cost: 0,
          cooldown: 0,
          targetType: 'SINGLE',
          rarity: 'COMMON'
        };

        if (!playerSkills.some(s => s.id === 'basic_attack')) {
          playerSkills = [...playerSkills, basicAttack];
        }

        const playerUnit: CombatUnit = {
          id: 'player',
          name: prev.name || 'Người chơi',
          hp: prev.health || 100,
          maxHp: prev.maxHealth || 100,
          mana: prev.mana || 50,
          maxMana: prev.maxMana || 50,
          attack: prev.attack || 10,
          defense: prev.defense || 5,
          speed: prev.speed || 10,
          accuracy: prev.accuracy || 60,
          element: (prev.element as ElementType) || 'KIM',
          skills: playerSkills as any,
          isPlayer: true,
          isAlive: true,
          realmLevel: prev.realmLevel || 0,
          cooldowns: {},
          activeEffects: [],
          position: { x: 5, y: 50 },
          actionTimer: 0,
          hitboxSize: 7,
          luck: prev.luck || 0
        };

        const enemyUnits: CombatUnit[] = enemies.map((e, idx) => {
          let beastDef = e.name && typeof e.name === 'string' ? BEAST_DATABASE[e.name] : null;
          if (!beastDef && prev.worldBeasts && e.name) {
            beastDef = prev.worldBeasts.find(b => b.name === e.name);
          }
          
          const beastLevelMap: Record<string, number> = { 'LOW': 1, 'MID': 3, 'HIGH': 5, 'LEGEND': 8 };
          const rawLevel = e.realmLevel || e.level || 0;
          const numericLevel = typeof rawLevel === 'string' ? (beastLevelMap[rawLevel] || 1) : rawLevel;

          const isBeast = !!beastDef || !!e.isBeast || !!e.species || !!e.talents;
          
          let hp, maxHp, mana, maxMana, attack, defense, speed, accuracy;
          
          if (isBeast) {
              const beastStats = getBaseStats(numericLevel as any, e.subRealm || 1, 0.1);
              const powerFactor = e.basePower || beastDef?.basePower || 1.0;
              hp = Math.floor(beastStats.hp * powerFactor);
              attack = Math.floor(beastStats.atk * powerFactor);
              defense = Math.floor(beastStats.def * Math.max(0.7, powerFactor));
              speed = Math.floor(beastStats.spd * powerFactor);
              accuracy = Math.floor(beastStats.acc);
              maxHp = hp;
              mana = 0;
              maxMana = 0;
          } else {
              // Scale factor based on realm
              const realmScale = Math.pow(1.4, numericLevel); // Slightly lower than player 1.5
              const powerFactor = e.basePower || 0.5;

              // Handle both AI payload (e.stats) and direct NPC object (e.health, e.attack, etc.)
              // Use scaling logic if base stats are missing or generic
              const baseAtk = 15;
              const baseDef = 10;
              const baseHp = 80;

              attack = e.stats?.attack || e.attack || Math.floor((baseAtk + powerFactor * 20) * realmScale);
              defense = e.stats?.defense || e.defense || Math.floor((baseDef + powerFactor * 15) * realmScale);
              hp = e.stats?.health || e.health || Math.floor((baseHp + powerFactor * 100) * realmScale * 1.5);
              maxHp = e.stats?.maxHealth || e.maxHealth || hp;
              mana = e.stats?.mana || e.mana || (e.spirit ? e.spirit * 10 : 50);
              maxMana = e.stats?.maxMana || e.maxMana || mana;
              speed = e.stats?.speed || e.speed || Math.floor((10 + powerFactor * 7) * (1 + numericLevel * 0.05));
              accuracy = e.stats?.accuracy || e.accuracy || Math.floor((50 + powerFactor * 20) * (1 + numericLevel * 0.05));
          }
          
          // Beasts use talents, NPCs use combatSkills or skills
          let rawSkills = e.combatSkills || e.talents || e.skills;
          let skills: any[] = [];
          
          let enemyName = e.isNameRevealed !== undefined ? (e.isNameRevealed ? e.name : e.temporaryName) : (e.name || (e.species ? e.species : "Kẻ Địch"));
          if (isBeast && !e.name) {
             enemyName = getRandomBeastName(numericLevel as any);
          }

          if (rawSkills && rawSkills.length > 0) {
              skills = [...rawSkills];
          } else {
              let defaultSkillName = isBeast ? getRandomBeastSkillName(enemyName) : 'Thần Thông Cơ Bản';
              skills = [
                {
                  id: `npc_basic_${idx}`,
                  name: defaultSkillName,
                  type: 'ACTIVE',
                  baseDamage: Math.max(10, attack * 0.5),
                  scaling: 100,
                  element: e.element || beastDef?.element || e.domain?.element || 'VẬT LÝ',
                  cost: 0,
                  cooldown: 0,
                  targetType: 'SINGLE',
                  rarity: 'COMMON'
                }
              ];
              
              // Give some generic enemies a healing/defensive skill
              if (Math.random() < 0.3) {
                  const isHeal = Math.random() < 0.5;
                  if (isHeal) {
                      skills.push({
                          id: `npc_heal_${idx}`,
                          name: 'Linh Thú Hồi Xuân',
                          type: 'ACTIVE',
                          element: 'MOC',
                          targetType: 'SELF',
                          baseDamage: -Math.max(20, maxHp * 0.1),
                          scaling: 0,
                          cost: 10,
                          cooldown: 12,
                          effects: [createEffect('regen', 3)],
                          description: 'Tự phục hồi sinh lực.',
                          rarity: 'RARE'
                      });
                  } else {
                      skills.push({
                          id: `npc_def_${idx}`,
                          name: 'Ngọc Thạch Quyết',
                          type: 'ACTIVE',
                          element: 'THO',
                          targetType: 'SELF',
                          baseDamage: 0,
                          scaling: 0,
                          cost: 15,
                          cooldown: 10,
                          effects: [createEffect('def_up', 5)],
                          description: 'Tăng cường phòng ngự.',
                          rarity: 'RARE'
                      });
                  }
              }
          }

          return {
            id: e.id || `enemy_${idx}`,
            name: enemyName,
            hp,
            maxHp,
            mana,
            maxMana,
            attack,
            defense,
            speed,
            accuracy,
            element: (e.element || beastDef?.element || e.domain?.element || 'KIM') as ElementType,
            skills: skills,
            isPlayer: false,
            isAlive: true,
            realmLevel: numericLevel,
            cooldowns: {},
            activeEffects: [],
            isBeast: !!beastDef || !!e.isBeast || !!e.species || !!e.talents,
            beastData: beastDef ? {
              level: beastDef.level,
              instinct: beastDef.instinct,
              habitat: beastDef.habitat
            } : (e.beastData || (e.instinct ? { level: e.level, instinct: e.instinct, habitat: [] } : undefined)),
            position: { x: Math.random() * 20 + 80, y: Math.random() * 80 + 10 },
            actionTimer: 0,
            hitboxSize: 7,
            luck: e.luck || 0
          };
        });

        console.log("Starting combat with enemies:", enemyUnits);

        return {
          ...prev,
          isCombat: true,
          combatState: {
            participants: [playerUnit, ...enemyUnits],
            projectiles: [],
            logs: ['Bắt đầu chiến đấu!'],
            isFinished: false,
            lastUpdate: Date.now()
          }
        };
      });
    } catch (err) {
      console.error("Lỗi khi khởi tạo trận chiến:", err);
    }
  }, []);

  const endCombat = useCallback((winnerId?: string) => {
    setState(prev => {
      if (!prev.combatState) return prev;
      
      const player = prev.combatState.participants.find(p => p.isPlayer);
      if (!player) return prev;

      const playerWins = winnerId === player.id;
      let rewards: InventoryItem[] = [];
      
      if (playerWins) {
        const deadEnemies = prev.combatState.participants.filter(p => !p.isPlayer && !p.isAlive);
        rewards = generateCombatRewards(deadEnemies, prev.luck || 10, prev.difficulty);
      }

      // Ensure any NPCs that died in combat are marked as dead in the global state
      const deadEnemyIds = prev.combatState.participants
        .filter(p => !p.isPlayer && !p.isAlive)
        .map(p => p.id);

      const updatedNpcs = (prev.npcs || []).map(npc => {
        if (deadEnemyIds.includes(npc.id)) {
          return { ...npc, status: 'dead' as const };
        }
        return npc;
      });

      // Update inventory and trigger finished state in combatState
      const newInventory = [...prev.inventory];
      rewards.forEach(reward => {
        const existing = newInventory.find(i => i.id === reward.id);
        if (existing) {
          existing.amount += reward.amount;
        } else {
          newInventory.push(reward);
        }
      });

      return {
        ...prev,
        isCombat: playerWins ? true : false, // Keep UI open if wins to show rewards
        health: Math.max(1, player.hp),
        mana: player.mana,
        inventory: newInventory,
        combatState: {
          ...prev.combatState!,
          isFinished: true,
          winnerId,
          rewards: rewards.length > 0 ? rewards : undefined,
          rewardsClaimed: true
        },
        npcs: updatedNpcs
      };
    });
  }, []);

  const closeCombat = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCombat: false,
      combatState: undefined
    }));
  }, []);

  const updateCombatState = useCallback((updater: (prev: any) => any) => {
    setState(prev => {
      if (!prev.combatState) return prev;
      return {
        ...prev,
        combatState: updater(prev.combatState)
      };
    });
  }, []);

  const combatLoopUpdate = useCallback(() => {
    setState(prev => {
      if (!prev.isCombat || !prev.combatState || prev.combatState.isFinished) return prev;
      
      const now = Date.now();
      const dt = now - prev.combatState.lastUpdate;
      if (dt < 16) return prev; // limit to ~60fps
      
      const currentRegion = prev.mapData?.find(r => r.name === prev.currentLocation);
      
      let newParticipants = prev.combatState.participants.map(p => ({ ...p }));
      let newProjectiles = [...prev.combatState.projectiles];
      const newLogs = [...prev.combatState.logs];
      
      // Move projectiles
      newProjectiles = newProjectiles.filter(proj => {
        const target = newParticipants.find(p => p.id === proj.targetId);
        
        let dx = 1, dy = 1, dist = 999;
        if (target) {
           dx = target.position.x - proj.position.x;
           dy = target.position.y - proj.position.y;
           dist = Math.sqrt(dx * dx + dy * dy);
        }

        // Initialize velocity on first frame if not set
        if (!proj.velocity) {
             if (target && dist > 0) {
                 proj.velocity = { x: (dx / dist) * proj.speed, y: (dy / dist) * proj.speed };
             } else {
                 return false; // remove if target dead on frame 1 or zero distance
             }
        }
        
        // Use geometry for hits
        let isHit = false;
        if (target && dist < (target.hitboxSize || 7)) {
            isHit = true;
        }

        // Projectile goes out of bounds
        if (proj.position.x < -10 || proj.position.x > 110 || proj.position.y < -10 || proj.position.y > 110) {
            return false;
        }
        
        if (isHit && target) {
          // HIT!
          const armor = target.isPlayer ? prev.defense : target.defense;
          const statMods = applyEffectsToStats(target);
          
          const finalDamage = proj.damage * (100 / (100 + statMods.def));
          target.hp = Math.max(0, target.hp - finalDamage);
          let logMsg = `【${proj.sourceId === target.id ? 'Tự thân' : 'Kẻ địch'}】 trúng đòn gây ${Math.floor(finalDamage)} sát thương!`;
          if (proj.isCrit) logMsg = `[CHÍ MẠNG] ${logMsg}`;
          newLogs.push(logMsg);
          
          // Apply status effects from projectile
          if (proj.effects && proj.effects.length > 0) {
            proj.effects.forEach(effect => {
              target.activeEffects = addEffect(target.activeEffects || [], effect);
              newLogs.push(`【${target.name}】 bị ảnh hưởng bởi trạng thái ${effect.name}!`);
            });
          }

          // Elemental Reactions
          const reaction = getReaction(proj.element, target.element);
          if (reaction.effect && reaction.multiplier > 1) {
            newLogs.push(`[PHẢN ỨNG NGUYÊN TỐ]: ${reaction.effect}! Sát thương tăng x${reaction.multiplier}`);
            
            // Apply special status effects based on reaction
            if (reaction.effect === 'FREEZE') {
              target.activeEffects = addEffect(target.activeEffects || [], createEffect('freeze', 2));
              newLogs.push(`【${target.name}】 bị đóng băng!`);
            } else if (reaction.effect === 'AOE_BURN') {
              target.activeEffects = addEffect(target.activeEffects || [], createEffect('burn', 3));
              newLogs.push(`【${target.name}】 bị thiêu đốt!`);
            } else if (reaction.effect === 'CHAIN_STUN') {
              target.activeEffects = addEffect(target.activeEffects || [], createEffect('stun', 1.5));
              newLogs.push(`【${target.name}】 bị tê liệt!`);
            }
          }
          
          if (target.hp <= 0) {
             target.isAlive = false;
             newLogs.push(`【${target.name}】 đã bị đánh bại!`);
          }
          return false;
        } else {
          // move exactly by velocity
          const speedObj = dt / 1000 / 4;
          proj.position.x += (proj.velocity.x) * speedObj;
          proj.position.y += (proj.velocity.y) * speedObj;
          return true;
        }
      });
      
      // Handle cooldowns, status effects
      newParticipants.forEach(unit => {
        if (!unit.isAlive) return;

        // Process status effects (ticking once per second)
        const unitTime = unit.lastTickTime || now;
        const timeSinceLastTick = now - unitTime;
        
        if (timeSinceLastTick >= 1000) {
          unit.lastTickTime = now;
          if (unit.activeEffects && unit.activeEffects.length > 0) {
            const processedUnit = processTurnEffects(unit, newLogs);
            unit.hp = processedUnit.hp;
            unit.activeEffects = processedUnit.activeEffects;
            
            if (unit.hp <= 0) {
              unit.isAlive = false;
              newLogs.push(`【${unit.name}】 đã vẫn lạc do tác động của ngoại lực!`);
            }
          }
        } else if (!unit.lastTickTime) {
          unit.lastTickTime = now;
        }

        if (!unit.isAlive) return;

        // Skip action if hard-controlled
        const isStunned = isHardControlled(unit.activeEffects || []);
        if (isStunned) {
          unit.targetPosition = undefined; // Stop moving
          return;
        }

        // Combatant logic (Player and NPCs)
        if (unit.isAlive) {
           const targets = newParticipants.filter(p => !p.isPlayer !== !unit.isPlayer && p.isAlive);
           if (targets.length > 0) {
              // Target nearest enemy
              let minDistance = Infinity;
              let target: CombatUnit | undefined;
              targets.forEach(t => {
                const dx = t.position.x - unit.position.x;
                const dy = t.position.y - unit.position.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < minDistance) {
                  minDistance = dist;
                  target = t;
                }
              });

              if (target) {
                  // Auto Movement (Both Player and Enemies)
                  if (!unit.isEscaping) {
                     // Check for incoming projectiles to dodge
                     const incomingProj = newProjectiles.find(p => p.targetId === unit.id);
                     let isDodging = false;
                     
                     if (incomingProj && incomingProj.velocity) {
                         const dx = unit.position.x - incomingProj.position.x;
                         const dy = unit.position.y - incomingProj.position.y;
                         const distProj = Math.sqrt(dx*dx + dy*dy);
                         
                         // If within sensing distance
                         if (distProj < 35) {
                             const accuracyVal = unit.accuracy || 30;
                             
                             // Simple pseudo-random determined by id
                             const sign = (incomingProj.id.charCodeAt(incomingProj.id.length - 1) % 2 === 0) ? 1 : -1;
                             
                             // Speed of dodging depends on accuracy
                             // Normal move speed will cap how fast they physically move,
                             // but we can set a strong target offset based on accuracy.
                             // A higher accuracy means they react earlier and stronger.
                             if (accuracyVal > 10) {
                                 isDodging = true;
                                 
                                 const pdx = -incomingProj.velocity.y;
                                 const pdy = incomingProj.velocity.x;
                                 const pLen = Math.sqrt(pdx*pdx + pdy*pdy);
                                 
                                 if (pLen > 0) {
                                     const dodgeAmt = Math.min(20, accuracyVal / 3);
                                     unit.targetPosition = { 
                                         x: Math.max(5, Math.min(95, unit.position.x + (pdx / pLen) * dodgeAmt * sign)),
                                         y: Math.max(5, Math.min(95, unit.position.y + (pdy / pLen) * dodgeAmt * sign))
                                     };
                                 }
                             }
                         }
                     }

                     if (!isDodging) {
                         // Basic tactical AI: If too far, approach. If too close, retreat slightly.
                         const optimalRange = 25;
                         if (minDistance > optimalRange + 5) {
                            // Approach
                            unit.targetPosition = { x: target.position.x, y: target.position.y };
                         } else if (minDistance < optimalRange - 5) {
                            // Kite / Retreat
                            const angle = Math.atan2(unit.position.y - target.position.y, unit.position.x - target.position.x);
                            const retreatX = Math.max(5, Math.min(95, unit.position.x + Math.cos(angle) * 10));
                            const retreatY = Math.max(5, Math.min(95, unit.position.y + Math.sin(angle) * 10));
                            unit.targetPosition = { x: retreatX, y: retreatY };
                         } else {
                            // Hold position
                            unit.targetPosition = undefined;
                         }
                     }
                  }

                  // Auto Attack (Enemies only)
                  if (!unit.isPlayer && minDistance <= 35 && !unit.isEscaping) {
                      // Choose a random available skill based on cooldown and mana
                      const availableSkills = unit.skills.filter(s => (unit.cooldowns[s.id] || 0) <= now && unit.mana >= (s.cost || 0));
                      
                      if (availableSkills.length > 0) {
                          // Prefer skills with higher damage
                          availableSkills.sort((a, b) => (b.baseDamage || 0) - (a.baseDamage || 0));
                          const skill = availableSkills[Math.floor(Math.random() * Math.min(availableSkills.length, 2))]; 
                          
                          const cost = skill.cost || 0;
                          unit.mana -= cost;
                          const cooldownMs = calculateCooldownMs(skill.cooldown || 0, 1500);
                          unit.cooldowns[skill.id] = now + cooldownMs;
                          
                          const attackValue = unit.attack;
                          
                          if (skill.targetType === 'SELF') {
                              if (skill.effects) {
                                  unit.activeEffects = unit.activeEffects || [];
                                  skill.effects.forEach(eff => {
                                      unit.activeEffects?.push({ ...eff, id: `${eff.type}_${Date.now()}_${Math.random()}` });
                                  });
                              }
                              if (skill.baseDamage < 0) {
                                  const heal = -skill.baseDamage;
                                  unit.hp = Math.min(unit.maxHp, unit.hp + heal);
                              }
                              newLogs.push(`【${unit.name}】 thi triển [${skill.name}], ánh sáng chói lóa bao phủ toàn thân!`);
                          } else {
                              const variance = 0.9 + Math.random() * 0.2;
                              const damage = ((skill.baseDamage || 10) + attackValue * ((skill.scaling || 100) / 100)) * variance;
                              
                              newProjectiles.push({
                                     id: `proj_${now}_${Math.random()}`,
                                     sourceId: unit.id,
                                     targetId: target.id,
                                     position: { ...unit.position },
                                     speed: 15,
                                     damage,
                                     accuracy: unit.accuracy || 50,
                                     element: skill.element as unknown as ElementType,
                                     isCrit: Math.random() < (unit.critChance || 0) / 100,
                                     skillId: skill.id,
                                     effects: skill.effects
                                  });
                              
                              if (Math.random() < 0.3) {
                                 newLogs.push(`【${unit.name}】 thi triển [${skill.name}]!`);
                              }
                          }
                      }
                  }
              }
           }
         }

         // simple move logic
         if (unit.targetPosition) {
           const dx = unit.targetPosition.x - unit.position.x;
           const dy = unit.targetPosition.y - unit.position.y;
           const dist = Math.sqrt(dx * dx + dy * dy);
           if (dist > 1) {
              const statMods = applyEffectsToStats(unit);
              const currentSpeed = statMods.spd;
              const speedObj = (currentSpeed * (currentRegion?.terrain && ['Snow', 'Blizzard', 'Cold'].includes(currentRegion.terrain) ? 0.7 : 1.0) / 10 * dt) / 1000;
              unit.position.x += (dx / dist) * Math.min(speedObj, dist);
              unit.position.y += (dy / dist) * Math.min(speedObj, dist);
           }
         }
      });
      
      // Perform environmental updates
      if (currentRegion?.terrain === 'Lava') {
        newParticipants.forEach(unit => {
          if (unit.isAlive) {
            if (!unit.lastTickTime || now - unit.lastTickTime > 1000) {
              unit.hp = Math.max(0, unit.hp - 2);
              unit.lastTickTime = now;
              newLogs.push(`Địa hình dung nham khiến ${unit.name} chịu 2 sát thương!`);
            }
          }
        });
      }

      // Check if combat is finished
      const alivePlayers = newParticipants.filter(p => p.isPlayer && p.isAlive);
      const aliveEnemies = newParticipants.filter(p => !p.isPlayer && p.isAlive);
      
      let isFinished = false;
      let winnerId: string | undefined = undefined;
      
      const escapingPlayer = alivePlayers.find(p => p.isEscaping && (p.position.x <= 2 || p.position.x >= 98 || p.position.y <= 2 || p.position.y >= 98));

      if (escapingPlayer) {
        isFinished = true;
        winnerId = undefined;
        newLogs.push("Trận chiến kết thúc. Bạn đã chạy trốn thành công!");
      } else if (alivePlayers.length === 0) {
        isFinished = true;
        winnerId = aliveEnemies[0]?.id;
        newLogs.push("Trận chiến kết thúc. Bạn đã bại trận...");
      } else if (aliveEnemies.length === 0) {
        isFinished = true;
        winnerId = alivePlayers[0]?.id;
        newLogs.push("Trận chiến kết thúc. Bạn đã thắng lợi!");
      }

      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          participants: newParticipants,
          projectiles: newProjectiles,
          logs: newLogs,
          isFinished,
          winnerId,
          lastUpdate: now
        }
      };
    });
  }, []);

  const performRealtimeAttack = useCallback((attackerId: string, skillId: string) => {
    setState(prev => {
      if (!prev.isCombat || !prev.combatState) return prev;
      
      const newParticipants = prev.combatState.participants.map(p => ({ ...p }));
      const newProjectiles = [...prev.combatState.projectiles];
      const newLogs = [...prev.combatState.logs];
      const now = Date.now();
      
      const attacker = newParticipants.find(p => p.id === attackerId);
      
      if (!attacker || !attacker.isAlive) return prev;
      
      const skill = attacker.skills.find(s => s.id === skillId);
      if (!skill) return prev;
      
      // Handle SELF target type (healing/buffs)
      if (skill.targetType === 'SELF') {
         if (attacker.mana < (skill.cost || 0)) {
            newLogs.push(`${attacker.name} không đủ nội lực!`);
            return prev;
         }
         if ((attacker.cooldowns[skill.id] || 0) > now) {
            return prev;
         }
         
         attacker.mana -= (skill.cost || 0);
         const cooldownMs = calculateCooldownMs(skill.cooldown || 0);
         attacker.cooldowns[skill.id] = now + cooldownMs;
         
         if (skill.effects) {
             attacker.activeEffects = attacker.activeEffects || [];
             skill.effects.forEach(eff => {
                 attacker.activeEffects?.push({ ...eff, id: `${eff.type}_${Date.now()}_${Math.random()}` });
             });
         }
         
         if (skill.baseDamage < 0) {
              const heal = -skill.baseDamage;
              attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
         }
         
         newLogs.push(`【${attacker.name}】 thi triển [${skill.name}], nội thể bừng lên sinh cơ!`);

         return {
           ...prev,
           combatState: {
             ...prev.combatState,
             participants: newParticipants,
             logs: newLogs
           }
         };
      }
      
      // Auto-target: find nearest enemy in range
      let target: CombatUnit | undefined;
      const enemies = newParticipants.filter(p => p.isAlive && p.isPlayer !== attacker.isPlayer);
      
      if (enemies.length === 0) return prev;
      
      // Find nearest
      let minDistance = Infinity;
      enemies.forEach(e => {
        const dx = e.position.x - attacker.position.x;
        const dy = e.position.y - attacker.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          target = e;
        }
      });
      
      if (!target) return prev;
      
      // Check Distance
      if (minDistance > 35) {
         // Out of range, let auto-movement bring them closer
         return prev;
      }
      
      // Check MP & Cooldown
      if (attacker.mana < (skill.cost || 0)) {
         newLogs.push(`${attacker.name} không đủ nội lực!`);
         return prev;
      }
      
      if ((attacker.cooldowns[skill.id] || 0) > now) {
         // still on cooldown
         return prev;
      }
      
      // Fire!
      attacker.mana -= (skill.cost || 0);
      const cooldownMs = calculateCooldownMs(skill.cooldown || 0);
      attacker.cooldowns[skill.id] = now + cooldownMs;
      
      // Calculate Base Damage (defense will be applied when projectile hits)
      const skillElements = Array.isArray(skill.element) ? skill.element : [skill.element];
      const primaryElement = skillElements[0] as any;
      const targetElement = target.element as any;
      
      const counterMult = getCounterMultiplier(primaryElement, targetElement);
      const reaction = getReaction(primaryElement, targetElement);
      const finalElementMult = counterMult * (reaction.multiplier || 1);

      let attackValue = attacker.attack;
      
      // Damage = (Base + Attack * Scaling) * ElementMult * Variance
      const variance = 0.9 + Math.random() * 0.2; // 0.9x to 1.1x
      let damage = ((skill.baseDamage || 10) + attackValue * ((skill.scaling || 100) / 100)) * finalElementMult * variance;
      
      const isCrit = Math.random() * 100 < (attacker.isPlayer ? prev.critChance : (attacker.critChance || 5));
      if (isCrit) {
        damage *= (attacker.isPlayer ? prev.critDamage / 100 : (attacker.critDamage || 150) / 100);
      }
      
      newProjectiles.push({
         id: `proj_${now}_${Math.random()}`,
         sourceId: attacker.id,
         targetId: target.id,
         position: { ...attacker.position },
         speed: 15, // units per second
         damage,
         accuracy: attacker.accuracy || 60,
         element: primaryElement,
         isCrit,
         skillId: skill.id,
         effects: skill.effects // Pass the status effects to projectile
      });
      
      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          participants: newParticipants,
          projectiles: newProjectiles,
          logs: newLogs
        }
      };
    });
  }, []);

  const moveCombatant = useCallback((unitId: string, position: { x: number, y: number }) => {
     setState(prev => {
        if (!prev.isCombat || !prev.combatState) return prev;
        return {
           ...prev,
           combatState: {
              ...prev.combatState,
              participants: prev.combatState.participants.map(p => 
                 p.id === unitId ? { ...p, targetPosition: position } : p
              )
           }
        };
     });
  }, []);

  const attemptEscape = useCallback(() => {
    setState(prev => {
      if (!prev.isCombat || !prev.combatState) return prev;
      
      const newLogs = [...prev.combatState.logs];
      const participants = prev.combatState.participants;
      const playerIndex = participants.findIndex(p => p.isPlayer);
      if (playerIndex === -1) return prev;

      const player = participants[playerIndex];
      
      // If already escaping, cancel it
      if (player.isEscaping) {
         newLogs.push(`[Hủy Thoát Ly] Bạn quyết định quay lại chiến đấu!`);
         return {
           ...prev,
           combatState: {
             ...prev.combatState,
             logs: newLogs,
             participants: participants.map((p, i) => i === playerIndex ? { ...p, isEscaping: false, targetPosition: undefined } : p)
           }
         };
      }

      newLogs.push(`[Thoát Ly] Bạn đang cố gắng chạy trốn ra khỏi biên giới chiến trường! (Di chuyển ra rìa để thoát)`);
      
      // Calculate nearest edge
      let targetX = player.position.x;
      let targetY = player.position.y;
      
      if (player.position.x < 50) targetX = 0; else targetX = 100;
      if (player.position.y < 50) targetY = 0; else targetY = 100;
      
      // Choose the closest edge
      if (Math.abs(player.position.x - targetX) < Math.abs(player.position.y - targetY)) {
          targetY = player.position.y;
      } else {
          targetX = player.position.x;
      }

      return {
        ...prev,
        combatState: {
          ...prev.combatState,
          logs: newLogs,
          participants: participants.map((p, i) => i === playerIndex ? { ...p, isEscaping: true, targetPosition: { x: targetX, y: targetY } } : p)
        }
      };
    });
  }, []);

  const exportGame = useCallback(() => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `thien_dao_${state.name}_${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [state]);

  const importGame = useCallback((file: File) => {
    console.log("Importing game file:", file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        console.log("File content length:", typeof content === 'string' ? content.length : 'unknown');
        if (typeof content === 'string') {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === 'object') {
            // Validate required fields if necessary
            setState({ 
              ...parsed, 
              isInitialized: true,
              // Ensure critical fields exist
              history: parsed.history || [],
              inventory: parsed.inventory || [],
              npcs: parsed.npcs || [],
              factionsReputation: parsed.factionsReputation || {},
              resources: parsed.resources || {}
            });
            alert("Tải dữ liệu Thiên Cơ thành công!");
          } else {
            alert("Định dạng file Thiên Cơ không hợp lệ!");
          }
        }
      } catch (err) {
        alert("Thất bại khi triệu hồi ký ức từ file!");
        console.error(err);
      }
    };
    reader.readAsText(file);
  }, []);

  const exitToMenu = useCallback(() => {
    if (window.confirm("Bạn muốn thoát ra màn hình chính? (Tiến trình hiện tại vẫn sẽ được lưu trữ tự động)")) {
      setState(prev => ({ ...prev, isInitialized: false }));
    }
  }, []);

  const meditate = useCallback(() => {
    const activeTech = state.masteredTechniques.find(t => t.isActive) || state.masteredTechniques[0];
    const techName = activeTech ? activeTech.name : "vô danh công pháp";
    const focus = activeTech?.core?.focus || "cân bằng";

    // Level up active technique experience
    if (activeTech) {
      setState(prev => {
        const updatedTechs = prev.masteredTechniques.map(t => {
          if (t.id === activeTech.id) {
            const expGain = Math.floor(10 + Math.random() * 10);
            const nextExp = t.experience + expGain;
            const expToLevel = t.level * 100;
            
            if (nextExp >= expToLevel && t.level < t.maxLevel) {
              return { ...t, level: t.level + 1, experience: nextExp - expToLevel };
            }
            return { ...t, experience: nextExp };
          }
          return t;
        });
        
        // Add a small amount of tuVi during manual meditation
        const tuViGain = Math.floor(5 + Math.random() * 5);
        return { 
          ...prev, 
          masteredTechniques: updatedTechs,
          tuVi: Math.min(prev.tuViCapacity, prev.tuVi + tuViGain)
        };
      });
    }

    return `[Hành động: Tĩnh toạ tu luyện] Tôi đang vận hành ${techName}, tập trung vào ${focus} để hấp thu linh khí, rèn luyện tu vi.`;
  }, [state.masteredTechniques]);

  const toggleTechnique = useCallback((techId: string) => {
    setState(prev => {
      const activeTechs = prev.masteredTechniques.filter(t => t.isActive);
      const isActivating = !prev.masteredTechniques.find(t => t.id === techId)?.isActive;

      if (isActivating && activeTechs.length >= 3) {
        return prev; // Limit to 3 active techniques
      }

      const updatedTechs = prev.masteredTechniques.map(t => {
        if (t.id === techId) {
          return { ...t, isActive: !t.isActive };
        }
        return t;
      });
      return { ...prev, masteredTechniques: updatedTechs };
    });
  }, []);

  const attemptBreakthrough = useCallback(() => {
    let success = false;
    let message = "";
    
    setState(prev => {
      if (prev.tuVi < prev.tuViCapacity) return prev;
      
      const roll = Math.random() * 100;
      success = roll < prev.breakthroughChance;
      
      if (success) {
        const currentRealm = REALMS.find(r => r.level === prev.realmLevel);
        const stageIndex = currentRealm?.stages.indexOf(prev.stage) ?? -1;
        
        let nextRealm = prev.realm;
        let nextStage = prev.stage;
        let nextLevel = prev.realmLevel;
        let nextCapacity = prev.tuViCapacity * 2;
        
        if (stageIndex < (currentRealm?.stages.length ?? 0) - 1) {
          // Advance stage
          nextStage = currentRealm!.stages[stageIndex + 1];
          message = `[Đột Phá] Chúc mừng! Bạn đã đột phá lên ${nextRealm} - ${nextStage}!`;
        } else {
          // Advance realm
          const nextRealmData = REALMS.find(r => r.level === prev.realmLevel + 1);
          if (nextRealmData) {
            nextRealm = nextRealmData.name;
            nextStage = nextRealmData.stages[0];
            nextLevel = prev.realmLevel + 1;
            message = `[Đại Đột Phá] Thiên địa dị tượng! Bạn đã thành công tiến vào ${nextRealm}!`;
          } else {
             message = "[Viên Mãn] Bạn đã đạt đến đỉnh cao của thế giới này!";
          }
        }
        
        return {
          ...prev,
          realm: nextRealm,
          stage: nextStage,
          realmLevel: nextLevel,
          tuVi: 0,
          tuViCapacity: nextCapacity,
          breakthroughBonus: (prev.breakthroughBonus || 0) - 10, // Higher realms are fundamentally harder
          history: [...prev.history, { story: message, timestamp: Date.now() }]
        };
      } else {
        message = "[Thất Bại] Đột phá không thành công, tâm mạch bị tổn thương nhẹ. Tu vi bị tiêu tán một phần.";
        return {
          ...prev,
          tuVi: Math.floor(prev.tuVi * 0.7),
          health: Math.max(1, prev.health - 20),
          breakthroughBonus: (prev.breakthroughBonus || 0) + 5, // Learn from failure
          history: [...prev.history, { story: message, timestamp: Date.now() }]
        };
      }
    });

    return { success, message };
  }, []);

  return {
    state,
    initPlayer,
    updateStats,
    addHistory,
    equipItem,
    unequipItem,
    craftItem,
    resetGame,
    toggleNsfw,
    updateCustomApiKey,
    updateStoryLength,
    exportGame,
    importGame,
    exitToMenu,
    startCombat,
    endCombat,
    closeCombat,
    updateCombatState,
    combatLoopUpdate,
    performRealtimeAttack,
    moveCombatant,
    attemptEscape,
    meditate,
    toggleTechnique,
    attemptBreakthrough,
    consumeItem,
    startNewArc
  };
}
