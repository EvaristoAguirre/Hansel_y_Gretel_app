import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type InvoiceOrigin = 'order' | 'manual';
export type InvoiceAfipEnv = 'simulado' | 'homologacion' | 'produccion';
export type InvoiceStatus = 'pending' | 'authorized' | 'rejected';

export interface InvoiceIvaItem {
  id: number;
  quota: number;
  baseImp: number;
  importe: number;
}

@Entity({ name: 'invoices' })
@Index('IDX_invoices_cbteFch', ['cbteFch'])
@Index('UQ_invoices_orderId', ['orderId'], {
  unique: true,
  where: '"orderId" IS NOT NULL',
})
@Index('UQ_invoices_number', ['afipEnv', 'ptoVta', 'cbteTipo', 'cbteNro'], {
  unique: true,
  where: '"cbteNro" IS NOT NULL',
})
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['order', 'manual'] })
  origin: InvoiceOrigin;

  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'enum', enum: ['simulado', 'homologacion', 'produccion'] })
  afipEnv: InvoiceAfipEnv;

  @Column({ type: 'enum', enum: ['pending', 'authorized', 'rejected'] })
  status: InvoiceStatus;

  @Column({ type: 'int' })
  ptoVta: number;

  @Column({ type: 'int' })
  cbteTipo: number;

  @Column({ type: 'int', nullable: true })
  cbteNro: number | null;

  @Column({ type: 'date' })
  cbteFch: string;

  @Column({ type: 'int' })
  concepto: number;

  @Column({ type: 'int' })
  docTipo: number;

  @Column({ type: 'int' })
  docNro: number;

  @Column({ type: 'int' })
  condicionIvaReceptorId: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  impTotal: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  impNeto: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  impIva: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  impTotConc: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  impOpEx: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  impTrib: string;

  @Column({ type: 'jsonb' })
  iva: InvoiceIvaItem[];

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tipExcluded: string;

  @Column({ type: 'varchar', nullable: true })
  cae: string | null;

  @Column({ type: 'date', nullable: true })
  caeFchVto: string | null;

  @Column({ type: 'char', length: 1, nullable: true })
  resultado: string | null;

  @Column({ type: 'jsonb', nullable: true })
  arcaErrors: unknown | null;

  @Column({ type: 'varchar', nullable: true })
  customerEmail: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailSentAt: Date | null;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, unknown>;

  @Column({ type: 'int', default: 0 })
  attemptCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastAttemptAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  authorizedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
