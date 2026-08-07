import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  cover_url?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];
}
