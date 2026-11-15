-- CreateTable
CREATE TABLE "tai_khoan" (
    "id" BIGSERIAL NOT NULL,
    "ten_dang_nhap" VARCHAR(20) NOT NULL,
    "mat_khau_bam" VARCHAR(100) NOT NULL,
    "la_quan_tri" BOOLEAN NOT NULL DEFAULT false,
    "bi_khoa" BOOLEAN NOT NULL DEFAULT false,
    "la_nguoi_choi_ao" BOOLEAN NOT NULL DEFAULT false,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tai_khoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ho_so_nguoi_choi" (
    "id" BIGSERIAL NOT NULL,
    "tai_khoan_id" BIGINT NOT NULL,
    "biet_danh" VARCHAR(24) NOT NULL,
    "anh_dai_dien" VARCHAR(20) NOT NULL DEFAULT 'DanLang',
    "so_van_da_choi" INTEGER NOT NULL DEFAULT 0,
    "so_van_thang" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ho_so_nguoi_choi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phong_choi" (
    "id" BIGSERIAL NOT NULL,
    "ma_phong" VARCHAR(6) NOT NULL,
    "chu_phong_id" BIGINT NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phong_choi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cau_hinh_vai" (
    "id" BIGSERIAL NOT NULL,
    "phong_id" BIGINT NOT NULL,
    "loai_vai" VARCHAR(20) NOT NULL,
    "so_luong" INTEGER NOT NULL,

    CONSTRAINT "cau_hinh_vai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bo_luat_choi" (
    "id" BIGSERIAL NOT NULL,
    "phong_id" BIGINT,
    "van_id" BIGINT,
    "bat_dem_dau_co_chet" BOOLEAN NOT NULL,
    "cam_phu_thuy_tu_cuu" BOOLEAN NOT NULL,
    "cho_bao_ve_tu_do" BOOLEAN NOT NULL,
    "cam_do_trung_dem" BOOLEAN NOT NULL,
    "tho_san_ban_khi_treo_co" BOOLEAN NOT NULL,
    "hoa_phieu_khong_ai_chet" BOOLEAN NOT NULL,

    CONSTRAINT "bo_luat_choi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "van_dau" (
    "id" BIGSERIAL NOT NULL,
    "phong_id" BIGINT NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL,
    "phe_thang" VARCHAR(10),
    "so_luot" INTEGER NOT NULL DEFAULT 0,
    "bat_dau_luc" TIMESTAMP(3) NOT NULL,
    "ket_thuc_luc" TIMESTAMP(3),

    CONSTRAINT "van_dau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nguoi_choi_trong_van" (
    "id" BIGSERIAL NOT NULL,
    "van_id" BIGINT NOT NULL,
    "tai_khoan_id" BIGINT NOT NULL,
    "loai_vai" VARCHAR(20) NOT NULL,
    "con_song" BOOLEAN NOT NULL DEFAULT true,
    "thu_tu_ghe" INTEGER NOT NULL,
    "trang_thai_ky_nang" JSONB,

    CONSTRAINT "nguoi_choi_trong_van_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "luot_choi" (
    "id" BIGSERIAL NOT NULL,
    "van_id" BIGINT NOT NULL,
    "so_thu_tu" INTEGER NOT NULL,

    CONSTRAINT "luot_choi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hanh_dong_dem" (
    "id" BIGSERIAL NOT NULL,
    "luot_id" BIGINT NOT NULL,
    "nguoi_thuc_hien_id" BIGINT NOT NULL,
    "loai_hanh_dong" VARCHAR(20) NOT NULL,
    "muc_tieu_id" BIGINT,
    "do_uu_tien" INTEGER NOT NULL,
    "thoi_diem" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hanh_dong_dem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ket_qua_dem" (
    "id" BIGSERIAL NOT NULL,
    "luot_id" BIGINT NOT NULL,
    "danh_sach_chet" JSONB NOT NULL,

    CONSTRAINT "ket_qua_dem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phien_bau_cu" (
    "id" BIGSERIAL NOT NULL,
    "luot_id" BIGINT NOT NULL,
    "vong" INTEGER NOT NULL,
    "ket_qua" VARCHAR(20) NOT NULL,
    "nguoi_bi_treo_id" VARCHAR(40),

    CONSTRAINT "phien_bau_cu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phieu_bau" (
    "id" BIGSERIAL NOT NULL,
    "phien_id" BIGINT NOT NULL,
    "nguoi_bau_id" BIGINT NOT NULL,
    "nguoi_bi_bau_id" BIGINT,

    CONSTRAINT "phieu_bau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tin_nhan" (
    "id" BIGSERIAL NOT NULL,
    "van_id" BIGINT NOT NULL,
    "nguoi_gui_id" BIGINT NOT NULL,
    "kenh" VARCHAR(12) NOT NULL,
    "noi_dung" VARCHAR(500) NOT NULL,
    "thoi_diem" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tin_nhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nhat_ky_van" (
    "id" BIGSERIAL NOT NULL,
    "van_id" BIGINT NOT NULL,
    "thu_tu" INTEGER NOT NULL,
    "loai" VARCHAR(30) NOT NULL,
    "du_lieu" JSONB NOT NULL,
    "thoi_diem" BIGINT NOT NULL,

    CONSTRAINT "nhat_ky_van_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bao_cao_vi_pham" (
    "id" BIGSERIAL NOT NULL,
    "van_id" BIGINT NOT NULL,
    "nguoi_bao_cao_id" BIGINT NOT NULL,
    "nguoi_bi_bao_cao_id" BIGINT NOT NULL,
    "ly_do" VARCHAR(500) NOT NULL,
    "trang_thai" VARCHAR(20) NOT NULL DEFAULT 'CHO_XU_LY',
    "ghi_chu_xu_ly" VARCHAR(500),
    "nguoi_xu_ly_id" BIGINT,
    "ngay_tao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ngay_xu_ly" TIMESTAMP(3),

    CONSTRAINT "bao_cao_vi_pham_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mua_giai" (
    "id" BIGSERIAL NOT NULL,
    "ten" VARCHAR(60) NOT NULL,
    "bat_dau" TIMESTAMP(3) NOT NULL,
    "ket_thuc" TIMESTAMP(3),

    CONSTRAINT "mua_giai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ban_ghi_xep_hang" (
    "id" BIGSERIAL NOT NULL,
    "mua_id" BIGINT NOT NULL,
    "tai_khoan_id" BIGINT NOT NULL,
    "diem" INTEGER NOT NULL DEFAULT 0,
    "so_van" INTEGER NOT NULL DEFAULT 0,
    "so_thang" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ban_ghi_xep_hang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tai_khoan_ten_dang_nhap_key" ON "tai_khoan"("ten_dang_nhap");

-- CreateIndex
CREATE UNIQUE INDEX "ho_so_nguoi_choi_tai_khoan_id_key" ON "ho_so_nguoi_choi"("tai_khoan_id");

-- CreateIndex
CREATE UNIQUE INDEX "phong_choi_ma_phong_key" ON "phong_choi"("ma_phong");

-- CreateIndex
CREATE UNIQUE INDEX "cau_hinh_vai_phong_id_loai_vai_key" ON "cau_hinh_vai"("phong_id", "loai_vai");

-- CreateIndex
CREATE UNIQUE INDEX "bo_luat_choi_van_id_key" ON "bo_luat_choi"("van_id");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_choi_trong_van_van_id_tai_khoan_id_key" ON "nguoi_choi_trong_van"("van_id", "tai_khoan_id");

-- CreateIndex
CREATE UNIQUE INDEX "nguoi_choi_trong_van_van_id_thu_tu_ghe_key" ON "nguoi_choi_trong_van"("van_id", "thu_tu_ghe");

-- CreateIndex
CREATE UNIQUE INDEX "luot_choi_van_id_so_thu_tu_key" ON "luot_choi"("van_id", "so_thu_tu");

-- CreateIndex
CREATE UNIQUE INDEX "hanh_dong_dem_luot_id_nguoi_thuc_hien_id_loai_hanh_dong_key" ON "hanh_dong_dem"("luot_id", "nguoi_thuc_hien_id", "loai_hanh_dong");

-- CreateIndex
CREATE UNIQUE INDEX "ket_qua_dem_luot_id_key" ON "ket_qua_dem"("luot_id");

-- CreateIndex
CREATE UNIQUE INDEX "phien_bau_cu_luot_id_vong_key" ON "phien_bau_cu"("luot_id", "vong");

-- CreateIndex
CREATE UNIQUE INDEX "phieu_bau_phien_id_nguoi_bau_id_key" ON "phieu_bau"("phien_id", "nguoi_bau_id");

-- CreateIndex
CREATE UNIQUE INDEX "nhat_ky_van_van_id_thu_tu_key" ON "nhat_ky_van"("van_id", "thu_tu");

-- CreateIndex
CREATE UNIQUE INDEX "ban_ghi_xep_hang_mua_id_tai_khoan_id_key" ON "ban_ghi_xep_hang"("mua_id", "tai_khoan_id");

-- AddForeignKey
ALTER TABLE "ho_so_nguoi_choi" ADD CONSTRAINT "ho_so_nguoi_choi_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phong_choi" ADD CONSTRAINT "phong_choi_chu_phong_id_fkey" FOREIGN KEY ("chu_phong_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cau_hinh_vai" ADD CONSTRAINT "cau_hinh_vai_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong_choi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bo_luat_choi" ADD CONSTRAINT "bo_luat_choi_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong_choi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bo_luat_choi" ADD CONSTRAINT "bo_luat_choi_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "van_dau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "van_dau" ADD CONSTRAINT "van_dau_phong_id_fkey" FOREIGN KEY ("phong_id") REFERENCES "phong_choi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nguoi_choi_trong_van" ADD CONSTRAINT "nguoi_choi_trong_van_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "van_dau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nguoi_choi_trong_van" ADD CONSTRAINT "nguoi_choi_trong_van_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "luot_choi" ADD CONSTRAINT "luot_choi_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "van_dau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hanh_dong_dem" ADD CONSTRAINT "hanh_dong_dem_luot_id_fkey" FOREIGN KEY ("luot_id") REFERENCES "luot_choi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hanh_dong_dem" ADD CONSTRAINT "hanh_dong_dem_nguoi_thuc_hien_id_fkey" FOREIGN KEY ("nguoi_thuc_hien_id") REFERENCES "nguoi_choi_trong_van"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hanh_dong_dem" ADD CONSTRAINT "hanh_dong_dem_muc_tieu_id_fkey" FOREIGN KEY ("muc_tieu_id") REFERENCES "nguoi_choi_trong_van"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ket_qua_dem" ADD CONSTRAINT "ket_qua_dem_luot_id_fkey" FOREIGN KEY ("luot_id") REFERENCES "luot_choi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phien_bau_cu" ADD CONSTRAINT "phien_bau_cu_luot_id_fkey" FOREIGN KEY ("luot_id") REFERENCES "luot_choi"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_bau" ADD CONSTRAINT "phieu_bau_phien_id_fkey" FOREIGN KEY ("phien_id") REFERENCES "phien_bau_cu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_bau" ADD CONSTRAINT "phieu_bau_nguoi_bau_id_fkey" FOREIGN KEY ("nguoi_bau_id") REFERENCES "nguoi_choi_trong_van"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phieu_bau" ADD CONSTRAINT "phieu_bau_nguoi_bi_bau_id_fkey" FOREIGN KEY ("nguoi_bi_bau_id") REFERENCES "nguoi_choi_trong_van"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tin_nhan" ADD CONSTRAINT "tin_nhan_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "van_dau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tin_nhan" ADD CONSTRAINT "tin_nhan_nguoi_gui_id_fkey" FOREIGN KEY ("nguoi_gui_id") REFERENCES "nguoi_choi_trong_van"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nhat_ky_van" ADD CONSTRAINT "nhat_ky_van_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "van_dau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_vi_pham" ADD CONSTRAINT "bao_cao_vi_pham_van_id_fkey" FOREIGN KEY ("van_id") REFERENCES "van_dau"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_vi_pham" ADD CONSTRAINT "bao_cao_vi_pham_nguoi_bao_cao_id_fkey" FOREIGN KEY ("nguoi_bao_cao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_vi_pham" ADD CONSTRAINT "bao_cao_vi_pham_nguoi_bi_bao_cao_id_fkey" FOREIGN KEY ("nguoi_bi_bao_cao_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bao_cao_vi_pham" ADD CONSTRAINT "bao_cao_vi_pham_nguoi_xu_ly_id_fkey" FOREIGN KEY ("nguoi_xu_ly_id") REFERENCES "tai_khoan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_ghi_xep_hang" ADD CONSTRAINT "ban_ghi_xep_hang_mua_id_fkey" FOREIGN KEY ("mua_id") REFERENCES "mua_giai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ban_ghi_xep_hang" ADD CONSTRAINT "ban_ghi_xep_hang_tai_khoan_id_fkey" FOREIGN KEY ("tai_khoan_id") REFERENCES "tai_khoan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
