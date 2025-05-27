import { IsArray, IsString } from 'class-validator';

export class CreateSauceGroupDto {
  @IsString()
  name: string;

  @IsArray()
  sauces: string[];
}
