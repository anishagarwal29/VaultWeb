"use client";
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import styles from './Settings.module.css';

export default function SettingsPage() {
    const handleReset = () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const handleExport = () => {
        const data = {
            transactions: localStorage.getItem('vault_transactions'),
            accounts: localStorage.getItem('vault_accounts'),
            subscriptions: localStorage.getItem('vault_subscriptions'),
            budgets: localStorage.getItem('vault_budgets')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vault-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

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
                        <button className={styles.btn} onClick={() => alert('Only USD is supported in this prototype.')}>USD ($)</button>
                    </div>
                    <div className={styles.row}>
                        <span className={styles.rowLabel}>Theme</span>
                        <button className={styles.btn} onClick={() => alert('Dark Mode is the default and only theme.')}>Dark Mode</button>
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
                        <button className={styles.dangerBtn} onClick={handleReset}>Clear All Data</button>
                    </div>
                </div>

                <div style={{ color: '#666', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                    Vault Web v1.0.0
                </div>
            </main>
        </div>
    );
}
