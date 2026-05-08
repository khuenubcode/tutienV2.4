
export enum Realm {
  MORTAL = "Phàm Nhân",
  QI_REFINING = "Luyện Khí",
  FOUNDATION = "Trúc Cơ",
  GOLDEN_CORE = "Kim Đan",
  NASCENT_SOUL = "Nguyên Anh",
  SPIRIT_SEVERING = "Hóa Thần",
  VOID_REFINEMENT = "Luyện Hư",
  BODY_INTEGRATION = "Hợp Thể",
  GREAT_PERFECTION = "Đại Thừa",
  TRIBULATION = "Độ Kiếp",
}

export const REALM_STAGES: Record<Realm, number> = {
  [Realm.MORTAL]: 1,
  [Realm.QI_REFINING]: 13,
  [Realm.FOUNDATION]: 4,
  [Realm.GOLDEN_CORE]: 4,
  [Realm.NASCENT_SOUL]: 4,
  [Realm.SPIRIT_SEVERING]: 4,
  [Realm.VOID_REFINEMENT]: 4,
  [Realm.BODY_INTEGRATION]: 4,
  [Realm.GREAT_PERFECTION]: 4,
  [Realm.TRIBULATION]: 4,
};

export const REALM_ORDER = [
  Realm.MORTAL,
  Realm.QI_REFINING,
  Realm.FOUNDATION,
  Realm.GOLDEN_CORE,
  Realm.NASCENT_SOUL,
  Realm.SPIRIT_SEVERING,
  Realm.VOID_REFINEMENT,
  Realm.BODY_INTEGRATION,
  Realm.GREAT_PERFECTION,
  Realm.TRIBULATION
];

export const getNextStage = (realm: Realm, subRealm: number, hiddenPath: boolean = false): { realm: Realm, subRealm: number } | null => {
  const maxStages = REALM_STAGES[realm];
  
  if (realm === Realm.QI_REFINING && subRealm >= 10 && subRealm < 13 && !hiddenPath) {
    return { realm: Realm.FOUNDATION, subRealm: 1 };
  }

  if (subRealm < maxStages) {
    return { realm, subRealm: subRealm + 1 };
  } else {
    const currentIndex = REALM_ORDER.indexOf(realm);
    if (currentIndex < REALM_ORDER.length - 1) {
      return { realm: REALM_ORDER[currentIndex + 1], subRealm: 1 };
    }
  }
  return null;
};

export const getQiReq = (realm: Realm, subRealm: number): number => {
  const index = REALM_ORDER.indexOf(realm);
  let baseReq = 100; 
  
  for (let i = 1; i <= index; i++) {
    const prevRealm = REALM_ORDER[i-1];
    const prevMaxStages = REALM_STAGES[prevRealm];
    const prevMaxReq = baseReq * (1 + (prevMaxStages - 1) * 0.5);
    baseReq = Math.floor(prevMaxReq * 1.5);
  }

  return Math.floor(baseReq * (1 + (subRealm - 1) * 0.5));
};

export const getCultivationGain = (realm: Realm, subRealm: number): number => {
  const index = REALM_ORDER.indexOf(realm);
  const realmMultiplier = Math.pow(2.2, index);
  return Math.floor(realmMultiplier * 5 + (subRealm * 2));
};

export const getBreakthroughMultiplier = (currentRealm: Realm): number => {
  switch (currentRealm) {
    case Realm.MORTAL: return 2;
    case Realm.QI_REFINING: return 2;
    case Realm.FOUNDATION: return 3;
    case Realm.GOLDEN_CORE: return 4;
    case Realm.NASCENT_SOUL: return 5;
    case Realm.SPIRIT_SEVERING: return 6;
    case Realm.VOID_REFINEMENT: return 6.5; 
    case Realm.BODY_INTEGRATION: return 7;
    case Realm.GREAT_PERFECTION: return 8;
    default: return 1.5;
  }
};

export const getSubRealmLabel = (realm: Realm, subRealm: number): string => {
  if (realm === Realm.MORTAL) return "";
  if (realm === Realm.QI_REFINING) return `Tầng ${subRealm}`;
  
  const labels = ["Sơ kỳ", "Trung kỳ", "Hậu kỳ", "Đại viên mãn"];
  if (realm === Realm.TRIBULATION) {
    const tribLabels = ["Nhất cửu thiên kiếp", "Tam cửu thiên kiếp", "Lục cửu thiên kiếp", "Cửu cửu thiên kiếp"];
    return tribLabels[subRealm - 1] || `${subRealm} Kiếp`;
  }
  
  return labels[subRealm - 1] || `Tầng ${subRealm}`;
};

export const getBreakthroughChance = (realm: Realm, isMajor: boolean): number => {
  if (realm === Realm.MORTAL) return 0.95;
  if (isMajor) {
    switch (realm) {
      case Realm.QI_REFINING: return 0.8;
      case Realm.FOUNDATION: return 0.7;
      case Realm.GOLDEN_CORE: return 0.5;
      case Realm.NASCENT_SOUL: return 0.4;
      case Realm.SPIRIT_SEVERING: return 0.3;
      default: return 0.25;
    }
  } else {
    return 0.85 - (REALM_ORDER.indexOf(realm) * 0.05);
  }
};

export const getRequiredPill = (targetRealm: Realm): string | null => {
  switch (targetRealm) {
    case Realm.FOUNDATION: return "Trúc Cơ Đan";
    case Realm.GOLDEN_CORE: return "Kim Đan";
    case Realm.NASCENT_SOUL: return "Nguyên Anh Đan";
    case Realm.SPIRIT_SEVERING: return "Hóa Thần Đan";
    case Realm.VOID_REFINEMENT: return "Luyện Hư Đan";
    case Realm.BODY_INTEGRATION: return "Hợp Thể Đan";
    case Realm.GREAT_PERFECTION: return "Đại Thừa Đan";
    case Realm.TRIBULATION: return "Độ Kiếp Đan";
    default: return null;
  }
};
