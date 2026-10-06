import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../types';
import { api } from '../../api/client';
import { SubscriptionOrderSummary } from './SubscriptionOrderSummary';
import { SubscriptionUpiSection } from './SubscriptionUpiSection';
import { SubscriptionRazorpaySection } from './SubscriptionRazorpaySection';
import { X, Crown, QrCode, CreditCard, ShieldAlert } from 'lucide-react';

interface SubscriptionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: SubscriptionPlan;
  extendMonths: number;
  billingCycle?: 'MONTHLY' | 'YEARLY';
  onSuccess: (receipt: any) => void;
}

export const SubscriptionCheckoutModal: React.FC<SubscriptionCheckoutModalProps> = ({
  isOpen,
  onClose,
  plan,
  extendMonths,
  billingCycle = 'MONTHLY',
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'UPI' | 'CARD'>('CARD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutData, setCheckoutData] = useState<any>(null);
  const [platformConfig, setPlatformConfig] = useState<{
    isUpiConfigured: boolean;
    upiId: string | null;
    upiName: string | null;
    isRazorpayConfigured: boolean;
    razorpayKeyId: string | null;
    hasAnyConfigured: boolean;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(true);

      // Fetch platform payment configuration & order summary in parallel
      Promise.all([
        api.getSubscriptionPaymentConfig(),
        api.initiateSubscriptionCheckout({
          planId: plan.id,
          extendMonths,
          billingCycle,
        }),
      ])
        .then(([cfgRes, chkRes]) => {
          if (cfgRes.success && cfgRes.data) {
            setPlatformConfig(cfgRes.data);
            if (cfgRes.data.isRazorpayConfigured) {
              setActiveTab('CARD');
            } else if (cfgRes.data.isUpiConfigured) {
              setActiveTab('UPI');
            }
          }
          if (chkRes.success && chkRes.data) {
            setCheckoutData(chkRes.data);
          } else {
            setError(chkRes.message || 'Failed to initiate checkout.');
          }
        })
        .catch((err) => {
          setError(err.message || 'Network error initiating checkout.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setCheckoutData(null);
      setPlatformConfig(null);
    }
  }, [isOpen, plan, extendMonths, billingCycle]);

  if (!isOpen) return null;

  const handleRazorpaySuccess = (receipt: any) => {
    onSuccess(receipt);
  };

  const hasBoth = Boolean(platformConfig?.isUpiConfigured && platformConfig?.isRazorpayConfigured);

  return (
    <div className="bottom-sheet-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        {/* Header */}
        <div
          style={{
            padding: '10px 18px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Crown size={17} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>
                SaaS Subscription Checkout
              </h3>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {plan.name} Tier • +{extendMonths} Month{extendMonths > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: 8,
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px', maxHeight: '78vh', overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Pricing Breakdown Card */}
          {checkoutData && (
            <SubscriptionOrderSummary
              plan={plan}
              extendMonths={extendMonths}
              checkoutData={checkoutData}
            />
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 13 }}>
              Loading platform payment channels...
            </div>
          ) : !platformConfig?.hasAnyConfigured ? (
            /* NOT CONFIGURED ON PLATFORM */
            <div
              style={{
                padding: '24px 18px',
                textAlign: 'center',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShieldAlert size={36} color="#fbbf24" />
              <h4 style={{ margin: 0, fontSize: 15, color: '#f8fafc', fontWeight: 800 }}>
                Platform Payments Not Configured
              </h4>
              <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, maxWidth: 320 }}>
                Subscription payment gateways have not been enabled in the Super Admin console yet.
              </p>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                Please contact platform administration to activate your plan tier.
              </div>
            </div>
          ) : (
            <>
              {/* Payment Method Switcher Tabs: ONLY shown if BOTH are configured */}
              {hasBoth && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setActiveTab('CARD')}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      border: activeTab === 'CARD' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: activeTab === 'CARD' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: activeTab === 'CARD' ? '#ffffff' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <CreditCard size={15} color={activeTab === 'CARD' ? '#818cf8' : '#94a3b8'} />
                    <span>Razorpay Checkout</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('UPI')}
                    style={{
                      padding: '10px',
                      borderRadius: 12,
                      border: activeTab === 'UPI' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: activeTab === 'UPI' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: activeTab === 'UPI' ? '#ffffff' : '#94a3b8',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <QrCode size={15} color={activeTab === 'UPI' ? '#818cf8' : '#94a3b8'} />
                    <span>Direct UPI (0% Fee)</span>
                  </button>
                </div>
              )}

              {activeTab === 'CARD' && platformConfig.isRazorpayConfigured ? (
                <SubscriptionRazorpaySection
                  planId={plan.id}
                  planName={plan.name}
                  extendMonths={extendMonths}
                  billingCycle={billingCycle}
                  totalAmount={checkoutData?.totalAmount || 0}
                  onSuccess={handleRazorpaySuccess}
                  onError={(msg) => setError(msg)}
                />
              ) : platformConfig.isUpiConfigured ? (
                <SubscriptionUpiSection
                  upiIntentUrl={checkoutData?.upiIntentUrl}
                  platformVpa={platformConfig.upiId || checkoutData?.platformVpa}
                  totalAmount={checkoutData?.totalAmount || 0}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
