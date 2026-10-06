import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Room, Floor, Bed } from '../types';
import { Edit3, Trash2, X, AlertTriangle, Layers, Wind } from 'lucide-react';
import { RoomBedsManager } from './edit/RoomBedsManager';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  floors: Floor[];
  onSuccess: () => void;
  onEditBed?: (bed: Bed) => void;
  onRefreshRoom?: () => void;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  floors,
  onSuccess,
  onEditBed,
  onRefreshRoom,
}) => {
  const [roomName, setRoomName] = useState('');
  const [floorId, setFloorId] = useState('');
  const [roomType, setRoomType] = useState('DOUBLE');
  const [baseRent, setBaseRent] = useState('');
  const [hasAc, setHasAc] = useState(false);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (room) {
      setRoomName(room.roomNumber || '');
      setFloorId(room.floorId || (floors[0]?.id ?? ''));
      setRoomType(room.roomType || 'DOUBLE');
      setBaseRent(room.baseRent ? String(room.baseRent) : '8500');
      setHasAc(Boolean(room.hasAc));
      setBeds(room.beds ? [...room.beds] : []);
      setShowDeleteConfirm(false);
    }
  }, [room, floors]);

  if (!isOpen || !room) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      alert('Room Name cannot be empty.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.updateRoom(room.id, {
        roomNumber: roomName.trim(),
        floorId: floorId || undefined,
        roomType,
        baseRent: parseFloat(baseRent) || undefined,
        hasAc,
      });

      if (res.success) {
        alert('Room updated successfully!');
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to update room');
      }
    } catch (err: any) {
      alert('Error updating room: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const res = await api.deleteRoom(room.id);
      if (res.success) {
        alert(`Room "${room.roomNumber}" and its vacant beds were deleted successfully.`);
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Cannot delete room');
      }
    } catch (err: any) {
      alert('Error deleting room: ' + err.message);
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
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Edit3 size={18} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Edit Room
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Room {room.roomNumber} ({room.roomType?.replace('_', ' ')})
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
          {/* Select Floor & Room Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Assigned Floor
              </label>
              <select
                value={floorId}
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

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Room Name *
              </label>
              <input
                type="text"
                placeholder="e.g. 101, G-02, Penthouse A"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
                className="custom-input"
              />
            </div>
          </div>

          {/* Sharing Type & Base Rent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Room Sharing Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="custom-input"
              >
                <option value="SINGLE">Single Sharing (1 Bed)</option>
                <option value="DOUBLE">2-Sharing (2 Beds)</option>
                <option value="TRIPLE">3-Sharing (3 Beds)</option>
                <option value="FOUR_SHARING">4-Sharing (4 Beds)</option>
              </select>
            </div>

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
          </div>

          {/* Climate Control AC toggle */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              color: '#f8fafc',
              fontSize: 13,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <input
                type="checkbox"
                checked={hasAc}
                onChange={(e) => setHasAc(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#6366f1' }}
              />
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Wind size={15} color="#38bdf8" /> Air Conditioned Room (AC)
              </span>
            </label>
          </div>

          {/* Beds in Room Manager */}
          <RoomBedsManager
            roomId={room.id}
            roomNumber={roomName}
            baseRent={parseFloat(baseRent) || 8500}
            beds={beds}
            onBedAdded={(newBed) => setBeds((prev) => [...prev, newBed])}
            onBedDeleted={(bedId) => setBeds((prev) => prev.filter((b) => b.id !== bedId))}
            onRefresh={() => {
              if (onRefreshRoom) onRefreshRoom();
              else onSuccess();
            }}
            onEditBed={(b) => {
              if (onEditBed) onEditBed(b);
              onClose();
            }}
          />

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
              style={{ width: '100%', padding: '13px' }}
            >
              {submitting ? 'Saving Changes...' : 'Save Room Changes'}
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
                <Trash2 size={16} /> Delete Room
              </button>
            ) : (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 12,
                padding: '14px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f87171', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  <AlertTriangle size={18} /> Confirm Deletion
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 }}>
                  Are you sure you want to delete Room <strong>"{room.roomNumber}"</strong>? All vacant beds in this room will be permanently removed. Rooms with active residents cannot be deleted.
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
                    {deleting ? 'Deleting...' : 'Yes, Delete Room'}
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
