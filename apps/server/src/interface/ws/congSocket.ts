// Cổng Socket.IO (ROADMAP 4.7–4.9) — chiếu sự kiện miền thành gói tin, nhận lệnh của người chơi.
//
// - Bắt tay đọc cùng cookie phiên với REST. Mỗi tài khoản một phòng socket `tk:<id>` (nhiều tab).
// - Dữ liệu ván gửi đi **chỉ** là GocNhinNguoiChoi của chính người nhận (PC04, ST05) — dựng lại
//   sau mỗi sự kiện ván và mỗi lệnh, gửi khi khác lần trước; thêm một nhịp làm mới mỗi giây để
//   tiến độ bỏ phiếu của người chơi ảo hiện ra.
// - Lệnh kiểm bằng Zod, trả lời qua acknowledgement `{ ok } | { ok: false, loi, thongDiep }`.
// - BR13: mất kết nối không dừng ván; kết nối lại nhận ngay ảnh chụp phòng, góc nhìn, lịch sử
//   kênh. Q04: quá nửa người còn sống mất kết nối liên tục quá ngưỡng thì hủy ván.
import type {
  LenhNguoiChoi,
  PhanHoiLenh,
  SuKienMayChu,
  TinNhanCongKhai,
} from '@moonvillage/shared';
import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { z, ZodError } from 'zod';
import type { SoDangKyPhong } from '../../application/phong/SoDangKyPhong.js';
import type { DichVuTaiKhoan, ThongTinPhien } from '../../application/taikhoan/DichVuTaiKhoan.js';
import type { SoDangKyVan, VanDangChay } from '../../application/van/SoDangKyVan.js';
import { taoGocNhin } from '../../application/taoGocNhin.js';
import { LoiNghiepVu } from '../../domain/chung/LoiNghiepVu.js';
import type { LoaiKenh } from '../../domain/kenh/KenhChat.js';
import type { TinNhan } from '../../domain/kenh/TinNhan.js';
import { docCookie, TEN_COOKIE, type BoPhien } from '../../infrastructure/auth/phien.js';
import { dichLoi } from '../thongDiepLoi.js';

export interface PhuThuocSocket {
  taiKhoan: DichVuTaiKhoan;
  phien: BoPhien;
  phong: SoDangKyPhong;
  van: SoDangKyVan;
  /** Q04 — mất kết nối liên tục quá ngưỡng này thì tính là bỏ đi. Mặc định 120 giây. */
  nguongMatKetNoiMs?: number;
  chuKyKiemTraMs?: number;
  chuKyLamMoiMs?: number;
}

type DuLieuSocket = { phien: ThongTinPhien };
type SocketNguoiChoi = Socket<LenhNguoiChoi, SuKienMayChu, Record<string, never>, DuLieuSocket>;

const KHONG_CO_GI = z.object({}).passthrough();
const LUOC_DO = {
  'phong:vao': z.object({ maPhong: z.string().min(1).max(12) }),
  'phong:roi': KHONG_CO_GI,
  'phong:loai': z.object({ taiKhoanId: z.string().min(1).max(40) }),
  'phong:cau-hinh-vai': z.object({ soLuong: z.record(z.string(), z.number()) }),
  'phong:goi-y-vai': KHONG_CO_GI,
  'phong:cau-hinh-luat': z.object({ ma: z.string().max(8), dangBat: z.boolean() }),
  'phong:cong-khai': z.object({ congKhai: z.boolean() }),
  'phong:them-nguoi-ao': KHONG_CO_GI,
  'phong:bot-nguoi-ao': KHONG_CO_GI,
  'phong:bat-dau': KHONG_CO_GI,
  'van:hanh-dong': z.object({
    mucTieuId: z.string().min(1).max(40),
    loai: z.enum(['CUU', 'DOC']).optional(),
  }),
  'van:bo-phieu': z.object({ mucTieuId: z.string().min(1).max(40).nullable() }),
  'kenh:gui': z.object({
    kenh: z.enum(['CHUNG', 'SOI', 'NGUOI_CHET']),
    noiDung: z.string().max(2000),
  }),
} satisfies Record<keyof LenhNguoiChoi, z.ZodType>;

const tin = (t: TinNhan): TinNhanCongKhai => ({
  thuTu: t.thuTu,
  kenh: t.kenh as TinNhanCongKhai['kenh'],
  nguoiGuiId: t.nguoiGuiId,
  noiDung: t.noiDung,
  thoiDiem: t.thoiDiem,
});

