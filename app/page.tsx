"use client";
import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { BalanceCard } from "@/components/BalanceCard";
import { SpendingChart } from "@/components/SpendingChart";
import { Bell, Search, ShoppingBag, Coffee, Car, Music } from "lucide-react";
import styles from "./HomePage.module.css";
import { useVault } from "@/context/VaultContext";
import { getCurrencySymbol, formatDate } from "@/types";
import { useExchangeRates } from "@/hooks/useExchangeRates";

const Home = () => {
  const { transactions, accounts, currency } = useVault();
  const [currentDate, setCurrentDate] = React.useState('');
  const currencySymbol = getCurrencySymbol(currency);

  // Exchange Rates
  const { rates, isLoading: ratesLoading } = useExchangeRates(currency);

  const getNormalizedAmount = (amount: number, accountId?: string) => {
    // If we are loading rates, just return amount (or 0?) to avoid flash of wrong numbers?
    // Better to return amount as fallback.
    if (!accountId) return amount;
    const account = accounts.find(a => a.id === accountId);
    if (!account) return amount;

    if (account.currency === currency) return amount;
    const rate = rates[account.currency];
    return rate ? amount / rate : amount;
  };

  const getNormalizedAccountBalance = (account: { id: string, balance: number, currency: string }) => {
    if (account.currency === currency) return account.balance;
    const rate = rates[account.currency];
    return rate ? account.balance / rate : account.balance;
  }

  React.useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
  }, []);

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + getNormalizedAccountBalance(acc), 0);

  const income = transactions
    .filter((t: { type: string }) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + getNormalizedAmount(t.amount, t.accountId), 0);

  const expense = transactions
    .filter((t: { type: string }) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + getNormalizedAmount(t.amount, t.accountId), 0);

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.greeting}>Good Afternoon, Anish</h1>
            <p className={styles.date}>{currentDate}</p>
          </div>
          <div className={styles.actions}>
            <div className={styles.searchBar}>
              <Search size={18} color="#666" />
              <input type="text" placeholder="Search transactions..." className={styles.searchInput} />
            </div>
            <button className={styles.iconBtn}>
              <Bell size={20} />
              <div className={styles.badge} />
            </button>
            <div className={styles.avatar}>A</div>
          </div>
        </header>

        <div className={styles.grid}>
          <div className={styles.leftCol}>
            <div style={{ background: 'var(--surface)', padding: 32, borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
              <div style={{ opacity: 0.7, fontSize: 14, marginBottom: 8 }}>TOTAL BALANCE</div>
              <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 24 }}>{currencySymbol}{totalBalance.toLocaleString()}</div>
              <div style={{ display: 'flex', gap: 32 }}>
                <div>
                  <div style={{ opacity: 0.7, fontSize: 13, marginBottom: 4 }}>Income</div>
                  <div style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ↗ {currencySymbol}{income.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ opacity: 0.7, fontSize: 13, marginBottom: 4 }}>Expenses</div>
                  <div style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ↘ {currencySymbol}{Math.abs(expense).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.chartSection}>
              <SpendingChart />
            </div>
          </div>

          <div className={styles.rightCol}>
            <div className={styles.recentTransactions}>
              <div className={styles.sectionHeader}>
                <h3>Recent Transactions</h3>
                <button className={styles.viewAll}>View All</button>
              </div>
              <div className={styles.transactionList}>
                {recentTransactions.length === 0 ? (
                  <div style={{ padding: 20, color: '#666', textAlign: 'center' }}>No recent transactions</div>
                ) : (
                  recentTransactions.map((t) => (
                    <div key={t.id} className={styles.transactionItem}>
                      <div className={styles.tIcon} style={{ color: t.type === 'income' ? 'var(--success)' : '#fff' }}>
                        <ShoppingBag size={20} />
                      </div>
                      <div className={styles.tInfo}>
                        <div className={styles.tName}>{t.merchant}</div>
                        <div className={styles.tDate}>{formatDate(t.date)}</div>
                      </div>
                      <div className={styles.tAmount} style={{ color: t.type === 'income' ? 'var(--success)' : '#fff' }}>
                        {t.type === 'income' ? '+' : '-'}{currencySymbol}{Math.abs(t.amount).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Home;
