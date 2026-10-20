# Mô phỏng Giai đoạn 2 — đầu ra cho báo cáo

Sinh bằng bộ mô phỏng toàn người chơi ảo (hạng mục 2.9) lúc khép Giai đoạn 2 (2.10). Cùng lệnh, cùng
hạt giống cho cùng kết quả (PC03) — chạy lại để kiểm chứng.

## 1. Nhật ký một ván mẫu — minh họa Sequence Diagram pha đêm

Ván **ST02**: 8 người, bộ vai mặc định, mọi quy tắc bật, hạt giống 1 — phe Sói thắng sau 5 lượt,
có đủ bốn nguyên nhân chết (cắn, độc, treo cổ, bắn).

```bash
npm run mo-phong -- --so-nguoi 8 --hat-giong 1
```

Đối chiếu với [`04-sequence-pha-dem.puml`](../diagrams/04-sequence-pha-dem.puml), đêm 1:

| Thông điệp trên sơ đồ | Dòng nhật ký |
|---|---|
| Bảo vệ chọn người bảo vệ | `[0:03] p1 BAO_VE → p7` |
| Bầy Sói thống nhất mục tiêu | `[0:48] p6 CAN → p7` — một ý định cho cả bầy |
| Tiên tri soi, nhận phe riêng | `[0:52] p8 SOI_THONG_TIN → p2`, `p8 soi p2: phe DAN` |
| Phù thủy xem nạn nhân, dùng thuốc | `[0:54] p3 DOC → p5` |
| `BoGiaiQuyetDem.giaiQuyet()` | `── GIAI_QUYET_DEM`, `Kết quả đêm: 1 người chết` |
| Công bố buổi sáng (không kèm nguyên nhân) | `── PHA_CONG_BO` — nguyên nhân chỉ có trong nhật ký sau ván |

p7 được bảo vệ nên vết cắn vô hiệu; p5 (Sói) chết vì độc. Thời điểm trong ngoặc là đồng hồ giả lập,
mỗi bước đêm dài tối đa theo `CauHinhThoiGian` (Q05).

Hai điểm khi đọc nhật ký: lần chuyển sang đêm đầu tiên xảy ra lúc bắt đầu ván, trước khi bộ điều
phối nhận ván, nên không có dòng `── PHA_DEM` mở đầu; và dòng `── PHA_DEM (lượt n)` mang số của
lượt **vừa xong** — lượt mới được tạo khi đêm bắt đầu, thấy ở dòng `GIAI_QUYET_DEM` kế tiếp.

```text
Ván 8 người, hạt giống 1

[ 0:00] Chia vai: p1=BaoVe, p2=DanLang, p3=PhuThuy, p4=ThoSan, p5=Soi, p6=Soi, p7=DanLang, p8=TienTri
[ 0:03]    p1 BAO_VE → p7
[ 0:48]    p6 CAN → p7
[ 0:52]    p8 SOI_THONG_TIN → p2
[ 0:52]    p8 soi p2: phe DAN
[ 0:54]    p3 DOC → p5
[ 0:54] ── GIAI_QUYET_DEM (lượt 1)
[ 0:54]    Kết quả đêm: 1 người chết
[ 0:54]    ✝ p5 — BI_DOC
[ 0:54] ── PHA_CONG_BO (lượt 1)
[ 1:00] ── PHA_THAO_LUAN (lượt 1)
[ 3:00] ── PHA_BO_PHIEU (lượt 1)
[ 3:01]    p8 bầu p3
[ 3:01]    p2 bầu p3
[ 3:02]    p4 bầu p2
[ 3:02]    p7 bầu p2
[ 3:02]    p3 bầu p4
[ 3:03]    p6 bầu p2
[ 3:03]    p1 bầu p8
[ 3:03]    Kết quả bỏ phiếu: TREO_CO p2
[ 3:03] ── GIAI_QUYET_PHIEU (lượt 1)
[ 3:03]    ✝ p2 — BI_TREO_CO
[ 3:03] ── PHA_DEM (lượt 1)
[ 3:04]    p1 BAO_VE → p4
[ 3:06]    p6 CAN → p1
[ 3:07]    p8 SOI_THONG_TIN → p1
[ 3:07]    p8 soi p1: phe DAN
[ 3:10]    p3 CUU → p1
[ 3:10] ── GIAI_QUYET_DEM (lượt 2)
[ 3:10]    Kết quả đêm: 0 người chết
[ 3:10] ── PHA_CONG_BO (lượt 2)
[ 3:16] ── PHA_THAO_LUAN (lượt 2)
[ 5:16] ── PHA_BO_PHIEU (lượt 2)
[ 5:17]    p8 bầu p4
[ 5:17]    p1 bầu p3
[ 5:18]    p3 bầu p1
[ 5:18]    p6 bầu p1
[ 5:19]    p4 bầu p8
[ 5:19]    p7 bầu p8
[ 5:19]    Kết quả bỏ phiếu: KHONG_AI
[ 5:19] ── GIAI_QUYET_PHIEU (lượt 2)
[ 5:19] ── PHA_DEM (lượt 2)
[ 5:23]    p1 BAO_VE → p7
[ 5:25]    p6 CAN → p4
[ 5:26]    p8 SOI_THONG_TIN → p6
[ 5:26]    p8 soi p6: phe SOI
[ 5:51] ── GIAI_QUYET_DEM (lượt 3)
[ 5:53]    Kết quả đêm: 2 người chết
[ 5:53]    ✝ p4 — BI_CAN
[ 5:53]    ✝ p8 — BI_BAN (bởi p4)
[ 5:53] ── PHA_CONG_BO (lượt 3)
[ 5:59] ── PHA_THAO_LUAN (lượt 3)
[ 7:59] ── PHA_BO_PHIEU (lượt 3)
[ 8:01]    p3 bầu p7
[ 8:02]    p6 bầu p1
[ 8:02]    p1 bầu p3
[ 8:03]    p7 bầu p6
[ 8:03]    Kết quả bỏ phiếu: KHONG_AI
[ 8:03] ── GIAI_QUYET_PHIEU (lượt 3)
[ 8:03] ── PHA_DEM (lượt 3)
[ 8:07]    p1 BAO_VE → p3
[ 8:10]    p6 CAN → p7
[ 8:47] ── GIAI_QUYET_DEM (lượt 4)
[ 8:47]    Kết quả đêm: 1 người chết
[ 8:47]    ✝ p7 — BI_CAN
[ 8:47] ── PHA_CONG_BO (lượt 4)
[ 8:53] ── PHA_THAO_LUAN (lượt 4)
[10:53] ── PHA_BO_PHIEU (lượt 4)
[10:54]    p3 bầu p6
[10:56]    p1 bầu p3
[10:56]    p6 bầu p1
[10:56]    Kết quả bỏ phiếu: KHONG_AI
[10:56] ── GIAI_QUYET_PHIEU (lượt 4)
[10:56] ── PHA_DEM (lượt 4)
[10:58]    p1 BAO_VE → p1
[10:59]    p6 CAN → p3
[11:35] ── GIAI_QUYET_DEM (lượt 5)
[11:35]    Kết quả đêm: 1 người chết
[11:35]    ✝ p3 — BI_CAN
[11:35] ══ Phe SOI thắng

5 lượt, 11:35 giả lập.
```

