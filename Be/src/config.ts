import z from 'zod';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

config({
  path: '.env',
});
// Kiểm tra coi thử có file .env hay chưa
if (!fs.existsSync(path.resolve('.env'))) {
  console.log('Không tìm thấy file .env');
  process.exit(1);
}

const configSchema = z.object({
  DATABASE_URL: z.string(),
});

const configServer = configSchema.safeParse(process.env);

if (!configServer.success) {
  console.log('Các giá trị khai báo trong file .env không hợp lệ');
  console.error(configServer.error);
  process.exit(1);
}

const envConfig = configServer.data;

export default envConfig;
