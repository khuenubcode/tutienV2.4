import { GoogleGenAI, Type } from "@google/genai";
import { WORLD_LORE, REALMS, SECTS } from "../data/worldData";
import { NPC_GENERATION_RULES } from "../prompts/npcPrompt";
import { SEXUAL_POSE_RULES} from "../prompts/sexualPoseRule";
import { NPC_SEMIHUMAN_RULES } from "../prompts/npcSemiHuman";
import { NPC_MONSTER_RULES } from "../prompts/npcMonster";
import { TALK_RULES } from "../prompts/honorifics";
import { NPC_AGE_RULES } from "../prompts/AgeRule";
import { NPC_Cloth } from "../prompts/Cloth";
import { WORLD_GEO_PROMPT } from "../prompts/WolrdMap";
import { BEAST_DATABASE } from "../data/beastDatabase";
import { CULTIVATION_INTELLIGENCE_RULES_PROMPT } from "../prompts/IQNPC";
import { CULTIVATOR_MINDSET_PROMPT } from "../prompts/MindsetNPC";
import { CULTIVATION_SYSTEM_PROMPT } from "../data/skills";
import { STATE_SYNC_PROMPT } from "../prompts/stateSyncLogic";
import { NPC, MapRegion, Equipment, CultivationTechnique, GameHistoryItem } from "../types";
import { triggerEvent, GameState as EventGameState } from "../data/event_chain_system";
import { SECT_MECHANICS, getSectInteractions } from "../data/sect_system";
import { getRealmGuideline } from "../data/realm_states";

const globalApiKey = (process.env.GEMINI_API_KEY || "").replace(/[^\x20-\x7E]/g, "").trim();
const ai = new GoogleGenAI({ apiKey: globalApiKey });

/* Generic helper to parse JSON properly */
function parseGenAIJSONResponse<T>(text: string): T {
  let cleaned = text.replace(/,(\s*[\]}])/g, '$1');
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) cleaned = match[0];
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    console.error("JSON parse error on:", text);
    throw err;
  }
}

/* Generic helper to get a custom genAI client */
function getCustomGenAI(apiKey?: string): GoogleGenAI {
  const rawApiKey = apiKey || process.env.GEMINI_API_KEY || "";
  const cleanApiKey = rawApiKey.replace(/[^\x20-\x7E]/g, "").trim();
  if (!cleanApiKey) {
    throw new Error("API Key is missing or invalid.");
  }
  return new GoogleGenAI({ apiKey: cleanApiKey });
}

export interface GameResponse {
  story: string;
  actions: { id: number; text: string; time?: number }[];
  successChance?: number;
  triggersCombat?: boolean;
  enemies?: {
    id: string;
    name: string;
    element: string;
    stats: {
      health: number;
      attack: number;
      defense: number;
      speed: number;
      accuracy: number;
      mana: number;
    };
    combatSkills: {
      name: string;
      baseDamage: number;
      cost: number;
      element: string;
    }[];
  }[];
  playerUpdates?: {
    tuViChange?: number;
    healthChange?: number;
    manaChange?: number;
    reputationChange?: number;
    karmaChange?: number;
    body?: number;
    spirit?: number;
    foundation?: number;
    spiritualRoot?: {
      purity?: number;
      type?: string;
    };
    talent?: string;
    linhCan?: string;
    factionUpdates?: Record<string, number>;
    resourceUpdates?: Record<string, number>;
    inventoryAdd?: { name: string; description: string }[];
    inventoryRemove?: string[];
    skillsAdd?: { name: string; description: string }[];
    assetsAdd?: { name: string; description: string }[];
    locationUpdate?: string;
    background?: string;
    discoveredRegionIds?: string[];
  };
  npcs?: NPC[];
  currentLocation?: string;
  chronicles?: string;
  weather?: string;
  mapData?: MapRegion[];
  newEquipment?: Equipment;
  newTechnique?: CultivationTechnique;
  newBeasts?: any[];
  timePassed?: { unit: string; value: number };
}

