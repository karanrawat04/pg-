import React, { useState, useEffect } from 'react';
import { Bed } from '../types';
import { api } from '../api/client';
import { BedDouble, Trash2, X, Check, AlertCircle, DollarSign, Tag, Wrench, ShieldAlert } from 'lucide-react';

interface EditBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  bed: Bed | null;
  onSuccess: () => void;
}

export const EditBedModal: React.FC<EditBedModalProps> = ({
  isOpen,
  onClose,
  bed,
  onSuccess,
}) => {
  const [bedNumber, setBedNumber] = useState('');
  const [customRent, setCustomRent] = useState('');
  const [status, setStatus] = useState<'VACANT' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'>('VACANT');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (bed) {
      setBedNumber(bed.bedNumber || '');
      setCustomRent(bed.customRent !== undefined && bed.customRent !== null ? String(bed.customRent) : '');
      setStatus(bed.status || 'VACANT');
      setShowDeleteConfirm(false);
    }
  }, [bed]);

  if (!isOpen || !bed) return null;

  const isOccupiedWithStay = bed.status === 'OCCUPIED' && Boolean(bed.stays && bed.stays.length > 0);
  const activeTenantName = bed.stays?.[0]?.tenant?.user?.fullName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedNumber.trim()) {
      alert('Bed number/name cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateBed(bed.id, {
        bedNumber: bedNumber.trim(),
        customRent: customRent ? parseFloat(customRent) : undefined,
        status: isOccupiedWithStay ? undefined : status,
      });

      if (res.success) {
        alert('Bed details updated successfully!');
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to update bed');
      }
    } catch (err: any) {
      alert('Error updating bed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await api.deleteBed(bed.id);
      if (res.success) {
        alert(`Bed "${bed.bedNumber}" deleted successfully.`);
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Cannot delete bed');
      }
    } catch (err: any) {
      alert('Error deleting bed: ' + err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag-handle" />

        {/* Modal Header */}
        <div
          style={{
            padding: '12px 18px 16px',
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
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BedDouble size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, color: '#f8fafc', fontWeight: 800 }}>
                Edit Bed Details
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Bed {bed.bedNumber} {bed.room ? `• Room ${bed.room.roomNumber}` : ''}
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
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Bed Label / Number */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Bed Label / Number *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                placeholder="e.g. 101-A, Window Bed, Single-Upper"
                required
                className="custom-input"
              />
            </div>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
              Distinct identifier for residents and inventory accounting.
            </span>
          </div>

          {/* Custom Bed Rent */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Bed Custom Monthly Rent (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={customRent}
                onChange={(e) => setCustomRent(e.target.value)}
                placeholder={bed.room?.baseRent ? `Default: ₹${bed.room.baseRent}` : 'e.g. 8500'}
                className="custom-input"
              />
            </div>
            <span style={{ fontSize: 11, color: '#64748b', marginTop: 4, display: 'block' }}>
              Override room base rent for premium spots (e.g. balcony/window view).
            </span>
          </div>

          {/* Status Selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
              Bed Availability Status
            </label>

            {isOccupiedWithStay ? (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <ShieldAlert size={18} color="#f43f5e" />
                <div style={{ fontSize: 12, color: '#fda4af' }}>
                  <strong>Occupied by resident:</strong> {activeTenantName || 'Active Resident'}
                  <div style={{ fontSize: 11, color: '#fca5a5', marginTop: 2 }}>
                    Status is locked to OCCUPIED while a resident is checked in. Checkout resident to vacate.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { value: 'VACANT', label: 'Vacant', desc: 'Ready for booking', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
                  { value: 'MAINTENANCE', label: 'Maintenance', desc: 'Repairs/Cleaning', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
                  { value: 'RESERVED', label: 'Reserved', desc: 'Held for tenant', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)' },
                ].map((s) => {
                  const isSelected = status === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value as any)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 10,
                        background: isSelected ? s.bg : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? `2px solid ${s.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                        color: isSelected ? s.color : '#94a3b8',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{s.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontWeight: 800 }}
            >
              {submitting ? 'Saving Changes...' : 'Save Bed Changes'}
            </button>

            {!isOccupiedWithStay && (
              <>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    style={{
                      width: '100%',
                      padding: '11px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 10,
                      color: '#f87171',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Trash2 size={15} /> Delete Bed
                  </button>
                ) : (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: 12,
                      padding: '12px',
                    }}
                  >
                    <div style={{ color: '#f87171', fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                      Delete Bed "{bed.bedNumber}"?
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: 11, color: '#cbd5e1', lineHeight: 1.4 }}>
                      This vacant bed will be permanently removed from Room inventory.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={handleDelete}
                        style={{
                          padding: '9px',
                          background: '#ef4444',
                          border: 'none',
                          borderRadius: 8,
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {deleting ? 'Deleting...' : 'Yes, Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{
                          padding: '9px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: 8,
                          color: '#94a3b8',
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
