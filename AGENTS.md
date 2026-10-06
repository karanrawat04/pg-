# Project Developer & Agent Instructions (AGENTS.md)

## 1. Architectural & Component Design Principles
- **No Monolithic Bloat Files**:
  - Never place an entire multi-section modal or dashboard feature into a single 500+ line file.
  - Every complex feature MUST be decomposed into modular, single-responsibility subcomponents in a dedicated folder (e.g., `src/components/subscription/`, `src/components/inventory/`, etc.).
- **CSS & Flexbox Layout Safeguards**:
  - In scrollable flex containers (`display: flex; flex-direction: column; overflow-y: auto`), always assign `flex-shrink: 0` to prominent hero cards, banners, and action panels so flexbox does not squish or collapse them.
  - All modals must use fixed viewport centering (`position: fixed; inset: 0; z-index: 9999`) or the standard mobile bottom-sheet drawer (`.bottom-sheet-overlay`).

## 2. Multi-Tenant Role & Account Isolation
- **Super Admin Web Portal (`admin/` on Port 3001)**:
  - Restricted strictly to role `SUPER_ADMIN` (e.g. `karanroliyal12@gmail.com`).
  - Governs PG fleet, account activation/suspension, and SaaS plan catalog.
- **Mobile Application (`mobile/` on Port 3000)**:
  - Role `OWNER`: PG Owner dashboard strictly filtered to the authenticated organization's buildings and inventory.
  - Role `TENANT`: Resident portal strictly scoped to their assigned room, bed, and rent dues.
  - Role `SUPER_ADMIN`: Redirected to the desktop admin console.

## 3. SaaS Subscription & Plan Governance
- Every PG Owner organization has an `organizationSubscription` with:
  - `plan`: Starter (1 PG / 50 beds), Growth (3 PGs / 150 beds), or Enterprise.
  - `status`: `ACTIVE`, `TRIAL`, `PAST_DUE`, or `CANCELLED`.
  - `daysLeft`: Real-time countdown calculation.
  - Quotas enforced in `properties.controller.ts` on property and bed additions.
- PG Owner self-service subscription actions:
  - `GET /api/auth/plans`: List active tiers.
  - `GET /api/auth/subscription`: Fetch owner plan and live quota usage.
  - `POST /api/auth/subscription/renew`: Extend validity by `+1`, `+3`, `+6`, or `+12` months.
  - `POST /api/auth/subscription/upgrade`: Switch to a higher SaaS plan.

## 4. Authentication & Master OTP
- **Master OTP**: `123456` is enabled in `backend/.env` for friction-free developer testing across all accounts.
- **Real SMTP Delivery**: When `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` are provided in `backend/.env`, `nodemailer` dispatches real emails to recipient inboxes. Otherwise, it logs the OTP in the terminal console.

## 5. Comprehensive Entity Editing & Subcomponent Standard
- **End-to-End Entity Modals**:
  - **PG Property (`EditPropertyModal.tsx`)**:
    - Complete match with `AddPropertyModal.tsx`:
      - Name, City, Full Address, PG Gender Type (`MALE`/`FEMALE`/`UNISEX`).
      - Floor Architecture: Ground Floor (Floor 0) toggle, Basement (B1) toggle, Upper Floors count + presets (`1F, 2F, 3F, 4F, 5F, 8F, 10F, 15F, 20F`), and Generated Floors Live Preview.
      - Amenities: Complete 10 amenities toggles (`High Speed WiFi`, `Daily Housekeeping`, `RO Water`, `CCTV Security`, `Washing Machine`, `AC Rooms`, `Power Backup`, `Gym & Lounge`, `Biometric Access`, `Daily Meals`).
    - Accessible directly via: (1) Header building switcher drawer, (2) Dashboard floor glance strip ("Edit Building & Floors"), (3) Floating Quick Actions bottom sheet.
  - **Room (`EditRoomModal.tsx`)**: Room Name, Floor assignment, Sharing Type (`SINGLE`, `DOUBLE`, `TRIPLE`, `FOUR_SHARING` with auto-sync of beds), Base Rent, AC Climate Control, and inline bed list manager (`RoomBedsManager.tsx`).
  - **Bed (`EditBedModal.tsx` & `RoomBedsManager.tsx`)**:
    - Bed Label/Number, Custom Bed Rent (overriding base rent), and Status (`VACANT`, `MAINTENANCE`, `RESERVED`, and read-only indicator if `OCCUPIED`).
    - **Reactive Bed Add/Delete Standard**: `onBedAdded` and `onBedDeleted` callbacks immediately mutate local modal state and synchronize parent dashboard (`OwnerDashboard.tsx`), guaranteeing instant UI updates without reload delay.
    - **Bed Collision Prevention**: Backend uses dynamic letter scanning (`A-Z`) against existing bed numbers to avoid duplicate identifier conflicts.
    - **Relational Integrity**: Safe transactional cascade for historical checked-out stay records on vacant beds; blocked if active resident stays are assigned.
  - **Resident / Tenant (`EditTenantModal.tsx`)**:
    - `TenantPersonalFields.tsx`: Full Name, Phone, Email.
    - `TenantStayFields.tsx`: Agreed Monthly Rent, Security Deposit, Check-in Date, Stay Status (`ACTIVE`, `NOTICE_PERIOD`, `CHECKED_OUT`).
    - `TenantKycFields.tsx`: ID Document Type (`AADHAAR`, `PAN`, `PASSPORT`, `VOTER_ID`, `DRIVING_LICENSE`), ID Number, and Status (`VERIFIED`, `PENDING`, `REJECTED`).
    - `TenantEmergencyFields.tsx`: Guardian/Emergency Name, Phone, Workplace/College, Permanent Home Address.
