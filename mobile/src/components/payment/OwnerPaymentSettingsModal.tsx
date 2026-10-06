import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  Check,
  AlertCircle,
  Lock,
  Building2,
  Info,
} from 'lucide-react';

interface OwnerPaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const OwnerPaymentSettingsModal: React.FC<OwnerPaymentSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
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

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessMsg(null);
      setLoading(true);

      api.getOwnerPaymentConfig()
        .then((res) => {
          if (res.success && res.data) {
            setIsRazorpayEnabled(Boolean(res.data.isRazorpayEnabled));
            setRazorpayKeyId(res.data.razorpayKeyId || '');
            setRazorpayKeySecret(res.data.razorpayKeySecret || '');
            setIsUpiEnabled(Boolean(res.data.isUpiEnabled));
            setUpiId(res.data.upiId || '');
            setUpiName(res.data.upiName || '');
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load payment settings.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      // Validation
      if (isRazorpayEnabled && !razorpayKeyId.trim()) {
        throw new Error('Please provide your Razorpay Key ID to enable Razorpay checkout.');
      }
      if (isUpiEnabled && !upiId.trim()) {
        throw new Error('Please provide your UPI ID / VPA to enable Direct UPI QR payment.');
      }

      const res = await api.updateOwnerPaymentConfig({
        isRazorpayEnabled,
        razorpayKeyId: razorpayKeyId.trim(),
        razorpayKeySecret: razorpayKeySecret.trim(),
        isUpiEnabled,
        upiId: upiId.trim(),
        upiName: upiName.trim(),
      });

      if (res.success) {
        setSuccessMsg('Payment gateway settings saved successfully!');
        if (onSaved) onSaved();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message || 'Failed to save settings.');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving payment settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bottom-sheet-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        {/* Modal Header */}
        <div
          style={{
            padding: '12px 20px 16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <CreditCard size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: '#f8fafc', fontWeight: 800 }}>
                Tenant Payment Settings
              </h3>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                Configure payment channels visible to residents
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

        {/* Modal Body */}
        <div style={{ padding: '18px 20px', maxHeight: '76vh', overflowY: 'auto' }}>
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

          {successMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 12,
                padding: '10px 14px',
                color: '#6ee7b7',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Check size={16} /> {successMsg}
            </div>
          )}

          {/* Visibility Notice */}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              fontSize: 11.5,
              color: '#cbd5e1',
              lineHeight: 1.5,
            }}
          >
            <Info size={15} style={{ flexShrink: 0, marginTop: 2, color: '#818cf8' }} />
            <span>
              Residents will <strong>only</strong> see the payment methods you turn on and configure below. If a method is not configured, it is hidden from the tenant's payment screen.
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 13 }}>
              Loading payment configuration...
            </div>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Card 1: Direct NPCI UPI Configuration */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: isUpiEnabled ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#818cf8',
                      }}
                    >
                      <QrCode size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f8fafc' }}>
                        Direct NPCI UPI QR (0% Fee)
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                        Settles directly to your bank account with no commission
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isUpiEnabled}
                      onChange={(e) => setIsUpiEnabled(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        background: isUpiEnabled ? '#4f46e5' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: isUpiEnabled ? 21 : 3,
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </label>
                </div>

                {isUpiEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                        Your UPI ID / VPA *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@okhdfcbank or business@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="custom-input"
                        style={{ fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                        Payee Display Name (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sunrise Boys PG"
                        value={upiName}
                        onChange={(e) => setUpiName(e.target.value)}
                        className="custom-input"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Card 2: Razorpay Gateway Configuration */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: isRazorpayEnabled ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '16px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(56, 189, 248, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#38bdf8',
                      }}
                    >
                      <CreditCard size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#f8fafc' }}>
                        Razorpay Payment Gateway
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
                        Cards, Netbanking, UPI, Wallets with automated verification
                      </div>
                    </div>
                  </div>

                  {/* Toggle */}
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isRazorpayEnabled}
                      onChange={(e) => setIsRazorpayEnabled(e.target.checked)}
                      style={{ display: 'none' }}
                    />
                    <div
                      style={{
                        width: 42,
                        height: 24,
                        borderRadius: 12,
                        background: isRazorpayEnabled ? '#0284c7' : 'rgba(255, 255, 255, 0.15)',
                        position: 'relative',
                        transition: 'background 0.2s',
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 3,
                          left: isRazorpayEnabled ? 21 : 3,
                          transition: 'left 0.2s',
                        }}
                      />
                    </div>
                  </label>
                </div>

                {isRazorpayEnabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                        Razorpay Key ID *
                      </label>
                      <input
                        type="text"
                        placeholder="rzp_live_... or rzp_test_..."
                        value={razorpayKeyId}
                        onChange={(e) => setRazorpayKeyId(e.target.value)}
                        className="custom-input"
                        style={{ fontSize: 13, fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>
                        Razorpay Key Secret (Encrypted)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••••••••••••••••••"
                        value={razorpayKeySecret}
                        onChange={(e) => setRazorpayKeySecret(e.target.value)}
                        className="custom-input"
                        style={{ fontSize: 13, fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <ShieldCheck size={18} />
                {saving ? 'Saving Payment Settings...' : 'Save Payment Configuration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
