/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Rarity } from '../types';
import { ElementType } from './element_system';

export type ItemType = 'MATERIAL' | 'CONSUMABLE' | 'EQUIPMENT' | 'TREASURE' | 'ALCHEMY_INGREDIENT';

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: Rarity;
  value: number;
  element?: ElementType;
  effects?: {
    hpRestore?: number;
    manaRestore?: number;
    statBonus?: {
      attack?: number;
      defense?: number;
      speed?: number;
    };
  };
}

export const ITEM_DATABASE: Record<string, ItemDefinition> = {
  // --- Materials ---
  'lang_nha': {
    id: 'lang_nha',
    name: 'Nanh Sói',
    description: 'Nanh của sói già, sắc bén và cứng cáp. Có thể dùng làm vũ khí cơ bản.',
    type: 'MATERIAL',
    rarity: 'Phàm',
    value: 10
  },
  'lang_bi': {
    id: 'lang_bi',
    name: 'Da Sói',
    description: 'Da sói mịn màng nhưng dai, tốt cho việc chế tạo giáp nhẹ.',
    type: 'MATERIAL',
    rarity: 'Phàm',
    value: 15
  },
  'phong_linh_thach_vun': {
    id: 'phong_linh_thach_vun',
    name: 'Phong Linh Thạch Vụn',
    description: 'Mảnh vỡ đá chứa linh khí hệ Phong.',
    type: 'MATERIAL',
    rarity: 'Linh',
    value: 50,
    element: 'PHONG'
  },
  'ho_cot': {
    id: 'ho_cot',
    name: 'Xương Hổ',
    description: 'Xương của mãnh hổ, chứa hỏa tính.',
    type: 'MATERIAL',
    rarity: 'Linh',
    value: 100,
    element: 'HOA'
  },
  'xich_diem_dan': {
    id: 'xich_diem_dan',
    name: 'Xích Diễm Đan',
    description: 'Yêu đan tích tụ hỏa lực của Xích Diễm Hổ.',
    type: 'TREASURE',
    rarity: 'Huyền',
    value: 500,
    element: 'HOA'
  },
  'hoa_tinh': {
    id: 'hoa_tinh',
    name: 'Hỏa Tinh',
    description: 'Tinh hoa lửa thuần khiết.',
    type: 'ALCHEMY_INGREDIENT',
    rarity: 'Linh',
    value: 120,
    element: 'HOA'
  },
  'loi_mao': {
    id: 'loi_mao',
    name: 'Lông Thỏ Lôi',
    description: 'Lông thỏ mang điện tích nhẹ.',
    type: 'MATERIAL',
    rarity: 'Phàm',
    value: 5,
    element: 'LOI'
  },
  'tho_thit': {
    id: 'tho_thit',
    name: 'Thịt Thỏ',
    description: 'Thịt rừng tươi ngon, có thể hồi phục chút thể lực.',
    type: 'CONSUMABLE',
    rarity: 'Phàm',
    value: 2,
    effects: { hpRestore: 10 }
  },
  'long_xa_lan': {
    id: 'long_xa_lan',
    name: 'Vảy Long Xà',
    description: 'Vảy cứng như sắt, mang theo khí tức rồng.',
    type: 'MATERIAL',
    rarity: 'Địa',
    value: 2000,
    element: 'BANG'
  },
  'bang_tinh_yeu_dan': {
    id: 'bang_tinh_yeu_dan',
    name: 'Băng Tinh Yêu Đan',
    description: 'Nội đan chứa đựng hàn khí cực hạn.',
    type: 'TREASURE',
    rarity: 'Thiên',
    value: 10000,
    element: 'BANG'
  },
  'han_bang_than_thiet': {
    id: 'han_bang_than_thiet',
    name: 'Hàn Băng Thần Thiết',
    description: 'Kim loại thần bí chỉ tìm thấy ở vùng cực hàn.',
    type: 'MATERIAL',
    rarity: 'Đạo',
    value: 50000,
    element: 'BANG'
  },
  'thi_dan': {
    id: 'thi_dan',
    name: 'Thi Đan',
    description: 'Viên đan chứa đầy oán khí và tử khí.',
    type: 'MATERIAL',
    rarity: 'Huyền',
    value: 400,
    element: 'AM'
  },
  'o_nhiem_ho_cot': {
    id: 'o_nhiem_ho_cot',
    name: 'Ô Nhiễm Hổ Cốt',
    description: 'Xương hổ bị ám bởi ma khí.',
    type: 'MATERIAL',
    rarity: 'Linh',
    value: 80,
    element: 'AM'
  },

  // --- General Consumables ---
  'heal_pill': {
    id: 'heal_pill',
    name: 'Bổ Huyết Đan',
    description: 'Đan dược cơ bản giúp hồi phục vết thương.',
    type: 'CONSUMABLE',
    rarity: 'Phàm',
    value: 50,
    effects: { hpRestore: 50 }
  },
  'mana_pill': {
    id: 'mana_pill',
    name: 'Hồi Khí Đan',
    description: 'Giúp hồi phục linh lực trong cơ thể.',
    type: 'CONSUMABLE',
    rarity: 'Phàm',
    value: 50,
    effects: { manaRestore: 50 }
  }
};
