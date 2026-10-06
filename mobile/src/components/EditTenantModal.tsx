import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Tenant } from '../types';
import { UserCheck, Trash2, X, AlertTriangle } from 'lucide-react';
import { TenantPersonalFields } from './edit/tenant/TenantPersonalFields';
import { TenantEmergencyFields } from './edit/tenant/TenantEmergencyFields';
import { TenantKycFields } from './edit/tenant/TenantKycFields';
import { TenantStayFields } from './edit/tenant/TenantStayFields';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSuccess: () => void;
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onSuccess,
}) => {
  // Personal
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Emergency & Workplace
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');

  // KYC
  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [idProofNumber, setIdProofNumber] = useState('');
  const [kycStatus, setKycStatus] = useState('VERIFIED');

  // Stay terms
  const [agreedRent, setAgreedRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [stayStatus, setStayStatus] = useState('ACTIVE');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (tenant) {
      setFullName(tenant.user?.fullName || '');
      setPhone(tenant.user?.phone || '');
      setEmail(tenant.user?.email || '');

      setEmergencyName(tenant.emergencyName || '');
      setEmergencyPhone(tenant.emergencyPhone || '');
      setWorkplace(tenant.workplace || '');
      setPermanentAddress(tenant.permanentAddress || '');

      setIdProofType(tenant.idProofType || 'AADHAAR');
      setIdProofNumber(tenant.idProofNumber || '');
      setKycStatus(tenant.kycStatus || 'VERIFIED');

      const activeStay = tenant.stays?.find((s) => s.status === 'ACTIVE' || s.status === 'NOTICE_PERIOD') || tenant.stays?.[0];
      if (activeStay) {
        setAgreedRent(String(activeStay.agreedRent || ''));
        setSecurityDeposit(String(activeStay.securityDeposit || ''));
        setCheckInDate(activeStay.checkInDate ? activeStay.checkInDate.split('T')[0] : '');
        setStayStatus(activeStay.status || 'ACTIVE');
      } else {
        setAgreedRent('');
        setSecurityDeposit('');
        setCheckInDate('');
        setStayStatus('ACTIVE');
      }

      setShowDeleteConfirm(false);
    }
  }, [tenant]);

  if (!isOpen || !tenant) return null;

  const hasActiveStay = Boolean(tenant.stays && tenant.stays.length > 0);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert('Full Name and Phone are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateTenant(tenant.id, {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        emergencyName: emergencyName.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        workplace: workplace.trim() || undefined,
        permanentAddress: permanentAddress.trim() || undefined,
        idProofType,
        idProofNumber: idProofNumber.trim() || undefined,
        kycStatus,
        agreedRent: agreedRent ? parseFloat(agreedRent) : undefined,
        securityDeposit: securityDeposit ? parseFloat(securityDeposit) : undefined,
        checkInDate: checkInDate || undefined,
        stayStatus,
      });

      if (res.success) {
        alert('Resident details & stay terms updated successfully!');
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to update resident');
      }
    } catch (err: any) {
      alert('Error updating resident: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await api.deleteTenant(tenant.id);
      if (res.success) {
        alert(`Resident record for "${tenant.user?.fullName}" was deleted and allocated beds freed.`);
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Cannot delete resident');
      }
    } catch (err: any) {
      alert('Error deleting resident: ' + err.message);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <UserCheck size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Edit Resident Details
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {tenant.user?.fullName} ({tenant.user?.phone})
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
        <form onSubmit={handleUpdate} style={{ padding: '20px 24px', maxHeight: '74vh', overflowY: 'auto' }}>
          {/* Section 1: Personal Info */}
          <TenantPersonalFields
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            email={email}
            setEmail={setEmail}
          />

          {/* Section 2: Stay Terms & Financials */}
          <TenantStayFields
            agreedRent={agreedRent}
            setAgreedRent={setAgreedRent}
            securityDeposit={securityDeposit}
            setSecurityDeposit={setSecurityDeposit}
            checkInDate={checkInDate}
            setCheckInDate={setCheckInDate}
            stayStatus={stayStatus}
            setStayStatus={setStayStatus}
            hasActiveStay={hasActiveStay}
          />

          {/* Section 3: KYC & Govt Documents */}
          <TenantKycFields
            idProofType={idProofType}
            setIdProofType={setIdProofType}
            idProofNumber={idProofNumber}
            setIdProofNumber={setIdProofNumber}
            kycStatus={kycStatus}
            setKycStatus={setKycStatus}
          />

          {/* Section 4: Emergency Contact & Workplace */}
          <TenantEmergencyFields
            emergencyName={emergencyName}
            setEmergencyName={setEmergencyName}
            emergencyPhone={emergencyPhone}
            setEmergencyPhone={setEmergencyPhone}
            workplace={workplace}
            setWorkplace={setWorkplace}
            permanentAddress={permanentAddress}
            setPermanentAddress={setPermanentAddress}
          />

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '13px', fontWeight: 800 }}
            >
              {submitting ? 'Saving Changes...' : 'Save All Changes'}
            </button>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 12,
                  color: '#f87171',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Trash2 size={16} /> Delete Resident Record
              </button>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  <AlertTriangle size={18} /> Confirm Resident Deletion
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 }}>
                  Are you sure you want to permanently delete resident <strong>"{tenant.user?.fullName}"</strong>? All their occupied beds will be marked <strong>VACANT</strong> immediately and invoice history purged.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={handleDelete}
                    style={{
                      padding: '10px',
                      background: '#ef4444',
                      border: 'none',
                      borderRadius: 8,
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete Resident'}
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '10px',
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
          </div>
        </form>
      </div>
    </div>
  );
};
