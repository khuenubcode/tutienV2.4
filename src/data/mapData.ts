import { Realm } from "../types"; // Keep import but might not need it for value

export const WORLD_PREFIXES = ["Thiên", "Huyền", "Thái", "Cửu", "Vạn", "Hồng", "U", "Thanh", "Bắc", "Nam"];
export const WORLD_SUFFIXES = ["Đại Lục", "Giới", "Châu", "Vực", "Hải", "Hoang", "Cảnh", "Thổ"];

export const LOC_PREFIXES = ["Thiên", "Huyền", "Cửu", "Hắc", "Thanh", "Hỏa", "Băng", "Huyết", "Thái", "Vạn"];
export const LOC_CORES = ["Long", "Kiếm", "Vân", "Phong", "Nguyệt", "Hà", "Sơn", "Ma", "Linh", "Yêu"];

export const LOC_TYPES = {
  CITY: ["Thành", "Trấn", "Phủ", "Quận"],
  SECT: ["Tông", "Môn", "Phái", "Viện", "Động Thiên"],
  SECRET: ["Bí Cảnh", "Di Tích", "Cấm Địa", "Phúc Địa"],
  NATURAL: ["Sơn", "Cốc", "Hải", "Lâm", "Hà", "Vực", "Đảo"]
};

export const getRandomLocationName = (type?: keyof typeof LOC_TYPES): string => {
  const prefix = LOC_PREFIXES[Math.floor(Math.random() * LOC_PREFIXES.length)];
  const core = LOC_CORES[Math.floor(Math.random() * LOC_CORES.length)];
  
  const types = type ? LOC_TYPES[type] : [...LOC_TYPES.CITY, ...LOC_TYPES.SECT, ...LOC_TYPES.SECRET, ...LOC_TYPES.NATURAL];
  const suffix = types[Math.floor(Math.random() * types.length)];
  
  return `${prefix} ${core} ${suffix}`;
};

