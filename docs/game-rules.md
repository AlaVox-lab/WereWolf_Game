# game-rules.md

> **Mục đích**: nguồn sự thật duy nhất trong kho mã về **luật chơi** — sáu vai trò, mười
> bốn quy tắc nghiệp vụ, bảng xung đột hiệu ứng và bộ kịch bản kiểm thử. Mã nguồn lõi
> miền và bộ kiểm thử bám theo tệp này, không bám theo trí nhớ.
>
> Nội dung chép từ *Tài liệu dự án toàn diện — Làng Trăng Mờ, Nhóm 13, bản 1.0* (mục 1.3,
> 1.4, 10.2, 17.2, 17.3). Khi luật đổi: sửa tài liệu gốc **và** tệp này trong cùng một lần,
> rồi báo cả nhóm.
>
> Mục 6 ghi các điểm tài liệu gốc chưa nói rõ và quyết định đã chốt cho từng điểm.

---

## 1. Sáu vai trò

| Vai | Lớp | Phe | `doUuTien` | `laHanhDongDem()` | Loại hành động sinh ra | Năng lực |
|---|---|---|---|---|---|---|
| Bảo vệ | `BaoVe` | `DAN` | 10 | đúng | `BAO_VE` | Chọn một người để che chắn, không được trùng đêm trước |
| Sói | `Soi` | `SOI` | 20 | đúng | `CAN` | Cả bầy thống nhất chọn một mục tiêu để loại |
| Tiên tri | `TienTri` | `DAN` | 30 | đúng | `SOI_THONG_TIN` | Soi phe của một người, chỉ đọc thông tin |
| Phù thủy | `PhuThuy` | `DAN` | 40 | đúng | `CUU`, `DOC` | Một lọ cứu và một lọ độc, mỗi lọ dùng một lần trong cả ván |
| Thợ săn | `ThoSan` | `DAN` | 0 | sai | `BAN` | Khi bị loại thì được bắn một người bất kỳ — ghi đè `kichHoatKhiChet()` |
| Dân làng | `DanLang` | `DAN` | 0 | sai | — | Không có năng lực, chỉ thảo luận và bỏ phiếu |

`doUuTien` quyết định **cả** thứ tự gọi dậy ban đêm **lẫn** thứ tự áp dụng hiệu ứng khi
giải quyết. Vòng lặp điều phối không chứa tên vai nào — thêm vai mới chỉ là thêm lớp con.

---

## 2. Mười bốn quy tắc nghiệp vụ

Sáu quy tắc **tùy biến** do chủ phòng bật/tắt qua UC25, lưu trong `BoLuatChoi`. Tám quy
tắc **cố định** vì liên quan tới tính đúng đắn — không có công tắc nào cho chúng.

| Mã | Nội dung | Loại | Thuộc tính `BoLuatChoi` | Mặc định | Lớp áp dụng | Kiểm thử |
|---|---|---|---|---|---|---|
| BR01 | Sói thắng khi số Sói còn sống ≥ số người không phải Sói còn sống | Cố định | — | — | `BoKiemTraThangThua` | TC13, TC15 |
| BR02 | Dân thắng khi số Sói còn sống bằng 0 | Cố định | — | — | `BoKiemTraThangThua` | TC14 |
| BR03 | Đêm đầu tiên Sói được cắn bình thường | Tùy biến | `batDemDauCoChet` | Bật | `BoDieuPhoiVan` khi khởi tạo đêm 1 | Theo Q01 |
| BR04 | Phù thủy không được tự cứu mình | Tùy biến | `camPhuThuyTuCuu` | Bật | `PhuThuy.layDanhSachMucTieu()` | TC08, TC16 |
| BR05 | Bảo vệ được tự bảo vệ mình | Tùy biến | `choBaoVeTuDo` | Bật | `BaoVe.layDanhSachMucTieu()` | — |
| BR06 | Bảo vệ không được đỡ cùng một người hai đêm liên tiếp | Tùy biến | `camDoTrungDem` | Bật | `BaoVe.kiemTraRangBuoc()` | TC07, TC17 |
| BR07 | Mục tiêu đã được Bảo vệ đỡ thì Phù thủy được báo trước và không mất lọ thuốc | Cố định | — | — | `BoGiaiQuyetDem` | TC02, TC04 |
| BR08 | Phù thủy độc trúng người Sói vừa cắn thì chỉ tính một người chết | Cố định | — | — | `BoGiaiQuyetDem` | TC05 |
| BR09 | Thợ săn được bắn cả khi bị cắn lẫn khi bị treo cổ | Tùy biến | `thoSanBanKhiTreoCo` | Bật | `BoGiaiQuyetDem.xuLyDayChuyen()` | TC09, TC18 |
| BR10 | Thợ săn bắn trúng Thợ săn khác thì kích hoạt dây chuyền | Cố định | — | — | `BoGiaiQuyetDem.xuLyDayChuyen()` | TC10 |
| BR11 | Bỏ phiếu hòa thì không ai bị treo cổ | Tùy biến | `hoaPhieuKhongAiChet` | Bật | `PhienBauCu.xuLyHoa()` | TC11, TC19 |
| BR12 | Hết giờ chưa hành động thì bỏ qua lượt; riêng Sói chọn ngẫu nhiên trong các mục tiêu đã đề xuất | Cố định | — | — | `BoDieuPhoiVan` | TC12 |
| BR13 | Người mất kết nối vẫn giữ nhân vật, lượt bị bỏ lỡ coi như bỏ qua | Cố định | — | — | `BoDieuPhoiVan`, cổng thời gian thực | ST03 |
| BR14 | Người chết xem được kênh chung và kênh người chết, không xem được kênh Sói | Cố định | — | — | `KenhChat` và lớp con | ST05 |

