import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('accounts')
@Unique(['provider', 'provider_user_id'])
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ length: 20 })
  provider: string;

  @Column({ length: 100 })
  provider_user_id: string;

  @Column({ length: 200, nullable: true })
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
