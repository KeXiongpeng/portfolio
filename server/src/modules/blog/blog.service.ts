import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from '../../entities';
import { RedisService } from '../../redis';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepo: Repository<Blog>,
    private redisService: RedisService,
  ) {}

  private async clearListCache() {
    await this.redisService.delPattern('cache:blog:list:*');
  }

  async getPublicBlogs(page = 1, limit = 10, tag?: string) {
    const cacheKey = `cache:blog:list:page=${page}&limit=${limit}&tag=${tag || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const query = this.blogRepo.createQueryBuilder('blog')
      .where({ status: 'published' })
      .orderBy('published_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (tag) {
      query.andWhere(':tag = ANY(blog.tags)', { tag });
    }

    const [items, total] = await query.getManyAndCount();
    const result = { items, total, page, totalPages: Math.ceil(total / limit) };
    await this.redisService.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  async getPublicBlog(slug: string) {
    const blog = await this.blogRepo.findOne({ where: { slug, status: 'published' } });
    if (!blog) throw new NotFoundException('Blog not found');
    blog.view_count += 1;
    await this.blogRepo.save(blog);
    return blog;
  }

  async getAllBlogs() {
    return this.blogRepo.find({ order: { created_at: 'DESC' } });
  }

  async createBlog(dto: CreateBlogDto) {
    const blog = this.blogRepo.create(dto);
    return this.blogRepo.save(blog);
  }

  async updateBlog(id: number, dto: UpdateBlogDto) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    Object.assign(blog, dto);
    return this.blogRepo.save(blog);
  }

  async deleteBlog(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    await this.blogRepo.remove(blog);
    await this.clearListCache();
  }

  async publishBlog(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    blog.status = 'published';
    blog.published_at = new Date();
    const saved = await this.blogRepo.save(blog);
    await this.clearListCache();
    return saved;
  }

  async unpublishBlog(id: number) {
    const blog = await this.blogRepo.findOne({ where: { id } });
    if (!blog) throw new NotFoundException('Blog not found');
    blog.status = 'draft';
    const saved = await this.blogRepo.save(blog);
    await this.clearListCache();
    return saved;
  }
}