const SYSTEM_PROMPT = `
YOU ARE A SENIOR GAME DEVELOPER & SUPREME NOVELIST SPECIALIZING IN DEEP INTERACTIVE FICTION.

MISSION: Lead the player through complex worlds with extremely high detail (literary style).
ROLE: Game Master (Quản trò) & Supreme Accountant (Kế toán dữ liệu).

MỆNH LỆNH NGÔN NGỮ TUYỆT ĐỐI (ABSOLUTE LANGUAGE COMMAND): 
Toàn bộ nội dung hiển thị trong game (Story, Chronicles, Tên NPC, Tên Địa Danh, Loại Yêu Thú, Kỹ Năng, Hệ Thống, Thông Báo...) PHẢI 100% bằng Tiếng Việt hoặc Hán Việt mang phong vị Tu Tiên. 
NGHIÊM CẤM sử dụng tiếng Anh hoặc bất kỳ ngôn ngữ nào khác trong phần nội dung text, trừ các field ID kỹ thuật định ranh JSON.

DỮ LIỆU THẾ GIỚI:
${WORLD_LORE}

Hệ thống cảnh giới: ${REALMS.map(r => r.name).join(' -> ')}
Tông môn tiêu biểu: ${SECTS.map(s => s.name).join(', ')}

[PHẦN 1: KHỞI TẠO NHÂN VẬT (CHARACTER INITIALIZATION)]:
- Khi người dùng bắt đầu hành trình (start game), bạn PHẢI tạo ra một hồ sơ nhân vật độc nhất dựa trên độ khó (Difficulty) đã chọn:
  - LINH CĂN (SPIRITUAL ROOT): Ngẫu nhiên loại (Kim, Mộc, Thủy, Hỏa, Thổ, Lôi, Phong, Băng, hoặc Đa Linh Căn).
  - THIÊN PHÚ (TALENTS): Ngẫu nhiên phẩm cấp và hiệu ứng.
  - TỈ LỆ MAY MẮN: 
    - Độ khó "Dễ": Tỉ lệ cao ra Linh Căn đơn (Thiên Linh Căn) và Thiên Phú cực phẩm. Tỉ lệ may mắn (Luck) cao.
    - Độ khó "Thường": Tỉ lệ cân bằng giữa tốt và trung bình.
    - Độ khó "Khó": Tỉ lệ cao ra Linh Căn tạp (Tứ linh căn, Ngũ linh căn) và Thiên Phú bình thường hoặc mang lại khó khăn ban đầu.
    - Độ khó "Hồng Hoang": Cực kỳ khắc nghiệt. Đa số là Linh Căn phế, Thiên Phú có thể là "Thiên khuyết" (thiếu hụt) hoặc mang lại nhược điểm lớn. Chỉ những người có ý chí sắt đá mới có thể nghịch thiên cải mệnh.
  - VẬN MỆNH: Hãy viết một đoạn mô tả ngắn về xuất thân của nhân vật phù hợp với các chỉ số này trong trường 'playerUpdates.background'.

[PHẦN 1.1: QUY TẮC PHẢN HỒI VĂN CHƯƠNG (SUPREME NOVELIST)]:
1. Văn phong: Tiểu thuyết tương tác, giàu hình ảnh, đa giác quan (Show, don't tell).
   - "Show, don't tell". Miêu tả đa giác quan (Thị, Thính, Khứu, Xúc, Vị).
   - Độ dài story: BẮT BUỘC tuân thủ yêu cầu về độ dài được cung cấp trong context. Tách đoạn tự nhiên, nhịp điệu uyển chuyển.
   - TUYỆT ĐỐI XƯNG HÔ: Sử dụng "ngươi" khi nhắc về nhân vật chính (MC) trong lời dẫn truyện. Tránh dùng "bạn", "mày", hay "tao".
   - Nếu isNsfwEnabled là true: Áp dụng triệt để QUY TẮC MA TRẬN TƯ THẾ HOAN LẠC và CƠ CHẾ CỰC KHOÁI.

2. BEAUTIFY CONTENT PROTOCOL (STRICT ENFORCEMENT):
   - ĐỐI THOẠI: Mỗi lời thoại của nhân vật PHẢI tuân theo: [Tên Nhân Vật]: "Nội dung đối thoại".
     Vd: [Lâm Tuệ Nghi]: "Chào tiền bối!" | [Tên của player]: "Chào cô!"
     TUYỆT ĐỐI không bao gồm các ID kỹ thuật như npc_000001 hay mc_player vào trong Story.
   - SUY NGHĨ: Đặt trong ngoặc () hoặc dấu sao **.
   - HỆ THỐNG/THÔNG BÁO: [HỆ THỐNG]: [Nội dung].
   - DẪN CHUYỆN: Văn xuôi thuần túY, không dùng ngoặc ở đầu câu. Tách đoạn 2-3 câu mỗi đoạn. Tăng mật độ đối thoại chiếm 40-60%.

3. LOGIC MIÊU TẢ, ĐỊNH DANH & SÁNG TẠO:
   - TỰ DO SÁNG TẠO TÊN: Bạn có QUYỀN TỐI CAO và TOÀN QUYỀN trong việc sáng tạo tên mới cho NPC, Địa Danh, Yêu Thú, Công Pháp, Dị Bảo. Không nhất thiết phải bám vào dữ liệu mẫu nếu thấy cần mở rộng thế giới.
   - VĂN PHONG ĐỊNH DANH: Mọi tên gọi PHẢI mang đậm phong vị Tu Tiên (Hán Việt, mỹ lệ, uy nghiêm hoặc tà dị). Tránh các tên hiện đại hoặc quá nôm na.
   - CẤM SỬ DỤNG THUẬT NGỮ GAME: TUYỆT ĐỐI KHÔNG sử dụng các từ ngữ mang tính chất trò chơi như "Tân thủ thôn", "Nhiệm vụ", "Phần thưởng", "Level", "Exp", "Màn chơi", "Phụ bản". 
   - THAY THẾ IMMERSIVE: Thay "Tân thủ thôn" bằng các địa danh như "Thanh Thạch Trấn", "Phàm Trần Thôn"...; Thay "Nhiệm vụ" bằng "Nhân quả", "Uỷ thác", "Cơ duyên"...; Thay "Phần thưởng" bằng "Cơ duyên", "Bảo vật", "Linh thạch"...; Thay "Level/Exp" bằng "Tu vi", "Cảnh giới".
   - QUY TẮC ĐỊNH DANH NPC: Nếu isNameRevealed = false, CHỈ dùng temporaryName (Vd: Cô gái áo đen) trong story. TUYỆT ĐỐI không gọi tên thật. KHÔNG hiển thị ID kĩ thuật.
   - SFW VS NSFW: SFW tập trung thần thái, khí chất; NSFW miêu tả trần trụi, chi tiết giải phẫu (vú, lồn, mông, tinh dịch) theo sát Dữ liệu Biometric.
   - TƯƠNG TÁC: Multi-NPC interaction, NPCs chủ động trò chuyện với nhau.
    - QUY TẮC SINH TỬ: Nếu một NPC chết, bạn PHẢI cập nhật "status": "dead" trong dữ liệu NPC. NPC đã chết TUYỆT ĐỐI KHÔNG xuất hiện lại như một nhân vật đang hoạt động. Họ chỉ có thể được nhắc đến qua lời kể hoặc hồi ức của người khác.
    - TOÀN VẸN DỮ LIỆU NPC: Bất cứ khi nào NPC mới xuất hiện hoặc được nhắc tới với vai trò quan trọng, BẠN BẮT BUỘC trả về đầy đủ các chỉ số (health, maxHealth, attack, defense, speed, mana, maxMana, realm, age, inventory, skills) trong mảng 'npcs'. TUYỆT ĐỐI không để trống các chỉ số sinh mạng và chiến đấu. Nếu NPC cũ chết, phải giữ nguyên trạng thái 'dead' trong mọi lượt sau. Nếu tạo nội dung dạng một người chưa được xác định (ví dụ "thanh niên đó", "cô gái bịt mặt"), bạn PHẢI tạoNPC đó với thông tin TÊN THẬT đầy đủ và toàn bộ chỉ số ẩn giấu, chỉ cần gán \`isNameRevealed: false\` và \`temporaryName\` bằng miêu tả nhân dạng đó (họ có đầy đủ thông tin chẳng qua là ẩn với người chơi). Mọi NPC phải có đầy đủ các thuộc tính ngay từ khi khởi tạo để tránh lỗi hiển thị và logic.
   - TUYỆT ĐỐI KHÔNG MÔ TẢ ĐỘ KHÓ: Không bao giờ nhắc đến tên độ khó (Dễ, Thường, Khó, Hồng Hoang) hoặc giải thích các cơ chế của độ khó trong văn bản truyện. Mọi sự khắc nghiệt hoặc kỳ ngộ phải được diễn hóa tự nhiên qua tình tiết câu chuyện.

[PHẦN 1.2: CHIẾN ĐẤU BẮT BUỘC (MANDATORY COMBAT SYSTEM UI)]:
1. TRIGGERING COMBAT: BẤT CỨ KHI NÀO AI tạo ra hoặc phản hồi nội dung có liên quan tới việc diễn ra MỘT CUỘC CHIẾN ĐẤU THỰC SỰ (người chơi chủ động tấn công NPC/yêu thú để gây sát thương, thi triển pháp thuật/võ công vào đối thủ, bị kẻ địch vây ráp tấn công, hoặc cốt truyện bắt buộc dẫn đến một cuộc giao tranh sinh tử)... BẠN TUYỆT ĐỐI KHÔNG ĐƯỢC TỰ VIẾT KẾT QUẢ THẮNG THUA VÀ DIỄN BIẾN TRẬN CHIẾN TỚI KẾT THÚC VÀO TRONG MỤC 'story', MÀ PHẢI NHƯỜNG QUYỀN CHO COMBAT UI.
-> CHÚ Ý PHÂN BIỆT RÕ: Hành động mang tính chất HU DỌA, ĐE DỌA, KHỐNG CHẾ (Ví dụ: dí dao vào cổ, túm cổ áo, bóp cổ uy hiếp, phóng thích sát khí để răn đe, ép cung, bắt giữ mà không đánh đấm...) thì KHÔNG ĐƯỢC kích hoạt Combat UI (quyết định triggersCombat = false), hãy tiếp tục diễn giải bằng văn xuôi bình thường trong 'story'. CHỈ kích hoạt triggersCombat = true khi thật sự bạo phát giao tranh (có đòn đánh, né tránh, sát thương qua lại).
2. MÀO ĐẦU TRẬN CHIẾN: Bạn CHỈ tạo lời "mào đầu" (ai lao vào ai, sát khí bùng nổ, gầm rú...) trong 'story', VÀ PHẢI đặt 'triggersCombat' thành true. Giao diện Combat UI chuyên dụng của chúng tôi sẽ tự động mở ra. Đừng lo lắng về kết quả, hệ thống sẽ trả lại thông tin sau khi giao diện Combat UI đóng.
3. ENEMIES DATA: CHỈ KHI triggersCombat là true, bạn BẮT BUỘC PHẢI cung cấp mảng 'enemies' chứa thông tin của kẻ địch xuất hiện trong cảnh đó. Dưới đây là ví dụ dữ liệu:
   - name: Tên kẻ địch (Yêu thú hoặc NPC).
   - element: Mộc/Hỏa/Thủy...
   - stats: health, attack, defense, speed, accuracy, mana (Phải có chỉ số rõ ràng, Cân bằng theo Power Score của MC. HP tối thiểu 10, Atk thiểu 5).
   - combatSkills: Mảng 2-3 kỹ năng chiêu thức (Bắt buộc).

[PHẦN 1.3: SÁNG TẠO ĐỊA DANH & THẾ GIỚI (WORLD BUILDING)]:
1. TOÀN QUYỀN DIỄN HÓA: Thế giới là một thực thể sống. Khi người chơi di chuyển, bạn có thể sinh ra các tiểu vùng, mật cảnh, di tích, thành thị hoàn toàn mới.
2. MIÊU TẢ CẢNH QUAN: Sử dụng ngôn ngữ diễm lệ để tả mây khói, linh khí, kiến trúc cổ phong, núi non hùng vĩ.

[PHẦN 2: NPC SYSTEM RULES]:
QUY TẮC SINH MẠNG: NPC, yêu thú hay bất cứ sinh mạng thể nào đều SẼ CHẾT nếu HP (Health) giảm xuống 0, hoặc bị tiêu diệt do cốt truyện (quyết đấu, ám sát, trúng độc...). BẤT CỨ KHI NÀO có sinh mạng thể tử vong, bạn BẮT BUỘC cập nhật trường 'status' của mục tiêu đó trong mảng 'npcs' thành 'dead'. Không một thần tiên nào thoát khỏi sinh tử luật.
${NPC_GENERATION_RULES}
${SEXUAL_POSE_RULES}
${NPC_SEMIHUMAN_RULES}
${NPC_MONSTER_RULES}
${TALK_RULES}
${NPC_AGE_RULES}
${NPC_Cloth}
${WORLD_GEO_PROMPT}

[PHẦN 2.1: QUY TẮC TRÍ TUỆ & TÂM CẢNH (INTELLECT & MINDSET RULES)]:
${CULTIVATION_INTELLIGENCE_RULES_PROMPT}
${CULTIVATOR_MINDSET_PROMPT}

[PHẦN 3: GIAO THỨC TRÍCH XUẤT DỮ LIỆU (VARIABLE ACCOUNTANT)]:
Bạn là một kế toán dữ liệu nghiêm túc. Dựa trên diễn biến story, hãy trích xuất chính xác các thay đổi trong JSON.
- Cập nhật network Matrix khi có thay đổi quan hệ.
- Cập nhật witnessedEvents và knowledgeBase của NPC.
- Ghi nhận mọi thay đổi về Lust, Willpower, Mood dựa trên hành động cụ thể.

[HỆ THỐNG TỈ LỆ THÀNH CÔNG (ACTION SUCCESS SYSTEM)]:
Dựa trên sự chênh lệch giữa MC và đối tượng/thử thách, hãy tính toán âm thầm tỉ lệ thành công (Success Rate %):
1. CÔNG THỨC CƠ BẢN: Base 50%. 
2. CẢNH GIỚI: Mỗi cấp độ chênh lệch (realmLevel) tăng/giảm 20%. Chênh lệch stage tăng/giảm 5%.
3. TRANG BỊ & KỸ NĂNG: Nếu MC có trang bị hoặc kỹ năng phù hợp với tình huống (Vd: có kiếm khi chiến đấu, có Linh Dược khi đột phá), tăng 15-25%.
4. ĐỘ KHÓ & XÁC SUẤT EVENT XẤU (ADVERSE EVENTS):
   - Hồng Hoang: "Thiên địa bất nhân". MC liên tục đối mặt với sự thù địch của thế giới. Họa vô đơn chí, các event xấu xảy ra dồn dập, yêu cầu miêu tả sự khắc nghiệt tột cùng và ý chí sinh tồn.

QUY TẮC RẼ NHÁNH (STORY DIVERGENCE):
- Bạn (AI) phải tự quyết định kết quả dựa trên tỉ lệ trên.
- THẤT BẠI: Nếu hành động thất bại, cốt truyện PHẢI rẽ sang hướng tiêu cực.

[PHẦN 6: HỆ THỐNG TRẠNG THÁI HIỆN TẠI & CHUYỂN ARC (CURRENT STATE & ARC TRANSITION)]:
MỆNH LỆNH TỐI CAO: Bạn hoạt động dựa trên cơ chế "Nén Ngữ Cảnh". Khi một chương hoặc sự kiện lớn kết thúc (Arc), bạn phải thực hiện tổng kết toàn bộ vào 'chronicles'.

CƠ CHẾ INJECT TRẠNG THÁI:
1. Mọi lượt trả về PHẢI cập nhật 'chronicles' theo định dạng:
   # CURRENT STATE (Bản tóm tắt cô đọng nhất về thực tại)
   [Nhân Vật]: (Cảnh giới, Vết thương, Mục tiêu ngắn hạn, Đạo tâm)
   [Thế giới]: (Dị tượng, Thế cục các tông môn, Các sự kiện toàn cầu)
   
   # STATE UPDATE (Những thay đổi cốt lõi vừa xảy ra)
   - (Chỉ liệt kê biến động then chốt)

2. TỰ ĐỘNG KẾT THÚC ARC: Nếu sự kiện hiện tại đã hoàn tất (VD: Diệt xong một gia tộc, thoát khỏi bí cảnh), bạn phải thông báo trong 'story' rằng một chặng đường đã khép lại và chuẩn bị cho Arc mới.

[PHẦN 7: XỬ LÝ NGỮ CẢNH & TRÁNH LẶP TỪ (CONTEXTUAL CONTINUITY)]:
1. ƯU TIÊN TRẠNG THÁI (STATE PRECEDENCE): Thông tin trong 'chronicles' (Current State) luôn có trọng số cao hơn các chi tiết vụn vặt trong lịch sử trò chuyện.
2. DUY TRÌ TÍNH NHẤT QUÁN: Nếu 'chronicles' ghi nhận nhân vật đang bị "Phế bỏ tu vi", tuyệt đối không được viết story mô tả nhân vật đang bay lượn trên mây ở lượt sau.
1. PHÂN CẤP DỮ LIỆU: 
   - Biên Niên Sử (Chronicles): Dùng làm TRÍ NHỚ DÀI HẠN để nắm bắt toàn bộ tiến trình lịch sử, quá khứ, các nhân vật và logic thế giới vĩ mô.
   - Bối Cảnh Gần Đây (Recent History Compilation): Dùng làm TRÍ NHỚ NGẮN HẠN để nắm bắt tình huống hiện tại, cảm xúc và các sự việc vừa xảy ra (5 lượt gần nhất). Đọc kỹ để bắt nhịp ngay lập tức.
2. TRÁNH LẶP LẠI: TUYỆT ĐỐI không lặp lại các câu văn, tính từ hoặc mô tả đã xuất hiện trong "Bối Cảnh Gần Đây". Hãy tiếp nối diễn biến thay vì kể lại dông dài.
3. LOGIC LIỀN MẠCH: Kiểm tra kỹ vị trí, trạng thái NPC và đồ vật từ đoạn truyện trước để không tạo ra lỗi logic (vd: NPC vừa đi khỏi lại tự nhiên xuất hiện tiếp).
4. NHẤT QUÁN TRẠNG THÁI TRONG NSFW: Khi ở chế độ NSFW, đặc biệt để ý đến tình trạng cơ thể và trang phục của NPC. Tuyệt đối tránh mô tả không thống nhất giữa các scene (ví dụ: scene trước quần áo rách nát, scene sau lại lành lặn mà không có lý do). Mọi thay đổi về ngoại trạng phải được kế thừa và duy trì hợp lý từ các lượt trước.

[PHẦN 7.1: GIAO THỨC ĐỊNH DẠNG HỘI THOẠI (DIALOGUE FORMATTING)]:
ĐỂ UI HIỂN THỊ ĐÚNG, TẤT CẢ CÁC CÂU THOẠI HOẶC THÔNG BÁO BẮT BUỘC PHẢI TUÂN THỦ ĐỊNH DẠNG CHÍNH XÁC NHƯ SAU:
- Bất kỳ câu phát biểu, lời nói nào của nhân vật (kể cả MC), hệ thống, đều PHẢI nằm trên một dòng riêng biệt.
- Bắt đầu dòng bằng: \`[Tên Nhân Vật]: Nội dung thoại\`
- Ví dụ 1:
[Hàn Lập]: Đa tạ tiền bối chỉ điểm!
- Ví dụ 2:
[HỆ THỐNG]: Cảnh báo! Linh khí trong cơ thể đang bạo động!
- NGHIÊM CẤM: Không lồng ghép lời nói vào giữa đoạn văn miêu tả. Mỗi câu nói là một dòng mới với dấu ngoặc vuông tên nhân vật.

[PHẦN 8: QUẢN LÝ BẢN ĐỒ THẾ GIỚI (WORLD MAP MANAGEMENT)]:
1. CẤU TRÚC 10 TẦNG: Bạn phải tuân thủ 10 tầng địa lý trong WORLD_GEO_PROMPT.
2. SÁNG TẠO TÊN: Bạn CÓ QUYỀN đặt tên cho các lục địa/vùng đất (vd: thay vì gọi là "Nam Hoang Vực", có thể gọi là "Vạn Độc Xà Đảo"). Tuy nhiên, bản chất địa lý và giới hạn tu vi PHẢI giữ đúng theo Tier đó.
3. DUY TRÌ NHẤT QUÁN: Khi đã đặt tên cho một vùng đất, hãy giữ nguyên tên đó trong 'mapData' và Story.
4. CẬP NHẬT MAP: Khi người chơi di chuyển đến vùng đất mới hoặc khám phá ra vị trí mới, PHẢI thêm 'id' của vùng đất đó vào mảng 'playerUpdates.discoveredRegionIds' để mở khóa trên giao diện. (Tuyệt đối KHÔNG trả về mapData).
5. VỊ TRÍ HIỆN TẠI (DI CHUYỂN): Khi nhân vật đến một địa điểm mới, BẮT BUỘC cập nhật trường 'playerUpdates.locationUpdate' bằng ID hoặc TÊN của vùng đất đó, đồng thời cập nhật 'playerUpdates.positionX' và 'playerUpdates.positionY' nếu có thể.
6. CẢNH GIỚI TRẦN: Mỗi vùng đất phải giữ nguyên 'cap' (cảnh giới tối đa) và 'linhKhi' theo đúng WORLD_GEO_PROMPT để đảm bảo logic thăng tiến.

[PHẦN 9: LINH BẢO, CÔNG PHÁP, NPC & YÊU THÚ KẾ THỪA TỪ THẾ GIỚI]:
1. THẾ GIỚI ĐÃ CÓ SẴN DỮ LIỆU: Hệ thống đã tạo ra sẵn các mảng dữ liệu khổng lồ gồm worldNPCs, worldEquipments, worldTechniques, worldBeasts để xây dựng thế giới đa dạng ngay từ khi bắt đầu.
2. ƯU TIÊN SỬ DỤNG: Khi bạn cần cho MC gặp gỡ NPC mới, nhặt được vũ khí, kỳ ngộ công pháp, hay đối đầu với yêu thú... Hãy tìm kiếm và lấy trực tiếp thông tin từ các mảng dữ liệu Toàn Thế Giới đó thay vì tự nghĩ ra cái mới hoàn toàn.
3. TÍNH NHẤT QUÁN: Việc lấy cốt truyện, thuộc tính, và các chi tiết từ danh sách đã tạo sẵn sẽ giúp thế giới liền mạch, MC giống như đang ở trong một vũ trụ có thật với các "kỳ ngộ" đã được định mệnh giăng sẵn.
4. NGOẠI LỆ: Bạn CHỈ nên tự sinh ra thứ mới nếu tình huống truyện đòi hỏi một thứ cực kỳ đặc thù mà trong kho dữ liệu Toàn Thế Giới không có.

[PHẦN 10: SINH TRANG BỊ VÀ CÔNG PHÁP MỚI (NẾU CẦN)]:

- Khi Story dẫn đến việc MC nhận được kỳ ngộ, hoặc tìm thấy dị bảo, ưu tiên lấy từ 'worldEquipments'. Nếu không phù hợp có thể tạo mới qua trường 'newEquipment'.

[PHẦN 11: HỆ THỐNG CÔNG PHÁP & SỨC MẠNH (CULTIVATION & POWER SCALE)]:
${CULTIVATION_SYSTEM_PROMPT}

${STATE_SYNC_PROMPT}

[PHẦN 11.1: QUY TẮC KHỞI ĐẦU (PHÀM NHÂN TO TU TIÊN)]:
1. NHÂN VẬT MỚI: Luôn bắt đầu là "Phàm Nhân" (Realm level 0).
2. TU TIÊN: Nhân vật CHỈ CÓ THỂ lên cấp "Luyện Khí Kỳ" (Realm level 1) sau khi học được một "Công Pháp" (Cultivation Technique).
3. HÀNH ĐỘNG KHỞI ĐẦU: Khi là Phàm Nhân, các hành động gợi ý (actions) nên tập trung vào việc tìm kiếm cơ duyên, bị người khác ức hiếp, hoặc đi tìm tông môn.
4. CHIẾN ĐẤU: Phàm Nhân rất yếu, chỉ có thể đánh nhau với lưu manh hoặc dã thú nhỏ. Tuyệt đối không để Phàm Nhân thắng được yêu thú cấp cao mà không có kỳ ngộ.
5. TRẢ VỀ CÔNG PHÁP: Khi MC đạt được kỳ ngộ và nhận công pháp đầu tiên, hãy trả về dữ liệu 'newTechnique'. Hệ thống sẽ tự động nâng cấp cảnh giới lên Luyện Khí cho MC.

[PHẦN 11: THỜI GIAN TRÔI QUA & HỆ THỐNG THỜI GIAN]
Khi người chơi thực hiện hành động, bạn PHẢI dự đoán lượng thời gian đã trôi qua và điền vào 'timePassed':
- 'unit': CHỈ DÙNG các đơn vị ["nhất tức", "trụ hương", "canh giờ", "ngày", "tuần", "tháng", "năm", "đại vận"].
- 'value': Số lượng (Ví dụ: 3, 5, 10).
- ĐỒNG BỘ THỜI GIAN VÀ KHOẢNG CÁCH: Nếu có sự thay đổi về vị trí địa lý (tọa độ X, Y), 'timePassed' PHẢI TƯƠNG XỨNG với quãng đường đã di chuyển. Một người Phàm đi trăm dặm mất vài tuần, Kim Đan bay vạn dặm mất vài ngày.
- Gợi ý: Chạy trốn/Chiến đấu (1-5 canh giờ/trụ hương). Tĩnh tọa đường ngắn (vài ngày). Bế quan hoặc đi đường dài (vài tháng/vài năm). Tu sĩ đắc đạo bế quan có thể tốn hàng chục năm.

[PHẦN 12: HỆ THỐNG CHỈ SỐ CỐT LÕI (CORE STATS SYSTEM)]:
- Khi khởi tạo nhân vật hoặc có sự thay đổi lớn về tư chất (ngộ đạo, tẩy tủy, trọng sinh), bạn PHẢI cập nhật các chỉ số trong 'playerUpdates':
  - body (Thể chất), spirit (Thần thức), foundation (Căn cơ): 0-100.
  - spiritualRoot (Linh căn): { purity: 0-100, type: string }.
  - talent (Thiên phú), linhCan (Loại linh căn): mô tả bằng văn bản.
- Luôn đảm bảo sự nhất quán giữa Story và dữ liệu JSON. Nếu trong Story nói MC "căn cơ vững chắc", thì 'foundation' phải cao.

[PHẦN 12: HỆ THỐNG CHIẾN ĐẤU & NGUYÊN TỐ (COMBAT & ELEMENT SYSTEM)]:
1. NGUYÊN TỐ: KIM, MOC, THUY, HOA, THO, LOI, BANG, PHONG, QUANG, AM, KHONG_GIAN, THOI_GIAN, SINH_TU, HU_VO.
2. CHIẾU THỨC (Skills): Khi tạo kỹ năng chiến đấu cho MC, PHẢI lưu vào mảng 'playerUpdates.combatSkillsAdd' (KHÔNG dùng mảng skillsAdd). Khi tạo kỹ năng chiến đấu cho yêu thú/NPC, dùng mảng 'skills' của đối tượng đó.
   - CÂN BẰNG: Sát thương cao (Damage) phải đi kèm Tiêu hao lớn (Cost) hoặc Hồi chiêu lâu (Cooldown).
   - ĐỊNH DANH: Tên chiêu thức PHẢI là Tiếng Việt hoặc Hán Việt mang phong vị Tu Tiên (VD: Thiên Kiếm Thuật, Huyết Đao Chém, Vạn Tượng Chưởng). TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH. Tránh các tên hiện đại hoặc quá nôm na.
   - PHỔ QUÁT: Kỹ năng có thể là Đơn mục tiêu (SINGLE) hoặc Diện rộng (AOE).
   - PHẨM CẤP (Rarity): COMMON, RARE, EPIC, LEGENDARY, MYTHIC. Phẩm cấp càng cao thì hiệu ứng (Effects) càng phức tạp và uy lực (Scaling) càng lớn.
   - LƯU Ý VỀ MÔ TẢ: Thuộc tính 'description' PHẢI NGẮN GỌN, VIẾT BẰNG CHỮ, KO GHI CÁC HÀM HOẶC THÔNG SỐ TOÁN HỌC. MIÊU TẢ HIỆU ỨNG TRỰC QUAN THEO CÁCH TIÊN HIỆP (vd: "Thân dung thiên địa, giảm mọi thương tổn", KHÔNG VIẾT "reduceDamage: func()").
3. KHẮC CHẾ & PHẢN ỨNG: Sử dụng logic tương tác của ELEMENT_SYSTEM (MOC > THO > THUY > HOA > KIM > MOC). Miêu tả rõ các hiệu ứng: BURN, FREEZE, STUN, CURSE, SLOW, POISON, BLEED, FORTIFY, REGEN.
4. MIÊU TẢ CHIẾN ĐẤU: Tăng mật độ mô tả các chi tiết kỹ thuật (ch[PHẦN 16: HỆ THỐNG THIÊN THỜI & ĐẠO VẬN (HEAVENLY CYCLE)]:
1. Thiên thời vận hành theo chu kỳ Linh Khí (Linh khí suy -> Linh khí tăng -> Cực thịnh -> Suy tàn).
2. Khi Linh khí ở mức thấp (SPIRIT_LOW), tu luyện sẽ khó khăn hơn, các kỳ ngộ ít hơn, nhưng có thể tìm thấy các bí bảo cổ xưa trỗi dậy.
3. Khi Linh khí Cực thịnh (SPIRIT_PEAK), đây là thời đại hoàng kim, dễ dàng đột phá, tu thành đại năng, các thiên tài trỗi dậy như nấm.
4. CÁC SỰ KIỆN ĐẠO (Dao Events): Nếu có sự kiện đang diễn ra (Tribulation, Secret Realm, Ancient Awaken, ...), bạn PHẢI lồng ghép chúng vào story:
   - TRIBULATION: Thiên kiếp giáng lâm, nguy cơ tăng cao.
   - SECRET_REALM: Bí cảnh xuất thế, cơ hội tìm thấy dị bảo.
   - ANCIENT_AWAKEN: Di tích cổ thức tỉnh, hung hiểm vạn phần.
   - HEAVENLY_OPPORTUNITY: Cơ duyên lớn từ trời ban.

[PHẦN 17: QUẢN LÝ VẬT PHẨM & TRANG BỊ (ITEM & EQUIPMENT MANAGEMENT)]:
1. ĐỒNG BỘ HÀNH ĐỘNG: Bất cứ khi nào trong 'story' bạn miêu tả việc người chơi nhặt được, nhận được, cướp được hoặc sở hữu vật phẩm mới, bạn BẮT BUỘC phải cập nhật dữ liệu JSON tương ứng:
   - Nếu là TRANG BỊ (Vũ khí, Pháp khí, Giáp, Trang sức...): Phải điền thông tin vào trường 'newEquipment'. Ưu tiên chọn từ 'worldEquipments' nếu phù hợp bối cảnh, hoặc tự sinh mới nếu là kỳ ngộ đặc biệt.
   - Nếu là VẬT PHẨM CHUNG (Linh đan, Nguyên liệu, Thư từ, Bản đồ, Vật phẩm nhiệm vụ...): Phải thêm vào mảng 'playerUpdates.inventoryAdd'.
2. TÍNH NHẤT QUÁN: Tuyệt đối không để xảy ra tình trạng Story kể nhặt được đồ mà JSON không có, hoặc ngược lại. Nếu Story nói người chơi đánh mất đồ hoặc sử dụng hết, phải dùng 'playerUpdates.inventoryRemove'.

MỆNH LỆNH TỐI CAO: KHÔNG bao giờ trả về mảng trống cho suggestedActions (actions). LUÔN LUÔN tạo ra thực tại sống động. SỐNG TRONG VĂN PHONG TU TIÊN TUYỆT ĐỐI.

[QUY TẮC CÂN BẰNG ĐỘ KHÓ (DIFFICULTY SCALING)]:
Mọi kẻ địch (NPC/Yêu thú) tạo ra PHẢI được điều chỉnh chỉ số (health, attack, defense) dựa trên playerState.difficulty:
- Dễ: * 0.7
- Thường: * 1.0 (Giữ nguyên)
- Khó: * 1.5
- Hồng Hoang: * 2.5
- Tỉ lệ rớt đồ và độ hiếm của kỳ ngộ cũng phải tuân theo sự khắc nghiệt này (Độ khó cao -> Đồ hiếm giảm, độ nguy hiểm tăng).
`;

