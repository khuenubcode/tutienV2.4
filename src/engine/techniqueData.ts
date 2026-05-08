import { Technique, Skill } from "../types";
import { SPIRIT_ROOT_ELEMENTS } from "./playerData";
import { calculateSkillValue, calculateCooldown, calculateManaCost, getEffectChance } from "./techniqueStats";

export const TECH_NUMBERS = ["Nhất", "Nhị", "Tam", "Tứ", "Ngũ", "Lục", "Thất", "Bát", "Cửu", "Thập", "Bách", "Thiên", "Vạn"];
export const TECH_CONCEPTS = ["Chuyển", "Thiên", "Cổ", "Trường Sinh", "Bất Diệt", "Hư Vô", "Thái Sơ", "Hỗn Độn", "Linh", "Thần", "Thánh", "Ma", "Thái Cổ", "Vô Thượng", "Nghịch Thiên", "Cực", "U", "Minh", "Huyền"];
export const TECH_CORES = ["Linh", "Khí", "Hồn", "Thể", "Đan", "Kiếm", "Đao", "Ấn", "Quyền", "Mạch", "Cốt", "Huyết", "Đạo", "Nguyên", "Thần"];
export const TECH_SUFFIXES = ["Công", "Quyết", "Kinh", "Điển", "Pháp", "Lục", "Chân Kinh", "Tiên Điển", "Thần Quyết", "Đạo Điển"];

export const TECHNIQUE_QUALITIES = [
  { name: "Phàm", multiplier: 1.05, chance: 0.6, description: "Công pháp phổ thông nhất." },
  { name: "Linh", multiplier: 1.15, chance: 0.2, description: "Công pháp có linh tính, dễ tu luyện." },
  { name: "Địa", multiplier: 1.35, chance: 0.1, description: "Công pháp của các đại môn phái." },
  { name: "Thiên", multiplier: 1.7, chance: 0.05, description: "Công pháp nghịch thiên, uy lực kinh người." },
  { name: "Vương cấp", multiplier: 2.2, chance: 0.03, description: "Công pháp của vương giả viễn cổ." },
  { name: "Hoàng cấp", multiplier: 3.2, chance: 0.015, description: "Công pháp chí cao vô thượng." },
  { name: "Thần cấp", multiplier: 4.5, chance: 0.004, description: "Công pháp tương truyền do thần để lại." },
  { name: "Tiên cấp", multiplier: 6.0, chance: 0.001, description: "Công pháp của chân tiên giới." },
];

export const getRandomTechnique = (baseName: "Công Pháp" = "Công Pháp"): Technique => {
  const randQuality = Math.random();
  let quality = TECHNIQUE_QUALITIES[0];
  let cumulativeChance = 0;
  for (const q of TECHNIQUE_QUALITIES) {
    cumulativeChance += q.chance;
    if (randQuality <= cumulativeChance) {
      quality = q;
      break;
    }
  }

  const element = SPIRIT_ROOT_ELEMENTS[Math.floor(Math.random() * SPIRIT_ROOT_ELEMENTS.length)];
  
  const hasNumber = Math.random() < 0.6;
  const num = hasNumber ? TECH_NUMBERS[Math.floor(Math.random() * TECH_NUMBERS.length)] : "";
  const concept = TECH_CONCEPTS[Math.floor(Math.random() * TECH_CONCEPTS.length)];
  const core = TECH_CORES[Math.floor(Math.random() * TECH_CORES.length)];
  const suffix = TECH_SUFFIXES[Math.floor(Math.random() * TECH_SUFFIXES.length)];
  
  const techName = `${num}${concept}${core}${suffix}`.trim();

  // Skill generation logic
  const isDamage = Math.random() < 0.5;
  let skillType: 'damage' | 'heal' | 'shield' | 'debuff' | 'buff' | 'drain';
  if (isDamage) {
    skillType = 'damage';
  } else {
    const otherTypes: ('heal' | 'shield' | 'debuff' | 'buff' | 'drain')[] = ['heal', 'shield', 'debuff', 'buff', 'drain'];
    skillType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
  }
  
  const skillSuffixes = {
    damage: ["Phá", "Trảm", "Kích", "Ấn", "Chưởng"],
    heal: ["Hồi Xuân", "Thanh Tâm", "Linh Vũ", "Hộ Thể"],
    shield: ["Lá Chắn", "Kim Thân", "Quy Giáp", "Bích Chướng"],
    debuff: ["Nhược Hóa", "Áp Chế", "Hư Nhược", "Trói Buộc"],
    buff: ["Cường Hóa", "Gia Tăng", "Bạo Phát", "Thăng Hoa"],
    drain: ["Hấp Huyết", "Thôn Phệ", "Đoạt Linh", "Hút Máu"]
  };
  
  const skillSuffix = skillSuffixes[skillType][Math.floor(Math.random() * skillSuffixes[skillType].length)];
  const skillName = `${core} ${skillSuffix}`;

  // Effect generation logic
  let effect: { id: string; chance: number } | undefined = undefined;
  if (skillType === 'damage') {
    const debuffs = ['burn', 'poison', 'freeze', 'stun', 'weaken', 'spd_down'];
    if (quality.multiplier > 1.2 && Math.random() < getEffectChance(quality.multiplier, true)) {
      effect = {
        id: debuffs[Math.floor(Math.random() * debuffs.length)],
        chance: getEffectChance(quality.multiplier, true)
      };
    }
  } else {
    // Buffs for heal/shield?
    const buffs = ['atk_up', 'def_up'];
    if (quality.multiplier > 1.5 && Math.random() < getEffectChance(quality.multiplier, false)) {
      effect = {
        id: buffs[Math.floor(Math.random() * buffs.length)],
        chance: getEffectChance(quality.multiplier, false)
      };
    }
  }
  
  return {
    name: `${techName} (${quality.name} Cấp)`,
    quality: quality.name,
    element: element.name,
    multiplier: quality.multiplier,
    description: quality.description,
    color: element.color,
    skill: {
      name: skillName,
      type: skillType,
      value: calculateSkillValue(skillType, quality.multiplier),
      cooldown: calculateCooldown(quality.multiplier),
      currentCooldown: 0,
      manaCost: calculateManaCost(quality.multiplier),
      effect
    }
  };
};
