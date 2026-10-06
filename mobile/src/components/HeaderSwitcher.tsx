import React, { useState, useMemo } from 'react';
import { Property, AuthUser } from '../types';
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  MapPin,
  Sparkles,
  Search,
  X,
  Wifi,
  Battery,
  Signal,
  Edit3,
  LogOut,
  Crown,
  CreditCard,
} from 'lucide-react';


interface HeaderSwitcherProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
  activeRole: 'OWNER' | 'TENANT';
  currentUser?: AuthUser | null;
  onLogout?: () => void;
  onOpenAddProperty?: () => void;
  onEditProperty?: (property: Property) => void;
  onOpenSubscription?: () => void;
  onOpenPaymentSettings?: () => void;
}

export const HeaderSwitcher: React.FC<HeaderSwitcherProps> = ({
  properties,
  selectedProperty,
  onSelectProperty,
  activeRole,
  currentUser,
  onLogout,
  onOpenAddProperty,
  onEditProperty,
  onOpenSubscription,
  onOpenPaymentSettings,
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [propertySearch, setPropertySearch] = useState('');

  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) return properties;
    const q = propertySearch.toLowerCase();
    return properties.filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q));
  }, [properties, propertySearch]);

  return (
    <>
      {/* Mobile Top Status Bar Mock */}
      {/* <div className="mobile-status-bar">
        <span>09:41</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Signal size={12} />
          <Wifi size={12} />
          <Battery size={14} />
        </div>
      </div> */}

      {/* Mobile App Header */}
      <header className="mobile-app-header">
        <div className="mobile-header-inner">
          {/* Left: Responsive Building Switcher Chip */}
          <button
            type="button"
            onClick={() => setIsSheetOpen(true)}
            className="header-property-chip"
            aria-label="Switch PG Building"
          >
            <div className="header-property-icon">
              <Building2 size={15} color="#fff" />
            </div>

            <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
              }}>
                {selectedProperty?.name || 'Select Building'}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={9} style={{ flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {selectedProperty?.city || 'Select'} • {selectedProperty?.genderType || 'PG'}
                </span>
              </div>
            </div>

            <ChevronDown size={14} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 2 }} />
          </button>

          {/* Right: Quick Action Buttons & Logout (Owner Badge Removed) */}
          <div className="header-actions-group">
            {activeRole === 'OWNER' && onOpenSubscription && (
              <button
                type="button"
                onClick={onOpenSubscription}
                className="header-action-btn header-plan-btn"
                title="Manage SaaS Plan & Subscription"
              >
                <Crown size={12} color="#c084fc" />
                <span className="header-btn-label-hide-xs">Plan</span>
              </button>
            )}

            {activeRole === 'OWNER' && onOpenPaymentSettings && (
              <button
                type="button"
                onClick={onOpenPaymentSettings}
                className="header-action-btn header-pay-btn"
                title="Configure Tenant Payment Gateway & UPI"
              >
                <CreditCard size={12} color="#38bdf8" />
                <span className="header-btn-label-hide-xs">Pay Setup</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="header-logout-btn"
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Sheet: Building Switcher */}
      {isSheetOpen && (
        <div
          className="bottom-sheet-overlay"
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            className="bottom-sheet-content"
            onClick={(e) => e.stopPropagation()}
            style={{ padding: '0 16px 24px' }}
          >
            <div className="sheet-drag-handle" />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f8fafc' }}>
                  Switch Building
                </h3>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>
                  {properties.length} PG Properties Registered
                </span>
              </div>
              <button
                onClick={() => setIsSheetOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input in Bottom Sheet */}
            {properties.length > 1 && (
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={14} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search building name or city..."
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  className="custom-input"
                  style={{ paddingLeft: 34, fontSize: 13, padding: '9px 12px 9px 34px' }}
                />
              </div>
            )}

            {/* Buildings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '55vh', overflowY: 'auto' }}>
              {filteredProperties.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#64748b', fontSize: 13 }}>
                  No buildings match "{propertySearch}"
                </div>
              ) : (
                filteredProperties.map((p) => {
                  const isSelected = p.id === selectedProperty?.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        onSelectProperty(p);
                        setIsSheetOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          background: isSelected ? '#6366f1' : 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Building2 size={18} color={isSelected ? '#fff' : '#cbd5e1'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? '#fff' : '#f8fafc' }}>
                            {p.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                            {p.city} • {p.genderType} PG • {p.totalFloors || p.floors?.length || 1} Floors
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {onEditProperty && activeRole === 'OWNER' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsSheetOpen(false);
                              onEditProperty(p);
                            }}
                            title="Edit Building"
                            style={{
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              borderRadius: 8,
                              padding: '5px 8px',
                              color: '#94a3b8',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <Edit3 size={12} color="#38bdf8" /> Edit
                          </button>
                        )}

                        {isSelected && (
                          <div style={{
                            background: '#6366f1',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Check size={14} color="#fff" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Building CTA inside bottom sheet (Restricted to OWNER only) */}
            {onOpenAddProperty && activeRole === 'OWNER' && (
              <button
                onClick={() => {
                  setIsSheetOpen(false);
                  onOpenAddProperty();
                }}
                className="btn-primary"
                style={{ width: '100%', marginTop: 14, padding: '12px' }}
              >
                <Plus size={16} /> Add New PG Building
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
