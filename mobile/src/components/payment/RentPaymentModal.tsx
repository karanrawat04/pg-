import React, { useState, useEffect } from 'react';
import { Invoice } from '../../types';
import { api } from '../../api/client';
import { RentBreakdownCard } from './RentBreakdownCard';
import { UpiQrPaySection } from './UpiQrPaySection';
import { CardGatewaySection } from './CardGatewaySection';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { X, QrCode, CreditCard, AlertCircle, ShieldAlert } from 'lucide-react';

interface RentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onPaymentSuccess: () => void;
}

export const RentPaymentModal: React.FC<RentPaymentModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'UPI' | 'CARD'>('UPI');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingPayData, setLoadingPayData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payConfig, setPayConfig] = useState<{
    isUpiConfigured: boolean;
    upiId: string | null;
    upiName: string | null;
    isRazorpayConfigured: boolean;
    razorpayKeyId: string | null;
    hasAnyConfigured: boolean;
  } | null>(null);
  const [payData, setPayData] = useState<any>(null);

  // Official Receipt Modal State
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (isOpen && invoice) {
      setError(null);
      setLoadingConfig(true);

      // Fetch payment options configured by PG Owner for this invoice
      api.getTenantInvoicePaymentConfig(invoice.id)
        .then((res) => {
          if (res.success && res.data) {
            setPayConfig(res.data);
            if (res.data.isRazorpayConfigured && !res.data.isUpiConfigured) {
              setActiveTab('CARD');
            } else {
              setActiveTab('UPI');
            }

            // If UPI is configured, initialize UPI intent data
            if (res.data.isUpiConfigured) {
              setLoadingPayData(true);
              api.initiateUpiPayment(invoice.id)
                .then((pRes) => {
                  if (pRes.success && pRes.data) {
                    setPayData(pRes.data);
                  }
                })
                .catch((pErr) => {
                  console.error('Error initiating UPI:', pErr);
                })
                .finally(() => {
                  setLoadingPayData(false);
                });
            }
          } else {
            setError(res.message || 'Failed to fetch payment configuration.');
          }
        })
        .catch((err) => {
          setError(err.message || 'Network error fetching payment configuration.');
        })
        .finally(() => {
          setLoadingConfig(false);
        });
    } else {
      setPayConfig(null);
      setPayData(null);
    }
  }, [isOpen, invoice]);

  if (!isOpen || !invoice) return null;

  const handleRazorpaySuccess = (paymentId: string) => {
    setReceiptData({
      invoiceNumber: payData?.invoiceNumber || invoice.invoiceNumber,
      billingMonth: payData?.billingMonth || invoice.billingMonth,
      propertyName: payData?.ownerName || invoice.stay?.bed?.room?.property?.name || 'PG Accommodation',
      propertyAddress: invoice.stay?.bed?.room?.property?.address,
      tenantName: payData?.tenantName || invoice.stay?.tenant?.user?.fullName || 'Resident',
      roomNumber: payData?.roomNumber || invoice.stay?.bed?.room?.roomNumber,
      bedNumber: payData?.bedNumber || invoice.stay?.bed?.bedNumber,
      rentAmount: payData?.rentAmount || Number(invoice.rentAmount),
      lateFine: payData?.lateFine || Number(invoice.lateFine || 0),
      totalDue: payData?.totalDue || Number(invoice.totalDue),
      amountPaid: payData?.amount || (Number(invoice.totalDue) - Number(invoice.amountPaid)),
      paidAt: new Date(),
      transactionId: paymentId,
      paymentMode: 'RAZORPAY_CHECKOUT',
    });

    setIsReceiptOpen(true);
    onPaymentSuccess();
  };

  const handleCloseReceiptAndModal = () => {
    setIsReceiptOpen(false);
    setReceiptData(null);
    onClose();
  };

  const hasBoth = Boolean(payConfig?.isUpiConfigured && payConfig?.isRazorpayConfigured);

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose}>
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
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: '#f8fafc', fontWeight: 800 }}>
                Pay Rent Dues
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Invoice #{invoice.invoiceNumber} ({invoice.billingMonth})
              </span>
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

            {/* Invoice Breakdown */}
            <RentBreakdownCard invoice={invoice} payData={payData} />

            {loadingConfig ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 13 }}>
                Checking payment channels configured by PG Owner...
              </div>
            ) : !payConfig?.hasAnyConfigured ? (
              /* NOT CONFIGURED: Hidden from UI */
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
                  Online Payments Not Configured
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, maxWidth: 320 }}>
                  Your PG Owner has not yet configured or enabled Razorpay or Direct UPI payments.
                </p>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
                  Please contact your PG Owner to enable digital payment channels or settle your dues offline via Cash.
                </div>
              </div>
            ) : (
              <>
                {/* Method Switcher Tabs: ONLY shown if BOTH are configured */}
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
                      onClick={() => setActiveTab('UPI')}
                      style={{
                        padding: '10px',
                        borderRadius: 12,
                        border: activeTab === 'UPI' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: activeTab === 'UPI' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: activeTab === 'UPI' ? '#ffffff' : '#94a3b8',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <QrCode size={15} color={activeTab === 'UPI' ? '#818cf8' : '#94a3b8'} />
                      <span>UPI QR / App</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('CARD')}
                      style={{
                        padding: '10px',
                        borderRadius: 12,
                        border: activeTab === 'CARD' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: activeTab === 'CARD' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        color: activeTab === 'CARD' ? '#ffffff' : '#94a3b8',
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <CreditCard size={15} color={activeTab === 'CARD' ? '#818cf8' : '#94a3b8'} />
                      <span>Razorpay Checkout</span>
                    </button>
                  </div>
                )}

                {/* Active Payment Method Content */}
                {activeTab === 'UPI' && payConfig.isUpiConfigured ? (
                  loadingPayData ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 13 }}>
                      Generating payment QR link...
                    </div>
                  ) : (
                    <UpiQrPaySection
                      upiIntentUrl={payData?.upiIntentUrl || ''}
                      ownerVpa={payConfig.upiId || payData?.ownerVpa}
                      ownerName={payConfig.upiName || payData?.ownerName}
                      amount={payData?.amount || (Number(invoice.totalDue) - Number(invoice.amountPaid))}
                      merchantTxnId={payData?.merchantTxnId || ''}
                    />
                  )
                ) : payConfig.isRazorpayConfigured ? (
                  <CardGatewaySection
                    invoiceId={invoice.id}
                    amount={payData?.amount || (Number(invoice.totalDue) - Number(invoice.amountPaid))}
                    onSuccess={handleRazorpaySuccess}
                    onError={(msg) => setError(msg)}
                  />
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Official Printable Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptOpen}
        onClose={handleCloseReceiptAndModal}
        receiptData={receiptData}
      />
    </>
  );
};
