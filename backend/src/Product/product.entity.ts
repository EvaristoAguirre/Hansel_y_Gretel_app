import { IsInt, Max, Min } from 'class-validator';
import { Category } from 'src/Category/category.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';

// Definir el Enum para el estado
export enum State {
  URGENTE = 'urgente',
  NO_URGENTE = 'no urgente',
}

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  @IsInt()
  @Min(0)
  @Max(9999)
  code: number;

  @Column({ nullable: false, unique: true })
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

  // ---------       Relaciones   -----------

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable() // Este decorador se coloca en un solo lado de la relación, generalmente en el lado "propietario"
  categories: Category[];
}
