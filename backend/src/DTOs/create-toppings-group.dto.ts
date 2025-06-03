import { ArrayMinSize, IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateToppingsGroupDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  toppingsIds: string[];
}
