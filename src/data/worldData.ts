/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Realm, Sect, Talent, Background, Recipe, MapRegion, InventoryItem, Rarity } from '../types';

export const REALMS: Realm[] = [
  {
    name: 'Phàm Nhân',
    level: 0,
    description: 'Chưa bước vào con đường tu tiên, cơ thể phàm nhân yếu ớt, linh lực chưa tụ.',
    stages: ['Thanh Niên', 'Trung Niên', 'Lão Niên']
  },
  {
    name: 'Luyện Khí Kỳ',
    level: 1,
    description: 'Cảm ứng linh khí trời đất, dẫn vào cơ thể, tẩy tủy phạt mao.',
    stages: ['Luyện Khí Tầng 1-3', 'Luyện Khí Tầng 4-6', 'Luyện Khí Tầng 7-9', 'Luyện Khí Viên Mãn']
  },
  {
    name: 'Trúc Cơ Kỳ',
    level: 2,
    description: 'Đúc tầng cơ sở cho con đường tu tiên, thọ nguyên tăng đến 200 năm.',
    stages: ['Trúc Cơ Sơ Kỳ', 'Trúc Cơ Trung Kỳ', 'Trúc Cơ Hậu Kỳ', 'Trúc Cơ Viên Mãn']
  },
  {
    name: 'Kim Đan Kỳ',
    level: 3,
    description: 'Linh khí ngưng tụ thành đan, thoát thai hoán cốt, thọ nguyên 500 năm.',
    stages: ['Kim Đan SƠ Kỳ', 'Kim Đan Trung Kỳ', 'Kim Đan Hậu Kỳ', 'Kim Đan Viên Mãn']
  },
  {
    name: 'Nguyên Anh Kỳ',
    level: 4,
    description: 'Phá đan sinh anh, có thể xuất khiếu du ngoạn, thọ nguyên ngàn năm.',
    stages: ['Nguyên Anh Sơ Kỳ', 'Nguyên Anh Trung Kỳ', 'Nguyên Anh Hậu Kỳ', 'Nguyên Anh Viên Mãn']
  },
  {
    name: 'Hóa Thần Kỳ',
    level: 5,
    description: 'Tiếp xúc linh hồn, nắm bắt quy tắc thiên địa, thọ nguyên vạn năm.',
    stages: ['Hóa Thần Sơ Kỳ', 'Hóa Thần Trung Kỳ', 'Hóa Thần Hậu Kỳ', 'Hóa Thần Viên Mãn']
  },
  {
    name: 'Luyện Hư Kỳ',
    level: 6,
    description: 'Luyện ảo thành thật, dung nhập hư không.',
    stages: ['Luyện Hư Sơ Kỳ', 'Luyện Hư Trung Kỳ', 'Luyện Hư Hậu Kỳ', 'Luyện Hư Viên Mãn']
  },
  {
    name: 'Hợp Thể Kỳ',
    level: 7,
    description: 'Thân thể và Nguyên Anh hợp nhất, vĩnh hằng bất diệt.',
    stages: ['Hợp Thể Sơ Kỳ', 'Hợp Thể Trung Kỳ', 'Hợp Thể Hậu Kỳ', 'Hợp Thể Viên Mãn']
  },
  {
    name: 'Đại Thừa Kỳ',
    level: 8,
    description: 'Viên mãn chi cảnh, chuẩn bị độ kiếp phi thăng.',
    stages: ['Đại Thừa Sơ Kỳ', 'Đại Thừa Trung Kỳ', 'Đại Thừa Hậu Kỳ', 'Đại Thừa Viên Mãn']
  },
  {
    name: 'Độ Kiếp Kỳ',
    level: 9,
    description: 'Đón nhận thiên kiếp, vượt qua thành tiên, thất bại thành tro bụi.',
    stages: ['Tầng 1-3 Kiếp', 'Tầng 4-6 Kiếp', 'Tầng 7-9 Kiếp', 'Phi Thăng Cảnh']
  }
];

export const LINH_CAN = [
  'Kim Linh Căn (Đơn)', 'Mộc Linh Căn (Đơn)', 'Thủy Linh Căn (Đơn)', 'Hỏa Linh Căn (Đơn)', 'Thổ Linh Căn (Đơn)',
  'Lôi Linh Căn (Dị)', 'Phong Linh Căn (Dị)', 'Băng Linh Căn (Dị)', 'Kiếm Linh Căn (Dị)',
  'Kim-Mộc Song Linh Căn', 'Thủy-Hỏa Song Linh Căn', 'Thổ-Kim Song Linh Căn',
  'Tam Linh Căn (Tạp)', 'Tứ Linh Căn (Tạp)', 'Ngũ Linh Căn (Phế)',
  'Hư Linh Căn (Phế Vật)', 'Ẩn Linh Căn (Kỳ Ngộ)', 'Hỗn Độn Linh Căn (Chí Cao)', 'Thôn Phệ Linh Căn (Cấm Kỵ)'
];

