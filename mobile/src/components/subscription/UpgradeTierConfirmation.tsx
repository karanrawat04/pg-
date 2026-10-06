import React from 'react';
import { SubscriptionPlan } from '../../types';
import { Sparkles, X } from 'lucide-react';

interface UpgradeTierConfirmationProps {
  targetPlan: SubscriptionPlan;
  upgradeCycle: 'MONTHLY' | 'YEARLY';
  onChangeCycle: (cycle: 'MONTHLY' | 'YEARLY') => void;
  onConfirmUpgrade: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const UpgradeTierConfirmation: React.FC<UpgradeTierConfirmationProps> = ({
  targetPlan,
  upgradeCycle,
  onChangeCycle,
  onConfirmUpgrade,
  onCancel,
  loading,
}) => {
  return (
    <div
      style={{
        flexShrink: 0,
        background: 'rgba(168, 85, 247, 0.12)',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: 18,
        padding: '16px 18px',
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={15} color="#c084fc" />
          <span>Upgrade to {targetPlan.name} Plan</span>
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <X size={14} />
          <span>Cancel</span>
        </button>
      </div>

      <p style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12 }}>
        Expand capacity up to <strong>{targetPlan.maxProperties} PG Buildings</strong> and <strong>{targetPlan.maxBeds} Beds</strong>.
      </p>

      {/* Monthly vs Annual Toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => onChangeCycle('MONTHLY')}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 12,
            border: upgradeCycle === 'MONTHLY' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
            background: upgradeCycle === 'MONTHLY' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.04)',
            color: upgradeCycle === 'MONTHLY' ? '#e9d5ff' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600 }}>Monthly Billing</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
            ₹{Number(targetPlan.priceMonthly).toLocaleString('en-IN')}/mo
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChangeCycle('YEARLY')}
          style={{
            flex: 1,
            padding: '10px 8px',
            borderRadius: 12,
            border: upgradeCycle === 'YEARLY' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
            background: upgradeCycle === 'YEARLY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            color: upgradeCycle === 'YEARLY' ? '#6ee7b7' : '#94a3b8',
            cursor: 'pointer',
            textAlign: 'center',
            position: 'relative',
            transition: 'all 0.15s ease',
          }}
        >
          <span style={{
            position: 'absolute',
            top: -8,
            right: 8,
            background: '#10b981',
            color: '#052e16',
            fontSize: 9,
            fontWeight: 800,
            padding: '1px 6px',
            borderRadius: 6,
          }}>
            SAVE 16%
          </span>
          <div style={{ fontSize: 11, fontWeight: 600 }}>Annual Billing</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
            ₹{Number(targetPlan.priceYearly).toLocaleString('en-IN')}/yr
          </div>
        </button>
      </div>

      <button
        type="button"
        onClick={onConfirmUpgrade}
        disabled={loading}
        style={{
          width: '100%',
          background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
          border: 'none',
          color: '#fff',
          fontSize: 13,
          fontWeight: 800,
          padding: '11px',
          borderRadius: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)',
        }}
      >
        {loading ? 'Opening Checkout...' : (
          <>
            <Sparkles size={15} />
            <span>Proceed to Upgrade Checkout ({targetPlan.name})</span>
          </>
        )}
      </button>
    </div>
  );
};
