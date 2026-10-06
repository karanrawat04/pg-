import React from 'react';
import { SubscriptionPlan } from '../../types';

interface SubscriptionOrderSummaryProps {
  plan: SubscriptionPlan;
  extendMonths: number;
  checkoutData: {
    monthlyPrice: number;
    baseAmount: number;
    discountPct: number;
    discountAmount: number;
    subtotal: number;
    gstAmount: number;
    totalAmount: number;
  };
}

export const SubscriptionOrderSummary: React.FC<SubscriptionOrderSummaryProps> = ({
  plan,
  extendMonths,
  checkoutData,
}) => {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 16,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
          {plan.name} Plan ({extendMonths} Month{extendMonths > 1 ? 's' : ''})
        </span>
        <span
          style={{
            background: 'rgba(99, 102, 241, 0.18)',
            color: '#a5b4fc',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 8,
          }}
        >
          🏢 Up to {plan.maxProperties} PG • 🛏️ {plan.maxBeds} Beds
        </span>
      </div>

      <div style={{ fontSize: 12, color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Base Price (₹{checkoutData.monthlyPrice} × {extendMonths}m):</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>₹{checkoutData.baseAmount.toLocaleString()}</span>
        </div>

        {checkoutData.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
            <span>Tenure Discount ({checkoutData.discountPct}% off):</span>
            <span style={{ fontWeight: 700 }}>-₹{checkoutData.discountAmount.toLocaleString()}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Taxable Subtotal:</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>₹{checkoutData.subtotal.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Applicable GST (18%):</span>
          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>+₹{checkoutData.gstAmount.toLocaleString()}</span>
        </div>

        <div
          style={{
            borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
            paddingTop: 8,
            marginTop: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>Total Payable:</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#38bdf8' }}>
            ₹{checkoutData.totalAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
