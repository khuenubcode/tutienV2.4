import { ActiveEffect, CombatUnit } from '../types';

export const STATUS_EFFECTS: Record<string, Omit<ActiveEffect, 'duration'>> = {
  burn: {
    id: 'burn',
    type: 'debuff',
    name: 'Thiêu Đốt',
    isDot: true,
    dotType: 'current',
    value: 0.07,
    stacks: 1,
    maxStacks: 5,
    description: 'Bị thiêu đốt, mất 7% HP hiện tại mỗi stack mỗi hiệp.'
  },
  poison: {
    id: 'poison',
    type: 'debuff',
    name: 'Trúng Độc',
    isDot: true,
    dotType: 'max',
    value: 0.02,
    stacks: 1,
    maxStacks: 6,
    description: 'Trúng kịch độc, mất 2% HP tối đa mỗi stack mỗi hiệp.'
  },
  atk_up: {
    id: 'atk_up',
    type: 'buff',
    name: 'Cường Kích',
    stat: 'atk',
    multiplier: 1.5,
    description: 'Tăng 50% công kích.'
  },
  def_up: {
    id: 'def_up',
    type: 'buff',
    name: 'Kim Cang',
    stat: 'def',
    multiplier: 2.0,
    description: 'Tăng 100% phòng ngự.'
  },
  spd_down: {
    id: 'spd_down',
    type: 'debuff',
    name: 'Trì Trệ',
    stat: 'spd',
    multiplier: 0.5,
    description: 'Giảm 50% tốc độ.'
  },
  weaken: {
    id: 'weaken',
    type: 'debuff',
    name: 'Suy Yếu',
    stat: 'atk',
    multiplier: 0.5,
    description: 'Giảm 50% công kích.'
  },
  freeze: {
    id: 'freeze',
    type: 'debuff',
    name: 'Đóng Băng',
    stat: 'spd',
    multiplier: 0,
    description: 'Đóng băng, mất khả năng hành động.'
  },
  stun: {
    id: 'stun',
    type: 'debuff',
    name: 'Choáng',
    stat: 'spd',
    multiplier: 0,
    description: 'Choáng váng, mất khả năng hành động.'
  },
  regen: {
    id: 'regen',
    type: 'buff',
    name: 'Hồi Phục',
    isDot: true,
    dotType: 'max',
    value: -0.05, // negative value for heal
    stacks: 1,
    maxStacks: 3,
    description: 'Hồi 5% HP tối đa mỗi hiệp.'
  }
};

export const createEffect = (id: string, duration: number = 3): ActiveEffect => {
  const tpl = STATUS_EFFECTS[id];
  if (!tpl) {
      console.warn(`Effect ${id} not found.`);
      return { id, type: 'buff', name: id, duration, description: '' };
  }
  return { ...tpl, duration, stacks: tpl.stacks || 1 };
};

export const addEffect = (currentEffects: ActiveEffect[] = [], newEffect: ActiveEffect): ActiveEffect[] => {
  const existing = currentEffects.find(e => e.id === newEffect.id);
  if (existing) {
    return currentEffects.map(e => {
      if (e.id === newEffect.id) {
        const max = e.maxStacks || 1;
        const newStacks = Math.min(max, (e.stacks || 1) + 1);
        return { ...e, duration: Math.max(e.duration, newEffect.duration), stacks: newStacks };
      }
      return e;
    });
  }
  return [...currentEffects, newEffect];
};

export const applyEffectsToStats = (combatant: CombatUnit): { atk: number; def: number; spd: number } => {
  let atk = combatant.attack || 0;
  let def = combatant.defense || 0;
  let spd = combatant.speed || 0;
  if (!combatant.activeEffects) return { atk, def, spd };

  combatant.activeEffects.forEach(eff => {
    if (eff.stat && eff.multiplier !== undefined) {
      if (eff.stat === 'atk') atk = Math.floor(atk * eff.multiplier);
      if (eff.stat === 'def') def = Math.floor(def * eff.multiplier);
      if (eff.stat === 'spd') spd = Math.floor(spd * eff.multiplier);
    }
  });

  return { atk, def, spd };
};

export const processTurnEffects = (combatant: CombatUnit, logs: string[]): CombatUnit => {
  if (!combatant.activeEffects || combatant.activeEffects.length === 0) return combatant;
  
  let newHp = combatant.hp;
  const remainingEffects: ActiveEffect[] = [];

  combatant.activeEffects.forEach(eff => {
    if (eff.isDot && eff.value) {
      const stacks = eff.stacks || 1;
      let dmg = 0;
      if (eff.dotType === 'current') {
        dmg = Math.floor(newHp * eff.value * stacks);
      } else {
        dmg = Math.floor(combatant.maxHp * eff.value * stacks);
      }
      
      newHp -= dmg;
      if (dmg > 0) {
          logs.push(`【${combatant.name}】 chịu ${dmg} sát thương do [${eff.name} x${stacks}]!`);
      } else if (dmg < 0) {
          logs.push(`【${combatant.name}】 hồi phục ${-dmg} HP nhờ [${eff.name} x${stacks}]!`);
      }
    }

    if (eff.duration > 1) {
      remainingEffects.push({ ...eff, duration: eff.duration - 1 });
    } else {
      logs.push(`Hiệu ứng [${eff.name}] trên 【${combatant.name}】 đã kết thúc.`);
    }
  });

  return { ...combatant, hp: Math.min(combatant.maxHp, Math.max(0, newHp)), activeEffects: remainingEffects };
};

export const isHardControlled = (effects: ActiveEffect[]): boolean => {
    return effects.some(e => e.id === 'freeze' || e.id === 'stun');
};
