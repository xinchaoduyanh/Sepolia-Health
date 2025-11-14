-- Insert các tags phổ biến cho Q&A
-- Tags sẽ tự động tạo slug từ name

INSERT INTO "Tag" (name, slug, description, "usageCount", "createdAt", "updatedAt")
VALUES
  -- Chuyên khoa
  ('Tim mạch', 'tim-mach', 'Các câu hỏi về bệnh tim mạch, huyết áp, nhịp tim', 0, NOW(), NOW()),
  ('Nhi khoa', 'nhi-khoa', 'Các câu hỏi về sức khỏe trẻ em', 0, NOW(), NOW()),
  ('Sản phụ khoa', 'san-phu-khoa', 'Các câu hỏi về sức khỏe phụ nữ, thai sản', 0, NOW(), NOW()),
  ('Da liễu', 'da-lieu', 'Các câu hỏi về bệnh ngoài da', 0, NOW(), NOW()),
  ('Tiêu hóa', 'tieu-hoa', 'Các câu hỏi về hệ tiêu hóa, dạ dày, ruột', 0, NOW(), NOW()),
  ('Hô hấp', 'ho-hap', 'Các câu hỏi về phổi, đường hô hấp', 0, NOW(), NOW()),
  ('Thần kinh', 'than-kinh', 'Các câu hỏi về hệ thần kinh, não bộ', 0, NOW(), NOW()),
  ('Xương khớp', 'xuong-khop', 'Các câu hỏi về xương, khớp, cột sống', 0, NOW(), NOW()),
  ('Mắt', 'mat', 'Các câu hỏi về mắt, thị lực', 0, NOW(), NOW()),
  ('Tai mũi họng', 'tai-mui-hong', 'Các câu hỏi về tai, mũi, họng', 0, NOW(), NOW()),

  -- Chủ đề sức khỏe
  ('Dinh dưỡng', 'dinh-duong', 'Các câu hỏi về dinh dưỡng, ăn uống lành mạnh', 0, NOW(), NOW()),
  ('Tập luyện', 'tap-luyen', 'Các câu hỏi về thể dục, thể thao, vận động', 0, NOW(), NOW()),
  ('Giảm cân', 'giam-can', 'Các câu hỏi về giảm cân, kiểm soát cân nặng', 0, NOW(), NOW()),
  ('Tăng cân', 'tang-can', 'Các câu hỏi về tăng cân lành mạnh', 0, NOW(), NOW()),
  ('Giấc ngủ', 'giac-ngu', 'Các câu hỏi về giấc ngủ, mất ngủ', 0, NOW(), NOW()),
  ('Tâm lý', 'tam-ly', 'Các câu hỏi về sức khỏe tâm thần, tâm lý', 0, NOW(), NOW()),
  ('Sức khỏe nam giới', 'suc-khoe-nam-gioi', 'Các câu hỏi về sức khỏe nam giới', 0, NOW(), NOW()),
  ('Sức khỏe phụ nữ', 'suc-khoe-phu-nu', 'Các câu hỏi về sức khỏe phụ nữ', 0, NOW(), NOW()),
  ('Người cao tuổi', 'nguoi-cao-tuoi', 'Các câu hỏi về sức khỏe người cao tuổi', 0, NOW(), NOW()),
  ('Thai kỳ', 'thai-ky', 'Các câu hỏi về mang thai, thai kỳ', 0, NOW(), NOW()),

  -- Bệnh thường gặp
  ('Cảm cúm', 'cam-cum', 'Các câu hỏi về cảm cúm, cảm lạnh', 0, NOW(), NOW()),
  ('Sốt', 'sot', 'Các câu hỏi về sốt, hạ sốt', 0, NOW(), NOW()),
  ('Đau đầu', 'dau-dau', 'Các câu hỏi về đau đầu, migraine', 0, NOW(), NOW()),
  ('Đau bụng', 'dau-bung', 'Các câu hỏi về đau bụng, đau dạ dày', 0, NOW(), NOW()),
  ('Dị ứng', 'di-ung', 'Các câu hỏi về dị ứng, mẩn ngứa', 0, NOW(), NOW()),
  ('Viêm họng', 'viem-hong', 'Các câu hỏi về viêm họng, đau họng', 0, NOW(), NOW()),
  ('Ho', 'ho', 'Các câu hỏi về ho, ho khan, ho có đờm', 0, NOW(), NOW()),
  ('Tiêu chảy', 'tieu-chay', 'Các câu hỏi về tiêu chảy, rối loạn tiêu hóa', 0, NOW(), NOW()),
  ('Táo bón', 'tao-bon', 'Các câu hỏi về táo bón', 0, NOW(), NOW()),
  ('Mất ngủ', 'mat-ngu', 'Các câu hỏi về mất ngủ, khó ngủ', 0, NOW(), NOW()),

  -- Thuốc và điều trị
  ('Thuốc', 'thuoc', 'Các câu hỏi về thuốc, cách sử dụng thuốc', 0, NOW(), NOW()),
  ('Vitamin', 'vitamin', 'Các câu hỏi về vitamin, bổ sung vitamin', 0, NOW(), NOW()),
  ('Kháng sinh', 'khang-sinh', 'Các câu hỏi về kháng sinh', 0, NOW(), NOW()),
  ('Vaccine', 'vaccine', 'Các câu hỏi về vaccine, tiêm chủng', 0, NOW(), NOW()),
  ('Xét nghiệm', 'xet-nghiem', 'Các câu hỏi về xét nghiệm, kết quả xét nghiệm', 0, NOW(), NOW()),
  ('Chẩn đoán', 'chan-doan', 'Các câu hỏi về chẩn đoán bệnh', 0, NOW(), NOW()),

  -- Phòng bệnh
  ('Phòng bệnh', 'phong-benh', 'Các câu hỏi về phòng ngừa bệnh tật', 0, NOW(), NOW()),
  ('Sức đề kháng', 'suc-de-khang', 'Các câu hỏi về tăng cường sức đề kháng', 0, NOW(), NOW()),
  ('Vệ sinh', 've-sinh', 'Các câu hỏi về vệ sinh cá nhân, vệ sinh môi trường', 0, NOW(), NOW()),

  -- Khác
  ('Tư vấn', 'tu-van', 'Cần tư vấn về sức khỏe', 0, NOW(), NOW()),
  ('Khẩn cấp', 'khan-cap', 'Các câu hỏi khẩn cấp về sức khỏe', 0, NOW(), NOW()),
  ('Chăm sóc tại nhà', 'cham-soc-tai-nha', 'Các câu hỏi về chăm sóc sức khỏe tại nhà', 0, NOW(), NOW()),
  ('Sơ cứu', 'so-cuu', 'Các câu hỏi về sơ cứu, cấp cứu', 0, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

