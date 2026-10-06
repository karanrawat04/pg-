import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Property } from '../types';
import { Building2, Trash2, X, AlertTriangle, MapPin, Check, Layers, Sparkles } from 'lucide-react';

interface EditPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSuccess: () => void;
  onDeleted?: () => void;
}

const ALL_AMENITIES = [
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

export const EditPropertyModal: React.FC<EditPropertyModalProps> = ({
  isOpen,
  onClose,
  property,
  onSuccess,
  onDeleted,
}) => {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [genderType, setGenderType] = useState('UNISEX');
  const [upperFloors, setUpperFloors] = useState<number>(3);
  const [includeGroundFloor, setIncludeGroundFloor] = useState<boolean>(true);
  const [includeBasement, setIncludeBasement] = useState<boolean>(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (property) {
      setName(property.name || '');
      setCity(property.city || '');
      setAddress(property.address || '');
      setGenderType(property.genderType || 'UNISEX');
      setSelectedAmenities(property.amenities || []);
      setShowDeleteConfirm(false);

      // Load precise existing floor setup from backend
      api.getPropertyById(property.id).then((fullProp) => {
        if (fullProp && Array.isArray(fullProp.floors)) {
          const hasB1 = fullProp.floors.some((f: any) => f.floorNumber === -1);
          const hasG = fullProp.floors.some((f: any) => f.floorNumber === 0);
          const uppers = fullProp.floors.filter((f: any) => f.floorNumber > 0).length;
          setIncludeBasement(hasB1);
          setIncludeGroundFloor(hasG);
          setUpperFloors(uppers);
        } else {
          setIncludeGroundFloor(true);
          setIncludeBasement(false);
          setUpperFloors(Math.max(1, (property.totalFloors || 1) - 1));
        }
      }).catch(() => {
        setIncludeGroundFloor(true);
        setIncludeBasement(false);
        setUpperFloors(Math.max(1, (property.totalFloors || 1) - 1));
      });
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  // Compute live floor structure preview
  const previewFloors: string[] = [];
  if (includeBasement) previewFloors.push('Basement (B1)');
  if (includeGroundFloor) previewFloors.push('Ground Floor');
  for (let i = 1; i <= Math.min(upperFloors, 50); i++) {
    previewFloors.push(i === 1 ? '1st Floor' : i === 2 ? '2nd Floor' : i === 3 ? '3rd Floor' : `${i}th Floor`);
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim()) {
      alert('Building name and city are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateProperty(property.id, {
        name: name.trim(),
        city: city.trim(),
        address: address.trim(),
        genderType,
        hasGroundFloor: includeGroundFloor,
        hasBasement: includeBasement,
        upperFloors: upperFloors,
        amenities: selectedAmenities,
      });

      if (res.success) {
        alert('Building details and floor configuration updated successfully!');
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to update building');
      }
    } catch (err: any) {
      alert('Error updating building: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await api.deleteProperty(property.id);
      if (res.success) {
        alert(`Building "${property.name}" deleted successfully.`);
        if (onDeleted) onDeleted();
        else onSuccess();
        onClose();
      } else {
        alert(res.message || 'Cannot delete building');
      }
    } catch (err: any) {
      alert('Error deleting building: ' + err.message);
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
              <Building2 size={18} color="#818cf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Edit Building
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {property.name} ({property.city})
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
        <form onSubmit={handleUpdate} style={{ padding: '20px 24px', maxHeight: '74vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
              Building Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="custom-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="custom-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                PG Type
              </label>
              <select
                value={genderType}
                onChange={(e) => setGenderType(e.target.value)}
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
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, Landmark, Sector"
              className="custom-input"
            />
          </div>

          {/* Floor Architecture Engine (Ground, Basement, Upper Floors) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Building Floor Architecture
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
                Number of Upper Floors (0 to 50+)
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={upperFloors}
                  onChange={(e) => setUpperFloors(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="custom-input"
                  style={{ width: 90, textAlign: 'center', fontWeight: 800, fontSize: 16 }}
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

          {/* Amenities Selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>
              Building Amenities
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ALL_AMENITIES.map((amenity) => {
                const isSelected = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 10,
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#a5b4fc' : '#cbd5e1',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{amenity}</span>
                    {isSelected && <Check size={14} color="#818cf8" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '13px' }}
            >
              {submitting ? 'Saving Changes...' : 'Save Building Changes'}
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
                <Trash2 size={16} /> Delete Building
              </button>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  <AlertTriangle size={18} /> Confirm Building Deletion
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 }}>
                  Are you sure you want to delete <strong>"{property.name}"</strong>? All associated floors and vacant rooms will be deleted. Buildings with active residents cannot be deleted.
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
                    {deleting ? 'Deleting...' : 'Yes, Delete Building'}
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
