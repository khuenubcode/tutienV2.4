// src/data/world_map_system.ts
import { WORLD_MAPS, getRandomLocationName } from './mapData';

export type LocationType = 'TÔNG_MÔN' | 'THÀNH_PHỐ' | 'CẤM_ĐỊA' | 'THẢO_NGUYÊN' | 'VÙNG_BIỂN';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  continentId: string;
}

export interface Continent {
  id: string;
  name: string;
  description: string;
}

export interface Path {
  id: string;
  fromLocationId: string;
  toLocationId: string;
  name: string;
  travelTimeDays: number; // Thời gian di chuyển ước tính
}

export const WORLD_MAP = {
  continents: [
    ...WORLD_MAPS.map(m => ({ id: m.id, name: m.name, description: m.description })),
  ] as Continent[],

  locations: [
    ...WORLD_MAPS.map(m => ({ id: m.id, name: m.name, type: 'THÀNH_PHỐ' as LocationType, continentId: m.id })),
    { id: 'hoang_phong_coc', name: 'Hoàng Phong Cốc', type: 'TÔNG_MÔN', continentId: 'thanh_chau' },
    { id: 'thanh_van_mon', name: 'Thanh Vân Môn', type: 'TÔNG_MÔN', continentId: 'thanh_chau' },
  ] as Location[],

  paths: [
    // Kết nối nội bộ
    { id: 'path_hpc_sv', fromLocationId: 'hoang_phong_coc', toLocationId: 'thanh_van_mon', name: 'Ngự Kiếm Chuyển Di', travelTimeDays: 2 },
  ] as Path[]
};

export const getAccessibleLocations = (currentLocationId: string): Path[] => {
    return WORLD_MAP.paths.filter(p => p.fromLocationId === currentLocationId || p.toLocationId === currentLocationId);
};
