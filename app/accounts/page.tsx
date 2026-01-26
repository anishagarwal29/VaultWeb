"use client";
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Accounts.module.css';
import { Plus, X, CreditCard, Wallet, Landmark, ArrowRightLeft, Trash2, Edit2, Shield } from 'lucide-react';
import { Account, getCurrencySymbol } from '@/types';

export default function AccountsPage() {
    const { accounts, addAccount, deleteAccount, editAccount, currency } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const currencySymbol = getCurrencySymbol(currency);
    const { availableCurrencies } = useVault();
    const getSymbol = (code: string) => availableCurrencies.find(c => c.code === code)?.symbol || '$';

    const getIcon = (type: string) => {
        switch (type) {
            case 'credit': return <CreditCard size={24} />;
            case 'debit': return <CreditCard size={24} />;
            case 'investment': return <Shield size={24} />;
            default: return <Wallet size={24} />;
        }
    };

    const getGradient = (color: string) => {
        return `linear-gradient(135deg, ${color} 0%, ${color}aa 100%)`;
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (accountToDelete) {
            deleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Accounts</h1>
                        <p className={styles.subtitle}>Manage your financial sources</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}>
                        <Plus size={20} />
                        <span>Add Account</span>
                    </button>
                </div>

                <div className={styles.grid}>
                    {accounts.map(acc => {
                        const symbol = getSymbol(acc.currency || currency);
                        return (
                            <div key={acc.id} className={styles.card}>
                                <div className={styles.cardContent} style={{ background: getGradient(acc.color) }}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.iconBox}>
                                            {getIcon(acc.type)}
                                        </div>
                                        <div className={styles.actions}>
                                            <button onClick={() => handleEdit(acc)} className={styles.actionBtn}>
                                                <Edit2 size={16} color="white" />
                                            </button>
                                            <button onClick={() => setAccountToDelete(acc)} className={styles.actionBtn}>
                                                <Trash2 size={16} color="white" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.cardBody}>
                                        <span className={styles.accountType}>{acc.type === 'debit' ? 'Debit Card' : acc.type === 'credit' ? 'Credit Card' : acc.type.charAt(0).toUpperCase() + acc.type.slice(1)}</span>
                                        <h3 className={styles.accountName}>{acc.name}</h3>
                                        <div className={styles.balance}>
                                            {symbol}{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                    </div>

                                    <div className={styles.cardOverlay} />
                                </div>
                            </div>
                        );
                    })}

                    {accounts.length === 0 && (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>
                                <Wallet size={48} color="#444" />
                            </div>
                            <h3>No Accounts Yet</h3>
                            <p>Add your checking, debit, or credit cards to get started.</p>
                        </div>
                    )}
                </div>
            </main>

            {isModalOpen && (
                <AccountModal
                    account={editingAccount}
                    currency={currency}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(acc) => {
                        if (editingAccount) {
                            editAccount(acc);
                        } else {
                            addAccount(acc);
                        }
                    }}
                />
            )}

            {accountToDelete && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setAccountToDelete(null)}>
                    <div className={styles.modal} style={{ width: 400 }}>
                        <h2 className={styles.modalTitle}>Delete Account?</h2>
                        <p style={{ color: '#aaa', margin: '16px 0', lineHeight: 1.5 }}>
                            Are you sure you want to delete <strong>{accountToDelete.name}</strong>?
                            This will also affect any linked transactions and budgets.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button onClick={() => setAccountToDelete(null)} className={styles.cancelBtn}>Cancel</button>
                            <button onClick={confirmDelete} className={styles.deleteConfirmBtn}>Delete Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AccountModal({ onClose, onSave, account, currency }: { onClose: () => void, onSave: (a: Account) => void, account: Account | null, currency: string }) {
    const [name, setName] = useState(account?.name || '');
    const [balance, setBalance] = useState(account?.balance.toString() || '');
    const [type, setType] = useState(account?.type || 'checking');
    const [color, setColor] = useState(account?.color || '#3b82f6');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAccount: Account = {
            id: account?.id || Date.now().toString(),
            name,
            balance: parseFloat(balance),
            type: type as any,
            color,
            currency: account?.currency || currency
        };
        onSave(newAccount);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{account ? 'Edit Account' : 'Add Account'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    <div className={styles.formElement}>
                        <label className={styles.label}>Account Name</label>
                        <input required className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chase Sapphire" />
                    </div>

                    <div className={styles.formElement}>
                        <label className={styles.label}>Current Balance</label>
                        <input required type="number" step="0.01" className={styles.input} value={balance} onChange={e => setBalance(e.target.value)} placeholder="0.00" />
                    </div>

                    <div className={styles.formElement}>
                        <label className={styles.label}>Type</label>
                        <select className={styles.select} value={type} onChange={e => setType(e.target.value as any)}>
                            <option value="checking">Checking</option>
                            <option value="debit">Debit Card</option>
                            <option value="credit">Credit Card</option>
                            <option value="investment">Investment</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>

                    <div className={styles.formElement}>
                        <label className={styles.label}>Card Color</label>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#111827', '#ec4899', '#6366f1'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: c,
                                        cursor: 'pointer',
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        boxShadow: color === c ? '0 0 0 2px white' : 'none',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <button type="submit" className={styles.submitBtn}>Save Account</button>
                </form>
            </div>
        </div>
    );
}
