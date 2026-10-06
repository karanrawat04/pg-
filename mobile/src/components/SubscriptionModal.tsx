import React, { useState, useEffect } from 'react';
import { OwnerSubscriptionDetails, SubscriptionPlan } from '../types';
import { api } from '../api/client';
import { CurrentPlanHeroCard } from './subscription/CurrentPlanHeroCard';
import { RenewalDurationPicker } from './subscription/RenewalDurationPicker';
import { UpgradeTierConfirmation } from './subscription/UpgradeTierConfirmation';
import { AvailablePlanCard } from './subscription/AvailablePlanCard';
import { SubscriptionCheckoutModal } from './subscription/SubscriptionCheckoutModal';
import { SubscriptionReceiptModal } from './subscription/SubscriptionReceiptModal';
import { Crown, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionUpdated,
}) => {
  const [subDetails, setSubDetails] = useState<OwnerSubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Renewal state
  const [renewMonths, setRenewMonths] = useState<number>(1);
  const [isRenewMode, setIsRenewMode] = useState<boolean>(false);

  // Upgrade state
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);
  const [upgradeCycle, setUpgradeCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  // Checkout & Receipt state
  const [checkoutParams, setCheckoutParams] = useState<{
    plan: SubscriptionPlan;
    extendMonths: number;
    billingCycle: 'MONTHLY' | 'YEARLY';
  } | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subData, plansData] = await Promise.all([
        api.getMySubscription(),
        api.getPlans(),
      ]);
      setSubDetails(subData);
      setPlans(plansData);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsRenewMode(false);
      setSelectedPlanForUpgrade(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  const handleOpenRenewCheckout = () => {
    const plan = subDetails?.plan || plans[0];
    if (plan) {
      setCheckoutParams({
        plan,
        extendMonths: renewMonths,
        billingCycle: 'MONTHLY',
      });
    }
  };

  const handleOpenUpgradeCheckout = () => {
    if (selectedPlanForUpgrade) {
      setCheckoutParams({
        plan: selectedPlanForUpgrade,
        extendMonths: upgradeCycle === 'YEARLY' ? 12 : 1,
        billingCycle: upgradeCycle,
      });
    }
  };

  const handleRenew = async () => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.renewSubscription(renewMonths);
      if (res.success) {
        setSuccessMsg(res.message || 'Subscription successfully renewed!');
        setIsRenewMode(false);
        await loadData();
        if (onSubscriptionUpdated) onSubscriptionUpdated();
      } else {
        setError(res.message || 'Failed to renew subscription.');
      }
    } catch (err: any) {
      setError(err.message || 'Renewal transaction failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlanForUpgrade) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.upgradeSubscription({
        planId: selectedPlanForUpgrade.id,
        billingCycle: upgradeCycle,
        extendMonths: upgradeCycle === 'YEARLY' ? 12 : 1,
      });
      if (res.success) {
        setSuccessMsg(res.message || `Upgraded to ${selectedPlanForUpgrade.name}!`);
        setSelectedPlanForUpgrade(null);
        await loadData();
        if (onSubscriptionUpdated) onSubscriptionUpdated();
      } else {
        setError(res.message || 'Failed to upgrade plan.');
      }
    } catch (err: any) {
      setError(err.message || 'Upgrade transaction failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1326',
          borderRadius: 24,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(99, 102, 241, 0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.7)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
            }}>
              <Crown size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                My SaaS Plan & Subscription
              </h2>
              <p style={{ fontSize: 11.5, color: '#94a3b8', margin: '2px 0 0' }}>
                Operational quota limits & plan renewals
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{
          padding: '18px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fb7185',
              fontSize: 12.5,
              flexShrink: 0,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#34d399',
              fontSize: 12.5,
              flexShrink: 0,
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#818cf8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <RefreshCw size={24} className="spin-animation" />
              <span style={{ fontSize: 13 }}>Loading subscription status...</span>
            </div>
          ) : (
            <>
              {/* Modular Subcomponent 1: Active Plan Hero Card */}
              <CurrentPlanHeroCard
                subDetails={subDetails}
                isRenewMode={isRenewMode}
                onToggleRenew={() => {
                  setIsRenewMode(!isRenewMode);
                  setSelectedPlanForUpgrade(null);
                }}
              />

              {/* Modular Subcomponent 2: Renewal Duration Picker Panel */}
              {isRenewMode && (
                <RenewalDurationPicker
                  currentPlanName={subDetails?.plan?.name}
                  renewMonths={renewMonths}
                  onSelectMonths={(m) => setRenewMonths(m)}
                  onConfirmRenew={handleOpenRenewCheckout}
                  onCancel={() => setIsRenewMode(false)}
                  loading={actionLoading}
                />
              )}

              {/* Modular Subcomponent 3: Upgrade Tier Confirmation Panel */}
              {selectedPlanForUpgrade && (
                <UpgradeTierConfirmation
                  targetPlan={selectedPlanForUpgrade}
                  upgradeCycle={upgradeCycle}
                  onChangeCycle={(cycle) => setUpgradeCycle(cycle)}
                  onConfirmUpgrade={handleOpenUpgradeCheckout}
                  onCancel={() => setSelectedPlanForUpgrade(null)}
                  loading={actionLoading}
                />
              )}

              {/* Modular Subcomponent 4: Available Plans Catalog */}
              <div style={{ flexShrink: 0, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#cbd5e1' }}>
                    Available SaaS Tiers & Features
                  </span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    Select a tier to upgrade
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plans.map((p) => (
                    <AvailablePlanCard
                      key={p.id}
                      plan={p}
                      isCurrentPlan={p.id === subDetails?.plan?.id}
                      onSelectUpgrade={(planToUpgrade) => {
                        setSelectedPlanForUpgrade(planToUpgrade);
                        setIsRenewMode(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SaaS Subscription Checkout Modal */}
      {checkoutParams && (
        <SubscriptionCheckoutModal
          isOpen={!!checkoutParams}
          onClose={() => setCheckoutParams(null)}
          plan={checkoutParams.plan}
          extendMonths={checkoutParams.extendMonths}
          billingCycle={checkoutParams.billingCycle}
          onSuccess={(receipt) => {
            setReceiptData(receipt);
            setCheckoutParams(null);
            setIsRenewMode(false);
            setSelectedPlanForUpgrade(null);
            loadData();
            if (onSubscriptionUpdated) onSubscriptionUpdated();
          }}
        />
      )}

      {/* Official Platform Tax Invoice / Receipt Modal */}
      <SubscriptionReceiptModal
        isOpen={!!receiptData}
        onClose={() => setReceiptData(null)}
        receiptData={receiptData}
      />
    </div>
  );
};
