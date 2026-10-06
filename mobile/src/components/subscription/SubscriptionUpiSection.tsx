import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Copy, Check, ShieldCheck } from 'lucide-react';

interface SubscriptionUpiSectionProps {
  upiIntentUrl?: string;
  platformVpa?: string;
  totalAmount: number;
}

export const SubscriptionUpiSection: React.FC<SubscriptionUpiSectionProps> = ({
  upiIntentUrl,
  platformVpa,
  totalAmount,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (upiIntentUrl) {
      QRCode.toDataURL(upiIntentUrl, {
        width: 220,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [upiIntentUrl]);

  const handleCopyVpa = () => {
    if (platformVpa) {
      navigator.clipboard.writeText(platformVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenUpiApp = () => {
    if (upiIntentUrl) {
      window.location.href = upiIntentUrl;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Dynamic QR Code Card */}
      <div
        style={{
          background: '#ffffff',
          padding: '14px',
          borderRadius: 16,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Scan UPI QR"
            style={{ width: 190, height: 190, display: 'block', borderRadius: 8 }}
          />
        ) : (
          <div style={{ width: 190, height: 190, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 12 }}>
            Generating Platform QR...
          </div>
        )}
        <div style={{ marginTop: 8, fontSize: 11.5, color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
          <QrCode size={14} color="#4f46e5" /> Direct Platform UPI (0% Fee)
        </div>
      </div>

      {/* Pay via UPI App Mobile Deep Link */}
      <button
        type="button"
        onClick={handleOpenUpiApp}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 12,
          fontSize: 13,
          fontWeight: 800,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <Smartphone size={15} /> Pay ₹{totalAmount.toLocaleString()} via UPI App
      </button>

      {/* Platform UPI VPA Copy Bar */}
      {platformVpa && (
        <div
          onClick={handleCopyVpa}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            marginBottom: 14,
            boxSizing: 'border-box',
          }}
        >
          <div>
            <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>Platform UPI VPA:</span>
            <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
              {platformVpa}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: copied ? '#34d399' : '#818cf8', fontSize: 11, fontWeight: 700 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </div>
        </div>
      )}

      {/* Direct Transfer Info Notice */}
      <div
        style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 12,
          padding: '12px 14px',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: '#38bdf8', fontSize: 12, fontWeight: 700 }}>
          <ShieldCheck size={15} /> SaaS Platform Settlement
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
          Your payment goes directly to the platform account. For automated instant plan activation, you can also use the <strong>Razorpay Checkout</strong> tab above.
        </p>
      </div>
    </div>
  );
};
