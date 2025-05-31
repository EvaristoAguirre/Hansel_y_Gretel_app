import { IsArray, IsString } from 'class-validator';

export class CreateToppingsGroupDto {
  @IsString()
  name: string;

  @IsArray()
  toppings: string[];
}
