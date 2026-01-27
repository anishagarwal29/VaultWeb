"use client";
import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Transactions.module.css';
import { Plus, Search, Filter, X, Edit2, Trash2 } from 'lucide-react';
import { Transaction, Account, formatDate } from '@/types';

export default function TransactionsPage() {
    const { transactions, addTransaction, deleteTransaction, editTransaction, transferFunds, accounts, currency, availableCurrencies, categories, isLoading } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const getSymbol = (code: string) => availableCurrencies.find(c => c.code === code)?.symbol || '$';

    const filteredTransactions = transactions
        .filter(t =>
            t.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.note && t.note.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        setIsModalOpen(true);
    };

    const confirmDelete = () => {
        if (transactionToDelete) {
            deleteTransaction(transactionToDelete.id);
            setTransactionToDelete(null);
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
                    <div className={styles.tableContainer}>
                        {isLoading ? (
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
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} style={{ pointerEvents: 'none' }}>
                                            <td><div style={{ width: 80, height: 16, background: '#444', borderRadius: 4, opacity: 0.3 }} /></td>
                                            <td><div style={{ width: 120, height: 20, background: '#444', borderRadius: 4, opacity: 0.3 }} /></td>
                                            <td><div style={{ width: 80, height: 24, background: '#444', borderRadius: 12, opacity: 0.3 }} /></td>
                                            <td><div style={{ width: 100, height: 16, background: '#444', borderRadius: 4, opacity: 0.3 }} /></td>
                                            <td style={{ textAlign: 'right' }}><div style={{ width: 80, height: 20, background: '#444', borderRadius: 4, opacity: 0.3, display: 'inline-block' }} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : filteredTransactions.length > 0 ? (
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
                                    {filteredTransactions.map((t, index) => {
                                        // Consolidation Logic: For linked transfers, only show the 'expense' side
                                        // This prevents duplicate rows for a single transfer event.
                                        if (t.linkedId) {
                                            if (t.type === 'income') return null;
                                        }

                                        const account = accounts.find(a => a.id === t.accountId);
                                        const symbol = getSymbol(t.currency || currency);
                                        const accountSymbol = getSymbol(account?.currency || currency);
                                        const isForeign = t.originalAmount !== undefined && t.currency !== (account?.currency || currency);

                                        // Special display for transfers
                                        const displayName = t.linkedId
                                            ? `Transfer: ${account?.name || 'Unknown'} → ${t.transferAccountName || 'Other Account'}`
                                            : t.merchant;

                                        return (
                                            <tr key={t.id}>
                                                <td>{formatDate(t.date)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 500 }}>{displayName}</span>
                                                        {t.note && <span style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{t.note}</span>}
                                                    </div>
                                                </td>
                                                <td><span className={styles.categoryTag}>{t.category}</span></td>
                                                <td style={{ color: '#888', fontSize: 13 }}>{t.linkedId ? 'Transfer' : (account?.name || '-')}</td>
                                                <td style={{ textAlign: 'right' }} className={t.type === 'income' ? styles.income : styles.expense}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                        <span>{t.type === 'income' ? '+' : '-'}{symbol}{Math.abs(t.originalAmount || t.amount).toFixed(2)}</span>
                                                        {isForeign && (
                                                            <span style={{ fontSize: 11, color: '#666' }}>
                                                                ({accountSymbol}{Math.abs(t.amount).toFixed(2)})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <div className={styles.actions}>
                                                        <button onClick={() => handleEdit(t)} className={styles.iconBtn}><Edit2 size={16} /></button>
                                                        <button onClick={() => setTransactionToDelete(t)} className={styles.iconBtn}><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
                                {searchTerm ? 'No transactions match your search.' : 'No transactions yet. Add one to get started!'}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <TransactionModal
                    accounts={accounts}
                    transaction={editingTransaction}
                    currency={currency}
                    availableCurrencies={availableCurrencies}
                    categories={categories}
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

            {transactionToDelete && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setTransactionToDelete(null)}>
                    <div className={styles.modal} style={{ width: 400 }}>
                        <h2 className={styles.modalTitle}>Delete Transaction?</h2>
                        <p style={{ color: '#aaa', margin: '16px 0' }}>
                            Are you sure you want to delete the transaction from <strong>{transactionToDelete.merchant}</strong>?
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button onClick={() => setTransactionToDelete(null)} className={styles.submitBtn} style={{ background: 'transparent', border: '1px solid #333', marginTop: 0 }}>Cancel</button>
                            <button onClick={confirmDelete} className={styles.submitBtn} style={{ background: '#ef4444', marginTop: 0 }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function TransactionModal({
    onClose, onSave, onTransfer, accounts, transaction, currency, availableCurrencies, categories
}: {
    onClose: () => void,
    onSave: (t: Transaction) => void,
    onTransfer: (from: string, to: string, amount: number) => void,
    accounts: Account[],
    transaction: Transaction | null,
    currency: string,
    availableCurrencies: any[],
    categories: any[]
}) {
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>(transaction?.type || 'expense');
    const [merchant, setMerchant] = useState(transaction?.merchant || '');
    const [category, setCategory] = useState(transaction?.category || '');
    const [note, setNote] = useState(transaction?.note || '');
    const [date, setDate] = useState(transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(transaction?.accountId || accounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState(accounts.find(a => a.id !== accounts[0]?.id)?.id || '');

    // Currency Logic
    const [txnCurrency, setTxnCurrency] = useState(transaction?.currency || currency);
    const [originalAmount, setOriginalAmount] = useState(transaction?.originalAmount?.toString() || transaction?.amount.toString() || '');
    const [convertedAmount, setConvertedAmount] = useState(transaction?.amount.toString() || '');

    const selectedAccount = accounts.find(a => a.id === accountId);
    const accountCurrency = selectedAccount?.currency || currency;
    const isForeign = txnCurrency !== accountCurrency;

    const [isLoadingRate, setIsLoadingRate] = useState(false);

    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setMerchant(transaction.merchant);
            setCategory(transaction.category);
            setNote(transaction.note || '');
            setDate(new Date(transaction.date).toISOString().split('T')[0]);
            setAccountId(transaction.accountId);
            setTxnCurrency(transaction.currency);
            setOriginalAmount(transaction.originalAmount?.toString() || transaction.amount.toString());
            setConvertedAmount(transaction.amount.toString());
        } else {
            setType('expense');
            setMerchant('');
            setCategory('');
            setNote('');
            setDate(new Date().toISOString().split('T')[0]);
            setAccountId(accounts[0]?.id || '');
            setTxnCurrency(currency);
            setOriginalAmount('');
            setConvertedAmount('');
        }
    }, [transaction, accounts, currency]);

    // Auto-convert currency
    useEffect(() => {
        const fetchRate = async () => {
            if (!isForeign || !originalAmount || isNaN(parseFloat(originalAmount))) return;

            // Should not fetch if currencies are invalid or empty
            if (!txnCurrency || !accountCurrency) return;

            setIsLoadingRate(true);
            try {
                const res = await fetch(`https://open.er-api.com/v6/latest/${txnCurrency}`);
                const data = await res.json();
                const rate = data.rates[accountCurrency];

                if (rate) {
                    const converted = (parseFloat(originalAmount) * rate).toFixed(2);
                    setConvertedAmount(converted);
                }
            } catch (error) {
                console.error("Failed to fetch exchange rate", error);
            } finally {
                setIsLoadingRate(false);
            }
        };

        // Debounce slightly to avoid too many requests
        const timeoutId = setTimeout(() => {
            fetchRate();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [originalAmount, txnCurrency, accountCurrency, isForeign]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (type === 'transfer') {
            if (accountId === toAccountId) {
                alert("Cannot transfer to the same account");
                return;
            }
            onTransfer(accountId, toAccountId, parseFloat(originalAmount));
            onClose();
            return;
        }

        const finalAmount = isForeign ? parseFloat(convertedAmount) : parseFloat(originalAmount);

        if (isNaN(finalAmount) || finalAmount === 0) {
            alert("Please enter a valid amount");
            return;
        }

        console.log("Saving Transaction - Debug Info:", {
            enteredOriginal: originalAmount,
            converted: convertedAmount,
            isForeign,
            finalAmount,
            type,
            currency: txnCurrency
        });

        const newTransaction: Transaction = {
            id: transaction?.id || Date.now().toString(),
            merchant,
            amount: finalAmount,
            originalAmount: isForeign ? parseFloat(originalAmount) : undefined,
            category,
            note,
            date,
            type: type as 'income' | 'expense',
            accountId,
            currency: txnCurrency
        };
        onSave(newTransaction);
        onClose();
    };

    const filteredCategories = categories.filter(c => c.type === type || c.type === 'any');

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{transaction ? 'Edit Transaction' : (type === 'transfer' ? 'Transfer Funds' : 'Add Transaction')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <div className={styles.typeToggle} style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div className={`${styles.toggleOption} ${type === 'expense' ? styles.active : ''}`} onClick={() => setType('expense')}>Expense</div>
                    <div className={`${styles.toggleOption} ${type === 'income' ? styles.active : ''}`} onClick={() => setType('income')}>Income</div>
                    <div className={`${styles.toggleOption} ${type === 'transfer' ? styles.active : ''}`} onClick={() => setType('transfer')}>Transfer</div>
                </div>

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    {type !== 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Merchant</label>
                            <input required className={styles.input} value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Starbucks" />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{type === 'transfer' ? 'From Account' : 'Account'}</label>
                        <select required className={styles.select} value={accountId} onChange={e => setAccountId(e.target.value)}>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                            ))}
                        </select>
                    </div>

                    {type === 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>To Account</label>
                            <select required className={styles.select} value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                                {accounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {type !== 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Currency</label>
                            <select className={styles.select} value={txnCurrency} onChange={e => setTxnCurrency(e.target.value)}>
                                {availableCurrencies.map(c => (
                                    <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.formGroup} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label className={styles.label}>Amount ({txnCurrency})</label>
                            <input required type="number" step="any" className={styles.input} value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder="0.00" />
                        </div>

                        {isForeign && type !== 'transfer' && (
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <label className={styles.label}>Amount in {accountCurrency} {isLoadingRate && <span style={{ fontSize: 10, color: 'var(--primary)' }}>(Updating...)</span>}</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className={styles.input}
                                    value={convertedAmount}
                                    onChange={e => setConvertedAmount(e.target.value)}
                                    placeholder="0.00"
                                    disabled={true}
                                    style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: 'var(--input-bg)' }}
                                />
                            </div>
                        )}
                    </div>

                    {isForeign && type !== 'transfer' && originalAmount && convertedAmount && (
                        <p style={{ fontSize: 12, color: '#888', marginTop: -4 }}>
                            Exchange Rate: 1 {txnCurrency} = {(parseFloat(convertedAmount) / parseFloat(originalAmount)).toFixed(4)} {accountCurrency}
                        </p>
                    )}

                    {type !== 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Category</label>
                            <select className={styles.select} required value={category} onChange={e => setCategory(e.target.value)}>
                                <option value="" disabled>Select Category</option>
                                {filteredCategories.map(c => (
                                    <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {type !== 'transfer' && (
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Note (Optional)</label>
                            <input className={styles.input} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a description..." />
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Date</label>
                        <DatePicker
                            selected={date ? new Date(date) : new Date()}
                            onChange={(date: Date | null) => {
                                if (date) {
                                    // Keep it as YYYY-MM-DD for consistency with existing logic? 
                                    // Actually the existing logic used split('T')[0] so likely YYYY-MM-DD.
                                    // But let's check if the backend expects full ISO. 
                                    // The type definition says 'date: string; // ISO String'.
                                    // But the init was split('T')[0].
                                    // Let's safe convert to ISO string but maybe keep time 00:00:00?
                                    // The native input type=date returns YYYY-MM-DD.
                                    // So passing YYYY-MM-DD is safe.
                                    // But DatePicker gives localized Date. 
                                    // Let's use setDate(date.toISOString()) but that might include time offset issues.
                                    // Safer: setDate(date.toISOString().split('T')[0]) or manually format.
                                    // Let's use a helper or simple ISO split.

                                    // Actually, let's use the same format as native input: YYYY-MM-DD
                                    // The Date object from datepicker is local time (usually 00:00).
                                    // toISOString() converts to UTC.
                                    // If I pick Jan 27 00:00 local, and I am GMT+8, ISO is Jan 26 16:00.
                                    // That changes the date! 
                                    // I must correct for timezone offset before ISO string, or just format YYYY-MM-DD manually.

                                    const offset = date.getTimezoneOffset();
                                    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
                                    setDate(localDate.toISOString().split('T')[0]);
                                }
                            }}
                            dateFormat="dd/MM/yyyy"
                            className={styles.input}
                            wrapperClassName={styles.datePickerWrapper}
                        />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                        {type === 'transfer' ? 'Transfer Funds' : 'Save Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
}
