import { DailyCashState } from 'src/Enums/states.enum';
import { Column, PrimaryGeneratedColumn } from 'typeorm';

export class DailyCash {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  date: Date;
  @Column({ type: 'enum', enum: DailyCashState, default: DailyCashState.OPEN })
  state: DailyCashState;
  // --------- Relaciones ---------
}
