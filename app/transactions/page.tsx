"use client";
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Transactions.module.css';
import { Plus, Search, Filter, X, Edit2, Trash2 } from 'lucide-react';
import { Transaction, Account } from '@/types';

export default function TransactionsPage() {
    const { transactions, addTransaction, deleteTransaction, editTransaction, transferFunds, accounts } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    const filteredTransactions = transactions.filter(t =>
        t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Delete this transaction?')) {
            deleteTransaction(id);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Transactions</h1>
                    <div className={styles.controls}>
                        <input
                            type="text"
                            placeholder="Search..."
                            className={styles.search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className={styles.addBtn} onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }}>
                            <Plus size={20} />
                            Add New
                        </button>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Merchant</th>
                                <th>Category</th>
                                <th>Account</th>
                                <th style={{ textAlign: 'right' }}>Amount</th>
                                <th style={{ width: 80 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((t) => {
                                const account = accounts.find(a => a.id === t.accountId);
                                return (
                                    <tr key={t.id}>
                                        <td>{new Date(t.date).toLocaleDateString()}</td>
                                        <td>{t.merchant}</td>
                                        <td><span className={styles.categoryTag}>{t.category}</span></td>
                                        <td style={{ color: '#888', fontSize: 13 }}>{account?.name || '-'}</td>
                                        <td style={{ textAlign: 'right' }} className={t.type === 'income' ? styles.income : styles.expense}>
                                            {t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}
                                        </td>
                                        <td className={styles.actionsCell}>
                                            <div className={styles.actions}>
                                                <button onClick={() => handleEdit(t)} className={styles.iconBtn}><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(t.id)} className={styles.iconBtn}><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </main>

            {isModalOpen && (
                <TransactionModal
                    accounts={accounts}
                    transaction={editingTransaction}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(t) => {
                        if (editingTransaction) {
                            editTransaction(t);
                        } else {
                            addTransaction(t);
                        }
                    }}
                    onTransfer={transferFunds}
                />
            )}
        </div>
    );
}

function TransactionModal({ onClose, onSave, onTransfer, accounts, transaction }: { onClose: () => void, onSave: (t: Transaction) => void, onTransfer: (from: string, to: string, amount: number) => void, accounts: Account[], transaction: Transaction | null }) {
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction?.type || 'expense');
    const [merchant, setMerchant] = useState(transaction?.merchant || '');
    const [amount, setAmount] = useState(transaction?.amount.toString() || '');
    const [category, setCategory] = useState(transaction?.category || '');
    const [date, setDate] = useState(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(transaction?.accountId || accounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState(accounts.find(a => a.id !== accounts[0]?.id)?.id || '');

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setMerchant(transaction.merchant);
            setAmount(transaction.amount.toString());
            setCategory(transaction.category);
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setAccountId(transaction.accountId);
        } else {
            setType('expense');
            setMerchant('');
            setAmount('');
            setCategory('');
            setDate(new Date().toISOString().split('T')[0]);
            setAccountId(accounts[0]?.id || '');
        }
    }, [transaction, accounts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'transfer') {
            if (accountId === toAccountId) {
                alert("Cannot transfer to the same account");
                return;
            }
            onTransfer(accountId, toAccountId, parseFloat(amount));
            onClose();
            return;
        }

        const newTransaction: Transaction = {
            id: transaction?.id || Date.now().toString(),
            merchant,
            amount: parseFloat(amount),
            category,
            date,
            type: type as 'income' | 'expense',
            accountId
        };
        onSave(newTransaction);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{transaction ? 'Edit Transaction' : (type === 'transfer' ? 'Transfer Funds' : 'Add Transaction')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <div className={styles.typeToggle} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div
                        className={`${styles.toggleOption} ${type === 'expense' ? styles.active : ''}`}
                        onClick={() => setType('expense')}
                    >
                        Expense
                    </div>
                    <div
                        className={`${styles.toggleOption} ${type === 'income' ? styles.active : ''}`}
                        onClick={() => setType('income')}
                    >
                        Income
                    </div>
                    <div
                        className={`${styles.toggleOption} ${type === 'transfer' ? styles.active : ''}`}
                        onClick={() => setType('transfer')}
                    >
                        Transfer
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    {type !== 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Merchant</label>
                            <input required className={styles.input} value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Starbucks" />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Amount</label>
                        <input required type="number" step="0.01" className={styles.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    </div>

                    {type !== 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <select className={styles.select} value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="" disabled>Select Category</option>
                                <option value="Food">Food</option>
                                <option value="Transport">Transport</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Income">Income</option>
                                <option value="Bills">Bills</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Health">Health</option>
                            </select>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{type === 'transfer' ? 'From Account' : 'Account'}</label>
                        <select required className={styles.select} value={accountId} onChange={e => setAccountId(e.target.value)}>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                            ))}
                        </select>
                    </div>

                    {type === 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>To Account</label>
                            <select required className={styles.select} value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} (${a.balance.toFixed(2)})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Date</label>
                        <input type="date" className={styles.input} value={date} onChange={e => setDate(e.target.value)} />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        {type === 'transfer' ? 'Transfer Funds' : 'Save Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}
