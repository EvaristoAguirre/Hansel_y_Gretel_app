import { IsNotEmpty, IsUUID } from 'class-validator';

export class transferOrderData {
  @IsUUID()
  @IsNotEmpty()
  fromTableId: string;

  @IsUUID()
  @IsNotEmpty()
  toTableId: string;
}
