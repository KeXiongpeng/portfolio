import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 500, nullable: true })
  bio: string;

  @Column({ type: 'text', nullable: true })
  about: string;

  @Column({ length: 500, nullable: true })
  avatar_url: string;

  @Column({ type: 'jsonb', default: '{}' })
  social_links: {
    github?: string;
    linkedin?: string;
    email?: string;
    twitter?: string;
  };

  @Column({ type: 'jsonb', default: '[]' })
  skills: { name: string; category: string }[];

  @Column({ type: 'jsonb', default: '[]' })
  experience: { company: string; role: string; period: string; description: string }[];

  @Column({ type: 'jsonb', default: '[]' })
  education: { school: string; degree: string; period: string; description: string }[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
