import { IsString, IsOptional, IsObject, IsArray } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  about?: string;

  @IsString()
  @IsOptional()
  avatar_url?: string;

  @IsObject()
  @IsOptional()
  social_links?: { github?: string; linkedin?: string; email?: string; twitter?: string };

  @IsArray()
  @IsOptional()
  skills?: { name: string; category: string }[];

  @IsArray()
  @IsOptional()
  experience?: { company: string; role: string; period: string; description: string }[];

  @IsArray()
  @IsOptional()
  education?: { school: string; degree: string; period: string; description: string }[];
}
