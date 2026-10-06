import React, { useState } from 'react';
import { Bed } from '../../types';
import { api } from '../../api/client';
import { BedDouble, Plus, Trash2, Edit3, User, ShieldAlert, Sparkles } from 'lucide-react';

interface RoomBedsManagerProps {
  roomId: string;
  roomNumber: string;
  baseRent: number;
  beds: Bed[];
  onRefresh: () => void;
  onEditBed?: (bed: Bed) => void;
  onBedAdded?: (newBed: Bed) => void;
  onBedDeleted?: (bedId: string) => void;
}

export const RoomBedsManager: React.FC<RoomBedsManagerProps> = ({
  roomId,
  roomNumber,
  baseRent,
  beds,
  onRefresh,
  onEditBed,
  onBedAdded,
  onBedDeleted,
}) => {
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddBed = async () => {
    try {
      setAdding(true);
      const res = await api.addBedToRoom(roomId, undefined, baseRent);
      if (res.success && res.data) {
        if (onBedAdded) onBedAdded(res.data);
        onRefresh();
      } else {
        alert(res.message || 'Failed to add bed to room');
      }
    } catch (err: any) {
      alert('Error adding bed: ' + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteBed = async (bed: Bed) => {
    if (bed.status === 'OCCUPIED' || (bed.stays && bed.stays.length > 0)) {
      alert('Cannot delete occupied bed. Please checkout the resident first.');
      return;
    }

    if (!confirm(`Are you sure you want to delete Bed ${bed.bedNumber}?`)) return;

    try {
      setDeletingId(bed.id);
      const res = await api.deleteBed(bed.id);
      if (res.success) {
        if (onBedDeleted) onBedDeleted(bed.id);
        onRefresh();
      } else {
        alert(res.message || 'Cannot delete bed');
      }
    } catch (err: any) {
      alert('Error deleting bed: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        borderRadius: 14,
        padding: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
            Beds in this Room ({beds.length})
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>
            Manage bed labels, custom rents, or add extra beds.
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddBed}
          disabled={adding}
          style={{
            background: 'rgba(99, 102, 241, 0.18)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 8,
            color: '#a5b4fc',
            fontSize: 11,
            fontWeight: 700,
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}
        >
          <Plus size={13} /> {adding ? 'Adding...' : '+ Add Bed'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {beds.length === 0 ? (
          <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>
            No beds allocated yet. Tap "+ Add Bed" above.
          </div>
        ) : (
          beds.map((bed) => {
            const isOccupied = bed.status === 'OCCUPIED' && Boolean(bed.stays && bed.stays.length > 0);
            const tenant = bed.stays?.[0]?.tenant;

            return (
              <div
                key={bed.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: isOccupied ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOccupied ? '#fda4af' : '#6ee7b7',
                      fontWeight: 800,
                      fontSize: 11,
                    }}
                  >
                    {bed.bedNumber.split('-')[1] || bed.bedNumber}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                      {bed.bedNumber}
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      {isOccupied ? (
                        <span style={{ color: '#fda4af', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <User size={10} /> {tenant?.user?.fullName || 'Occupied Resident'}
                        </span>
                      ) : (
                        <span>Rent: ₹{bed.customRent || baseRent} • {bed.status}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {onEditBed && (
                    <button
                      type="button"
                      onClick={() => onEditBed(bed)}
                      title="Edit Bed"
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        padding: '4px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      <Edit3 size={11} /> Edit
                    </button>
                  )}

                  {!isOccupied && (
                    <button
                      type="button"
                      disabled={deletingId === bed.id}
                      onClick={() => handleDeleteBed(bed)}
                      title="Delete Bed"
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        padding: '4px 6px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
