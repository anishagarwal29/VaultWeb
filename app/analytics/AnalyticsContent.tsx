"use client";
import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import styles from './Analytics.module.css';
import { useVault } from '@/context/VaultContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const AnalyticsContent = () => {
    const { transactions, currency, isLoading } = useVault();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Helper to get currency symbol
    const getSymbol = (code: string) => {
        return code === 'USD' ? '$' : code === 'EUR' ? '€' : code === 'SGD' ? 'S$' : '$';
    };
    const currencySymbol = getSymbol(currency);

    // 1. Spending by Category
    const categoryData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categories: Record<string, number> = {};

        expenses.forEach(t => {
            const amount = Number(t.amount);
            if (isNaN(amount)) return; // Skip invalid amounts

            const cat = t.category || 'Uncategorized';
            categories[cat] = (categories[cat] || 0) + amount;
        });

        return Object.keys(categories).map(cat => ({
            name: cat,
            value: categories[cat]
        }));
    }, [transactions]);

    // 2. Monthly Trends
    const monthlyData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const months: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        expenses.forEach(t => {
            const amount = Number(t.amount);
            if (isNaN(amount)) return;

            const d = new Date(t.date);
            if (isNaN(d.getTime())) return; // Skip invalid dates

            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            months[key] = (months[key] || 0) + amount;
        });

        // Current month and previous 5 months (sort by date order not just by key insertion)
        // Ideally we want to sort them properly. For now keeping original logic but capped at 6.
        // But the previous logic was Object.keys(months).slice(-6) which relies on insertion order?
        // Let's rely on date sorting if needed, but for now just fix the crash.
        // Actually, Object.keys ordering is complex for strings. 
        // Let's better sort these keys if we can, but primarily fixing the crash first.

        return Object.keys(months).slice(-6).map(m => ({
            name: m,
            val: months[m]
        }));
    }, [transactions]);

    if (!isMounted || isLoading) {
        return (
            <div className={styles.grid}>
                <div className={styles.card} style={{ pointerEvents: 'none', minHeight: 400 }}>
                    <div style={{ padding: 20 }}>Loading Analytics...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.grid}>
            {/* Spending Distribution */}
            <div className={styles.card} style={{ gridRow: 'span 2' }}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Spending by Category</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Where your money goes</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 32 }}>
                    {categoryData.length > 0 ? (
                        <>
                            <div style={{ height: 260, position: 'relative' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={105}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ReTooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(20,20,20, 0.9)',
                                                backdropFilter: 'blur(8px)',
                                                borderColor: 'rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                color: '#fff'
                                            }}
                                            itemStyle={{ color: '#fff', fontSize: 13 }}
                                            formatter={(val: number | undefined) => `${currencySymbol}${(val || 0).toFixed(2)}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Center Total */}
                                <div style={{
                                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                    textAlign: 'center', pointerEvents: 'none'
                                }}>
                                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1 }}>Total</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)' }}>
                                        {currencySymbol}{categoryData.reduce((sum, c) => sum + c.value, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.breakdownTable}>
                                {categoryData.sort((a, b) => b.value - a.value).map((cat, index) => {
                                    const total = categoryData.reduce((sum, c) => sum + c.value, 0);
                                    const percent = ((cat.value / total) * 100).toFixed(1);
                                    return (
                                        <div key={index} className={styles.row}>
                                            <div className={styles.catInfo}>
                                                <div className={styles.dot} style={{ background: COLORS[index % COLORS.length], boxShadow: `0 0 10px ${COLORS[index % COLORS.length]}44` }} />
                                                <span className={styles.catName}>{cat.name}</span>
                                            </div>
                                            <div className={styles.catStats}>
                                                <div className={styles.catAmount}>{currencySymbol}{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                <div className={styles.catPercent}>{percent}%</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.6 }}>
                            <div style={{ marginBottom: 16 }}>No spending data found</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Trends */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>Monthly Trends</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Expenses over time</p>
                </div>
                <div className={styles.chartContainer} style={{ minHeight: 300 }}>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <XAxis
                                    dataKey="name"
                                    stroke="var(--text-secondary)"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis hide />
                                <Tooltip
                                    cursor={{ fill: 'var(--primary)', opacity: 0.1, radius: 4 }}
                                    contentStyle={{
                                        backgroundColor: 'rgba(20,20,20, 0.9)',
                                        backdropFilter: 'blur(8px)',
                                        borderColor: 'rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(val: number | undefined) => [`${currencySymbol}${(val || 0).toFixed(2)}`, 'Spent']}
                                />
                                <Bar
                                    dataKey="val"
                                    fill="var(--primary)"
                                    radius={[6, 6, 6, 6]}
                                    barSize={40}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', opacity: 0.6 }}>
                            No trend data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
