# Thiết kế giao diện — Làng Trăng Mờ

Thiết kế Giai đoạn 3 được dựng **thẳng thành bản chạy được** trong `apps/web`, rồi nối máy chủ
thật ở Giai đoạn 5 và 7. Ảnh trong thư mục này chụp từ bản chạy đó (mục *Ảnh màn thật*).

```bash
npm run dev:server
npm run dev:web
```

Mở `http://localhost:5173` (tài khoản seed: `ngan` / `langtrang1`, quản trị `quantri` / `quantri123`):

| Đường dẫn | Màn | Ghi chú |
|---|---|---|
| `/dang-nhap`, `/dang-ky` | MH01 — UC02, UC01 | Gọi API thật; `?tiep=` đưa về trang trước (liên kết mời) |
| `/` | MH02 — UC06, UC07 | Dựng phòng, vào bằng mã sáu ô, phòng công khai |
| `/phong/:ma` | MH03, MH03b → MH04–MH08 | Phòng chờ và cấu hình luật; khi ván bắt đầu là màn chơi 3D thật qua Socket.IO. Cũng là liên kết mời (UC09) |
| `/lich-su`, `/lich-su/:vanId` | UC04, UC21 | Ván đã chơi, mở lại nhật ký, báo cáo vi phạm |
| `/xep-hang` | MH10 — UC05 | Bảng mùa hiện tại |
| `/ho-so` | MH09 — UC03 | Đổi tên, ảnh đại diện, thống kê |
| `/quan-tri` | MH11 — UC22–UC24 | Chỉ quản trị viên |
| `/van-mau` | MH04–MH08 | Phát lại một ván mô phỏng (8 người, hạt giống 1), không cần đăng nhập — dùng khi trình diễn mất mạng |

Tạo lại ván mẫu: `npm run xuat-xem-truoc`.

## Ý tưởng

**Làng Trăng Mờ** — một bàn tròn gỗ giữa bãi đất trống trong rừng thông, ba ngọn nến là chỗ sáng
nhất của đêm. Mặt trăng (đêm) hay mặt trời (ngày) đi trên vòng cung trời và là **đồng hồ của
pha**. Thẻ vai là **tranh khắc châu Âu thế kỷ 16** — đúng không khí dân gian của truyện người sói —
mặt sau mọi thẻ là tấm "Trăng tròn" của Claude Mellan (1635), cũng là mặt trăng treo trên trời.

| Thành phần | Làm bằng | Nguồn |
|---|---|---|
| Cảnh 3D: bàn, nến, quân người chơi, thẻ trên bàn, rừng, làng, trời, đom đóm, giá treo cổ, mũi tên | `three` + `@react-three/fiber` + `@react-three/drei` (`Sky`, `Stars`, `Sparkles`, `Billboard`, `Html`, `useTexture`) | Sổ tay SKILLS: *10 thư viện motion cho web* |
| Nền tia trăng ở MH01 | `GodRays` của `@paper-design/shaders-react` (ghim bản 0.0.82) | SKILLS: *8 repo thiết kế UI & hiệu ứng* |
| Khung biểu mẫu MH01 | `MagicCard` — Magic UI | SKILLS: *10 trang cho UI/UX designer* |
| Vòng đếm ngược, viền sáng khi tới lượt | `AnimatedCircularProgressBar`, `BorderBeam` — Magic UI | như trên |
| Chữ hiện từng ký tự, chữ lấp lánh | `TextEffect`, `TextShimmer` — Motion Primitives | SKILLS: *8 repo thiết kế UI & hiệu ứng* |
| Ô nhập, nhãn, nút | `Input`, `Label`, `Button` — shadcn/ui | registry shadcn |
| Quạt thẻ, thẻ lật, chuyển cảnh | `motion` | SKILLS: *10 thư viện motion cho web* |

Component registry nằm ở `apps/web/src/components/ui/`, kéo bằng `npx shadcn@latest add`
(`apps/web/components.json`). Biến theme của chúng (`--color-primary`…) được ánh xạ về token ở
`src/index.css` — không sửa mã component. Riêng `apps/web` tắt `exactOptionalPropertyTypes` vì mã
registry viết theo tsconfig mặc định của shadcn; máy chủ và lõi miền vẫn bật.

## Khoảnh khắc

| Khoảnh khắc | Trong cảnh 3D | Lời dẫn |
|---|---|---|
| Đêm buông / trời rạng | Trời Rayleigh tối dần, trăng lên theo cung, đèn trăng xanh bạc thay nắng, cửa sổ làng sáng đèn, đom đóm hiện, máy quay tiến sát bàn | "Màn đêm buông xuống" |
| Gọi vai (Q05) | Thẻ của vai trồi lên từ ánh nến, quay về phía người xem rồi lật ngửa trong quầng màu vai | "Bầy Sói mở mắt"… |
| Công bố sáng | Quân người chết ngã ra khỏi bàn, thẻ trước mặt họ tối lại — không lộ vai | Tên người chết, không nguyên nhân |
| Treo cổ | Giá treo dựng lên từ dưới đất sau bàn, dây thả xuống, quân rơi vào thòng lọng, đung đưa tắt dần rồi xám lại; máy quay ngẩng lên | "Làng đã treo cổ …" |
| Trúng tên | Mũi tên bay ngang cảnh, cắm vào quân người trúng — không lộ ai bắn (Q09) | |
| Hết ván | Mọi thẻ trên bàn lật ngửa | Phe thắng, lật vai cả làng, bản ghi diễn biến |