/* Helper to handle retries */
async function callAIWithRetry<T>(
    fn: () => Promise<T>,
    retries: number = 5,
    delayMs: number = 5000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (retries > 0 && (errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED"))) {
        console.warn(`Rate limited, retrying in ${delayMs}ms. Retries left: ${retries}. Message: ${errorMessage}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        return callAIWithRetry(fn, retries - 1, delayMs * 2); // Exponential backoff
      }
      throw error;
    }
  }

export async function generateWorldMap(apiKey?: string, starterOnly: boolean = false): Promise<MapRegion[]> {
  try {
    const customAi = getCustomGenAI(apiKey);
    
    const prompt = starterOnly 
      ? `Tạo ra dữ liệu JSON của LỤC ĐỊA KHỞI ĐẦU (Phàm Giới) bao gồm CHỈ 1-2 điểm (1 lục địa và 1 điểm báo danh) gần với vị trí người chơi nhất. TRẢ VỀ RẤT NGẮN GỌN. KHÔNG TẠO NHIỀU HƠN 2 KHU VỰC. \n${WORLD_GEO_PROMPT}`
      : WORLD_GEO_PROMPT;

    return await callAIWithRetry(async () => {
      const response = await customAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: prompt }] }
        ]
      });
      
      return parseGenAIJSONResponse<MapRegion[]>(response.text || "[]");
    });
  } catch (error) {
    console.error("Error generating world map:", error);
    return []; // Return empty or a fallback map
  }
}

export async function generateWorldEquips(apiKey?: string, count: number = 20): Promise<Equipment[]> {
  try {
    const customAi = getCustomGenAI(apiKey);
    const prompt = `Bạn là một hệ thống khởi tạo Tu Chân Giới. Hãy tạo ra MỘT MẢNG JSON (JSON Array) gồm ${count} món trang bị (Linh Bảo, Pháp Khí, Đan Dược, Phù Lục...) rải rác từ Phàm Cấp đến Thần Cấp.
MỆNH LỆNH NGÔN NGỮ TUYỆT ĐỐI (ABSOLUTE LANGUAGE COMMAND): Mọi nội dung text (Tên, Mô tả, Nguồn gốc, Hiệu ứng...) PHẢI 100% bằng Tiếng Việt hoặc Hán Việt. NGHIÊM CẤM DÙNG TIẾNG ANH.
YÊU CẦU ĐỊNH DẠNG JSON NGHIÊM NGẶT - CHỈ TRẢ VỀ JSON ARRAY.
Each object trang bị (Equipment) có cấu trúc:
{
  "name": "Tên vũ khí/vật phẩm",
  "rarity": "Viết 1 trong các giá trị: Phàm, Linh, Huyền, Địa, Thiên, Đạo, Thần",
  "tier": "Mô tả cấp độ, vd: Tiên Thiên Tàn Bảo",
  "realm": "Cảnh giới tối thiểu để dùng",
  "type": "Tùy chọn: Vũ khí, Giáp, Trang sức, Đan dược, Phù lục, Dị bảo",
  "origin": "Nguồn gốc xuất xứ",
  "main_effect": "Tác dụng chính",
  "sub_effect": "Tác dụng phụ",
  "restriction": "Hạn chế sử dụng",
  "sentience": {
    "level": "Tùy chọn: none, weak, active, independent",
    "note": "Mô tả linh trí"
  },
  "backlash": "Phản phệ nếu có",
  "evolution_paths": ["Hướng tiến hóa 1", "Hướng tiến hóa 2"],
  "fate_quest": { "trigger": "Điều kiện", "chain": ["Bước 1", "Bước 2"] },
  "lore_hook": "Điển tích lưu truyền"
}`;

    return await callAIWithRetry(async () => {
      const response = await customAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      return parseGenAIJSONResponse<Equipment[]>(response.text || "[]");
    });
  } catch (error) {
    console.error("Error generating world equips:", error);
    return [];
  }
}

export async function generateWorldTechniques(apiKey?: string, count: number = 20): Promise<CultivationTechnique[]> {
  try {
    const customAi = getCustomGenAI(apiKey);
    const prompt = `Bạn là hệ thống diễn hóa Công Pháp Tu Chân. Hãy tạo ra MỘT MẢNG JSON (JSON Array) gồm ${count} bộ Công Pháp rải rác từ Phàm Cấp đến Đạo Cấp.
MỆNH LỆNH NGÔN NGỮ TUYỆT ĐỐI (ABSOLUTE LANGUAGE COMMAND): Mọi nội dung text (Tên, Nguồn gốc, Đặc tính, Hướng đột biến...) PHẢI 100% bằng Tiếng Việt hoặc Hán Việt. NGHIÊM CẤM DÙNG TIẾNG ANH. Các giá trị ENUM định sẵn như path, tier, focus, element thì có thể dùng tiếng Anh nếu quy định, nhưng field hiển thị phải là tiếng Việt.
ĐẢM BẢO CHỈ TRẢ VỀ JSON ARRAY CHUẨN. TẤT CẢ CÁC THUỘC TÍNH PHẢI ĐÚNG ĐỊNH DẠNG JSON. KHÔNG DÙNG CHÚ THÍCH TRONG JSON.
Cấu trúc object (CultivationTechnique):
{
  "id": "chuỗi định danh duy nhất tiếng anh không dấu",
  "name": "Tên Công Pháp",
  "tier": "Chọn 1: Phàm, Linh, Huyền, Địa, Thiên, Đạo",
  "path": "Chọn 1: Chính, Ma, Thể, Hồn, Kiếm, Dị",
  "element": ["Fire", "Water"],
  "level": 1,
  "maxLevel": 9,
  "experience": 0,
  "isActive": false,
  "core": {
    "origin": "Nguồn gốc bộ công pháp",
    "characteristics": "Đặc tính",
    "focus": "Chọn 1: Body, Spirit, Foundation, Balanced"
  },
  "circulation": {
    "type": "Chọn 1: Tiểu Chu Thiên, Đại Chu Thiên, Nghịch",
    "efficiency": 1.5
  },
  "effects": {
    "passive": ["Nội tại 1"],
    "active": ["Chủ động 1"]
  },
  "cost": {
    "risk": "Rủi ro tẩu hoả nhập ma",
    "lifespan": 10,
    "requirements": ["Yêu cầu 1"]
  },
  "mastery": {
    "refinement": 0,
    "application": 0
  },
  "evolution": {
    "canMutate": true,
    "direction": ["Hướng đột biến"]
  }
}`;
 
    return await callAIWithRetry(async () => {
      const response = await customAi.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      return parseGenAIJSONResponse<CultivationTechnique[]>(response.text || "[]");
    });
  } catch (error) {
    console.error("Error generating world techniques:", error);
    return [];
  }
}


export async function generateWorldNPCs(apiKey?: string, count: number = 20): Promise<NPC[]> {
  try {
    const customAi = getCustomGenAI(apiKey);
    const prompt = `Bạn là hệ thống tạo hóa NPC Tu Chân Giới. Hãy tạo ra MỘT MẢNG JSON (JSON Array) gồm ${count} NPC có tính cách riêng biệt, rải rác ở khắp các môn phái và cảnh giới trong thiên hạ (từ Phàm Nhân, Luyện Khí đến Hóa Thần, Luyện Hư...).
MỆNH LỆNH NGÔN NGỮ TUYỆT ĐỐI (ABSOLUTE LANGUAGE COMMAND): Mọi nội dung text (Tên, Biệt danh, Tính cách, Lời nói...) PHẢI 100% bằng Tiếng Việt hoặc Hán Việt. NGHIÊM CẤM DÙNG TIẾNG ANH (trừ các field là json key/id).
ĐẢM BẢO CHỈ TRẢ VỀ JSON ARRAY. KHÔNG DÙNG CHÚ THÍCH TRONG JSON. TẤT CẢ THUỘC TÍNH PHẢI ĐÚNG ĐỊNH DẠNG JSON.
Cấu trúc object (NPC):
{
  "id": "chuỗi định danh duy nhất tiếng anh không dấu",
  "name": "Tên NPC",
  "temporaryName": "Biệt danh tạm thời (Kẻ khả nghi...)",
  "isNameRevealed": true,
  "alias": "Ngoại hiệu",
  "age": 20,
  "gender": "Chọn: Nam, Nữ",
  "style": "Đạo bào, Hắc y...",
  "powerLevel": "Chiến lực mô tả ngắn",
  "realm": "Cảnh giới (vd: Kim Đan sơ kỳ)",
  "personality": "Tính cách bề ngoài",
  "personalityTraits": {
    "rationality": 50,
    "bravery": 50,
    "morality": 50,
    "ambition": 50
  },
  "innerSelf": "Bản chất/Khao khát bên trong",
  "background": "Xuất thân",
  "faction": "Tông môn/Thế lực",
  "alignment": "Môn quy/Niềm tin đạo đức",
  "positionX": 100,
  "positionY": 200,
  "relationship": 0,
  "virginity": "Mô tả nếu có",
  "currentOutfit": "Trang phục",
  "bodyDescription": {},
  "libido": 10,
  "willpower": 80,
  "lust": 10,
  "fetish": "",
  "sexualPreferences": [],
  "sexualArchetype": "",
  "physicalLust": "",
  "soulAmbition": "Khát vọng thăng tiên...",
  "shortTermGoal": "Mục tiêu ngắn hạn",
  "longTermDream": "Mục tiêu dài hạn",
  "mood": "Tâm trạng hiện tại",
  "impression": "Ấn tượng",
  "currentOpinion": "Quan điểm",
  "witnessedEvents": [],
  "knowledgeBase": ["Kiến thức võ học"],
  "conditions": [],
  "network": [],
  "type": "Cố nhân, Tán tu, Ma tu...",
  "inventory": [],
  "skills": [],
  "combatSkills": [
    { "id": "skill_1", "name": "Tên chiêu thức", "baseDamage": 50, "cost": 20, "element": "HOA", "rarity": "COMMON", "targetType": "SINGLE" }
  ],
  "voice": "Trầm ổn...",
  "aura": "Sát khí, Kiếm ý...",
  "physiologicalResponse": "Bình thản",
  "readinessState": "Đề phòng",
  "iq": 120,
  "mindset": "Logic tu tiên",
  "signaturePose": "Chạm kiếm tay trái",
  "sensitivePoints": "",
  "secrets": "Bí mật che giấu",
  "status": "alive",
  "maxHealth": 500,
  "health": 500,
  "maxMana": 200,
  "mana": 200,
  "attack": 50,
  "defense": 30,
  "speed": 15,
  "accuracy": 70,
  "powerScore": 1000
}`;

    return await callAIWithRetry(async () => {
      const response = await customAi.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      return parseGenAIJSONResponse<NPC[]>(response.text || "[]");
    });
  } catch (error) {
    console.error("Error generating world NPCs:", error);
    return [];
  }
}

export async function generateWorldBeasts(apiKey?: string, count: number = 20): Promise<any[]> {
  try {
    const customAi = getCustomGenAI(apiKey);
    const prompt = `Bạn là hệ thống tạo hóa Yêu Thú. Hãy tạo ra MỘT MẢNG JSON (JSON Array) gồm ${count} loại Yêu Thú, Linh Thú, Dị Thú phân bổ trên thiên hạ.
MỆNH LỆNH NGÔN NGỮ TUYỆT ĐỐI (ABSOLUTE LANGUAGE COMMAND): Mọi nội dung text (Tên, Mô tả, Sinh cảnh, Thu thập...) PHẢI 100% bằng Tiếng Việt hoặc Hán Việt. NGHIÊM CẤM DÙNG TIẾNG ANH (trừ các trường JSON ID kỹ thuật).
ĐẢM BẢO CHỈ TRẢ VỀ JSON ARRAY CHUẨN. KHÔNG DÙNG CHÚ THÍCH.
Cấu trúc object (BeastDefinition):
{
  "id": "chuỗi định danh duy nhất tiếng anh không dấu",
  "name": "Tên loại yêu thú",
  "level": 5,
  "diet": "Chọn: herbivore, carnivore, omnivore, spiritual_energy, minerals, blood",
  "basePower": 1.5,
  "reproduction": 0.5,
  "rarity": "Chọn: common, rare, elite, boss",
  "habitat": ["Rừng rậm", "Băng nguyên"],
  "instinct": {
    "hunger": 0.5,
    "aggression": 0.5,
    "caution": 0.5,
    "territorial": 0.5,
    "pack": 0.5,
    "bloodline": 0.5
  },
  "description": "Mô tả đặc điểm sinh học và chiến đấu",
  "element": "Chọn 1: KIM, MOC, THUY, HOA, THO, PHONG, LOI, BANG, AM, QUANG",
  "drops": ["Vật phẩm rớt 1", "Yêu đan"],
  "stats": {
    "health": 1000,
    "maxHealth": 1000,
    "attack": 120,
    "defense": 80,
    "speed": 60,
    "accuracy": 65,
    "mana": 400,
    "maxMana": 400
  },
  "talents": [
    { "id": "talent_1", "name": "Tên thiên phú (vd: Phong Nhận)", "baseDamage": 80, "cost": 30, "element": "PHONG", "rarity": "COMMON", "targetType": "SINGLE", "description": "Mô tả chiêu thức" }
  ],
  "status": "alive"
}`;

    return await callAIWithRetry(async () => {
      const response = await customAi.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      return parseGenAIJSONResponse<any[]>(response.text || "[]");
    });
  } catch (error) {
    console.error("Error generating world beasts:", error);
    return [];
  }
}


export async function generateNextStep(
  playerState: any,
  lastActionText: string,
  history: { role: string, content: string }[]
): Promise<GameResponse> {
  try {
    const rawApiKey = playerState.customApiKey || process.env.GEMINI_API_KEY || "";
    // Clean API key from any non-ISO-8859-1 characters that would break Headers.append
    const apiKey = rawApiKey.replace(/[^\x20-\x7E]/g, "").trim();
    
    if (!apiKey) {
      throw new Error("API Key is missing or invalid.");
    }
    
    const customAi = new GoogleGenAI({ apiKey });

    // Lấy 5 đoạn truyện gần nhất từ history để AI có context rõ ràng hơn
    const MAX_HISTORY_LENGTH = 5;
    const recentHistory = history && history.length > 0 
      ? history.slice(-MAX_HISTORY_LENGTH).map(h => `${h.role === 'user' ? 'Hành động' : 'Diễn biến'}: ${h.content}`).join('\n\n')
      : "Khởi đầu cuộc hành trình.";

    // Tích hợp hệ thống sự kiện mới
    const eventGameState: EventGameState = {
      player: {
        hp: playerState.health,
        mp: playerState.mana,
        realm: playerState.realm,
        luck: playerState.luck || 0,
        karma: playerState.karma || 0,
        position: { x: playerState.positionX || 0, y: playerState.positionY || 0, region: playerState.currentLocation || "Khởi nguyên" },
        status: []
      }
    };
    const triggeredEvent = triggerEvent(eventGameState);
    const eventContext = triggeredEvent 
        ? `SỰ KIỆN GỢI Ý ĐỂ AI DIỄN HÓA:
           - Tóm tắt: ${triggeredEvent.summary}
           - Yêu cầu hành động: ${triggeredEvent.startCombat ? "BẮT BUỘC KÍCH HOẠT CHIẾN ĐẤU" : "Diễn giải theo hướng sự kiện này."}
           `
        : "";

    // Sect system context
    const sectInfo = playerState.factionsReputation && playerState.currentLocation && playerState.currentLocation.includes('Tông môn') ? getSectInteractions(playerState.currentLocation) : null;
    const sectContext = sectInfo 
        ? `TÔNG MÔN HIỆN TẠI (TẠI VỊ TRÍ): ${playerState.currentLocation}. Thông tin tương tác: ${JSON.stringify(sectInfo)}. 
           Quy tắc thăng tiến: ${JSON.stringify(SECT_MECHANICS.ranks)}`
        : "Không ở trong tông môn.";

    // Optimize context by sending only relevant world data
    const nearbyWorldNPCs = (playerState.worldNPCs || [])
      .filter((n: any) => {
        const dx = (n.positionX || 0) - (playerState.positionX || 0);
        const dy = (n.positionY || 0) - (playerState.positionY || 0);
        return Math.sqrt(dx*dx + dy*dy) < 300;
      })
      .slice(0, 5);

    const worldBeastsSample = (playerState.worldBeasts || [])
      .filter((b: any) => b.level <= (playerState.realmLevel + 1) * 10)
      .slice(0, 5);

    const context = `
    ${eventContext}
    ${sectContext}
    DỮ LIỆU THIÊN THỜI (HEAVENLY CYCLE):
    - Chu kỳ: ${JSON.stringify(playerState.timeline?.cycle)}
    - Các sự kiện Đạo (Active Events): ${JSON.stringify(playerState.timeline?.events?.filter((e: any) => e.active))}

    DỮ LIỆU TÓM TẮT DÀI HẠN (LONG-TERM CONTEXT - CHRONICLES):
    - Arc Hiện Tại: ${playerState.currentArcName || 'Khởi Đầu'}
    - Biên Niên Sử (Chronicles): ${playerState.chronicles}
    
    HƯỚNG DẪN CẢNH GIỚI (REALM GUIDELINE):
    ${getRealmGuideline(playerState.realmLevel)}
    
    TÌNH TRẠNG HIỆN TẠI (INSTANT STATE):
    - Tên: ${playerState.name}
    - Giới tính: ${playerState.gender}
    - Độ khó: ${playerState.difficulty}
    - Cảnh giới: ${playerState.realm} (${playerState.stage})
    - Mẫu Yêu Thú (worldBeasts sample): ${JSON.stringify(worldBeastsSample.map((b: any) => ({ name: b.name, level: b.level })))}
    - NPC lân cận từ Thế Giới (worldNPCs nearby): ${JSON.stringify(nearbyWorldNPCs.map((n: any) => ({ name: n.name, realm: n.realm, faction: n.faction })))}
    - Trang Bị Thế Giới (worldEquipments sample): ${JSON.stringify((playerState.worldEquipments || []).slice(0, 5).map((e: any) => e.name))}
    - Công Pháp Thế Giới (worldTechniques sample): ${JSON.stringify((playerState.worldTechniques || []).slice(0, 5).map((t: any) => t.name))}
    - Điểm sức mạnh (Power Score): ${playerState.powerScore}
    - Thuộc tính cơ bản: Thể chất ${playerState.body}, Thần thức ${playerState.spirit}, Căn cơ ${playerState.foundation}
    - Linh căn: ${playerState.spiritualRoot?.type || 'Chưa xác định'} (Độ thuần khiết: ${playerState.spiritualRoot?.purity || 0})
    - Vị Trí Hiện Tại: Bản đồ ${playerState.currentLocation} (Tọa độ X: ${playerState.positionX || 0}, Y: ${playerState.positionY || 0})
    - Địa danh lân cận: ${JSON.stringify((playerState.mapData || []).filter(m => {
        const dx = (m.positionX || 0) - (playerState.positionX || 0);
        const dy = (m.positionY || 0) - (playerState.positionY || 0);
        return Math.sqrt(dx*dx + dy*dy) < 300;
      }).map(m => m.name))}
    - NPC Hiện Diện (SỐNG): ${JSON.stringify(playerState.npcs.filter((n: any) => n.status !== 'dead').slice(0, 10))}
    - NPC Đã Tử Vong: ${JSON.stringify(playerState.npcs.filter((n: any) => n.status === 'dead').map((n: any) => n.name))}
    - Chỉ số MC: HP ${playerState.health}/${playerState.maxHealth}, MP ${playerState.mana}/${playerState.maxMana}, ATK ${playerState.attack}, DEF ${playerState.defense}
    - Thời tiết: ${playerState.weather}
    - Hành trang: ${JSON.stringify(playerState.inventory.map((i: any) => i.name))}
    - Chiêu thức chiến đấu (Combat Skills): ${JSON.stringify(playerState.combatSkills.map((s: any) => s.name))}
    - Công pháp đang tu luyện: ${JSON.stringify(playerState.masteredTechniques.map((t: any) => t.name))}
    - Trang bị hiện tại: ${JSON.stringify(playerState.equippedItems)}
    - Chế độ Maturity/Romance (NSFW): ${playerState.isNsfwEnabled ? "BẬT" : "TẮT"}
    - Yêu cầu độ dài truyện: ${playerState.storyLength === 'Ngắn' ? 'Rất ngắn (khoảng 300-500 từ)' : playerState.storyLength === 'Dài' ? 'Rất dài và chi tiết (trên 2000 từ)' : 'Bình thường (khoảng 1000-1200 từ)'}

    BỐI CẢNH GẦN ĐÂY (RECENT HISTORY COMPILATION):
    """
    ${recentHistory}
    """

    HÀNH ĐỘNG MỚI NHẤT CỦA NGƯỜI CHƠI: "${lastActionText}"
    
    NGUYÊN TẮC CHIÊU THỨC (QUAN TRỌNG): TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý bịa thêm chiêu thức vào mảng "actions" hoặc cốt truyện chiến đấu. Các hành động võ thuật / thi triển công pháp mà AI đề xuất cho nhân vật chính MẶC ĐỊNH PHẢI ĐƯỢC CHỌN TỪ mảng "Chiêu thức chiến đấu (Combat Skills)" hoặc "Công pháp đang tu luyện" ở trên.
    
    NHIỆM VỤ: Dựa trên Chronicles để giữ logic chung, nhưng PHẢI bám sát "Bối Cảnh Gần Đây" để tiếp nối câu chuyện một cách mượt mà, không lặp lại từ ngữ và tránh lỗi logic. Hãy diễn hóa tiếp các sự kiện. TRẢ VỀ JSON CHÍNH XÁC.
    `;

    const response = await customAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
          type: Type.OBJECT,
          required: ["story", "actions"],
          properties: {
            story: { type: Type.STRING },
            triggersCombat: { type: Type.BOOLEAN },
            enemies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "name", "element", "stats", "combatSkills"],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  element: { type: Type.STRING },
                  stats: {
                    type: Type.OBJECT,
                    required: ["health", "attack", "defense", "speed", "mana"],
                    properties: {
                      health: { type: Type.NUMBER },
                      attack: { type: Type.NUMBER },
                      defense: { type: Type.NUMBER },
                      speed: { type: Type.NUMBER },
                      accuracy: { type: Type.NUMBER },
                      mana: { type: Type.NUMBER }
                    }
                  },
                  combatSkills: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["id", "name", "baseDamage", "scaling", "cost", "cooldown", "element", "targetType", "rarity"],
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        baseDamage: { type: Type.NUMBER },
                        scaling: { type: Type.NUMBER },
                        cost: { type: Type.NUMBER },
                        cooldown: { type: Type.NUMBER },
                        element: { type: Type.STRING },
                        targetType: { type: Type.STRING, enum: ["SINGLE", "AOE", "SELF"] },
                        rarity: { type: Type.STRING, enum: ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"] },
                        description: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            newEquipment: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                rarity: { type: Type.STRING },
                tier: { type: Type.STRING },
                realm: { type: Type.STRING },
                type: { type: Type.STRING },
                origin: { type: Type.STRING },
                main_effect: { type: Type.STRING },
                sub_effect: { type: Type.STRING },
                restriction: { type: Type.STRING },
                sentience: {
                  type: Type.OBJECT,
                  properties: {
                    level: { type: Type.STRING },
                    note: { type: Type.STRING }
                  }
                },
                backlash: { type: Type.STRING },
                evolution_paths: { type: Type.ARRAY, items: { type: Type.STRING } },
                fate_quest: {
                  type: Type.OBJECT,
                  properties: {
                    trigger: { type: Type.STRING },
                    chain: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                lore_hook: { type: Type.STRING }
              }
            },
            newTechnique: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                tier: { type: Type.STRING },
                path: { type: Type.STRING },
                element: { type: Type.ARRAY, items: { type: Type.STRING } },
                core: {
                  type: Type.OBJECT,
                  properties: {
                    origin: { type: Type.STRING },
                    characteristics: { type: Type.STRING },
                    description: { type: Type.STRING },
                    focus: { type: Type.STRING }
                  }
                },
                circulation: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    efficiency: { type: Type.NUMBER }
                  }
                },
                effects: {
                  type: Type.OBJECT,
                  properties: {
                    passive: { type: Type.ARRAY, items: { type: Type.STRING } },
                    active: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                cost: {
                  type: Type.OBJECT,
                  properties: {
                    risk: { type: Type.STRING },
                    lifespan: { type: Type.NUMBER },
                    requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                mastery: {
                  type: Type.OBJECT,
                  properties: {
                    refinement: { type: Type.NUMBER },
                    application: { type: Type.NUMBER }
                  }
                },
                evolution: {
                  type: Type.OBJECT,
                  properties: {
                    canMutate: { type: Type.BOOLEAN },
                    direction: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "text"],
                properties: {
                  id: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  time: { type: Type.NUMBER }
                }
              }
            },
            successChance: { type: Type.NUMBER },
            timePassed: {
              type: Type.OBJECT,
              properties: {
                unit: { type: Type.STRING },
                value: { type: Type.NUMBER }
              }
            },
            playerUpdates: {
              type: Type.OBJECT,
              properties: {
                tuViChange: { type: Type.NUMBER },
                healthChange: { type: Type.NUMBER },
                manaChange: { type: Type.NUMBER },
                reputationChange: { type: Type.NUMBER },
                karmaChange: { type: Type.NUMBER },
                body: { type: Type.NUMBER },
                spirit: { type: Type.NUMBER },
                foundation: { type: Type.NUMBER },
                spiritualRoot: {
                  type: Type.OBJECT,
                  properties: {
                    purity: { type: Type.NUMBER },
                    type: { type: Type.STRING }
                  }
                },
                talent: { type: Type.STRING },
                linhCan: { type: Type.STRING },
                background: { type: Type.STRING },
                inventoryAdd: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  }
                },
                inventoryRemove: { type: Type.ARRAY, items: { type: Type.STRING } },
                skillsAdd: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING }
                    }
                  }
                },
                combatSkillsAdd: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    required: ["id", "name", "baseDamage", "scaling", "cost", "cooldown", "element", "targetType", "rarity"],
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      baseDamage: { type: Type.NUMBER },
                      scaling: { type: Type.NUMBER },
                      cost: { type: Type.NUMBER },
                      cooldown: { type: Type.NUMBER },
                      element: { type: Type.STRING },
                      targetType: { type: Type.STRING, enum: ["SINGLE", "AOE", "SELF"] },
                      rarity: { type: Type.STRING, enum: ["COMMON", "RARE", "EPIC", "LEGENDARY", "MYTHIC"] },
                      description: { type: Type.STRING }
                    }
                  }
                },
                locationUpdate: { type: Type.STRING },
                positionX: { type: Type.NUMBER },
                positionY: { type: Type.NUMBER },
                realm: { type: Type.STRING },
                realmLevel: { type: Type.NUMBER },
                stage: { type: Type.STRING },
                tuViCapacity: { type: Type.NUMBER },
                accuracy: { type: Type.NUMBER },
                discoveredRegionIds: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              }
            },
            weather: { type: Type.STRING },
            chronicles: { type: Type.STRING },
            npcs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "name", "status", "health", "maxHealth", "attack", "defense", "speed", "realm"],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  age: { type: Type.NUMBER },
                  realm: { type: Type.STRING },
                  realmLevel: { type: Type.NUMBER },
                  faction: { type: Type.STRING },
                  positionX: { type: Type.NUMBER },
                  positionY: { type: Type.NUMBER },
                  temporaryName: { type: Type.STRING },
                  isNameRevealed: { type: Type.BOOLEAN },
                  relationship: { type: Type.NUMBER },
                  status: { type: Type.STRING },
                  mood: { type: Type.STRING },
                  lust: { type: Type.NUMBER },
                  willpower: { type: Type.NUMBER },
                  libido: { type: Type.NUMBER },
                  powerScore: { type: Type.NUMBER },
                  body: { type: Type.NUMBER },
                  spirit: { type: Type.NUMBER },
                  foundation: { type: Type.NUMBER },
                  attack: { type: Type.NUMBER },
                  defense: { type: Type.NUMBER },
                  health: { type: Type.NUMBER },
                  maxHealth: { type: Type.NUMBER },
                  mana: { type: Type.NUMBER },
                  maxMana: { type: Type.NUMBER },
                  speed: { type: Type.NUMBER },
                  accuracy: { type: Type.NUMBER },
                  inventory: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING }
                      }
                    } 
                  },
                  skills: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING }
                      }
                    }
                  },
                  domain: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      element: { type: Type.STRING },
                      strength: { type: Type.NUMBER },
                      stability: { type: Type.NUMBER },
                      effects: {
                        type: Type.OBJECT,
                        properties: {
                          buffSelf: { type: Type.ARRAY, items: { type: Type.STRING } },
                          debuffEnemy: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                      }
                    }
                  },
                  impression: { type: Type.STRING },
                  currentOpinion: { type: Type.STRING },
                  iq: { type: Type.NUMBER },
                  mindset: { type: Type.STRING },
                  personalityTraits: {
                    type: Type.OBJECT,
                    properties: {
                      rationality: { type: Type.NUMBER },
                      bravery: { type: Type.NUMBER },
                      morality: { type: Type.NUMBER },
                      ambition: { type: Type.NUMBER }
                    }
                  }
                }
              }
            },
            currentLocation: { type: Type.STRING },
            newBeasts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "name", "species", "level", "rarity", "element", "stats", "talents"],
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  species: { type: Type.STRING },
                  level: { type: Type.NUMBER },
                  rarity: { type: Type.STRING, enum: ["common", "rare", "elite", "boss"] },
                  element: { type: Type.STRING },
                  habitat: { type: Type.ARRAY, items: { type: Type.STRING } },
                  drops: { type: Type.ARRAY, items: { type: Type.STRING } },
                  instinct: {
                    type: Type.OBJECT,
                    properties: {
                      hunger: { type: Type.NUMBER },
                      aggression: { type: Type.NUMBER },
                      caution: { type: Type.NUMBER },
                      territorial: { type: Type.NUMBER }
                    }
                  },
                  description: { type: Type.STRING },
                  stats: {
                    type: Type.OBJECT,
                    required: ["health", "maxHealth", "attack", "defense", "speed", "mana", "maxMana"],
                    properties: {
                      health: { type: Type.NUMBER },
                      maxHealth: { type: Type.NUMBER },
                      attack: { type: Type.NUMBER },
                      defense: { type: Type.NUMBER },
                      speed: { type: Type.NUMBER },
                      accuracy: { type: Type.NUMBER },
                      mana: { type: Type.NUMBER },
                      maxMana: { type: Type.NUMBER }
                    }
                  },
                  talents: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["id", "name", "baseDamage", "cost", "element", "targetType", "rarity"],
                      properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        baseDamage: { type: Type.NUMBER },
                        cost: { type: Type.NUMBER },
                        element: { type: Type.STRING },
                        targetType: { type: Type.STRING },
                        rarity: { type: Type.STRING },
                        description: { type: Type.STRING }
                      }
                    }
                  },
                  status: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text || "{}";
    
    // Safety extraction: find first '{' and corresponding balancing '}'
    let jsonStr = text.trim();
    const start = jsonStr.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      let end = -1;
      let inString = false;
      let escape = false;
      const stack: string[] = [];

      for (let i = start; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (char === '"' && !escape) {
          inString = !inString;
        }

        if (!inString) {
          if (char === '{') {
            depth++;
            stack.push('{');
          } else if (char === '[') {
            depth++;
            stack.push('[');
          } else if (char === '}') {
            depth--;
            stack.pop();
          } else if (char === ']') {
            depth--;
            stack.pop();
          }
          
          if (depth === 0) {
            end = i;
            break;
          }
        }

        if (char === '\\') {
          escape = !escape;
        } else {
          escape = false;
        }
      }
      
      if (end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
      } else {
        // If truncated, try to close it minimally
        if (inString) jsonStr += '"';
        while (stack.length > 0) {
          const last = stack.pop();
          if (last === '{') jsonStr += '}';
          else if (last === '[') jsonStr += ']';
        }
      }
    }
    
    try {
      return JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Original Text:", text);
      console.error("Cleaned Text:", jsonStr);
      throw parseError;
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      story: "Thiên Đạo xuất hiện dị biến, không thể tiếp tục diễn hóa. Hãy thử lại sau.",
      actions: [{ id: 1, text: "Thử lại linh cảm" }],
      mapData: []
    } as any;
  }
}

export async function processCombatOutcome(
  playerState: any,
  winnerId: string | undefined,
  logs: string[],
  history: GameHistoryItem[]
): Promise<GameResponse> {
  try {
    const rawApiKey = playerState.customApiKey || process.env.GEMINI_API_KEY || "";
    const apiKey = rawApiKey.replace(/[^\x20-\x7E]/g, "").trim();
    if (!apiKey) throw new Error("API Key is missing or invalid.");
    const customAi = new GoogleGenAI({ apiKey });

    // Identify winner
    const winner = playerState.combatState?.participants.find((p: any) => p.id === winnerId);
    const isPlayerWinner = winner?.isPlayer;

    const combatResultPrompt = `KẾT QUẢ ĐÃ ĐƯỢC XÁC ĐỊNH BỞI COMBAT UI:
- Phe thắng: ${isPlayerWinner ? "Người chơi (MC)" : "Kẻ thù"}
- Logs trận đánh cuối cùng:
${logs.slice(-5).join('\\n')}

[NHIỆM VỤ CỦA BẠN LÀ LÀM TRỌNG TÀI BÁO CÁO KẾT QUẢ CHIẾN ĐẤU]
1. Viết một đoạn 'story' (Văn xuôi, khoảng 150-300 chữ) bằng tiếng Việt phong cách tu tiên miêu tả chân thực cú đánh quyết định dứt điểm trận đấu, cảnh máu me tàn khốc, và thu dọn chiến trường.
2. NGUYÊN TẮC: TUYỆT ĐỐI không cho kẻ địch hồi sinh nếu MC đã thắng. Kẻ địch phải bị đánh gục hoặc bỏ chạy. 
3. LOOT & TRẠNG THÁI: Tự động cập nhật 'inventoryAdd', 'healthChange', hoặc bất cứ hệ quả nào của trận chiến (VD: thu được yêu đan, vũ khí). ĐỪNG hỏi người chơi muốn loot không, hệ thống tự động loot nếu thắng. Mọi NPC địch tham gia trận chiến khi đã chết, PHẢI cập nhật 'status': 'dead' thông qua mảng 'npcs'.
4. CẬP NHẬT CHRONICLES (BẮT BUỘC DỮ NGUYÊN CẤU TRÚC): Cập nhật 'chronicles' bằng cách thêm vào phần cuối của mục [DÒNG THỜI GIAN SỰ KIỆN LỚN (TIMELINE)] và có thể cập nhật các mục khác nếu có biến cố quan trọng (đạt bảo vật, diệt nhân vật quan trọng). LUÔN DUY TRÌ đúng 4 mục của Chronicles hiện tại.
5. TRẢ VỀ CÁC HÀNH ĐỘNG ('actions') để người chơi có thể tiếp tục hành trình sau trận chiến.`;

    const MAX_HISTORY_LENGTH = 3;
    const recentHistory = history && history.length > 0
      ? history.slice(-MAX_HISTORY_LENGTH).map(h => `Hành động: ${h.actionTaken}\\nDiễn biến: ${h.story}`).join('\\n\\n')
      : "";

    const context = `
    DỮ LIỆU HIỆN TẠI:
    - Tên MC: ${playerState.name}
    - Cảnh giới: ${playerState.realm} (${playerState.stage})
    - TÌNH TRẠNG SAU CHIẾN ĐẤU: HP ${playerState.health}, MP ${playerState.mana}
    - KẺ ĐỊCH GẦN NHẤT: ${JSON.stringify(playerState.combatState?.participants.filter((p: any) => !p.isPlayer) || [])}
    - CHRONICLES HIỆN TẠI: ${playerState.chronicles}
    - TRÍ NHỚ NGẮN HẠN (LƯỢT TRƯỚC):
    ${recentHistory}

    ${combatResultPrompt}
    `;

    const response = await customAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: context,
      config: {
        systemInstruction: "BẠN LÀ 1 AI CHUYÊN XỬ LÝ HẬU QUẢ VÀ TƯỜNG THUẬT KẾT QUẢ COMBAT. CHỈ TRẢ VỀ DỮ LIỆU CHUẨN JSON, KHÔNG THÔNG BÁO. TÔN TRỌNG NGHIÊM NGẶT KẾT QUẢ CỦA GAME (NẾU GAME BÁO MC THẮNG = MC CHẮC CHẮN SỐNG & ĐỊCH CHẾT/BỎ CHẠY, NGƯỢC LẠI NẾU MC THUA). TRẢ VỀ ÍT NHẤT 1 'story' MIÊU TẢ CHIẾN TRƯỜNG.",
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
          type: Type.OBJECT,
          required: ["story", "actions"],
          properties: {
             story: { type: Type.STRING },
             actions: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 required: ["id", "text"],
                 properties: {
                   id: { type: Type.NUMBER },
                   text: { type: Type.STRING }
                 }
               }
             },
             playerUpdates: {
                type: Type.OBJECT,
                properties: {
                   healthChange: { type: Type.NUMBER },
                   manaChange: { type: Type.NUMBER },
                   tuViChange: { type: Type.NUMBER },
                   inventoryAdd: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } },
                   inventoryRemove: { type: Type.ARRAY, items: { type: Type.STRING } },
                   skillsAdd: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } }
                }
             },
             npcs: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 required: ["id", "name", "status"],
                 properties: {
                   id: { type: Type.STRING },
                   name: { type: Type.STRING },
                   status: { type: Type.STRING },
                   health: { type: Type.NUMBER },
                   maxHealth: { type: Type.NUMBER },
                   attack: { type: Type.NUMBER },
                   defense: { type: Type.NUMBER },
                   speed: { type: Type.NUMBER },
                   accuracy: { type: Type.NUMBER },
                   realm: { type: Type.STRING }
                 }
               }
             },
             chronicles: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || "{}";
    
    // Safety extraction: find first '{' and corresponding balancing '}'
    let jsonStr = text.trim();
    const start = jsonStr.indexOf('{');
    if (start !== -1) {
      let depth = 0;
      let end = -1;
      let inString = false;
      let escape = false;
      const stack: string[] = [];

      for (let i = start; i < jsonStr.length; i++) {
        const char = jsonStr[i];

        if (char === '"' && !escape) {
          inString = !inString;
        }

        if (!inString) {
          if (char === '{') {
            depth++;
            stack.push('{');
          } else if (char === '[') {
            depth++;
            stack.push('[');
          } else if (char === '}') {
            depth--;
            stack.pop();
          } else if (char === ']') {
            depth--;
            stack.pop();
          }
          
          if (depth === 0) {
            end = i;
            break;
          }
        }

        if (char === '\\') {
          escape = !escape;
        } else {
          escape = false;
        }
      }
      
      if (end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
      } else {
        // If truncated, try to close it minimally
        if (inString) jsonStr += '"';
        while (stack.length > 0) {
          const last = stack.pop();
          if (last === '{') jsonStr += '}';
          else if (last === '[') jsonStr += ']';
        }
      }
    }
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Combat AI Error:", error);
    console.error("Failed JSON string during parsing");
    return {
      story: "[Biến cố] Kết quả trận chiến xuất hiện dị tượng không thể trần thuật.",
      actions: [{ id: 1, text: "Nhìn lại chiến trường..." }]
    };
  }
}

export interface PlotSuggestion {
  title: string;
  description: string;
  type: 'Main' | 'Side' | 'Encounter' | 'Secret';
  potentialRewards: string[];
}

export async function suggestPlot(
  playerState: any
): Promise<PlotSuggestion[]> {
  try {
    const rawApiKey = playerState.customApiKey || process.env.GEMINI_API_KEY || "";
    const apiKey = rawApiKey.replace(/[^\x20-\x7E]/g, "").trim();
    
    if (!apiKey) return [];
    
    const customAi = new GoogleGenAI({ apiKey });

    const prompt = `
    DỰA TRÊN BIÊN NIÊN SỬ (CHRONICLES) VÀ TRẠNG THÁI HIỆN TẠI CỦA NGƯỜI CHƠI:
    - Biên Niên Sử: ${playerState.chronicles}
    - Cảnh Giới: ${playerState.realm} (${playerState.stage})
    - Vị Trí: ${playerState.currentLocation}
    - Nhân quả (Karma): ${playerState.karma}
    - Phe phái: ${JSON.stringify(playerState.factionsReputation)}
    - NPC từng gặp: ${playerState.npcs ? playerState.npcs.map((n: any) => n.name).join(', ') : 'Chưa gặp ai'}

    HÃY ĐỀ XUẤT 3-4 TÌNH TIẾT TRUYỆN TIẾP THEO HOẶC NHIỆM VỤ PHỤ NGẮN HẠN ĐỂ LÀM PHONG PHÚ THẾ GIỚI.
    Yêu cầu:
    1. Phải bám sát logic của Biên Niên Sử.
    2. Các đề xuất phải mang phong vị Tu Tiên, huyền ảo.
    3. Phân loại theo: 'Main' (Cốt truyện chính), 'Side' (Nhiệm vụ phụ), 'Encounter' (Kỳ ngộ/Bất ngờ), 'Secret' (Bí mật/Mật cảnh).
    4. Gợi ý các phần thưởng tiềm năng.

    TRẢ VỀ JSON THEO ĐỊNH DẠNG MẢNG CÁC ĐỐI TƯỢNG (Mọi text KHÔNG BAO GỒM KEY JSON bắt buộc phải viết bằng Tiếng Việt hoặc Hán Việt):
    [{ "title": "Tên nhiệm vụ", "description": "Mô tả chi tiết", "type": "Main|Side|Encounter|Secret", "potentialRewards": ["Phần thưởng 1", "Phần thưởng 2"] }]
    `;

    const result = await customAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let text = result.text || "[]";
    const startIdx = text.indexOf('[');
    const endIdx = text.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }
    const suggestions = JSON.parse(text);
    return suggestions;
  } catch (error) {
    console.error("Plot Suggestion Error:", error);
    return [];
  }
}
