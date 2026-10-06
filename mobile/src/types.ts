export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  genderType: 'MALE' | 'FEMALE' | 'UNISEX';
  totalFloors: number;
  amenities: string[];
  floors?: Floor[];
  _count?: {
    rooms: number;
    complaints: number;
  };
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
  customRent?: number;
  room?: {
    roomNumber: string;
    roomType: string;
    baseRent: number;
    hasAc: boolean;
    floor?: {
      floorNumber: number;
      name: string;
    };
  };
  stays?: Array<{
    id: string;
    agreedRent: number;
    securityDeposit: number;
    checkInDate: string;
    status: string;
    tenant: Tenant;
  }>;
}

export interface Room {
  id: string;
  propertyId: string;
  floorId: string;
  roomNumber: string;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'FOUR_SHARING';
  baseRent: number;
  hasAc: boolean;
  beds: Bed[];
}

export interface Floor {
  id: string;
  propertyId: string;
  floorNumber: number;
  name: string;
  rooms: Room[];
}

export interface Tenant {
  id: string;
  userId: string;
  emergencyName?: string;
  emergencyPhone?: string;
  permanentAddress?: string;
  workplace?: string;
  idProofType?: string;
  idProofNumber?: string;
  kycStatus: string;
  createdAt: string;
  user: {
    fullName: string;
    phone: string;
    email?: string;
  };
  stays?: Array<{
    id: string;
    agreedRent: number;
    securityDeposit: number;
    checkInDate: string;
    status: string;
    bed: {
      id: string;
      bedNumber: string;
      room: {
        id: string;
        roomNumber: string;
        roomType: string;
        property: {
          id: string;
          name: string;
        };
      };
    };
    invoices?: Array<{
      id: string;
      invoiceNumber: string;
      billingMonth: string;
      totalDue: number;
      amountPaid: number;
      status: string;
      dueDate: string;
    }>;
  }>;
}

export interface DashboardStats {
  propertyId: string;
  billingMonth: string;
  occupancy: {
    totalBeds: number;
    occupiedBeds: number;
    vacantBeds: number;
    reservedBeds: number;
    occupancyRate: number;
  };
  financials: {
    expected: number;
    collected: number;
    overdue: number;
    overdueTenantsCount: number;
  };
  complaints: {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
  };
}

export interface Complaint {
  id: string;
  propertyId: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'WIFI' | 'CLEANING' | 'OTHER';
  message: string;
  mediaUrls: string[];
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  property?: { id: string; name: string };
  room?: { id: string; roomNumber: string };
  tenant?: {
    user: { fullName: string; phone: string };
  };
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  billingMonth: string;
  rentAmount: number;
  lateFine: number;
  totalDue: number;
  amountPaid: number;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  dueDate: string;
  stay?: {
    tenant: {
      user: { fullName: string; phone: string };
    };
    bed: {
      room: {
        roomNumber: string;
        property: { id: string; name: string };
      };
    };
  };
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | 'TENANT';
  organizationId?: string | null;
  organization?: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'SUSPENDED';
    subscriptions?: Array<{
      status: string;
      plan?: {
        name: string;
        maxProperties: number;
        maxBeds: number;
      };
    }>;
  } | null;
  tenantProfile?: any;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: string;
  priceYearly: string;
  maxProperties: number;
  maxBeds: number;
  features: string[];
  isActive: boolean;
}

export interface OwnerSubscriptionDetails {
  subscription: {
    id: string;
    organizationId: string;
    planId: string;
    status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED';
    billingCycle: 'MONTHLY' | 'YEARLY';
    startDate: string;
    endDate: string;
    autoRenew: boolean;
  } | null;
  plan: SubscriptionPlan | null;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
  startDate?: string;
  endDate?: string;
  daysLeft: number;
  isExpired: boolean;
  billingCycle: 'MONTHLY' | 'YEARLY';
  usage: {
    propertiesCount: number;
    maxProperties: number;
    totalBeds: number;
    maxBeds: number;
    occupiedBeds: number;
  };
}


