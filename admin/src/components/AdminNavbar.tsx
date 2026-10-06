import React from 'react';
import { RefreshCw, Server, ShieldCheck } from 'lucide-react';

interface AdminNavbarProps {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <header className="admin-topbar">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px', margin: 0 }}>
          {title}
        </h1>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
          {subtitle}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '5px 10px',
          borderRadius: 20,
          fontSize: 11.5,
          color: '#34d399',
          fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          <span>Core API: 5050 Online</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            title="Refresh Platform Data"
          >
            <RefreshCw size={13} className={isRefreshing ? 'spin-animation' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        )}
      </div>
    </header>
  );
};
