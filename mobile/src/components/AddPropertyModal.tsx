import React, { useState } from 'react';
import { api } from '../api/client';
import { Property } from '../types';
import { Building2, X, Plus, Sparkles } from 'lucide-react';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProperty: Property) => void;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [address, setAddress] = useState('');
  const [genderType, setGenderType] = useState<'MALE' | 'FEMALE' | 'UNISEX'>('UNISEX');
  const [upperFloors, setUpperFloors] = useState<number>(3);
  const [includeGroundFloor, setIncludeGroundFloor] = useState<boolean>(true);
  const [includeBasement, setIncludeBasement] = useState<boolean>(false);
  const [amenities, setAmenities] = useState<string[]>([
    'High Speed WiFi',
    'Daily Housekeeping',
    'RO Water',
    'CCTV Security',
  ]);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const allAvailableAmenities = [
    'High Speed WiFi',
    'Daily Housekeeping',
    'RO Water',
    'CCTV Security',
    'Washing Machine',
    'AC Rooms',
    'Power Backup',
    'Gym & Lounge',
    'Biometric Access',
    'Daily Meals',
  ];

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  // Compute live floor structure preview
  const previewFloors: string[] = [];
  if (includeBasement) previewFloors.push('Basement (B1)');
  if (includeGroundFloor) previewFloors.push('Ground Floor');
  for (let i = 1; i <= Math.min(upperFloors, 50); i++) {
    previewFloors.push(i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      alert('Property Name and City are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createProperty({
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        genderType,
        totalFloors: Math.max(0, upperFloors),
        hasGroundFloor: includeGroundFloor,
        hasBasement: includeBasement,
        amenities,
      });

      if (res.success) {
        alert(`Property "${res.data.name}" created with ${res.data.totalFloors || res.data.floors?.length || previewFloors.length} floors!`);
        onSuccess(res.data);
        onClose();
      } else {
        alert(res.message || 'Failed to create property');
      }
    } catch (err: any) {
      alert('Error creating property');
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
              <Building2 size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Add New Building / Property
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Scalable multi-floor architecture
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
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Property / Building Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Royal Palms Luxury Coliving"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="custom-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                City *
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="custom-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Gender Type
              </label>
              <select
                value={genderType}
                onChange={(e) => setGenderType(e.target.value as any)}
                className="custom-input"
              >
                <option value="UNISEX">Coliving (Unisex)</option>
                <option value="MALE">Boys PG</option>
                <option value="FEMALE">Girls PG</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Full Address
            </label>
            <input
              type="text"
              placeholder="e.g. Plot 15, 27th Main, Sector 1, HSR Layout"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="custom-input"
            />
          </div>

          {/* Unlimited Floor Engine with Ground & Basement Controls */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Building Floor Structure
              </label>
              <span style={{ fontSize: 12, color: '#34d399', fontWeight: 700 }}>
                {previewFloors.length} Total Floors
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: includeGroundFloor ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: includeGroundFloor ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: includeGroundFloor ? '#e0e7ff' : '#94a3b8',
              }}>
                <input
                  type="checkbox"
                  checked={includeGroundFloor}
                  onChange={(e) => setIncludeGroundFloor(e.target.checked)}
                  style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                />
                Include Ground Floor (Floor 0)
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: includeBasement ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: includeBasement ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 700,
                color: includeBasement ? '#e0e7ff' : '#94a3b8',
              }}>
                <input
                  type="checkbox"
                  checked={includeBasement}
                  onChange={(e) => setIncludeBasement(e.target.checked)}
                  style={{ accentColor: '#6366f1', width: 16, height: 16 }}
                />
                Include Basement (B1)
              </label>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Number of Upper Floors (1 to 50+)
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={upperFloors}
                  onChange={(e) => setUpperFloors(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="custom-input"
                  style={{ width: 100, textAlign: 'center', fontWeight: 800, fontSize: 16 }}
                />
                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUpperFloors(preset)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: upperFloors === preset ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                        background: upperFloors === preset ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                        color: upperFloors === preset ? '#fff' : '#94a3b8',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {preset}F
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generated Floors Live Preview */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 11,
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}>
              <span style={{ color: '#818cf8', fontWeight: 700 }}>Floors:</span>
              {previewFloors.slice(0, 8).map((f) => (
                <span key={f} style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: 4 }}>
                  {f}
                </span>
              ))}
              {previewFloors.length > 8 && (
                <span style={{ color: '#94a3b8' }}>+{previewFloors.length - 8} more...</span>
              )}
            </div>
          </div>

          {/* Amenities */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
              Amenities Offered
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allAvailableAmenities.map((amenity) => {
                const selected = amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      border: selected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                      background: selected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: selected ? '#a5b4fc' : '#94a3b8',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {selected ? '✓ ' : '+ '}
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            {submitting ? 'Creating Property...' : 'Save & Initialize Building'}
          </button>
        </form>
      </div>
    </div>
  );
};
