"use client";
import React, { useMemo, useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import styles from './Analytics.module.css';
import { useVault } from '@/context/VaultContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { getCurrencySymbol, formatDate } from '@/types';
import { ShoppingBag, X } from 'lucide-react';
import { QuickAddFAB } from '@/components/QuickAddFAB';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export const AnalyticsContent = () => {
    const { transactions = [], currency = 'SGD', availableCurrencies = [], isLoading } = useVault();
    const [isMounted, setIsMounted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const currencySymbol = getCurrencySymbol(currency || 'SGD', availableCurrencies);

    // 1. Spending by Category
    const categoryData = useMemo(() => {
        try {
            if (!Array.isArray(transactions)) return [];
            const expenses = transactions.filter(t => t && t.type === 'expense');
            const categories: Record<string, number> = {};

            expenses.forEach(t => {
                const amount = Number(t.amount);
                if (isNaN(amount) || amount <= 0) return;

                const cat = t.category || 'Uncategorized';
                categories[cat] = (categories[cat] || 0) + amount;
            });

            return Object.keys(categories).map(cat => ({
                name: cat,
                value: categories[cat]
            })).filter(c => c.value > 0);
        } catch (err) {
            console.error("Error computing categoryData:", err);
            return [];
        }
    }, [transactions]);

    // 2. Monthly Trends
    const monthlyData = useMemo(() => {
        try {
            if (!Array.isArray(transactions)) return [];
            const expenses = transactions.filter(t => t && t.type === 'expense');
            const monthsMap: Map<string, { total: number, timestamp: number }> = new Map();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            expenses.forEach(t => {
                const amount = Number(t.amount);
                if (isNaN(amount)) return;

                const d = new Date(t.date);
                if (isNaN(d.getTime())) return;

                const monthIdx = d.getMonth();
                const year = d.getFullYear();
                const key = `${monthNames[monthIdx]} ${year}`;
                const timestamp = new Date(year, monthIdx, 1).getTime();

                const existing = monthsMap.get(key) || { total: 0, timestamp };
                monthsMap.set(key, { total: existing.total + amount, timestamp });
            });

            // Sort by timestamp and take last 6
            return Array.from(monthsMap.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .slice(-6)
                .map(([name, data]) => ({
                    name,
                    val: data.total
                }));
        } catch (err) {
            console.error("Error computing monthlyData:", err);
            return [];
        }
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

    const totalSpending = categoryData.reduce((sum, c) => sum + (c.value || 0), 0);

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
                                            onClick={(data) => {
                                                if (data && data.name) {
                                                    setSelectedCategory(selectedCategory === data.name ? null : data.name);
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    stroke={selectedCategory === entry.name ? '#fff' : 'none'}
                                                    strokeWidth={2}
                                                />
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
                                            formatter={(val: any) => `${currencySymbol}${(Number(val) || 0).toFixed(2)}`}
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
                                        {currencySymbol}{totalSpending.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.breakdownTable}>
                                {[...categoryData].sort((a, b) => b.value - a.value).map((cat, index) => {
                                    const percent = totalSpending > 0 ? ((cat.value / totalSpending) * 100).toFixed(1) : "0.0";
                                    const isSelected = selectedCategory === cat.name;
                                    return (
                                        <div
                                            key={cat.name}
                                            className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
                                            onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
                                            style={{ cursor: 'pointer', border: isSelected ? '1px solid var(--primary)' : '1px solid transparent' }}
                                        >
                                            <div className={styles.catInfo}>
                                                <div className={styles.dot} style={{ background: COLORS[index % COLORS.length], boxShadow: `0 0 10px ${COLORS[index % COLORS.length]}44` }} />
                                                <span className={styles.catName}>{cat.name}</span>
                                            </div>
                                            <div className={styles.catStats}>
                                                <div className={styles.catAmount}>{currencySymbol}{(cat.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
                                    formatter={(val: any) => [`${currencySymbol}${(Number(val) || 0).toFixed(2)}`, 'Spent']}
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
            {/* Drill-down Transactions */}
            {selectedCategory && (
                <div className={styles.drillDownSection} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 className={styles.cardTitle}>Transactions: {selectedCategory}</h2>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                                    All expenses in this category
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedCategory(null)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.drillDownList} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                            {transactions
                                .filter(t => t.type === 'expense' && t.category === selectedCategory)
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map(t => (
                                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--input-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ShoppingBag size={18} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{t.merchant}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(t.date)}</div>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                                            -{currencySymbol}{t.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
            <QuickAddFAB />
        </div>
    );
};

