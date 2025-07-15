export class DailyCashDetailDto {
  orders: {
    id: string;
    date: Date;
    table: string;
    room: string;
    numberCustomers: number;
    total: string;
    paymentMethods: {
      methodOfPayment: string;
      amount: string;
    }[];
    products: {
      name: string;
      quantity: number;
      commandNumber: string;
    }[];
  }[];
  movements: {
    type: 'ingreso' | 'egreso';
    amount: string;
    createdAt: Date;
    payments: {
      paymentMethod: string;
      amount: string;
    }[];
  }[];
}