- **Backend Endpoints**:
  - `PATCH /api/properties/:id`: Updates name, city, address, genderType, floor architecture (`hasGroundFloor`, `hasBasement`, `upperFloors`), and amenities.
  - `POST /api/inventory/rooms/:roomId/beds`: Generates first unused non-colliding bed letter in room.
  - `DELETE /api/inventory/beds/:bedId`: Safely deletes vacant beds and cascades historical records.
  - `PATCH /api/inventory/rooms/:roomId`: Updates roomNumber, floorId, roomType, baseRent, hasAc.
  - `PATCH /api/inventory/beds/:bedId`: Updates bedNumber, customRent, status.
  - `PATCH /api/tenants/:id`: Updates user, profile, KYC docs, and active stay terms.

## 6. Dynamic Payment Gateways Architecture (Zero Dummy & Zero Manual UTR)
- **Zero Dummy & Zero Manual UTR Mandate**:
  - No manual UTR / reference number input entry in the UI.
  - No simulated card inputs, fake CVVs, or sandbox bypass buttons.
  - Razorpay Standard Checkout SDK provides end-to-end automated verification across Cards, Netbanking, UPI, and Wallets with HMAC SHA-256 signature verification.
- **Dynamic Payment Gateway Visibility Rule**:
  - **Unconfigured Method Hiding**: If a payment method (Razorpay or Direct UPI) is not enabled or not configured with valid credentials, it MUST NOT appear on the payment UI.
  - **No Online Payment Fallback**: If neither method is configured, the payment screen informs the payer that online payments are not currently configured and suggests settling offline via cash.
- **PG Owner Payment Configuration (For Tenants)**:
  - Configurable via `OwnerPaymentSettingsModal.tsx` in the mobile app (accessed via Financials tab or Header "Pay Setup"):
    - Razorpay: Enable toggle, Key ID (`rzp_...`), Key Secret.
    - Direct UPI: Enable toggle, UPI ID / VPA, Payee display name.
  - Endpoints:
    - `GET /api/billing/payment-config/owner`: Fetch PG Owner's gateway settings.
    - `PATCH /api/billing/payment-config/owner`: Update settings.
    - `GET /api/billing/payment-config/tenant/:invoiceId`: Returns enabled channels for that invoice's PG owner.
  - Dynamic Rent Checkout (`RentPaymentModal.tsx`):
    - Respects owner config; switches automatically to single method or dual-tab interface.
- **Super Admin Platform Payment Configuration (For SaaS Plans)**:
  - Configurable via `PlatformPaymentSettingsScreen.tsx` in the Desktop Admin Console (`admin/` on Port 3001):
    - Platform Razorpay: Enable toggle, Key ID, Key Secret.
    - Platform Direct UPI: Enable toggle, UPI VPA, Payee Name.
  - Endpoints:
    - `GET /api/admin/payment-config` & `PUT /api/admin/payment-config`: Governs platform credentials.
    - `GET /api/auth/subscription/payment-config`: Returns platform payment channels for SaaS subscriptions.
  - Dynamic Subscription Checkout (`SubscriptionCheckoutModal.tsx`):
    - Respects platform config; switches dynamically between Razorpay, UPI QR, or disabled notice.




