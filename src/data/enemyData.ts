import { Realm } from "../types";
import { REALMS } from "./worldData";
import { getBreakthroughMultiplier } from "../engine/realmData";

export const BEAST_ELEMENTS = ["Huyết", "Lôi", "Băng", "Kim", "Hỏa", "Thủy", "Mộc", "Thổ", "Phong", "Cửu U", "Ma", "Minh", "Thái Cổ", "Viễn Cổ", "Thần", "Linh"];
export const BEAST_TRAITS = ["Đồng", "Diễm", "Tinh", "Giáp", "Sát", "Cuồng", "Linh", "Ảnh", "Khôi", "Phệ", "Cự", "Sí", "Độc", "Khiếu"];
export const BEAST_SPECIES = ["Viên", "Lang", "Xà", "Hồ", "Long", "Hổ", "Báo", "Ưng", "Quy", "Hầu", "Trư", "Ngưu", "Tượng", "Điêu", "Thiềm"];

export const BEAST_CLANS = {
  LONG: ["Giao Long", "Ly Long", "Hắc Long", "Thanh Long", "Ứng Long", "Chúc Long", "Cầu Long", "Kim Giáp Địa Long", "Cốt Long"],
  PHUONG: ["Hỏa Phượng", "Băng Phượng", "Thanh Loan", "Chu Tước", "Kim Ô", "Bất Tử Điểu"],
  HO: ["Liệt Diễm Hổ", "Bạch Hổ", "U Minh Hổ", "Lôi Dực Hổ", "Hắc Văn Ma Hổ", "Cùng Kỳ"],
  LANG: ["Khiếu Nguyệt Lang", "Huyết Lang", "Phong Lang", "U Ảnh Lang", "Thiên Lang", "Lôi Diễm Thiên Lang"],
  XA: ["Huyền Minh Xà", "Cửu Đầu Xà", "Đằng Xà", "Bích Lân Xà", "Hỏa Lân Mãng", "Cửu U Minh Xà"],
  QUY: ["Huyền Vũ Quy", "Huyền Giáp Quy", "Long Quy", "Thôn Hải Quy"],
  HO_FOX: ["Cửu Vĩ Hồ", "Huyễn Hồ", "Tuyết Hồ", "Thiên Hồ", "Băng Tinh Hồ"],
  VIEN: ["Kim Cang Viên", "Ma Viên", "Bạo Huyết Cự Viên", "Thông Thiên Ma Hầu", "Huyết Đồng Ma Viên"],
  DIEU: ["Lôi Ưng", "Kim Sí Đại Bằng", "Huyết Nha", "Thanh Vân Hạc", "Phệ Hồn Quạ", "U Minh Quỷ Điểu"],
  CON_TRUNG: ["Huyết Ma Chu", "Kim Giáp Trùng", "Phệ Linh Trùng", "Độc Vĩ Hạt"],
  HAI_YEU: ["Cự Kình", "Hải Giao", "Thâm Hải Cự Chương", "Lam Lân Sa"],
  THUC_VAT: ["Huyết Đằng Yêu", "Thôn Linh Hoa", "Quỷ Diện Thụ", "Cửu Diệp Linh Liên"],
  THAN_THU: ["Thanh Long", "Bạch Hổ", "Chu Tước", "Huyền Vũ", "Kỳ Lân", "Côn Bằng", "Thao Thiết", "Cùng Kỳ", "Đào Ngột"]
};

