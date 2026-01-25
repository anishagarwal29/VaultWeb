export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    amount: number;
    date: string; // ISO String
    merchant: string;
    category: string;
    type: TransactionType;
    accountId: string;
}

export interface Account {
    id: string;
    name: string;
    type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
    balance: number;
    color: string;
    icon?: string;
}

export type BillingCycle = 'monthly' | 'yearly' | 'weekly';

export interface Subscription {
    id: string;
    name: string;
    amount: number;
    billingCycle: BillingCycle;
    startDate: string; // ISO String
    nextBillingDate: string; // ISO String
    isTrial: boolean;
    trialEndDate?: string;
    category: string;
    icon?: string;
    color: string;
}

export interface Budget {
    id: string;
    category: string;
    limit: number;
    spent: number;
    period: 'monthly';
    color: string;
}
