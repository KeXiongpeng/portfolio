import { Controller, Post, UseInterceptors, UseGuards, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

// 通过环境变量判断部署模式：
// - 生产环境（Vercel）会注入 BLOB_READ_WRITE_TOKEN → 用内存存储 + Vercel Blob
// - 本地开发没有此 token → 用磁盘存储（保持原有行为，本地测试不受影响）
const isProd = !!process.env.BLOB_READ_WRITE_TOKEN;

// 按需懒加载 @vercel/blob，避免本地开发引入多余依赖
async function uploadToBlob(file: Express.Multer.File): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blob = await put(
    `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
    file.buffer!,
    { access: 'public', contentType: file.mimetype },
  );
  return blob.url;
}

// 存储策略：生产用内存，本地用磁盘
const storage = isProd
  ? memoryStorage()
  : diskStorage({
      destination: join(__dirname, '..', '..', '..', 'uploads'),
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, unique);
      },
    });

@UseGuards(JwtAuthGuard)
@Controller('api/admin/upload')
@UseInterceptors(FileInterceptor('file', {
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) {
      return cb(new BadRequestException('Only image files are allowed'), false);
    }
    cb(null, true);
  },
}))
export class UploadController {
  @Post()
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (isProd) {
      // 生产环境：上传到 Vercel Blob，返回完整 CDN URL
      const url = await uploadToBlob(file);
      return { url };
    }
    // 本地开发：文件已存到磁盘，返回相对路径（保持原有行为）
    return { url: `/uploads/${file.filename}` };
  }
}
