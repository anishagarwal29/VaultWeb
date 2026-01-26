"use client";
import { Sidebar } from '@/components/Sidebar';
import styles from './Analytics.module.css';
import { AnalyticsContent } from './AnalyticsContent';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AnalyticsPage() {
    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Analytics</h1>
                </div>
                <ErrorBoundary>
                    <AnalyticsContent />
                </ErrorBoundary>
            </main>
        </div>
    );
}
