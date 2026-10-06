import { PlatformMetrics, Organization, SubscriptionPlan, AdminUser } from '../types';

const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api');

const TOKEN_KEY = 'pgflow_superadmin_token';
const USER_KEY = 'pgflow_superadmin_user';

export const adminApi = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setAuth(token: string, user: AdminUser) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getCurrentUser(): AdminUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async request(path: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }
    return data;
  },

  // --- Auth APIs ---
  async sendOtp(email: string): Promise<{ success: boolean; message: string; previewOtp?: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  },

  async verifyOtp(email: string, otp: string): Promise<{
    success: boolean;
    token?: string;
    data?: AdminUser;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return res.json();
  },

  // --- Admin Endpoints ---
  async getMetrics(): Promise<PlatformMetrics> {
    const json = await this.request('/admin/metrics');
    return json.data;
  },

  async getOrganizations(search?: string): Promise<Organization[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const json = await this.request(`/admin/organizations${query}`);
    return json.data;
  },

  async updateOrganizationStatus(orgId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<any> {
    const json = await this.request(`/admin/organizations/${orgId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return json;
  },

  async updateOrganizationSubscription(
    orgId: string,
    data: { planId?: string; status?: string; extendMonths?: number }
  ): Promise<any> {
    const json = await this.request(`/admin/organizations/${orgId}/subscription`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return json;
  },

  async getPlans(): Promise<SubscriptionPlan[]> {
    const json = await this.request('/admin/plans');
    return json.data;
  },

  async createPlan(data: {
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    maxProperties: number;
    maxBeds: number;
    features: string[];
  }): Promise<SubscriptionPlan> {
    const json = await this.request('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return json.data;
  },

  async updatePlan(planId: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const json = await this.request(`/admin/plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return json.data;
  },

  // --- Platform Payment Gateway Configuration ---
  async getPaymentConfig(): Promise<{
    upiId: string;
    upiName: string;
    isUpiEnabled: boolean;
    razorpayKeyId: string;
    razorpayKeySecret: string;
    isRazorpayEnabled: boolean;
  }> {
    const json = await this.request('/admin/payment-config');
    return json.data;
  },

  async updatePaymentConfig(data: {
    upiId?: string;
    upiName?: string;
    isUpiEnabled?: boolean;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    isRazorpayEnabled?: boolean;
  }): Promise<any> {
    const json = await this.request('/admin/payment-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return json;
  },
};