**Ngữ nghĩa của `chophep(maQuyTac)`**: trả về *đúng* khi quy tắc đó **đang bật**. Tên
thuộc tính diễn tả trạng thái bật của quy tắc — ví dụ `choBaoVeTuDo = true` nghĩa là BR05
đang bật, Bảo vệ được tự đỡ. Lớp vai không đọc trực tiếp thuộc tính mà luôn hỏi qua
`chophep()`.

**Bất biến**: bộ luật được **sao chép** vào `VanDau` lúc bắt đầu ván và khóa tới hết ván
(TC20). Chủ phòng sửa bộ luật của phòng cho ván sau không ảnh hưởng ván đang chạy.

---

## 3. Bảng xung đột hiệu ứng đêm

Cơ sở để hiện thực các bước áp dụng trong `BoGiaiQuyetDem`. Mỗi dòng có ít nhất một
kịch bản kiểm thử.

| Tình huống | Kết quả | Quy tắc | Kiểm thử |
|---|---|---|---|
| Sói cắn A, Bảo vệ đỡ A | A sống. Phù thủy được báo trước là mục tiêu đã an toàn | BR07 | TC02 |
| Sói cắn A, Phù thủy cứu A | A sống. Phù thủy mất lọ cứu | — | TC03 |
| Sói cắn A, Bảo vệ đỡ A, Phù thủy cứu A | A sống. Phù thủy **không** mất lọ cứu | BR07 | TC04 |
| Sói cắn A, Phù thủy độc A | A chết. Chỉ tính một người chết | BR08 | TC05 |
| Sói cắn A, Phù thủy độc B | Cả A và B chết | — | TC06 |
| Bảo vệ đỡ chính mình | Hợp lệ, vẫn chịu ràng buộc không trùng đêm trước | BR05, BR06 | — |
| Phù thủy cứu chính mình | Không hợp lệ, hệ thống chặn lựa chọn | BR04 | TC08 |
| A chết và A là Thợ săn | A được bắn một người; người đó cũng là Thợ săn thì lặp tiếp | BR09, BR10 | TC09, TC10 |

**Thứ tự áp dụng trong bộ giải quyết**: ghi nhận người được bảo vệ → ghi nhận người bị
cắn → đối chiếu bảo vệ → đối chiếu thuốc cứu → áp dụng thuốc độc → xử lý dây chuyền →
đánh dấu chết → kiểm tra thắng thua. Không vai nào tự sửa trạng thái người chơi.

---

## 4. Thời lượng pha mặc định

Tài liệu gốc không nêu con số. Giá trị dưới đây là **đề xuất**, nằm trong cấu hình máy chủ
(không mã cứng), chỉnh sau buổi chơi thử đầu tiên.

| Bước | Thời lượng đề xuất | Hết giờ thì |
|---|---|---|
| Lượt Bảo vệ | 25 giây | Bỏ qua lượt (BR12) |
| Lượt Sói | 45 giây | Chọn ngẫu nhiên trong mục tiêu đã đề xuất; không ai đề xuất thì không cắn (BR12, Q07) |
| Lượt Tiên tri | 25 giây | Bỏ qua lượt |
| Lượt Phù thủy | 25 giây | Bỏ qua lượt |
| Thợ săn chọn mục tiêu | 15 giây | Không bắn ai (UC17 luồng 2a) |
| Công bố buổi sáng | 6 giây | Sang pha thảo luận |
| Thảo luận | 120 giây | Sang pha bỏ phiếu |
| Bỏ phiếu | 30 giây | Người chưa bầu coi như bỏ trắng (UC16 luồng 2a) |

