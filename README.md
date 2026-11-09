# Làng Trăng Mờ — MoonVillage

Hệ thống hỗ trợ trò chơi suy luận nhóm dạng **Ma Sói** chạy trên trình duyệt, **máy làm quản
trò**. Dành cho nhóm bạn quen chơi phòng riêng: chủ phòng chọn bộ vai, bật tắt sáu quy tắc cho
khớp biến thể luật của nhóm, và sau ván mở toàn bộ nhật ký hành động đêm để đối chiếu.

Đồ án học phần **Phân tích thiết kế hướng đối tượng** — Viện Đào tạo CNTT và Chuyển đổi số,
Trường Đại học Thủ Dầu Một.

| | |
|---|---|
| Nhóm | 13 |
| Thành viên | Trần Khánh Ngọc · Nguyễn Thanh Sơn · Võ Minh Tự |
| Giảng viên hướng dẫn | ThS. Trần Hữu Duật |

---

## Trạng thái

Đã có **toàn bộ luật chơi và bộ điều phối ván** — một ván chạy trọn vẹn bằng người chơi ảo, chưa có
máy chủ thời gian thực và giao diện. Bản phát hành mới nhất:
[v0.3.0 — Điều phối ván](https://github.com/AlaVox-lab/WereWolf_Game/releases/tag/v0.3.0). Chi tiết
tiến độ: [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md).

## Trò chơi

Phòng 6–12 người, sáu vai: **Bảo vệ**, **Sói**, **Tiên tri**, **Phù thủy**, **Thợ săn**,
**Dân làng**. Mỗi lượt gồm pha đêm — các vai lần lượt hành động theo độ ưu tiên — và pha ngày
— công bố người chết, thảo luận, bỏ phiếu treo cổ. Phe Dân thắng khi hết Sói; phe Sói thắng
khi số Sói còn sống không ít hơn số người còn lại. Luật đầy đủ:
[`docs/game-rules.md`](docs/game-rules.md).

## Tài liệu

| Tệp | Nội dung |
|---|---|
| [`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md) | Dự án đang ở đâu, việc tiếp theo |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Kế hoạch MVP chi tiết, làm tuần tự theo tệp này |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Kiến trúc, nguyên tắc, khuôn mẫu, quy ước |
| [`docs/game-rules.md`](docs/game-rules.md) | 6 vai, 14 quy tắc, kịch bản kiểm thử |
| [`docs/diagrams/`](docs/diagrams/) | 7 sơ đồ UML dạng PlantUML |
| [`docs/design/`](docs/design/) | Thiết kế giao diện: ý tưởng, khoảnh khắc, ảnh từng màn |
| [`docs/adr/`](docs/adr/) | Bản ghi quyết định kiến trúc |

## Công nghệ

TypeScript toàn tầng — Node.js, Express, Socket.IO, PostgreSQL, Prisma, React, Vite, Tailwind
CSS, Vitest — đã chốt ở [ADR-0001](docs/adr/0001-chon-bo-cong-nghe.md), kèm lý do và phương án thay thế.

## Chạy thử

Cần Node.js 24 và Docker Desktop.

```bash
npm install
```

```bash
npm test
```

```bash
npm run mo-phong
```

```bash
npm run dev:web
```

`npm run mo-phong` chạy một ván toàn người chơi ảo và in nhật ký; thêm
`-- --so-nguoi 6-12 --so-van 1000` để xem thống kê tỉ lệ thắng. `npm run dev:web` mở bản xem trước
giao diện ở `http://localhost:5173` — phát lại một ván mô phỏng, đổi ghế để xem bằng mắt từng
người (tạo lại ván mẫu bằng `npm run xuat-xem-truoc`). Chơi thật với nhau ở Giai đoạn 5.

## Cấu trúc thư mục

```
apps/server/     máy chủ ứng dụng — toàn bộ luật chơi (domain, application, infrastructure, interface)
apps/web/        giao diện React — chỉ hiển thị góc nhìn máy chủ gửi
packages/shared/ hợp đồng dữ liệu giữa máy chủ và giao diện
infra/           Docker Compose, biến môi trường mẫu
scripts/         mô phỏng ván bằng người chơi ảo
docs/            tài liệu dự án
```

Chi tiết: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) mục 4.
