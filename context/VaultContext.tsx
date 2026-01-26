"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Transaction, Account, Subscription, Budget, Currency, DEFAULT_CURRENCIES, Category, DEFAULT_CATEGORIES } from '../types';
import { auth, db, googleProvider } from '@/config/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
    editSubscription: (subscription: Subscription) => void;
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
    user: any;
    login: () => void;
    logout: () => void;
    syncStatus: 'idle' | 'saving' | 'success' | 'error';
    isLoading: boolean;
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

    // --- FIREBASE INTEGRATION ---
    const [user, setUser] = useState<any>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    // 1. Listen for Auth Changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
            if (currentUser) {
                // User logged in -> Load from Firestore
                loadFromFirestore(currentUser.uid);
            } else {
                // User logged out -> Clear data or Load local (optional)
                setTransactions([]);
                setAccounts([]);
                setSubscriptions([]);
                setBudgets([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // 2. Load Data from Cloud
    const loadFromFirestore = async (userId: string) => {
        setIsLoaded(false);
        try {
            const docRef = doc(db, 'users', userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setTransactions(data.transactions || []);
                setAccounts(data.accounts || []);
                setSubscriptions(data.subscriptions || []);
                setBudgets(data.budgets || []);
                setCurrency(data.currency || 'SGD');
                setTheme(data.theme || 'dark');
                // ... load other settings
            } else {
                // 3. First Time Login Migration?
                // If cloud is empty but we have local data, upload it!
                if (localStorage.getItem('vault_transactions') || localStorage.getItem('vault_accounts')) {
                    migrateLocalToCloud(userId);
                }
            }
        } catch (error) {
            console.error("Error loading vault:", error);
        } finally {
            setIsLoaded(true);
        }
    };

    // Helper to remove undefined values (Firestore rejects them)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deepSanitize = (obj: any): any => {
        if (obj === undefined) return null;
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(deepSanitize);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newObj: any = {};
        for (const key in obj) {
            const val = deepSanitize(obj[key]);
            if (val !== undefined) newObj[key] = val;
        }
        return newObj;
    };

    // 4. Sync Data to Cloud (Debounced or on Change)
    useEffect(() => {
        if (user && isLoaded) {
            const saveData = async () => {
                try {
                    setSyncStatus('saving');
                    console.log("Saving data to Firestore...");
                    const docRef = doc(db, 'users', user.uid);
                    await setDoc(docRef, {
                        transactions: deepSanitize(transactions),
                        accounts: deepSanitize(accounts),
                        subscriptions: deepSanitize(subscriptions),
                        budgets: deepSanitize(budgets),
                        currency,
                        theme,
                        lastUpdated: new Date().toISOString()
                    }, { merge: true });
                    console.log("Data saved successfully!");
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 2000);
                } catch (error) {
                    console.error("Error saving data to Firestore:", error);
                    setSyncStatus('error');
                    alert("Sync Error: Check your internet or Firestore Rules.");
                }
            };
            // Save after 1s delay to avoid spamming
            const timeout = setTimeout(saveData, 1000);
            return () => clearTimeout(timeout);
        }
    }, [user, transactions, accounts, subscriptions, budgets, currency, theme, isLoaded]);


    const migrateLocalToCloud = async (userId: string) => {
        // (Simplified logic: taking current state since we hydrated from local initially)
        // In a real app, you might want to read localStorage directly here.
        // For now, let's assume the state has the local data.

        // Actually, cleaner approach:
        // By default, the app loaded LocalStorage on mount (see below). 
        // So `transactions`, `accounts` etc are ALREADY populated with local data.
        // We just need to trigger a save.

        // This is handled automatically by the "Sync Data to Cloud" effect 
        // because `user` becomes true and `isLoaded` becomes true.
    };

    // 5. Auth Actions
    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };


    // Load from LocalStorage (Only if NOT logged in)
    useEffect(() => {
        if (!authLoading && !user) {
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
        }
    }, [user, authLoading]);

    // Save to LocalStorage (Only if NOT logged in) -> Optional: keep local backup?
    // Let's keep it simple: LocalStorage for guest, Firestore for user.
    // Apply theme whenever it changes
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme]);

    // Save to LocalStorage (Only if NOT logged in) -> Optional: keep local backup?
    // Let's keep it simple: LocalStorage for guest, Firestore for user.
    useEffect(() => {
        if (!user && isLoaded) {
            localStorage.setItem('vault_transactions', JSON.stringify(transactions));
            localStorage.setItem('vault_accounts', JSON.stringify(accounts));
            localStorage.setItem('vault_subscriptions', JSON.stringify(subscriptions));
            localStorage.setItem('vault_budgets', JSON.stringify(budgets));
            localStorage.setItem('vault_currency', currency);
            localStorage.setItem('vault_theme', theme);

            const custom = availableCurrencies.filter(c => !DEFAULT_CURRENCIES.find(d => d.code === c.code));
            localStorage.setItem('vault_custom_currencies', JSON.stringify(custom));
        }
    }, [user, transactions, accounts, subscriptions, budgets, currency, theme, availableCurrencies, isLoaded]);

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
        const primaryTx = transactions.find(t => t.id === id);
        if (!primaryTx) return;

        const transactionsToDelete = primaryTx.linkedId
            ? transactions.filter(t => t.linkedId === primaryTx.linkedId)
            : [primaryTx];

        // 1. Remove from state
        setTransactions(prev => prev.filter(t =>
            !transactionsToDelete.some(toDelete => toDelete.id === t.id)
        ));

        // 2. Revert balances for ALL involved transactions (handles BOTH sides of a transfer)
        setAccounts(prev => prev.map(acc => {
            let updatedBalance = acc.balance;
            transactionsToDelete.forEach(tx => {
                if (tx.accountId === acc.id) {
                    // Reversing: if it was income, subtract it; if expense, add it back.
                    updatedBalance = tx.type === 'income'
                        ? updatedBalance - tx.amount
                        : updatedBalance + tx.amount;
                }
            });
            return { ...acc, balance: updatedBalance };
        }));
    };

    const editTransaction = (updatedTransaction: Transaction) => {
        const oldTransaction = transactions.find(t => t.id === updatedTransaction.id);
        if (!oldTransaction) return;

        setTransactions(prev => {
            return prev.map(t => {
                // Primary update
                if (t.id === updatedTransaction.id) return updatedTransaction;

                // Sync linked transaction if it exists
                if (updatedTransaction.linkedId && t.linkedId === updatedTransaction.linkedId) {
                    return {
                        ...t,
                        amount: updatedTransaction.amount,
                        date: updatedTransaction.date,
                        note: updatedTransaction.note,
                    };
                }
                return t;
            });
        });

        // Handle balance adjustments
        const amountDiff = updatedTransaction.amount - oldTransaction.amount;
        if (amountDiff === 0) return;

        setAccounts(prev => prev.map(acc => {
            let updatedBalance = acc.balance;

            // Update primary account
            if (acc.id === updatedTransaction.accountId) {
                updatedBalance = updatedTransaction.type === 'income'
                    ? updatedBalance + amountDiff
                    : updatedBalance - amountDiff;
            }

            // If it's a transfer, update the OTHER side account too
            if (updatedTransaction.linkedId) {
                const otherTx = transactions.find(t =>
                    t.linkedId === updatedTransaction.linkedId && t.id !== updatedTransaction.id
                );
                if (otherTx && acc.id === otherTx.accountId) {
                    // Update binary opposite: if primary was expense, other is income
                    updatedBalance = otherTx.type === 'income'
                        ? updatedBalance + amountDiff
                        : updatedBalance - amountDiff;
                }
            }

            return { ...acc, balance: updatedBalance };
        }));
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

        const date = new Date().toISOString();
        const linkedId = `tr_${Date.now()}`;

        const outgoing: Transaction = {
            id: `${linkedId}_out`,
            merchant: `Transfer to ${toAccount.name}`,
            amount: amount,
            date: date,
            type: 'expense',
            category: 'Transfer',
            accountId: fromAccountId,
            currency: fromAccount.currency,
            linkedId: linkedId,
            transferAccountName: toAccount.name
        };

        const incoming: Transaction = {
            id: `${linkedId}_in`,
            merchant: `Transfer from ${fromAccount.name}`,
            amount: amount,
            date: date,
            type: 'income',
            category: 'Transfer',
            accountId: toAccountId,
            currency: toAccount.currency,
            linkedId: linkedId,
            transferAccountName: fromAccount.name
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
            editSubscription,
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
            deleteCategory,
            user,
            login,
            logout,
            syncStatus,
            isLoading: authLoading || !isLoaded
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
