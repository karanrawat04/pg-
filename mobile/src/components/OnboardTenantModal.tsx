import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Property, Bed } from '../types';
import {
  UserPlus,
  X,
  CheckSquare,
  Square,
  Search,
  BedDouble,
  Check,
  Building,
  Wind,
  Layers,
  Sparkles,
} from 'lucide-react';

interface OnboardTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  initialBedId?: string;
  onSuccess: () => void;
}

interface RoomGroup {
  roomId: string;
  roomNumber: string;
  floorName: string;
  floorNumber: number;
  roomType: string;
  baseRent: number;
  hasAc: boolean;
  beds: Bed[];
}

export const OnboardTenantModal: React.FC<OnboardTenantModalProps> = ({
  isOpen,
  onClose,
  property,
  initialBedId,
  onSuccess,
}) => {
  const [vacantBeds, setVacantBeds] = useState<Bed[]>([]);
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>(initialBedId ? [initialBedId] : []);

  // Room search & filtering state
  const [roomSearch, setRoomSearch] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [selectedAcFilter, setSelectedAcFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');

  // Tenant Details
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [idProofNumber, setIdProofNumber] = useState('');

  // Financials
  const [agreedRent, setAgreedRent] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));

  const [loadingBeds, setLoadingBeds] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVacantBeds();
    }
  }, [isOpen, property.id]);

  useEffect(() => {
    if (initialBedId && !selectedBedIds.includes(initialBedId)) {
      setSelectedBedIds([initialBedId]);
    }
  }, [initialBedId]);

  const loadVacantBeds = async () => {
    try {
      setLoadingBeds(true);
      const beds = await api.getVacantBeds(property.id);
      setVacantBeds(beds);

      if (!initialBedId && beds.length > 0 && selectedBedIds.length === 0) {
        setSelectedBedIds([beds[0].id]);
        const initialRent = beds[0].customRent || beds[0].room?.baseRent || 8500;
        setAgreedRent(String(initialRent));
        setSecurityDeposit(String(initialRent * 1.5));
      }
    } catch (err) {
      console.error('Error fetching vacant beds:', err);
    } finally {
      setLoadingBeds(false);
    }
  };

  // Group vacant beds by room
  const roomGroups: RoomGroup[] = useMemo(() => {
    const map = new Map<string, RoomGroup>();

    vacantBeds.forEach((bed) => {
      const room = bed.room;
      const roomId = room?.id || bed.roomId || 'unknown';
      const roomNum = room?.roomNumber || 'Unknown';
      const floorName = room?.floor?.name || `Floor ${room?.floor?.floorNumber ?? ''}`;
      const floorNum = room?.floor?.floorNumber ?? 0;

      if (!map.has(roomId)) {
        map.set(roomId, {
          roomId,
          roomNumber: roomNum,
          floorName,
          floorNumber: floorNum,
          roomType: room?.roomType || 'DOUBLE',
          baseRent: Number(bed.customRent || room?.baseRent || 8000),
          hasAc: Boolean(room?.hasAc),
          beds: [],
        });
      }
      map.get(roomId)!.beds.push(bed);
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.floorNumber !== b.floorNumber) return a.floorNumber - b.floorNumber;
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });
  }, [vacantBeds]);

  // Unique floors for filter chips
  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    roomGroups.forEach((rg) => {
      if (rg.floorName) set.add(rg.floorName);
    });
    return Array.from(set);
  }, [roomGroups]);

  // Filtered room groups
  const filteredRoomGroups = useMemo(() => {
    return roomGroups.filter((group) => {
      // Room number or Floor search
      if (roomSearch.trim()) {
        const query = roomSearch.toLowerCase();
        const matchesRoom = group.roomNumber.toLowerCase().includes(query);
        const matchesFloor = group.floorName.toLowerCase().includes(query);
        const matchesBed = group.beds.some((b) => b.bedNumber.toLowerCase().includes(query));
        if (!matchesRoom && !matchesFloor && !matchesBed) return false;
      }

      // Floor filter
      if (selectedFloor !== 'ALL' && group.floorName !== selectedFloor) {
        return false;
      }

      // Room Type filter
      if (selectedRoomType !== 'ALL' && group.roomType !== selectedRoomType) {
        return false;
      }

      // AC filter
      if (selectedAcFilter === 'AC' && !group.hasAc) return false;
      if (selectedAcFilter === 'NON_AC' && group.hasAc) return false;

      return true;
    });
  }, [roomGroups, roomSearch, selectedFloor, selectedRoomType, selectedAcFilter]);

  const toggleBedSelection = (bed: Bed) => {
    let updated: string[];
    if (selectedBedIds.includes(bed.id)) {
      updated = selectedBedIds.filter((id) => id !== bed.id);
    } else {
      updated = [...selectedBedIds, bed.id];
    }
    setSelectedBedIds(updated);

    // Auto calculate suggested rent
    const totalSuggestedRent = vacantBeds
      .filter((b) => updated.includes(b.id))
      .reduce((sum, b) => sum + (b.customRent || b.room?.baseRent || 8000), 0);

    setAgreedRent(String(totalSuggestedRent));
    setSecurityDeposit(String(totalSuggestedRent * 1.5));
  };

  const toggleSelectAllRoomBeds = (group: RoomGroup) => {
    const roomBedIds = group.beds.map((b) => b.id);
    const allSelected = roomBedIds.every((id) => selectedBedIds.includes(id));

    let updated: string[];
    if (allSelected) {
      // Deselect this room's beds
      updated = selectedBedIds.filter((id) => !roomBedIds.includes(id));
    } else {
      // Select all beds in this room
      const combined = new Set([...selectedBedIds, ...roomBedIds]);
      updated = Array.from(combined);
    }

    setSelectedBedIds(updated);

    const totalSuggestedRent = vacantBeds
      .filter((b) => updated.includes(b.id))
      .reduce((sum, b) => sum + (b.customRent || b.room?.baseRent || 8000), 0);

    setAgreedRent(String(totalSuggestedRent));
    setSecurityDeposit(String(totalSuggestedRent * 1.5));
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !phone.trim()) {
      alert('Tenant Full Name and Phone Number are required.');
      return;
    }

    if (selectedBedIds.length === 0) {
      alert('Please select at least one bed for this tenant.');
      return;
    }

    if (!agreedRent || parseFloat(agreedRent) <= 0) {
      alert('Please specify an agreed monthly rent.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.onboardTenant({
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        emergencyName: emergencyName.trim() || undefined,
        emergencyPhone: emergencyPhone.trim() || undefined,
        permanentAddress: permanentAddress.trim() || undefined,
        workplace: workplace.trim() || undefined,
        idProofType,
        idProofNumber: idProofNumber.trim() || undefined,
        bedIds: selectedBedIds,
        agreedRent: parseFloat(agreedRent),
        securityDeposit: parseFloat(securityDeposit) || parseFloat(agreedRent),
        checkInDate,
      });

      if (res.success) {
        alert(
          `Tenant ${fullName} successfully onboarded! Allocated ${selectedBedIds.length} bed(s) with monthly rent ₹${agreedRent}.`
        );
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to onboard tenant');
      }
    } catch (err: any) {
      alert('Error during tenant onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  // Count unique rooms selected
  const uniqueSelectedRoomsCount = new Set(
    vacantBeds.filter((b) => selectedBedIds.includes(b.id)).map((b) => b.roomId || b.room?.roomNumber)
  ).size;

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div
        className="bottom-sheet-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          overflow: 'hidden',
        }}
      >
        <div className="sheet-drag-handle" />
        {/* Header */}
        <div
          style={{
            padding: '10px 18px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} color="#10b981" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#f8fafc', fontWeight: 800 }}>
                Onboard Resident & Allocate Beds
              </h3>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                {property.name} • {property.genderType} PG
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
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 24px 28px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
          }}
        >
          {/* SECTION 1: SEARCHABLE ROOM & BED BROWSER */}
          <div
            style={{
              background: 'rgba(10, 15, 29, 0.85)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 16,
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={16} color="#818cf8" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#818cf8',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  1. Room & Bed Selection
                </span>
              </div>

              {selectedBedIds.length > 0 && (
                <span
                  style={{
                    background: selectedBedIds.length > 1 ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.2)',
                    border:
                      selectedBedIds.length > 1
                        ? '1px solid rgba(99, 102, 241, 0.5)'
                        : '1px solid rgba(16, 185, 129, 0.5)',
                    color: selectedBedIds.length > 1 ? '#c7d2fe' : '#6ee7b7',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {selectedBedIds.length > 1 && '★'} {selectedBedIds.length} Bed(s) Selected ({uniqueSelectedRoomsCount}{' '}
                  Room)
                </span>
              )}
            </div>

            {/* Room Search Bar */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search
                size={16}
                color="#94a3b8"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search rooms (e.g. 101, 204), bed numbers, or floors..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                className="custom-input"
                style={{
                  paddingLeft: 36,
                  fontSize: 13,
                  background: 'rgba(255, 255, 255, 0.04)',
                }}
              />
            </div>

            {/* Filter Chips: Floors, Sharing Type, AC */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>FILTER:</span>

              {/* Floor Filter */}
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                style={{
                  background: selectedFloor !== 'ALL' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedFloor !== 'ALL' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: selectedFloor !== 'ALL' ? '#e0e7ff' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Floors</option>
                {availableFloors.map((fl) => (
                  <option key={fl} value={fl}>
                    {fl}
                  </option>
                ))}
              </select>

              {/* Room Type Filter */}
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                style={{
                  background: selectedRoomType !== 'ALL' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedRoomType !== 'ALL' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: selectedRoomType !== 'ALL' ? '#e0e7ff' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <option value="ALL">All Sharing Types</option>
                <option value="SINGLE">Single Sharing</option>
                <option value="DOUBLE">Double Sharing</option>
                <option value="TRIPLE">Triple Sharing</option>
                <option value="FOUR_SHARING">Four Sharing</option>
              </select>

              {/* AC Filter */}
              <button
                type="button"
                onClick={() =>
                  setSelectedAcFilter(
                    selectedAcFilter === 'ALL' ? 'AC' : selectedAcFilter === 'AC' ? 'NON_AC' : 'ALL'
                  )
                }
                style={{
                  background: selectedAcFilter !== 'ALL' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: selectedAcFilter !== 'ALL' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: selectedAcFilter !== 'ALL' ? '#e0e7ff' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Wind size={12} />
                {selectedAcFilter === 'ALL' ? 'AC & Non-AC' : selectedAcFilter === 'AC' ? 'AC Only' : 'Non-AC Only'}
              </button>

              {(roomSearch || selectedFloor !== 'ALL' || selectedRoomType !== 'ALL' || selectedAcFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setRoomSearch('');
                    setSelectedFloor('ALL');
                    setSelectedRoomType('ALL');
                    setSelectedAcFilter('ALL');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#f87171',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Room Cards Grid with Grouped Beds */}
            {loadingBeds ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                Loading available rooms and beds...
              </div>
            ) : vacantBeds.length === 0 ? (
              <div
                style={{
                  color: '#f87171',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}
              >
                No vacant beds available in {property.name}. Please create rooms/beds or checkout existing tenants.
              </div>
            ) : filteredRoomGroups.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                No rooms match your search query. Try clearing filters.
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 220,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  paddingRight: 4,
                }}
              >
                {filteredRoomGroups.map((group) => {
                  const roomBedIds = group.beds.map((b) => b.id);
                  const allRoomBedsSelected = roomBedIds.every((id) => selectedBedIds.includes(id));
                  const someRoomBedsSelected =
                    roomBedIds.some((id) => selectedBedIds.includes(id)) && !allRoomBedsSelected;

                  return (
                    <div
                      key={group.roomId}
                      style={{
                        background:
                          allRoomBedsSelected || someRoomBedsSelected
                            ? 'rgba(99, 102, 241, 0.08)'
                            : 'rgba(255, 255, 255, 0.02)',
                        border:
                          allRoomBedsSelected || someRoomBedsSelected
                            ? '1px solid rgba(99, 102, 241, 0.35)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 12,
                        padding: '10px 14px',
                      }}
                    >
                      {/* Room Header inside Onboard Modal */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                          flexWrap: 'wrap',
                          gap: 6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              background: '#6366f1',
                              color: '#fff',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 800,
                            }}
                          >
                            Room {group.roomNumber}
                          </span>
                          <span style={{ fontSize: 12, color: '#cbd5e1', fontWeight: 600 }}>
                            {group.floorName}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: '#94a3b8',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '2px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {group.roomType} {group.hasAc ? '• AC' : ''}
                          </span>
                          <span style={{ fontSize: 11, color: '#34d399', fontWeight: 700 }}>
                            ₹{group.baseRent}/bed
                          </span>
                        </div>

                        {/* 1-Tap Select All Beds in this Room */}
                        {group.beds.length > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleSelectAllRoomBeds(group)}
                            style={{
                              background: allRoomBedsSelected
                                ? 'rgba(99, 102, 241, 0.3)'
                                : 'rgba(255, 255, 255, 0.05)',
                              border: allRoomBedsSelected
                                ? '1px solid #818cf8'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              color: allRoomBedsSelected ? '#fff' : '#cbd5e1',
                              borderRadius: 6,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {allRoomBedsSelected ? '✓ Entire Room Selected' : 'Select Full Room (All Beds)'}
                          </button>
                        )}
                      </div>

                      {/* Beds Pill Checkboxes */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {group.beds.map((bed) => {
                          const isChecked = selectedBedIds.includes(bed.id);
                          return (
                            <div
                              key={bed.id}
                              onClick={() => toggleBedSelection(bed)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: isChecked ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                                border: isChecked ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: 8,
                                padding: '6px 12px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              {isChecked ? (
                                <CheckSquare size={16} color="#a5b4fc" />
                              ) : (
                                <Square size={16} color="#64748b" />
                              )}
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: isChecked ? '#ffffff' : '#cbd5e1',
                                }}
                              >
                                Bed {bed.bedNumber}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: RESIDENT PERSONAL INFORMATION */}
          <div>
            <h4
              style={{
                margin: '0 0 14px 0',
                fontSize: 13,
                color: '#f8fafc',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              2. Resident Personal Information
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="custom-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Workplace / College
                </label>
                <input
                  type="text"
                  placeholder="e.g. Infosys / Christ Univ"
                  value={workplace}
                  onChange={(e) => setWorkplace(e.target.value)}
                  className="custom-input"
                />
              </div>
            </div>

            {/* Emergency Contacts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Emergency Contact Name & Relation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Sharma (Father)"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="custom-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Emergency Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Parent / Guardian Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="custom-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                Permanent Home Address
              </label>
              <input
                type="text"
                placeholder="House No, Street, City, State, Pin Code"
                value={permanentAddress}
                onChange={(e) => setPermanentAddress(e.target.value)}
                className="custom-input"
              />
            </div>

            {/* Govt ID KYC with generous widths */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px, 1.2fr) 2fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  ID Proof Type
                </label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="custom-input"
                  style={{ minWidth: 140 }}
                >
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                  <option value="PAN">PAN Card</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4 }}>
                  Govt ID Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-digit Aadhaar / Passport No"
                  value={idProofNumber}
                  onChange={(e) => setIdProofNumber(e.target.value)}
                  className="custom-input"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: AGREED FINANCIAL TERMS (GENEROUS SPACING - NEVER CLIPS NUMBERS) */}
          <div
            style={{
              background: 'rgba(10, 15, 29, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: 16,
            }}
          >
            <h4
              style={{
                margin: '0 0 12px 0',
                fontSize: 13,
                color: '#f8fafc',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              3. Agreed Financial Terms & Check-in
            </h4>

            {/* 2 Generous Columns for Money Amounts with ₹ Prefix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Monthly Rent (₹) *
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      color: '#818cf8',
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    value={agreedRent}
                    onChange={(e) => setAgreedRent(e.target.value)}
                    required
                    className="custom-input"
                    style={{
                      paddingLeft: 32,
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                  Security Deposit (₹)
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      color: '#34d399',
                      fontWeight: 800,
                      fontSize: 15,
                    }}
                  >
                    ₹
                  </span>
                  <input
                    type="number"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    className="custom-input"
                    style={{
                      paddingLeft: 32,
                      fontSize: 15,
                      fontWeight: 800,
                      color: '#ffffff',
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>
                Check-in Date
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="custom-input"
                style={{ fontSize: 13 }}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting || vacantBeds.length === 0}
            className="btn-success"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 15,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
            }}
          >
            {submitting ? (
              'Onboarding & Allocating...'
            ) : (
              <>
                <Check size={18} />
                Confirm Onboarding ({selectedBedIds.length} Bed{selectedBedIds.length !== 1 ? 's' : ''})
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
