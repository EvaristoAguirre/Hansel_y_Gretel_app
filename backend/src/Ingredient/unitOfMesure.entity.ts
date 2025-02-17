import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity({ name: 'units_of_measure' })
export class UnitOfMeasure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string; // Nombre de la unidad (ej: "Litro", "Mililitro", "Gramo")

  @Column({ nullable: true, unique: true })
  abbreviation: string; // Abreviatura (ej: "L", "mL", "g")

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.unitOfMeasure)
  ingredients: Ingredient[];
}
