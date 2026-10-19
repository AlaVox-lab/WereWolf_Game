# ROADMAP.md

> **Mục đích**: lộ trình từ khung thư mục rỗng tới **MVP chơi được** và tới bản nộp cuối
> kỳ. Đây là nơi ghi **kế hoạch tương lai**, và là **danh sách việc làm tuần tự** — mỗi lần
> làm, lấy hạng mục chưa đánh dấu đầu tiên theo đúng số thứ tự.
>
> Không ghi kế hoạch vào `ARCHITECTURE.md` — tệp đó chỉ mô tả hiện trạng. Không ghi tiến độ
> chi tiết, vướng mắc hay ghi chú kỹ thuật vào đây — những thứ đó thuộc `PROJECT_STATE.md`.

---

## Cách dùng tệp này

**Mã hạng mục** `G.N` — `G` là giai đoạn, `N` là thứ tự trong giai đoạn. Làm theo thứ tự
tăng dần. Hạng mục có ghi *song song* thì làm được cùng lúc với hạng mục khác.

**Người phụ trách** theo phân công mục 1.6 tài liệu gốc:

| Nhãn | Phạm vi | Chủ trì |
|---|---|---|
| `[A]` | Pha đêm — UC12, UC13, UC14, UC17 | Phân cấp `VaiTro`, `BoGiaiQuyetDem` |
| `[B]` | Pha ngày và kết thúc — UC15, UC16, UC18, UC19, UC20, gói Kiểm duyệt | `PhienBauCu`, `KenhChat`, `BoKiemTraThangThua` |
| `[C]` | Gói Tài khoản, gói Phòng chơi, Use Case Diagram, tổng hợp tài liệu | Hạ tầng, phòng, giao diện ngoài ván |
| `[ALL]` | Cả nhóm | |

**Một hạng mục chỉ được đánh dấu `[x]` khi** đạt đủ tiêu chí ghi dưới nó, kiểm thử liên
quan chạy xanh, và tài liệu bị ảnh hưởng đã cập nhật (`ARCHITECTURE.md` nếu đụng khuôn mẫu,
`game-rules.md` nếu đụng luật, sơ đồ nếu đổi chữ ký lớp).

**Quy trình một hạng mục**: đọc `PROJECT_STATE.md` → làm trên nhánh `feat/<ma-hang-muc>-<mo-ta>`
→ viết kiểm thử trước hoặc cùng lúc → cập nhật tài liệu → mở pull request vào `dev` → một
thành viên khác duyệt → hợp nhất → đánh dấu ở đây.

---

## Ràng buộc thời gian

Tuần tính theo học kỳ. **Giả định hiện đang ở tuần 3** (M1 đã nộp cuối tuần 2) — cần xác nhận
ngày bắt đầu học kỳ, xem `PROJECT_STATE.md`.

| Mốc | Thời điểm | Nội dung theo tài liệu gốc | Mốc MVP tương ứng |
|---|---|---|---|
| M1 | Cuối tuần 2 | Nộp tài liệu Lập kế hoạch | Đã qua |
| M2 | Cuối tuần 3 | Chốt Class Diagram lõi và bảng quy tắc | G0 xong, Q01–Q11 chốt |
| M3 | Cuối tuần 6 | Hoàn tất Phân tích | G1, G2 xong — `v0.3.0` |
| M4 | Cuối tuần 11 | Hoàn tất Thiết kế | G3, G4, G5 xong — `v0.5.0` |
| — | Tuần 12 | — | **MVP `v1.0.0`** sau G6 |
| M5 | Cuối tuần 14 | Bản chạy thử hoàn chỉnh | G7 xong — `v1.3.0` |
| M6 | Tuần 15 | Nộp báo cáo cuối kỳ | G8 |

**Vì sao viết mã sớm hơn tài liệu gốc** (tài liệu hẹn xây dựng ở tuần 12–14): lõi miền là
nơi kiểm chứng Class Diagram rẻ nhất. Chữ ký lớp sai sẽ lộ ra ngay khi viết kiểm thử TC01–TC20,
lúc còn sửa được sơ đồ trước mốc M4. Tài liệu gốc cũng ghi Phần III, IV "có thể điều chỉnh
sau khi chơi thử ván đầu tiên" — nên càng chơi thử sớm càng tốt.

```
Tuần         3    4    5    6    7    8    9    10   11   12   13   14   15
G0 Dựng nền  ██
G1 Lõi miền  ░░██ ████ ██
G2 Điều phối           ░░██ ██
G3 Thiết kế       ████ ████ ████ ██                              (song song, [C])
G4 Máy chủ                       ████ ████ ██
G5 Giao diện                               ░░██ ████ ██
G6 MVP                                               ████
G7 Mở rộng                                           ░░░░ ████ ████
G8 Báo cáo                                                          ████
```

