import { Entity, Column } from 'typeorm';

@Entity()
export class UpdateCategory {
  @Column({ nullable: false })
  name?: string;
}
