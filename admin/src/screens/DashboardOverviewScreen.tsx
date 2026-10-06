import React from 'react';
import { PlatformMetrics, Organization } from '../types';
import { MetricsCards } from '../components/MetricsCards';
import { ShieldCheck, ArrowRight, Building, Users, AlertTriangle } from 'lucide-react';

interface DashboardOverviewScreenProps {
  metrics: PlatformMetrics | null;
  organizations: Organization[];
  onNavigateTab: (tab: 'organizations' | 'plans') => void;
}

export const DashboardOverviewScreen: React.FC<DashboardOverviewScreenProps> = ({
  metrics,
  organizations,
  onNavigateTab,
}) => {
  if (!metrics) {
    return <div style={{ color: '#94a3b8', padding: '40px' }}>Loading platform metrics...</div>;
  }

  const suspendedCount = organizations.filter((o) => o.status === 'SUSPENDED').length;

  return (
    <div>
      {/* Platform KPIs */}
      <MetricsCards metrics={metrics} />

      {/* Highlights & Quick Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 32 }}>
        {/* Occupancy Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Fleet Bed Utilization
            </h3>
            <span className="badge badge-active">{metrics.occupancyRate}% Occupied</span>
          </div>

          {/* Progress Bar */}
          <div style={{ height: 10, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              width: `${Math.min(metrics.occupancyRate, 100)}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)',
              borderRadius: 5,
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#94a3b8' }}>
            <span>Occupied: <strong style={{ color: '#f8fafc' }}>{metrics.occupiedBeds}</strong> beds</span>
            <span>Vacant: <strong style={{ color: '#f8fafc' }}>{metrics.vacantBeds}</strong> beds</span>
            <span>Total: <strong style={{ color: '#f8fafc' }}>{metrics.totalBeds}</strong> beds</span>
          </div>
        </div>

        {/* Operational Status */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              SaaS Operational Governance
            </h3>
            {suspendedCount > 0 ? (
              <span className="badge badge-suspended">{suspendedCount} Suspended</span>
            ) : (
              <span className="badge badge-active">All Active</span>
            )}
          </div>

          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, marginBottom: 18 }}>
            Managing {metrics.totalOwners} PG owner accounts and {metrics.totalProperties} properties. Subscriptions renew monthly with email invoice dispatches.
          </p>

          <button
            onClick={() => onNavigateTab('organizations')}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>Manage All PG Organizations</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* Recent PG Owners Preview Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Recently Registered PG Operators
            </h3>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Latest onboarded coliving and PG businesses</span>
          </div>
          <button
            onClick={() => onNavigateTab('organizations')}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            View All ({organizations.length})
          </button>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>PG Organization</th>
              <th>Primary Contact</th>
              <th>Buildings</th>
              <th>Total Beds</th>
              <th>Subscription</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {organizations.slice(0, 5).map((org) => {
              const sub = org.currentSubscription;
              return (
                <tr key={org.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{org.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Joined {new Date(org.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ color: '#cbd5e1' }}>{org.primaryOwner?.fullName || 'PG Owner'}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{org.ownerEmail} • {org.ownerPhone}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{org.properties?.length || 0}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{org.totalBeds || 0}</span>
                  </td>
                  <td>
                    <span className="badge badge-primary">{sub?.plan?.name || 'Starter'}</span>
                  </td>
                  <td>
                    <span className={`badge ${org.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                      {org.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