---

## Định nghĩa MVP

**MVP là**: một nhóm bạn mở trình duyệt, đăng ký, vào chung một phòng bằng mã, chủ phòng
chọn bộ vai và bật tắt luật, rồi **chơi trọn một ván 6–12 người với đủ sáu vai và mười bốn
quy tắc**, máy tự làm quản trò từ đầu tới lúc công bố phe thắng và mở nhật ký. Thiếu người
thì thêm người chơi ảo.

| Trong MVP | Sau MVP (G7, vẫn trong phạm vi đồ án) |
|---|---|
| UC01, UC02 — đăng ký, đăng nhập | UC03 — cập nhật hồ sơ |
| UC06, UC07, UC08, UC10, UC11, UC25 — phòng và cấu hình | UC09 — liên kết mời |
| UC12–UC19 — toàn bộ vòng chơi | UC04 — xem lịch sử ván |
| UC20 — kết thúc ván, mở nhật ký, cộng số ván | UC05 — bảng xếp hạng theo mùa |
| Người chơi ảo (môi trường phát triển) | UC21–UC24 — báo cáo vi phạm, quản trị |
| MH01–MH08, MH03b | MH09, MH10, MH11 |

**Tiêu chí MVP đạt** — tất cả phải đúng:

1. TC01–TC20 chạy xanh tự động
2. ST01–ST05 đạt trên giao diện thật, có biên bản trong `docs/test-report.md`
3. Ít nhất hai buổi chơi thử với 6 người thật trở lên, không ván nào phải bỏ dở vì lỗi
4. ST05: rà toàn bộ phản hồi máy chủ trong công cụ phát triển, không thấy vai người khác
5. Chạy được trên máy sạch theo đúng hướng dẫn trong `README.md`

---

## Giai đoạn 0 — Dựng nền

**Tuần 3** · **Phiên bản**: `v0.1.0` · **Trạng thái**: Gần xong — còn 0.6, 0.9

Mục tiêu: kho mã chạy được một lệnh kiểm thử và một lệnh chạy thử trên máy cả ba người, có
rào chắn tự động cho nguyên tắc lõi miền không phụ thuộc gì.

- [x] **0.0** `[C]` Khung thư mục, bộ tài liệu `docs/`, 7 sơ đồ PlantUML, ADR-0001 đề xuất
- [x] **0.1** `[C]` Khởi tạo Git; tạo kho GitHub riêng tư, mời ba thành viên và giảng viên;
      nhánh `main` và `dev`; bảo vệ `main` (chỉ hợp nhất qua pull request)
      · *19/10: kho riêng tư `AlaVox-lab/WereWolf_Game`, có `main` và `dev`. Quy tắc bảo vệ nhánh
      không bật được trên kho riêng tư gói miễn phí — tạm tuân thủ tự giác. Còn mời thành viên, giảng viên*
- [x] **0.2** `[C]` `package.json` gốc với npm workspaces (`apps/*`, `packages/*`);
      `tsconfig.base.json` bật `strict`; ESLint + Prettier; các lệnh gốc `dev`, `test`,
      `lint`, `typecheck`, `format`
- [x] **0.3** `[A]` `apps/server`: TypeScript + Vitest + `tsx` chạy nóng; một bài kiểm thử
      mẫu chạy xanh; điểm cuối `GET /api/health`
- [x] **0.4** `[B]` `packages/shared`: gói TypeScript thuần, xuất một kiểu mẫu; cả `server`
      lẫn `web` nhập được
- [x] **0.5** `[C]` `apps/web`: Vite + React + TypeScript + Tailwind; trang tạm hiển thị
      "Làng Trăng Mờ" và kết quả gọi `/api/health` qua proxy của Vite
- [ ] **0.6** `[C]` `infra/docker-compose.yml` dựng PostgreSQL 17; `infra/.env.example` chạy
      được ngay; lệnh `npm run db:up` / `db:down`
      · *Đã viết, cú pháp hợp lệ — còn chạy thử `db:up` khi bật Docker Desktop*
- [x] **0.7** `[B]` Rào chắn phụ thuộc: quy tắc ESLint `no-restricted-imports` (hoặc
      dependency-cruiser) làm **hỏng lint** nếu `domain/` nhập bất cứ thứ gì ngoài `domain/`,
      hoặc `apps/web` nhập mã máy chủ. Tự thêm một lần nhập sai để chứng minh lint bắt được
- [x] **0.8** `[C]` Tích hợp liên tục GitHub Actions: `lint`, `typecheck`, `test` trên mỗi
      pull request vào `dev` và `main`
      · *19/10: lần chạy đầu trên `main` xanh trong 26 giây*
