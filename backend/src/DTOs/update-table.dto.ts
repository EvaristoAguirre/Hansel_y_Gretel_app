import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  // Max,
  // Min,
} from 'class-validator';
import { TableState } from 'src/Enums/states.enum';

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  number?: number;

  @IsOptional()
  @IsString()
  coment?: string;

  @IsOptional()
  @IsEnum(TableState)
  state?: TableState;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsArray()
  ordersIds?: string[];
}
