
import React from 'react';
import styles from './BalanceCard.module.css';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useVault } from '@/context/VaultContext';

export function BalanceCard() {
    const { transactions, accounts, currency } = useVault();

    // Calculate Balance from Accounts
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    // Calculate Income/Expense from Transactions (Current Month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = currentMonthTransactions
        .filter(t => t.type === 'income' && !t.linkedId && t.category !== 'Transfer')
        .reduce((sum, t) => sum + t.amount, 0);

    const expense = currentMonthTransactions
        .filter(t => t.type === 'expense' && !t.linkedId && t.category !== 'Transfer')
        .reduce((sum, t) => sum + t.amount, 0);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-SG', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    return (
        <div className={styles.card}>
            <div className={styles.content}>
                <div className={styles.label}>Total Balance</div>
                <div className={styles.balance}>{formatCurrency(totalBalance)}</div>

                <div className={styles.stats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Income</span>
                        <span className={`${styles.statValue} ${styles.income} `}>
                            <ArrowUpRight size={20} />
                            {formatCurrency(income)}
                        </span>
                    </div>

                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Expenses</span>
                        <span className={`${styles.statValue} ${styles.expense} `}>
                            <ArrowDownRight size={20} color="#ef4444" />
                            {formatCurrency(expense)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