- [ ] **0.9** `[ALL]` Họp chốt: **Q01–Q11** trong `game-rules.md` mục 6, **ADR-0001**, và gán
      tên thật cho nhãn A/B/C. Ghi kết quả vào `game-rules.md` và `PROJECT_STATE.md`
      · *19/10: đã chốt Q01–Q11 và ADR-0001. Còn gán tên A/B/C và xác nhận tuần học kỳ*

**Tiêu chí hoàn thành**: trên máy của cả ba người, `npm install && npm run db:up && npm test
&& npm run dev` chạy không lỗi, mở trình duyệt thấy trang tạm gọi được máy chủ.

---

## Giai đoạn 1 — Lõi miền

**Tuần 3–5** · **Phiên bản**: `v0.2.0` · **Điều kiện bắt đầu**: 0.2, 0.3, 0.7 xong; Q01–Q11 đã chốt — **đạt 19/10**

Mục tiêu: toàn bộ luật chơi viết bằng TypeScript thuần trong `domain/` và các bộ xử lý thuần
trong `application/`, **không mạng, không cơ sở dữ liệu, không đồng hồ thật**. TC01–TC20
chạy xanh. Đây là giai đoạn kiểm chứng Class Diagram — mọi thay đổi chữ ký phải về lại sơ đồ.

- [x] **1.1** `[A][B]` `domain/chung/`: `Phe`, `LoaiHanhDong` (`BAO_VE`, `CAN`, `SOI_THONG_TIN`,
      `CUU`, `DOC`, `BAN`), `MaQuyTac` (BR01–BR14), `TrangThaiVan`, `LoiNghiepVu` kèm mã lỗi;
      hai cổng `DongHo`, `NguonNgauNhien` và bản giả cho kiểm thử (`DongHoGia` tua được,
      `NgauNhienCoHat` theo hạt giống)
- [x] **1.2** `[A]` `domain/luat/`: `BoLuatChoi` — sáu thuộc tính, `chophep(maQuyTac)`,
      `kiemTraHopLe()`, `layMoTa()`, `saoChep()` trả bản đóng băng. `CauHinhVai` —
      `tongSoVai()`, `kiemTraHopLe(soNguoi)` theo UC11 bước 3 và **Q06**
      · Kiểm thử: mọi tổ hợp 6–12 người hợp lệ/không hợp lệ; bản sao đóng băng không sửa được
- [x] **1.3** `[A]` `domain/vaitro/`: lớp trừu tượng `VaiTro` với Template Method
      `thucHienLuot()` (ARCHITECTURE mục 5.1) và sáu lớp con. `BaoVe` giữ `mucTieuDemTruoc`;
      `PhuThuy` giữ `conThuocCuu`, `conThuocDoc`, mỗi đêm tối đa một hành động (**Q08**);
      `ThoSan` ghi đè `kichHoatKhiChet()`
      · Kiểm thử: **TC07, TC08, TC16, TC17**; mỗi vai sinh đúng `LoaiHanhDong`; `DanLang` và
      `ThoSan` có `laHanhDongDem() = false`; BR05 bật/tắt
- [x] **1.4** `[A]` `domain/van/`: `NguoiChoi` (`nhanVai`, `danhDauChet`, `coTheHanhDong`,
      nhớ nguyên nhân chết cho BR09), `HanhDongDem`, `KetQuaDem`, `LuotChoi`, `NhatKyVan`
      (chỉ ghi thêm), `VanDau` (`layNguoiConSong`, `layPheCua`, `danhDauChet`, giữ bản sao bộ luật)
      · *`HanhDongDem` đã tạo ở 1.3. `NguoiChoi` và `VanDau` phải khớp giao diện
      `NguoiChoiTrongVan`, `VanChiDoc` trong `vaitro/NguCanhHanhDong.ts`*
- [x] **1.5** `[A]` `application/BoGiaiQuyetDem`: chuỗi bước Bảo vệ → Cắn → Cứu → Độc theo
      `doUuTien` (Chain of Responsibility); trừ lọ thuốc và cập nhật `mucTieuDemTruoc` **ở
      bước này**, không ở lúc ghi ý định
      · Kiểm thử: **TC01–TC06**
- [x] **1.6** `[A]` `BoGiaiQuyetDem.xuLyDayChuyen()`: hàng đợi Thợ săn theo mục 16.3 tài liệu
      gốc, nhận một hàm chọn mục tiêu bất đồng bộ; áp **Q02** khi BR09 tắt
      · Kiểm thử: **TC09, TC10, TC18**; thuật toán luôn dừng khi mọi Thợ săn bắn lẫn nhau