export function moCongSocket(httpServer: HttpServer, phu: PhuThuocSocket) {
  const io = new Server<LenhNguoiChoi, SuKienMayChu, Record<string, never>, DuLieuSocket>(
    httpServer,
    { path: '/socket.io', serveClient: false },
  );
  const phongTk = (id: string) => `tk:${id}`;
  const soKetNoi = new Map<string, number>();
  const matKetNoiTu = new Map<string, number>();
  const thanhVienTruoc = new Map<string, Set<string>>();
  const gocNhinDaGui = new Map<string, string>();
  const choLamMoi = new Set<string>();

  // ——— Bắt tay: cùng cookie phiên với REST ———
  io.use(async (socket, next) => {
    try {
      const id = await phu.phien.doc(docCookie(socket.handshake.headers.cookie, TEN_COOKIE));
      const phien = id ? await phu.taiKhoan.timPhien(id) : null;
      if (!phien) return next(new Error('CHUA_DANG_NHAP'));
      socket.data.phien = phien;
      next();
    } catch (loi) {
      next(loi as Error);
    }
  });

  // ——— Chiếu ván: góc nhìn riêng từng người ———
  function guiGocNhin(v: VanDangChay, id: string, batBuoc = false) {
    const goc = taoGocNhin(v.dieuPhoi, id);
    const json = JSON.stringify(goc);
    if (!batBuoc && gocNhinDaGui.get(id) === json) return;
    gocNhinDaGui.set(id, json);
    io.to(phongTk(id)).emit('van:goc-nhin', { gocNhin: goc, bayGioMayChu: Date.now() });
  }

  function guiLichSuKenh(v: VanDangChay, id: string) {
    const ql = v.dieuPhoi.quanLyKenh;
    const ds = ql
      .cacKenhXemDuoc(id)
      .flatMap((k) => ql.layTinNhan(k, id))
      .sort((a, b) => a.thuTu - b.thuTu)
      .map(tin);
    io.to(phongTk(id)).emit('kenh:lich-su', ds);
  }

  function lamMoi(vanId: string) {
    let v: VanDangChay;
    try {
      v = phu.van.lay(vanId);
    } catch {
      return; // ván vừa xong — người nghe kết thúc gửi ảnh chụp cuối
    }
    for (const n of v.van.layDanhSachNguoiChoi()) if (!v.nguoiAo.has(n.id)) guiGocNhin(v, n.id);
  }

  function lenLichLamMoi(vanId: string) {
    if (choLamMoi.has(vanId)) return;
    choLamMoi.add(vanId);
    setImmediate(() => {
      choLamMoi.delete(vanId);
      lamMoi(vanId);
    });
  }

  phu.van.dangKy((vanId, sk, nguoiNhan) => {
    if (sk.loai === 'TIN_NHAN') {
      for (const id of nguoiNhan) io.to(phongTk(id)).emit('kenh:tin-nhan', tin(sk.tinNhan));
    }
    lenLichLamMoi(vanId);
  });

  phu.van.dangKyKetThuc((v) => {
    // Ảnh chụp cuối: màn kết thúc (phe thắng, vai cả làng, nhật ký) hoặc ván bị hủy.
    for (const n of v.van.layDanhSachNguoiChoi())
      if (!v.nguoiAo.has(n.id)) guiGocNhin(v, n.id, true);
  });

  // ——— Chiếu phòng ———
  phu.phong.dangKy((ma) => {
    const truoc = thanhVienTruoc.get(ma) ?? new Set<string>();
    if (!phu.phong.coPhong(ma)) {
      for (const id of truoc) io.to(phongTk(id)).emit('phong:cap-nhat', null);
      thanhVienTruoc.delete(ma);
      return;
    }
    const anh = phu.phong.chieu(ma);
    const nay = new Set(anh.thanhVien.filter((t) => !t.laNguoiChoiAo).map((t) => t.id));
    for (const id of nay) io.to(phongTk(id)).emit('phong:cap-nhat', anh);
    for (const id of truoc) {
      if (!nay.has(id) && phu.phong.phongCua(id) === null) {
        io.to(phongTk(id)).emit('phong:cap-nhat', null);
      }
    }
    thanhVienTruoc.set(ma, nay);
    if (anh.vanId) {
      const v = phu.van.lay(anh.vanId);
      for (const id of nay) {
        gocNhinDaGui.delete(id);
        guiLichSuKenh(v, id);
      }
      lenLichLamMoi(anh.vanId);
    }
  });

  // ——— Kết nối ———
  io.on('connection', (socket: SocketNguoiChoi) => {
    const { id } = socket.data.phien;
    void socket.join(phongTk(id));
    soKetNoi.set(id, (soKetNoi.get(id) ?? 0) + 1);
    matKetNoiTu.delete(id);
    phu.phong.datKetNoi(id, true);

    // BR13 — kết nối lại nhận ngay ảnh chụp hiện tại.
    const ma = phu.phong.phongCua(id);
    socket.emit('phong:cap-nhat', ma ? phu.phong.chieu(ma) : null);
    const vanId = phu.van.vanCua(id);
    if (vanId) {
      const v = phu.van.lay(vanId);
      guiGocNhin(v, id, true);
      guiLichSuKenh(v, id);
    }

    function nhan<K extends keyof LenhNguoiChoi>(
      ten: K,
      lam: (duLieu: z.infer<(typeof LUOC_DO)[K]>) => void | Promise<void>,
    ) {
      socket.on(ten, (async (duLieu: unknown, traLoi?: (p: PhanHoiLenh) => void) => {
        try {
          await lam(LUOC_DO[ten].parse(duLieu ?? {}) as z.infer<(typeof LUOC_DO)[K]>);
          traLoi?.({ ok: true });
        } catch (loi) {
          if (loi instanceof ZodError) {
            traLoi?.({
              ok: false,
              loi: 'DU_LIEU_KHONG_HOP_LE',
              thongDiep: 'Dữ liệu gửi lên chưa đúng.',
            });
            return;
          }
          const { than, maHttp } = dichLoi(loi);
          if (maHttp === 500) console.error(loi);
          traLoi?.({ ok: false, ...than });
        }
      }) as never);
    }

    const phongCuaToi = () => {
      const m = phu.phong.phongCua(id);
      if (!m) throw new LoiNghiepVu('KHONG_O_TRONG_PHONG');
      return m;
    };

    nhan('phong:vao', ({ maPhong }) => phu.phong.vaoPhong(maPhong, socket.data.phien));
    nhan('phong:roi', () => phu.phong.roiPhong(phongCuaToi(), id));
    nhan('phong:loai', ({ taiKhoanId }) => phu.phong.loai(phongCuaToi(), id, taiKhoanId));
    nhan('phong:cau-hinh-vai', ({ soLuong }) =>
      phu.phong.datCauHinhVai(phongCuaToi(), id, soLuong),
    );
    nhan('phong:goi-y-vai', () => phu.phong.goiYCauHinhVai(phongCuaToi(), id));
    nhan('phong:cau-hinh-luat', ({ ma, dangBat }) =>
      phu.phong.datQuyTac(phongCuaToi(), id, ma, dangBat),
    );
    nhan('phong:cong-khai', ({ congKhai }) => phu.phong.datCongKhai(phongCuaToi(), id, congKhai));
    nhan('phong:them-nguoi-ao', () => phu.phong.themNguoiChoiAo(phongCuaToi(), id));
    nhan('phong:bot-nguoi-ao', () => phu.phong.botNguoiChoiAo(phongCuaToi(), id));
    nhan('phong:bat-dau', () => {
      phu.phong.batDauVan(phongCuaToi(), id);
    });
    nhan('van:hanh-dong', (luaChon) => {
      phu.van.guiLuaChon(id, luaChon);
      lenLichLamMoi(phu.van.vanCua(id)!);
    });
    nhan('van:bo-phieu', (phieu) => {
      phu.van.guiLuaChon(id, phieu);
      lenLichLamMoi(phu.van.vanCua(id)!);
    });
    nhan('kenh:gui', ({ kenh, noiDung }) => phu.van.guiTin(id, kenh as LoaiKenh, noiDung));

    socket.on('disconnect', () => {
      const con = (soKetNoi.get(id) ?? 1) - 1;
      if (con > 0) {
        soKetNoi.set(id, con);
        return;
      }
      soKetNoi.delete(id);
      matKetNoiTu.set(id, Date.now());
      phu.phong.datKetNoi(id, false);
    });
  });

  // ——— Nhịp làm mới và Q04 ———
  const nhipLamMoi = setInterval(() => {
    for (const v of phu.van.dangChay()) lamMoi(v.vanId);
  }, phu.chuKyLamMoiMs ?? 1_000);

  const nguong = phu.nguongMatKetNoiMs ?? 120_000;
  const nhipKiemTra = setInterval(() => {
    const bayGio = Date.now();
    for (const v of phu.van.dangChay()) {
      const conSong = v.van.layNguoiConSong();
      const boDi = conSong.filter((n) => {
        const tu = matKetNoiTu.get(n.id);
        return !v.nguoiAo.has(n.id) && tu !== undefined && bayGio - tu > nguong;
      });
      if (boDi.length * 2 > conSong.length) phu.van.huyVan(v.vanId);
    }
  }, phu.chuKyKiemTraMs ?? 5_000);

  return {
    io,
    /** Buộc mọi kết nối của một tài khoản rời đi — tài khoản bị khóa (UC23). */
    ngatTaiKhoan(taiKhoanId: string, lyDo: string) {
      io.to(phongTk(taiKhoanId)).emit('phien:ket-thuc', lyDo);
      io.in(phongTk(taiKhoanId)).disconnectSockets(true);
    },
    async dong() {
      clearInterval(nhipLamMoi);
      clearInterval(nhipKiemTra);
      await io.close();
    },
  };
}
