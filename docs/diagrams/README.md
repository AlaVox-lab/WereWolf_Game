# Sơ đồ UML

Bảy sơ đồ PlantUML, chép từ *Tài liệu dự án toàn diện* (Phụ lục C). Mã `.puml` là nguồn sự thật;
ảnh xuất ra nằm ở `out/` và **không commit**.

| Tệp | Sơ đồ | Hình trong tài liệu gốc | Trạng thái so với mã |
|---|---|---|---|
| `01-use-case.puml` | Use Case Diagram tổng thể | 6.1 | Giữ nguyên |
| `02-activity-mot-luot.puml` | Activity Diagram một lượt chơi | 8.1 | Giữ nguyên |
| `03-class-loi.puml` | Class Diagram phần lõi | 9.1 | **Đã đối chiếu với mã** ngày 19/10/2026 — xem mục dưới |
| `04-sequence-pha-dem.puml` | Sequence Diagram pha đêm | 10.1 | **Vẽ lại theo mã** ngày 03/11/2026 — xem mục dưới |
| `05-sequence-bo-phieu.puml` | Sequence Diagram pha bỏ phiếu | 10.2 | **Vẽ lại theo mã** ngày 03/11/2026 — xem mục dưới |
| `06-state-van-dau.puml` | State Machine Diagram của Ván đấu | 11.1 | **Sửa nhãn theo mã** ngày 03/11/2026 — mỗi nhãn là một phương thức của `TrangThaiVanDau`, khớp bảng `SO_DO` trong `tests/domain/trangthai.test.ts` |
| `07-state-nguoi-choi.puml` | State Machine Diagram của Người chơi | 11.2 | Giữ nguyên |

## Xuất ảnh

Cần Docker Desktop đang chạy. PlantUML chạy trong ảnh chứa `plantuml/plantuml` ngay trên máy,
không cần cài Java, không gửi sơ đồ ra dịch vụ ngoài.

```bash
npm run so-do
```

Kết quả: `docs/diagrams/out/*.svg` và `*.png`, dùng để chèn báo cáo.

## Kiểm tra tự động Class Diagram

`apps/server/tests/docs/soDoLop.test.ts` đối chiếu `03-class-loi.puml` với mã theo **hai chiều**,
chạy trong `npm test` và CI:

1. Mỗi thành viên ghi trong khối lớp trên sơ đồ phải có trong tệp định nghĩa lớp đó.
2. Mỗi lớp `export` từ `domain/` và `application/` phải có mặt trên sơ đồ: được **khai báo**
   (`class` / `interface`) hoặc được **nêu trong một ghi chú**. Tên lớp chỉ xuất hiện làm kiểu dữ
   liệu của lớp khác hay trong nhãn mũi tên thì không tính. Ngoại lệ: `LoiNghiepVu`, `DongHoGia`,
   `NgauNhienCoHat` — lớp kỹ thuật.
3. Lớp có trên sơ đồ mà chưa có mã phải khớp đúng danh sách `CHUA_CAI` trong bài kiểm thử —
   hiện là `PhongChoi`, `TaiKhoan`. Cài xong lớp nào thì gỡ khỏi danh sách.

Bài kiểm thử chỉ so tên, không so kiểu và tham số — đổi chữ ký mà giữ tên thì vẫn phải tự sửa sơ đồ.

## Khác biệt của Class Diagram so với Hình 9.1 tài liệu gốc

Ghi lại để cập nhật tài liệu gốc `.docx` (hạng mục ROADMAP 6.5). Mọi thay đổi đều đến từ việc viết
mã lõi miền ở Giai đoạn 1.

