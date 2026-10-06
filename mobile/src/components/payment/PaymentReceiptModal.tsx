import React from 'react';
import { CheckCircle2, Printer, X, Download, ShieldCheck, Building2 } from 'lucide-react';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: {
    invoiceNumber: string;
    billingMonth: string;
    propertyName: string;
    propertyAddress?: string;
    tenantName: string;
    tenantPhone?: string;
    roomNumber?: string;
    bedNumber?: string;
    rentAmount: number;
    lateFine?: number;
    totalDue: number;
    amountPaid: number;
    paidAt?: string | Date;
    transactionId?: string;
    utr?: string;
    paymentMode?: string;
  } | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receiptData,
}) => {
  if (!isOpen || !receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receiptData.paidAt
    ? new Date(receiptData.paidAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

  return (
    <div
      className="bottom-sheet-overlay"
      onClick={onClose}
      style={{
        zIndex: 10000,
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
          maxWidth: 440,
          width: '100%',
          borderRadius: 24,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '88vh',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontSize: 13, fontWeight: 800 }}>
            <CheckCircle2 size={16} /> Payment Receipt
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

        {/* Printable Receipt Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {/* Success Banner */}
          <div
            style={{
              textAlign: 'center',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 16,
              padding: '16px',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#10b981',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
              }}
            >
              <CheckCircle2 size={26} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc' }}>
              ₹{Number(receiptData.amountPaid || receiptData.totalDue).toLocaleString()} Paid Successfully
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
              {formattedDate} • 0% MDR Direct UPI
            </div>
          </div>

          {/* Receipt Details Card */}
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
              <span style={{ color: '#94a3b8' }}>Receipt / Invoice #:</span>
              <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
                {receiptData.invoiceNumber}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#94a3b8' }}>Transaction ID:</span>
              <span style={{ color: '#a5b4fc', fontWeight: 700, fontFamily: 'monospace', fontSize: 11 }}>
                {receiptData.transactionId || 'TXN-DIRECT'}
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
              <span style={{ color: '#94a3b8' }}>Payment Method:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                {receiptData.paymentMode || 'UPI_PHONEPE'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>Resident:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{receiptData.tenantName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>PG Property:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{receiptData.propertyName}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>Room & Bed:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>
                Room {receiptData.roomNumber || '—'} (Bed {receiptData.bedNumber || '—'})
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#94a3b8' }}>Billing Month:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{receiptData.billingMonth}</span>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', margin: '10px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#f8fafc', fontWeight: 800 }}>Total Amount Paid:</span>
              <span style={{ color: '#34d399', fontWeight: 900, fontSize: 16 }}>
                ₹{Number(receiptData.amountPaid || receiptData.totalDue).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div
          style={{
            padding: '12px 18px',
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
            <Printer size={15} /> Print / Save PDF
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
