import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, Copy, Check, Info, ShieldCheck, Building2 } from 'lucide-react';

interface UpiQrPaySectionProps {
  upiIntentUrl: string;
  ownerVpa?: string;
  ownerName?: string;
  amount: number;
  merchantTxnId: string;
}

export const UpiQrPaySection: React.FC<UpiQrPaySectionProps> = ({
  upiIntentUrl,
  ownerVpa,
  ownerName,
  amount,
  merchantTxnId,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (upiIntentUrl) {
      QRCode.toDataURL(upiIntentUrl, {
        width: 230,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Error generating QR:', err));
    }
  }, [upiIntentUrl]);

  const handleCopyVpa = () => {
    if (ownerVpa) {
      navigator.clipboard.writeText(ownerVpa);
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
            alt="Scan UPI QR Code"
            style={{ width: 200, height: 200, display: 'block', borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 200,
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontSize: 12,
            }}
          >
            Generating QR Code...
          </div>
        )}

        <div style={{ marginTop: 8, fontSize: 11.5, color: '#475569', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
          <QrCode size={14} color="#4f46e5" /> Direct Payee Bank QR (0% Fee)
        </div>
      </div>

      {/* Pay via UPI App Mobile Deep Link Button */}
      <button
        type="button"
        onClick={handleOpenUpiApp}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '13px',
          borderRadius: 12,
          fontSize: 13.5,
          fontWeight: 800,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        }}
      >
        <Smartphone size={16} /> Pay ₹{amount.toLocaleString()} via UPI App
      </button>

      {/* UPI VPA Copy Bar */}
      {ownerVpa && (
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
          <div style={{ overflow: 'hidden' }}>
            <span style={{ fontSize: 10, color: '#94a3b8', display: 'block' }}>
              {ownerName ? `${ownerName} UPI VPA:` : 'Owner UPI ID / VPA:'}
            </span>
            <span style={{ fontSize: 13, color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
              {ownerVpa}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: copied ? '#34d399' : '#818cf8', fontSize: 11, fontWeight: 700 }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </div>
        </div>
      )}

      {/* Payee Direct Bank Settlement Info Notice */}
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
          <ShieldCheck size={15} /> Direct 0% MDR Settlement
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>
          Your payment transfers directly into your PG Owner's bank account via NPCI UPI with zero gateway deductions. After paying in your UPI app, your PG Owner can verify and record your settlement in their dashboard.
        </p>
      </div>
    </div>
  );
};
