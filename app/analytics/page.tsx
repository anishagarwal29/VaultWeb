"use client";
import React, { useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Analytics.module.css';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { getCurrencySymbol } from '@/types';
import { useExchangeRates } from '@/hooks/useExchangeRates';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
    const { transactions, accounts, currency } = useVault();
    const currencySymbol = getCurrencySymbol(currency);

    // Exchange Rates for Normalization
    const { rates, isLoading: ratesLoading } = useExchangeRates(currency);

    const getNormalizedAmount = (amount: number, accountId?: string) => {
        if (!accountId) return amount; // Fallback for orphans
        const account = accounts.find(a => a.id === accountId);
        if (!account) return amount;

        if (account.currency === currency) return amount;

        const rate = rates[account.currency];
        if (!rate) return amount; // Fallback if no rate found

        return amount / rate;
    };

    // 1. Spending by Category (Pie Chart)
    const categoryData = useMemo(() => {
        if (ratesLoading && Object.keys(rates).length === 0) return [];

        const expenses = transactions.filter(t => t.type === 'expense');
        const categories: Record<string, number> = {};

        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            const normalized = getNormalizedAmount(t.amount, t.accountId);
            categories[cat] = (categories[cat] || 0) + normalized;
        });

        return Object.keys(categories).map(cat => ({
            name: cat,
            value: categories[cat]
        }));
    }, [transactions, rates, currency, accounts]);

    // 2. Monthly Trends (Bar Chart)
    const monthlyData = useMemo(() => {
        if (ratesLoading && Object.keys(rates).length === 0) return [];

        const expenses = transactions.filter(t => t.type === 'expense');
        const months: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        expenses.forEach(t => {
            const d = new Date(t.date);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            const normalized = getNormalizedAmount(t.amount, t.accountId);
            months[key] = (months[key] || 0) + normalized;
        });

        return Object.keys(months).slice(-6).map(m => ({
            name: m,
            val: months[m]
        }));
    }, [transactions, rates, currency, accounts]);

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Analytics</h1>
                </div>

                <div className={styles.grid}>
                    {/* Spending Distribution */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Spending by Category</h2>
                        </div>
                        <div className={styles.chartContainer}>
                            {categoryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                                            ))}
                                        </Pie>
                                        <ReTooltip
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                            formatter={(val: number | undefined) => `${currencySymbol}${(val || 0).toFixed(2)}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                    No spending data available
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Monthly Trends</h2>
                        </div>
                        <div className={styles.chartContainer}>
                            {monthlyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyData}>
                                        <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                            formatter={(val: number | undefined) => [`${currencySymbol}${(val || 0).toFixed(2)}`, 'Amount']}
                                        />
                                        <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                                    No trend data yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