- [x] **1.7** `[B]` `domain/baucu/`: `PhieuBau`, `PhienBauCu` — `ghiPhieu` (mỗi người một phiếu,
      cho bỏ trắng), `kiemPhieu`, `xuLyHoa` theo BR11 và **Q03**
      · Kiểm thử: **TC11, TC19**; bỏ phiếu hai lần bị chặn; người chết không được bầu
- [x] **1.8** `[B]` `application/BoKiemTraThangThua` đúng công thức mục 16.4 tài liệu gốc
      · Kiểm thử: **TC13, TC14**; bảng đủ biên (S = 0, S = D, S = D − 1)
- [x] **1.9** `[B]` `domain/kenh/`: `KenhChat` trừu tượng với `coTheXem`, `coTheGui`, `dangMo`
      theo pha; ba lớp con theo ARCHITECTURE mục 5.2 và **Q10**
      · Kiểm thử: ma trận người sống/chết × phe × pha cho cả ba kênh — phủ **BR14**
- [x] **1.10** `[C]` `domain/van/trangthai/`: mẫu State cho `VanDau` — mười trạng thái theo
      sơ đồ 11.1 cộng chuyển tiếp `HuyVan` theo **Q04**
      · Kiểm thử: mọi chuyển tiếp hợp lệ đi được, mọi chuyển tiếp không có trên sơ đồ ném lỗi;
      **TC20** — đổi bộ luật sau `ChoDuNguoi` bị chặn
- [x] **1.11** `[C]` `application/BoChiaVai` (Factory): sinh vai theo `CauHinhVai`, xáo trộn
      Fisher–Yates bằng `NguonNgauNhien`, gán; luồng ngoại lệ 2a của UC12
      · Kiểm thử: cùng hạt giống cho cùng kết quả; 10 000 lần chia phân bố đều
- [ ] **1.12** `[ALL]` Đối chiếu Class Diagram ↔ mã: sửa `docs/diagrams/03-class-loi.puml` cho
      khớp chữ ký thật, xuất ảnh, báo lại thay đổi để cập nhật tài liệu gốc

**Tiêu chí hoàn thành**: TC01–TC11, TC13, TC14, TC16–TC20 xanh (TC12, TC15 cần bộ điều phối,
làm ở G2). Độ phủ `domain/` ≥ 90 %. Lint xác nhận `domain/` không nhập gì bên ngoài.

**Đầu ra cho báo cáo**: Class Diagram đã kiểm chứng bằng mã; bảng TC → tệp kiểm thử.

---

## Giai đoạn 2 — Điều phối ván và người chơi ảo

**Tuần 5–6** · **Phiên bản**: `v0.3.0` · **Điều kiện bắt đầu**: G1 xong

Mục tiêu: một ván chạy **trọn vẹn không cần giao diện** — người chơi ảo tự chơi với nhau
trên đồng hồ tua nhanh, từ chia vai tới công bố phe thắng.

- [ ] **2.1** `[A]` `BoHenGio` (tác nhân AC04) trên cổng `DongHo`; `CongLuaChon` — lời hứa
      được giải quyết bởi lệnh người chơi hoặc hết giờ, cái nào đến trước (ARCHITECTURE mục 7)
- [ ] **2.2** `[A]` `BoDieuPhoiVan` — **pha đêm**: duyệt vai theo cấu hình và `doUuTien`
      (**Q05**); mời từng vai, chờ `CongLuaChon`; Sói đồng thuận trên kênh Sói, hết giờ thì chọn
      ngẫu nhiên trong mục tiêu đã đề xuất (BR12, **Q07**); Phù thủy được báo nạn nhân và cờ
      an toàn (BR07); đêm 1 theo BR03 và **Q01**; gọi `BoGiaiQuyetDem`
      · Kiểm thử: **TC12**; vai bỏ lượt khi hết giờ; Tiên tri nhận đúng phe
- [ ] **2.3** `[B]` `BoDieuPhoiVan` — **pha ngày**: công bố người chết không kèm nguyên nhân;
      thảo luận có đếm giờ; bỏ phiếu; giải quyết phiếu; dây chuyền Thợ săn; **kiểm tra thắng
      thua hai lần mỗi lượt**
      · Kiểm thử: **TC15** — Sói cắn làm S = D thì kết thúc ngay khi trời sáng
- [ ] **2.4** `[B]` `BoQuanLyKenh`: mở/đóng kênh theo pha; kiểm quyền trước khi nhận tin nhắn;
      trả danh sách người được xem mỗi kênh cho tầng thời gian thực
- [ ] **2.5** `[C]` `BoPhatSuKien` (Observer): sự kiện miền kèm **đối tượng nhận** — tất cả,
      một người, phe Sói, người chết. Chưa gắn Socket.IO
