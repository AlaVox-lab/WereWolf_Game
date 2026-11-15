# Kịch bản trình diễn 10 phút — Làng Trăng Mờ

ROADMAP 8.3, 8.5. Một người điều khiển máy, một người thuyết minh, một người trả lời câu hỏi.
Mục tiêu: chứng minh **mô hình hướng đối tượng chạy đúng như sơ đồ**, không chỉ "trò chơi chạy".

## Chuẩn bị (trước giờ bảo vệ 15 phút)

```bash
npm run db:up
```

```bash
npm run db:seed --workspace @moonvillage/server
```

```bash
npm run dev
```

- Trình duyệt A (thường): đăng nhập `ngan` / `langtrang1`. Trình duyệt B (ẩn danh): `khoa` /
  `langtrang1`. Trình duyệt C: `quantri` / `quantri123`.
- Mở sẵn một cửa sổ dòng lệnh ở thư mục repo, một tab `docs/diagrams/out/03-class-loi.png`.
- Chạy trước một lượt `npm test` để chắc mọi thứ xanh (347 đạt).

## Dòng thời gian

| Phút | Việc | Nói gì | Chứng minh điều gì |
|---|---|---|---|
| 0:00–0:45 | Mở MH01, đăng nhập A | "Máy làm quản trò: không ai phải ngồi ngoài làm người dẫn." | UC02 |
| 0:45–2:00 | A dựng phòng (MH02), chép liên kết mời, dán vào B → B vào thẳng phòng | Liên kết mời chỉ là `/phong/:ma`; chưa đăng nhập thì qua MH01 rồi quay lại | UC06, UC07, UC09 |
| 2:00–3:00 | A thêm 4 người chơi ảo; chỉnh bộ vai sai (thêm Sói) để lỗi hiện tức thời, bấm "Gợi ý theo số người" | Kiểm hợp lệ nằm ở `CauHinhVai.kiemTraHopLe()` trên máy chủ — giao diện chỉ hiện `viPham` | UC08, nguyên tắc 2.1 |
| 3:00–3:45 | Thẻ "Luật chơi": **tắt BR04** (Phù thủy tự cứu). B mở thẻ này thấy bản chỉ đọc | Sáu luật tùy biến là mẫu **Strategy** `BoLuatChoi`; bộ luật được sao chép, khóa khi ván bắt đầu (TC20) | UC25, PC03 |
| 3:45–6:00 | Bắt đầu ván. Thẻ vai MH04, đêm MH05 (kênh Sói tự mở nếu là Sói), sáng MH06, bỏ phiếu MH07, cảnh treo cổ | Pha đêm chỉ **ghi ý định**; `BoGiaiQuyetDem` giải quyết một lần theo `doUuTien` (Chain of Responsibility); vòng đời ván là mẫu **State** | UC12–UC16, mục 6–7 |
| 6:00–7:00 | B: F12 → Network → WS → lọc khung chứa `loaiVai` | Mỗi gói chỉ chứa `GocNhinNguoiChoi` của chính người nhận; không có vai người khác | **ST05**, PC04 |
| 7:00–8:15 | Dòng lệnh: `npx vitest run --root apps/server -t "TC08\|TC16\|ST04" --reporter verbose` | TC08/TC16 là một cặp: bật BR04 thì chặn, tắt thì cho — **cùng mã, khác Strategy**. ST04: dây chuyền Thợ săn (ts1 bắn ts2, ts2 bắn Sói) chết đúng ba người, công bố đúng thứ tự | Cặp TC08/TC16, ST04, UC17 |
| 8:15–9:15 | Hết ván MH08 → "Về phòng chờ"; Lịch sử mở lại ván, B báo cáo A; C duyệt báo cáo, khóa rồi mở khóa | Báo cáo gắn mã ván nên nhật ký tự đi kèm; khóa thì gọi cổng `CongNgatKetNoi` (đảo phụ thuộc) | UC04, UC20–UC23 |
| 9:15–10:00 | Mở Class Diagram và `tests/docs/soDoLop.test.ts` | Bài kiểm đối chiếu sơ đồ ↔ mã **hai chiều** chạy trong CI — sơ đồ không thể lệch mã | Tính nhất quán sơ đồ – mã |

Dây chuyền Thợ săn ngoài đời phụ thuộc vai được chia ngẫu nhiên, nên phần chứng minh chắc chắn
là bài kiểm ST04 (bộ mô phỏng cố định hạt giống). Nếu ván trực tiếp tình cờ có Thợ săn chết,
chỉ thêm cảnh mũi tên cắm vào quân người trúng — không lộ ai bắn (Q09).

## Phương án dự phòng (8.5)

| Sự cố | Làm gì |
|---|---|
| Mạng phòng học lỗi, không vào GitHub | Mọi thứ chạy trên một máy: máy chủ, web, PostgreSQL trong Docker |
| Docker / PostgreSQL không lên | `KHO=bo-nho npm run dev:server` — kho trong bộ nhớ, không cần CSDL (mất dữ liệu khi tắt; đăng ký tài khoản mới tại chỗ) |
| Chỉ có một trình duyệt | Một người thật + 5 người chơi ảo chơi trọn ván (tiêu chí Giai đoạn 5) |
| Máy chủ không chạy được | Mở `/van-mau`: phát lại ván mô phỏng 8 người, đổi ghế để xem bằng mắt từng người — đủ MH04–MH08 |
| Cảnh 3D giật trên máy chiếu | Bật "Giảm chuyển động" của hệ điều hành — mọi hoạt cảnh có phương án `prefers-reduced-motion` |

## Luyện tập

- [ ] Lần 1 — chạy đủ 10 phút, bấm giờ từng dòng, ghi chỗ bị trễ
- [ ] Lần 2 — có người đóng vai giảng viên ngắt lời bằng câu hỏi trong `cau-hoi-du-kien.md`
- [ ] Thử phương án dự phòng `KHO=bo-nho` và `/van-mau` ít nhất một lần
