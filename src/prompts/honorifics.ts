import { NPCPersonality } from '../types';
import { Realm } from '../engine/realmData';

export const REALM_ORDER: Realm[] = [
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

interface Honorifics {
  self: string;
  target: string;
}

/**
 * Determines how an NPC addresses the player
 * @param npcRealm The realm of the NPC
 * @param playerRealm The realm of the player
 * @param personality The personality of the NPC
 * @param npcGender The gender of the NPC
 * @param playerGender The gender of the player
 * @returns { self: string, target: string }
 */
export const getNPCHonorifics = (
  npcRealm: Realm,
  playerRealm: Realm,
  personality?: NPCPersonality,
  npcGender: 'male' | 'female' = 'male',
  playerGender: 'male' | 'female' = 'male'
): Honorifics => {
  const npcIdx = REALM_ORDER.indexOf(npcRealm);
  const playerIdx = REALM_ORDER.indexOf(playerRealm);
  const diff = npcIdx - playerIdx;

  // Default: Peer to Peer
  let self = npcGender === 'male' ? "Tại hạ" : "Tiểu nữ";
  let target = playerGender === 'male' ? "Đạo hữu" : "Tiên tử";

  // Arrogant/High Ambition or Ma Đạo (Morality < 30)
  const isArrogant = personality && (personality.ambition > 70 || personality.morality < 30);
  // Humble/Low Ambition or High Morality
  const isHumble = personality && (personality.ambition < 30 || personality.morality > 70);
  // Playful/Eccentric
  const isPlayful = personality && (personality.ambition > 50 && personality.morality > 40 && personality.morality < 60);

  if (diff > 0) {
    // NPC is higher realm (Senior)
    if (isArrogant) {
      if (npcIdx >= 4) {
        self = "Bản tọa";
      } else {
        self = npcGender === 'male' ? "Lão phu" : "Lão thân";
      }
      target = playerGender === 'male' ? "Tiểu tử" : "Nha đầu";
    } else {
      self = npcGender === 'male' ? "Tiền bối" : "Tiền bối";
      if (npcIdx >= 3) self = npcGender === 'male' ? "Bản chân nhân" : "Bản tiên tử";
      if (isPlayful && npcGender === 'female') self = "Tiểu tiên nữ";
      
      target = playerGender === 'male' ? "Tiểu hữu" : "Tiểu đạo hữu";
    }
    
    if (diff >= 2 && isArrogant) target = "Con sâu cái kiến";
  } else if (diff < 0) {
    // NPC is lower realm (Junior)
    if (isArrogant) {
      self = npcGender === 'male' ? "Ta" : "Bổn cô nương";
      target = playerGender === 'male' ? "Lão nhi" : "Lão bà"; 
    } else {
      if (npcGender === 'female') {
        self = isHumble ? "Nô gia" : "Thiếp thân";
      } else {
        self = "Vãn bối";
      }
      target = "Tiền bối";
    }
  } else {
    // Peer
    if (isArrogant) {
      self = npcGender === 'male' ? "Ta" : "Bổn cô nương";
      if (isPlayful && npcGender === 'female') self = "Tiểu tiên nữ";
      target = playerGender === 'male' ? "Ngươi" : "Ngươi";
    } else if (isHumble) {
      self = npcGender === 'male' ? "Tại hạ" : "Nô gia";
      target = playerGender === 'female' ? "Nương tử" : "Các hạ";
    } else if (isPlayful) {
      self = npcGender === 'female' ? "Thiếp thân" : "Tại hạ";
      target = playerGender === 'male' ? "Công tử" : "Tiên tử";
    }
  }

  return { self, target };
};

export const formatDialogue = (text: string, honorifics: Honorifics) => {
  return text
    .replace(/\{ta\}/gi, honorifics.self)
    .replace(/\{ngươi\}/gi, honorifics.target);
};

export const TALK_RULES = `
QUY TẮC ĐÀM THOẠI TU TIÊN:
1. Xưng hô phải phù hợp với cảnh giới và tính cách (NPC cao cảnh giới coi thường kẻ thấp, NPC đồng cảnh giới có thể là bằng hữu hoặc đối thủ).
2. Sử dụng đúng các đại từ nhân xưng: Tại Hạ, Tiền Bối, Vãn Bối, Bản Tọa, Đạo Hữu, Tiên Tử... dựa trên chênh lệch cảnh giới và nhân sinh quan.
3. Khi MC trò chuyện với NPC, AI sẽ tự động áp dụng các xưng hô chính xác bằng hàm getNPCHonorifics, bạn chỉ cần sử dụng các từ khóa {ta} và {ngươi} trong lời thoại, hệ thống sẽ tự thay thế bằng đại từ phù hợp.
`;
