"use client";
import React from 'react';
import { Home, Wallet, PieChart, Layers, Settings, LogOut, Command, CreditCard, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: CreditCard, label: 'Accounts', href: '/accounts' },
    { icon: Wallet, label: 'Transactions', href: '/transactions' },
    { icon: Layers, label: 'Subscriptions', href: '/subscriptions' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics' },
    { icon: PieChart, label: 'Budgets', href: '/budgets' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoContainer}>
                <div className={styles.logoIcon}>
                    <Command size={20} className={styles.logoSvg} />
                </div>
                <span className={styles.appName}>Vault</span>
            </div>

            <nav className={styles.nav}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <Icon size={20} className={styles.icon} />
                            <span>{item.label}</span>
                            {isActive && (
                                <div className={styles.activeIndicator} />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <button className={styles.logoutBtn}>
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
