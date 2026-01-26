"use client";
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/Sidebar';
import styles from './Analytics.module.css';

// Dynamically import the content component with no SSR to prevent hydration mismatch with Recharts
const AnalyticsContent = dynamic(
    () => import('./AnalyticsContent').then((mod) => mod.AnalyticsContent),
    {
        ssr: false,
        loading: () => (
            <div className={styles.grid}>
                <div className={styles.card} style={{ pointerEvents: 'none', minHeight: 400 }}>
                    <div className={styles.cardHeader}>
                        <div style={{ width: 150, height: 24, background: '#333', borderRadius: 6 }} />
                    </div>
                </div>
                <div className={styles.card} style={{ pointerEvents: 'none', minHeight: 400 }} />
            </div>
        )
    }
);

export default function AnalyticsPage() {
    return (
        <div className={styles.container}>
            <Sidebar />
            <main className={styles.main}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Analytics</h1>
                </div>
                <AnalyticsContent />
            </main>
        </div>
    );
}
