export const WORLD_GEO_PROMPT = `
MỆNH LỆNH NGÔN NGỮ TUYỆT ĐỐI (ABSOLUTE LANGUAGE COMMAND): 
Toàn bộ nội dung hiển thị trong game (Tên Địa Danh, Loại Yêu Thú, Mô Tả...) PHẢI 100% bằng Tiếng Việt hoặc Hán Việt mang phong vị Tu Tiên. 
NGHIÊM CẤM sử dụng tiếng Anh hoặc ngôn ngữ khác.
TUYỆT ĐỐI KHÔNG sử dụng các từ ngữ mang tính chất trò chơi như "Tân thủ thôn", "Khu khởi đầu", "Màn 1". 

BỐI CẢNH THẾ GIỚI: Thiên Nam Tu Tiên Giới, Loạn Tinh Hải và Mộ Lan Thảo Nguyên.

QUY TẮC SỰ KIỆN & VARIATION (DYNAMIC):
- Không chỉ sử dụng các địa danh gốc, hãy tự sáng tạo ra các "Vùng đất vệ tinh", "Phụ đảo", "Tiểu sơn mạch" xung quanh các địa danh lớn.
- Sử dụng các tiền tố: (Cổ, Vô, Thiên, Linh, Ma, Tuyệt, U, Minh, Huyền, Thánh) kết hợp với các địa thế (Sơn, Hải, Lâm, Cốc, Động, Phủ, Trấn, Thành).
- Ví dụ sáng tạo: "U Minh Cốc", "Huyền Linh Đảo", "Tuyệt Diệt Sơn", "Minh Nguyệt Trấn".
- Mỗi vùng đất nên có một "Ẩn thế chi địa" (Hidden place) hiếm gặp chiếm 10% tỷ lệ xuất hiện.

DANH SÁCH GỐC ĐỂ THAM CHIẾU (Coi đây là các đại khu vực trung tâm):
- Thiên Nam: 
    - Tông môn: Hoàng Phong Cốc, Thanh Vân Môn, Thiên Sát Tông, Quỷ Linh Môn, Linh Thú Sơn.
    - Thành thị / Quốc gia: Việt Quốc, Nguyên Vũ Quốc, Khang Quốc.
    - Rừng rậm / Sơn mạch: Hắc Mộc Lâm, Linh Thú Sơn Mạch, Thái Nhạc Sơn Mạch.
    - Khu vực đặc biệt: Huyết Sắc Cấm Địa.
- Loạn Tinh Hải:
    - Thế lực: Tinh Cung (Quản lý Thiên Tinh Thành), Nghịch Tinh Minh (Liên minh lục đạo và tam chính).
    - Địa điểm: Thiên Tinh Thành, Nội Hải, Ngoại Hải, Yêu Thú Hải Vực.
    - Đặc trưng: Các đảo tu luyện lớn nhỏ, vùng biển hỗn loạn, loạn lưu linh khí.
- Mộ Lan Thảo Nguyên:
    - Bộ tộc: Mộ Lan Nhân, Đột Quyết Nhân.
    - Đặc trưng: Thảo nguyên rộng lớn, phong tục du mục, tu luyện pháp thuật phối hợp.
    - Khu vực đặc biệt: Chiến trường biên giới Thiên Nam.
- Đại Tấn (Trung Tâm Tu Tiên):
    - Tông môn: Thái Nhất Môn, Hóa Ý Môn, cùng các thế lực siêu cấp.
    - Đặc trưng: Các đại thành tu tiên sầm uất, nơi hội tụ tinh hoa thiên hạ.
    - Khu vực đặc biệt: Nơi giao thoa của các cường giả bậc nhất.
- Vô Biên Hải & Yêu/Ma Tộc Lĩnh Địa:
    - Vô Biên Hải: Hải vực vô tận đầy rẫy yêu thú cấp cao và bí cảnh cổ.
    - Yêu Tộc: Các sơn mạch khổng lồ, rừng cổ nơi đại yêu hóa hình cư ngụ.
    - Ma Tộc: Những vùng đất ma khí nồng đậm, đầy rẫy tử vong và sức mạnh hắc ám.
- Ngoại Vực & Bí Cảnh (CHI TIẾT):
    - Huyết Sắc Cấm Địa: Cấm chế cổ xưa, linh dược nghìn năm, yêu thú biến dị, chỉ mở theo chu kỳ.
    - Cổ Chiến Trường: Mảnh vỡ Linh Bảo, Tàn Hồn cường giả, Sát khí nồng đậm, di cốt Thượng Cổ.
    - Không Gian Loạn Lưu: Khe nứt không gian, bảo vật rơi rớt từ các giới diện khác, cực kỳ nguy hiểm.
    - Hư Thiên Điện: Cung điện lơ lửng trong hư không, chứa đựng Trân Bảo chấn động giới diện.

Tạo ra dữ liệu JSON của các vùng đất.
LƯU Ý: JSON TRẢ VỀ PHẢI LÀ MỘT ARRAY CÁC OBJECT, KHÔNG KÈM BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI.

MẪU DỮ LIỆU BẮT BUỘC:
[
  {
    "id": "luc-dia-pham-gioi",
    "type": "Continent",
    "continentId": null,
    "tierId": "T1",
    "name": "Phàm Nhân Giới",
    "discovered": true,
    "description": "Lục địa khởi đầu.",
    "positionX": 0,
    "positionY": 0,
    "linhKhi": "Loãng",
    "cap": "Luyện Khí",
    "terrain": "Đồng bằng",
    "difficulty": 1,
    "commonBeasts": ["Dã thú"],
    "connectedRegionIds": ["thanh-tri-tam-giang"],
    "ownerFaction": null
  }
]

Cấu trúc JSON mỗi region (MapRegion):
{
  "id": "chuỗi định danh duy nhất không dấu", 
  "type": "Continent" | "City" | "Sect" | "Mountain" | "Forest" | "River" | "Sea" | "Dungeon" | "ForbiddenZone",
  "continentId": null,
  "tierId": "T1",
  "name": "Tên",
  "discovered": false,
  "description": "Mô tả",
  "positionX": 100,
  "positionY": -50,
  "linhKhi": "Loãng",
  "cap": "Luyện Khí",
  "terrain": "Địa hình",
  "difficulty": 1,
  "commonBeasts": ["Dã thú"],
  "connectedRegionIds": [],
  "ownerFaction": null
}

ĐẢM BẢO TẠO RA DỮ LIỆU CHI TIẾT THEO MẪU.
`;
