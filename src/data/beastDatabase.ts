import { BeastLevel, BeastInstinct } from '../prompts/MindsetBeast';
import { DietType } from '../prompts/ecosystem_simulation';

export interface LootDrop {
  itemId: string;
  chance: number; // 0-1
  minAmount: number;
  maxAmount: number;
}

export interface BeastDefinition {
  id: string;
  name: string;
  level: BeastLevel;
  diet: DietType;
  basePower: number; // 0-1
  reproduction: number; // 0-1
  rarity: 'common' | 'rare' | 'elite' | 'boss';
  habitat: string[];
  instinct: BeastInstinct;
  description: string;
  lootTable: LootDrop[];
  element?: string;
  innateSkills?: any[];
}

export const BEAST_DATABASE: Record<string, BeastDefinition> = {
  "Thanh Phong Lang": {
    id: "thanh_phong_lang",
    name: "Thanh Phong Lang",
    level: "LOW",
    diet: "carnivore",
    basePower: 0.4,
    reproduction: 0.2,
    rarity: "common",
    habitat: ["Phàm Giới", "Nam Hoang Vực"],
    instinct: { hunger: 0.6, aggression: 0.7, caution: 0.4, territorial: 0.3, pack: 0.8, bloodline: 0.2 },
    description: "Sói gió có tốc độ cực nhanh, thường đi theo bầy đàn.",
    lootTable: [
      { itemId: "lang_nha", chance: 0.7, minAmount: 1, maxAmount: 2 },
      { itemId: "lang_bi", chance: 0.5, minAmount: 1, maxAmount: 1 },
      { itemId: "phong_linh_thach_vun", chance: 0.1, minAmount: 1, maxAmount: 1 }
    ],
    element: "PHONG",
    innateSkills: [
      { id: "phong_刃", name: "Phong Nhận", type: "ACTIVE", baseDamage: 25, scaling: 120, element: "PHONG", cost: 0, cooldown: 0 },
      { id: "can_xe", name: "Cắn Xé Hội Đồng", type: "ACTIVE", baseDamage: 15, scaling: 100, element: "PHONG", cost: 0, cooldown: 0 }
    ]
  },
  "Xích Diễm Hổ": {
    id: "xich_diem_ho",
    name: "Xích Diễm Hổ",
    level: "MID",
    diet: "carnivore",
    basePower: 0.7,
    reproduction: 0.1,
    rarity: "rare",
    habitat: ["Nam Hoang Vực", "Vạn Thú Sơn Mạch"],
    instinct: { hunger: 0.5, aggression: 0.9, caution: 0.3, territorial: 0.9, pack: 0.1, bloodline: 0.5 },
    description: "Hổ lửa mang trong mình hỏa độc, sức mạnh bộc phát cực lớn.",
    lootTable: [
      { itemId: "ho_cot", chance: 0.8, minAmount: 1, maxAmount: 3 },
      { itemId: "hoa_tinh", chance: 0.4, minAmount: 1, maxAmount: 2 },
      { itemId: "xich_diem_dan", chance: 0.05, minAmount: 1, maxAmount: 1 }
    ],
    element: "HOA",
    innateSkills: [
      { id: "diem_trach", name: "Diễm Trảo", type: "ACTIVE", baseDamage: 40, scaling: 150, element: "HOA", cost: 0, cooldown: 0 },
      { id: "gam_thet", name: "Hổ Khiếu", type: "ACTIVE", baseDamage: 20, scaling: 90, element: "HOA", cost: 0, cooldown: 0 }
    ]
  },
  "Lôi Thỏ": {
    id: "loi_tho",
    name: "Lôi Thỏ",
    level: "LOW",
    diet: "herbivore",
    basePower: 0.1,
    reproduction: 0.6,
    rarity: "common",
    habitat: ["Phàm Giới", "Trung Linh Vực"],
    instinct: { hunger: 0.4, aggression: 0.1, caution: 0.9, territorial: 0.1, pack: 0.4, bloodline: 0.1 },
    description: "Thỏ sấm, nhút nhát nhưng có thể phóng điện tê liệt kẻ thù để bỏ chạy.",
    lootTable: [
      { itemId: "loi_mao", chance: 0.9, minAmount: 1, maxAmount: 4 },
      { itemId: "tho_thit", chance: 0.6, minAmount: 1, maxAmount: 2 }
    ],
    element: "LOI",
    innateSkills: [
      { id: "loi_don", name: "Lôi Độn Tẩu Xa", type: "ACTIVE", baseDamage: 10, scaling: 80, element: "LOI", cost: 0, cooldown: 0 },
      { id: "giat_dien", name: "Phóng Điện", type: "ACTIVE", baseDamage: 15, scaling: 100, element: "LOI", cost: 0, cooldown: 0 }
    ]
  },
  "Hàn Băng Long Xà": {
    id: "han_bang_long_xa",
    name: "Hàn Băng Long Xà",
    level: "HIGH",
    diet: "carnivore",
    basePower: 0.85,
    reproduction: 0.05,
    rarity: "boss",
    habitat: ["Bắc Hàn Vực", "Cửu Âm Tuyệt Địa"],
    instinct: { hunger: 0.3, aggression: 0.6, caution: 0.8, territorial: 1.0, pack: 0.0, bloodline: 0.7 },
    description: "Mãng xà mang huyết mạch rồng, thống trị các vùng băng giá.",
    lootTable: [
      { itemId: "long_xa_lan", chance: 1.0, minAmount: 2, maxAmount: 5 },
      { itemId: "bang_tinh_yeu_dan", chance: 1.0, minAmount: 1, maxAmount: 1 },
      { itemId: "han_bang_than_thiet", chance: 0.2, minAmount: 1, maxAmount: 1 }
    ],
    element: "BANG",
    innateSkills: [
      { id: "bang_hoi_tho", name: "Hàn Băng Hơi Thở", type: "ACTIVE", baseDamage: 80, scaling: 200, element: "BANG", cost: 0, cooldown: 0 },
      { id: "quyen_liet", name: "Xà Cuộn", type: "ACTIVE", baseDamage: 60, scaling: 150, element: "BANG", cost: 0, cooldown: 0 }
    ]
  },
  "Thi Hổ": {
    id: "thi_ho",
    name: "Thi Hổ",
    level: "MID",
    diet: "carnivore",
    basePower: 0.8,
    reproduction: 0.05,
    rarity: "elite",
    habitat: ["Huyết Sát Vực", "Cửu Âm Tuyệt Địa"],
    instinct: { hunger: 0.9, aggression: 1.0, caution: 0.1, territorial: 0.5, pack: 0.0, bloodline: 0.0 },
    description: "Hổ chết sống lại nhờ oán khí, không biết sợ hãi, chỉ biết khát máu.",
    lootTable: [
      { itemId: "thi_dan", chance: 0.7, minAmount: 1, maxAmount: 2 },
      { itemId: "o_nhiem_ho_cot", chance: 0.6, minAmount: 1, maxAmount: 3 }
    ],
    element: "AM",
    innateSkills: [
      { id: "thi_doc_trao", name: "Thi Độc Trảo", type: "ACTIVE", baseDamage: 50, scaling: 130, element: "AM", cost: 0, cooldown: 0 },
      { id: "huyet_hap", name: "Hấp Huyết Cắn", type: "ACTIVE", baseDamage: 30, scaling: 100, element: "AM", cost: 0, cooldown: 0 }
    ]
  },
  "Băng Linh Điểu": {
    id: "bang_linh_dieu",
    name: "Băng Linh Điểu",
    level: "MID",
    diet: "omnivore",
    basePower: 0.6,
    reproduction: 0.3,
    rarity: "rare",
    habitat: ["Bắc Hàn Vực", "Cửu Âm Tuyệt Địa"],
    instinct: { hunger: 0.4, aggression: 0.3, caution: 0.8, territorial: 0.4, pack: 0.2, bloodline: 0.3 },
    description: "Chim băng, cánh mang hàn khí, thường bay lượn ở địa cực.",
    lootTable: [
      { itemId: "bang_linh_vu", chance: 0.8, minAmount: 1, maxAmount: 3 },
      { itemId: "bang_tinh", chance: 0.3, minAmount: 1, maxAmount: 1 }
    ],
    element: "BANG",
    innateSkills: [
      { id: "bang_vu", name: "Băng Vũ", type: "ACTIVE", baseDamage: 35, scaling: 110, element: "BANG", cost: 0, cooldown: 0 }
    ]
  },
  "Địa Long Thú": {
    id: "dia_long_thu",
    name: "Địa Long Thú",
    level: "HIGH",
    diet: "herbivore",
    basePower: 0.9,
    reproduction: 0.1,
    rarity: "elite",
    habitat: ["Nam Hoang Vực", "Vạn Thú Sơn Mạch"],
    instinct: { hunger: 0.6, aggression: 0.4, caution: 0.5, territorial: 0.7, pack: 0.0, bloodline: 0.5 },
    description: "Thú đất khổng lồ, da dày như đá, chuyên đào hang sâu.",
    lootTable: [
      { itemId: "dia_long_linh_giap", chance: 0.6, minAmount: 1, maxAmount: 1 },
      { itemId: "tho_tinh", chance: 0.5, minAmount: 1, maxAmount: 2 }
    ],
    element: "THO",
    innateSkills: [
      { id: "dia_chan", name: "Địa Chấn", type: "ACTIVE", baseDamage: 60, scaling: 160, element: "THO", cost: 0, cooldown: 0 }
    ]
  },
  "Huyết Sát Ma Chu": {
    id: "huyet_sat_ma_chu",
    name: "Huyết Sát Ma Chu",
    level: "MID",
    diet: "carnivore",
    basePower: 0.7,
    reproduction: 0.4,
    rarity: "elite",
    habitat: ["Huyết Sát Vực", "Vạn Thú Sơn Mạch"],
    instinct: { hunger: 0.8, aggression: 0.7, caution: 0.4, territorial: 0.6, pack: 0.5, bloodline: 0.2 },
    description: "Nhện đỏ ăn thịt, chuyên giăng lưới bắt mồi trong huyết sương.",
    lootTable: [
      { itemId: "ma_chu_ty", chance: 0.7, minAmount: 2, maxAmount: 5 },
      { itemId: "huyet_doc_tinh", chance: 0.4, minAmount: 1, maxAmount: 1 }
    ],
    element: "AM",
    innateSkills: [
      { id: "huyet_si", name: "Huyết Ti", type: "ACTIVE", baseDamage: 40, scaling: 120, element: "AM", cost: 0, cooldown: 0 }
    ]
  }
};
