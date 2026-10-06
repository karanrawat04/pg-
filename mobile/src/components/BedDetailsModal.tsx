import React from 'react';
import { Bed } from '../types';
import { api } from '../api/client';
import { BedDouble, User, Phone, MapPin, Briefcase, ShieldCheck, Calendar, DollarSign, X, Trash2, LogOut, UserPlus, Send, Edit3 } from 'lucide-react';

interface BedDetailsModalProps {
  bed: Bed | null;
  onClose: () => void;
  onOnboardToBed: (bedId: string) => void;
  onRefresh: () => void;
  onEditTenant?: (tenant: any) => void;
  onReviseRent?: (tenant: any) => void;
  onEditBed?: (bed: Bed) => void;
}

export const BedDetailsModal: React.FC<BedDetailsModalProps> = ({
  bed,
  onClose,
  onOnboardToBed,
  onRefresh,
  onEditTenant,
  onReviseRent,
  onEditBed,
}) => {
  if (!bed) return null;

  const stay = bed.stays?.[0];
  const tenant = stay?.tenant;
  const isOccupied = bed.status === 'OCCUPIED' && tenant;

  const handleCheckout = async () => {
    if (!tenant) return;
    if (confirm(`Are you sure you want to check out ${tenant.user.fullName}? All allocated beds will become VACANT.`)) {
      try {
        const res = await api.checkoutTenant(tenant.id);
        if (res.success) {
          alert('Tenant checked out successfully. Beds marked VACANT.');
          onRefresh();
          onClose();
        } else {
          alert(res.message || 'Failed to checkout tenant');
        }
      } catch (err) {
        alert('Error during checkout');
      }
    }
  };

  const handleDeleteBed = async () => {
    if (confirm(`Delete Bed ${bed.bedNumber}? This action cannot be undone.`)) {
      try {
        const res = await api.deleteBed(bed.id);
        if (res.success) {
          alert('Bed removed from room.');
          onRefresh();
          onClose();
        } else {
          alert(res.message || 'Cannot delete bed');
        }
      } catch (err) {
        alert('Error deleting bed');
      }
    }
  };

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
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isOccupied ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <BedDouble size={20} color={isOccupied ? '#f43f5e' : '#10b981'} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Bed {bed.bedNumber}
              </h3>
              <span style={{
                fontSize: 11,
                fontWeight: 800,
                color: isOccupied ? '#fda4af' : '#6ee7b7',
              }}>
                ● {isOccupied ? 'Occupied Resident' : bed.status === 'MAINTENANCE' ? 'Under Maintenance' : bed.status === 'RESERVED' ? 'Reserved' : 'Vacant & Available'}
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

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {isOccupied ? (
            /* OCCUPIED: SHOW RESIDENT PROFILE */
            <div>
              <div style={{
                background: 'rgba(10, 15, 29, 0.8)',
                borderRadius: 14,
                padding: 18,
                marginBottom: 18,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 18,
                  }}>
                    {tenant.user.fullName.slice(0, 1)}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 17, color: '#fff', fontWeight: 800 }}>
                      {tenant.user.fullName}
                    </h4>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>
                      {tenant.user.phone}
                    </span>
                  </div>
                </div>

                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  {tenant.workplace && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                      <Briefcase size={15} color="#818cf8" />
                      <span>Workplace: <strong>{tenant.workplace}</strong></span>
                    </div>
                  )}

                  {tenant.emergencyPhone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                      <Phone size={15} color="#f87171" />
                      <span>
                        Emergency Contact: <strong>{tenant.emergencyName || 'Guardian'} ({tenant.emergencyPhone})</strong>
                      </span>
                    </div>
                  )}

                  {tenant.permanentAddress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                      <MapPin size={15} color="#fbbf24" />
                      <span>Home Address: {tenant.permanentAddress}</span>
                    </div>
                  )}

                  {tenant.idProofNumber && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#cbd5e1' }}>
                      <ShieldCheck size={15} color="#34d399" />
                      <span>
                        {tenant.idProofType || 'Govt ID'}: <strong>{tenant.idProofNumber}</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stay & Financial Terms */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 20,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: 13,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                  <span style={{ color: '#94a3b8' }}>Agreed Bed Rent</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: 15 }}>₹{stay.agreedRent.toLocaleString()}/month</span>
                    {onReviseRent && (
                      <button
                        type="button"
                        onClick={() => {
                          onReviseRent(tenant);
                          onClose();
                        }}
                        style={{
                          background: 'rgba(52, 211, 153, 0.15)',
                          border: '1px solid rgba(52, 211, 153, 0.3)',
                          color: '#34d399',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Revise
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8' }}>Security Deposit</span>
                  <span style={{ color: '#fff', fontWeight: 700 }}>₹{stay.securityDeposit.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8' }}>Check-in Date</span>
                  <span style={{ color: '#cbd5e1' }}>{new Date(stay.checkInDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Edit Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: onEditBed ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 10 }}>
                {onEditTenant && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditTenant(tenant);
                      onClose();
                    }}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: '#a5b4fc',
                      padding: '11px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Edit3 size={14} /> Edit Resident
                  </button>
                )}

                {onEditBed && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditBed(bed);
                      onClose();
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      padding: '11px',
                      borderRadius: 10,
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <BedDouble size={14} /> Edit Bed Info
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <a
                  href={`https://wa.me/91${tenant.user.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#6ee7b7',
                    padding: '12px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Send size={14} /> WhatsApp
                </a>

                <button
                  onClick={handleCheckout}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                    padding: '12px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <LogOut size={16} />
                  Vacate Bed
                </button>
              </div>
            </div>
          ) : (
            /* VACANT BED VIEW */
            <div>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 18px 0', lineHeight: 1.5 }}>
                This bed is currently <strong>vacant</strong> and ready for immediate booking.
              </p>

              <div style={{
                background: 'rgba(10, 15, 29, 0.8)',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Suggested Rent</span>
                  <span style={{ color: '#34d399', fontWeight: 800, fontSize: 18 }}>
                    ₹{(bed.customRent || 8500).toLocaleString()} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>/ mo</span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>Occupancy Status</span>
                  <span style={{ color: '#34d399', fontWeight: 700, fontSize: 13 }}>Ready to allocate</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={() => {
                    onOnboardToBed(bed.id);
                    onClose();
                  }}
                  className="btn-success"
                  style={{ width: '100%', padding: '14px', fontSize: 14 }}
                >
                  <UserPlus size={16} />
                  Onboard Resident to this Bed
                </button>

                {onEditBed && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditBed(bed);
                      onClose();
                    }}
                    style={{
                      width: '100%',
                      background: 'rgba(56, 189, 248, 0.12)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      padding: '12px',
                      borderRadius: 10,
                      fontSize: 13,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <BedDouble size={15} />
                    Edit Bed Details & Status
                  </button>
                )}

                <button
                  onClick={handleDeleteBed}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    color: '#f87171',
                    padding: '11px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={14} />
                  Delete Bed
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
