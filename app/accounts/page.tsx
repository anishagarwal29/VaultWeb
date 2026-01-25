"use client";
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Accounts.module.css';
import { Plus, X, CreditCard, Wallet, Landmark, ArrowRightLeft, Trash2, Edit2 } from 'lucide-react';
import { Account } from '@/types';

export default function AccountsPage() {
    const { accounts, addAccount, deleteAccount, editAccount, transferFunds } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    const getIcon = (type: string) => {
        switch (type) {
            case 'credit': return <CreditCard size={48} opacity={0.2} />;
            case 'savings': return <Landmark size={48} opacity={0.2} />;
            default: return <Wallet size={48} opacity={0.2} />;
        }
    };

    const handleEdit = (account: Account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
            deleteAccount(id);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Accounts</h1>
                    <div className={styles.actions}>
                        <button className={styles.addBtn} onClick={() => { setEditingAccount(null); setIsModalOpen(true); }}>
                            <Plus size={20} />
                            Add Account
                        </button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {accounts.map(acc => (
                        <div
                            key={acc.id}
                            className={styles.card}
                            style={{
                                background: `linear-gradient(135deg, ${acc.color} 0%, ${acc.color}dd 100%)`
                            }}
                        >
                            <div className={styles.cardTop}>
                                <div>
                                    <div className={styles.accountName}>{acc.name}</div>
                                    <span className={styles.accountType}>{acc.type}</span>
                                </div>
                                <div className={styles.cardActions}>
                                    <button onClick={() => handleEdit(acc)} className={styles.iconBtn}><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(acc.id, acc.name)} className={styles.iconBtn}><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className={styles.balance}>
                                ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>

                            <div className={styles.cardBg}>
                                {getIcon(acc.type)}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {isModalOpen && (
                <AccountModal
                    account={editingAccount}
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
        </div>
    );
}

function AccountModal({ onClose, onSave, account }: { onClose: () => void, onSave: (a: Account) => void, account: Account | null }) {
    const [name, setName] = useState(account?.name || '');
    const [balance, setBalance] = useState(account?.balance.toString() || '');
    const [type, setType] = useState(account?.type || 'checking');
    const [color, setColor] = useState(account?.color || '#3b82f6');

    useEffect(() => {
        if (account) {
            setName(account.name);
            setBalance(account.balance.toString());
            setType(account.type);
            setColor(account.color);
        } else {
            setName('');
            setBalance('');
            setType('checking');
            setColor('#3b82f6');
        }
    }, [account]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newAccount: Account = {
            id: account?.id || Date.now().toString(),
            name,
            balance: parseFloat(balance),
            type: type as any,
            color
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
                            <option value="savings">Savings</option>
                            <option value="credit">Credit Card</option>
                            <option value="investment">Investment</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>

                    <div className={styles.formElement}>
                        <label className={styles.label}>Card Color</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#111827'].map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColor(c)}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        background: c,
                                        cursor: 'pointer',
                                        border: '2px solid rgba(255,255,255,0.2)',
                                        outline: color === c ? '2px solid white' : 'none',
                                        outlineOffset: 2
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
