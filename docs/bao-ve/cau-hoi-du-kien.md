# Câu hỏi dự kiến khi bảo vệ — Làng Trăng Mờ

ROADMAP 8.4. Mỗi câu: trả lời ngắn (nói trong 30 giây), rồi **chỉ vào đâu** trong mã hoặc sơ đồ.

## 1. Vì sao tách "ghi ý định" và "giải quyết tập trung"?

**Trả lời.** Ban đêm nhiều vai tác động lên cùng một người: Sói cắn A, Bảo vệ đỡ A, Phù thủy
cứu A. Nếu mỗi vai tự sửa trạng thái thì kết quả phụ thuộc ai bấm nút trước. Nên mỗi vai chỉ
tạo một `HanhDongDem` (ý định); hết đêm `BoGiaiQuyetDem` gom lại, áp theo `doUuTien`, xử lý
xung đột rồi mới đánh dấu người chết. Lọ cứu chỉ bị trừ ở bước giải quyết — nhờ vậy khi Bảo vệ
đã đỡ thì Phù thủy cứu cũng không mất lọ (TC04, BR07).

**Chỉ vào.** `ARCHITECTURE.md` mục 2.2 và 6; `application/BoGiaiQuyetDem.ts` (chuỗi bước Bảo
vệ → Cắn → Cứu → Độc là mẫu **Chain of Responsibility**); `04-sequence-pha-dem.puml`; bài
`TC04` trong `tests/application/BoGiaiQuyetDem.test.ts`.

## 2. Vì sao Chủ phòng kế thừa Người chơi?

**Trả lời.** Trên Use Case Diagram, Chủ phòng là **tổng quát hóa tác nhân**: làm được mọi use
case của Người chơi (vào phòng, chơi, nhắn tin…) **cộng thêm** UC06 tạo phòng, UC08 cấu hình
vai, UC10 loại người, UC11 bắt đầu, UC25 tùy chỉnh luật. Vẽ kế thừa thì không phải nối lại mọi
use case chung cho Chủ phòng.

Trong mã, Chủ phòng **không** là lớp con mà là một liên kết `PhongChoi.maChuPhong`: vai trò chủ
phòng chuyển được khi chủ rời phòng (Q11 — chuyển cho người thật vào sớm nhất). Đối tượng không
đổi được lớp lúc chạy, nên dùng liên kết thay kế thừa. Tác nhân là khái niệm của *yêu cầu*, lớp
là khái niệm của *thiết kế* — hai thứ không buộc phải trùng.

**Chỉ vào.** `01-use-case.puml` (actor `Chủ phòng`); `domain/phong/PhongChoi.ts`
(`maChuPhong`, `roiPhong()`).

## 3. Vì sao "Kỹ năng lúc chết" (Thợ săn) là `extend`?

**Trả lời.** UC17 chỉ xảy ra **khi có điều kiện**: người chết là Thợ săn (và BR09 cho phép bắn
khi bị treo). Use case gốc — UC14 giải quyết đêm, UC16 bỏ phiếu — vẫn trọn vẹn khi không có
Thợ săn; nên UC17 *mở rộng* chúng tại điểm mở rộng "có người chết", không phải `include` (bắt
buộc lần nào cũng chạy). Dây chuyền Thợ săn bắn Thợ săn (BR10) được xử lý bằng
`BoGiaiQuyetDem.xuLyDayChuyen()`.

**Chỉ vào.** `01-use-case.puml`: `U17 ..> U14 : <<extend>>`, `U17 ..> U16 : <<extend>>`; bài
`ST04` trong `tests/system/heThong.test.ts`; `TC09`, `TC10`, cặp đảo `TC18`.

## 4. Mẫu thiết kế nào ở đâu?

