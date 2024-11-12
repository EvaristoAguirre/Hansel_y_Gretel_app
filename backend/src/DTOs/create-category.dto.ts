import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CreateCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ nullable: false })
  name: string;
}
