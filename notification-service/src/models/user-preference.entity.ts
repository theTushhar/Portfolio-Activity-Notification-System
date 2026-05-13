import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_preferences')
export class UserPreference {
  @PrimaryColumn()
  userId: string;

  @Column({ default: true })
  emailEnabled: boolean;

  @Column({ default: true })
  pushEnabled: boolean;

  @Column({ nullable: true })
  email?: string;

  @Column('decimal', { precision: 18, scale: 2, nullable: true })
  notificationThreshold?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
