import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  lastname: string;

  @IsNotEmpty()
  @IsEmail()
  @Length(1, 100)
  email: string;

  @IsOptional()
  @Matches(/^[+]?[\d-]{7,15}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  birthdate?: Date;
}
