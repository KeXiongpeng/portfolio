import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  github_id: number;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 500, nullable: true })
  avatar_url: string;

  @Column({ length: 20, default: 'admin' })
  role: string;

  @CreateDateColumn()
  created_at: Date;
}
