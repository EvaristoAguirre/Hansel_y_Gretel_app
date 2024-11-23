import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProviderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  phone?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