- [ ] **2.6** `[C]` `taoGocNhin(van, nguoiChoiId)` và kiểu `GocNhinNguoiChoi` trong
      `packages/shared` theo ARCHITECTURE mục 8 và **Q09**
      · Kiểm thử: với **mọi** người chơi ở **mọi** pha của một ván mô phỏng, góc nhìn không chứa
      vai người khác (trừ đồng đội Sói, trừ khi ván đã kết thúc) — bản đơn vị của ST05
- [ ] **2.7** `[B]` Ghi `NhatKyVan` ở mọi điểm chuyển pha, ý định, phiếu, người chết;
      `xuatBanCongKhai()` chỉ chạy khi ván kết thúc
- [ ] **2.8** `[A]` `infrastructure/bot/NguoiChoiAo`: nghe góc nhìn của chính nó, khi được mời
      thì chờ ngẫu nhiên 1–4 giây rồi chọn ngẫu nhiên trong danh sách mục tiêu hợp lệ, gửi qua
      **đúng cửa lệnh** người thật dùng; bỏ phiếu ngẫu nhiên; không nhắn tin
- [ ] **2.9** `[C]` `scripts/mo-phong.ts`: `npm run mo-phong -- --so-nguoi 8 --hat-giong 42
      --so-van 1000` chạy hàng loạt ván toàn người chơi ảo, in nhật ký một ván hoặc thống kê
      tỉ lệ thắng của nhiều ván
- [ ] **2.10** `[A][B]` Kiểm thử hệ thống không giao diện: **ST01** (6 người, Dân thắng) và
      **ST02** (8 người, Sói thắng) theo hạt giống cố định; **ST04** dây chuyền Thợ săn

**Tiêu chí hoàn thành**: 1 000 ván ngẫu nhiên 6–12 người đều kết thúc, không ném lỗi, phe
thắng khớp công thức BR01/BR02 với trạng thái cuối. TC01–TC20 xanh toàn bộ.

**Đầu ra cho báo cáo**: nhật ký một ván mẫu minh họa Sequence Diagram pha đêm; thống kê tỉ lệ
thắng theo số người — căn cứ cân bằng bộ vai mặc định.

---

## Giai đoạn 3 — Thiết kế giao diện

**Tuần 4–7, song song với G1–G2** · **Chủ trì** `[C]`, `[A]` `[B]` duyệt màn thuộc gói mình

Mục tiêu: có bản thiết kế hoàn chỉnh cho mọi màn trong MVP **trước khi** viết dòng giao diện
đầu tiên. Liên kết và ảnh chụp lưu ở `docs/design/`.

> **DỪNG — chờ người dùng.** Tới giai đoạn này (và mọi việc thiết kế giao diện game/web, kể
> cả G5) thì **không tự thiết kế**. Người dùng sẽ kết nối **Higgsfield** để sinh giao diện theo
> ý tưởng riêng đã có. Trợ lý chỉ bắt đầu khi người dùng đưa ý tưởng và kết nối xong.

- [ ] **3.1** Hệ thiết kế: token màu cho **hai không khí đêm và ngày**, màu phe (Dân / Sói),
      màu trạng thái (sống, chết, mất kết nối); cỡ chữ; khoảng cách; bo góc. Bộ phận dùng lại:
      thẻ người chơi, đồng hồ đếm ngược, thẻ vai, nút hành động chính, bong bóng tin nhắn, nhãn
      kênh, thanh "bạn là ai – pha nào – cần làm gì"
- [ ] **3.2** Luồng ngoài ván: MH01 đăng nhập/đăng ký, MH02 trang chủ, MH03 phòng chờ, MH03b
      cấu hình bộ luật
- [ ] **3.3** Luồng trong ván: MH04 thông báo vai; MH05 pha đêm với **năm biến thể** — Bảo vệ,
      Sói (kèm kênh Sói), Tiên tri (kèm kết quả soi), Phù thủy (kèm nạn nhân và hai lọ), màn chờ
      của Dân làng; MH06 pha ngày; MH07 bỏ phiếu; hộp thoại Thợ săn (UC17); MH08 kết thúc
- [ ] **3.4** Rà thiết kế theo sáu nguyên tắc mục 14.2 tài liệu gốc; mỗi màn có bản điện
      thoại 390 px và bản máy tính
- [ ] **3.5** Xuất token thành `apps/web/src/styles/tokens.css`; chụp ảnh từng màn vào
      `docs/design/`; tạo `docs/design/README.md` ghi liên kết thiết kế và danh sách kiểm 3.4
- [ ] **3.6** *(sau MVP, chỉ cần khung sườn)* MH09 hồ sơ, MH10 bảng xếp hạng, MH11 quản trị

**Tiêu chí hoàn thành**: mọi màn MH01–MH08 và MH03b có thiết kế; danh sách kiểm sáu nguyên
tắc đạt; tệp token tồn tại trong `apps/web`.

