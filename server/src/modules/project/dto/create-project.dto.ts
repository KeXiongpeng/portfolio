import { IsString, IsOptional, IsArray, IsUrl, IsNumber, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsArray()
  @IsOptional()
  tech_stack?: string[];

  @IsString()
  @IsOptional()
  @IsUrl({}, { each: false })
  demo_url?: string;

  @IsString()
  @IsOptional()
  @IsUrl({}, { each: false })
  github_url?: string;

  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_visible?: boolean;
}
