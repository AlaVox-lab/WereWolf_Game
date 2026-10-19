# PROJECT_STATE.md

> **Mục đích**: sổ bàn giao ca của dự án. Đọc tệp này là biết ngay dự án đang ở đâu, vừa
> làm gì, đang vướng gì và việc tiếp theo là gì — không cần hỏi ai.
>
> **Nhịp cập nhật**: cuối mỗi tuần, và mỗi khi cắt bản phát hành.
>
> Tệp này chỉ ghi **hiện tại và quá khứ gần**. Kế hoạch thuộc `ROADMAP.md`. Mô tả kiến trúc
> thuộc `ARCHITECTURE.md`. Luật chơi thuộc `game-rules.md`.

---

## Ảnh chụp nhanh

| Mục | Giá trị |
|---|---|
| Cập nhật lần cuối | 2026-10-19 |
| Phiên bản hiện tại | **`v0.2.0`** — Lõi miền, phát hành 19/10 ([release](https://github.com/AlaVox-lab/WereWolf_Game/releases/tag/v0.2.0)). Bỏ qua `v0.1.0` vì Giai đoạn 0 chỉ còn 0.9, không phải mã |
| Giai đoạn học phần | Đã qua M1. Nếu giả định tuần 3 ngày 29/09 là đúng thì nay khoảng **tuần 6** — mốc M2 đã qua, M3 cuối tuần này |
| Giai đoạn MVP | **Giai đoạn 0** xong 9/10, còn 0.9 · **Giai đoạn 1 hoàn thành** (12/12) · **Giai đoạn 2** xong 4/11 (2.1–2.3) |
| Tuần học kỳ | **Chưa xác nhận** ngày bắt đầu học kỳ |
| Có mã nguồn chưa | **Có công cụ, mới bắt đầu mã nghiệp vụ**: điểm cuối `/api/health`, trang tạm, `domain/chung/` (kiểu dùng chung, hai cổng `DongHo`, `NguonNgauNhien`), `domain/luat/` (`BoLuatChoi`, `CauHinhVai`), `domain/vaitro/` (`VaiTro` và sáu lớp con), `domain/van/` (`NguoiChoi`, `VanDau`, `LuotChoi`, `KetQuaDem`, `NhatKyVan`), `domain/baucu/` (`PhienBauCu`, `PhieuBau`), `domain/kenh/` (`KenhChat` và ba lớp con), `application/BoGiaiQuyetDem`, `application/BoKiemTraThangThua`, `application/BoChiaVai` |
| Kho mã | Riêng tư [`AlaVox-lab/WereWolf_Game`](https://github.com/AlaVox-lab/WereWolf_Game), nhánh `main` và `dev`. CI xanh |
| Quyết định kiến trúc | ADR-0001 TypeScript toàn tầng — **Đã chấp nhận** 19/10 |
| Điểm mơ hồ trong luật | Q01–Q11 **đã chốt** 19/10. **Q12, Q13 mới, chưa chốt** — đã cài theo đề xuất, không chặn việc gì |
| Kiểm thử tự động | 225 bài xanh (1 sức khỏe, 10 `chung`, 30 `luat`, 25 `vaitro`, 17 `van`, 24 `BoGiaiQuyetDem`, 15 `baucu`, 13 `BoKiemTraThangThua`, 8 `kenh`, 8 `trangthai`, 10 `BoChiaVai`, 4 đối chiếu sơ đồ, 13 `CongLuaChon`, 29 pha đêm, 18 pha ngày) · độ phủ dòng lệnh 99 % · **20 / 20 TC** · 0 / 5 ST (ST01, ST02, ST04 ở 2.10) |
| Thiết kế giao diện | Chưa làm — tới Giai đoạn 3 thì **chờ người dùng kết nối Higgsfield** và đưa ý tưởng, không tự thiết kế |

**Một câu tóm tắt trạng thái**: kho đã dựng xong công cụ — `npm run dev` chạy máy chủ và trang
web tạm, `npm test` / `lint` / `typecheck` xanh, lint chặn được lõi miền nhập ra ngoài. Luật
mơ hồ và bộ công nghệ đã chốt. Lõi miền vừa có mảnh đầu tiên (1.1). Còn thiếu Git và lần chạy
thử PostgreSQL.

**Phân công** (theo mục 1.6 tài liệu gốc — **cần gán tên** ở hạng mục 0.9):

| Nhãn | Phạm vi | Thành viên |
|---|---|---|
| A | Pha đêm — UC12, UC13, UC14, UC17; phân cấp `VaiTro`, `BoGiaiQuyetDem` | *chưa gán* |
| B | Pha ngày, kết thúc, kiểm duyệt — UC15, UC16, UC18–UC20, UC21–UC24 | *chưa gán* |
| C | Tài khoản, phòng chơi, Use Case Diagram, tổng hợp tài liệu | *chưa gán* |

Ba thành viên: Trần Khánh Ngọc (2424802010186), Nguyễn Thanh Sơn (2424802010044), Võ Minh Tự
(2424802010473).

---

## Đã hoàn thành

### Tuần 1–2 — Lập kế hoạch

- [x] Tài liệu Giai đoạn 1 nộp giảng viên (mốc M1)
- [x] Tài liệu dự án toàn diện bản 1.0 bao cả bốn giai đoạn: 4 tác nhân, 25 use case, đặc tả
      chi tiết 8 use case lõi, 14 quy tắc nghiệp vụ, 7 sơ đồ PlantUML, thiết kế lớp, dữ liệu,
      kiến trúc, 12 màn hình, thuật toán lõi, 20 + 5 kịch bản kiểm thử

### Tuần 3 — Khởi tạo kho mã

**Khung và tài liệu bối cảnh** — hạng mục 0.0

- [x] Khung thư mục theo mục 15.2 tài liệu gốc, mở rộng thành kho nhiều gói `apps/server`,
      `apps/web`, `packages/shared` — `ARCHITECTURE.md` mục 4.2
- [x] `docs/ARCHITECTURE.md` — năm nguyên tắc bất di dịch, mô hình miền, bốn khuôn mẫu, hợp đồng
      máy chủ – giao diện, lược đồ dữ liệu, quy ước đặt tên
- [x] `docs/ROADMAP.md` — 9 giai đoạn, 81 hạng mục đánh số, định nghĩa MVP và tiêu chí đạt
- [x] `docs/game-rules.md` — nguồn sự thật về luật trong kho: 6 vai, 14 quy tắc có cột lớp áp
      dụng và kiểm thử, bảng xung đột, thời lượng pha đề xuất, 25 kịch bản kiểm thử
- [x] `docs/diagrams/` — chép nguyên bảy sơ đồ PlantUML
- [x] `docs/adr/` — mẫu bản ghi và ADR-0001 đề xuất bộ công nghệ
- [x] `CLAUDE.md`, `README.md`, `.gitignore`, `.gitattributes`, `.editorconfig`

**Phát hiện khi đọc tài liệu gốc**: 11 điểm luật chưa rõ, ghi ở `game-rules.md` mục 6. Đáng chú
ý nhất là **Q05** — mã giả mục 16.1 lọc vai từ người còn sống, khiến độ dài pha đêm để lộ việc
Bảo vệ hoặc Phù thủy đã chết — và **Q03**, kịch bản TC19 nhắc tới một "quy tắc phụ" chưa từng
được định nghĩa.

### 19/10 — Chốt luật, dựng công cụ, mảnh lõi miền đầu tiên

**Chốt** — hạng mục 0.9 (một phần)

- [x] Q01–Q11 chốt theo toàn bộ đề xuất — `game-rules.md` mục 6
- [x] ADR-0001 chuyển sang *Đã chấp nhận*
- [ ] Còn: gán tên A/B/C, xác nhận tuần học kỳ

**Công cụ** — hạng mục 0.2, 0.3, 0.4, 0.5, 0.7; viết sẵn 0.6, 0.8

- [x] npm workspaces, `tsconfig.base.json` chế độ `strict`, ESLint, Prettier; lệnh gốc `dev`,
      `test`, `lint`, `typecheck`, `format`, `db:up`, `db:down`
- [x] `apps/server`: Express + `tsx` + Vitest, `GET /api/health` có kiểm thử
- [x] `packages/shared`: gói TypeScript thuần, cả máy chủ và web nhập được
- [x] `apps/web`: Vite + React + Tailwind, trang tạm gọi `/api/health` qua proxy — đã chạy
      thử `npm run dev`, gọi được qua cả cổng 3000 và 5173
- [x] Rào chắn phụ thuộc trong `eslint.config.js` — đã thử bằng tệp nhập sai, bắt đủ 6 lỗi
- [x] `infra/docker-compose.yml` PostgreSQL 17 — cú pháp hợp lệ, **chưa chạy** vì Docker tắt
- [x] `.github/workflows/ci.yml` — **chưa chạy** vì chưa có kho GitHub
- [x] `AGENTS.md` cho Codex và trợ lý khác, cùng nội dung `CLAUDE.md` (thêm ngày 30/09)

**Lõi miền** — hạng mục 1.1

- [x] `domain/chung/`: `Phe`, `LoaiHanhDong`, `MaQuyTac`, `TrangThaiVan`, `LoiNghiepVu` kèm
      `MaLoi`; cổng `DongHo` + `DongHoGia` tua được; cổng `NguonNgauNhien` + `NgauNhienCoHat`
      theo hạt giống — 10 bài kiểm thử

**Lõi miền** — hạng mục 1.2

- [x] `domain/luat/BoLuatChoi`: sáu thuộc tính, `chophep`, `datQuyTac`, `kiemTraHopLe`,
      `layMoTa`, `saoChep` trả bản khóa và đóng băng; quy tắc cố định luôn bật
- [x] `domain/luat/CauHinhVai`: `kiemTraHopLe(soNguoi)` trả danh sách vi phạm có mã theo UC11
      bước 3 và Q06; thêm `LoaiVai` vào `domain/chung/`
- [x] 30 bài kiểm thử, gồm một bài đối chiếu **mọi tổ hợp vai** cho phòng 6–12 người với công
      thức Q06 viết lại độc lập
- [x] Class Diagram: bổ sung phương thức của `BoLuatChoi` và lớp `CauHinhVai`
- [x] Phát hiện **Q12**: UC25 nói kiểm tra "tổ hợp không hợp lệ" nhưng không nêu tổ hợp nào bị cấm

**Lõi miền** — hạng mục 1.3

- [x] `domain/vaitro/`: lớp trừu tượng `VaiTro` với Template Method `thucHienLuot()` và
      `kichHoatKhiChet()`; sáu lớp con `DanLang`, `BaoVe`, `Soi`, `TienTri`, `PhuThuy`, `ThoSan`
- [x] Giao diện `NguoiChoiTrongVan`, `VanChiDoc` để vai không phụ thuộc vòng với `NguoiChoi`;
      `HanhDongDem` tạo sớm trong `domain/van/`
- [x] 25 bài kiểm thử, gồm **TC07, TC08, TC16, TC17** và Q08
- [x] Class Diagram: cập nhật chữ ký `VaiTro`, các lớp con và `HanhDongDem`
- [x] Phát hiện **Q13**: tài liệu không nêu Sói có cắn đồng loại, Tiên tri có soi chính mình,
      Phù thủy có độc chính mình được không

**Lõi miền** — hạng mục 1.4

- [x] `domain/van/`: `NguoiChoi`, `VanDau` (khớp hai giao diện của 1.3), `LuotChoi`, `KetQuaDem`,
      `NhatKyVan` chỉ ghi thêm, `NguyenNhanChet`
- [x] `VanDau` tự giữ bản `saoChep()` của bộ luật; `LuotChoi` chặn trùng ý định theo ràng buộc 12.3
- [x] 17 bài kiểm thử, gồm một bài dùng `VanDau` thật làm ngữ cảnh cho `BaoVe`
- [x] Class Diagram: bổ sung `VanDau`, `NguoiChoi`, `LuotChoi`, `KetQuaDem`, `NhatKyVan`

**Lõi miền** — hạng mục 1.5

- [x] `application/BoGiaiQuyetDem`: chuỗi bốn mắt xích Bảo vệ → Cắn → Cứu → Độc theo `doUuTien`;
      trừ lọ thuốc và cập nhật mục tiêu đêm trước của Bảo vệ chỉ ở bước này
- [x] `xemNanNhan()` để báo trước cho Phù thủy theo BR07
- [x] 12 bài kiểm thử, gồm **TC01–TC06** và một bài chứng minh kết quả không phụ thuộc thứ tự
      ghi ý định (PC03)

**Lõi miền** — hạng mục 1.6

- [x] `BoGiaiQuyetDem.xuLyDayChuyen()`: hàng đợi Thợ săn theo mục 16.3 tài liệu gốc, bất đồng
      bộ, dùng chung ban đêm và sau treo cổ; BR09 tắt chỉ chặn chết vì treo cổ (Q02)
- [x] 12 bài kiểm thử, gồm **TC09, TC10, TC18**, Q02, và một bài chứng minh luôn dừng khi hai
      Thợ săn cùng muốn bắn nhau

**Lõi miền** — hạng mục 1.7

- [x] `domain/baucu/`: `PhieuBau`, `PhienBauCu` — ghi phiếu có bỏ trắng, mỗi người một phiếu,
      kiểm phiếu, xử lý hòa theo BR11 và Q03, mở vòng bầu lại
- [x] `LuotChoi.ganPhienBauCu()` — phiên chính và vòng bầu lại
- [x] 15 bài kiểm thử, gồm **TC11, TC19**

**Lõi miền** — hạng mục 1.8

- [x] `application/BoKiemTraThangThua`: đúng công thức mục 16.4, trả `KetQuaThangThua`
- [x] 13 bài kiểm thử, gồm **TC13, TC14** và bảng biên S = 0, S = D, S = D − 1

**Lõi miền** — hạng mục 1.9

- [x] `domain/kenh/`: `KenhChat` trừu tượng (quyền gửi theo Template Method), `KenhChung`,
      `KenhSoi`, `KenhNguoiChet` theo bảng quyền mục 5.2, BR14 và Q10
- [x] 8 bài kiểm thử, gồm ma trận đủ 240 ô (3 kênh × 4 kiểu người × 10 trạng thái × lượt Sói)
      đối chiếu với bảng luật viết độc lập

**Lõi miền** — hạng mục 1.10

- [x] `domain/van/trangthai/`: mẫu State — lớp trừu tượng `TrangThaiVanDau` và mười lớp con theo
      sơ đồ 11.1; hủy ván từ mọi trạng thái chưa kết thúc (Q04)
- [x] `VanDau.chuyenPha()`, `ketThuc(pheThang)`, `huyVan()`, `choPhepDoiBoLuat()`, `pheThang`
- [x] 8 bài kiểm thử, gồm ma trận 90 ô (10 trạng thái × 9 sự kiện) đối chiếu sơ đồ và **TC20**

**Lõi miền** — hạng mục 1.11

- [x] `application/BoChiaVai` (Factory): bảng `LoaiVai` → lớp, xáo trộn Fisher–Yates qua
      `NguonNgauNhien`, kiểm cấu hình trước khi gán (UC12 luồng 2a)
- [x] 10 bài kiểm thử: cùng hạt giống cùng kết quả; 60 000 lần xáo cho 6 hoán vị đều nhau;
      10 000 lần chia 6 người, mỗi ghế nhận Sói khoảng 1/6

**Khép Giai đoạn 1** — hạng mục 1.12, cùng 0.6

- [x] Đối chiếu Class Diagram ↔ mã: bỏ `chuyenPha()` trùng; `KetQuaDem`, `PhienBauCu` chuyển về
      `LuotChoi`; `mucTieuDemTruoc` là mã người chơi; vẽ thêm `VanChiDoc`, `NguoiChoiTrongVan`;
      ghi chú rõ lớp chưa cài
- [x] `tests/docs/soDoLop.test.ts` — đối chiếu sơ đồ ↔ mã hai chiều, chạy trong CI; đã thử đổi tên
      một phương thức trên sơ đồ, bài kiểm thử báo đỏ đúng chỗ
- [x] `npm run so-do` — xuất 7 sơ đồ SVG + PNG bằng PlantUML trong Docker; cả 7 dựng không lỗi
- [x] `docs/diagrams/README.md` — bảng khác biệt so với Hình 9.1 để cập nhật tài liệu gốc
- [x] Đo độ phủ bằng `@vitest/coverage-v8`: toàn bộ 99 %, `domain/` 96–100 % từng thư mục
- [x] **0.6**: `npm run db:up` lên PostgreSQL 17.11 *healthy*
- [x] Phát hành **`v0.2.0` — Lõi miền** trên GitHub

**Điều phối** — hạng mục 2.1

- [x] `application/BoHenGio` — tác nhân AC04, một đồng hồ cho mỗi mã, trả thời điểm hết hạn
- [x] `application/CongLuaChon` — lời hứa giải quyết bởi lệnh người chơi hoặc hết giờ; lựa chọn
      sai không đóng lời mời
- [x] 13 bài kiểm thử, gồm cắm `CongLuaChon` thật vào dây chuyền Thợ săn với đồng hồ giả
      (UC17 luồng 2a); `soDoLop.test.ts` bắt được hai lớp mới chưa lên sơ đồ — đã thêm

**Điều phối** — hạng mục 2.2a (2.2 tách đôi thành 2.2a và 2.2b, người dùng đồng ý)

- [x] `application/BoDieuPhoiVan.xuLyPhaDem()`: bước đêm sinh từ `doUuTien` của vai trong cấu
      hình; vai đã chết vẫn chờ giả 8–15 giây (Q05); lời mời kiểm lựa chọn bằng chính
      `VaiTro.thucHienLuot()`; kết quả soi; Phù thủy biết nạn nhân; giải quyết + dây chuyền Thợ săn
- [x] `application/CauHinhThoiGian` — thời lượng bước là cấu hình
- [x] 16 bài kiểm thử, chạy bằng đồng hồ giả và bộ điều khiển kịch bản: thứ tự gọi, đêm đầy đủ,
      bỏ lượt khi hết giờ, bước giả Q05, lựa chọn sai, Thợ săn chết ban đêm
- [x] `BoDieuPhoiVan` lên Class Diagram, gỡ khỏi danh sách chưa cài

**Điều phối** — hạng mục 2.2b

- [x] `VaiTro.laHanhDongTapThe()` — chỉ `Soi` đúng; bộ điều phối rẽ theo khả năng của vai
- [x] Lượt tập thể: Sói đề xuất, được mời lại để đổi ý trong thời gian còn lại; chốt sớm khi
      đồng thuận; hết giờ chọn ngẫu nhiên trong mục tiêu đã đề xuất (BR12); không ai đề xuất thì
      không cắn (Q07)
- [x] `layThongTinNanNhan()` — dữ liệu báo trước cho Phù thủy (BR07)
- [x] BR03 tắt: đêm 1 bỏ lượt Sói, Phù thủy không được độc (Q01)
- [x] Bộ điều khiển kịch bản tách ra `tests/application/kichBan.ts`, nhận dãy câu trả lời và
      ghi lại lựa chọn bị từ chối
- [x] 13 bài kiểm thử, gồm **TC12** (12 hạt giống, cả hai mục tiêu đều có thể bị chọn; cùng hạt
      giống cùng kết quả)

**Điều phối** — hạng mục 2.3

- [x] `BoDieuPhoiVan.sauDem()`, `xuLyPhaNgay()`, `chayVan()`: công bố không kèm nguyên nhân,
      thảo luận có đếm giờ, bỏ phiếu qua `CongLuaChon`, vòng bầu lại (Q03), treo cổ, dây chuyền
      Thợ săn; `kiemTraVaChuyen()` gọi đúng hai lần mỗi lượt
- [x] `CauHinhThoiGian` thêm thời lượng công bố, thảo luận, bỏ phiếu, bầu lại
- [x] 18 bài kiểm thử, gồm **TC15** và TC09, TC11, TC14, TC18, TC19 chạy qua bộ điều phối thật;
      hai ván trọn vẹn — phe Dân thắng ngày 1, phe Sói thắng lúc sáng đêm 4
- [x] **20 / 20 kịch bản TC** đã có kiểm thử tự động

---

## Đang làm

**Giai đoạn 2 — Điều phối ván và người chơi ảo.** Hạng mục kế tiếp: **2.4** — `BoQuanLyKenh`: kênh nào mở theo pha, kiểm quyền gửi tin nhắn.

---

## Việc tiếp theo

### Theo thứ tự

1. **Mời hai thành viên còn lại và giảng viên** vào kho GitHub (phần còn lại của 0.1)
2. **0.9 phần còn lại** — gán tên cho nhãn A/B/C, xác nhận tuần học kỳ để chỉnh lịch `ROADMAP.md`
4. **Cập nhật tài liệu gốc `.docx`** theo bảng khác biệt ở `docs/diagrams/README.md` — trước mốc M4
5. **2.2 → 2.10** — điều phối ván và người chơi ảo
6. **Chốt Q12, Q13** — không chặn việc gì, đã cài theo đề xuất

### Chờ giảng viên

- **Ràng buộc ngôn ngữ lập trình** — ADR-0001 đã chọn TypeScript; nếu giảng viên yêu cầu Java
  hoặc C# thì đổi càng sớm càng rẻ
- **Cho phép viết mã sớm hơn tuần 12** — lộ trình kéo lõi miền lên trước mốc M4

---

## Đang vướng

| Vấn đề | Ảnh hưởng | Hướng xử lý |
|---|---|---|
| Không bật được quy tắc bảo vệ nhánh | Kho riêng tư gói miễn phí — ai cũng đẩy thẳng được lên `main` | Tuân thủ tự giác: việc mới đi qua pull request vào `dev`. Bật lại nếu chuyển kho công khai |
| Chưa xác nhận tuần học kỳ | Có thể đã trễ mốc M2, M3 so với `ROADMAP.md` | Xác nhận rồi dời bảng thời gian |
| Nhãn A/B/C chưa gán người | Chưa phân được hạng mục | Gán ở 0.9 |

---

## Quyết định đã chốt

Ghi vắn tắt để tránh bàn lại. Phần lớn đến từ tài liệu gốc; chi tiết kỹ thuật xem
`ARCHITECTURE.md` và `docs/adr/`.

| Quyết định | Nguồn |
|---|---|
| Sáu vai cố định; vai mới chỉ vào mục hướng phát triển | Tài liệu gốc 1.2, 1.7 |
| 14 quy tắc; 6 tùy biến (BR03, 04, 05, 06, 09, 11), 8 cố định | Tài liệu gốc 1.4 |
| Chủ phòng là tác nhân **kế thừa** Người chơi; Bộ hẹn giờ là tác nhân không phải người; vai trò trong ván **không** là tác nhân | Tài liệu gốc 5.2 |
| Kiến trúc ba tầng; toàn bộ luật ở tầng nghiệp vụ | Tài liệu gốc 13.1 |
| Ghi ý định trước, giải quyết tập trung sau | Tài liệu gốc 7.3 |
| Bộ luật sao chép vào ván và bất biến tới hết ván | Tài liệu gốc 9.3 |
| Sáu mẫu: State, Template Method, Chain of Responsibility, Factory, Observer, Strategy | Tài liệu gốc 13.2 |
| Người chơi ảo dùng chung luồng xử lý với người thật; chỉ bật ở môi trường phát triển | Tài liệu gốc 17.4 |
| Dự phòng đồng bộ: truy vấn định kỳ 1–2 giây | Tài liệu gốc 13.3 |
| Kho nhiều gói: `apps/server`, `apps/web`, `packages/shared` | Khởi tạo kho, 29/09 |
| Tên lớp, thuộc tính, phương thức miền và tên bảng **giữ đúng tiếng Việt không dấu như sơ đồ**; mã kỹ thuật tiếng Anh | `ARCHITECTURE.md` mục 13.1 |
| `packages/shared` chỉ chứa kiểu dữ liệu công khai, không chứa luật | `ARCHITECTURE.md` mục 4.2 |
| Mọi dữ liệu ván gửi xuống trình duyệt đi qua **một hàm** `taoGocNhin()` | `ARCHITECTURE.md` mục 8 |
| Đồng bộ bằng **ảnh chụp góc nhìn** sau mỗi lần đổi trạng thái — kết nối lại không cần cơ chế riêng | `ARCHITECTURE.md` mục 8 |
| Trình duyệt không bao giờ tự chuyển pha; chỉ đếm ngược tới thời điểm hết hạn máy chủ gửi | `ARCHITECTURE.md` mục 7 |
| Trợ lý AI chỉ commit/push khi người dùng yêu cầu rõ trong chat; mặc định soạn sẵn message | 19/10 — `CLAUDE.md`, `AGENTS.md` |
| Q01–Q11 chốt theo toàn bộ đề xuất | 19/10 — `game-rules.md` mục 6 |
| Bộ công nghệ TypeScript toàn tầng | 19/10 — ADR-0001 |
| Rào chắn phụ thuộc bằng ESLint, không dùng công cụ riêng | `ARCHITECTURE.md` mục 4.1 |
| `NgauNhienCoHat` và `DongHoGia` thuần, đặt trong `domain/chung/`; bản cài trên giờ hệ thống và nguồn ngẫu nhiên thật sẽ ở `infrastructure/` | Hạng mục 1.1 |
| Thiết kế giao diện chờ người dùng kết nối Higgsfield | 19/10 |
| Commit mang tác giả `AlaVox-lab`, không đổi sang tên thật từng thành viên | 19/10 — nhóm chấp nhận |

---

## Ghi chú kỹ thuật đáng nhớ

Những phát hiện trong quá trình làm, ghi lại để không phải điều tra lại.

**Python trên Windows in tiếng Việt ra ống dẫn thì hỏng**

`print()` một chuỗi có dấu khi đầu ra bị chuyển hướng sẽ ném `UnicodeEncodeError: 'charmap'
codec can't encode` vì Python dùng bảng mã `cp1252` của hệ thống. Chạy kèm biến môi trường
`PYTHONIOENCODING=utf-8`. Gặp lần đầu khi trích văn bản từ tệp `.docx` tài liệu gốc.

**Heredoc dài trong Bash tool trên Windows có thể hỏng**

Một lệnh `cat <<'EOF'` gộp nhiều tệp TypeScript bị báo `unexpected EOF while looking for
matching '` dù các khối đã đóng đúng — không tệp nào được tạo. Tạo tệp mã bằng công cụ ghi tệp
từng tệp một thay vì heredoc dài.

**Trích nội dung tài liệu gốc**

Tệp `.docx` nằm ngoài kho mã. Trích văn bản kèm bảng bằng `zipfile` + `xml.etree` đọc
`word/document.xml` là đủ, không cần cài `pandoc`. Tài liệu không có hình nhúng — mọi sơ đồ ở
dạng mã PlantUML.

---

## Cách cập nhật tệp này

Cuối mỗi tuần, hoặc mỗi khi cắt bản phát hành:

1. Cập nhật bảng **Ảnh chụp nhanh**
2. Chuyển mục từ **Đang làm** sang **Đã hoàn thành**, ghi mã hạng mục ROADMAP tương ứng
3. Rà lại **Việc tiếp theo**, xếp lại thứ tự nếu ưu tiên thay đổi
4. Cập nhật **Đang vướng** — bỏ mục đã giải quyết, thêm mục mới
5. Bổ sung **Quyết định đã chốt** nếu có
6. Bổ sung **Ghi chú kỹ thuật** nếu phát hiện điều gì đáng nhớ

Viết lại dựa trên **các hạng mục đã đánh dấu trong `ROADMAP.md` và lịch sử pull request**,
không viết theo trí nhớ. Commit riêng với tiền tố `docs(state):`.
