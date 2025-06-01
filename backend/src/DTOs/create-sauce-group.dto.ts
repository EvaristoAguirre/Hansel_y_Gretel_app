import { IsArray, IsString } from 'class-validator';

export class CreateToppingsGroupDto {
  @IsString()
  name: string;

  @IsArray()
  toppingsIds: string[];
}
