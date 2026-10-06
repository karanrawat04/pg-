import React from 'react';
import { Phone, Briefcase, MapPin } from 'lucide-react';

interface TenantEmergencyFieldsProps {
  emergencyName: string;
  setEmergencyName: (val: string) => void;
  emergencyPhone: string;
  setEmergencyPhone: (val: string) => void;
  workplace: string;
  setWorkplace: (val: string) => void;
  permanentAddress: string;
  setPermanentAddress: (val: string) => void;
}

export const TenantEmergencyFields: React.FC<TenantEmergencyFieldsProps> = ({
  emergencyName,
  setEmergencyName,
  emergencyPhone,
  setEmergencyPhone,
  workplace,
  setWorkplace,
  permanentAddress,
  setPermanentAddress,
}) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Phone size={15} color="#f87171" /> Emergency Contact & Workplace
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            Guardian / Contact Name
          </label>
          <input
            type="text"
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            placeholder="Parent or Guardian"
            className="custom-input"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
            Emergency Phone
          </label>
          <input
            type="tel"
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            placeholder="Guardian Phone"
            className="custom-input"
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
          Workplace / College
        </label>
        <input
          type="text"
          value={workplace}
          onChange={(e) => setWorkplace(e.target.value)}
          placeholder="Company or University"
          className="custom-input"
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
          Permanent Home Address
        </label>
        <textarea
          value={permanentAddress}
          onChange={(e) => setPermanentAddress(e.target.value)}
          rows={2}
          placeholder="City, State, Pin Code"
          className="custom-input"
          style={{ resize: 'vertical' }}
        />
      </div>
    </div>
  );
};
