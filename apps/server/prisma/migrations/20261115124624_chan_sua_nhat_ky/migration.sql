-- Ràng buộc toàn vẹn 12.3: nhat_ky_van không được sửa hay xóa vật lý — đây là bằng chứng phục vụ
-- xử lý báo cáo vi phạm. Chặn ở tầng cơ sở dữ liệu, không chỉ ở mã (ARCHITECTURE mục 12).
CREATE OR REPLACE FUNCTION chan_sua_nhat_ky_van() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'nhat_ky_van chỉ được ghi thêm, không được % (ràng buộc 12.3)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nhat_ky_van_chi_ghi_them
  BEFORE UPDATE OR DELETE ON "nhat_ky_van"
  FOR EACH ROW EXECUTE FUNCTION chan_sua_nhat_ky_van();