export const SECTS: Sect[] = [
  {
    name: 'Hoàng Phong Cốc',
    align: 'Chính',
    specialty: 'Luyện Khí & Ngự Kiếm',
    description: 'Một trong thất đại môn phái của Việt Quốc, trấn thủ Thái Nhạc Sơn Mạch.'
  },
  {
    name: 'Thanh Vân Môn',
    align: 'Chính',
    specialty: 'Kiếm Đạo',
    description: 'Tông môn chính đạo uy chấn thiên hạ, kiếm pháp chính tông.'
  },
  {
    name: 'Thiên Sát Tông',
    align: 'Ma',
    specialty: 'Sát Phạt & Huyết Thuật',
    description: 'Ma đạo tông môn vô cùng tàn bạo, lấy sát dưỡng đạo.'
  },
  {
    name: 'Quỷ Linh Môn',
    align: 'Ma',
    specialty: 'Quỷ Đạo & Ngự Thi',
    description: 'Bí thuật quỷ dị, am hiểu điều khiển âm thi và quỷ hồn.'
  },
  {
    name: 'Tinh Cung',
    align: 'Chính',
    specialty: 'Tinh Thần Đại Pháp',
    description: 'Thế lực tối cao cai trị Thiên Tinh Thành và Loạn Tinh Hải qua nhiều vạn năm.'
  },
  {
    name: 'Nghịch Tinh Minh',
    align: 'Ma',
    specialty: 'Hỗn Hợp Bí Thuật',
    description: 'Liên minh các thế lực muốn lật đổ sự thống trị của Tinh Cung tại Loạn Tinh Hải.'
  },
  {
    name: 'Mộ Lan Nhân',
    align: 'Trung Lập',
    specialty: 'Pháp Thuật Liên Hợp',
    description: 'Các bộ tộc du mục tại Mộ Lan Thảo Nguyên, nổi tiếng với khả năng phối hợp chiến đấu.'
  },
  {
    name: 'Thái Nhất Môn',
    align: 'Chính',
    specialty: 'Thiên Địa Chính Khí',
    description: 'Một trong những tông môn mạnh nhất Đại Tấn, đại diện cho chính đạo đỉnh phong.'
  },
  {
    name: 'Hóa Ý Môn',
    align: 'Chính',
    specialty: 'Ý Cảnh Tu Luyện',
    description: 'Tông môn thần bí tại Đại Tấn, am hiểu về sức mạnh ý cảnh và linh hồn.'
  }
];

export const BACKGROUNDS: Background[] = [
  {
    id: 'orphan',
    name: 'Lưu Lạc Cô Nhi',
    description: 'Ngươi lớn lên từ những khu ổ chuột, hiểu rõ sự tàn khốc của nhân gian.',
    startingItems: [
      { id: 'banh_bao_kho', name: 'Bánh bao khô', description: 'Một mẩu bánh bao cứng ngắc, chỉ đủ lót dạ.', type: 'CONSUMABLE', rarity: 'Phàm', amount: 3 },
      { id: 'manh_ngoc_vo', name: 'Mảnh ngọc vỡ', description: 'Kỷ vật duy nhất về thân thế của bạn.', type: 'TREASURE', rarity: 'Phàm', amount: 1 }
    ],
    startingReputation: { 'Tán Tu Liên Minh': 10 },
    passive: 'Khả năng sinh tồn cao, dễ dàng tìm thấy tài nguyên trong tự nhiên.'
  },
  {
    id: 'noble',
    name: 'Gia Tộc Chi Tử',
    description: 'Sinh ra trong nhung lụa, mang theo tài nguyên và danh tiếng của gia tộc.',
    startingItems: [
      { id: 'linh_thach_ha_pham', name: 'Linh thạch hạ phẩm', description: 'Đơn vị tiền tệ cơ bản của tu tiên giới.', type: 'CURRENCY', rarity: 'Phàm', amount: 10 },
      { id: 'linh_can_dan', name: 'Linh căn đan', description: 'Đan dược hỗ trợ cảm ứng linh khí.', type: 'CONSUMABLE', rarity: 'Linh', amount: 1 }
    ],
    startingReputation: { 'Thanh Vân Môn': 20, 'Vạn Vật Các': 15 },
    passive: 'Giao tiếp tốt, nhận được sự tôn trọng từ các thế lực chính nghĩa.'
  },
  {
    id: 'wanderer',
    name: 'Khổ Hạnh Tăng',
    description: 'Du hành khắp nơi, tâm cảnh vững vàng, không bị ngoại vật lay động.',
    startingItems: [
      { id: 'gay_truc', name: 'Gậy trúc', description: 'Vật dụng hỗ trợ di chuyển đường dài.', type: 'EQUIPMENT', rarity: 'Phàm', amount: 1 },
      { id: '灵泉_water', name: 'Bình nước linh tuyền', description: 'Chứa nước suối mang chút linh lực.', type: 'CONSUMABLE', rarity: 'Phàm', amount: 1 }
    ],
    startingReputation: { 'Vạn Vật Các': 10 },
    passive: 'Tâm ma khó xâm nhập, tốc độ hồi phục mana nhanh hơn.'
  }
];

