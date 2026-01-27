"use client";
import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useVault } from '@/context/VaultContext';
import styles from './QuickAddFAB.module.css';
import { Transaction, Account } from '@/types';

export const QuickAddFAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        accounts,
        addTransaction,
        transferFunds,
        currency,
        availableCurrencies,
        categories
    } = useVault();

    if (isOpen) {
        return (
            <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}>
                <div className={styles.modalContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h2 className={styles.modalTitle}>Quick Add</h2>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    </div>
                    <QuickTransactionForm
                        onClose={() => setIsOpen(false)}
                        onSave={addTransaction}
                        onTransfer={transferFunds}
                        accounts={accounts}
                        currency={currency}
                        availableCurrencies={availableCurrencies}
                        categories={categories}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.fabContainer}>
            <button className={styles.fab} onClick={() => setIsOpen(true)} title="Quick Add Transaction">
                <Plus size={32} />
            </button>
        </div>
    );
};

function QuickTransactionForm({
    onClose, onSave, onTransfer, accounts, currency, availableCurrencies, categories
}: {
    onClose: () => void,
    onSave: (t: Transaction) => void,
    onTransfer: (from: string, to: string, amount: number) => void,
    accounts: Account[],
    currency: string,
    availableCurrencies: any[],
    categories: any[]
}) {
    const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
    const [merchant, setMerchant] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [accountId, setAccountId] = useState(accounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState(accounts.find(a => a.id !== accounts[0]?.id)?.id || '');

    const [txnCurrency, setTxnCurrency] = useState(currency);
    const [originalAmount, setOriginalAmount] = useState('');
    const [convertedAmount, setConvertedAmount] = useState('');

    const selectedAccount = accounts.find(a => a.id === accountId);
    const accountCurrency = selectedAccount?.currency || currency;
    const isForeign = txnCurrency !== accountCurrency;

    const [isLoadingRate, setIsLoadingRate] = useState(false);

    useEffect(() => {
        const fetchRate = async () => {
            if (!isForeign || !originalAmount || isNaN(parseFloat(originalAmount))) return;
            setIsLoadingRate(true);
            try {
                const res = await fetch(`https://open.er-api.com/v6/latest/${txnCurrency}`);
                const data = await res.json();
                const rate = data.rates[accountCurrency];
                if (rate) {
                    setConvertedAmount((parseFloat(originalAmount) * rate).toFixed(2));
                }
            } catch (error) {
                console.error("Failed to fetch exchange rate", error);
            } finally {
                setIsLoadingRate(false);
            }
        };

        const timeoutId = setTimeout(fetchRate, 500);
        return () => clearTimeout(timeoutId);
    }, [originalAmount, txnCurrency, accountCurrency, isForeign]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === 'transfer') {
            onTransfer(accountId, toAccountId, parseFloat(originalAmount));
            onClose();
            return;
        }

        const finalAmount = isForeign ? parseFloat(convertedAmount) : parseFloat(originalAmount);

        console.log("QuickAddFAB - Saving Transaction Debug:", {
            enteredOriginal: originalAmount,
            converted: convertedAmount,
            isForeign,
            finalAmount,
            type,
            currency: txnCurrency
        });
        const newTransaction: Transaction = {
            id: Date.now().toString(),
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

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                {['expense', 'income', 'transfer'].map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setType(t as any)}
                        style={{
                            padding: '10px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: type === t ? 'var(--primary)' : 'transparent',
                            color: type === t ? 'white' : 'var(--text-secondary)',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            cursor: 'pointer'
                        }}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {type !== 'transfer' && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Merchant</label>
                    <input required className={styles.input} value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Starbucks" />
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className={styles.inputGroup}>
                    <label className={styles.label}>{type === 'transfer' ? 'From' : 'Account'}</label>
                    <select required className={styles.select} value={accountId} onChange={e => setAccountId(e.target.value)}>
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                        ))}
                    </select>
                </div>
                {type === 'transfer' ? (
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>To</label>
                        <select required className={styles.select} value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Currency</label>
                        <select className={styles.select} value={txnCurrency} onChange={e => setTxnCurrency(e.target.value)}>
                            {availableCurrencies.map(c => (
                                <option key={c.code} value={c.code}>{c.code}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className={styles.inputGroup}>
                <label className={styles.label}>Amount {isForeign && `(${txnCurrency})`}</label>
                <input required type="number" step="any" className={styles.input} value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder="0.00" />
            </div>

            {type !== 'transfer' && (
                <div className={styles.inputGroup}>
                    <label className={styles.label}>Category</label>
                    <select className={styles.select} required value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="" disabled>Select Category</option>
                        {categories.filter(c => c.type === type || c.type === 'any').map(c => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className={styles.buttonGroup}>
                <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Save</button>
            </div>
        </form>
    );
}