---

## 5. Bộ kịch bản kiểm thử

### 5.1. Bộ giải quyết đêm và luật — mức đơn vị và tích hợp

Mã kịch bản dùng nguyên văn làm tên bài kiểm thử, ví dụ `it("TC05 — ...")`, để truy vết
được từ báo cáo xuống mã.

| Mã | Đầu vào | Kết quả mong đợi | Quy tắc |
|---|---|---|---|
| TC01 | Sói cắn A, không ai bảo vệ, không ai cứu | A chết | — |
| TC02 | Sói cắn A, Bảo vệ đỡ A | A sống, Phù thủy được báo mục tiêu an toàn | BR07 |
| TC03 | Sói cắn A, Phù thủy cứu A | A sống, lọ cứu bị trừ | — |
| TC04 | Sói cắn A, Bảo vệ đỡ A, Phù thủy cứu A | A sống, lọ cứu không bị trừ | BR07 |
| TC05 | Sói cắn A, Phù thủy độc A | Chỉ một người chết là A | BR08 |
| TC06 | Sói cắn A, Phù thủy độc B | Cả A và B chết | — |
| TC07 | Bảo vệ đỡ A hai đêm liên tiếp | Đêm thứ hai A bị loại khỏi danh sách chọn | BR06 |
| TC08 | Phù thủy chọn cứu chính mình | Hệ thống chặn | BR04 |
| TC09 | A bị treo cổ, A là Thợ săn, A bắn B | A và B chết trong cùng lượt | BR09 |
| TC10 | Thợ săn A bắn B, B cũng là Thợ săn, B bắn C | Cả ba chết | BR10 |
| TC11 | Hai người cùng số phiếu cao nhất | Không ai bị treo cổ | BR11 |
| TC12 | Hết giờ mà Sói chưa thống nhất | Chọn ngẫu nhiên trong các mục tiêu đã đề xuất | BR12 |
| TC13 | Còn 2 Sói và 2 Dân | Sói thắng ngay | BR01 |
| TC14 | Sói cuối cùng bị treo cổ | Dân thắng ngay | BR02 |
| TC15 | Sói cắn khiến số Sói bằng số Dân | Ván kết thúc ngay khi trời sáng, không mở pha thảo luận | BR01 |
| TC16 | **Tắt** BR04, Phù thủy cứu chính mình | Hệ thống cho phép — ngược với TC08 | BR04 tắt |
| TC17 | **Tắt** BR06, Bảo vệ đỡ A hai đêm liên tiếp | Hệ thống cho phép — ngược với TC07 | BR06 tắt |
| TC18 | **Tắt** BR09, Thợ săn bị treo cổ | Thợ săn không được bắn — ngược với TC09 | BR09 tắt |
| TC19 | **Tắt** BR11, hai người cùng số phiếu cao nhất | Bỏ phiếu lại một lần giữa những người hòa; vẫn hòa thì không ai chết (Q03) | BR11 tắt |
| TC20 | Đổi bộ luật khi ván đang chạy | Hệ thống chặn, bộ luật giữ nguyên tới hết ván | PC03 |

TC16–TC19 là bản đảo ngược của TC08, TC07, TC09, TC11. Nếu một cặp cho cùng kết quả thì
`BoLuatChoi` chưa được dùng đúng chỗ. TC15 kiểm chứng việc gọi kiểm tra thắng thua **ngay
sau** giải quyết đêm — bỏ sót thì ván chạy thừa một pha.

### 5.2. Kịch bản hệ thống

| Mã | Kịch bản | Tiêu chí đạt |
|---|---|---|
| ST01 | Ván 6 người, phe Dân thắng | Ván chạy trọn, công bố đúng phe, bản ghi đầy đủ |
| ST02 | Ván 8 người, phe Sói thắng | Như ST01 |
| ST03 | Người mất kết nối giữa pha đêm | Ván không hỏng, người đó bỏ lỡ lượt và kết nối lại được |
| ST04 | Phản ứng dây chuyền Thợ săn | Số người chết đúng, thứ tự công bố đúng |
| ST05 | Mở công cụ phát triển để tìm vai người khác | Không phản hồi nào của máy chủ chứa vai người chơi khác |

---

## 6. Điểm cần chốt trước khi viết mã

Phát hiện khi đọc tài liệu gốc ngày 29/09/2026. **Đã chốt ngày 19/10/2026: chấp nhận toàn bộ
đề xuất** (hạng mục ROADMAP 0.9). Cột *Quyết định* là luật chính thức; mã nguồn và kiểm thử
bám theo nó. Còn phải cập nhật lại vào tài liệu gốc `.docx`.

