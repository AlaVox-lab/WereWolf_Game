# Làng Trăng Mờ — MoonVillage

Hệ thống hỗ trợ trò chơi suy luận nhóm dạng **Ma Sói** chạy trên trình duyệt, **máy làm quản
trò**. Dành cho nhóm bạn quen chơi phòng riêng: chủ phòng chọn bộ vai, bật tắt sáu quy tắc cho
khớp biến thể luật của nhóm, và sau ván mở toàn bộ nhật ký hành động đêm để đối chiếu.

Đồ án học phần **Phân tích thiết kế hướng đối tượng** — Viện Đào tạo CNTT và Chuyển đổi số,
Trường Đại học Thủ Dầu Một.

| | |
|---|---|
| Sinh viên thực hiện | Nguyễn Thanh Sơn |
| Giảng viên hướng dẫn | ThS. Trần Hữu Duật |
| Mã nguồn | <https://github.com/AlaVox-lab/WereWolf_Game> |
| Truy cập sản phẩm | <https://alavox-lab.github.io/WereWolf_Game/> — bản xem thử ván mẫu; bản đầy đủ chạy bằng Docker (xem bên dưới) |

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

## Chạy bằng Docker (chỉ cần Docker Desktop)

Một lệnh dựng cả cơ sở dữ liệu, máy chủ và giao diện:

```bash
npm run docker:up
```

Mở `http://localhost:8080`. Đăng nhập bằng tài khoản mẫu `ngan` / `langtrang1` (hoặc `khoa`,
`linh`; quản trị `quantri` / `quantri123`) — chỉ dùng chạy thử. Dựng phòng, bấm "Thêm người ảo"
5 lần rồi "Bắt đầu ván" để chơi một mình; mở thêm cửa sổ ẩn danh đăng nhập tài khoản khác để chơi
hai người. Xem nhật ký bằng `npm run docker:logs`, tắt bằng `npm run docker:down` (dữ liệu giữ
trong volume `pgdata`). Đổi cổng hoặc khóa phiên trong `infra/.env.example` (`APP_PORT`,
`JWT_SECRET`). Không có `npm` trên máy thì chạy thẳng:

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env.example --profile app up -d --build
```

Ảnh Docker: máy chủ Node phục vụ cả REST, Socket.IO lẫn bản build của web trên một cổng; mỗi lần
khởi động tự áp migration và nạp dữ liệu mẫu (chạy lại an toàn).

## Xem thử trên GitHub Pages

GitHub Pages chỉ phục vụ tệp tĩnh nên **không** chạy được máy chủ, đăng nhập hay phòng chơi. Bản
đưa lên đó chỉ có **ván mẫu**: phát lại một ván do người chơi ảo chơi, xem được từ góc nhìn từng
ghế, có thanh tua. Workflow `.github/workflows/pages.yml` tự dựng (`vite build --mode pages`) và
đẩy lên mỗi khi `apps/web/` đổi trên `main`. Bật một lần: **Settings → Pages → Source: GitHub
Actions**. Dựng thử ở máy:

```bash
npm run build --workspace @moonvillage/web -- --mode pages
```

## Chạy khi phát triển

Cần Node.js 24 và Docker Desktop.

```bash
npm install
```

```bash
npm run db:up
```

```bash
npm run dev
```

```bash
npm test
```

`npm run dev` bật máy chủ (`http://localhost:3000`) và web (`http://localhost:5173`, tự nạp lại
khi sửa mã). Lần đầu nạp dữ liệu mẫu bằng `npm run db:seed --workspace @moonvillage/server`.
Không có PostgreSQL thì chạy máy chủ với `KHO=bo-nho` (dữ liệu mất khi tắt). `npm run mo-phong`
chạy một ván toàn người chơi ảo và in nhật ký; thêm `-- --so-nguoi 6-12 --so-van 1000` để xem
thống kê tỉ lệ thắng. `/van-mau` phát lại một ván mô phỏng trong cảnh 3D mà không cần đăng nhập.

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
