import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'room' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;
}
