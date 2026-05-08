// src/data/sect_system.ts

export type SectRank = 
  | 'NGOAI_MON'      // Ngoại môn 
  | 'NOI_MON'        // Nội môn
  | 'NONG_COT'       // Nòng cốt
  | 'TRUONG_LAO'     // Trưởng lão
  | 'TONG_CHU'       // Tông chủ

export interface SectAction {
  id: string;
  name: string;
  contributionCost: number;
  description: string;
}

export interface SectMission {
  id: string;
  name: string;
  difficulty: number;
  requirements: string[]; // e.g., ["realm:Trúc Cơ Kỳ"]
  rewardContribution: number;
  rewardItems: string[];
}

export const SECT_MECHANICS = {
  ranks: [
    { id: 'NGOAI_MON', name: 'Đệ tử Ngoại môn', requirementReputation: 0 },
    { id: 'NOI_MON', name: 'Đệ tử Nội môn', requirementReputation: 200 },
    { id: 'NONG_COT', name: 'Đệ tử Nòng cốt', requirementReputation: 1000 },
    { id: 'TRUONG_LAO', name: 'Trưởng lão', requirementReputation: 5000 },
    { id: 'TONG_CHU', name: 'Tông chủ', requirementReputation: 20000 },
  ],
  
  // Các hành động có thể làm khi đã vào tông môn
  actions: {
    'TRAIN': { id: 'train', name: 'Tu luyện tại bí cảnh tông môn', contributionCost: 50, description: 'Tăng tốc độ tu luyện' },
    'COLLECT_RESOURCES': { id: 'collect', name: 'Thu thập tài nguyên tông môn', contributionCost: 0, description: 'Nhận vật phẩm hàng tháng' },
    'UPGRADE_TECHNIQUE': { id: 'upgrade', name: 'Đổi công pháp bí truyền', contributionCost: 500, description: 'Học công pháp cấp cao' },
  }
};

export const getSectInteractions = (sectName: string) => {
    // Tùy biến theo tông môn
    switch(sectName) {
        case 'Hoàng Phong Cốc':
            return {
                specialty: 'Luyện Khí',
                missions: [
                    { id: 'hpc_task1', name: 'Thu hoạch Linh Thảo', difficulty: 1, requirements: [], rewardContribution: 50, rewardItems: ['Linh Thảo'] },
                    { id: 'hpc_task2', name: 'Bảo vệ lò luyện đan', difficulty: 3, requirements: ['realm:Luyện Khí Viên Mãn'], rewardContribution: 200, rewardItems: ['Đan dược'] }
                ]
            };
        case 'Thanh Vân Môn':
            return {
                specialty: 'Kiếm Đạo',
                missions: [
                    { id: 'tvm_task1', name: 'Luyện kiếm ý', difficulty: 2, requirements: [], rewardContribution: 70, rewardItems: ['Kiếm phách'] },
                    { id: 'tvm_task2', name: 'Trừ ma vệ đạo', difficulty: 4, requirements: ['realm:Trúc Cơ Kỳ'], rewardContribution: 300, rewardItems: ['Kiếm quyết bí truyền'] }
                ]
            };
        case 'Thiên Sát Tông':
            return {
                specialty: 'Sát Phạt',
                missions: [
                    { id: 'tst_task1', name: 'Thu thập Huyết Khí', difficulty: 2, requirements: [], rewardContribution: 80, rewardItems: ['Tà khí'] },
                    { id: 'tst_task2', name: 'Ám sát tông môn đối địch', difficulty: 5, requirements: ['realm:Trúc Cơ Kỳ'], rewardContribution: 500, rewardItems: ['Máu yêu thú quý'] }
                ]
            };
        default:
            return { specialty: 'Chung', missions: [] };
    }
};
