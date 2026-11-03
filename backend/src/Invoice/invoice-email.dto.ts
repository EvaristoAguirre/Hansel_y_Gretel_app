import { IsEmail } from 'class-validator';

export class UpdateInvoiceEmailDto {
  @IsEmail()
  customerEmail: string;
}