---

## Giai đoạn 4 — Máy chủ, tài khoản, phòng và thời gian thực

**Tuần 7–9** · **Phiên bản**: `v0.4.0` · **Điều kiện bắt đầu**: G2 xong

Mục tiêu: máy chủ thật, chơi được một ván bằng các ứng dụng khách Socket.IO viết trong kiểm
thử (chưa cần giao diện).

- [ ] **4.1** `[C]` `prisma/schema.prisma` cho các bảng MVP (ARCHITECTURE mục 12), đủ ràng buộc
      `UNIQUE`; trigger chặn sửa/xóa `nhat_ky_van`; `seed.ts` tạo ba tài khoản mẫu
- [ ] **4.2** `[C]` UC01, UC02: đăng ký, đăng nhập, đăng xuất; băm bcryptjs; JWT trong cookie
      `httpOnly`; bắt tay Socket.IO đọc cùng cookie đó; tài khoản bị khóa không đăng nhập được
- [ ] **4.3** `[C]` UC06, UC07, UC10: tạo phòng với mã 6 ký tự, vào phòng, rời phòng, chủ
      phòng loại người; tối đa 12; chuyển chủ phòng theo **Q11**
- [ ] **4.4** `[C]` UC08, UC25: nhận cấu hình vai và bộ luật, kiểm bằng `CauHinhVai` và
      `BoLuatChoi` của lõi miền; phát tóm tắt bộ luật cho cả phòng; chặn khi ván đã bắt đầu
- [ ] **4.5** `[C]` Thêm/bớt người chơi ảo vào phòng — **chỉ khi** biến môi trường
      `CHO_PHEP_NGUOI_CHOI_AO=true`
- [ ] **4.6** `[A]` UC11: bắt đầu ván → `BoChiaVai` → `BoDieuPhoiVan`; sổ đăng ký ván đang chạy
      trong bộ nhớ; khóa phòng không cho người mới vào
- [ ] **4.7** `[B]` Cổng Socket.IO: phòng socket cá nhân, kênh Sói, kênh người chết; ánh xạ đối
      tượng nhận của `BoPhatSuKien`; nhận lệnh `van:hanh-dong`, `van:bo-phieu` qua lược đồ Zod
      rồi chuyển vào `CongLuaChon`; **mọi dữ liệu ván gửi đi là `GocNhinNguoiChoi`**
- [ ] **4.8** `[B]` UC18: `kenh:gui` kiểm quyền bằng `BoQuanLyKenh`, lưu `tin_nhan`, phát tới
      đúng phòng socket của kênh
- [ ] **4.9** `[A]` BR13: mất kết nối không dừng ván, lượt bị bỏ lỡ coi như bỏ qua; kết nối lại
      nhận ngay ảnh chụp góc nhìn hiện tại; hủy ván theo **Q04**
- [ ] **4.10** `[B]` Lưu bền: ván, người chơi trong ván, lượt, ý định, phiếu, nhật ký; UC20 —
      khi kết thúc thì cộng `soVanDaChoi`, `soVanThang` vào hồ sơ
- [ ] **4.11** `[A]` Kiểm thử tích hợp: 2 ứng dụng khách socket + 4 người chơi ảo chơi trọn
      một ván; **bộ chặn gói tin quét mọi gói máy chủ gửi và khẳng định không có vai người
      khác** — ST05 tự động; ngắt kết nối giữa pha đêm rồi nối lại — ST03 tự động

**Tiêu chí hoàn thành**: kiểm thử 4.11 xanh; khởi động máy chủ thật, dùng hai tab trình duyệt
với tệp HTML thử nghiệm tối giản (hoặc công cụ khách Socket.IO) chơi được hết một ván.

---

## Giai đoạn 5 — Giao diện chơi

**Tuần 9–11** · **Phiên bản**: `v0.5.0` — ứng viên MVP · **Điều kiện bắt đầu**: G3 và G4 xong

Mục tiêu: dựng MH01–MH08 và MH03b đúng thiết kế G3. Giao diện **chỉ hiển thị góc nhìn**, không
tính luật.

- [ ] **5.1** `[C]` Khung ứng dụng: định tuyến, bố cục, nạp `tokens.css`, thư viện bộ phận theo
      hệ thiết kế; lớp gọi API; kho Zustand **chỉ lưu `GocNhinNguoiChoi` mới nhất** và danh sách
      tin nhắn; đồng hồ đếm ngược theo thời điểm hết hạn máy chủ gửi
