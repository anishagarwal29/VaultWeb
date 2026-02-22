"use client";
import React, { useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Budgets.module.css';
import { Plus, X, Edit2, Trash2 } from 'lucide-react';
import { Budget, Account, getCurrencySymbol } from '@/types';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export default function BudgetsPage() {
    const { transactions, budgets, accounts, addBudget, deleteBudget, editBudget, currency, isLoading } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
    const currencySymbol = getCurrencySymbol(currency);

    // Exchange Rates for Normalization
    const { rates } = useExchangeRates(currency);

    const getNormalizedAmount = (amount: number, accountId?: string) => {
        if (!accountId) return amount;
        const account = accounts.find(a => a.id === accountId);
        if (!account) return amount;

        if (account.currency === currency) return amount;

        const rate = rates[account.currency];
        return rate ? amount / rate : amount;
    };

    // Budgets Logic
    const budgetProgress = useMemo(() => {
        const expenses = transactions.filter(t => t.type === 'expense' && !t.linkedId && t.category !== 'Transfer');
        const currentMonth = new Date().getMonth();

        return budgets.map(b => {
            // Filter transactions by category AND (if budget has account) accountId
            const spent = expenses
                .filter(t => {
                    const d = new Date(t.date);
                    const categoryMatch = t.category === b.category;
                    const accountMatch = b.accountId ? t.accountId === b.accountId : true;
                    return categoryMatch && accountMatch && d.getMonth() === currentMonth;
                })
                .reduce((sum, t) => {
                    const normalized = getNormalizedAmount(t.amount, t.accountId);
                    return sum + normalized;
                }, 0);

            return { ...b, spent };
        });
    }, [transactions, budgets, rates, currency, accounts]);

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (budgetToDelete) {
            deleteBudget(budgetToDelete.id);
            setBudgetToDelete(null);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                    <div>
                        <h1 className={styles.title} style={{ marginBottom: 4 }}>Budgets</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Track your monthly spending limits</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}>
                        <Plus size={18} /> Add Budget
                    </button>
                </div>

                {isLoading ? (
                    <div className={styles.budgetsList}>
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={styles.budgetCard} style={{ pointerEvents: 'none' }}>
                                <div className={styles.budgetTop}>
                                    <div>
                                        <div style={{ width: 100, height: 16, background: '#333', borderRadius: 4, marginBottom: 8 }} />
                                        <div style={{ width: 80, height: 12, background: '#333', borderRadius: 4 }} />
                                    </div>
                                </div>
                                <div className={styles.budgetAmount} style={{ marginBottom: 12 }}>
                                    <div style={{ width: 200, height: 14, background: '#333', borderRadius: 4 }} />
                                </div>
                                <div className={styles.progressBarBack} style={{ background: '#333' }} />
                            </div>
                        ))}
                    </div>
                ) : budgetProgress.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)' }}>
                        <div style={{ marginBottom: 16 }}>No budgets created yet.</div>
                        <button className={styles.addBtn} style={{ margin: '0 auto' }} onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}>
                            Create First Budget
                        </button>
                    </div>
                ) : (
                    <div className={styles.budgetsList}>
                        {budgetProgress.map((b, i) => {
                            const percent = Math.min((b.spent / b.limit) * 100, 100);
                            const isOver = b.spent > b.limit;
                            const accountName = accounts.find(a => a.id === b.accountId)?.name || 'All Accounts';

                            return (
                                <div key={i} className={styles.budgetCard}>
                                    <div className={styles.budgetTop}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div>
                                                <span className={styles.budgetName}>{b.category}</span>
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{accountName}</div>
                                            </div>
                                        </div>
                                        <div className={styles.budgetActions} style={{ display: 'flex', gap: 8 }}>
                                            <button onClick={() => handleEdit(b)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Edit2 size={16} /></button>
                                            <button onClick={() => setBudgetToDelete(b)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                        </div>
                                    </div>

                                    <div className={styles.budgetAmount} style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Spent: <span style={{ color: isOver ? 'var(--primary)' : 'var(--foreground)', fontWeight: 600 }}>{currencySymbol}{b.spent.toFixed(2)}</span></span>
                                        <span>Limit: {currencySymbol}{b.limit.toLocaleString()}</span>
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
                                        <span style={{ color: isOver ? '#ef4444' : 'var(--text-secondary)' }}>
                                            {isOver ? 'Over Budget!' : `${percent.toFixed(0)}% Used`}
                                        </span>
                                        <span>{currencySymbol}{Math.max(b.limit - b.spent, 0).toFixed(0)} Left</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {isModalOpen && (
                <BudgetModal
                    budget={editingBudget}
                    accounts={accounts}
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

            {budgetToDelete && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setBudgetToDelete(null)}>
                    <div className={styles.modal} style={{ width: 400 }}>
                        <h2 className={styles.modalTitle}>Delete Budget?</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '16px 0' }}>
                            Are you sure you want to delete the <strong>{budgetToDelete.category}</strong> budget?
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button onClick={() => setBudgetToDelete(null)} className={styles.btn} style={{ background: 'transparent', border: '1px solid var(--border)' }}>Cancel</button>
                            <button onClick={confirmDelete} className={styles.dangerBtn}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BudgetModal({ onClose, onSave, budget, accounts }: { onClose: () => void, onSave: (b: Budget) => void, budget: Budget | null, accounts: Account[] }) {
    const [category, setCategory] = useState(budget?.category || '');
    const [limit, setLimit] = useState(budget?.limit.toString() || '');
    const [color, setColor] = useState(budget?.color || '#3b82f6');
    const [accountId, setAccountId] = useState(budget?.accountId || 'all');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newBudget: Budget = {
            id: budget?.id || Date.now().toString(),
            category,
            limit: parseFloat(limit),
            spent: budget?.spent || 0,
            period: 'monthly',
            color,
            accountId: accountId === 'all' ? undefined : accountId
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
                        <label className={styles.label}>Account</label>
                        <select className={styles.select} value={accountId} onChange={e => setAccountId(e.target.value)}>
                            <option value="all">All Accounts (Global Budget)</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                    </div>

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
