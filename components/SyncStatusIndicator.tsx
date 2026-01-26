"use client";
import { useVault } from "@/context/VaultContext";
import { Check, Loader2, CloudOff } from "lucide-react";

export function SyncStatusIndicator() {
    const { syncStatus } = useVault();

    if (syncStatus === 'idle') return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '8px 16px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 9999,
        }}>
            {syncStatus === 'saving' && (
                <>
                    <Loader2 size={14} className="animate-spin" />
                    <span style={{ color: 'var(--text-secondary)' }}>Syncing...</span>
                </>
            )}
            {syncStatus === 'success' && (
                <>
                    <Check size={14} color="var(--success)" />
                    <span style={{ color: 'var(--success)' }}>Saved to Cloud</span>
                </>
            )}
            {syncStatus === 'error' && (
                <>
                    <CloudOff size={14} color="#ef4444" />
                    <span style={{ color: '#ef4444' }}>Sync Failed</span>
                </>
            )}
        </div>
    );
}
