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

**Đang khởi tạo** — có bộ tài liệu và khung thư mục, chưa có mã nguồn. Xem
[`docs/PROJECT_STATE.md`](docs/PROJECT_STATE.md).

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
| [`docs/design/`](docs/design/) | Thiết kế giao diện trên Claude Design — làm ở Giai đoạn 3 |
| [`docs/adr/`](docs/adr/) | Bản ghi quyết định kiến trúc |

## Công nghệ (đề xuất)

TypeScript toàn tầng — Node.js, Express, Socket.IO, PostgreSQL, Prisma, React, Vite, Tailwind
CSS, Vitest. Lý do và phương án thay thế: [ADR-0001](docs/adr/0001-chon-bo-cong-nghe.md).

## Chạy thử

*Chưa có — hoàn thành ở Giai đoạn 0 của [`ROADMAP.md`](docs/ROADMAP.md).* Dự kiến:

```bash
npm install
npm run db:up
npm run dev
```

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
