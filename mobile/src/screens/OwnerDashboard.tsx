import React, { useState, useEffect, useMemo } from 'react';
import { Property, DashboardStats, Floor, Complaint, Invoice, Tenant, Bed, Room, OwnerSubscriptionDetails } from '../types';
import { api } from '../api/client';
import { OccupancyGrid } from '../components/OccupancyGrid';
import { AddPropertyModal } from '../components/AddPropertyModal';
import { AddRoomModal } from '../components/AddRoomModal';
import { EditRoomModal } from '../components/EditRoomModal';
import { EditTenantModal } from '../components/EditTenantModal';
import { ReviseRentModal } from '../components/ReviseRentModal';
import { OnboardTenantModal } from '../components/OnboardTenantModal';
import { BedDetailsModal } from '../components/BedDetailsModal';
import { EditBedModal } from '../components/EditBedModal';
import { OwnerPaymentSettingsModal } from '../components/payment/OwnerPaymentSettingsModal';
import {
  Users,
  CreditCard,
  AlertTriangle,
  Layers,
  FileText,
  MessageSquare,
  Send,
  RefreshCw,
  Plus,
  UserPlus,
  BedDouble,
  Building2,
  Phone,
  Briefcase,
  MapPin,
  ShieldCheck,
  LogOut,
  Search,
  X,
  Filter,
  CheckCircle2,
  Maximize2,
  Zap,
  Edit3,
  Trash2,
  TrendingUp,
  Crown,
  ArrowRight,
} from 'lucide-react';

