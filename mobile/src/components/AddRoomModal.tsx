import React, { useState } from 'react';
import { api } from '../api/client';
import { Property, Floor } from '../types';
import { BedDouble, X, Wind } from 'lucide-react';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  floors: Floor[];
  onSuccess: () => void;
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({
  isOpen,
  onClose,
  property,
  floors,
  onSuccess,
}) => {
  const [floorId, setFloorId] = useState(floors[0]?.id || '');
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('DOUBLE');
  const [baseRent, setBaseRent] = useState('8500');
  const [hasAc, setHasAc] = useState(true);
  const [bedCount, setBedCount] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRoomTypeChange = (type: string) => {
    setRoomType(type);
    if (type === 'SINGLE') {
      setBedCount(1);
      setBaseRent('14000');
    } else if (type === 'DOUBLE') {
      setBedCount(2);
      setBaseRent('8500');
    } else if (type === 'TRIPLE') {
      setBedCount(3);
      setBaseRent('7000');
    } else if (type === 'FOUR_SHARING') {
      setBedCount(4);
      setBaseRent('6000');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNumber.trim()) {
      alert('Room Number is required.');
      return;
    }

    const selectedFloorId = floorId || floors[0]?.id;
    if (!selectedFloorId) {
      alert('Please add a floor to this property first.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createRoom({
        propertyId: property.id,
        floorId: selectedFloorId,
        roomNumber: roomNumber.trim(),
        roomType,
        baseRent: parseFloat(baseRent) || 8000,
        hasAc,
        bedCount,
      });

      if (res.success) {
        alert(`Room ${roomNumber} created with ${bedCount} beds mapped!`);
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to create room');
      }
    } catch (err: any) {
      alert('Error creating room');
    } finally {
      setSubmitting(false);
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
              <BedDouble size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Add Room & Map Beds
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {property.name}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Select Floor */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Select Floor *
            </label>
            <select
              value={floorId || (floors[0]?.id ?? '')}
              onChange={(e) => setFloorId(e.target.value)}
              className="custom-input"
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name || `Floor ${f.floorNumber}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Room Name *
              </label>
              <input
                type="text"
                placeholder="e.g. 101, G-02, Penthouse A"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Room Sharing Type
              </label>
              <select
                value={roomType}
                onChange={(e) => handleRoomTypeChange(e.target.value)}
                className="custom-input"
              >
                <option value="SINGLE">Single Sharing (1 Bed)</option>
                <option value="DOUBLE">Double Sharing (2 Beds)</option>
                <option value="TRIPLE">Triple Sharing (3 Beds)</option>
                <option value="FOUR_SHARING">4-Sharing (4 Beds)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Base Rent Per Bed (₹)
              </label>
              <input
                type="number"
                value={baseRent}
                onChange={(e) => setBaseRent(e.target.value)}
                className="custom-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Bed Count (Auto-Mapped)
              </label>
              <input
                type="number"
                value={bedCount}
                disabled
                title="Bed count is automatically mapped from room sharing type"
                className="custom-input"
                style={{ opacity: 0.7, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.03)' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: '#f8fafc',
              fontSize: 14,
              fontWeight: 600,
            }}>
              <input
                type="checkbox"
                checked={hasAc}
                onChange={(e) => setHasAc(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#6366f1' }}
              />
              Air Conditioned Room (AC)
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {submitting ? 'Generating Room & Beds...' : `Generate Room & ${bedCount} Beds`}
          </button>
        </form>
      </div>
    </div>
  );
};
