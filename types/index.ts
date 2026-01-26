export type TransactionType = 'income' | 'expense';

export interface Transaction {
    id: string;
    amount: number;
    date: string; // ISO String
    merchant: string;
    category: string;
    type: TransactionType;
    accountId: string;
    currency: string;
    originalAmount?: number;
    note?: string;
    linkedId?: string;
    transferAccountName?: string;
}

export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense' | 'any';
}

export const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Food', type: 'expense' },
    { id: '2', name: 'Transport', type: 'expense' },
    { id: '3', name: 'Shopping', type: 'expense' },
    { id: '4', name: 'Bills', type: 'expense' },
    { id: '5', name: 'Entertainment', type: 'expense' },
    { id: '6', name: 'Health', type: 'expense' },
    { id: '7', name: 'Salary', type: 'income' },
    { id: '8', name: 'Investment', type: 'income' },
    { id: '9', name: 'Transfer', type: 'any' },
];

export interface Account {
    id: string;
    name: string;
    type: 'checking' | 'debit' | 'credit' | 'investment' | 'cash';
    balance: number;
    color: string;
    icon?: string;
    currency: string;
}

export type Frequency = 'monthly' | 'yearly';

export interface Subscription {
    id: string;
    name: string;
    cost: number;
    frequency: Frequency;
    nextBillingDate: string; // YYYY-MM-DD
    category: string;
    isTrial: boolean;
    trialEndDate?: string; // YYYY-MM-DD
    color: string;
    description?: string;
}

export interface Budget {
    id: string;
    category: string;
    limit: number;
    spent: number;
    period: 'monthly';
    color: string;
    accountId?: string;
}

export interface Currency {
    code: string;
    symbol: string;
    name: string;
}

export const DEFAULT_CURRENCIES: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

export const getCurrencySymbol = (code: string, currencies: Currency[] = DEFAULT_CURRENCIES) => {
    return currencies.find(c => c.code === code)?.symbol || '$';
};

export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};
