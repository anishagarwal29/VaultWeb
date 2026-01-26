"use client";
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import styles from './Settings.module.css';
import { X, Check, Plus } from 'lucide-react';
import { useVault } from '@/context/VaultContext';
import { getCurrencySymbol } from '@/types';

export default function SettingsPage() {
    const { currency, setCurrency, theme, setTheme, availableCurrencies, addCurrency, categories, addCategory, deleteCategory } = useVault();
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isAddCurrencyMode, setIsAddCurrencyMode] = useState(false);
    const [newCurrency, setNewCurrency] = useState({ code: '', symbol: '', name: '' });
    const [newCategoryData, setNewCategoryData] = useState({ name: '', type: 'expense' as 'income' | 'expense' | 'any' });

    const handleAddCurrency = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCurrency.code.length !== 3) {
            alert("Currency code must be exactly 3 letters (e.g. USD).");
            return;
        }
        if (availableCurrencies.some(c => c.code === newCurrency.code)) {
            alert("This currency code already exists.");
            return;
        }
        if (newCurrency.code && newCurrency.symbol && newCurrency.name) {
            addCurrency(newCurrency);
            setIsAddCurrencyMode(false);
            setNewCurrency({ code: '', symbol: '', name: '' });
        }
    };

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryData.name) {
            addCategory({
                id: Date.now().toString(),
                name: newCategoryData.name,
                type: newCategoryData.type
            });
            setIsCategoryModalOpen(false);
            setNewCategoryData({ name: '', type: 'expense' });
        }
    };

    const handleReset = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleExport = () => {
        const data = {
            transactions: localStorage.getItem('vault_transactions'),
            accounts: localStorage.getItem('vault_accounts'),
            budgets: localStorage.getItem('vault_budgets')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vault-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const currentCurrency = availableCurrencies.find(c => c.code === currency) || availableCurrencies[0];

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <h1 className={styles.title}>Settings</h1>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>Preferences</div>
                        <div className={styles.sectionDesc}>Customize your Vault experience</div>
                    </div>

                    <div className={styles.row}>
                        <span className={styles.rowLabel}>Currency</span>
                        <button className={styles.btn} onClick={() => setIsCurrencyModalOpen(true)}>
                            {currentCurrency.code} ({currentCurrency.symbol})
                        </button>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.rowLabel}>Theme</span>
                        <button className={styles.btn} onClick={toggleTheme}>
                            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </button>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>Manage Categories</div>
                        <div className={styles.sectionDesc}>Customize your transaction categories</div>
                    </div>
                    <div className={styles.categoryList}>
                        {categories.map(c => (
                            <div key={c.id} className={styles.categoryBadge}>
                                <span style={{ opacity: 0.6, fontSize: 10, marginRight: 2 }}>
                                    {c.type === 'income' ? '↑' : c.type === 'expense' ? '↓' : '↔'}
                                </span>
                                {c.name}
                                <button className={styles.deleteBtn} onClick={() => deleteCategory(c.id)}>
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div style={{ padding: '0 24px 20px' }}>
                        <button className={styles.plusBtn} onClick={() => setIsCategoryModalOpen(true)}>
                            <Plus size={16} /> Add Category
                        </button>
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionTitle}>Data Management</div>
                        <div className={styles.sectionDesc}>Control your local data</div>
                    </div>

                    <div className={styles.row}>
                        <span className={styles.rowLabel}>Export Data</span>
                        <button className={styles.btn} onClick={handleExport}>Download JSON</button>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.rowLabel}>Reset Application</span>
                        <button className={styles.dangerBtn} onClick={() => setIsResetModalOpen(true)}>Clear All Data</button>
                    </div>
                </div>

                <div style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                    Vault Web v1.0.0
                </div>
            </main>

            {isResetModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsResetModalOpen(false)}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle} style={{ color: '#ef4444' }}>Reset Application?</h2>
                            <button className={styles.closeBtn} onClick={() => setIsResetModalOpen(false)}><X size={20} /></button>
                        </div>
                        <p style={{ color: '#aaa', margin: '16px 0', lineHeight: 1.5 }}>
                            Are you sure you want to clear all data? This action <strong>cannot be undone</strong> and will remove all your accounts, transactions, and budgets.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button onClick={() => setIsResetModalOpen(false)} className={styles.btn}>Cancel</button>
                            <button onClick={handleReset} className={styles.dangerBtn} style={{ background: '#ef4444', color: 'white' }}>Yes, Clear Everything</button>
                        </div>
                    </div>
                </div>
            )}

            {isCurrencyModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsCurrencyModalOpen(false)}>
                    <div className={styles.modal} style={{ width: 400, gap: 8 }}>
                        <div className={styles.modalHeader} style={{ marginBottom: 12 }}>
                            <h2 className={styles.modalTitle}>{isAddCurrencyMode ? 'Add Currency' : 'Select Currency'}</h2>
                            <button className={styles.closeBtn} onClick={() => setIsCurrencyModalOpen(false)}><X size={20} /></button>
                        </div>

                        {isAddCurrencyMode ? (
                            <form onSubmit={handleAddCurrency} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Currency Code</label>
                                    <input required className={styles.input} style={{ width: '100%' }} value={newCurrency.code} onChange={e => setNewCurrency({ ...newCurrency, code: e.target.value.toUpperCase() })} placeholder="e.g. BTC" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Symbol</label>
                                    <input required className={styles.input} style={{ width: '100%' }} value={newCurrency.symbol} onChange={e => setNewCurrency({ ...newCurrency, symbol: e.target.value })} placeholder="e.g. ₿" />
                                </div>
                                <div>
                                    <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Name</label>
                                    <input required className={styles.input} style={{ width: '100%' }} value={newCurrency.name} onChange={e => setNewCurrency({ ...newCurrency, name: e.target.value })} placeholder="e.g. Bitcoin" />
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    <button type="button" onClick={() => setIsAddCurrencyMode(false)} className={styles.btn} style={{ flex: 1 }}>Back</button>
                                    <button type="submit" className={styles.submitBtn} style={{ flex: 1 }}>Add Currency</button>
                                </div>
                            </form>
                        ) : (
                            <div className={styles.currencyList}>
                                <button className={styles.btn} onClick={() => setIsAddCurrencyMode(true)} style={{ marginBottom: 12, width: '100%', justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                                    <Plus size={16} style={{ marginRight: 8 }} /> Add Custom Currency
                                </button>
                                {availableCurrencies.map(c => (
                                    <button
                                        key={c.code}
                                        className={styles.currencyOption}
                                        onClick={() => {
                                            setCurrency(c.code);
                                            setIsCurrencyModalOpen(false);
                                        }}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            background: currency === c.code ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                            border: 'none',
                                            borderRadius: 12,
                                            color: currency === c.code ? 'var(--primary)' : 'var(--foreground)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: 14
                                        }}
                                    >
                                        <span>{c.name} ({c.symbol})</span>
                                        {currency === c.code && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isCategoryModalOpen && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsCategoryModalOpen(false)}>
                    <div className={styles.modal} style={{ width: 400 }}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Add Category</h2>
                            <button className={styles.closeBtn} onClick={() => setIsCategoryModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddCategory} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Category Name</label>
                                <input required className={styles.input} style={{ width: '100%' }} value={newCategoryData.name} onChange={e => setNewCategoryData({ ...newCategoryData, name: e.target.value })} placeholder="e.g. Rent" />
                            </div>
                            <div>
                                <label style={{ fontSize: 12, color: '#888', marginBottom: 4, display: 'block' }}>Type</label>
                                <select className={styles.select} style={{ width: '100%' }} value={newCategoryData.type} onChange={e => setNewCategoryData({ ...newCategoryData, type: e.target.value as any })}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                    <option value="any">Both / Any</option>
                                </select>
                            </div>
                            <button type="submit" className={styles.submitBtn}>Add Category</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