- [ ] **5.2** `[C]` MH01 đăng nhập và đăng ký
- [ ] **5.3** `[C]` MH02 trang chủ: tạo phòng, nhập mã phòng
- [ ] **5.4** `[C]` MH03 phòng chờ và MH03b cấu hình bộ luật: danh sách thành viên, cấu hình vai
      có kiểm tức thời, sáu công tắc kèm mô tả, tóm tắt luật cho mọi người, nút thêm người chơi ảo
- [ ] **5.5** `[A]` MH04 thông báo vai: vai, mô tả năng lực, đồng đội nếu là Sói
- [ ] **5.6** `[A]` MH05 pha đêm: năm biến thể theo thiết kế 3.3; chỉ báo tiến độ **dạng số**;
      kênh Sói trong lượt Sói; Dân làng chỉ thấy màn chờ
- [ ] **5.7** `[B]` MH06 pha ngày: bảng người chơi, công bố người chết buổi sáng, kênh chung, kênh
      người chết cho người đã bị loại
- [ ] **5.8** `[B]` MH07 bỏ phiếu và bỏ trắng; hộp thoại Thợ săn (UC17)
- [ ] **5.9** `[B]` MH08 kết thúc: phe thắng, vai của tất cả, nhật ký diễn tiến theo từng lượt
- [ ] **5.10** `[ALL]` Thanh trạng thái cố định "bạn là ai – đang ở pha nào – cần làm gì" trên
      mọi màn trong ván; lời nhắc lượt theo ngữ cảnh bằng tiếng Việt cho người mới (nhu cầu N05)
- [ ] **5.11** `[C]` Kiểm trên điện thoại thật qua mạng LAN (Vite `--host`) ở 360–430 px và trên
      máy tính

**Tiêu chí hoàn thành**: một người thật + 5 người chơi ảo chơi trọn ván trên trình duyệt; ba
người thật trên ba máy + người chơi ảo chơi trọn ván.

---

## Giai đoạn 6 — Kiểm thử hệ thống và chơi thử → MVP

**Tuần 12** · **Phiên bản**: `v1.0.0` — **MVP**

- [ ] **6.1** `[ALL]` Chạy ST01–ST05 trên giao diện thật, ghi biên bản vào `docs/test-report.md`
      (kịch bản, người chạy, kết quả, ảnh chụp)
- [ ] **6.2** `[ALL]` Ít nhất hai buổi chơi thử với 6–10 người thật; phiếu góp ý ngắn: có hiểu
      mình phải làm gì không, ván dài bao lâu, chỗ nào khó hiểu
- [ ] **6.3** `[ALL]` Sửa lỗi theo mức độ; chỉnh thời lượng pha (`game-rules.md` mục 4) theo
      số liệu buổi chơi thử
- [ ] **6.4** `[C]` Đóng gói: `docker compose up` dựng cả cơ sở dữ liệu, máy chủ, giao diện;
      `README.md` hướng dẫn chạy trên máy sạch, **kiểm chứng trên một máy khác**
- [ ] **6.5** `[C]` Cập nhật tài liệu gốc (`.docx`) và sơ đồ theo mọi thay đổi thiết kế phát
      sinh; cập nhật bảng truy vết phụ lục A với tệp kiểm thử thật
- [ ] **6.6** `[C]` Cắt bản `v1.0.0`

**Tiêu chí hoàn thành**: năm tiêu chí ở mục *Định nghĩa MVP*.

---

## Giai đoạn 7 — Hoàn thiện phạm vi đồ án

**Tuần 12–14** · **Phiên bản**: `v1.1.0` → `v1.3.0` · **Điều kiện bắt đầu**: MVP đạt

Các use case còn lại trong phạm vi đã chốt. Mỗi nhóm là một bản phát hành nhỏ.

**`v1.1.0` — Hồ sơ và lịch sử**

- [ ] **7.1** `[C]` UC03 + MH09: cập nhật biệt danh, ảnh đại diện; thống kê số ván, tỉ lệ thắng
- [ ] **7.2** `[C]` UC04: danh sách ván đã chơi; mở lại nhật ký diễn tiến của ván cũ
- [ ] **7.3** `[C]` UC09: sinh liên kết mời vào phòng

**`v1.2.0` — Mùa giải và xếp hạng**

- [ ] **7.4** `[ALL]` Chốt công thức điểm xếp hạng (tài liệu gốc chưa định nghĩa) — ghi vào
      `game-rules.md`
- [ ] **7.5** `[B]` `MuaGiai`, `BanGhiXepHang`; UC20 cộng điểm khi kết thúc ván
- [ ] **7.6** `[B]` UC05 + MH10: bảng xếp hạng mùa hiện tại

**`v1.3.0` — Kiểm duyệt và quản trị**

