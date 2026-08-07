import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 200, unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 500, nullable: true })
  summary: string;

  @Column({ length: 500, nullable: true })
  cover_url: string;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({ length: 20, default: 'draft' })
  status: 'draft' | 'published';

  @Column({ default: 0 })
  view_count: number;

  @Column({ type: 'timestamp', nullable: true })
  published_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
