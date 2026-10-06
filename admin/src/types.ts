export interface PlatformMetrics {
  totalOwners: number;
  totalProperties: number;
  totalBeds: number;
  occupiedBeds: number;
  vacantBeds: number;
  occupancyRate: number;
  activeSubscriptionsCount: number;
  mrr: number;
  totalGmv: number;
  totalCollectedGmv: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string | null;
  priceMonthly: string | number;
  priceYearly: string | number;
  maxProperties: number;
  maxBeds: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  _count?: {
    subscriptions: number;
  };
}

export interface OrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'ACTIVE' | 'TRIAL' | 'PAST_DUE' | 'CANCELLED';
  billingCycle: 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  plan: SubscriptionPlan;
}

export interface Organization {
  id: string;
  name: string;
  ownerPhone: string;
  ownerEmail: string;
  gstNumber?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  properties: {
    id: string;
    name: string;
    city: string;
    _count: { rooms: number };
  }[];
  subscriptions: OrganizationSubscription[];
  users: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  }[];
  totalBeds: number;
  occupiedBeds: number;
  currentSubscription?: OrganizationSubscription | null;
  primaryOwner?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  } | null;
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'SUPER_ADMIN';
}
