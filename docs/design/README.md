# Thiết kế giao diện — Làng Trăng Mờ

Thiết kế Giai đoạn 3 được dựng **thẳng thành bản chạy được** trong `apps/web`. Ảnh trong thư mục
này chụp từ bản chạy đó.

```bash
npm run dev:web
```

Mở `http://localhost:5173`:

| Đường dẫn | Màn | Ghi chú |
|---|---|---|
| `/dang-nhap`, `/dang-ky` | MH01 — UC02, UC01 | **Chỉ giao diện**: kiểm dữ liệu nhập rồi mở ván mẫu. Máy chủ tài khoản làm ở ROADMAP 4.1–4.2 |
| `/van-mau` | MH04–MH08 | Phát lại một ván mô phỏng thật (8 người, hạt giống 1). Đổi ghế để xem bằng mắt người khác; tới lượt người xem thì tự dừng chờ chọn |

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

## Ảnh

| Tệp | Màn |
|---|---|
| `mh01-dang-nhap.jpg` | MH01 — đăng nhập: tia trăng, quạt thẻ, khung Magic Card |
| `mh01-dang-ky-bao-loi.jpg` | MH01 — đăng ký, gửi trống: báo lỗi từng ô |
| `mh02-trang-chu.jpg` | MH02 — trang chủ: dựng phòng, nhập mã sáu ô, phòng đang mở cửa |
| `mh03-phong-cho.jpg` | MH03 — phòng chờ: bàn tròn mười hai ghế, bộ vai có kiểm tức thời |
| `mh08-ket-thuc.jpg` | MH08 — ván thật kết thúc: phe thắng, lật vai cả làng, "Về phòng chờ" |
| `mh09-ho-so.jpg` | MH09 — hồ sơ: thống kê, đổi tên, chọn tranh thẻ làm ảnh đại diện |
| `uc04-lich-su.jpg` | UC04 — mở lại ván cũ: lật vai cả làng, diễn biến từng lượt |
| `mh04-the-vai.jpg` | MH04 — thẻ Bảo vệ lật ngửa |
| `mh05-dem-3d.jpg` | MH05 — đêm thứ hai, lượt Bảo vệ: quân người chết đã ngã, bảng việc có vòng đếm ngược |
| `mh07-treo-co-3d.jpg` | MH07 — cảnh treo cổ sau bỏ phiếu |

## Còn thiếu

- Danh sách kiểm sáu nguyên tắc mục 14.2 tài liệu gốc (hạng mục 3.4)
- Đo hiệu năng cảnh 3D trên máy yếu và điện thoại thật
