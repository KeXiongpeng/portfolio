import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('visit_stats')
export class VisitStat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', unique: true })
  date: string;

  @Column({ default: 0 })
  pv: number;

  @Column({ default: 0 })
  uv: number;

  @CreateDateColumn()
  created_at: Date;
}
