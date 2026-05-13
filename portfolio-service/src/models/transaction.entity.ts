import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL'
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  assetSymbol: string;

  @Column({
    type: 'enum',
    enum: TransactionType
  })
  type: TransactionType;

  @Column('decimal', { precision: 18, scale: 8 })
  quantity: number;

  @Column('decimal', { precision: 18, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ unique: true, nullable: true })
  idempotencyKey?: string;
}