| Mẫu | Ở đâu | Vì sao |
|---|---|---|
| Template Method | `VaiTro.thucHienLuot()` | Khung kiểm tra chung; lớp con chỉ đổi `layDanhSachMucTieu`, `kiemTraRangBuoc`, `dungNangLuc` |
| Strategy | `BoLuatChoi` truyền qua `NguCanhHanhDong` | Bật/tắt luật không sửa mã vai — cặp TC08/TC16 cùng mã, khác chiến lược |
| State | `domain/van/trangthai/` (10 trạng thái) | Mỗi trạng thái cho phép chuyển tiếp khác nhau; chuyển sai thì ném lỗi |
| Chain of Responsibility | Các bước của `BoGiaiQuyetDem` | Bước trước đổi được kết quả bước sau (đỡ làm cú cắn vô hiệu) |
| Factory | `BoChiaVai` | Sinh đối tượng vai theo cấu hình, nơi gọi không biết lớp cụ thể |
| Observer | `BoPhatSuKien`; `SoDangKyPhong.dangKy()` | Tầng Socket.IO, người chơi ảo, nhật ký cùng nghe một sự kiện |

Cộng thêm ở mức kiến trúc: **kiến trúc lục giác** — cổng `KhoDuLieu` có hai bản cài (bộ nhớ,
Prisma) qua cùng bộ kiểm hợp đồng; cổng `DongHo`, `NguonNgauNhien`, `CongNgatKetNoi` đảo phụ
thuộc để lõi không biết khung nào.

**Chỉ vào.** `ARCHITECTURE.md` mục 10; Class Diagram (ghi chú tên mẫu cạnh từng lớp).

## 5. Làm sao chắc sơ đồ khớp mã?

**Trả lời.** `tests/docs/soDoLop.test.ts` chạy trong CI, đối chiếu **hai chiều**: mọi thành
viên ghi trên sơ đồ phải có trong tệp lớp, mọi lớp xuất ra từ `domain/` và `application/` phải
có trên sơ đồ. Đổi mã mà quên sơ đồ thì CI đỏ. Sơ đồ trạng thái có `tests/domain/trangthai.test.ts`
đối chiếu bảng chuyển tiếp.

## 6. Làm sao người chơi không xem trộm vai người khác (PC04)?

**Trả lời.** Máy chủ là trọng tài duy nhất. Mỗi người chỉ nhận `GocNhinNguoiChoi` của chính mình
— kiểu dữ liệu này **không có chỗ** chứa vai người khác (trừ khi hết ván). Giao diện không có
một dòng luật nào. Bài ST05 rà **mọi gói** máy chủ gửi trong cả ván.

**Chỉ vào.** `application/taoGocNhin.ts`, `packages/shared/src/gocNhin.ts`, ST05 trong
`tests/interface/socket.test.ts`; trình diễn bằng F12 → Network → WS.

## 7. Người chơi ảo có "ăn gian" không?

**Trả lời.** Không. Người chơi ảo nhận đúng `GocNhinNguoiChoi` như người thật và gửi lựa chọn
qua cùng `CongLuaChon` — không có nhánh `if (laNguoiChoiAo)` trong luật (nguyên tắc 2.5).

## 8. Vì sao bộ luật không đổi được giữa ván?

**Trả lời.** Lúc bắt đầu, `BoLuatChoi` được sao chép và đóng băng vào `VanDau`
(`saoChep()` → `Object.freeze`). Chủ phòng đổi công tắc chỉ đổi bản của phòng cho ván sau. TC20
kiểm việc này; trạng thái `TrangThaiVanDau.choPhepDoiBoLuat()` trả `false` khi đang chơi.

## 9. Hết giờ mà Sói không thống nhất thì sao? Mất mạng thì sao?

**Trả lời.** BR12: chọn ngẫu nhiên trong các mục tiêu đã đề xuất — ngẫu nhiên qua cổng
`NguonNgauNhien` nên kiểm thử cố định được hạt giống (TC12). Mất mạng: người đó bỏ lỡ lượt,
kết nối lại nhận ngay góc nhìn và lịch sử kênh (ST03); quá nửa người còn sống mất kết nối hơn
120 giây thì ván hủy, không tính điểm (Q04).

## 10. Điểm xếp hạng tính thế nào?

**Trả lời.** Tài liệu gốc chưa định nghĩa nên nhóm chốt Q14: thắng +3, thua +1, chỉ người thật,
ván hủy không tính; bằng điểm xét tỉ lệ thắng rồi số ván. Cộng lúc lưu ván (`DichVuLuuVan`),
đánh hạng ở `DichVuXepHang`.
