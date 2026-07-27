import { Controller, Post, UseInterceptors, UseGuards, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880', 10);

@UseGuards(JwtAuthGuard)
@Controller('api/admin/upload')
@UseInterceptors(FileInterceptor('file', {
  storage: diskStorage({
    destination: join(__dirname, '..', '..', '..', 'uploads'),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
}))
export class UploadController {
  @Post()
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}
