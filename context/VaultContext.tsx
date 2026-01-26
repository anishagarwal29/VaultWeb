"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Account, Subscription, Budget, Currency, DEFAULT_CURRENCIES, Category, DEFAULT_CATEGORIES } from '../types';

interface VaultContextType {
    transactions: Transaction[];
    accounts: Account[];
    subscriptions: Subscription[];
    budgets: Budget[];
    currency: string;
    theme: 'dark' | 'light';
    availableCurrencies: Currency[];
    addTransaction: (transaction: Transaction) => void;
    deleteTransaction: (id: string) => void;
    addSubscription: (subscription: Subscription) => void;
    deleteSubscription: (id: string) => void;
    addAccount: (account: Account) => void;
    deleteAccount: (id: string) => void;
    editAccount: (account: Account) => void;
    editTransaction: (transaction: Transaction) => void;
    addBudget: (budget: Budget) => void;
    deleteBudget: (id: string) => void;
    editBudget: (budget: Budget) => void;
    calculateMonthlyBurnRate: () => number;
    getUpcomingSubscriptions: () => Subscription[];
    getExpiringTrials: () => Subscription[];
    transferFunds: (fromAccountId: string, toAccountId: string, amount: number) => void;
    setCurrency: (currency: string) => void;
    setTheme: (theme: 'dark' | 'light') => void;
    addCurrency: (currency: Currency) => void;
    categories: Category[];
    addCategory: (category: Category) => void;
    deleteCategory: (id: string) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [currency, setCurrency] = useState<string>('SGD');
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(DEFAULT_CURRENCIES);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const loadData = () => {
            if (typeof window === 'undefined') return;

            const storedTransactions = localStorage.getItem('vault_transactions');
            const storedAccounts = localStorage.getItem('vault_accounts');
            const storedSubscriptions = localStorage.getItem('vault_subscriptions');
            const storedBudgets = localStorage.getItem('vault_budgets');
            const storedCurrency = localStorage.getItem('vault_currency');
            const storedTheme = localStorage.getItem('vault_theme');
            const storedCustomCurrencies = localStorage.getItem('vault_custom_currencies');

            const currentGlobalCurrency = storedCurrency || 'SGD';

            if (storedTransactions) {
                const parsed = JSON.parse(storedTransactions);
                setTransactions(parsed.map((t: any) => ({ ...t, currency: t.currency || currentGlobalCurrency })));
            }
            if (storedAccounts) {
                const parsed = JSON.parse(storedAccounts);
                setAccounts(parsed.map((a: any) => ({ ...a, currency: a.currency || currentGlobalCurrency })));
            }
            if (storedSubscriptions) {
                const parsed = JSON.parse(storedSubscriptions);
                setSubscriptions(parsed.map((s: any) => ({
                    ...s,
                    cost: s.cost ?? s.amount ?? 0,
                    frequency: s.frequency ?? s.billingCycle ?? 'monthly',
                    nextBillingDate: s.nextBillingDate ?? s.startDate ?? new Date().toISOString().split('T')[0],
                    isTrial: s.isTrial ?? false,
                    trialEndDate: s.trialEndDate || undefined
                })));
            }
            if (storedBudgets) setBudgets(JSON.parse(storedBudgets));
            if (storedCurrency) setCurrency(storedCurrency);
            if (storedTheme) setTheme(storedTheme as 'dark' | 'light');
            if (storedCustomCurrencies) {
                setAvailableCurrencies([...DEFAULT_CURRENCIES, ...JSON.parse(storedCustomCurrencies)]);
            }

            setIsLoaded(true);
        };

