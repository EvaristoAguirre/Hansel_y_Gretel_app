import { IsString } from 'class-validator';

export class PrinterOrderDto {
  @IsString()
  tableId: string;
}

// {
//   "table": "5",
//   "items": [
//     { "name": "Café Americano", "quantity": 2 },
//     { "name": "Croissant", "quantity": 1 }
//   ]
// }
