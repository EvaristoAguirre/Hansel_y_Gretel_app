import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'tables' })
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;
}