export const RECIPES: Recipe[] = [
  {
    id: 'heal_pill',
    name: 'Hồi Huyết Đan',
    materials: { 'Linh Thảo': 2, 'Linh Tuyền': 1 },
    result: 'Hồi Huyết Đan (Hạ phẩm)',
    description: 'Hồi phục 30% HP ngay lập tức.'
  },
  {
    id: 'mana_pill',
    name: 'Bổ Linh Đan',
    materials: { 'Linh Thảo': 1, 'Linh Thạch Vụn': 1 },
    result: 'Bổ Linh Đan (Hạ phẩm)',
    description: 'Hồi phục 30% Mana ngay lập tức.'
  },
  {
    id: 'simple_talisman',
    name: 'Hộ Thân Phù',
    materials: { 'Giấy Bùa': 1, 'Chu Sa': 1 },
    result: 'Hộ Thân Phù',
    description: 'Tăng phòng ngự trong trận chiến tiếp theo.'
  }
];

export const NPC_ANATOMY_FIELDS = [
  'Khuôn mặt', 'Ánh mắt', 'Đôi môi', 'Làn da', 'Khung xương', 'Chiều cao', 'Cân nặng',
  'Cổ', 'Bờ vai', 'Cánh tay', 'Bàn tay', 'Ngực (Kích thước)', 'Ngực (Hình dáng)', 'Đầu vú', 'Quầng vú',
  'Eo', 'Bụng', 'Rốn', 'Lưng', 'Mông', 'Đùi', 'Bắp chân', 'Bàn chân',
  'Vùng kín (Mọc lông)', 'Âm hộ (Hình dáng)', 'Môi lớn', 'Môi bé', 'Âm vật (Hạt le)', 'Cửa mình', 'Màng trinh', 'Dịch tiết',
  'Hương thơm cơ thể', 'Giọng nói', 'Khí chất', 'Phản ứng sinh lý', 'Vết sẹo/Hình xăm', 'Điểm nhạy cảm', 'Tư thế đặc trưng', 'Trạng thái chuẩn bị'
];

export const NPC_STYLES = [
  'Thanh Lãnh', 'Tà Mị Quyến Rũ', 'Lạnh Lùng Sát Phạt', 'Thiên Chân Thiên Tài', 
  'Yêu Tộc/Bán Yêu', 'Ma Đạo', 'Y Sư/Luyện Đan', 'Kiếm Tu', 'Quyền Quý Cổ Phong', 
  'Ẩn Thế Cao Nhân', 'Song Tu/Tình Đạo'
];

export const WORLD_LORE = `
Thế giới vô cùng rộng lớn bao gồm Thiên Nam Tu Tiên Giới, Loạn Tinh Hải, Mộ Lan Thảo Nguyên và trung tâm tu tiên thế giới - Đại Tấn. 
Thiên Nam gồm các quốc gia như Việt Quốc, Nguyên Vũ Quốc với các đại sơn mạch như Thái Nhạc Sơn Mạch và cấm địa Huyết Sắc - nơi chứa đựng linh dược nghìn năm nhưng đầy rẫy cấm chế chết người.
Loạn Tinh Hải là vùng biển vô tận, nơi Tinh Cung và Nghịch Tinh Minh tranh hùng, cùng ngoại hải đầy rẫy yêu thú cấp cao và các di tích cổ xưa ẩn mình trong sương mù.
Đại Tấn là nơi hội tụ các đại tông môn như Thái Nhất Môn, nơi đỉnh cao của tu tiên giới nhân loại với những đại thành tu tiên nguy nga tráng lệ.
Ngoài ra còn có Vô Biên Hải huyền bí, Yêu Tộc và Ma Tộc Lĩnh Địa đầy rẫy hiểm cảnh. Những vùng Ngoại Không Loạn Lưu hay Cổ Chiến Trường là nơi tu sĩ tìm kiếm mảnh vỡ Linh Bảo và truyền thừa thượng cổ, nhưng cái giá phải trả thường là mạng sống.
Truyền thuyết về phi thăng lên Linh Giới và Tiên Giới thông qua Hư Thiên Điện hay các Không Gian Toàn Đạo luôn là mục đích tối thượng của mọi tu sĩ.

Hệ thống danh tiếng ảnh hưởng đến giá cả và thái độ của NPC. 
Càng nhiều nhân quả (Karma), thiên kiếp càng mạnh nhưng sức mạnh bộc phát càng lớn.
`;
