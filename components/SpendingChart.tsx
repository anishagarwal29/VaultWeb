"use client";
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from './SpendingChart.module.css';
import { useVault } from '@/context/VaultContext';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { getCurrencySymbol } from '@/types';

export function SpendingChart() {
    const { transactions, currency, accounts } = useVault();
    const [timeRange, setTimeRange] = React.useState('7days');
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
        let dateRange: Date[] = [];

        if (timeRange === '7days') {
            dateRange = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(today);
                d.setDate(today.getDate() - (6 - i));
                return d;
            });
        } else {
            // This Month
            const year = today.getFullYear();
            const month = today.getMonth();
            const numDays = new Date(year, month + 1, 0).getDate(); // last day of month

            // Generate all days up to today (or end of month? Let's show up to today + rest as 0 or empty? 
            // Standard generic chart is usually all days in month or just up to today. 
            // Let's do all days in month to show progress, but future dates will be 0.

            dateRange = Array.from({ length: numDays }, (_, i) => {
                return new Date(year, month, i + 1);
            });
        }

        return dateRange.map(date => {
            const dayName = days[date.getDay()]; // Or maybe date number for month view?
            // For month view, just showing 'Sun', 'Mon' etc is repetitive. 
            // Maybe show DD (e.g. 01, 02) for month view?
            // Let's stick to simple "Date" or "Day" label.

            // Actually, for XAxis tick, if it's month view, we want '1', '2', ... '31'.
            const name = timeRange === '7days' ? dayName : String(date.getDate());

            const dayStr = date.toISOString().split('T')[0];

            // Exclude transfers (linkedId or Transfer category)
            const daySpend = transactions
                .filter(t => t.type === 'expense' && !t.linkedId && t.category !== 'Transfer' && t.date.startsWith(dayStr))
                .reduce((sum, t) => sum + getNormalizedAmount(t.amount, t.accountId), 0);

            return { name, uv: daySpend, fullDate: dayStr };
        });
    }, [transactions, rates, currency, accounts, timeRange]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Spending Activity</h3>
                <select
                    className={styles.filter}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                >
                    <option value="7days">Last 7 Days</option>
                    <option value="month">This Month</option>
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
