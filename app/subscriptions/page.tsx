"use client";
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import styles from './Subscriptions.module.css';
import { useVault } from '@/context/VaultContext';
import { Subscription, Frequency, getCurrencySymbol } from '@/types';
import { Plus, Trash2, Calendar, Zap, LayoutGrid, Clock, AlertTriangle } from 'lucide-react';

export default function SubscriptionsPage() {
    const {
        subscriptions,
        addSubscription,
        deleteSubscription,
        editSubscription,
        calculateMonthlyBurnRate,
        getUpcomingSubscriptions,
        getExpiringTrials,
        currency,
        availableCurrencies,
        isLoading
    } = useVault();

    const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
    const [form, setForm] = useState({
        name: '',
        cost: '',
        frequency: 'monthly' as Frequency,
        category: 'General',
        nextBillingDate: new Date().toISOString().split('T')[0],
        isTrial: false,
        trialEndDate: new Date().toISOString().split('T')[0],
        description: ''
    });

    const resetForm = () => {
        setForm({
            name: '',
            cost: '',
            frequency: 'monthly',
            category: 'General',
            nextBillingDate: new Date().toISOString().split('T')[0],
            isTrial: false,
            trialEndDate: new Date().toISOString().split('T')[0],
            description: ''
        });
        setEditingSubscription(null);
    };

    const handleEditInitiate = (sub: Subscription) => {
        setEditingSubscription(sub);
        setForm({
            name: sub.name,
            cost: sub.cost.toString(),
            frequency: sub.frequency,
            category: sub.category,
            nextBillingDate: sub.nextBillingDate,
            isTrial: sub.isTrial,
            trialEndDate: sub.trialEndDate || new Date().toISOString().split('T')[0],
            description: sub.description || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name || !form.cost) return;

        if (editingSubscription) {
            const updatedSub: Subscription = {
                ...editingSubscription,
                name: form.name,
                cost: parseFloat(form.cost),
                frequency: form.frequency,
                category: form.category,
                nextBillingDate: form.isTrial ? form.trialEndDate : form.nextBillingDate,
                isTrial: form.isTrial,
                trialEndDate: form.isTrial ? form.trialEndDate : undefined,
                description: form.description
            };
            editSubscription(updatedSub);
        } else {
            const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newSub: Subscription = {
                id: Date.now().toString(),
                name: form.name,
                cost: parseFloat(form.cost),
                frequency: form.frequency,
                category: form.category,
                nextBillingDate: form.isTrial ? form.trialEndDate : form.nextBillingDate,
                isTrial: form.isTrial,
                trialEndDate: form.isTrial ? form.trialEndDate : undefined,
                color: randomColor,
                description: form.description
            };
            addSubscription(newSub);
        }
        resetForm();
    };

    const calculateDaysRemaining = (dateStr: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const billing = new Date(dateStr);
        billing.setHours(0, 0, 0, 0);

        const diffTime = billing.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const symbol = getCurrencySymbol(currency, availableCurrencies);
    const monthlyTotal = calculateMonthlyBurnRate();
    const expiringTrials = getExpiringTrials();

    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <header className={styles.header}>
                    <h1 className={styles.title}>Subscription Overview</h1>
                    <p className={styles.subtitle}>Manage your recurring commitments and optimize your burn rate.</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, opacity: 0.8 }}>
                        (Note: Subscriptions are for tracking only and do not automatically deduct from accounts)
                    </p>
                </header>

                {expiringTrials.length > 0 && (
                    <div className={styles.trialAlert}>
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Trial Alert:</strong> {expiringTrials.length} trial{expiringTrials.length > 1 ? 's are' : ' is'} expiring soon! Check your {expiringTrials[0].name} subscription.
                        </div>
                    </div>
                )}

                <div className={styles.overviewGrid}>
                    <section className={styles.burnRateCard}>
                        <div className={styles.burnLabel}>Total Monthly Commitment</div>
                        <div className={styles.burnAmount}>
                            {symbol}{monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            <span>/ month</span>
                        </div>
                    </section>

                    <section className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</h2>
                            {editingSubscription && (
                                <button className={styles.cancelBtn} onClick={resetForm}>Cancel</button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Service Name</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Netflix, Spotify"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Cost</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className={styles.input}
                                        placeholder="0.00"
                                        value={form.cost}
                                        onChange={e => setForm({ ...form, cost: e.target.value })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Frequency</label>
                                    <select
                                        className={styles.select}
                                        value={form.frequency}
                                        onChange={e => setForm({ ...form, frequency: e.target.value as Frequency })}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label className={styles.checkboxGroup}>
                                    <input
                                        type="checkbox"
                                        checked={form.isTrial}
                                        onChange={e => setForm({ ...form, isTrial: e.target.checked })}
                                    />
                                    <span>Is this a free trial?</span>
                                </label>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>
                                    {form.isTrial ? 'Trial End Date' : 'Next Billing Date'}
                                </label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={form.isTrial ? form.trialEndDate : form.nextBillingDate}
                                    onChange={e => setForm({ ...form, [form.isTrial ? 'trialEndDate' : 'nextBillingDate']: e.target.value })}
                                />
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.label}>Description (Optional)</label>
                                <input
                                    className={styles.input}
                                    placeholder="e.g. Premium Plan"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                />
                            </div>
                            <button type="submit" className={styles.submitBtn}>
                                <Plus size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
                            </button>
                        </form>
                    </section>
                </div>

                <section>
                    <h2 className={styles.sectionTitle}>
                        <Zap size={24} color="var(--primary)" />
                        Active Subscriptions
                    </h2>

                    <div className={styles.subGrid}>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className={styles.subCard} style={{ pointerEvents: 'none' }}>
                                    <div className={styles.subIcon} style={{ backgroundColor: '#333' }} />
                                    <div className={styles.subInfo}>
                                        <div style={{ width: 100, height: 16, background: '#333', borderRadius: 4, marginBottom: 8 }} />
                                        <div style={{ width: 140, height: 14, background: '#333', borderRadius: 4 }} />
                                    </div>
                                    <div className={styles.subRight}>
                                        <div style={{ width: 60, height: 20, background: '#333', borderRadius: 4, marginBottom: 8 }} />
                                        <div style={{ width: 40, height: 14, background: '#333', borderRadius: 4 }} />
                                    </div>
                                </div>
                            ))
                        ) : subscriptions.length === 0 ? (
                            <div style={{ color: 'var(--text-secondary)', gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', background: 'var(--surface)', borderRadius: 24, border: '1px dashed var(--border)' }}>
                                No active subscriptions found. Add one above to get started.
                            </div>
                        ) : (
                            subscriptions.map(sub => {
                                const daysRemaining = calculateDaysRemaining(sub.nextBillingDate);
                                return (
                                    <div key={sub.id} className={`${styles.subCard} ${sub.isTrial ? styles.trialCard : ''}`}>
                                        <div className={styles.subIcon} style={{ backgroundColor: sub.isTrial ? '#f59e0b' : sub.color }}>
                                            {sub.isTrial ? <Clock size={24} /> : sub.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className={styles.subInfo}>
                                            <div className={styles.subName}>
                                                {sub.name}
                                                {sub.isTrial && <span className={styles.trialBadge}>Trial</span>}
                                            </div>
                                            <div className={styles.subMeta}>
                                                <span className={styles.categoryTag}>{sub.category}</span>
                                                <span>•</span>
                                                <span style={{ textTransform: 'capitalize' }}>{sub.frequency}</span>
                                            </div>
                                            {sub.description && (
                                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                                    {sub.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.subRight}>
                                            <div className={styles.subCost}>
                                                {sub.isTrial ? 'Free' : `${symbol}${(sub.cost || 0).toLocaleString()}`}
                                            </div>
                                            <div className={`${styles.daysLeft} ${sub.isTrial ? styles.daysTrial : (daysRemaining <= 7 ? styles.daysCritical : styles.daysNormal)}`}>
                                                {sub.isTrial
                                                    ? `Ends in ${calculateDaysRemaining(sub.trialEndDate!)} days`
                                                    : (daysRemaining === 0 ? 'Due Today' : daysRemaining < 0 ? `Past due by ${Math.abs(daysRemaining)}d` : `${daysRemaining} days left`)}
                                            </div>
                                        </div>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.editBtn}
                                                onClick={() => handleEditInitiate(sub)}
                                                title="Edit Subscription"
                                            >
                                                <Zap size={18} />
                                            </button>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => deleteSubscription(sub.id)}
                                                title="Delete Subscription"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
