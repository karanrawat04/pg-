import React from 'react';
import { CheckCircle2, Printer, X, Download, ShieldCheck, Crown, Building2 } from 'lucide-react';

interface SubscriptionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    receiptNumber: string;
    txnId: string;
    utr?: string;
    paymentMode?: string;
    planName: string;
    extendMonths: number;
    billingCycle?: string;
    organizationName?: string;
    totalAmount?: number;
    paidAt?: string | Date;
    validUntil?: string | Date;
  } | null;
}

export const SubscriptionReceiptModal: React.FC<SubscriptionReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedPaidAt = receiptData.paidAt
    ? new Date(receiptData.paidAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN');

  const formattedExpiry = receiptData.validUntil
    ? new Date(receiptData.validUntil).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div
      className="bottom-sheet-overlay"
      onClick={onClose}
      style={{
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="bottom-sheet-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 24,
          background: '#0c1222',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', fontSize: 13, fontWeight: 800 }}>
            <Crown size={17} color="#818cf8" /> Platform Tax Invoice
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
            <X size={16} />
          </button>
        </div>

        {/* Invoice Body */}
        <div style={{ padding: '22px', overflowY: 'auto', flex: 1 }}>
          <div
            style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.12) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 18,
              padding: '18px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.5)',
              }}
            >
              <CheckCircle2 size={26} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#ffffff' }}>
              Subscription Activated!
            </div>
            <div style={{ fontSize: 12, color: '#c7d2fe', marginTop: 4 }}>
              Tier: <strong>{receiptData.planName}</strong> (+{receiptData.extendMonths} Month{receiptData.extendMonths > 1 ? 's' : ''})
            </div>
            <div style={{ fontSize: 11, color: '#34d399', marginTop: 4, fontWeight: 700 }}>
              Valid Until: {formattedExpiry}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '14px 16px',
              fontSize: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Tax Invoice #:</span>
              <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
                {receiptData.receiptNumber}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Transaction ID:</span>
              <span style={{ color: '#a5b4fc', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>
                {receiptData.txnId}
              </span>
            </div>

            {receiptData.utr && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Bank Ref / UTR:</span>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
                  {receiptData.utr}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Subscriber Org:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {receiptData.organizationName || 'PG Business Organization'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Payment Method:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {receiptData.paymentMode || 'UPI_INTENT'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Paid On:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {formattedPaidAt}
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#f8fafc', fontWeight: 800 }}>Total Amount (Incl. 18% GST):</span>
              <span style={{ color: '#34d399', fontWeight: 900, fontSize: 16 }}>
                ₹{(receiptData.totalAmount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            gap: 10,
          }}
        >
          <button
            onClick={handlePrint}
            className="btn-secondary"
            style={{
              flex: 1,
              padding: '11px',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Printer size={15} /> Print / Save Tax Invoice
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '11px',
              fontSize: 12.5,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
