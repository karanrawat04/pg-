import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Tenant, Property } from '../types';
import { TrendingUp, Send, X, Check, ArrowRight, DollarSign, Calendar } from 'lucide-react';

interface ReviseRentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  property: Property;
  onSuccess: () => void;
}

export const ReviseRentModal: React.FC<ReviseRentModalProps> = ({
  isOpen,
  onClose,
  tenant,
  property,
  onSuccess,
}) => {
  const [currentRent, setCurrentRent] = useState(0);
  const [newRent, setNewRent] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('NEXT_CYCLE');
  const [updatePendingInvoice, setUpdatePendingInvoice] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (tenant) {
      const activeStays = tenant.stays || [];
      const total = activeStays.reduce((sum, s) => sum + Number(s.agreedRent || 0), 0);
      setCurrentRent(total);
      setNewRent(total > 0 ? String(total) : '');
      setEffectiveFrom('NEXT_CYCLE');
      setUpdatePendingInvoice(false);
      setNote('');
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const handleQuickAdd = (type: 'pct5' | 'pct10' | 'add500' | 'add1000') => {
    let base = parseFloat(newRent) || currentRent;
    if (type === 'pct5') base = Math.round(base * 1.05);
    else if (type === 'pct10') base = Math.round(base * 1.10);
    else if (type === 'add500') base += 500;
    else if (type === 'add1000') base += 1000;
    setNewRent(String(base));
  };

  const handleSave = async (sendWhatsApp: boolean) => {
    const rentNum = parseFloat(newRent);
    if (!rentNum || rentNum <= 0) {
      alert('Please enter a valid monthly rent amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.reviseRent(tenant.id, {
        newRent: rentNum,
        effectiveFrom,
        note: note.trim() || undefined,
        updateCurrentPendingInvoice: updatePendingInvoice,
      });

      if (res.success) {
        alert(res.message || 'Rent revised successfully!');

        if (sendWhatsApp) {
          const effectiveText = effectiveFrom === 'NEXT_CYCLE' ? 'next billing cycle' : 'immediately';
          const msg = `Hello ${tenant.user?.fullName}, this is an update from ${property.name}. Please note that your monthly room rent has been revised to ₹${rentNum.toLocaleString()}/month effective from ${effectiveText}. Thank you for staying with us!`;
          const url = `https://wa.me/91${tenant.user?.phone}?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank');
        }

        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to revise rent');
      }
    } catch (err: any) {
      alert('Error revising rent: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeStays = tenant.stays || [];
  const roomNumbers = Array.from(new Set(activeStays.map((s) => s.bed.room.roomNumber))).join(', ');
  const bedNumbers = activeStays.map((s) => s.bed.bedNumber).join(', ');

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        {/* Header */}
        <div style={{
          padding: '10px 18px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'rgba(52, 211, 153, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="#34d399" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Revise Monthly Rent
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {tenant.user?.fullName} • Room {roomNumbers} ({bedNumbers})
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

        {/* Form Body */}
        <div style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Current vs New Rent Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 18,
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: 12,
            textAlign: 'center',
          }}>
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>CURRENT RENT</span>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#cbd5e1', marginTop: 4 }}>
                ₹{currentRent.toLocaleString()}
              </div>
              <span style={{ fontSize: 10, color: '#64748b' }}>/ month</span>
            </div>

            <ArrowRight size={20} color="#6366f1" />

            <div>
              <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>REVISED RENT</span>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
                ₹{(parseFloat(newRent) || 0).toLocaleString()}
              </div>
              <span style={{ fontSize: 10, color: '#64748b' }}>/ month</span>
            </div>
          </div>

          {/* New Rent Input */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              New Agreed Monthly Rent (₹) *
            </label>
            <input
              type="number"
              value={newRent}
              onChange={(e) => setNewRent(e.target.value)}
              placeholder="e.g. 9500"
              required
              className="custom-input"
              style={{ fontSize: 16, fontWeight: 700 }}
            />
          </div>

          {/* Quick Escalation Buttons */}
          <div style={{ marginBottom: 18 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
              Quick Escalation Shortcuts:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickAdd('pct5')}
                style={{
                  padding: '7px 4px',
                  borderRadius: 8,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +5%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('pct10')}
                style={{
                  padding: '7px 4px',
                  borderRadius: 8,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('add500')}
                style={{
                  padding: '7px 4px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +₹500
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd('add1000')}
                style={{
                  padding: '7px 4px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#cbd5e1',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                +₹1,000
              </button>
            </div>
          </div>

          {/* Effective Period */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Effective Timing
            </label>
            <select
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="custom-input"
            >
              <option value="NEXT_CYCLE">Starting from Next Billing Cycle (Recommended)</option>
              <option value="IMMEDIATE">Apply Immediately to Active Contract</option>
            </select>
          </div>

          {/* Update Pending Current Month Invoice Option */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: '#cbd5e1',
              fontSize: 13,
              fontWeight: 600,
            }}>
              <input
                type="checkbox"
                checked={updatePendingInvoice}
                onChange={(e) => setUpdatePendingInvoice(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#6366f1' }}
              />
              Also update current month's unpaid pending invoice
            </label>
          </div>

          {/* Note */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Reason / Internal Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Annual 8% escalation, AC electricity hike"
              className="custom-input"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: 12,
                color: '#fff',
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Send size={16} /> Save & Send WhatsApp Notice
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(false)}
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 13 }}
            >
              {submitting ? 'Applying...' : 'Save Without WhatsApp Notification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
