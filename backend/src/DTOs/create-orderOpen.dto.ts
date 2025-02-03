export class OrderOpenDto {
    id: string;
    date: Date;
    total: number;
    numberCustomers: number;
    comment: string;
    tableId: string;
    orderDetails: any[];
    state: string;
    isActive: boolean;
  }