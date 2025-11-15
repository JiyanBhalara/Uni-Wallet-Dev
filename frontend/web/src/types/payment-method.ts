// src/types/payment-method.ts
export enum PaymentMethodType {
  DebitCard = 0,
  CreditCard = 1,
  BankAccount = 2
}

export interface PaymentMethod {
  id: number;
  userId: number;
  type: PaymentMethodType;
  label: string;
  maskedNumber: string;
  last4: string;
  brand?: string | null;
  isDefault: boolean;
  createdAt: string;
}
