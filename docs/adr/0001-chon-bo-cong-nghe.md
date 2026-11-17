# ADR-0001: Chọn bộ công nghệ TypeScript toàn tầng

| Mục | Giá trị |
|---|---|
| Trạng thái | **Đã chấp nhận** — 19/10/2026 |
| Ngày | 2026-09-29 |
| Phạm vi | `toàn hệ thống` |
| Hạng mục ROADMAP | 0.9 |
| Người quyết định | Nguyễn Thanh Sơn |

---

## Bối cảnh

Tài liệu dự án mục 15.1 chỉ nêu **tiêu chí** chọn công nghệ và hẹn chốt tên cụ thể ở đầu
tuần 12. Lộ trình trong `ROADMAP.md` kéo phần viết lõi miền lên sớm hơn nhiều — để Class
Diagram được kiểm chứng bằng mã chạy thật ngay từ mốc M2 — nên cần chốt công nghệ **ngay
bây giờ** thay vì tuần 12.

Tiêu chí từ tài liệu gốc:

| Thành phần | Tiêu chí |
|---|---|
| Giao diện | Thư viện dạng thành phần — màn hình pha đêm và pha ngày có nhiều trạng thái hiển thị |
| Máy chủ | Hỗ trợ tốt lập trình hướng đối tượng — toàn bộ phân cấp `VaiTro` và các bộ điều khiển nằm ở đây |
| Cơ sở dữ liệu | Hệ quản trị quan hệ mã nguồn mở — cần ràng buộc toàn vẹn |
| Đồng bộ tức thời | Kết nối hai chiều hoặc luồng sự kiện một chiều, **có phương án dự phòng truy vấn định kỳ** |
| Nguyên tắc chung | Ưu tiên công nghệ cả ba thành viên tiếp cận được, không phải công nghệ mạnh nhất |

Ràng buộc thêm từ kiến trúc: yêu cầu PC04 bắt buộc máy chủ chỉ gửi *góc nhìn* đã lọc. Nếu
máy chủ và giao diện viết hai ngôn ngữ khác nhau, kiểu dữ liệu của góc nhìn phải khai báo
hai lần và dễ lệch nhau — chỗ lệch chính là nơi dữ liệu vai có thể rò ra.

---

## Các phương án đã cân nhắc

### Phương án A — TypeScript toàn tầng: Node.js + Express + Socket.IO, React + Vite

| Mục | Nội dung |
|---|---|
| Giấy phép | Toàn bộ MIT hoặc Apache-2.0 |
| Mức độ quen thuộc | Cao — giao diện web đằng nào cũng phải viết JavaScript |
| Độ khó tích hợp | Thấp — một ngôn ngữ, một trình quản lý gói, một lệnh kiểm thử |
| Ảnh hưởng tới lõi miền | Có `abstract class`, `protected`, `readonly`, giao diện — đủ để ánh xạ 1:1 với Class Diagram |

**Ưu điểm**

- Kiểu dữ liệu góc nhìn và tên sự kiện khai báo **một lần** trong `packages/shared`, cả hai
  phía dùng chung — trình biên dịch bắt lỗi lệch hợp đồng
- Socket.IO tự lùi về HTTP long-polling khi WebSocket bị chặn — phương án dự phòng "truy
  vấn định kỳ" ở mục 13.3 tài liệu gốc **có sẵn**, không phải viết
- Node.js 24 đã cài trên máy phát triển

**Nhược điểm**

- Hướng đối tượng trong TypeScript "mềm" hơn Java/C#: không có `final`, kiểu chỉ kiểm lúc
  biên dịch. Bù lại bằng `strict: true` và quy tắc lint
- Một tiến trình Node duy nhất giữ trạng thái ván trong bộ nhớ — chấp nhận ở quy mô đồ án

### Phương án B — Java Spring Boot + React

| Mục | Nội dung |
|---|---|
| Giấy phép | Apache-2.0 |
| Mức độ quen thuộc | Trung bình — tùy môn đã học |
| Độ khó tích hợp | Trung bình — hai ngôn ngữ, hai hệ công cụ, phải tự viết lại kiểu DTO phía web |
| Ảnh hưởng tới lõi miền | Hướng đối tượng chặt nhất, rất hợp khi bảo vệ đồ án OOAD |

