export interface Payment {
  clientSecret: string;
}

export interface CreatePaymentParams {
  orderId: string;
}
