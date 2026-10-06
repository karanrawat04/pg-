import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/client';
import {
  CreditCard,
  QrCode,
  ShieldCheck,
  Check,
  AlertCircle,
  Lock,
  Info,
  RefreshCw,
} from 'lucide-react';

export const PlatformPaymentSettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [isRazorpayEnabled, setIsRazorpayEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [razorpayKeySecret, setRazorpayKeySecret] = useState('');

  const [isUpiEnabled, setIsUpiEnabled] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPaymentConfig();
      if (data) {
        setIsRazorpayEnabled(Boolean(data.isRazorpayEnabled));
        setRazorpayKeyId(data.razorpayKeyId || '');
        setRazorpayKeySecret(data.razorpayKeySecret || '');
        setIsUpiEnabled(Boolean(data.isUpiEnabled));
        setUpiId(data.upiId || '');
        setUpiName(data.upiName || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load platform payment configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      if (isRazorpayEnabled && !razorpayKeyId.trim()) {
        throw new Error('Please enter the Platform Razorpay Key ID before enabling.');
      }
      if (isUpiEnabled && !upiId.trim()) {
        throw new Error('Please enter the Platform UPI ID / VPA before enabling.');
      }

      await adminApi.updatePaymentConfig({
        isRazorpayEnabled,
        razorpayKeyId: razorpayKeyId.trim(),
        razorpayKeySecret: razorpayKeySecret.trim(),
        isUpiEnabled,
        upiId: upiId.trim(),
        upiName: upiName.trim(),
      });

      setSuccessMsg('Platform payment gateway settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating payment settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', margin: 0 }}>
            SaaS Plan Payment Gateways
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>
            Configure Razorpay & Direct UPI channels used for PG Owner SaaS subscriptions
          </p>
        </div>

        <button
          onClick={loadConfig}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            padding: '8px 12px',
            color: '#cbd5e1',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#fca5a5',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            color: '#6ee7b7',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={16} /> {successMsg}
        </div>
      )}

      {/* Info Notice */}
      <div
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 14,
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 12.5,
          color: '#cbd5e1',
          lineHeight: 1.5,
        }}
      >
        <Info size={18} style={{ flexShrink: 0, marginTop: 1, color: '#818cf8' }} />
        <span>
          <strong>UI Visibility Rule:</strong> PG Owners will only see the payment options you activate below when upgrading or renewing their SaaS plan tiers. If a payment method is disabled or has missing keys, it will be automatically hidden from the subscription checkout modal.
        </span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 }}>
          Loading platform payment configuration...
        </div>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Section 1: Razorpay Checkout Configuration */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: isRazorpayEnabled ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '20px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(56, 189, 248, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#38bdf8',
                  }}
                >
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                    Platform Razorpay Gateway
                  </h3>
                  <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                    Automated credit/debit card, netbanking & UPI subscription checkout
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isRazorpayEnabled}
                  onChange={(e) => setIsRazorpayEnabled(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    background: isRazorpayEnabled ? '#0284c7' : 'rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: isRazorpayEnabled ? 25 : 3,
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </label>
            </div>

            {isRazorpayEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Razorpay Key ID *
                  </label>
                  <input
                    type="text"
                    placeholder="rzp_live_... or rzp_test_..."
                    value={razorpayKeyId}
                    onChange={(e) => setRazorpayKeyId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Razorpay Key Secret (Encrypted)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    value={razorpayKeySecret}
                    onChange={(e) => setRazorpayKeySecret(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Platform Direct UPI Configuration */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: isUpiEnabled ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: '20px',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'rgba(99, 102, 241, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#818cf8',
                  }}
                >
                  <QrCode size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                    Platform Direct UPI QR (0% Fee)
                  </h3>
                  <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
                    Direct settlement into platform corporate bank account
                  </span>
                </div>
              </div>

              {/* Toggle Switch */}
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isUpiEnabled}
                  onChange={(e) => setIsUpiEnabled(e.target.checked)}
                  style={{ display: 'none' }}
                />
                <div
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    background: isUpiEnabled ? '#4f46e5' : 'rgba(255, 255, 255, 0.15)',
                    position: 'relative',
                    transition: 'background 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 3,
                      left: isUpiEnabled ? 25 : 3,
                      transition: 'left 0.2s',
                    }}
                  />
                </div>
              </label>
            </div>

            {isUpiEnabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Platform UPI ID / VPA *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. pgflow.saas@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#cbd5e1', marginBottom: 6 }}>
                    Platform Payee Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. PG Flow SaaS Platform"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#fff',
                      fontSize: 13,
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: 12,
                padding: '12px 28px',
                color: '#fff',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ShieldCheck size={18} />
              {saving ? 'Saving Platform Settings...' : 'Save Payment Gateways'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