| Mã | Câu hỏi | Quyết định (chốt 19/10/2026) | Hạng mục áp dụng |
|---|---|---|---|
| Q01 | **BR03 tắt** nghĩa là gì? Tên thuộc tính `batDemDauCoChet` gợi ý "đêm 1 không ai chết", nhưng câu chữ BR03 chỉ nói về cú cắn | Tắt BR03 thì đêm 1 bỏ lượt Sói và Phù thủy không được dùng độc — đúng tên thuộc tính: đêm 1 không ai chết | 2.2 |
| Q02 | **BR09 tắt**: Thợ săn chết vì thuốc độc hoặc bị Thợ săn khác bắn có được bắn không? | Giữ đúng mã giả mục 16.3: chỉ chặn trường hợp **treo cổ**, mọi cách chết khác vẫn được bắn | 1.6 |
| Q03 | **BR11 tắt**: TC19 nói "áp dụng quy tắc phụ đã cấu hình" nhưng tài liệu chưa định nghĩa quy tắc phụ | Bỏ phiếu lại **một lần** chỉ giữa những người hòa, 20 giây; vẫn hòa thì không ai chết | 1.7 |
| Q04 | Ngưỡng **hủy ván do mất kết nối** chưa có con số. Bảng trạng thái ghi "bất kỳ trạng thái nào" nhưng sơ đồ 11.1 chỉ vẽ từ hai trạng thái | Hủy khi quá một nửa số người còn sống mất kết nối liên tục quá 120 giây; áp dụng mọi trạng thái trừ `KetThuc` | 4.9 |
| Q05 | **Lộ thông tin qua thời lượng đêm**: mã giả 16.1 lọc vai từ người *còn sống*, nên khi Bảo vệ chết thì đêm ngắn hẳn — người chơi suy ra được | Duyệt theo **cấu hình vai** (vốn công khai), không theo người còn sống. Bước của vai không còn ai sống vẫn chờ một khoảng ngẫu nhiên 8–15 giây | 2.2 |
| Q06 | **Ràng buộc cấu hình vai**: UC11 ghi "số Sói *nhỏ hơn* một phần ba" — 6 người chỉ được 1 Sói. Mỗi vai đặc biệt được mấy người? BR10 ngầm cho phép nhiều Thợ săn | Giữ nguyên chữ: 1 ≤ Sói < n/3. Bảo vệ, Tiên tri, Phù thủy tối đa 1. Thợ săn tối đa 2. Dân làng là phần còn lại | 1.2 |
| Q07 | Hết giờ mà **không Sói nào đề xuất** mục tiêu thì sao? | Đêm đó không có ai bị cắn | 2.2 |
| Q08 | Phù thủy **dùng cả hai lọ trong một đêm** được không? UC13 viết "chọn cứu, giết hoặc bỏ qua" | Mỗi đêm tối đa một hành động, đúng câu chữ UC13 | 1.3 |
| Q09 | Người chết — kể cả người bị treo cổ — có **bị lộ vai** khi công bố không? | Không. Vai chỉ mở ở màn hình kết thúc (MH08). Người chết chỉ biết vai của chính mình | 2.6 |
| Q10 | Kênh chung có mở trong **pha bỏ phiếu** không? | Có — mở ở pha thảo luận và pha bỏ phiếu, đóng ở pha đêm | 1.9 |
| Q11 | **Chủ phòng rời phòng** khi ván chưa bắt đầu thì sao? | Chuyển quyền cho người vào phòng sớm nhất còn lại; phòng trống thì đóng | 4.3 |

---

## 7. Yêu cầu phi chức năng được nhắc tới

Định nghĩa đầy đủ nằm trong tài liệu Giai đoạn 1. Ba yêu cầu dưới đây chi phối kiến trúc
trực tiếp — xem `ARCHITECTURE.md` mục 2.

| Mã | Ý nghĩa | Hệ quả kiến trúc |
|---|---|---|
| PC03 | Tính xác định: cùng đầu vào cho cùng kết quả, không phụ thuộc thứ tự bấm nút | Ghi ý định trước, giải quyết tập trung sau; bộ luật bất biến trong ván |
| PC04 | Thông tin vai của một người tuyệt đối không được gửi xuống trình duyệt người khác | Máy chủ là trọng tài duy nhất; mọi gói tin gửi đi là *góc nhìn* đã lọc theo người nhận |
| PC09 | Thêm vai mới không đòi đổi cấu trúc bảng | Trạng thái riêng của vai lưu ở cột JSON `trang_thai_ky_nang` |
