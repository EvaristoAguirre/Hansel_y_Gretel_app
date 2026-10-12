import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'afip_tokens' })
@Unique('UQ_afip_tokens_service_env', ['service', 'afipEnv'])
export class AfipToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  service: string;

  @Column({ type: 'varchar' })
  afipEnv: 'homologacion' | 'produccion';

  @Column({ type: 'text' })
  token: string;

  @Column({ type: 'text' })
  sign: string;

  @Column({ type: 'timestamptz' })
  expirationTime: Date;
}
