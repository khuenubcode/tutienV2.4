// src/data/world_map_system.ts

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
    { id: 'thien_nam', name: 'Thiên Nam Tu Tiên Giới', description: 'Vùng đất chính của Việt Quốc, Nguyên Vũ Quốc.' },
    { id: 'loan_tinh_hai', name: 'Loạn Tinh Hải', description: 'Vùng biển vô tận chứa đầy di tích cổ.' },
    { id: 'mo_lan', name: 'Mộ Lan Thảo Nguyên', description: 'Vùng du mục nổi tiếng với pháp thuật phối hợp.' },
    { id: 'dai_tan', name: 'Đại Tấn', description: 'Trung tâm tu tiên giới.' },
  ] as Continent[],

  locations: [
    // Thiên Nam
    { id: 'hoang_phong_coc', name: 'Hoàng Phong Cốc', type: 'TÔNG_MÔN', continentId: 'thien_nam' },
    { id: 'thanh_van_mon', name: 'Thanh Vân Môn', type: 'TÔNG_MÔN', continentId: 'thien_nam' },
    { id: 'huyet_sac_cam_dia', name: 'Cấm địa Huyết Sắc', type: 'CẤM_ĐỊA', continentId: 'thien_nam' },
    
    // Loạn Tinh Hải
    { id: 'thien_tinh_thanh', name: 'Thiên Tinh Thành', type: 'THÀNH_PHỐ', continentId: 'loan_tinh_hai' },
    
    // Mộ Lan
    { id: 'mo_lan_bo_toc', name: 'Bộ Lạc Mộ Lan', type: 'THẢO_NGUYÊN', continentId: 'mo_lan' },
    
    // Đại Tấn
    { id: 'thai_nhat_mon', name: 'Thái Nhất Môn', type: 'TÔNG_MÔN', continentId: 'dai_tan' },
  ] as Location[],

  paths: [
    // Kết nối nội bộ Thiên Nam
    { id: 'path_hpc_sv', fromLocationId: 'hoang_phong_coc', toLocationId: 'thanh_van_mon', name: 'Ngự Kiếm Chuyển Di', travelTimeDays: 2 },
    { id: 'path_hpc_hscd', fromLocationId: 'hoang_phong_coc', toLocationId: 'huyet_sac_cam_dia', name: 'Sơn Đạo Chết Chóc', travelTimeDays: 5 },
    
    // Kết nối giữa các châu lục
    { id: 'path_thien_nam_loan_tinh', fromLocationId: 'thien_tinh_thanh', toLocationId: 'thanh_van_mon', name: 'Hải Lộ Xuyên Không', travelTimeDays: 30 },
    { id: 'path_thien_nam_mo_lan', fromLocationId: 'thanh_van_mon', toLocationId: 'mo_lan_bo_toc', name: 'Đường Mòn Biên Giới', travelTimeDays: 20 },
    { id: 'path_mo_lan_dai_tan', fromLocationId: 'mo_lan_bo_toc', toLocationId: 'thai_nhat_mon', name: 'Đại Lộ Thông Tấn', travelTimeDays: 40 },
  ] as Path[]
};

export const getAccessibleLocations = (currentLocationId: string): Path[] => {
    return WORLD_MAP.paths.filter(p => p.fromLocationId === currentLocationId || p.toLocationId === currentLocationId);
};
