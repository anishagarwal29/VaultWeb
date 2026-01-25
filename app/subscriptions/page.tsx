"use client";
import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { useVault } from '@/context/VaultContext';
import styles from './Subscriptions.module.css';
import { Plus, X, Calendar, RefreshCcw, Zap } from 'lucide-react';
import { Subscription, BillingCycle } from '@/types';

export default function SubscriptionsPage() {
    const { subscriptions, addSubscription, deleteSubscription, editSubscription } = useVault();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

    const calculateDaysRemaining = (nextDate: string) => {
        const today = new Date();
        const next = new Date(nextDate);
        const diffTime = next.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const handleEdit = (sub: Subscription) => {
        setEditingSubscription(sub);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`Stop tracking subscription for ${name}?`)) {
            deleteSubscription(id);
        }
    };

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Subscriptions</h1>
                    <button className={styles.addBtn} onClick={() => { setEditingSubscription(null); setIsModalOpen(true); }}>
                        <Plus size={20} />
                        Add New
                    </button>
                </div>

                <div className={styles.grid}>
                    {subscriptions.map(sub => {
                        const daysLeft = calculateDaysRemaining(sub.nextBillingDate);

                        return (
                            <div key={sub.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.icon} style={{ background: sub.color }}>
                                        <Zap size={24} color="white" fill="white" />
                                    </div>
                                    <div className={styles.actions}>
                                        <button onClick={() => handleEdit(sub)} className={styles.iconBtn}><RefreshCcw size={14} /></button>
                                        <button onClick={() => handleDelete(sub.id, sub.name)} className={styles.iconBtn}><X size={14} /></button>
                                    </div>
                                </div>

                                <div className={styles.info}>
                                    <div className={styles.name}>{sub.name}</div>
                                    <div className={styles.cycle}>Billed {sub.billingCycle}</div>
                                </div>

                                <div className={styles.footer}>
                                    <div className={styles.dateBlock}>
                                        <span className={styles.dateLabel}>Next Billing</span>
                                        <span className={styles.dateValue}>
                                            {daysLeft > 0 ? `In ${daysLeft} Days` : 'Today'}
                                        </span>
                                    </div>
                                    <div className={styles.amount}>
                                        ${sub.amount.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {isModalOpen && (
                <SubscriptionModal
                    subscription={editingSubscription}
                    onClose={() => setIsModalOpen(false)}
                    onSave={(s) => {
                        if (editingSubscription) {
                            editSubscription(s);
                        } else {
                            addSubscription(s);
                        }
                    }}
                />
            )}
        </div>
    );
}

function SubscriptionModal({ onClose, onSave, subscription }: { onClose: () => void, onSave: (s: Subscription) => void, subscription: Subscription | null }) {
    const [name, setName] = useState(subscription?.name || '');
    const [amount, setAmount] = useState(subscription?.amount.toString() || '');
    const [billingCycle, setBillingCycle] = useState<BillingCycle>(subscription?.billingCycle || 'monthly');
    const [startDate, setStartDate] = useState(subscription?.startDate.split('T')[0] || new Date().toISOString().split('T')[0]);
    const [isTrial, setIsTrial] = useState(subscription?.isTrial || false);
    const [color, setColor] = useState(subscription?.color || '#3b82f6');

    useEffect(() => {
        if (subscription) {
            setName(subscription.name);
            setAmount(subscription.amount.toString());
            setBillingCycle(subscription.billingCycle);
            setStartDate(new Date(subscription.startDate).toISOString().split('T')[0]);
            setIsTrial(subscription.isTrial);
            setColor(subscription.color);
        } else {
            setName('');
            setAmount('');
            setBillingCycle('monthly');
            setStartDate(new Date().toISOString().split('T')[0]);
            setIsTrial(false);
            setColor('#3b82f6');
        }
    }, [subscription]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Simple next billing logic (1 month from start)
        const start = new Date(startDate);
        const next = new Date(start);
        if (billingCycle === 'monthly') next.setMonth(next.getMonth() + 1);
        if (billingCycle === 'yearly') next.setFullYear(next.getFullYear() + 1);
        if (billingCycle === 'weekly') next.setDate(next.getDate() + 7);

        const newSub: Subscription = {
            id: subscription?.id || Date.now().toString(),
            name,
            amount: parseFloat(amount),
            billingCycle,
            startDate,
            nextBillingDate: next.toISOString(),
            isTrial,
            category: 'General',
            color
        };
        onSave(newSub);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{subscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
                    <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className={styles.formGroup}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Service Name</label>
                        <input required className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Netflix" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Amount</label>
                        <input required type="number" step="0.01" className={styles.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Billing Cycle</label>
                        <select className={styles.select} value={billingCycle} onChange={e => setBillingCycle(e.target.value as BillingCycle)}>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                            <option value="weekly">Weekly</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Start Date</label>
                        <input type="date" className={styles.input} value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>

                    <label className={styles.checkboxGroup}>
                        <input type="checkbox" className={styles.checkbox} checked={isTrial} onChange={e => setIsTrial(e.target.checked)} />
                        <span className={styles.checkboxLabel}>Is this a Free Trial?</span>
                    </label>

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

                    <button type="submit" className={styles.submitBtn}>Save Subscription</button>
                </form>
            </div>
        </div>
    );
}