**Nhược điểm**: máy phát triển chưa cài JDK; đồng bộ tức thời qua STOMP/WebSocket phải tự
lo phương án dự phòng; hợp đồng dữ liệu khai báo hai lần.

### Phương án C — C# ASP.NET Core + SignalR + React

| Mục | Nội dung |
|---|---|
| Giấy phép | MIT |
| Mức độ quen thuộc | Thấp–trung bình |
| Độ khó tích hợp | Trung bình |
| Ảnh hưởng tới lõi miền | Hướng đối tượng chặt; SignalR cũng tự lùi về long-polling |

**Nhược điểm**: hai ngôn ngữ; nhóm ít kinh nghiệm .NET hơn JavaScript.

---

## Quyết định

Chọn Phương án A — TypeScript toàn tầng, tổ chức thành một kho nhiều gói bằng
npm workspaces.

| Tầng | Công nghệ | Giấy phép |
|---|---|---|
| Ngôn ngữ | TypeScript, `strict: true` | Apache-2.0 |
| Môi trường chạy | Node.js 24 LTS | MIT |
| Máy chủ HTTP | Express 5 | MIT |
| Đồng bộ tức thời | Socket.IO 4 | MIT |
| Kiểm tra dữ liệu vào | Zod | MIT |
| Cơ sở dữ liệu | PostgreSQL 17 | PostgreSQL License |
| Truy xuất dữ liệu và migration | Prisma | Apache-2.0 |
| Băm mật khẩu | bcryptjs — thuần JavaScript, không cần biên dịch gốc trên Windows | MIT |
| Phiên đăng nhập | JWT trong cookie `httpOnly`, ký bằng `jose` | MIT |
| Giao diện | React 19 + Vite | MIT |
| Định tuyến và trạng thái phía web | React Router, Zustand | MIT |
| Kiểu dáng | Tailwind CSS 4, token màu xuất từ Claude Design | MIT |
| Kiểm thử | Vitest | MIT |
| Đóng gói | Docker Compose | Apache-2.0 |

Phiên bản cụ thể lấy bản ổn định mới nhất lúc cài và **ghim trong `package-lock.json`**.

---

## Lý do

Tiêu chí quyết định chính là **một hợp đồng dữ liệu cho cả hai phía** (bảo vệ PC04 bằng
trình biên dịch) và **phương án dự phòng đồng bộ có sẵn**. Cả hai đánh trúng hai rủi ro
trọng yếu tài liệu gốc đã nêu: "kỹ thuật đồng bộ vượt khả năng" và lộ vai qua công cụ
phát triển.

Lõi miền là TypeScript thuần, không phụ thuộc khung nào. Nếu giảng viên yêu cầu Java hoặc
C#, thiết kế lớp giữ nguyên — chỉ phải chép lại cú pháp, và làm việc đó ở tuần 3 rẻ hơn
nhiều so với tuần 12.

---

## Hệ quả

**Điều gì trở nên dễ hơn**

- Người chơi ảo, bộ mô phỏng và bộ kiểm thử chạy chung một ngôn ngữ với máy chủ
- Chuyển một thành viên từ phía máy chủ sang phía giao diện không cần học ngôn ngữ mới

**Điều gì trở nên khó hơn**

- Phải tự kỷ luật để lõi miền không nhập thư viện của khung — dùng quy tắc lint chặn,
  xem hạng mục 0.7
- Trạng thái ván nằm trong bộ nhớ một tiến trình: khởi động lại máy chủ thì mất ván đang
  chạy. Chấp nhận ở MVP, ghi công khai trong báo cáo

**Việc phải làm tiếp**

- [x] Cả nhóm đọc và đồng ý — hạng mục 0.9
- [ ] Hỏi giảng viên có ràng buộc ngôn ngữ nào không
- [ ] Chuyển trạng thái sang *Đã chấp nhận*, cập nhật `ARCHITECTURE.md` mục 3 và
      `PROJECT_STATE.md`
