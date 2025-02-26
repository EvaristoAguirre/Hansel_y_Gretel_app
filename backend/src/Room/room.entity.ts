import { Table } from 'src/Table/table.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'room' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Table, (table) => table.room, { onDelete: 'SET NULL' })
  tables: Table[];
}
