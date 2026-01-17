export interface BankAccount {
  id: string;
  userId: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditCard {
  id: string;
  userId: string;
  name: string;
  limit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'BANK_ACCOUNT' | 'CREDIT_CARD';
export type TransactionStatus = 'PAID' | 'PENDING';

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  date: Date;
  type: TransactionType;
  category: string;
  subCategory?: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethod;
  bankAccountId?: string;
  creditCardId?: string;
  invoiceId?: string;
  groupId?: string; // ID para agrupar parcelas ou lançamentos fixos
  installments?: {
    current: number;
    total: number;
    groupId: string;
  };
  isRecurring?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  creditCardId: string;
  userId: string;
  month: number; // 1-12
  year: number;
  totalAmount: number;
  status: 'OPEN' | 'CLOSED' | 'PAID';
  dueDate: Date;
  closingDate: Date;
  paidAt?: Date;
  paidFromBankAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
  subCategories?: string[];
}
