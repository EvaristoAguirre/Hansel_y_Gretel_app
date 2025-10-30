import { OrderState } from 'src/Enums/states.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ArchivedOrderDetails } from './archived_order_details.entity';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';
import { ArchivedOrderPayment } from './archived_order_payments.entity';

@Entity({ name: 'archived_orders' })
export class ArchivedOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column({ type: 'enum', enum: OrderState })
  state: OrderState;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  numberCustomers: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  commandNumber: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  methodOfPayment: PaymentMethod;

  @Column()
  tableId: string;

  @Column()
  dailyCashId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  closedAt: Date;

  @OneToMany(
    () => ArchivedOrderDetails,
    (archivedOrderDetails) => archivedOrderDetails.order,
    {
      cascade: true,
    },
  )
  orderDetails: ArchivedOrderDetails[];

  @OneToMany(() => ArchivedOrderPayment, (payment) => payment.order, {
    cascade: true,
  })
  payments: ArchivedOrderPayment[];
}