| Lớp | Thay đổi | Lý do |
|---|---|---|
| `VaiTro` | Thêm `loaiVai`, `moTaNangLuc`, `coKyNangKhiChet()`, `thucHienLuot()`, `kichHoatKhiChet()`, `layDanhSachMucTieu()`, `taoPhatBan()`. Thuộc tính đổi từ `#` sang `+` chỉ đọc. Tham số `(mt)` thành `(nc, luaChon)` | Template Method: `thucHienLuot()` và `kichHoatKhiChet()` là khung chung kiểm mục tiêu và ràng buộc; `nc` là `NguCanhHanhDong` mang ván, bộ luật, người thực hiện |
| `VanChiDoc`, `NguoiChoiTrongVan` | **Mới** — hai giao diện | Phá vòng phụ thuộc `NguoiChoi → VaiTro → NguoiChoi` |
| `BaoVe` | `mucTieuDemTruoc` đổi kiểu `NguoiChoi` → `String` (mã người chơi); thêm `capNhatMucTieuDemTruoc()` | Trạng thái vai chỉ đổi ở bước giải quyết |
| `PhuThuy` | Thêm `truThuocCuu()`, `truThuocDoc()` | Lọ chỉ trừ ở bước giải quyết — TC04 |
| `ThoSan` | `kichHoatKhiChet()` chuyển lên lớp cha làm khung; `ThoSan` ghi đè `coKyNangKhiChet()` và `taoPhatBan()` | Giữ Template Method nhất quán với lượt đêm |
| `KenhChat` | Thêm `loaiKenh`, `dangMo()`, `coQuyenGui()`; `coTheGui()` thành khung chung | Template Method: gửi được = kênh mở và có quyền gửi |
| `BoLuatChoi` | Thêm `daKhoa`, `datQuyTac()`, `kiemTraHopLe()`, `layMoTa()`, `saoChep()` | Bộ luật bất biến trong ván — bản sao đã khóa |
| `CauHinhVai` | **Thêm vào sơ đồ** (có ở bảng 9.4) | |
| `VanDau` | Thêm `pheThang`, `layNguoiChoi()`, `layPheCua()`, `taoLuotMoi()`, `danhDauChet()`, `chuyenPha(suKien)`, `ketThuc(pheThang)`, `huyVan()`, `choPhepDoiBoLuat()` | Ba cửa đổi pha của mẫu State |
| `TrangThaiVanDau` | **Mới** — lớp trừu tượng và mười lớp con | Mẫu State (mục 13.2 tài liệu gốc) |
| `LuotChoi`, `NhatKyVan` | **Thêm vào sơ đồ** (có ở bảng 9.4) | |
| `KetQuaDem`, `PhienBauCu` | Thuộc `LuotChoi` thay vì thuộc thẳng `VanDau` | Mỗi lượt có một kết quả đêm và tối đa hai phiên bỏ phiếu |
| `PhienBauCu` | Thêm `kiemPhieu(luat)`, `xuLyHoa()`, `taoVongBauLai()`, `laVongBauLai` | Q03 — bầu lại khi BR11 tắt |
| `BoGiaiQuyetDem`, `BuocGiaiQuyet` | Thêm `giaiQuyet(van)`, `xemNanNhan()`, `xuLyDayChuyen()`; giao diện `BuocGiaiQuyet` mới | Chain of Responsibility; dây chuyền Thợ săn bất đồng bộ |
| `BoChiaVai` | **Thêm vào sơ đồ** (có ở bảng 9.5) | Factory |

## Khác biệt của Sequence và State Diagram so với tài liệu gốc

Ghi lại để cập nhật tài liệu gốc `.docx` (hạng mục ROADMAP 6.5). Bản trong tài liệu gốc gọi những
phương thức mã không có; bản trong kho vẽ lại đúng theo `BoDieuPhoiVan` ngày 03/11/2026.

| Sơ đồ | Hình 10.1, 10.2, 11.1 tài liệu gốc | Bản trong kho | Lý do |
|---|---|---|---|
| Pha đêm | `locVaiCoNangLucDem()`, `sapXepTheoDoUuTien()`, `yeuCauHanhDong()`, `ghiNhanYDinh()` gửi tới `BoGiaiQuyetDem` | `layThuTuBuocDem()`; lời mời qua `CongLuaChon.cho()`, người chơi trả lời bằng `CongLuaChon.ghiNhan()`; kiểm bằng `VaiTro.thucHienLuot()`; ý định ghi vào `LuotChoi.ghiYDinh()` | Người thật và người chơi ảo đi chung một cửa; ý định thuộc lượt, không thuộc bộ giải quyết |
| Pha đêm | Phù thủy hỏi `layNanNhanHienTai()` | Lời mời Phù thủy kèm sẵn nạn nhân (`layThongTinNanNhan()`) | BR07 — báo trước trong lời mời |
| Pha đêm | `apDungBaoVe()`, `apDungCan()`… là phương thức | Bốn mắt xích `BuocGiaiQuyet` trong chuỗi; thêm `xuLyDayChuyen()`, bước chờ giả Q05, `BoPhatSuKien` | Chain of Responsibility; Q05; Observer |
| Bỏ phiếu | `moPhien()`, `boPhieu()`, `chotPhien()`; `PhienBauCu` tự gọi `danhDauChet` và hỏi Thợ săn | `new PhienBauCu(...)`, `ghiPhieu()`, `kiemPhieu(luat)`, `taoVongBauLai()`; `BoDieuPhoiVan` thi hành treo cổ và gọi `xuLyDayChuyen()` | Phiên bầu chỉ đếm phiếu; vòng bầu lại Q03 |
| Trạng thái ván | Nhãn `hetGio / duHanhDong`, `duPhieu / hetGio`, `chuaKetThuc`; hủy ván chỉ từ hai trạng thái | `ketThucDem()`, `ketThucBoPhieu()`, `chuaKetThuc()`…; hủy ván từ mọi trạng thái chưa kết thúc | Nhãn là phương thức của mẫu State; Q04 |
