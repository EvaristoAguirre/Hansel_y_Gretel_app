import { IsBoolean, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateSlotOptionDto {
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  extraCost: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;
}
