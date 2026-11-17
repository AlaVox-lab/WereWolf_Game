# CLAUDE.md

Bối cảnh dự án cho Claude Code và mọi trợ lý AI khác. Đọc kỹ trước khi thao tác bất cứ thứ
gì trong kho mã này.

---

## QUY TẮC TUYỆT ĐỐI

### Thao tác Git ghi vào lịch sử chỉ khi người dùng yêu cầu rõ

**Mặc định không** chạy `git commit`, `git push`, `git merge`, `git rebase`, `git tag`,
`git reset --hard`, tạo/xóa/chuyển nhánh, `gh pr create`, `gh pr merge`, `gh release create`,
hay bất kỳ lệnh nào ghi vào lịch sử Git hoặc lên máy chủ từ xa — soạn sẵn commit message rồi
dừng.

**Ngoại lệ**: khi người dùng **yêu cầu rõ trong chat** ("commit giúp", "push luôn") thì được
chạy đúng các lệnh được yêu cầu cho công việc vừa làm. Không suy rộng sang lần sau, không tự
`push --force`, không viết lại lịch sử đã push. Commit message viết vào tệp UTF-8 rồi dùng
`git commit -F <tệp>` để giữ dấu tiếng Việt. Quyết định ngày 19/10/2026.

**Tác giả commit**: nhóm chấp nhận để tác giả là tài khoản `AlaVox-lab` — không tự đổi
`user.name`, `user.email`.

**Luôn được phép**: `git status`, `git diff`, `git log`, `git show`; `gh` chỉ đọc; đọc/tạo/sửa
tệp; chạy build, test, lint, chạy thử ứng dụng.

### Khi hoàn thành một hạng mục

1. Tóm tắt các tệp đã đổi và vì sao; nói rõ kiểm thử nào đã chạy, kết quả ra sao
2. Đánh dấu hạng mục trong `docs/ROADMAP.md`; cập nhật `ARCHITECTURE.md` nếu đụng khuôn mẫu
3. **Soạn sẵn commit message** theo Conventional Commits, tiếng Việt có dấu, trong khối mã
4. Dừng lại để thành viên tự commit — trừ khi người dùng yêu cầu rõ trợ lý commit

```
feat(domain): thêm bộ giải quyết đêm theo chuỗi độ ưu tiên

Áp dụng lần lượt bảo vệ, cắn, cứu, độc theo doUuTien. Lọ thuốc chỉ bị
trừ ở bước giải quyết nên TC04 đúng. Phủ TC01–TC06.

Hạng mục ROADMAP: 1.5
```

Phạm vi commit gợi ý: `domain`, `app` (application), `infra`, `api`, `ws`, `web`, `shared`,
`db`, `docs`, `ci`. Trên Windows, commit tiếng Việt nên chạy `git commit` **không** kèm `-m`
để dán nội dung vào trình soạn thảo, tránh hỏng dấu.

---

## 0. Thứ tự đọc bắt buộc

| Thứ tự | Tệp | Biết được gì |
|---|---|---|
| 1 | `docs/PROJECT_STATE.md` | Đang ở đâu, vừa làm gì, đang vướng gì, việc tiếp theo |
| 2 | `docs/ARCHITECTURE.md` | Năm nguyên tắc bất di dịch, khuôn mẫu, quy ước đặt tên |
| 3 | `docs/ROADMAP.md` | Hạng mục kế tiếp và tiêu chí hoàn thành của nó |
| 4 | `docs/game-rules.md` | Luật chơi, mã quy tắc BR, mã kịch bản kiểm thử TC/ST |
| 5 | `docs/adr/` | Vì sao chọn công nghệ đó |

Tệp nào chưa tồn tại thì báo người dùng thay vì đoán.

---

## 1. Dự án trong một đoạn

**Làng Trăng Mờ (MoonVillage)** — trò chơi suy luận nhóm dạng Ma Sói trên web, máy làm quản
trò. Đồ án thực hành học phần *Phân tích thiết kế hướng đối tượng*, ĐH Thủ Dầu Một — người
thực hiện: Nguyễn Thanh Sơn. Sáu vai
cố định, mười bốn quy tắc (sáu quy tắc chủ phòng bật tắt được), phòng 6–12 người. Đồ án được
chấm trên **chất lượng mô hình hóa hướng đối tượng** và **sự nhất quán giữa sơ đồ với mã**.

---

## 2. Làm việc theo ROADMAP

Người dùng nói *"làm tiếp"*, *"hạng mục tiếp theo"*, hoặc đưa một mã như *"làm 1.5"*:

1. Đọc `PROJECT_STATE.md`, tìm hạng mục chưa đánh dấu đầu tiên trong `ROADMAP.md` (hoặc đúng
   mã được đưa)
2. Kiểm tra **điều kiện bắt đầu** của giai đoạn và các điểm Q trong `game-rules.md` mục 6 mà
   hạng mục đó phụ thuộc. Điểm Q chưa chốt thì **hỏi**, không tự chọn
3. Làm đúng phạm vi hạng mục — không làm lấn sang hạng mục sau
4. Kết thúc theo mục *Khi hoàn thành một hạng mục* ở trên

---

## 3. Năm nguyên tắc — tóm tắt

Chi tiết ở `ARCHITECTURE.md` mục 2. Yêu cầu nào buộc phá một điều dưới đây thì dừng và hỏi.

1. **Máy chủ là trọng tài duy nhất** — `apps/web` không chứa luật, chỉ hiển thị góc nhìn
2. **Ghi ý định trước, giải quyết tập trung sau** — vai không tự sửa trạng thái người chơi
3. **Bộ luật bất biến trong ván** — sao chép vào `VanDau` lúc bắt đầu
4. **Lõi miền không phụ thuộc gì** — `domain/` không nhập khung, không `Date.now()`, không
   `Math.random()`; dùng cổng `DongHo`, `NguonNgauNhien`
5. **Người chơi ảo đi chung luồng** — không có nhánh `if (laNguoiChoiAo)` trong luật

---

## 4. Quy ước viết mã

- Lớp, thuộc tính, phương thức trong `domain/` và `application/`: **tiếng Việt không dấu,
  đúng như Class Diagram** (`PhuThuy.conThuocCuu`, `BoGiaiQuyetDem.giaiQuyet()`)
- Bảng và cột cơ sở dữ liệu: đúng từ điển dữ liệu (`nguoi_choi_trong_van.trang_thai_ky_nang`)
- Mã kỹ thuật ở `infrastructure/`, `interface/`, `apps/web`: tiếng Anh theo quy ước khung
- Chú thích, tài liệu, chuỗi hiển thị: tiếng Việt có dấu
- Tên bài kiểm thử mở đầu bằng mã kịch bản: `it("TC07 — ...")`
- Đổi chữ ký lớp miền thì sửa `docs/diagrams/03-class-loi.puml` trong cùng công việc
- Thêm phụ thuộc: kiểm giấy phép, commit `package-lock.json`; `domain/` không được thêm phụ
  thuộc nào

---

## 5. Khi phát hiện vấn đề

- Luật trong tài liệu gốc mơ hồ hoặc mâu thuẫn → thêm một dòng Q mới vào `game-rules.md`
  mục 6 kèm đề xuất, báo người dùng, **không tự quyết**
- Khuôn mẫu trong `ARCHITECTURE.md` không còn đúng với mã → báo người dùng, đề xuất sửa tài
  liệu hoặc sửa mã
- Hạng mục ROADMAP quá lớn hoặc sai thứ tự → đề xuất tách hoặc đổi thứ tự, chờ đồng ý
