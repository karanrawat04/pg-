import React from 'react';
import { ShieldCheck, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface TenantKycFieldsProps {
  idProofType: string;
  setIdProofType: (val: string) => void;
  idProofNumber: string;
  setIdProofNumber: (val: string) => void;
  kycStatus: string;
  setKycStatus: (val: string) => void;
}

export const TenantKycFields: React.FC<TenantKycFieldsProps> = ({
  idProofType,
  setIdProofType,
  idProofNumber,
  setIdProofNumber,
  kycStatus,
  setKycStatus,
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <ShieldCheck size={15} color="#34d399" /> KYC & Government Verification
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            ID Proof Document
          </label>
          <select
            value={idProofType}
            onChange={(e) => setIdProofType(e.target.value)}
            className="custom-input"
          >
            <option value="AADHAAR">Aadhaar Card</option>
            <option value="PAN">PAN Card</option>
            <option value="PASSPORT">Passport</option>
            <option value="VOTER_ID">Voter ID</option>
            <option value="DRIVING_LICENSE">Driving License</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            ID Proof Number
          </label>
          <input
            type="text"
            value={idProofNumber}
            onChange={(e) => setIdProofNumber(e.target.value)}
            placeholder="e.g. XXXX-XXXX-1234"
            className="custom-input"
          />
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
          Verification Status
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { value: 'VERIFIED', label: 'Verified', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', icon: CheckCircle2 },
            { value: 'PENDING', label: 'Pending', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', icon: Clock },
            { value: 'REJECTED', label: 'Rejected', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', icon: XCircle },
          ].map((item) => {
            const isSelected = kycStatus === item.value;
            const Icon = item.icon;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setKycStatus(item.value)}
                style={{
                  padding: '8px',
                  borderRadius: 10,
                  background: isSelected ? item.bg : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? `2px solid ${item.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  color: isSelected ? item.color : '#94a3b8',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={14} /> {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
