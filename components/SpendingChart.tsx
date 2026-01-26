"use client";
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './SpendingChart.module.css';
import { useVault } from '@/context/VaultContext';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { getCurrencySymbol } from '@/types';

export function SpendingChart() {
    const { transactions, currency, accounts } = useVault();
    const currencySymbol = getCurrencySymbol(currency);
    const { rates } = useExchangeRates(currency);

    const getNormalizedAmount = (amount: number, accountId?: string) => {
        if (!accountId) return amount;
        const account = accounts.find(a => a.id === accountId);
        if (!account) return amount;

        if (account.currency === currency) return amount;
        const rate = rates[account.currency];
        return rate ? amount / rate : amount;
    };

    const data = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() - (6 - i));
            return d;
        });

        return last7Days.map(date => {
            const dayName = days[date.getDay()];
            const dayStr = date.toISOString().split('T')[0];

            const daySpend = transactions
                .filter(t => t.type === 'expense' && t.date.startsWith(dayStr))
                .reduce((sum, t) => sum + getNormalizedAmount(t.amount, t.accountId), 0);

            return { name: dayName, uv: daySpend };
        });
    }, [transactions, rates, currency, accounts]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Spending Activity</h3>
                <select className={styles.filter}>
                    <option>Last 7 Days</option>
                    <option>This Month</option>
                </select>
            </div>
            <div className={styles.chartArea}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                            tickFormatter={(value) => `${currencySymbol}${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1a1a1a',
                                borderColor: '#333',
                                borderRadius: '8px',
                                color: '#fff',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ color: '#aaa' }}
                            formatter={(value: number | undefined) => [value ? `${currencySymbol}${value.toFixed(2)}` : `${currencySymbol}0.00`, 'Spent']}
                        />
                        <Area
                            type="monotone"
                            dataKey="uv"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorUv)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
