import React, { useState, useEffect } from 'react';
import { Property, Complaint, Invoice } from '../types';
import { api } from '../api/client';
import {
  CreditCard,
  MessageSquare,
  Upload,
  CheckCircle2,
  Trash2,
  Zap,
  Wifi,
  Sparkles,
  Droplets,
  Lightbulb,
  Brush,
  Box,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { RentPaymentModal } from '../components/payment/RentPaymentModal';
import { PaymentReceiptModal } from '../components/payment/PaymentReceiptModal';

interface TenantPortalProps {
  property: Property;
}

export const TenantPortal: React.FC<TenantPortalProps> = ({ property }) => {
  const [activeTab, setActiveTab] = useState<'PAY_RENT' | 'COMPLAINTS'>('PAY_RENT');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  // New Complaint Form State (Strictly: Message + max 3 media items)
  const [category, setCategory] = useState('PLUMBING');
  const [message, setMessage] = useState('');
  const [mediaList, setMediaList] = useState<string[]>([]);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const loadTenantData = async () => {
    try {
      const [allInvoices, allComplaints] = await Promise.all([
        api.getInvoices(property.id),
        api.getComplaints(property.id),
      ]);
      setInvoices(allInvoices);
      setComplaints(allComplaints);
    } catch (err) {
      console.error('Error loading tenant data:', err);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [property.id]);

  const handlePayRent = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
  };

  const handleOpenReceipt = async (inv: Invoice) => {
    try {
      const receipt = await api.getInvoiceReceipt(inv.id);
      setSelectedInvoiceForReceipt(receipt);
    } catch {
      setSelectedInvoiceForReceipt({
        invoiceNumber: inv.invoiceNumber,
        billingMonth: inv.billingMonth,
        propertyName: property.name,
        tenantName: 'Resident Tenant',
        totalDue: inv.totalDue,
        amountPaid: inv.amountPaid || inv.totalDue,
        paidAt: inv.paidAt || new Date(),
      });
    }
  };

  const handleAddMedia = () => {
    if (mediaList.length >= 3) {
      alert('Maximum 3 media files (photos or video) allowed.');
      return;
    }

    const sampleImages = [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    ];

    const nextImage = sampleImages[mediaList.length % sampleImages.length];
    setMediaList([...mediaList, nextImage]);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaList(mediaList.filter((_, i) => i !== index));
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please enter a description message.');
      return;
    }

    try {
      setSubmittingComplaint(true);
      const tenantId = complaints[0]?.tenantId || '4d0a4eb2-5fe3-4780-afa3-b1fff0975368';

      await api.raiseComplaint({
        propertyId: property.id,
        tenantId,
        category,
        message,
        mediaUrls: mediaList,
      });

      setMessage('');
      setMediaList([]);
      setSubmittingComplaint(false);
      alert('Complaint raised successfully!');
      loadTenantData();
    } catch (err) {
      setSubmittingComplaint(false);
      alert('Failed to submit complaint');
    }
  };

  const pendingInvoice = invoices.find((inv) => inv.status !== 'PAID') || invoices[0];

  const categories = [
    { id: 'PLUMBING', label: 'Plumbing', icon: <Droplets size={16} /> },
    { id: 'ELECTRICAL', label: 'Electrical', icon: <Lightbulb size={16} /> },
    { id: 'WIFI', label: 'Wi-Fi / Internet', icon: <Wifi size={16} /> },
    { id: 'CLEANING', label: 'Housekeeping', icon: <Brush size={16} /> },
    { id: 'OTHER', label: 'Other Issues', icon: <Box size={16} /> },
  ];

  return (
    <div style={{ width: '100%', padding: '14px 14px 90px', boxSizing: 'border-box' }}>
      {/* Resident Hero Profile Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 50,
            height: 50,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: 20,
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
          }}>
            R
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {property.name}
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 10,
              }}>
                Resident Active
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#94a3b8' }}>
              Room 102 • Bed 102-A • Monthly Tenant
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{
          display: 'flex',
          background: 'rgba(10, 15, 29, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: 4,
          gap: 4,
        }}>
          <button
            onClick={() => setActiveTab('PAY_RENT')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'PAY_RENT' ? '#6366f1' : 'transparent',
              color: activeTab === 'PAY_RENT' ? '#ffffff' : '#94a3b8',
            }}
          >
            <CreditCard size={15} />
            Pay Rent
          </button>
          <button
            onClick={() => setActiveTab('COMPLAINTS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'COMPLAINTS' ? '#6366f1' : 'transparent',
              color: activeTab === 'COMPLAINTS' ? '#ffffff' : '#94a3b8',
            }}
          >
            <MessageSquare size={15} />
            Maintenance
          </button>
        </div>
      </div>

      {/* Tab 1: Pay Rent (Fintech Experience) */}
      {activeTab === 'PAY_RENT' && (
        <div>
          {paymentSuccess ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 20,
              padding: 30,
              textAlign: 'center',
              marginBottom: 24,
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)',
            }}>
              <CheckCircle2 size={54} color="#34d399" style={{ margin: '0 auto 14px' }} />
              <h3 style={{ margin: 0, fontSize: 22, color: '#ffffff', fontWeight: 800 }}>
                Rent Payment Successful!
              </h3>
              <p style={{ color: '#a7f3d0', fontSize: 14, margin: '8px 0 20px 0' }}>
                ₹{pendingInvoice ? pendingInvoice.totalDue.toLocaleString() : '7,000'} has been settled directly with 0% gateway fee.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => setPaymentSuccess(false)}
                  className="btn-success"
                >
                  <Download size={15} />
                  Download GST Receipt
                </button>
              </div>
            </div>
          ) : null}

          {pendingInvoice ? (
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                    Monthly Rent ({pendingInvoice.billingMonth})
                  </h3>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Invoice ID: {pendingInvoice.invoiceNumber}
                  </span>
                </div>
                <span style={{
                  background: pendingInvoice.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: pendingInvoice.status === 'PAID' ? '#6ee7b7' : '#fcd34d',
                  border: pendingInvoice.status === 'PAID' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  fontSize: 12,
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 20,
                }}>
                  {pendingInvoice.status}
                </span>
              </div>

              {/* Amount Display */}
              <div style={{
                textAlign: 'center',
                padding: '24px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Total Amount Due
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: '#ffffff', letterSpacing: -1, marginTop: 4 }}>
                  ₹{pendingInvoice.totalDue.toLocaleString()}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  <ShieldCheck size={14} /> Zero Transaction Fee (0% MDR UPI)
                </div>
              </div>

              {/* Itemized Breakdown */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                marginBottom: 24,
                fontSize: 14,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>Room Rent (Bed 102-A)</span>
                  <span style={{ fontWeight: 600 }}>₹{pendingInvoice.rentAmount.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                  <span>High-Speed WiFi & Housekeeping</span>
                  <span style={{ fontWeight: 600, color: '#34d399' }}>Free / Included</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34d399' }}>
                  <span>Payment Gateway Processing Fee</span>
                  <span style={{ fontWeight: 700 }}>₹0.00 (Zero MDR)</span>
                </div>
              </div>

              {/* Zero-Fee 1-Tap UPI Payment Button */}
              {pendingInvoice.status !== 'PAID' ? (
                <button
                  onClick={() => handlePayRent(pendingInvoice)}
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '16px',
                    borderRadius: 14,
                    fontSize: 16,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Zap size={20} />
                  Pay ₹{pendingInvoice.totalDue.toLocaleString()} via UPI / Cards
                </button>
              ) : (
                <div style={{
                  padding: 16,
                  textAlign: 'center',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 14,
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  <div style={{ marginBottom: 10 }}>✓ All dues paid for this billing cycle.</div>
                  <button
                    onClick={() => handleOpenReceipt(pendingInvoice)}
                    className="btn-secondary"
                    style={{
                      fontSize: 12.5,
                      padding: '8px 14px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Download size={14} /> View Official Receipt
                  </button>
                </div>
              )}

              <p style={{ textAlign: 'center', fontSize: 11, color: '#64748b', marginTop: 14 }}>
                Instant settlement via Google Pay • PhonePe • Paytm • CRED
              </p>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: 40 }}>
              No current dues found.
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Simplified Complaints (Message + Max 3 Media) */}
      {activeTab === 'COMPLAINTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* New Complaint Form */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{ margin: '0 0 6px 0', fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
              Report a Maintenance Issue
            </h3>
            <p style={{ margin: '0 0 18px 0', fontSize: 13, color: '#94a3b8' }}>
              Our building caretaker will review and resolve this promptly.
            </p>

            <form onSubmit={handleSubmitComplaint}>
              {/* Category Pills */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
                  Select Category
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 13,
                          fontWeight: 700,
                          border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                          background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#a5b4fc' : '#cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {cat.icon}
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Issue Description *
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Geyser is tripping the power switch in room 102..."
                  className="custom-input"
                  style={{ resize: 'none' }}
                />
              </div>

              {/* Max 3 Media Attachments */}
              <div style={{ marginBottom: 22 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                    Attach Photos / Short Video Clip
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: mediaList.length >= 3 ? '#f87171' : '#34d399' }}>
                    {mediaList.length} / 3 Media Attached
                  </span>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {mediaList.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        width: 96,
                        height: 76,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '1px solid #6366f1',
                      }}
                    >
                      <img src={url} alt="Attached" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(idx)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'rgba(220, 38, 38, 0.9)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}

                  {mediaList.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddMedia}
                      style={{
                        height: 76,
                        padding: '0 16px',
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px dashed rgba(255, 255, 255, 0.2)',
                        borderRadius: 10,
                        color: '#94a3b8',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <Upload size={18} color="#818cf8" />
                      Add Photo / Clip
                    </button>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submittingComplaint}
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
              >
                {submittingComplaint ? 'Submitting Ticket...' : 'Submit Ticket'}
              </button>
            </form>
          </div>

          {/* Past Complaints */}
          <div>
            <h4 style={{ color: '#f8fafc', fontSize: 16, fontWeight: 700, margin: '0 0 14px 0' }}>
              My Previous Tickets
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#a5b4fc',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}>
                      {c.category}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 12,
                      background:
                        c.status === 'RESOLVED'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : c.status === 'IN_PROGRESS'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        c.status === 'RESOLVED' ? '#6ee7b7' : c.status === 'IN_PROGRESS' ? '#a5b4fc' : '#fcd34d',
                    }}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: 13, margin: '10px 0 0 0', lineHeight: 1.4 }}>
                    {c.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('PAY_RENT')}
          className={`mobile-tab-btn ${activeTab === 'PAY_RENT' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <CreditCard size={18} />
          </div>
          <span>Pay Rent</span>
        </button>

        <button
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`mobile-tab-btn ${activeTab === 'COMPLAINTS' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <MessageSquare size={18} />
          </div>
          <span>Complaints</span>
          {complaints.filter((c) => c.status !== 'RESOLVED').length > 0 && (
            <span className="tab-badge">{complaints.filter((c) => c.status !== 'RESOLVED').length}</span>
          )}
        </button>
      </nav>

      {/* Rent Payment Modal */}
      <RentPaymentModal
        isOpen={!!selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        invoice={selectedInvoiceForPayment}
        onPaymentSuccess={() => {
          setSelectedInvoiceForPayment(null);
          loadTenantData();
        }}
      />

      {/* Official Rent Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={!!selectedInvoiceForReceipt}
        onClose={() => setSelectedInvoiceForReceipt(null)}
        receiptData={selectedInvoiceForReceipt}
      />
    </div>
  );
};
