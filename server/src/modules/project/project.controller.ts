import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ReorderProjectsDto } from './dto/reorder-projects.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('api')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Public()
  @Get('projects')
  getProjects(@Query('tag') tag?: string) {
    return this.projectService.getPublicProjects(tag);
  }

  @Public()
  @Get('projects/:slug')
  getProject(@Param('slug') slug: string) {
    return this.projectService.getPublicProject(slug);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Get('admin/projects')
  getAllProjects() {
    return this.projectService.getAllProjects();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Post('admin/projects')
  createProject(@Body() dto: CreateProjectDto) {
    return this.projectService.createProject(dto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Put('admin/projects/:id')
  updateProject(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectService.updateProject(id, dto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Delete('admin/projects/:id')
  deleteProject(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.deleteProject(id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard)
  @Put('admin/projects/reorder')
  reorderProjects(@Body() dto: ReorderProjectsDto) {
    return this.projectService.reorderProjects(dto);
  }
}
