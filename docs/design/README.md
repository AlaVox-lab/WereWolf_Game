# Thiết kế giao diện — Làng Trăng Mờ

Thiết kế Giai đoạn 3 được dựng **thẳng thành bản chạy được** trong `apps/web`, không qua bản vẽ
tĩnh: mở là xem được chuyển động thật. Ảnh trong thư mục này chụp từ bản chạy đó.

```bash
npm run xuat-xem-truoc
```

```bash
npm run dev:web
```

Mở `http://localhost:5173`: trang phát lại một ván mô phỏng thật (8 người, hạt giống 1, Sói thắng
sau 5 lượt). Thanh điều khiển góc dưới trái cho tạm dừng, tua, đổi tốc độ và **đổi ghế** để xem
cùng ván bằng mắt người khác. Khi tới lượt người đang xem, bản xem trước tự dừng chờ chọn.

## Ý tưởng

**Làng Trăng Mờ** — mặt trăng (đêm) hay mặt trời (ngày) đi trên vòng cung trời và chính là
**đồng hồ của pha**. Đêm phủ màn mờ lên cả làng nhưng chừa một vầng sáng quanh bàn tròn — ánh
nến giữa bàn là chỗ sáng nhất, mọi thứ trên bàn vẫn đọc được. Mỗi khung chữ là một **tấm gỗ
chồng lớp**, cảnh có chín lớp trôi theo con trỏ với độ sâu khác nhau.

| Thành phần | Cách làm |
|---|---|
| Chữ | Cormorant Garamond (tên vai, tên pha, khoảnh khắc) + Be Vietnam Pro (mọi chữ đọc), đều có bộ ký tự tiếng Việt, giấy phép OFL |
| Màu | `apps/web/src/styles/tokens.css` — hai không khí `data-thoi="dem"` / `"ngay"`, màu phe, màu từng vai, màu trạng thái |
| Hình | Toàn bộ vẽ bằng SVG/CSS trong mã: núi, rừng, làng có cửa sổ sáng đèn, sương, trăng, mặt trời, bàn, giá treo cổ, sáu huy hiệu vai |
| Chuyển động | Thư viện `motion` (MIT); mọi chuyển động có phương án `prefers-reduced-motion` |

## Khoảnh khắc

| Khoảnh khắc | Khi nào | Diễn |
|---|---|---|
| Đêm buông / trời rạng | Đổi giữa pha đêm và pha ngày | Trăng lặn, mặt trời mọc theo vòng cung; trời, núi, rừng đổi màu 2 giây; ống kính tiến sát bàn khi đêm |
| Gọi vai | Đổi bước đêm (thứ tự bước công khai, Q05) | Huy hiệu vai phóng to giữa màn, vầng màu vai; người đúng vai được báo "Đến lượt bạn" |
| Công bố sáng | Vào pha công bố | Đĩa người chết hiện lần lượt rồi xám dần — không nói nguyên nhân |
| Treo cổ | Người chết đầu tiên của pha phán quyết | Giá treo dựng lên giữa bàn, dây thả xuống, huy hiệu rơi xuống đung đưa rồi lịm — không lộ vai |
| Trúng tên | Người chết tiếp theo trong pha phán quyết | Mũi tên bay ngang màn, cắm vào đĩa người trúng — không lộ ai bắn (Q09) |
| Hết ván | `ketThuc` có trong góc nhìn | Tên phe thắng, lật vai cả làng, bản ghi diễn biến |

## Ảnh

| Tệp | Màn |
|---|---|
| `mh05-dem-phu-thuy.jpg` | MH05 — đêm, lượt Phù thủy: nạn nhân, hai lọ, đồng hồ vòng (máy tính) |
| `mh05-dem-dien-thoai.jpg` | MH05 — đêm, lượt Bảo vệ đã chọn một người (điện thoại 375 px) |
| `mh06-cong-bo-sang.jpg` | MH06 — trời sáng, công bố người chết đêm qua |
| `mh07-treo-co.jpg` | MH07 — cảnh treo cổ sau bỏ phiếu, trời chiều tà |
| `mh08-ket-thuc.jpg` | MH08 — phe Sói thắng, lật vai cả làng |

## Còn thiếu

- Màn ngoài ván: MH01 đăng nhập, MH02 trang chủ, MH03 phòng chờ, MH03b cấu hình bộ luật
- Kênh Sói và khung chat (bong bóng tin nhắn, nhãn kênh)
- Danh sách kiểm sáu nguyên tắc mục 14.2 tài liệu gốc (hạng mục 3.4)
- Thay hình vẽ bằng tranh sinh từ Higgsfield khi tài khoản có credit — chỉ cần thay lớp cảnh trong
  `apps/web/src/game/Canh.tsx`, các lớp khác giữ nguyên