export const WORLD_MAPS = [
  {
    id: "thanh_chau",
    name: "Thanh Châu",
    description: "Vùng đất trù phú, nơi khởi điểm của những người phàm trần ôm mộng tu tiên.",
    minRealm: 0,
    bg: "bg-emerald-950/20",
    difficulty: 1,
    beasts: ["Gà Rừng", "Sói Xám", "Thổ Phỉ"],
    position: { x: 15, y: 85 }
  },
  {
    id: "bac_hoang",
    name: "Bắc Hoang",
    description: "Vùng biên cương cằn cỗi, linh khí mỏng manh nhưng ẩn giấu nhiều kỳ ngộ.",
    minRealm: 1,
    bg: "bg-orange-950/20",
    difficulty: 2,
    beasts: ["Lôi Lang", "Băng Xà", "Hỏa Hồ", "Độc Hạt"],
    position: { x: 30, y: 65 }
  },
  {
    id: "huyen_vuc",
    name: "Huyền Vực",
    description: "Vùng đất huyền bí với các dãy núi cao chọc trời, là nơi tọa lạc của nhiều tông môn.",
    minRealm: 2,
    bg: "bg-blue-950/20",
    difficulty: 3,
    beasts: ["Huyền Thiết Vệ", "U Linh", "Ma Viên", "Kim Giáp Trùng"],
    position: { x: 50, y: 80 }
  },
  {
    id: "nam_hai",
    name: "Nam Hải",
    description: "Vùng biển rộng lớn vô tận, ẩn chứa những thủy quái và kho tàng dưới đáy đại dương.",
    minRealm: 3,
    bg: "bg-cyan-950/30",
    difficulty: 5,
    beasts: ["Cự Kình", "Hải Giao", "Thâm Hải Chương", "Lam Lân Sa"],
    position: { x: 75, y: 70 }
  },
  {
    id: "dong_hai",
    name: "Đông Hải",
    description: "Vùng biển sương mù bao phủ quanh năm, nơi có nhiều luồng xoáy không gian và lốc xoáy.",
    minRealm: 4,
    bg: "bg-teal-950/30",
    difficulty: 9,
    beasts: ["Long Ngư", "Lôi Ngư", "U Tộc Hải Linh", "Huyễn Trân Yêu"],
    position: { x: 88, y: 80 }
  },
  {
    id: "tay_hai",
    name: "Tây Hải",
    description: "Vùng biển hoàng hôn tĩnh lặng nhưng sâu thẳm, được cho là điểm kết nối với cõi âm.",
    minRealm: 6,
    bg: "bg-indigo-950/30",
    difficulty: 13,
    beasts: ["Quỷ Sa Ám", "Tà Kình", "Bóng Ma Biển", "Thủy Yêu Vương"],
    position: { x: 5, y: 55 }
  },
  {
    id: "bac_hai",
    name: "Bắc Hải",
    description: "Vùng biển băng giá vĩnh cửu, những tảng băng trôi ẩn chứa quái vật biển cổ xưa.",
    minRealm: 6,
    bg: "bg-sky-950/30",
    difficulty: 19,
    beasts: ["Băng Bằng", "Cực Hàn Xà", "Bạch Kình Thần", "Băng Sương Cự Long"],
    position: { x: 50, y: 5 }
  },
  {
    id: "u_canh",
    name: "U Cảnh",
    description: "Lãnh địa của sương mù và ảo ảnh, nơi ranh giới giữa thực và ảo trở nên mong manh.",
    minRealm: 4,
    bg: "bg-purple-950/40",
    difficulty: 8,
    beasts: ["Cửu Vĩ Hồ", "Huyễn Hồ", "U Ảnh Lang", "Ma Quỷ Điểu"],
    position: { x: 85, y: 45 }
  },
  {
    id: "van_tho",
    name: "Vạn Thổ",
    description: "Vùng đất cổ xưa với những di tích từ thời khai thiên lập địa.",
    minRealm: 6,
    bg: "bg-amber-950/30",
    difficulty: 12,
    beasts: ["Cổ Long", "Hỏa Phượng", "Thiên Lang", "Bát Đại Yêu"],
    position: { x: 60, y: 40 }
  },
  {
    id: "hong_gioi",
    name: "Hồng Giới",
    description: "Không gian hỗn mang, nơi linh khí nồng đậm đến mức hóa thành sương mù dày đặc.",
    minRealm: 6,
    bg: "bg-rose-950/30",
    difficulty: 18,
    beasts: ["Hỗn Độn Thú", "Hư Không Thú", "Thái Cổ Di Chủng"],
    position: { x: 35, y: 35 }
  },
  {
    id: "cuu_dai_luc",
    name: "Cửu Đại Lục",
    description: "Trung tâm của vạn giới, nơi tập trung những cường giả hàng đầu thế gian.",
    minRealm: 7,
    bg: "bg-slate-900/40",
    difficulty: 25,
    beasts: ["Yêu Vương", "Ma Thánh", "Thần Thú Quái", "Cự Viên Vương"],
    position: { x: 15, y: 20 }
  },
  {
    id: "thai_vuc",
    name: "Thái Vực",
    description: "Vùng đất tối cao, nơi quy tắc thiên đạo hiển hiện rõ rệt nhất.",
    minRealm: 8,
    bg: "bg-yellow-950/20",
    difficulty: 35,
    beasts: ["Thiên Đạo Vệ", "Thần Thú", "Thánh Linh"],
    position: { x: 50, y: 15 }
  },
  {
    id: "thien_gioi",
    name: "Thiên Giới",
    description: "Đỉnh cao của chư thiên vạn giới, nơi vĩnh hằng bất diệt.",
    minRealm: 9,
    bg: "bg-white/5",
    difficulty: 50,
    beasts: ["Chân Tiên Di Chủng", "Tribulation Beast", "Thiên Phạt Giả"],
    position: { x: 80, y: 15 }
  }
];