Mọi chuyển động có phương án `prefers-reduced-motion` (đổi ngay, không bay).

## Tranh thẻ vai — phạm vi công cộng

Lấy từ **The Met Open Access** (CC0 — dùng tự do, không bắt buộc ghi nguồn; vẫn ghi để tôn trọng
tác giả). Mỗi tranh đã được API của Met xác nhận `isPublicDomain: true`. Bản gốc chuyển xám, cắt
khung 2:3, lưu ở `apps/web/public/the-vai/`; dữ liệu nguồn ở `nguon.json` cùng thư mục.

| Vai | Tranh | Tác giả | Năm | Met |
|---|---|---|---|---|
| Sói | The Werewolf or the Cannibal | Lucas Cranach the Elder | khoảng 1512 | [383718](https://www.metmuseum.org/art/collection/search/383718) |
| Bảo vệ | Knight, Death, and the Devil | Albrecht Dürer | 1513 | [336223](https://www.metmuseum.org/art/collection/search/336223) |
| Tiên tri | The Cumaean Sibyl | Agostino Veneziano | 1516 | [342840](https://www.metmuseum.org/art/collection/search/342840) |
| Phù thủy | The Alchemist (cắt nửa trái) | Pieter Bruegel the Elder | sau 1558 | [366817](https://www.metmuseum.org/art/collection/search/366817) |
| Thợ săn | Saint Eustace | Albrecht Dürer | khoảng 1501 | [336232](https://www.metmuseum.org/art/collection/search/336232) |
| Dân làng | Peasant Couple Dancing | Albrecht Dürer | 1514 | [391212](https://www.metmuseum.org/art/collection/search/391212) |
| Mặt sau thẻ, mặt trăng | Full Moon | Claude Mellan | 1635 | [393543](https://www.metmuseum.org/art/collection/search/393543) |

Không dùng bộ thẻ *Ultimate Werewolf* hay *Loups-Garous de Thiercelieux*: tranh có bản quyền. Các bộ
"miễn phí" trên mạng đều không ghi giấy phép.

## Ảnh màn thật (ROADMAP 8.2)

Thiết kế dựng thẳng thành mã nên ảnh thiết kế **chính là** ảnh màn chạy. Cột *Nguồn* cho biết
ảnh chụp từ ván thật (máy chủ + PostgreSQL, 1–2 người thật và người chơi ảo) hay từ ván mẫu.

| Màn | Tệp | Nội dung | Nguồn |
|---|---|---|---|
| MH01 | `mh01-dang-nhap.jpg` | Đăng nhập: tia trăng, quạt thẻ, khung Magic Card | bản chạy |
| MH01 | `mh01-dang-ky-bao-loi.jpg` | Đăng ký gửi trống: báo lỗi từng ô | bản chạy |
| MH02 | `mh02-trang-chu.jpg` | Dựng phòng, nhập mã sáu ô, phòng đang mở cửa | ván thật |
| MH03 | `mh03-phong-cho.jpg` | Bàn tròn mười hai ghế, bộ vai có kiểm tức thời | ván thật |
| MH03b | `mh03b-luat-choi.jpg` | Thẻ "Luật chơi": sáu công tắc kèm nội dung luật | ván thật |
| MH04 | `mh04-the-vai-that.jpg` | Thẻ Sói lật ngửa lúc chia bài | ván thật |
| MH04 | `mh04-the-vai.jpg` | Thẻ Bảo vệ lật ngửa | ván mẫu |
| MH05 | `mh05-dem-kenh-soi.jpg` | Đêm thứ nhất, lượt Sói: kênh "Bầy Sói" tự mở, bảng việc | ván thật |
| MH05 | `mh05-dem-3d.jpg` | Đêm thứ hai, lượt Bảo vệ: quân người chết đã ngã | ván mẫu |
| MH06 | `mh06-ngay-thao-luan.jpg` | Ban ngày, thảo luận: kênh chung, đồng hồ pha | ván thật |
| MH07 | `mh07-treo-co-3d.jpg` | Cảnh treo cổ sau bỏ phiếu | ván mẫu |
| MH08 | `mh08-ket-thuc.jpg` | Phe thắng, lật vai cả làng, "Về phòng chờ" | ván thật |
| MH09 | `mh09-ho-so.jpg` | Thống kê, đổi tên, chọn tranh thẻ làm ảnh đại diện | ván thật |
| MH10 | `mh10-xep-hang.jpg` | Bục ba người đầu và bảng điểm mùa | ván thật |
| MH11 | `mh11-quan-tri.jpg` | Số liệu, ván thắng theo phe, thẻ báo cáo, tài khoản | ván thật |
| UC04 | `uc04-lich-su.jpg` | Mở lại ván cũ: lật vai cả làng, diễn biến từng lượt | ván thật |

Ảnh chụp trong khung xem trước của trình duyệt nên có tấm bị cắt mép phải; chụp lại toàn màn
hình trước khi chèn báo cáo nếu cần.

## Còn thiếu

- Danh sách kiểm sáu nguyên tắc mục 14.2 tài liệu gốc (hạng mục 3.4)
- Đo hiệu năng cảnh 3D trên máy yếu và điện thoại thật
