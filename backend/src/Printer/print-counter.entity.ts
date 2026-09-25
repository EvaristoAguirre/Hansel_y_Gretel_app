import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'print_counter' })
export class PrintCounter {
  @PrimaryColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', default: 0 })
  counter: number;

  @Column({ type: 'boolean', default: false })
  legacyImported: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