## 2. Tỉ lệ thắng theo số người — căn cứ cân bằng bộ vai mặc định

1 000 ván, 6–12 người xoay vòng, bộ vai `CauHinhVai.macDinh(n)`, mọi quy tắc bật:

```bash
npm run mo-phong -- --so-nguoi 6-12 --so-van 1000
```

| Số người | Ván | Dân thắng | Sói thắng | Lượt TB | Lượt min–max | Phút giả lập TB |
|---|---|---|---|---|---|---|
| 6 | 143 | 74 (52 %) | 69 (48 %) | 1,8 | 1–6 | 3,5 |
| 7 | 143 | 40 (28 %) | 103 (72 %) | 2,2 | 1–5 | 5,2 |
| 8 | 143 | 45 (31 %) | 98 (69 %) | 2,7 | 1–6 | 6,8 |
| 9 | 143 | 43 (30 %) | 100 (70 %) | 3,6 | 1–6 | 9,3 |
| 10 | 143 | 21 (15 %) | 122 (85 %) | 3,6 | 1–7 | 10,0 |
| 11 | 143 | 27 (19 %) | 116 (81 %) | 4,4 | 2–9 | 12,4 |
| 12 | 142 | 21 (15 %) | 121 (85 %) | 5,1 | 2–8 | 14,6 |

**Cách đọc.** Người chơi ảo chọn ngẫu nhiên trong các lựa chọn hợp lệ: Dân ảo bầu ngẫu nhiên, không
dùng kết quả soi, nên phe Sói — vốn có thông tin đầy đủ về đồng đội — áp đảo khi đông người. Số liệu
**không** chứng minh bộ vai mất cân bằng với người thật; nó là **mốc so sánh** khi chỉnh luật hoặc
bộ vai: một thay đổi đẩy tỉ lệ ra xa mốc này đáng được xem lại trước khi chơi thử.

## 3. Kiểm chứng tự động

[`apps/server/tests/system/heThong.test.ts`](../../apps/server/tests/system/heThong.test.ts) chạy
trong `npm test` và CI:

- **ST01** — 6 người, hạt giống 1, phe Dân thắng; **ST02** — ván mẫu ở mục 1. Kiểm: phe thắng khớp
  công thức BR01/BR02, nhật ký liền mạch, trạng thái cuối dựng lại được chỉ từ nhật ký, màn kết thúc
  của từng người chơi công bố đúng phe.
- **ST04** — dây chuyền Thợ săn ban đêm và ban ngày: số người chết, thứ tự công bố.
- **1 000 ván** 6–12 người, bộ luật bật tắt theo hạt giống: đều kết thúc, không ném lỗi, kết thúc
  **đúng lúc** — không lần chuyển pha nào xảy ra khi đã có phe thỏa BR01/BR02.