        loadData();
    }, []);

    // Save to LocalStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('vault_transactions', JSON.stringify(transactions));
            localStorage.setItem('vault_accounts', JSON.stringify(accounts));
            localStorage.setItem('vault_subscriptions', JSON.stringify(subscriptions));
            localStorage.setItem('vault_budgets', JSON.stringify(budgets));
            localStorage.setItem('vault_currency', currency);
            localStorage.setItem('vault_theme', theme);

            const custom = availableCurrencies.filter(c => !DEFAULT_CURRENCIES.find(d => d.code === c.code));
            localStorage.setItem('vault_custom_currencies', JSON.stringify(custom));

            // Apply theme
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [transactions, accounts, subscriptions, budgets, currency, theme, availableCurrencies, isLoaded]);

    const addTransaction = (transaction: Transaction) => {
        setTransactions(prev => [transaction, ...prev]);

        if (transaction.accountId) {
            setAccounts(prev => prev.map(acc => {
                if (acc.id === transaction.accountId) {
                    const change = transaction.type === 'income' ? transaction.amount : -transaction.amount;
                    return { ...acc, balance: acc.balance + change };
                }
                return acc;
            }));
        }
    };

    const deleteTransaction = (id: string) => {
        const transaction = transactions.find(t => t.id === id);
        if (transaction && transaction.accountId) {
            setAccounts(prev => prev.map(acc => {
                if (acc.id === transaction.accountId) {
                    const change = transaction.type === 'income' ? -transaction.amount : transaction.amount;
                    return { ...acc, balance: acc.balance + change };
                }
                return acc;
            }));
        }
        setTransactions(prev => prev.filter(t => t.id !== id));
    };

    const editTransaction = (updatedTransaction: Transaction) => {
        setTransactions(prev => {
            const oldTransaction = prev.find(t => t.id === updatedTransaction.id);
            if (!oldTransaction) return prev;

            // 1. Revert old transaction effect
            if (oldTransaction.accountId) {
                setAccounts(accs => accs.map(acc => {
                    if (acc.id === oldTransaction.accountId) {
                        const revert = oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount;
                        return { ...acc, balance: acc.balance + revert };
                    }
                    return acc;
                }));
            }

            // 2. Apply new transaction effect
            if (updatedTransaction.accountId) {
                setAccounts(accs => accs.map(acc => {
                    if (acc.id === updatedTransaction.accountId) {
                        const apply = updatedTransaction.type === 'income' ? updatedTransaction.amount : -updatedTransaction.amount;
                        return { ...acc, balance: acc.balance + apply };
                    }
                    return acc;
                }));
            }

            return prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
        });
    };

    const addSubscription = (subscription: Subscription) => {
        setSubscriptions(prev => [...prev, subscription]);
    };

    const deleteSubscription = (id: string) => {
        setSubscriptions(prev => prev.filter(s => s.id !== id));
    };

    const calculateMonthlyBurnRate = () => {
        return subscriptions.reduce((total, sub) => {
            if (sub.isTrial) return total; // Trials are free
            const cost = sub.cost || 0;
            if (sub.frequency === 'monthly') {
                return total + cost;
            } else {
                return total + (cost / 12);
            }
        }, 0);
    };

    const getUpcomingSubscriptions = () => {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        return subscriptions.filter(sub => {
            const billingDate = new Date(sub.nextBillingDate);
            return billingDate >= today && billingDate <= nextWeek;
        });
    };

    const getExpiringTrials = () => {
        const today = new Date();
        const fortyEightHours = new Date();
        fortyEightHours.setHours(today.getHours() + 48);

        return subscriptions.filter(sub => {
            if (!sub.isTrial || !sub.trialEndDate) return false;
            const trialEnd = new Date(sub.trialEndDate);
            return trialEnd >= today && trialEnd <= fortyEightHours;
        });
    };

    // Date Bumper & Trial Converter Functionality
    useEffect(() => {
        if (isLoaded && subscriptions.length > 0) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let hasChanges = false;
            const updatedSubs = subscriptions.map(sub => {
                let currentSub = { ...sub };

                // 1. Handle Trial Conversion
                if (currentSub.isTrial && currentSub.trialEndDate) {
                    const trialEnd = new Date(currentSub.trialEndDate);
                    trialEnd.setHours(0, 0, 0, 0);

                    if (trialEnd < today) {
                        hasChanges = true;
                        currentSub.isTrial = false;
                        // Set next billing to today (or trial end date + conversion offset)
                        currentSub.nextBillingDate = today.toISOString().split('T')[0];
                    }
                }

                // 2. Handle Billing Date Bumper
                let billingDate = new Date(currentSub.nextBillingDate);
                billingDate.setHours(0, 0, 0, 0);

                if (billingDate < today && !currentSub.isTrial) {
                    hasChanges = true;
                    // Bump date
                    const nextDate = new Date(billingDate);
                    if (currentSub.frequency === 'monthly') {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    } else {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    }
                    currentSub.nextBillingDate = nextDate.toISOString().split('T')[0];
                }
                return currentSub;
            });

            if (hasChanges) {
                setSubscriptions(updatedSubs);
            }
        }
    }, [isLoaded, subscriptions.length]); // Use length to avoid loops if dates are updated

    const addAccount = (account: Account) => {
        setAccounts(prev => [...prev, account]);
    };

    const deleteAccount = (id: string) => {
        setAccounts(prev => prev.filter(a => a.id !== id));
        // Also delete associated transactions
        setTransactions(prev => prev.filter(t => t.accountId !== id));
    };

    const editAccount = (updatedAccount: Account) => {
        setAccounts(prev => prev.map(acc => acc.id === updatedAccount.id ? updatedAccount : acc));
    };

    const addBudget = (budget: Budget) => {
        setBudgets(prev => [...prev, budget]);
    };

    const deleteBudget = (id: string) => {
        setBudgets(prev => prev.filter(b => b.id !== id));
    };

    const editBudget = (updatedBudget: Budget) => {
        setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
    };

    const transferFunds = (fromAccountId: string, toAccountId: string, amount: number) => {
        const fromAccount = accounts.find(a => a.id === fromAccountId);
        const toAccount = accounts.find(a => a.id === toAccountId);

        if (!fromAccount || !toAccount) return;

        // Create Transactions
        const date = new Date().toISOString();
        const outgoing: Transaction = {
            id: Date.now().toString(),
            merchant: `Transfer to ${toAccount.name}`,
            amount: amount,
            date: date,
            type: 'expense',
            category: 'Transfer',
            accountId: fromAccountId,
            currency: fromAccount.currency
        };

        const incoming: Transaction = {
            id: (Date.now() + 1).toString(),
            merchant: `Transfer from ${fromAccount.name}`,
            amount: amount, // Note: Ideally should handle currency conversion here
            date: date,
            type: 'income',
            category: 'Transfer',
            accountId: toAccountId,
            currency: toAccount.currency // Assuming 1:1 for now as per previous logic
        };

        setTransactions(prev => [outgoing, incoming, ...prev]);

        setAccounts(prev => prev.map(acc => {
            if (acc.id === fromAccountId) {
                return { ...acc, balance: acc.balance - amount };
            }
            if (acc.id === toAccountId) {
                return { ...acc, balance: acc.balance + amount };
            }
            return acc;
        }));
    };

    const addCurrency = (currency: Currency) => {
        setAvailableCurrencies(prev => [...prev, currency]);
    };

    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

    const addCategory = (category: Category) => {
        setCategories(prev => [...prev, category]);
    };

    const deleteCategory = (id: string) => {
        setCategories(prev => prev.filter(c => c.id !== id));
    };

    // Load/Save Categories
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('vault_categories');
            if (stored) {
                setCategories(JSON.parse(stored));
            }
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('vault_categories', JSON.stringify(categories));
        }
    }, [categories, isLoaded]);

    return (
        <VaultContext.Provider value={{
            transactions,
            accounts,
            subscriptions,
            budgets,
            addTransaction,
            deleteTransaction,
            addSubscription,
            deleteSubscription,
            addAccount,
            deleteAccount,
            editAccount,
            editTransaction,
            addBudget,
            deleteBudget,
            editBudget,
            calculateMonthlyBurnRate,
            getUpcomingSubscriptions,
            getExpiringTrials,
            transferFunds,
            currency,
            setCurrency,
            theme,
            setTheme,
            availableCurrencies,
            addCurrency,
            categories,
            addCategory,
            deleteCategory
        }}>
            {children}
        </VaultContext.Provider>
    );
}

export function useVault() {
    const context = useContext(VaultContext);
    if (context === undefined) {
        throw new Error('useVault must be used within a VaultProvider');
    }
    return context;
}
