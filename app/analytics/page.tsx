"use client";
import React, { useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Analytics.module.css';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip,
    BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { Budget } from '@/types';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AnalyticsPage() {
    const { transactions, budgets, addBudget, deleteBudget, editBudget } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    // 1. Spending by Category (Pie Chart)
    const categoryData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const categories: Record<string, number> = {};

        expenses.forEach(t => {
            const cat = t.category || 'Uncategorized';
            categories[cat] = (categories[cat] || 0) + t.amount;
        });

        return Object.keys(categories).map(cat => ({
            name: cat,
            value: categories[cat]
        }));
    }, [transactions]);

    // 2. Monthly Trends (Bar Chart)
    const monthlyData = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const months: Record<string, number> = {};
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        expenses.forEach(t => {
            const d = new Date(t.date);
            const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            months[key] = (months[key] || 0) + t.amount;
        });

        return Object.keys(months).slice(-6).map(m => ({
            name: m,
            val: months[m]
        }));
    }, [transactions]);

    // 3. Budgets Logic
    const budgetProgress = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense');
        const currentMonth = new Date().getMonth();

        return budgets.map(b => {
            const spent = expenses
                .filter(t => {
                    const d = new Date(t.date);
                    return t.category === b.category && d.getMonth() === currentMonth;
                })
                .reduce((sum, t) => sum + t.amount, 0);

            return { ...b, spent };
        });
    }, [transactions, budgets]);

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, category: string) => {
        if (confirm(`Delete budget for ${category}?`)) {
            deleteBudget(id);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className={styles.title}>Analytics & Budgets</h1>
                    <button className={styles.addBtn} onClick={() => { setEditingBudget(null); setIsModalOpen(true); }} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', fontSize: 14 }}>
                        <Plus size={18} /> Add Budget
                    </button>
                </div>

                <div className={styles.grid}>
                    {/* Spending Distribution */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Spending by Category</h2>
                        </div>
                        <div className={styles.chartContainer}>
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
                                        formatter={(val: number | undefined) => `$${(val || 0).toFixed(2)}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Trends */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Monthly Trends</h2>
                        </div>
                        <div className={styles.chartContainer}>
                            <ResponsiveContainer width="100%" height="100%">
                                {monthlyData.length > 0 ? (
                                    <BarChart data={monthlyData}>
                                        <XAxis dataKey="name" stroke="#666" tickLine={false} axisLine={false} />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="val" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                ) : (
                                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                                        No trend data yet
                                    </div>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Budgets Section */}
                    <div className={styles.budgetSection}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Monthly Budgets (Current Month)</h2>
                        </div>
                        {budgetProgress.length === 0 ? (
                            <div style={{ color: '#666', fontStyle: 'italic', padding: 20 }}>No budgets set. Create one to track spending!</div>
                        ) : (
                            <div className={styles.budgetsList}>
                                {budgetProgress.map((b, i) => {
                                    const percent = Math.min((b.spent / b.limit) * 100, 100);
                                    const isOver = b.spent > b.limit;
                                    return (
                                        <div key={i} className={styles.budgetCard}>
                                            <div className={styles.budgetTop}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <span className={styles.budgetName}>{b.category}</span>
                                                    <div className={styles.budgetActions} style={{ display: 'flex', gap: 4 }}>
                                                        <button onClick={() => handleEdit(b)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><Edit2 size={14} /></button>
                                                        <button onClick={() => handleDelete(b.id, b.category)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><Trash2 size={14} /></button>
                                                    </div>
                                                </div>
                                                <span className={styles.budgetAmount}>
                                                    ${b.spent.toFixed(0)} / ${b.limit}
                                                </span>
                                            </div>
                                            <div className={styles.progressBarBack}>
                                                <div
                                                    className={styles.progressBarFill}
                                                    style={{
                                                        width: `${percent}%`,
                                                        background: isOver ? '#ef4444' : b.color
                                                    }}
                                                ></div>
                                            </div>
                                            <div className={styles.budgetMeta}>
                                                <span style={{ color: isOver ? '#ef4444' : '#666' }}>
                                                    {isOver ? 'Over Budget!' : `${percent.toFixed(0)}% Used`}
                                                </span>
                                                <span>${Math.max(b.limit - b.spent, 0).toFixed(0)} Left</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <BudgetModal
                    budget={editingBudget}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(b) => {
                        if (editingBudget) {
                            editBudget(b);
                        } else {
                            addBudget(b);
                        }
                    }}
                />
            )}
        </div>
    );
}

function BudgetModal({ onClose, onSave, budget }: { onClose: () => void, onSave: (b: Budget) => void, budget: Budget | null }) {
    const [category, setCategory] = useState(budget?.category || '');
    const [limit, setLimit] = useState(budget?.limit.toString() || '');
    const [color, setColor] = useState(budget?.color || '#3b82f6');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newBudget: Budget = {
            id: budget?.id || Date.now().toString(),
            category,
            limit: parseFloat(limit),
            spent: budget?.spent || 0,
            period: 'monthly',
            color
        };
        onSave(newBudget);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{budget ? 'Edit Budget' : 'New Budget'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Category</label>
                        <select required className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                            <option value="" disabled>Select Category</option>
                            <option value="Food">Food</option>
                            <option value="Transport">Transport</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Bills">Bills</option>
                            <option value="Entertainment">Entertainment</option>
                            <option value="Housing">Housing</option>
                            <option value="Health">Health</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Monthly Limit</label>
                        <input required type="number" className={styles.input} value={limit} onChange={e => setLimit(e.target.value)} placeholder="0.00" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Color Tag</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: c,
                                        cursor: 'pointer',
                                        border: color === c ? '2px solid white' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn}>Save Budget</button>
                </form>
            </div>
        </div>
    );
}
