
/**
 * RULES FOR STATE SYNCHRONIZATION
 * These rules ensure that any narrative event in the 'story' field is reflected in the JSON 'playerUpdates', 'newEquipment', or 'newTechnique' fields.
 */

export const STATE_SYNC_PROMPT = `
[GIAO THỨC ĐỒNG BỘ HÓA TRẠNG THÁI (STATE SYNC PROTOCOL)]:
1. CÔNG PHÁP (Techniques):
   - Nếu trong story nói MC học được, nhặt được hoặc lĩnh hội một công pháp (vd: Ngũ Hành Tụ Linh Quyết), bạn PHẢI trả về object 'newTechnique' đầy đủ thông tin.
   - Mỗi công pháp mới sẽ tự động sinh ra một Kỹ năng chiến đấu (Combat Skill) tương ứng.
   
2. TRANG BỊ (Equipment):
   - Nếu MC nhận được vũ khí, giáp trụ hoặc linh bảo, bạn PHẢI trả về 'newEquipment'.
   - Mô tả trang bị trong JSON phải khớp với mô tả trong story (về tên, phẩm cấp, thuộc tính).

3. TU VI & CẢNH GIỚI (Cultivation & Realm):
   - Nếu story nói về việc đột phá hoặc tăng tiến tu vi, hãy cập nhật 'playerUpdates.tuViChange' hoặc 'playerUpdates.realm/stage'.
   - Khi có 'newTechnique' và MC đang là Phàm Nhân, hệ thống sẽ tự động chuyển đổi sang Luyện Khí Kỳ.

4. LINH CĂN & TƯ CHẤT (Spiritual Root & Stats):
   - Mọi thay đổi về Linh Căn (linhCan) hoặc Tư chất (body, spirit, foundation) được nhắc đến trong story (Vd: "Tẩy tủy phạt cốt làm thể chất tăng mạnh") PHẢI được cập nhật trong 'playerUpdates'.

MỆNH LỆNH: Story và Dữ liệu JSON phải là hình với bóng. Cấm tuyệt đối việc story nói một đường, UI hiển thị một nẻo.
`;
