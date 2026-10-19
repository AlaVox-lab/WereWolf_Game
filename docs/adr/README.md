# Bản ghi quyết định kiến trúc

Thư mục này lưu các Architecture Decision Record (ADR) — mỗi tệp ghi một quyết định
kiến trúc quan trọng, gồm cả **quyết định gì** lẫn **vì sao**.

## Vì sao cần

Khi bảo vệ đồ án, câu hỏi thường gặp nhất không phải "nhóm dùng gì" mà là "vì sao dùng
cái đó". ADR giữ lại lý do tại đúng thời điểm quyết định, để ba thành viên trả lời giống
nhau và để không ai đề xuất lại phương án đã bị loại.

## Quy ước đặt tên

`NNNN-mo-ta-ngan.md`, `NNNN` là số thứ tự bốn chữ số tăng dần. Ví dụ
`0001-chon-bo-cong-nghe.md`.

## Trạng thái

`Đề xuất` → `Đã chấp nhận` → (có thể) `Đã thay thế bởi ADR-NNNN`.

Bản ghi *Đề xuất* **chưa phải quyết định** — được phép dựng thử, nhưng chưa coi là chốt.
Bản ghi đã chấp nhận thì không sửa nội dung; quyết định đổi thì viết bản ghi mới và đánh
dấu bản cũ là đã bị thay thế.

## Danh mục

| Mã | Tiêu đề | Trạng thái |
|---|---|---|
| [0000](0000-mau-ban-ghi-quyet-dinh.md) | Mẫu bản ghi | — |
| [0001](0001-chon-bo-cong-nghe.md) | Chọn bộ công nghệ TypeScript toàn tầng | Đã chấp nhận |
