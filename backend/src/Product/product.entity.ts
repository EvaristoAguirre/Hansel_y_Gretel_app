import { IsInt, Max, Min } from 'class-validator';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// Definir el Enum para el estado
export enum State {
  URGENTE = 'urgente',
  NO_URGENTE = 'no urgente',
}

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  @IsInt()
  @Min(0)
  @Max(9999)
  code: number;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'decimal' })
  price: number;

  @Column({ nullable: true, type: 'decimal' })
  cost: number;

  @Column({
    type: 'enum',
    enum: State,
    default: State.NO_URGENTE,
  })
  state: State;
}
