import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UnitOfMeasure } from './unitOfMesure.entity';

@Entity({ name: 'unit_conversions' })
export class UnitConversion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  conversionFactor: number;

  //---------------- Relaciones
  @ManyToOne(() => UnitOfMeasure, (unit) => unit.fromConversions)
  @JoinColumn({ name: 'fromUnitId' })
  fromUnit: UnitOfMeasure;

  @ManyToOne(() => UnitOfMeasure, (unit) => unit.toConversions)
  @JoinColumn({ name: 'toUnitId' })
  toUnit: UnitOfMeasure;
}
