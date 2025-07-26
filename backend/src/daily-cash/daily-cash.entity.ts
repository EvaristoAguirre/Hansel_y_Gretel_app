import { DailyCashState } from 'src/Enums/states.enum';
import { Order } from 'src/Order/order.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CashMovement } from './cash-movement.entity';

@Entity({ name: 'daily_cash' })
export class DailyCash {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column({ type: 'enum', enum: DailyCashState, default: DailyCashState.OPEN })
  state: DailyCashState;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSales: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPayments: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  initialCash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  finalCash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCash: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTips: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cashDifference: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCreditCard: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDebitCard: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalTransfer: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalMercadoPago: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalIncomes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalExpenses: number;

  // --------- Relaciones ---------

  @OneToMany(() => Order, (order) => order.dailyCash)
  orders: Order[];

  @OneToMany(() => CashMovement, (movement) => movement.dailyCash, {
    cascade: true,
  })
  movements: CashMovement[];
}
