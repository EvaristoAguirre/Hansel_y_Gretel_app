import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastname?: string;

  @IsOptional()
  @IsEmail()
  @Length(1, 100)
  email?: string;

  @IsOptional()
  @Matches(/^[+]?[\d-]{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  birthdate?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
