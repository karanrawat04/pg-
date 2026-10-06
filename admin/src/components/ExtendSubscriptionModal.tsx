import React, { useState } from 'react';
import { Organization, SubscriptionPlan } from '../types';
import { adminApi } from '../api/client';
import { X, Calendar, CreditCard, Sparkles, CheckCircle } from 'lucide-react';

interface ExtendSubscriptionModalProps {
  organization: Organization;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ExtendSubscriptionModal: React.FC<ExtendSubscriptionModalProps> = ({
  organization,
  plans,
  onClose,
  onSuccess,
}) => {
  const currentSub = organization.currentSubscription;
  const [selectedPlanId, setSelectedPlanId] = useState(currentSub?.planId || plans[0]?.id || '');
  const [status, setStatus] = useState(currentSub?.status || 'ACTIVE');
  const [extendMonths, setExtendMonths] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminApi.updateOrganizationSubscription(organization.id, {
        planId: selectedPlanId,
        status,
        extendMonths,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Manage Subscription: {organization.name}
            </h3>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
              Adjust SaaS tier and validity duration
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              color: '#fb7185',
              fontSize: 12.5,
            }}>
              {error}
            </div>
          )}

          {/* Current Expiry Info */}
          {currentSub && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: '12px 14px',
              fontSize: 12.5,
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>Current Expiry Date:</span>
              <strong style={{ color: '#818cf8' }}>
                {new Date(currentSub.endDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </div>
          )}

          {/* Select SaaS Plan */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
              Select SaaS Plan Tier
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="custom-input"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id} style={{ background: '#0f172a', color: '#fff' }}>
                  {p.name} (₹{Number(p.priceMonthly).toLocaleString('en-IN')}/mo) — Max {p.maxBeds} beds
                </option>
              ))}
            </select>
          </div>

          {/* Subscription Status */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
              Subscription Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="custom-input"
            >
              <option value="ACTIVE" style={{ background: '#0f172a', color: '#fff' }}>ACTIVE (Paid Subscriber)</option>
              <option value="TRIAL" style={{ background: '#0f172a', color: '#fff' }}>TRIAL (Free Evaluation)</option>
              <option value="PAST_DUE" style={{ background: '#0f172a', color: '#fff' }}>PAST_DUE (Payment Grace)</option>
              <option value="CANCELLED" style={{ background: '#0f172a', color: '#fff' }}>CANCELLED (Churned)</option>
            </select>
          </div>

          {/* Extend Validity */}
          <div>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#cbd5e1', marginBottom: 8 }}>
              Add Validity Months
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[1, 3, 6, 12].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setExtendMonths(months)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: extendMonths === months ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                    background: extendMonths === months ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: extendMonths === months ? '#a5b4fc' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  +{months} Mo{months > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : 'Update & Extend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