export const getRandomBeastName = (realm: number, bloodlineMultiplier: number = 1.0): string => {
  if (bloodlineMultiplier >= 5.0) {
    const pool = BEAST_CLANS.THAN_THU;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const useClanName = Math.random() < 0.7;
  if (useClanName) {
    const clans = Object.values(BEAST_CLANS);
    const selectedClan = clans[Math.floor(Math.random() * clans.length)];
    return selectedClan[Math.floor(Math.random() * selectedClan.length)];
  }

  const element = BEAST_ELEMENTS[Math.floor(Math.random() * BEAST_ELEMENTS.length)];
  const trait = BEAST_TRAITS[Math.floor(Math.random() * BEAST_TRAITS.length)];
  const species = BEAST_SPECIES[Math.floor(Math.random() * BEAST_SPECIES.length)];
  
  const realmIndex = realm as unknown as number; // Realm is typically an index anyway since that's how it's used elsewhere
  let title = "";
  
  if (realmIndex >= 3) {
    const titles = ["Thiên", "Địa", "Huyền", "Hoàng", "Cổ", "Linh", "Thánh", "Thần", "Ma", "Yêu"];
    title = titles[Math.floor(Math.random() * titles.length)];
  }

  const nameParts = [element, trait];
  if (title) nameParts.push(title);
  nameParts.push(species);
  
  return nameParts.join("");
};

export const getRandomBeastSkillName = (beastName: string): string => {
  const actions = ["Trảo", "Kích", "Phá", "Ấn", "Bạo", "Biến", "Hống", "Vụ", "Vực", "Trảm", "Phệ", "Kình", "Vũ", "Tức", "Phách", "Thứ", "Xung"];
  const prefixes = ["Thần", "Ma", "Linh", "Thái Cổ", "Vô Thượng", "Hỗn Độn", "Nghịch Thiên"];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  
  if (beastName.includes("Long")) return Math.random() > 0.5 ? "Long Tức" : `Long ${action}`;
  if (beastName.includes("Hổ")) return Math.random() > 0.5 ? "Hổ Khiếu" : `Hổ ${action}`;
  if (beastName.includes("Lang")) return Math.random() > 0.5 ? "Khiếu Nguyệt" : `Thiên Lang ${action}`;
  if (beastName.includes("Phượng")) return Math.random() > 0.5 ? "Phượng Minh" : `Phượng Hoàng ${action}`;
  if (beastName.includes("Xà")) return Math.random() > 0.5 ? "Xà Độc" : `Lân Xà ${action}`;
  if (beastName.includes("Viên") || beastName.includes("Hầu")) return `Bạo ${action}`;
  if (beastName.includes("Hồ")) return Math.random() > 0.5 ? "Huyễn Thuật" : `Yêu Hồ ${action}`;
  if (beastName.includes("Điểu") || beastName.includes("Bằng")) return `Sí ${action}`;
  
  const elements = ["Huyết", "Lôi", "Băng", "Kim", "Hỏa", "Thủy", "Mộc", "Thổ", "Phong"];
  for (const el of elements) {
    if (beastName.includes(el)) return `${el} ${action}`;
  }

  return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${action}`;
};

export const BEAST_BLOODLINES = [
  { name: "Yêu huyết", multiplier: 1.0, chance: 0.6, ability: "Cắn xé: Gây sát thương cơ bản." },
  { name: "Mãnh thú huyết", multiplier: 1.2, chance: 0.2, ability: "Gầm thét: Làm giảm phòng ngự đối phương." },
  { name: "Sát lục huyết", multiplier: 1.5, chance: 0.1, ability: "Khát máu: Tăng sức tấn công khi HP thấp." },
  { name: "Cổ tộc huyết", multiplier: 1.8, chance: 0.05, ability: "Cổ bì: Khả năng phòng ngự cực cao." },
  { name: "Thụy thú huyết", multiplier: 2.2, chance: 0.02, ability: "Tiềm năng: Tỉ lệ rơi vật phẩm hiếm cao." },
  { name: "Yêu vương huyết", multiplier: 3.0, chance: 0.008, ability: "Uy áp: Tăng sát thương diện rộng." },
  { name: "Hung thú huyết", multiplier: 4.2, chance: 0.002, ability: "Hủy diệt: Sát thương bạo kích cực lớn." },
  { name: "Thánh thú huyết", multiplier: 6.0, chance: 0.0005, ability: "Thánh lực: Hồi phục liên tục trong chiến đấu." },
];

export const getRandomBeastBloodline = () => {
  const rand = Math.random();
  let cumulativeChance = 0;
  for (const bloodline of BEAST_BLOODLINES) {
    cumulativeChance += bloodline.chance;
    if (rand <= cumulativeChance) {
      return bloodline;
    }
  }
  return BEAST_BLOODLINES[0];
};

export const getBeastTierLabel = (realm: number, subRealm: number): string => {
  let label = "";
  switch (realm) {
    case 1: label = "Nhất giai yêu thú"; break;
    case 2: label = "Nhị giai yêu thú"; break;
    case 3: label = "Tam giai yêu thú"; break;
    case 4: label = "Tứ giai yêu thú"; break;
    case 5: label = "Ngũ giai yêu thú"; break;
    case 6: label = "Lục giai yêu thú"; break;
    case 7: label = "Thất giai yêu thú"; break;
    case 8: label = "Bát giai yêu thú"; break;
    case 9: label = "Cửu giai yêu thú"; break;
    default: label = "Yêu thú cấp thấp"; break;
  }

  if (realm === 1) return `${label} - Tầng ${subRealm}`;
  
  const subLabels = ["Sơ kỳ", "Trung kỳ", "Hậu kỳ", "Đại viên mãn"];
  const subLabel = subLabels[subRealm - 1] || `Tầng ${subRealm}`;
  return `${label} (${subLabel})`;
};

export const getBaseStats = (realm: number, subRealm: number, variance: number = 0) => {
  let stats = {
    hp: 100,
    atk: 10,
    def: 8,
    spd: 5,
    acc: 80
  };

  const realmIndex = realm as unknown as number;
  
  for (let r = 0; r <= realmIndex; r++) {
    const currentRealmDef = REALMS[r];
    const maxSub = r === realmIndex ? subRealm : (currentRealmDef ? currentRealmDef.stages.length : 4);
    const majorMult = getBreakthroughMultiplier(r);
    const minorMult = 1.1;

    for (let s = 1; s <= maxSub; s++) {
      if (s === 1 && r > 0) {
        stats.hp *= majorMult;
        stats.atk *= majorMult;
        stats.def *= majorMult;
        stats.spd *= majorMult;
        stats.acc *= majorMult;
      } else if (s > 1) {
        stats.hp *= minorMult;
        stats.atk *= minorMult;
        stats.def *= minorMult;
        stats.spd *= minorMult;
        stats.acc *= minorMult;
      }
    }
  }

  const applyVariance = (val: number) => {
    if (variance === 0) return val;
    const factor = 1 + (Math.random() * variance * 2 - variance);
    return val * factor;
  };

  return {
    hp: Math.floor(applyVariance(stats.hp)),
    atk: Math.floor(applyVariance(stats.atk)),
    def: Math.floor(applyVariance(stats.def)),
    spd: Math.floor(applyVariance(stats.spd)),
    acc: Math.floor(applyVariance(stats.acc))
  };
};
