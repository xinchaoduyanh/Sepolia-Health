import { StringUtil } from './string.util';

describe('StringUtil', () => {
  describe('random', () => {
    it("random(6, '0123456789') trả đúng 6 chữ số", () => {
      const result = StringUtil.random(6, '0123456789');

      expect(result).toHaveLength(6);
      expect(/^\d{6}$/.test(result)).toBe(true);
    });

    it('sinh chuỗi ngẫu nhiên với độ dài mặc định', () => {
      const result = StringUtil.random();
      expect(result).toHaveLength(10);
    });
  });

  describe('uuid', () => {
    it('trả về chuỗi UUID v4 hợp lệ', () => {
      const uuid = StringUtil.uuid();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(uuid)).toBe(true);
    });
  });

  describe('generatePassword', () => {
    it('sinh mật khẩu đúng độ dài và gồm đủ các loại ký tự', () => {
      const password = StringUtil.generatePassword(12);
      expect(password).toHaveLength(12);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[0-9]/.test(password)).toBe(true);
      expect(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password)).toBe(true);
    });
  });
});
