import { Controller, Post, UseInterceptors, UseGuards, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Roles } from '../../common/decorators/roles.decorator';

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

// 通过 VERCEL 环境变量判断部署模式（不能用 BLOB_READ_WRITE_TOKEN，
// 因为 Vercel 启用 OIDC 后该值为空字符串，!!"" = false）
const isProd = !!process.env.VERCEL;

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
      destination: join(process.cwd(), 'uploads'),
      filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
        cb(null, unique);
      },
    });

@Roles('admin')
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
    if (!file) {
      throw new BadRequestException('No file received by server (multer may have failed to parse multipart)');
    }

    if (isProd) {
      try {
        const { put } = await import('@vercel/blob');
        const blob = await put(
          `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`,
          file.buffer!,
          { access: 'public', contentType: file.mimetype },
        );
        return { url: blob.url };
      } catch (err: any) {
        console.error('[Upload] Blob upload failed:', err);
        throw new BadRequestException(`Blob upload failed: ${err?.message || String(err)}`);
      }
    }
    // 本地开发：文件已存到磁盘，返回相对路径（保持原有行为）
    return { url: `/uploads/${file.filename}` };
  }
}
