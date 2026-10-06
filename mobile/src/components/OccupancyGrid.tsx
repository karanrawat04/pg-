import React from 'react';
import { Floor, Bed, Room } from '../types';
import { BedDouble, CheckCircle2, User, AlertCircle, Wrench, Plus, Sparkles, Wind, Edit3 } from 'lucide-react';

interface OccupancyGridProps {
  floors: Floor[];
  onSelectBed?: (bed: Bed) => void;
  onAddRoomToFloor?: (floorId: string) => void;
  onEditRoom?: (room: Room) => void;
}

export const OccupancyGrid: React.FC<OccupancyGridProps> = ({
  floors,
  onSelectBed,
  onAddRoomToFloor,
  onEditRoom,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {floors.map((floor) => {
        const totalFloorBeds = floor.rooms.reduce((sum, r) => sum + r.beds.length, 0);
        const occupiedFloorBeds = floor.rooms.reduce(
          (sum, r) => sum + r.beds.filter((b) => b.status === 'OCCUPIED').length,
          0
        );
        const floorOccupancyPct = totalFloorBeds > 0 ? Math.round((occupiedFloorBeds / totalFloorBeds) * 100) : 0;

        return (
          <div
            key={floor.id}
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 16,
              padding: 14,
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* Floor Header Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 18,
              paddingBottom: 14,
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  padding: '4px 12px',
                  borderRadius: 20,
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: '#a5b4fc',
                  fontSize: 13,
                  fontWeight: 800,
                }}>
                  {floor.name || `Floor ${floor.floorNumber}`}
                </div>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                  {floor.rooms.length} Rooms • {occupiedFloorBeds}/{totalFloorBeds} Beds Occupied
                </span>
              </div>

              {/* Progress Bar & Add Room Shortcut */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 100,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${floorOccupancyPct}%`,
                      height: '100%',
                      background: floorOccupancyPct > 80 ? '#10b981' : '#6366f1',
                      borderRadius: 3,
                    }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
                    {floorOccupancyPct}%
                  </span>
                </div>

                {onAddRoomToFloor && (
                  <button
                    onClick={() => onAddRoomToFloor(floor.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      padding: '5px 10px',
                      color: '#cbd5e1',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <Plus size={14} color="#60a5fa" /> Add Room
                  </button>
                )}
              </div>
            </div>

            {/* Rooms Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: 12,
            }}>
              {floor.rooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    background: 'rgba(10, 15, 29, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 14,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Room Card Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <BedDouble size={16} color="#818cf8" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: '#ffffff' }}>
                          Room {room.roomNumber}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          ₹{room.baseRent.toLocaleString()} / bed
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {room.hasAc && (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          background: 'rgba(59, 130, 246, 0.15)',
                          color: '#93c5fd',
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '3px 7px',
                          borderRadius: 6,
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}>
                          <Wind size={10} /> AC
                        </span>
                      )}
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#cbd5e1',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '3px 7px',
                        borderRadius: 6,
                      }}>
                        {room.roomType.replace('_', ' ')}
                      </span>

                      {onEditRoom && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditRoom(room);
                          }}
                          title="Edit Room"
                          style={{
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.35)',
                            borderRadius: 6,
                            padding: '3px 6px',
                            color: '#38bdf8',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginLeft: 2,
                          }}
                        >
                          <Edit3 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Beds Stack in this Room */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {room.beds.map((bed) => {
                      const isOccupied = bed.status === 'OCCUPIED' && Boolean(bed.stays && bed.stays.length > 0);
                      const tenantInfo = bed.stays?.[0]?.tenant?.user;

                      return (
                        <div
                          key={bed.id}
                          onClick={() => onSelectBed && onSelectBed(bed)}
                          style={{
                            background: isOccupied
                              ? 'linear-gradient(90deg, rgba(244, 63, 94, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)'
                              : 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.8) 100%)',
                            border: isOccupied
                              ? '1px solid rgba(244, 63, 94, 0.3)'
                              : '1px solid rgba(16, 185, 129, 0.3)',
                            borderRadius: 10,
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              background: isOccupied ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: isOccupied ? '#f43f5e' : '#10b981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 12,
                            }}>
                              {bed.bedNumber.split('-')[1] || bed.bedNumber}
                            </div>

                            <div>
                              <div style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc' }}>
                                Bed {bed.bedNumber}
                              </div>
                              {tenantInfo ? (
                                <div style={{ fontSize: 11, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <User size={10} color="#94a3b8" />
                                  {tenantInfo.fullName}
                                </div>
                              ) : (
                                <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>
                                  ₹{bed.customRent || room.baseRent} / mo
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Pill Tag */}
                          <div style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            background: isOccupied ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: isOccupied ? '#fda4af' : '#6ee7b7',
                          }}>
                            {isOccupied ? 'Occupied' : '+ Vacant'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
