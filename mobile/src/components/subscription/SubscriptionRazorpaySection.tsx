import React, { useState } from 'react';
import { CreditCard, ShieldCheck, Lock, Building2 } from 'lucide-react';
import { api } from '../../api/client';
import { loadRazorpayScript } from '../../lib/razorpayClient';

interface SubscriptionRazorpaySectionProps {
  planId: string;
  planName: string;
  extendMonths: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  totalAmount: number;
  onSuccess: (receipt: any) => void;
  onError: (msg: string) => void;
}

export const SubscriptionRazorpaySection: React.FC<SubscriptionRazorpaySectionProps> = ({
  planId,
  planName,
  extendMonths,
  billingCycle,
  totalAmount,
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLaunchRazorpay = async () => {
    try {
      setLoading(true);
      setStatusMessage('Loading Razorpay secure gateway...');

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay payment gateway failed to load. Please check your connection.');
      }

      setStatusMessage('Creating subscription order...');
      const orderRes = await api.createRazorpaySubscriptionOrder({
        planId,
        extendMonths,
        billingCycle,
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize Razorpay subscription order.');
      }

      const orderData = orderRes.data;
      setStatusMessage('Opening Razorpay checkout...');

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'PG Flow SaaS Platform',
        description: `${planName} Subscription (${extendMonths} Month${extendMonths > 1 ? 's' : ''})`,
        order_id: orderData.orderId,
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setStatusMessage(null);
          },
        },
        handler: async (response: any) => {
          try {
            setStatusMessage('Verifying subscription payment with server...');
            const verifyRes = await api.verifyRazorpaySubscriptionPayment({
              planId,
              extendMonths,
              billingCycle,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success && verifyRes.data?.receipt) {
              onSuccess({
                ...verifyRes.data.receipt,
                totalAmount,
              });
            } else {
              onError(verifyRes.message || 'Subscription verification failed on server.');
            }
          } catch (vErr: any) {
            onError(vErr.message || 'Error confirming subscription payment.');
          } finally {
            setLoading(false);
            setStatusMessage(null);
          }
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);

      razorpayInstance.on('payment.failed', (failResp: any) => {
        console.error('Razorpay payment failed:', failResp);
        onError(failResp.error?.description || 'Payment was declined or cancelled.');
        setLoading(false);
        setStatusMessage(null);
      });

      razorpayInstance.open();
    } catch (err: any) {
      console.error('Razorpay subscription error:', err);
      onError(err.message || 'Unable to open payment gateway.');
      setLoading(false);
      setStatusMessage(null);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        padding: '18px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <CreditCard size={18} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc' }}>
              Razorpay Secure Checkout
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Corporate & Personal Cards, Netbanking, UPI
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#34d399', fontSize: 11, fontWeight: 700 }}>
          <Lock size={12} /> 256-bit SSL
        </div>
      </div>

      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: 12,
          padding: '14px',
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 10 }}>
          Subscribe to <strong>{planName}</strong> plan instantly. Instant tax invoice receipt generated upon completion.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#38bdf8' }}>✓</span> Corporate & Retail Cards
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#38bdf8' }}>✓</span> Netbanking (50+ Banks)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#38bdf8' }}>✓</span> UPI Apps (All VPA handlers)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#38bdf8' }}>✓</span> Instant Tax Invoice & GST Credit
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 10,
            padding: '10px 12px',
            fontSize: 12,
            color: '#a5b4fc',
            marginBottom: 14,
            textAlign: 'center',
          }}
        >
          {statusMessage}
        </div>
      )}

      <button
        type="button"
        onClick={handleLaunchRazorpay}
        disabled={loading}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
        }}
      >
        <ShieldCheck size={18} />
        {loading ? 'Connecting to Gateway...' : `Pay ₹${totalAmount.toLocaleString()} with Razorpay`}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 10.5, color: '#64748b' }}>
        <ShieldCheck size={13} color="#34d399" /> RBI Regulated & PCI-DSS Level 1 Certified
      </div>
    </div>
  );
};
