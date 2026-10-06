const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? `http://${window.location.hostname}:5000/api`
    : 'http://localhost:5000/api');

export const api = {
  getHeaders(): Record<string, string> {
    const token = this.getToken();
    const user = this.getCurrentUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user?.organizationId) {
      headers['x-organization-id'] = user.organizationId;
    }
    return headers;
  },

  // --- Properties ---
  async getProperties(organizationId?: string) {
    const user = this.getCurrentUser();
    const orgId = organizationId || user?.organizationId;
    const query = orgId ? `?organizationId=${encodeURIComponent(orgId)}` : '';
    const res = await fetch(`${API_BASE_URL}/properties${query}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    return json.data || [];
  },

  async getPropertyById(id: string) {
    const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    return json.data;
  },

  async getProperty(id: string) {
    return this.getPropertyById(id);
  },

  async getPropertyDashboard(propertyId: string) {
    const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/dashboard`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    return json.data;
  },

  async createProperty(data: {
    name: string;
    city: string;
    address: string;
    genderType: string;
    totalFloors: number;
    hasGroundFloor?: boolean;
    hasBasement?: boolean;
    amenities: string[];
    organizationId?: string;
  }) {
    const user = this.getCurrentUser();
    const payload = {
      ...data,
      organizationId: data.organizationId || user?.organizationId,
    };
    const res = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async updateProperty(id: string, data: {
    name?: string;
    city?: string;
    address?: string;
    genderType?: string;
    totalFloors?: number;
    hasGroundFloor?: boolean;
    hasBasement?: boolean;
    upperFloors?: number;
    amenities?: string[];
  }) {
    const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteProperty(id: string) {
    const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return res.json();
  },

  // --- Inventory: Floors, Rooms & Beds ---
  async getInventoryGrid(propertyId: string) {
    const res = await fetch(`${API_BASE_URL}/inventory/properties/${propertyId}/grid`);
    const json = await res.json();
    return json.data;
  },

  async getVacantBeds(propertyId: string) {
    const res = await fetch(`${API_BASE_URL}/inventory/properties/${propertyId}/vacant-beds`);
    const json = await res.json();
    return json.data;
  },

  async createRoom(data: {
    propertyId: string;
    floorId: string;
    roomNumber: string;
    roomType: string;
    baseRent: number;
    hasAc: boolean;
    bedCount: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/inventory/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateRoom(roomId: string, data: {
    roomNumber?: string;
    roomType?: string;
    baseRent?: number;
    hasAc?: boolean;
    floorId?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/inventory/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteRoom(roomId: string) {
    const res = await fetch(`${API_BASE_URL}/inventory/rooms/${roomId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async addBedToRoom(roomId: string, bedNumber?: string, customRent?: number) {
    const res = await fetch(`${API_BASE_URL}/inventory/rooms/${roomId}/beds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bedNumber, customRent }),
    });
    return res.json();
  },

  async updateBed(bedId: string, data: {
    bedNumber?: string;
    customRent?: number;
    status?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/inventory/beds/${bedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateBedStatus(bedId: string, status: string) {
    const res = await fetch(`${API_BASE_URL}/inventory/beds/${bedId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  async deleteBed(bedId: string) {
    const res = await fetch(`${API_BASE_URL}/inventory/beds/${bedId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  // --- Tenants & Multi-Bed Onboarding ---
  async getTenants(propertyId?: string) {
    let url = `${API_BASE_URL}/tenants`;
    if (propertyId) url += `?propertyId=${propertyId}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async onboardTenant(data: {
    fullName: string;
    phone: string;
    email?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    permanentAddress?: string;
    workplace?: string;
    idProofType?: string;
    idProofNumber?: string;
    bedIds: string[]; // Supports multiple beds!
    agreedRent: number;
    securityDeposit?: number;
    checkInDate?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/tenants/onboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async checkoutTenant(tenantId: string) {
    const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/checkout`, {
      method: 'POST',
    });
    return res.json();
  },

  async updateTenant(tenantId: string, data: {
    fullName?: string;
    phone?: string;
    email?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    workplace?: string;
    permanentAddress?: string;
    idProofType?: string;
    idProofNumber?: string;
    kycStatus?: string;
    agreedRent?: number;
    securityDeposit?: number;
    checkInDate?: string;
    stayStatus?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTenant(tenantId: string) {
    const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async reviseRent(tenantId: string, data: {
    newRent: number;
    effectiveFrom?: string;
    note?: string;
    updateCurrentPendingInvoice?: boolean;
  }) {
    const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/revise-rent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // --- Complaints ---
  async getComplaints(propertyId?: string, status?: string) {
    let url = `${API_BASE_URL}/complaints`;
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async raiseComplaint(data: {
    propertyId: string;
    roomId?: string;
    tenantId: string;
    category: string;
    message: string;
    mediaUrls: string[];
  }) {
    const res = await fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async updateComplaintStatus(complaintId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') {
    const res = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  // --- Invoices & Zero-Fee UPI Payments ---
  async getInvoices(propertyId?: string, status?: string) {
    let url = `${API_BASE_URL}/billing/invoices`;
    const params = new URLSearchParams();
    if (propertyId) params.append('propertyId', propertyId);
    if (status) params.append('status', status);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const json = await res.json();
    return json.data;
  },

  async initiateUpiPayment(invoiceId: string) {
    const res = await fetch(`${API_BASE_URL}/billing/pay/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId }),
    });
    return res.json();
  },

  async confirmPayment(gatewayTxnId: string, utr?: string) {
    const res = await fetch(`${API_BASE_URL}/billing/pay/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gatewayTxnId, status: 'SUCCESS', bankReferenceNo: utr }),
    });
    return res.json();
  },

  async getInvoiceReceipt(invoiceId: string) {
    const res = await fetch(`${API_BASE_URL}/billing/invoices/${invoiceId}/receipt`);
    const json = await res.json();
    return json.data;
  },

  async createRazorpayRentOrder(invoiceId: string) {
    const res = await fetch(`${API_BASE_URL}/billing/pay/razorpay/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId }),
    });
    return res.json();
  },

  async verifyRazorpayRentPayment(data: {
    invoiceId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/billing/pay/razorpay/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async submitUpiPaymentUtr(data: {
    invoiceId: string;
    utr: string;
    merchantTxnId?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/billing/pay/upi/submit-utr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async recordCashPayment(invoiceId: string, amount: number) {
    const res = await fetch(`${API_BASE_URL}/billing/pay/cash`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, amount }),
    });
    return res.json();
  },

  // --- Mobile Authentication & Session ---
  getToken(): string | null {
    return localStorage.getItem('pg_mobile_token');
  },

  setAuth(token: string, user: any) {
    localStorage.setItem('pg_mobile_token', token);
    localStorage.setItem('pg_mobile_user', JSON.stringify(user));
  },

  getCurrentUser(): any | null {
    const raw = localStorage.getItem('pg_mobile_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('pg_mobile_token');
    localStorage.removeItem('pg_mobile_user');
  },

  async sendOtp(email: string, intent: 'login' | 'register' = 'login'): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), intent }),
    });
    return res.json();
  },

  async verifyOtp(email: string, otp: string): Promise<{
    success: boolean;
    token?: string;
    data?: any;
    isNewUser?: boolean;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
    });
    return res.json();
  },

  async registerOwner(data: {
    email: string;
    fullName: string;
    phone: string;
    businessName: string;
    planId?: string;
  }): Promise<{
    success: boolean;
    token?: string;
    data?: any;
    message?: string;
  }> {
    const res = await fetch(`${API_BASE_URL}/auth/register-owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // --- SaaS Subscription & Plans for PG Owner ---
  async getPlans() {
    const res = await fetch(`${API_BASE_URL}/auth/plans`);
    const json = await res.json();
    return json.data || [];
  },

  async getMySubscription() {
    const res = await fetch(`${API_BASE_URL}/auth/subscription`, {
      headers: this.getHeaders(),
    });
    const json = await res.json();
    return json.data;
  },

  async renewSubscription(extendMonths: number = 1) {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/renew`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ extendMonths }),
    });
    return res.json();
  },

  async upgradeSubscription(data: {
    planId: string;
    billingCycle?: 'MONTHLY' | 'YEARLY';
    extendMonths?: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/upgrade`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async initiateSubscriptionCheckout(data: {
    planId?: string;
    extendMonths: number;
    billingCycle?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/initiate-checkout`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async confirmSubscriptionCheckout(data: {
    txnId: string;
    planId?: string;
    extendMonths: number;
    billingCycle?: string;
    paymentMode?: string;
    utr?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/confirm-checkout`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async createRazorpaySubscriptionOrder(data: {
    planId?: string;
    extendMonths: number;
    billingCycle?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/razorpay/create-order`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async verifyRazorpaySubscriptionPayment(data: {
    planId?: string;
    extendMonths: number;
    billingCycle?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/razorpay/verify`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getOwnerPaymentConfig() {
    const res = await fetch(`${API_BASE_URL}/billing/payment-config/owner`, {
      headers: this.getHeaders(),
    });
    return res.json();
  },

  async updateOwnerPaymentConfig(data: {
    upiId?: string;
    upiName?: string;
    isUpiEnabled?: boolean;
    razorpayKeyId?: string;
    razorpayKeySecret?: string;
    isRazorpayEnabled?: boolean;
  }) {
    const res = await fetch(`${API_BASE_URL}/billing/payment-config/owner`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTenantInvoicePaymentConfig(invoiceId: string) {
    const res = await fetch(`${API_BASE_URL}/billing/payment-config/tenant/${invoiceId}`);
    return res.json();
  },

  async getSubscriptionPaymentConfig() {
    const res = await fetch(`${API_BASE_URL}/auth/subscription/payment-config`);
    return res.json();
  },
};



