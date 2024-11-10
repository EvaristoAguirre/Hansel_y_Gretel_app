import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// Definir el Enum para el estado
export enum Estado {
  URGENTE = 'urgente',
  NO_URGENTE = 'no urgente',
}

@Entity()
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  descripcion: string;

  @Column('decimal')
  precio: number;

  @Column('decimal')
  costo: number;

  @Column()
  cantidadIngrediente: number;

  @Column({
    type: 'enum',
    enum: Estado,
    default: Estado.NO_URGENTE,
  })
  estado: Estado;
}
