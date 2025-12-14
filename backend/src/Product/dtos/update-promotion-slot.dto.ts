import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePromotionSlotDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
