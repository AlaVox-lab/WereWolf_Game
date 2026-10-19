import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Đối chiếu Class Diagram (`docs/diagrams/03-class-loi.puml`) với mã nguồn theo hai chiều — đồ án
 * được chấm trên sự nhất quán giữa sơ đồ và mã (CLAUDE.md mục 1).
 *
 * 1. Mỗi thành viên ghi trên sơ đồ của một lớp đã cài phải xuất hiện trong tệp định nghĩa lớp đó.
 * 2. Mỗi lớp xuất ra từ `domain/` và `application/` phải có mặt trên sơ đồ (kể cả trong ghi chú).
 *
 * Hỏng bài này nghĩa là vừa đổi mã mà quên sơ đồ, hoặc ngược lại.
 */

const GOC = fileURLToPath(new URL('../../../../', import.meta.url));
const SO_DO = readFileSync(join(GOC, 'docs/diagrams/03-class-loi.puml'), 'utf-8');
const THU_MUC_MA = ['domain', 'application'].map((t) => join(GOC, 'apps/server/src', t));

/** Lớp trên sơ đồ chưa có trong mã — phải khớp đúng danh sách này, cài xong thì gỡ khỏi đây. */
const CHUA_CAI = ['BoDieuPhoiVan', 'PhongChoi', 'TaiKhoan'];

/** Lớp kỹ thuật không vẽ trên sơ đồ lõi. */
const KHONG_VE = ['LoiNghiepVu', 'DongHoGia', 'NgauNhienCoHat'];

function docTatCaTep(thuMuc: string): string[] {
  return readdirSync(thuMuc).flatMap((ten) => {
    const duongDan = join(thuMuc, ten);
    if (statSync(duongDan).isDirectory()) return docTatCaTep(duongDan);
    return ten.endsWith('.ts') ? [duongDan] : [];
  });
}

const TEP_MA = THU_MUC_MA.flatMap(docTatCaTep).map((duongDan) => ({
  duongDan,
  noiDung: readFileSync(duongDan, 'utf-8'),
}));

/** Tệp định nghĩa lớp hoặc giao diện `ten` — kể cả giao diện nội bộ không xuất ra, nếu có. */
function timTep(ten: string): string | undefined {
  const mau = new RegExp(`^(export )?(abstract )?(class|interface) ${ten}\\b`, 'm');
  return TEP_MA.find((t) => mau.test(t.noiDung))?.noiDung;
}

/** Các khối `class X { ... }` / `interface X { ... }` trên sơ đồ, kèm tên thành viên. */
function docCacLop(): { ten: string; thanhVien: string[] }[] {
  const ketQua: { ten: string; thanhVien: string[] }[] = [];
  const mau = /^(?:abstract class|class|interface) (\w+)(?: \{\n([\s\S]*?)\n\})?/gm;
  for (const khop of SO_DO.matchAll(mau)) {
    const thanhVien = (khop[2] ?? '')
      .split('\n')
      .map((dong) => /^\s*[+\-#]\s*(?:\{\w+\}\s*)?(\w+)/.exec(dong)?.[1])
      .filter((t): t is string => Boolean(t));
    ketQua.push({ ten: khop[1]!, thanhVien });
  }
  return ketQua;
}

describe('Class Diagram ↔ mã nguồn', () => {
  const cacLop = docCacLop();

  it('đọc được các lớp trên sơ đồ', () => {
    expect(cacLop.length).toBeGreaterThan(25);
  });

  it('lớp chưa cài khớp đúng danh sách CHUA_CAI', () => {
    const khongTimThay = cacLop.filter((l) => !timTep(l.ten)).map((l) => l.ten);
    expect(khongTimThay.sort()).toEqual([...CHUA_CAI].sort());
  });

  it('mọi thành viên ghi trên sơ đồ đều có trong tệp của lớp đó', () => {
    const thieu: string[] = [];
    for (const lop of cacLop) {
      const noiDung = timTep(lop.ten);
      if (!noiDung) continue;
      for (const tv of lop.thanhVien) {
        if (!new RegExp(`\\b${tv}\\b`).test(noiDung)) thieu.push(`${lop.ten}.${tv}`);
      }
    }
    expect(thieu).toEqual([]);
  });

  it('mọi lớp xuất ra từ domain/ và application/ đều có mặt trên sơ đồ', () => {
    const tenLop = TEP_MA.flatMap((t) =>
      [...t.noiDung.matchAll(/export (?:abstract )?class (\w+)/g)].map((k) => k[1]!),
    );
    const vangMat = tenLop.filter(
      (ten) => !KHONG_VE.includes(ten) && !new RegExp(`\\b${ten}\\b`).test(SO_DO),
    );
    expect(vangMat).toEqual([]);
  });
});
