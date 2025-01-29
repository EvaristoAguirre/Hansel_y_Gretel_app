import { IsArray, IsUUID } from 'class-validator';

export class GetProductsByCategoriesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  categories: string[];
}
