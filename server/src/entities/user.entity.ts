import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  username: string;

  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ length: 500, nullable: true })
  avatar_url: string;

  @Column({ name: 'role_id', nullable: true })
  role_id: number;

  @CreateDateColumn()
  created_at: Date;
}
