import React from 'react';
import { Calendar, DollarSign, Clock, Shield } from 'lucide-react';

interface TenantStayFieldsProps {
  agreedRent: string;
  setAgreedRent: (val: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (val: string) => void;
  checkInDate: string;
  setCheckInDate: (val: string) => void;
  stayStatus: string;
  setStayStatus: (val: string) => void;
  hasActiveStay: boolean;
}

export const TenantStayFields: React.FC<TenantStayFieldsProps> = ({
  agreedRent,
  setAgreedRent,
  securityDeposit,
  setSecurityDeposit,
  checkInDate,
  setCheckInDate,
  stayStatus,
  setStayStatus,
  hasActiveStay,
}) => {
  if (!hasActiveStay) return null;

  return (
    <div
      style={{
        background: 'rgba(99, 102, 241, 0.05)',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        borderRadius: 14,
        padding: '14px',
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 800, color: '#a5b4fc', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <DollarSign size={15} color="#818cf8" /> Stay Terms & Financials
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            Agreed Monthly Rent (₹)
          </label>
          <input
            type="number"
            value={agreedRent}
            onChange={(e) => setAgreedRent(e.target.value)}
            placeholder="e.g. 8500"
            className="custom-input"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            Security Deposit (₹)
          </label>
          <input
            type="number"
            value={securityDeposit}
            onChange={(e) => setSecurityDeposit(e.target.value)}
            placeholder="e.g. 10000"
            className="custom-input"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            Check-In Date
          </label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => setCheckInDate(e.target.value)}
            className="custom-input"
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            Stay Status
          </label>
          <select
            value={stayStatus}
            onChange={(e) => setStayStatus(e.target.value)}
            className="custom-input"
          >
            <option value="ACTIVE">Active Resident</option>
            <option value="NOTICE_PERIOD">Serving Notice</option>
            <option value="CHECKED_OUT">Checkout / Vacate</option>
          </select>
        </div>
      </div>
    </div>
  );
};
