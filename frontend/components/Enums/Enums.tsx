export enum TableState {
  AVAILABLE = "available",
  OPEN = "open",
  PENDING_PAYMENT = "pending_payment",
  CLOSED = "closed",
}


export enum OrderState {
  PENDING = 'pending',
  CLOSED = 'closed',
}

export enum Stages {
  INITIAL_ORDER = 'initial_order',
  EXTRA_ORDER = 'extra_order'
}