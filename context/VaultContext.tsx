"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Account, Subscription, Budget } from '../types';

interface VaultContextType {
    transactions: Transaction[];
    accounts: Account[];
    subscriptions: Subscription[];
    budgets: Budget[];
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
    editSubscription: (subscription: Subscription) => void;
    transferFunds: (fromAccountId: string, toAccountId: string, amount: number) => void;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);



export function VaultProvider({ children }: { children: React.ReactNode }) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from LocalStorage
    useEffect(() => {
        const loadData = () => {
            if (typeof window === 'undefined') return;

            const storedTransactions = localStorage.getItem('vault_transactions');
            const storedAccounts = localStorage.getItem('vault_accounts');
            const storedSubscriptions = localStorage.getItem('vault_subscriptions');

            if (storedTransactions) {
                setTransactions(JSON.parse(storedTransactions));
            }

            if (storedAccounts) {
                setAccounts(JSON.parse(storedAccounts));
            }

            if (storedSubscriptions) setSubscriptions(JSON.parse(storedSubscriptions));

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
        }
    }, [transactions, accounts, subscriptions, budgets, isLoaded]);

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

    const editSubscription = (updatedSubscription: Subscription) => {
        setSubscriptions(prev => prev.map(s => s.id === updatedSubscription.id ? updatedSubscription : s));
    };

    const addAccount = (account: Account) => {
        setAccounts(prev => [...prev, account]);
    };

    const deleteAccount = (id: string) => {
        setAccounts(prev => prev.filter(a => a.id !== id));
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
            editSubscription,
            transferFunds
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
