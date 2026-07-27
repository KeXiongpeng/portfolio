import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../entities';
import { RedisService } from '../../redis';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private redisService: RedisService,
  ) {}

  private async clearCache() {
    await this.redisService.delPattern('cache:project:*');
  }

  async getPublicProjects(tag?: string) {
    const cacheKey = `cache:project:list:${tag || 'all'}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const query = this.projectRepo.createQueryBuilder('project')
      .where({ is_visible: true })
      .orderBy('sort_order', 'ASC');

    if (tag) {
      query.andWhere(':tag = ANY(project.tech_stack)', { tag });
    }

    const projects = await query.getMany();
    await this.redisService.set(cacheKey, JSON.stringify(projects), 600);
    return projects;
  }

  async getPublicProject(slug: string) {
    return this.projectRepo.findOne({ where: { slug, is_visible: true } });
  }

  async getAllProjects() {
    return this.projectRepo.find({ order: { sort_order: 'ASC' } });
  }

  async createProject(dto: CreateProjectDto) {
    const project = this.projectRepo.create(dto);
    const saved = await this.projectRepo.save(project);
    await this.clearCache();
    return saved;
  }

  async updateProject(id: number, dto: UpdateProjectDto) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    Object.assign(project, dto);
    const saved = await this.projectRepo.save(project);
    await this.clearCache();
    return saved;
  }

  async deleteProject(id: number) {
    const project = await this.projectRepo.findOne({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.projectRepo.remove(project);
    await this.clearCache();
  }

  async reorderProjects(dto: ReorderProjectsDto) {
    for (const item of dto.items) {
      await this.projectRepo.update(item.id, { sort_order: item.sort_order });
    }
    await this.clearCache();
    return { success: true };
  }
}