- [ ] **7.7** `[B]` UC21: báo cáo vi phạm từ màn kết thúc hoặc lịch sử, tự đính kèm nhật ký ván
- [ ] **7.8** `[B]` Quyền quản trị viên (AC03); UC22 xem xét báo cáo, ra quyết định
- [ ] **7.9** `[B]` UC23: khóa và mở khóa tài khoản; người bị khóa bị ngắt khỏi phòng đang ở
- [ ] **7.10** `[B]` UC24 + MH11: bảng điều khiển — số ván, số người chơi, báo cáo chờ xử lý,
      tỉ lệ thắng theo phe

**Tiêu chí hoàn thành**: mọi use case UC01–UC25 có ít nhất một đường đi chạy được trên giao
diện; bảng truy vết phụ lục A không còn ô trống.

---

## Giai đoạn 8 — Báo cáo và bảo vệ

**Tuần 15** · Mốc M6

- [ ] **8.1** `[C]` Xuất ảnh bảy sơ đồ từ `docs/diagrams/` phiên bản cuối, chèn báo cáo
- [ ] **8.2** `[ALL]` Ảnh chụp màn hình thật cho MH01–MH11, đặt cạnh ảnh thiết kế tương ứng
- [ ] **8.3** `[ALL]` Kịch bản trình diễn 10 phút: chơi một ván có dây chuyền Thợ săn, bật tắt
      một quy tắc để thấy hành vi đổi (cặp TC08/TC16), mở công cụ phát triển chứng minh ST05
- [ ] **8.4** `[ALL]` Chuẩn bị câu hỏi dự kiến: vì sao tách ghi ý định và giải quyết; vì sao
      Chủ phòng kế thừa Người chơi; vì sao Thợ săn là `extend`; mẫu nào ở đâu
- [ ] **8.5** `[ALL]` Luyện trình diễn ít nhất hai lần; phương án dự phòng khi mạng lỗi (chạy
      toàn bộ trên một máy với người chơi ảo)

---

## Bảng truy vết use case → hạng mục

| Use case | Hạng mục | Use case | Hạng mục |
|---|---|---|---|
| UC01 Đăng ký | 4.2, 5.2 | UC14 Giải quyết đêm | 1.5, 1.6, 2.2 |
| UC02 Đăng nhập | 4.2, 5.2 | UC15 Thảo luận ban ngày | 2.3, 5.7 |
| UC03 Cập nhật hồ sơ | 7.1 | UC16 Bỏ phiếu treo cổ | 1.7, 2.3, 5.8 |
| UC04 Xem lịch sử ván | 7.2 | UC16b Xử lý hòa phiếu | 1.7 |
| UC05 Bảng xếp hạng | 7.6 | UC17 Kỹ năng lúc chết | 1.6, 5.8 |
| UC06 Tạo phòng | 4.3, 5.3 | UC18 Nhắn tin theo kênh | 1.9, 2.4, 4.8 |
| UC07 Tham gia phòng | 4.3, 5.3 | UC19 Kiểm tra thắng thua | 1.8, 2.3 |
| UC08 Cấu hình bộ vai | 1.2, 4.4, 5.4 | UC20 Kết thúc ván | 2.7, 4.10, 5.9 |
| UC09 Mời người chơi | 7.3 | UC21 Báo cáo vi phạm | 7.7 |
| UC10 Loại khỏi phòng | 4.3, 5.4 | UC22 Xem xét báo cáo | 7.8 |
| UC11 Bắt đầu ván | 1.10, 4.6 | UC23 Khóa tài khoản | 7.9 |
| UC12 Chia vai trò | 1.11, 4.6, 5.5 | UC24 Xem thống kê | 7.10 |
| UC13 Hành động đêm | 1.3, 2.2, 5.6 | UC25 Tùy chỉnh bộ luật | 1.2, 4.4, 5.4 |

---

## Nguyên tắc xuyên suốt

| Nguyên tắc | Lý do |
|---|---|
| Làm hạng mục theo đúng thứ tự số | Mỗi hạng mục dựa trên kết quả của hạng mục trước |
| Kiểm thử mang mã TC/ST của `game-rules.md` | Truy vết được từ quy tắc xuống mã khi bảo vệ |
| Chưa chốt điểm mơ hồ thì chưa viết mã chỗ đó | Ba người hiểu luật ba kiểu là rủi ro trọng yếu tài liệu gốc đã nêu |
| Đổi chữ ký lớp miền thì sửa sơ đồ ngay | Sơ đồ và mã lệch nhau là mất điểm |
| `main` luôn chạy được | Giảng viên có thể mở xem bất cứ lúc nào |
| Cập nhật tài liệu cùng lúc với mã | Tài liệu là một nửa sản phẩm của học phần |
| Luật ở máy chủ, giao diện chỉ hiển thị góc nhìn | PC04 — một lần rò vai là hỏng cả trò chơi |
