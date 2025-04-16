// {
//   "id": "4294b8b3-1a65-4aa6-ac96-7dac7aab3168",
//   "state": "open",
//   "numberCustomers": 11,
//   "comment": "",
//   "table": {
//       "id": "03334cb1-0e5d-402e-a8d8-828560a85873",
//       "name": "M11"
//   },
//   "total": 122,
//   "products": [
//       {
//           "productId": "e716da5d-0830-454f-9a73-8ce29a6a795d",
//           "productName": "Prod 1",
//           "quantity": 1,
//           "unitaryPrice": 122,
//           "subtotal": 122
//       }
//   ]
// }

import { OrderState } from "../Enums/Enums";


export interface IOrderDetails {
  id: string;
  state: OrderState;
  numberCustomers: number;
  comment: string;
  table: {
    id: string;
    name: string;
  };
  total: number;
  products: IConfirmedProducts[];
}

export interface IConfirmedProducts {
  productId: string;
  productName: string;
  unitaryPrice: number;
  subtotal: number;
  quantity: number;
}
