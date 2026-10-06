import React from 'react';
import { SubscriptionPlan } from '../../types';
import { Check, ArrowRight } from 'lucide-react';

interface AvailablePlanCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSelectUpgrade: (plan: SubscriptionPlan) => void;
}

export const AvailablePlanCard: React.FC<AvailablePlanCardProps> = ({
  plan,
  isCurrentPlan,
  onSelectUpgrade,
}) => {
  return (
    <div
      style={{
        flexShrink: 0,
        background: isCurrentPlan ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        border: isCurrentPlan ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 18,
        padding: '16px 18px',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Plan Header & Price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              {plan.name}
            </h4>
            {isCurrentPlan && (
              <span style={{
                background: 'rgba(99, 102, 241, 0.25)',
                color: '#a5b4fc',
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Current
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0', lineHeight: 1.4 }}>
            {plan.description}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#f8fafc' }}>
            ₹{Number(plan.priceMonthly).toLocaleString('en-IN')}
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>/mo</span>
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
            ₹{Number(plan.priceYearly).toLocaleString('en-IN')}/yr
          </div>
        </div>
      </div>

      {/* Quota Highlights Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'rgba(0, 0, 0, 0.25)',
        padding: '8px 12px',
        borderRadius: 10,
        fontSize: 11.5,
        color: '#cbd5e1',
        marginBottom: 12,
      }}>
        <span>🏢 Up to <strong>{plan.maxProperties} Buildings</strong></span>
        <span style={{ color: '#475569' }}>•</span>
        <span>🛏️ Up to <strong>{plan.maxBeds} Beds</strong></span>
      </div>

      {/* Features List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
        {plan.features?.map((feature, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#94a3b8' }}>
            <Check size={13} color="#10b981" style={{ flexShrink: 0 }} />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      {/* Upgrade Action Button (shown only for other plans) */}
      {!isCurrentPlan && (
        <button
          type="button"
          onClick={() => onSelectUpgrade(plan)}
          style={{
            width: '100%',
            padding: '9px 14px',
            borderRadius: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            color: '#f8fafc',
            fontSize: 12.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            transition: 'all 0.15s ease',
          }}
        >
          <span>Upgrade to {plan.name}</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
};
