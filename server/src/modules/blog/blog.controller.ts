import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api')
export class BlogController {
  constructor(private blogService: BlogService) {}

  @Public()
  @Get('blogs')
  getBlogs(@Query('page') page?: string, @Query('limit') limit?: string, @Query('tag') tag?: string) {
    return this.blogService.getPublicBlogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      tag,
    );
  }

  @Public()
  @Get('blogs/:slug')
  getBlog(@Param('slug') slug: string) {
    return this.blogService.getPublicBlog(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/blogs')
  getAllBlogs() {
    return this.blogService.getAllBlogs();
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/blogs')
  createBlog(@Body() dto: CreateBlogDto) {
    return this.blogService.createBlog(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/blogs/:id')
  updateBlog(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto) {
    return this.blogService.updateBlog(id, dto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Delete('admin/blogs/:id')
  deleteBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.deleteBlog(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/blogs/:id/publish')
  publishBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.publishBlog(id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Patch('admin/blogs/:id/unpublish')
  unpublishBlog(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.unpublishBlog(id);
  }
}