interface OwnerDashboardProps {
  property: Property;
  onRefreshProperties: () => void;
  onOpenAddProperty: () => void;
  onOpenSubscription?: () => void;
  onOpenPaymentSettings?: () => void;
  onEditProperty?: (property: Property) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  property,
  onRefreshProperties,
  onOpenAddProperty,
  onOpenSubscription,
  onOpenPaymentSettings,
  onEditProperty,
}) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'TENANTS' | 'FINANCIALS' | 'COMPLAINTS'>('INVENTORY');
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [subDetails, setSubDetails] = useState<OwnerSubscriptionDetails | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters for Bed Matrix (Tab 1)
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixFloorFilter, setMatrixFloorFilter] = useState('ALL');
  const [matrixVacancyFilter, setMatrixVacancyFilter] = useState<'ALL' | 'VACANT' | 'OCCUPIED' | 'MAINTENANCE'>('ALL');
  const [matrixRoomTypeFilter, setMatrixRoomTypeFilter] = useState<string>('ALL');
  const [matrixAcFilter, setMatrixAcFilter] = useState<'ALL' | 'AC' | 'NON_AC'>('ALL');

  // Filters for Tenants (Tab 2)
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStayFilter, setTenantStayFilter] = useState<'ALL' | 'MULTI_BED' | 'ACTIVE' | 'NOTICE_PERIOD'>('ALL');

  // Filters for Invoices & Ledger (Tab 3)
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'OVERDUE' | 'PENDING' | 'PAID' | 'PARTIALLY_PAID'>('ALL');

  // Filters for Maintenance (Tab 4)
  const [complaintSearch, setComplaintSearch] = useState('');
  const [complaintStatusFilter, setComplaintStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'>('ALL');
  const [complaintCategoryFilter, setComplaintCategoryFilter] = useState<string>('ALL');

  // Lightbox modal for complaint images
  const [previewMediaUrl, setPreviewMediaUrl] = useState<string | null>(null);

  // Quick Action Sheet state (opened by mobile FAB)
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  // Modals state
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);
  const [selectedTenantForEdit, setSelectedTenantForEdit] = useState<Tenant | null>(null);
  const [selectedTenantForReviseRent, setSelectedTenantForReviseRent] = useState<Tenant | null>(null);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [selectedBedForOnboard, setSelectedBedForOnboard] = useState<string | undefined>(undefined);
  const [selectedBedForDetails, setSelectedBedForDetails] = useState<Bed | null>(null);
  const [selectedBedForEdit, setSelectedBedForEdit] = useState<Bed | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, floorsData, tenantsData, complaintsData, invoicesData, subData] = await Promise.all([
        api.getPropertyDashboard(property.id),
        api.getInventoryGrid(property.id),
        api.getTenants(property.id),
        api.getComplaints(property.id),
        api.getInvoices(property.id),
        api.getMySubscription().catch(() => null),
      ]);

      setStats(statsData);
      setFloors(floorsData);
      setTenants(tenantsData);
      setComplaints(complaintsData);
      setInvoices(invoicesData);
      if (subData) {
        setSubDetails(subData);
      }

      if (selectedRoomForEdit && Array.isArray(floorsData)) {
        const freshRoom = floorsData.flatMap((f: Floor) => f.rooms).find((r: Room) => r.id === selectedRoomForEdit.id);
        if (freshRoom) setSelectedRoomForEdit(freshRoom);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [property.id]);

  const handleUpdateComplaint = async (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      await api.updateComplaintStatus(id, newStatus);
      loadData();
    } catch (err) {
      alert('Failed to update complaint status');
    }
  };

  const handleRecordCash = async (invoiceId: string, amount: number) => {
    if (confirm(`Confirm cash receipt of ₹${amount.toLocaleString()}? This will update the invoice to PAID.`)) {
      await api.recordCashPayment(invoiceId, amount);
      loadData();
    }
  };

  const handleCheckoutTenant = async (tenantId: string, tenantName: string) => {
    if (confirm(`Checkout ${tenantName}? All beds allocated to this resident will be vacated immediately.`)) {
      try {
        const res = await api.checkoutTenant(tenantId);
        if (res.success) {
          alert('Tenant checked out and beds released.');
          loadData();
          onRefreshProperties();
        } else {
          alert(res.message || 'Error checking out tenant');
        }
      } catch (err) {
        alert('Error during checkout');
      }
    }
  };

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (confirm(`Permanently delete resident "${tenantName}"? All their occupied beds will become VACANT immediately and invoice history will be purged.`)) {
      try {
        const res = await api.deleteTenant(tenantId);
        if (res.success) {
          alert('Resident record deleted successfully and beds released.');
          loadData();
          onRefreshProperties();
        } else {
          alert(res.message || 'Cannot delete resident');
        }
      } catch (err: any) {
        alert('Error deleting resident: ' + err.message);
      }
    }
  };

  // 1. FILTERED FLOORS FOR TAB 1 (BED MATRIX)
  const filteredFloors = useMemo(() => {
    const q = matrixSearch.trim().toLowerCase();

    return floors
      .filter((floor) => {
        if (matrixFloorFilter !== 'ALL' && floor.id !== matrixFloorFilter) return false;
        return true;
      })
      .map((floor) => {
        const matchingRooms = floor.rooms.filter((room) => {
          if (matrixRoomTypeFilter !== 'ALL' && room.roomType !== matrixRoomTypeFilter) return false;
          if (matrixAcFilter === 'AC' && !room.hasAc) return false;
          if (matrixAcFilter === 'NON_AC' && room.hasAc) return false;

          if (matrixVacancyFilter !== 'ALL') {
            const hasMatchingBed = room.beds.some((b) => b.status === matrixVacancyFilter);
            if (!hasMatchingBed) return false;
          }

          if (q) {
            const matchesRoom = room.roomNumber.toLowerCase().includes(q);
            const matchesFloor = (floor.name || '').toLowerCase().includes(q);
            const matchesBed = room.beds.some((b) => b.bedNumber.toLowerCase().includes(q));
            const matchesTenant = room.beds.some((b) =>
              b.stays?.some((s) => s.tenant.user.fullName.toLowerCase().includes(q) || s.tenant.user.phone.includes(q))
            );
            if (!matchesRoom && !matchesFloor && !matchesBed && !matchesTenant) {
              return false;
            }
          }

          return true;
        });

        return {
          ...floor,
          rooms: matchingRooms,
        };
      })
      .filter((floor) => floor.rooms.length > 0 || (matrixFloorFilter === floor.id && !matrixSearch));
  }, [floors, matrixSearch, matrixFloorFilter, matrixVacancyFilter, matrixRoomTypeFilter, matrixAcFilter]);

  const totalMatchingRooms = useMemo(() => {
    return filteredFloors.reduce((sum, f) => sum + f.rooms.length, 0);
  }, [filteredFloors]);

  const totalMatchingBeds = useMemo(() => {
    return filteredFloors.reduce((sum, f) => sum + f.rooms.reduce((rSum, r) => rSum + r.beds.length, 0), 0);
  }, [filteredFloors]);

  // 2. FILTERED RESIDENTS FOR TAB 2
  const filteredTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();

    return tenants.filter((t) => {
      const activeStays = t.stays || [];
      if (tenantStayFilter === 'MULTI_BED' && activeStays.length < 2) return false;
      if (tenantStayFilter === 'ACTIVE' && !activeStays.some((s) => s.status === 'ACTIVE')) return false;
      if (tenantStayFilter === 'NOTICE_PERIOD' && !activeStays.some((s) => s.status === 'NOTICE_PERIOD')) return false;

      if (q) {
        const matchesName = t.user.fullName.toLowerCase().includes(q);
        const matchesPhone = t.user.phone.toLowerCase().includes(q);
        const matchesEmail = (t.user.email || '').toLowerCase().includes(q);
        const matchesWorkplace = (t.workplace || '').toLowerCase().includes(q);
        const matchesAddress = (t.permanentAddress || '').toLowerCase().includes(q);
        const matchesRoom = activeStays.some(
          (s) => s.bed.room.roomNumber.toLowerCase().includes(q) || s.bed.bedNumber.toLowerCase().includes(q)
        );
        return matchesName || matchesPhone || matchesEmail || matchesWorkplace || matchesAddress || matchesRoom;
      }

      return true;
    });
  }, [tenants, tenantSearch, tenantStayFilter]);

  // 3. FILTERED INVOICES FOR TAB 3
  const filteredInvoices = useMemo(() => {
    const q = invoiceSearch.trim().toLowerCase();

    return invoices.filter((inv) => {
      if (invoiceStatusFilter !== 'ALL' && inv.status !== invoiceStatusFilter) return false;

      if (q) {
        const matchesTenant = inv.stay?.tenant.user.fullName.toLowerCase().includes(q);
        const matchesPhone = inv.stay?.tenant.user.phone.toLowerCase().includes(q);
        const matchesInvoiceNum = inv.invoiceNumber.toLowerCase().includes(q);
        const matchesRoom = inv.stay?.bed.room.roomNumber.toLowerCase().includes(q);
        const matchesMonth = inv.billingMonth.toLowerCase().includes(q);
        return matchesTenant || matchesPhone || matchesInvoiceNum || matchesRoom || matchesMonth;
      }

      return true;
    });
  }, [invoices, invoiceSearch, invoiceStatusFilter]);

  // Financial summary metrics
  const financialMetrics = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalDue), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0);
    const totalOverdue = invoices
      .filter((inv) => inv.status === 'OVERDUE' || inv.status === 'PENDING')
      .reduce((sum, inv) => sum + (Number(inv.totalDue) - Number(inv.amountPaid)), 0);
    const collectionEfficiency = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 100;

    return { totalInvoiced, totalCollected, totalOverdue, collectionEfficiency };
  }, [invoices]);

  // 4. FILTERED COMPLAINTS FOR TAB 4
  const filteredComplaints = useMemo(() => {
    const q = complaintSearch.trim().toLowerCase();

    return complaints.filter((c) => {
      if (complaintStatusFilter !== 'ALL' && c.status !== complaintStatusFilter) return false;
      if (complaintCategoryFilter !== 'ALL' && c.category !== complaintCategoryFilter) return false;

      if (q) {
        const matchesMsg = c.message.toLowerCase().includes(q);
        const matchesTenant = (c.tenant?.user.fullName || '').toLowerCase().includes(q);
        const matchesRoom = (c.room?.roomNumber || '').toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);
        return matchesMsg || matchesTenant || matchesRoom || matchesCategory;
      }

      return true;
    });
  }, [complaints, complaintSearch, complaintStatusFilter, complaintCategoryFilter]);

  return (
    <div style={{ padding: '14px 14px 90px', width: '100%', boxSizing: 'border-box' }}>
      {/* SaaS Subscription & Plan Status Banner */}
      {/* {subDetails && (
        <div
          onClick={onOpenSubscription}
          style={{
            background: subDetails.isExpired
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(15, 23, 42, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.16) 0%, rgba(168, 85, 247, 0.12) 100%)',
            border: subDetails.isExpired ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 14,
            padding: '11px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0,
            }}>
              <Crown size={17} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
                  {subDetails.plan?.name || 'Starter'} Tier
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: subDetails.isExpired
                    ? 'rgba(239, 68, 68, 0.25)'
                    : subDetails.status === 'TRIAL'
                    ? 'rgba(59, 130, 246, 0.25)'
                    : 'rgba(16, 185, 129, 0.25)',
                  color: subDetails.isExpired ? '#fca5a5' : subDetails.status === 'TRIAL' ? '#93c5fd' : '#6ee7b7',
                }}>
                  {subDetails.isExpired ? 'EXPIRED' : `${subDetails.daysLeft}d left`}
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 2 }}>
                🏢 {subDetails.usage?.propertiesCount || 0}/{subDetails.usage?.maxProperties || 1} PG • 🛏️ {subDetails.usage?.totalBeds || 0}/{subDetails.usage?.maxBeds || 50} Beds
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: '#a5b4fc',
            fontSize: 11,
            fontWeight: 800,
            background: 'rgba(99, 102, 241, 0.2)',
            padding: '5px 9px',
            borderRadius: 8,
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}>
            <span>Renew / Upgrade</span>
            <ArrowRight size={12} />
          </div>
        </div>
      )} */}

      {/* Mobile Top KPI Cards: 2x2 Compact Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        marginBottom: 14,
      }}>
        {/* KPI 1: Occupancy */}
        <div
          onClick={() => {
            setActiveTab('INVENTORY');
            setMatrixVacancyFilter('ALL');
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#818cf8' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Occupancy
            </span>
            <Users size={14} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
            {stats?.occupancy.occupiedBeds || 0} <span style={{ fontSize: 12, color: '#94a3b8' }}>/ {stats?.occupancy.totalBeds || 0}</span>
          </div>

          <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: 'rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <div style={{
              width: `${stats?.occupancy.occupancyRate || 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)',
            }} />
          </div>

          <div style={{ marginTop: 6, fontSize: 10, color: '#34d399', fontWeight: 700 }}>
            🟢 {stats?.occupancy.vacantBeds || 0} Vacant ({stats?.occupancy.occupancyRate || 0}%)
          </div>
        </div>

        {/* KPI 2: Rent Collected */}
        <div
          onClick={() => {
            setActiveTab('FINANCIALS');
            setInvoiceStatusFilter('PAID');
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 14,
            padding: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#34d399' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Collected
            </span>
            <CreditCard size={14} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
            ₹{(stats?.financials.collected || 0).toLocaleString()}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: '#6ee7b7', fontWeight: 700 }}>
            ⚡ 0% MDR Direct UPI
          </div>
        </div>

        {/* KPI 3: Pending Dues */}
        <div
          onClick={() => {
            setActiveTab('FINANCIALS');
            setInvoiceStatusFilter('OVERDUE');
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            borderRadius: 14,
            padding: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#f87171' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Pending Dues
            </span>
            <AlertTriangle size={14} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
            ₹{(stats?.financials.overdue || 0).toLocaleString()}
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: '#fda4af', fontWeight: 700 }}>
            {stats?.financials.overdueTenantsCount || 0} Residents Due →
          </div>
        </div>

        {/* KPI 4: Maintenance Tickets */}
        <div
          onClick={() => {
            setActiveTab('COMPLAINTS');
            setComplaintStatusFilter('OPEN');
          }}
          style={{
            background: 'linear-gradient(135deg, rgba(49, 46, 129, 0.5) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 14,
            padding: 12,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#a5b4fc' }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tickets
            </span>
            <MessageSquare size={14} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#ffffff', marginTop: 4 }}>
            {(stats?.complaints.open || 0) + (stats?.complaints.inProgress || 0)}{' '}
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Active</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>
            🟡 {stats?.complaints.open || 0} Open • {stats?.complaints.resolved || 0} Done
          </div>
        </div>
      </div>

      {/* Horizontal Swipe Floor Glance Strip */}
      {floors.length > 0 && (
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 14,
            overflowX: 'auto',
            paddingBottom: 2,
          }}
        >
          <button
            onClick={() => {
              setActiveTab('INVENTORY');
              setMatrixFloorFilter('ALL');
            }}
            style={{
              padding: '6px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              border: matrixFloorFilter === 'ALL' ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
              background: matrixFloorFilter === 'ALL' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: matrixFloorFilter === 'ALL' ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All Floors
          </button>
          {floors.map((fl) => {
            const vacantFlBeds = fl.rooms.reduce((s, r) => s + r.beds.filter((b) => b.status === 'VACANT').length, 0);
            const isSelected = matrixFloorFilter === fl.id;

            return (
              <button
                key={fl.id}
                onClick={() => {
                  setActiveTab('INVENTORY');
                  setMatrixFloorFilter(isSelected ? 'ALL' : fl.id);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  border: isSelected ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{fl.name || `Floor ${fl.floorNumber}`}</span>
                <span style={{
                  color: vacantFlBeds > 0 ? '#34d399' : '#64748b',
                  fontSize: 10,
                  fontWeight: 800,
                }}>
                  {vacantFlBeds > 0 ? `🟢 ${vacantFlBeds}` : '🔴'}
                </span>
              </button>
            );
          })}
          {onEditProperty && (
            <button
              onClick={() => onEditProperty(property)}
              title="Edit Building Floors & Structure"
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid rgba(99, 102, 241, 0.4)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#a5b4fc',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Edit3 size={11} color="#818cf8" /> Edit Building & Floors
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: BED MATRIX & ROOMS                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'INVENTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Mobile Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search room # (101), bed, or tenant..."
              value={matrixSearch}
              onChange={(e) => setMatrixSearch(e.target.value)}
              className="custom-input"
              style={{ paddingLeft: 36, fontSize: 13, padding: '9px 34px 9px 36px' }}
            />
            {matrixSearch && (
              <button
                onClick={() => setMatrixSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Horizontal Scrolling Filter Pills */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              onClick={() => setMatrixVacancyFilter('ALL')}
              className={`filter-pill ${matrixVacancyFilter === 'ALL' ? 'active' : ''}`}
            >
              All Beds
            </button>
            <button
              onClick={() => setMatrixVacancyFilter('VACANT')}
              className={`filter-pill ${matrixVacancyFilter === 'VACANT' ? 'active-emerald' : ''}`}
            >
              🟢 Vacant Only
            </button>
            <button
              onClick={() => setMatrixVacancyFilter('OCCUPIED')}
              className={`filter-pill ${matrixVacancyFilter === 'OCCUPIED' ? 'active-rose' : ''}`}
            >
              🔴 Occupied Only
            </button>
            <button
              onClick={() => setMatrixAcFilter(matrixAcFilter === 'AC' ? 'ALL' : 'AC')}
              className={`filter-pill ${matrixAcFilter === 'AC' ? 'active' : ''}`}
            >
              ❄️ AC
            </button>
            <button
              onClick={() => setMatrixAcFilter(matrixAcFilter === 'NON_AC' ? 'ALL' : 'NON_AC')}
              className={`filter-pill ${matrixAcFilter === 'NON_AC' ? 'active' : ''}`}
            >
              Non-AC
            </button>
          </div>

          {/* Matching Count Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94a3b8' }}>
            <span>Showing <strong>{totalMatchingRooms}</strong> rooms ({totalMatchingBeds} beds)</span>
            {(matrixSearch || matrixFloorFilter !== 'ALL' || matrixVacancyFilter !== 'ALL' || matrixAcFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setMatrixSearch('');
                  setMatrixFloorFilter('ALL');
                  setMatrixVacancyFilter('ALL');
                  setMatrixAcFilter('ALL');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fda4af',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Grid Output */}
          {totalMatchingRooms === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 16,
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}>
              <Search size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ margin: 0, fontSize: 15, color: '#f8fafc' }}>No matching rooms</h4>
              <p style={{ margin: '4px 0 14px', color: '#94a3b8', fontSize: 12 }}>
                Try adjusting the search or filters.
              </p>
              <button
                onClick={() => {
                  setMatrixSearch('');
                  setMatrixFloorFilter('ALL');
                  setMatrixVacancyFilter('ALL');
                  setMatrixAcFilter('ALL');
                }}
                className="btn-primary"
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <OccupancyGrid
              floors={filteredFloors}
              onSelectBed={(bed) => setSelectedBedForDetails(bed)}
              onAddRoomToFloor={() => setIsAddRoomOpen(true)}
              onEditRoom={(room) => setSelectedRoomForEdit(room)}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RESIDENTS DIRECTORY (MOBILE CARDS)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'TENANTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Mobile Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search resident, phone, room, or workplace..."
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              className="custom-input"
              style={{ paddingLeft: 36, fontSize: 13, padding: '9px 34px 9px 36px' }}
            />
            {tenantSearch && (
              <button
                onClick={() => setTenantSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              onClick={() => setTenantStayFilter('ALL')}
              className={`filter-pill ${tenantStayFilter === 'ALL' ? 'active' : ''}`}
            >
              All ({tenants.length})
            </button>
            <button
              onClick={() => setTenantStayFilter('MULTI_BED')}
              className={`filter-pill ${tenantStayFilter === 'MULTI_BED' ? 'active' : ''}`}
            >
              ★ Multi-Bed ({tenants.filter((t) => (t.stays || []).length > 1).length})
            </button>
            <button
              onClick={() => setTenantStayFilter('ACTIVE')}
              className={`filter-pill ${tenantStayFilter === 'ACTIVE' ? 'active-emerald' : ''}`}
            >
              Active
            </button>
            <button
              onClick={() => setTenantStayFilter('NOTICE_PERIOD')}
              className={`filter-pill ${tenantStayFilter === 'NOTICE_PERIOD' ? 'active-amber' : ''}`}
            >
              Notice
            </button>
          </div>

          {/* Residents List */}
          {filteredTenants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 16,
              border: '1px dashed rgba(255, 255, 255, 0.1)',
            }}>
              <Users size={32} color="#64748b" style={{ margin: '0 auto 10px' }} />
              <h4 style={{ margin: 0, fontSize: 15, color: '#f8fafc' }}>No residents found</h4>
              <p style={{ margin: '4px 0 14px', color: '#94a3b8', fontSize: 12 }}>
                {tenantSearch ? 'Try a different search term.' : 'Onboard your first resident.'}
              </p>
              <button
                onClick={() => {
                  setSelectedBedForOnboard(undefined);
                  setIsOnboardOpen(true);
                }}
                className="btn-success"
                style={{ fontSize: 12, padding: '8px 14px' }}
              >
                <UserPlus size={14} /> Onboard Resident
              </button>
            </div>
          ) : (
            filteredTenants.map((t) => {
              const activeStays = t.stays || [];
              const totalRent = activeStays.reduce((sum, s) => sum + Number(s.agreedRent), 0);
              const bedNumbers = activeStays.map((s) => s.bed.bedNumber).join(', ');
              const roomNumbers = Array.from(new Set(activeStays.map((s) => s.bed.room.roomNumber))).join(', ');
              const isMultiBed = activeStays.length > 1;

              return (
                <div
                  key={t.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: isMultiBed ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 16,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: isMultiBed
                          ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
                          : 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 16,
                      }}>
                        {t.user.fullName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                            {t.user.fullName}
                          </span>
                          {isMultiBed && (
                            <span style={{
                              background: 'rgba(99, 102, 241, 0.2)',
                              color: '#a5b4fc',
                              fontSize: 10,
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: 8,
                            }}>
                              ★ {activeStays.length} Beds
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                          {t.user.phone} • Room {roomNumbers} ({bedNumbers})
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>
                        ₹{totalRent.toLocaleString()}
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>/ month</div>
                    </div>
                  </div>

                  {/* Compact Info pills */}
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    background: 'rgba(10, 15, 29, 0.6)',
                    padding: '8px 10px',
                    borderRadius: 10,
                    fontSize: 11,
                    color: '#cbd5e1',
                  }}>
                    {t.workplace && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Briefcase size={12} color="#818cf8" /> {t.workplace}
                      </span>
                    )}
                    {t.emergencyPhone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} color="#f87171" /> {t.emergencyName || 'Guardian'}: {t.emergencyPhone}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setSelectedTenantForReviseRent(t)}
                      title="Revise Monthly Rent / Escalation"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid rgba(52, 211, 153, 0.3)',
                        color: '#34d399',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <TrendingUp size={12} /> Revise Rent
                    </button>

                    <button
                      onClick={() => setSelectedTenantForEdit(t)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>

                    <a
                      href={`https://wa.me/91${t.user.phone}?text=Hello%20${encodeURIComponent(t.user.fullName)},%20greetings%20from%20${encodeURIComponent(property.name)}.`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <Send size={12} /> WhatsApp
                    </a>

                    <button
                      onClick={() => handleCheckoutTenant(t.id, t.user.fullName)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        color: '#fda4af',
                        padding: '6px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <LogOut size={12} /> Vacate
                    </button>

                    <button
                      onClick={() => handleDeleteTenant(t.id, t.user.fullName)}
                      title="Permanently Delete Resident Record"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        padding: '6px 8px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INVOICES & LEDGER (MOBILE CARDS)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'FINANCIALS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tenant Payment Gateway & UPI Settings Action Card */}
          <div
            onClick={() => {
              if (onOpenPaymentSettings) onOpenPaymentSettings();
              else setIsPaymentSettingsOpen(true);
            }}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(56, 189, 248, 0.08) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 14,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#818cf8',
                }}
              >
                <CreditCard size={18} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#f8fafc' }}>
                  Tenant Payment Settings (Razorpay & UPI)
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                  Configure online payment channels visible to residents
                </div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 700 }}>
              Configure →
            </div>
          </div>

          {/* Summary Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 14,
            padding: 12,
          }}>
            <div>
              <div style={{ fontSize: 10, color: '#34d399', fontWeight: 800, textTransform: 'uppercase' }}>Collected</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
                ₹{financialMetrics.totalCollected.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#f87171', fontWeight: 800, textTransform: 'uppercase' }}>Overdue</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#f87171', marginTop: 2 }}>
                ₹{financialMetrics.totalOverdue.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search invoice #, resident, or room..."
              value={invoiceSearch}
              onChange={(e) => setInvoiceSearch(e.target.value)}
              className="custom-input"
              style={{ paddingLeft: 36, fontSize: 13, padding: '9px 34px 9px 36px' }}
            />
            {invoiceSearch && (
              <button
                onClick={() => setInvoiceSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              onClick={() => setInvoiceStatusFilter('ALL')}
              className={`filter-pill ${invoiceStatusFilter === 'ALL' ? 'active' : ''}`}
            >
              All Invoices
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('OVERDUE')}
              className={`filter-pill ${invoiceStatusFilter === 'OVERDUE' ? 'active-rose' : ''}`}
            >
              🔴 Overdue
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('PENDING')}
              className={`filter-pill ${invoiceStatusFilter === 'PENDING' ? 'active-amber' : ''}`}
            >
              🟡 Pending
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('PAID')}
              className={`filter-pill ${invoiceStatusFilter === 'PAID' ? 'active-emerald' : ''}`}
            >
              🟢 Paid
            </button>
          </div>

          {/* Invoices List */}
          {filteredInvoices.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 16,
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              color: '#64748b',
              fontSize: 13,
            }}>
              No invoices match the selected criteria.
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>
                        {inv.stay?.tenant.user.fullName}
                      </span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>
                        (Rm {inv.stay?.bed.room.roomNumber})
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {inv.invoiceNumber} • {inv.billingMonth}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                      ₹{inv.totalDue.toLocaleString()}
                    </div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 8,
                      display: 'inline-block',
                      marginTop: 3,
                      background:
                        inv.status === 'PAID'
                          ? 'rgba(16, 185, 129, 0.15)'
                          : inv.status === 'OVERDUE'
                            ? 'rgba(244, 63, 94, 0.15)'
                            : 'rgba(245, 158, 11, 0.15)',
                      color:
                        inv.status === 'PAID' ? '#6ee7b7' : inv.status === 'OVERDUE' ? '#fda4af' : '#fcd34d',
                    }}>
                      {inv.status}
                    </span>
                  </div>
                </div>

                {inv.status !== 'PAID' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: 10 }}>
                    <a
                      href={`https://wa.me/91${inv.stay?.tenant.user.phone}?text=Hello%20${encodeURIComponent(
                        inv.stay?.tenant.user.fullName || ''
                      )},%20your%20rent%20of%20₹${inv.totalDue}%20for%20${inv.billingMonth}%20is%20pending.%20Please%20pay%20via%20the%20PG%20Flow%20App.`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        padding: '6px 10px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      <Send size={11} /> Nudge
                    </a>

                    <button
                      onClick={() => handleRecordCash(inv.id, inv.totalDue - inv.amountPaid)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f8fafc',
                        padding: '6px 10px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Mark Cash
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MAINTENANCE TICKETS (MOBILE CARDS)                                 */}
      {/* ========================================================================= */}
      {activeTab === 'COMPLAINTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Mobile Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search ticket message or room #..."
              value={complaintSearch}
              onChange={(e) => setComplaintSearch(e.target.value)}
              className="custom-input"
              style={{ paddingLeft: 36, fontSize: 13, padding: '9px 34px 9px 36px' }}
            />
            {complaintSearch && (
              <button
                onClick={() => setComplaintSearch('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
            <button
              onClick={() => setComplaintStatusFilter('ALL')}
              className={`filter-pill ${complaintStatusFilter === 'ALL' ? 'active' : ''}`}
            >
              All Status
            </button>
            <button
              onClick={() => setComplaintStatusFilter('OPEN')}
              className={`filter-pill ${complaintStatusFilter === 'OPEN' ? 'active-amber' : ''}`}
            >
              🟡 Open
            </button>
            <button
              onClick={() => setComplaintStatusFilter('IN_PROGRESS')}
              className={`filter-pill ${complaintStatusFilter === 'IN_PROGRESS' ? 'active' : ''}`}
            >
              🔵 Doing
            </button>
            <button
              onClick={() => setComplaintStatusFilter('RESOLVED')}
              className={`filter-pill ${complaintStatusFilter === 'RESOLVED' ? 'active-emerald' : ''}`}
            >
              🟢 Done
            </button>
          </div>

          {/* Tickets List */}
          {filteredComplaints.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: 16,
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              color: '#64748b',
              fontSize: 13,
            }}>
              No maintenance tickets found.
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#a5b4fc',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 6,
                      }}>
                        {c.category}
                      </span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: '#f8fafc' }}>
                        Room {c.room?.roomNumber || 'General'}
                      </span>
                    </div>

                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
                      by {c.tenant?.user.fullName} • {new Date(c.createdAt).toLocaleDateString()}
                    </div>

                    <p style={{ color: '#cbd5e1', fontSize: 13, marginTop: 8, marginBottom: 8, lineHeight: 1.4 }}>
                      "{c.message}"
                    </p>
                  </div>

                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: 10,
                    whiteSpace: 'nowrap',
                    background:
                      c.status === 'RESOLVED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : c.status === 'IN_PROGRESS'
                          ? 'rgba(99, 102, 241, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                    color:
                      c.status === 'RESOLVED' ? '#6ee7b7' : c.status === 'IN_PROGRESS' ? '#a5b4fc' : '#fcd34d',
                  }}>
                    {c.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Media Thumbnails */}
                {c.mediaUrls && c.mediaUrls.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {c.mediaUrls.map((url, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewMediaUrl(url)}
                        style={{
                          position: 'relative',
                          cursor: 'pointer',
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={url}
                          alt="Ticket photo"
                          style={{
                            width: 72,
                            height: 52,
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: 8,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 10,
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  paddingTop: 8,
                  justifyContent: 'flex-end',
                }}>
                  {c.status !== 'IN_PROGRESS' && c.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateComplaint(c.id, 'IN_PROGRESS')}
                      style={{
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#a5b4fc',
                        padding: '5px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      In Progress
                    </button>
                  )}
                  {c.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleUpdateComplaint(c.id, 'RESOLVED')}
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#6ee7b7',
                        padding: '5px 12px',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        className="mobile-fab"
        onClick={() => setIsQuickActionOpen(true)}
        title="Quick Actions"
      >
        <Plus size={24} />
      </button>

      {/* Quick Action Bottom Sheet */}
      {isQuickActionOpen && (
        <div className="bottom-sheet-overlay" onClick={() => setIsQuickActionOpen(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()} style={{ padding: '0 16px 28px' }}>
            <div className="sheet-drag-handle" />
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#f8fafc', textAlign: 'center' }}>
              Quick Actions
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setSelectedBedForOnboard(undefined);
                  setIsOnboardOpen(true);
                }}
                className="btn-success"
                style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 14 }}
              >
                <UserPlus size={18} /> Onboard Resident
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  setIsAddRoomOpen(true);
                }}
                className="btn-primary"
                style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 14 }}
              >
                <BedDouble size={18} /> Add Room & Beds
              </button>

              <button
                onClick={() => {
                  setIsQuickActionOpen(false);
                  onOpenAddProperty();
                }}
                className="btn-secondary"
                style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 14 }}
              >
                <Building2 size={18} color="#818cf8" /> Add New PG Building
              </button>

              {onEditProperty && (
                <button
                  onClick={() => {
                    setIsQuickActionOpen(false);
                    onEditProperty(property);
                  }}
                  className="btn-secondary"
                  style={{ width: '100%', padding: '14px', borderRadius: 14, fontSize: 14 }}
                >
                  <Edit3 size={18} color="#38bdf8" /> Edit Current PG ({property.name})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Media Lightbox Modal */}
      {previewMediaUrl && (
        <div
          onClick={() => setPreviewMediaUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 8, 16, 0.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', maxWidth: '100%' }}>
            <button
              onClick={() => setPreviewMediaUrl(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                background: '#f43f5e',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 32,
                height: 32,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
            <img
              src={previewMediaUrl}
              alt="Zoomed attachment"
              style={{
                maxWidth: '90vw',
                maxHeight: '80vh',
                borderRadius: 14,
                display: 'block',
              }}
            />
          </div>
        </div>
      )}

      {/* Native Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`mobile-tab-btn ${activeTab === 'INVENTORY' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <Layers size={18} />
          </div>
          <span>Rooms</span>
        </button>

        <button
          onClick={() => setActiveTab('TENANTS')}
          className={`mobile-tab-btn ${activeTab === 'TENANTS' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <Users size={18} />
          </div>
          <span>Residents</span>
        </button>

        <button
          onClick={() => setActiveTab('FINANCIALS')}
          className={`mobile-tab-btn ${activeTab === 'FINANCIALS' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <CreditCard size={18} />
          </div>
          <span>Money</span>
          {(stats?.financials.overdueTenantsCount || 0) > 0 && (
            <span className="tab-badge">{stats?.financials.overdueTenantsCount}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('COMPLAINTS')}
          className={`mobile-tab-btn ${activeTab === 'COMPLAINTS' ? 'active' : ''}`}
        >
          <div className="tab-icon-wrapper">
            <MessageSquare size={18} />
          </div>
          <span>Tickets</span>
          {(stats?.complaints.open || 0) > 0 && (
            <span className="tab-badge">{stats?.complaints.open}</span>
          )}
        </button>
      </nav>

      {/* Modals */}
      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        property={property}
        floors={floors}
        onSuccess={() => {
          loadData();
          onRefreshProperties();
        }}
      />

      <EditRoomModal
        isOpen={!!selectedRoomForEdit}
        onClose={() => setSelectedRoomForEdit(null)}
        room={selectedRoomForEdit}
        floors={floors}
        onSuccess={() => {
          loadData();
          onRefreshProperties();
        }}
        onRefreshRoom={loadData}
        onEditBed={(b) => setSelectedBedForEdit(b)}
      />

      <OnboardTenantModal
        isOpen={isOnboardOpen}
        onClose={() => setIsOnboardOpen(false)}
        property={property}
        initialBedId={selectedBedForOnboard}
        onSuccess={() => {
          loadData();
          onRefreshProperties();
        }}
      />

      <EditTenantModal
        isOpen={!!selectedTenantForEdit}
        onClose={() => setSelectedTenantForEdit(null)}
        tenant={selectedTenantForEdit}
        onSuccess={() => {
          loadData();
          onRefreshProperties();
        }}
      />

      <BedDetailsModal
        bed={selectedBedForDetails}
        onClose={() => setSelectedBedForDetails(null)}
        onOnboardToBed={(bedId) => {
          setSelectedBedForOnboard(bedId);
          setIsOnboardOpen(true);
        }}
        onRefresh={() => {
          loadData();
          onRefreshProperties();
        }}
        onEditTenant={(t) => {
          const found = tenants.find((tenant) => tenant.id === t.id) || t;
          setSelectedTenantForEdit(found);
        }}
        onReviseRent={(t) => {
          const found = tenants.find((tenant) => tenant.id === t.id) || t;
          setSelectedTenantForReviseRent(found);
        }}
        onEditBed={(b) => setSelectedBedForEdit(b)}
      />

      <EditBedModal
        isOpen={!!selectedBedForEdit}
        onClose={() => setSelectedBedForEdit(null)}
        bed={selectedBedForEdit}
        onSuccess={() => {
          loadData();
          onRefreshProperties();
        }}
      />

      <ReviseRentModal
        isOpen={!!selectedTenantForReviseRent}
        onClose={() => setSelectedTenantForReviseRent(null)}
        tenant={selectedTenantForReviseRent}
        property={property}
        onSuccess={() => {
          loadData();
          onRefreshProperties();
        }}
      />

      <OwnerPaymentSettingsModal
        isOpen={isPaymentSettingsOpen}
        onClose={() => setIsPaymentSettingsOpen(false)}
      />
    </div>
  );
};
