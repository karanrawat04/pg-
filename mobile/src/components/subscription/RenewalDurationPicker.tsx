import React from 'react';
import { Zap, X } from 'lucide-react';

interface RenewalDurationPickerProps {
  currentPlanName?: string;
  renewMonths: number;
  onSelectMonths: (months: number) => void;
  onConfirmRenew: () => void;
  onCancel: () => void;
  loading: boolean;
}

export const RenewalDurationPicker: React.FC<RenewalDurationPickerProps> = ({
  currentPlanName,
  renewMonths,
  onSelectMonths,
  onConfirmRenew,
  onCancel,
  loading,
}) => {
  return (
    <div
      style={{
        flexShrink: 0,
        background: 'rgba(99, 102, 241, 0.1)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        borderRadius: 18,
        padding: '16px 18px',
        animation: 'fadeIn 0.2s ease-out forwards',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={14} color="#818cf8" />
          <span>Extend {currentPlanName || 'Current'} Plan Validity</span>
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

      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>
        Select the validity duration you wish to add to your account:
      </p>

      {/* Month Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {[1, 3, 6, 12].map((m) => {
          const isSelected = renewMonths === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSelectMonths(m)}
              style={{
                padding: '9px 4px',
                borderRadius: 12,
                border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#a5b4fc' : '#cbd5e1',
                fontSize: 12.5,
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              +{m} Mo{m > 1 ? 's' : ''}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onConfirmRenew}
        disabled={loading}
        className="btn-primary"
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '11px',
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {loading ? 'Opening Checkout...' : `Proceed to Renewal Checkout (+${renewMonths} Month${renewMonths > 1 ? 's' : ''})`}
      </button>
    </div>
  );
};
