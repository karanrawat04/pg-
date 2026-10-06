import React, { useState } from 'react';
import { Organization, SubscriptionPlan } from '../types';
import { adminApi } from '../api/client';
import { ExtendSubscriptionModal } from '../components/ExtendSubscriptionModal';
import { Search, Building, UserCheck, UserX, CreditCard, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

interface OrganizationsScreenProps {
  organizations: Organization[];
  plans: SubscriptionPlan[];
  onRefresh: () => void;
}

export const OrganizationsScreen: React.FC<OrganizationsScreenProps> = ({
  organizations,
  plans,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedOrgForSub, setSelectedOrgForSub] = useState<Organization | null>(null);
  const [processingOrgId, setProcessingOrgId] = useState<string | null>(null);

  const filteredOrgs = organizations.filter((org) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.ownerEmail.toLowerCase().includes(q) ||
      org.ownerPhone.includes(q) ||
      (org.primaryOwner?.fullName || '').toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = async (org: Organization) => {
    const nextStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMessage = nextStatus === 'SUSPENDED'
      ? `Are you sure you want to SUSPEND "${org.name}"? The PG owner and their staff will be blocked from logging in immediately.`
      : `Reactivate "${org.name}" account? The owner will regain access to their PG dashboard.`;

    if (!window.confirm(confirmMessage)) return;

    setProcessingOrgId(org.id);
    try {
      await adminApi.updateOrganizationStatus(org.id, nextStatus);
      onRefresh();
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`);
    } finally {
      setProcessingOrgId(null);
    }
  };

  return (
    <div>
      {/* Header & Search Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', width: 340, maxWidth: '100%' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by PG name, owner, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="custom-input"
            style={{ paddingLeft: 40 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#94a3b8' }}>
            Showing <strong>{filteredOrgs.length}</strong> of <strong>{organizations.length}</strong> PG Owners
          </span>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>PG Business</th>
                <th>Owner Contact</th>
                <th>Properties</th>
                <th>Bed Utilization</th>
                <th>Subscription Tier</th>
                <th>Account Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No PG organizations found matching "{search}"
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => {
                  const sub = org.currentSubscription;
                  const isProcessing = processingOrgId === org.id;

                  return (
                    <tr key={org.id}>
                      {/* Business */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#818cf8',
                          }}>
                            <Building2 size={18} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>
                              {org.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              ID: {org.id.slice(0, 8)}... • GST: {org.gstNumber || 'Unregistered'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td>
                        <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                          {org.primaryOwner?.fullName || 'Business Owner'}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {org.ownerEmail}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          +91 {org.ownerPhone}
                        </div>
                      </td>

                      {/* Properties */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {org.properties?.length || 0} PG Buildings
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            {org.properties?.map((p) => p.name).slice(0, 2).join(', ')}
                            {(org.properties?.length || 0) > 2 ? '...' : ''}
                          </span>
                        </div>
                      </td>

                      {/* Beds */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontWeight: 700, color: '#f8fafc' }}>
                            {org.occupiedBeds || 0} / {org.totalBeds || 0} Beds
                          </span>
                          <span style={{ fontSize: 11, color: org.totalBeds > 0 && org.occupiedBeds / org.totalBeds > 0.8 ? '#10b981' : '#94a3b8' }}>
                            {org.totalBeds > 0 ? Math.round((org.occupiedBeds / org.totalBeds) * 100) : 0}% Occupancy
                          </span>
                        </div>
                      </td>

                      {/* Subscription */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div>
                            <span className="badge badge-primary">
                              {sub?.plan?.name || 'Growth'}
                            </span>
                          </div>
                          <span style={{ fontSize: 11, color: '#64748b' }}>
                            {sub?.endDate ? `Valid to ${new Date(sub.endDate).toLocaleDateString()}` : 'No expiry'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`badge ${org.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'}`}>
                          {org.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          {/* Manage / Extend Subscription */}
                          <button
                            onClick={() => setSelectedOrgForSub(org)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: 12 }}
                            title="Manage Plan & Validity"
                          >
                            <CreditCard size={13} color="#818cf8" />
                            <span>Plan</span>
                          </button>

                          {/* Suspend / Reactivate Button */}
                          <button
                            onClick={() => handleToggleStatus(org)}
                            disabled={isProcessing}
                            className={org.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}
                            title={org.status === 'ACTIVE' ? 'Suspend Owner Account' : 'Reactivate Owner Account'}
                          >
                            {org.status === 'ACTIVE' ? (
                              <>
                                <UserX size={13} />
                                <span>Suspend</span>
                              </>
                            ) : (
                              <>
                                <UserCheck size={13} />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Extension Modal */}
      {selectedOrgForSub && (
        <ExtendSubscriptionModal
          organization={selectedOrgForSub}
          plans={plans}
          onClose={() => setSelectedOrgForSub(null)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
};
