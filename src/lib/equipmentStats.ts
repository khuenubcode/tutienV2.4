import { Equipment, Rarity } from '../types';
import { ElementType } from '../data/element_system';

export interface EquipmentPowerMetrics {
  totalCombatValue: number;
  rarityColor: string;
  rarityBg: string;
  rarityBorder: string;
  rarityGlow: string;
  tierRank: number;
}

const RARITY_STRENGTH: Record<string, number> = {
  'Phàm': 1,
  'Linh': 2,
  'Huyền': 3,
  'Địa': 4,
  'Thiên': 5,
  'Đạo': 6,
  'Thần': 7
};

const RARITY_COLORS: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  'Phàm': { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', glow: 'bg-slate-500' },
  'Linh': { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', glow: 'bg-emerald-500' },
  'Huyền': { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', glow: 'bg-blue-500' },
  'Địa': { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', glow: 'bg-purple-500' },
  'Thiên': { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', glow: 'bg-amber-500' },
  'Đạo': { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', glow: 'bg-rose-500' },
  'Thần': { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', glow: 'bg-cyan-500' }
};

const ELEMENT_ORIGINS: Partial<Record<ElementType, string[]>> = {
  AM: ['Rèn từ Huyết Sát Ma Khí', 'Tế luyện trong Hố Đen Tử Vong', 'Thấm đẫm oán niệm cổ xưa'],
  PHONG: ['Tích tụ Linh khí Cửu Thiên', 'Tỏa ra từ Cơn Lốc Hư Không', 'Kết tinh từ Ngọn Gió Tự Do'],
  HOA: ['Rèn từ Nham Thạch Núi Lửa', 'Được Tôi luyện trong Lửa Luyện Ngục', 'Chiết xuất từ Lửa Mặt Trời'],
  THUY: ['Đóng băng từ Nước Băng Cực Bắc', 'Tinh lọc từ Cội Nguồn Hư Vô', 'Lấy từ Giọt Nước Thời Gian'],
  KIM: ['Đúc từ Mảnh Vỡ Tinh Tú', 'Luyện từ Quặng Sắt Cổ Đại', 'Rèn từ Lưỡi Kiếm Tiên Nhân']
};

/**
 * Generates an origin description based on equipment properties.
 */
export function generateEquipmentOrigin(item: Equipment, element?: ElementType): string {
  const originsForElement = (element && ELEMENT_ORIGINS[element]) || ['Được đúc bằng kỹ thuật cổ xưa', 'Tìm thấy trong phế tích ngàn năm', 'Tự nhiên hình thành qua vô tận năm tháng'];
  const baseOrigin = originsForElement[Math.floor(Math.random() * originsForElement.length)];
  
  const raritySuffix = item.rarity !== 'Phàm' ? ` - Đẳng cấp ${item.rarity}` : '';
  return `${baseOrigin}${raritySuffix}`;
}

/**
 * Calculates a unified power metric for an equipment item.
 */
export function getEquipmentMetrics(item: Equipment): EquipmentPowerMetrics {
  const stats = item.stats || {};
  const baseValue = 
    (stats.attack || 0) * 1.5 + 
    (stats.defense || 0) * 1.2 + 
    (stats.health || 0) * 0.1 + 
    (stats.mana || 0) * 0.2;
  
  const rarityRank = RARITY_STRENGTH[item.rarity] || 1;
  const totalCombatValue = Math.floor(baseValue * (1 + (rarityRank * 0.2)));
  const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS['Phàm'];

  return {
    totalCombatValue,
    rarityColor: colors.text,
    rarityBg: colors.bg,
    rarityBorder: colors.border,
    rarityGlow: colors.glow,
    tierRank: rarityRank
  };
}

/**
 * Checks if an item is objectively better than another for a specific slot.
 */
export function isUpgrade(newItem: Equipment, currentItem?: Equipment): boolean {
  if (!currentItem) return true;
  return getEquipmentMetrics(newItem).totalCombatValue > getEquipmentMetrics(currentItem).totalCombatValue;
}

export interface EnrichedEquipment extends Equipment {
  metrics: EquipmentPowerMetrics;
}

/**
 * Enriches equipment data for UI display.
 */
export function getEnrichedEquipment(items: Equipment[]): EnrichedEquipment[] {
  return (items || []).map(item => ({
    ...item,
    metrics: getEquipmentMetrics(item)
  }));
}
