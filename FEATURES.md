# PG Flow — Feature Specification & Engineering Guide
> **CRITICAL INSTRUCTION FOR AI AGENTS & DEVELOPERS:**
> This document is the source of truth for all features, business logic, edge cases, and design specifications in the PG Flow platform.
> **BEFORE making any code change or adding a new feature:**
> 1. Read this document thoroughly to avoid breaking existing flows.
> 2. Implement changes cleanly without code bloat or unnecessary dependencies.
> 3. **Immediately update this document** with the new feature specification, modified endpoints, schema changes, or UI additions.

---

## 📑 Feature Registry & Architecture

### 1. Multi-Property & Universal Building Switcher
* **Purpose**: Single PG owner manages multiple buildings (e.g. *Sunshine Boys PG*, *Emerald Heights Coliving*) across a city under one account.
* **Key Functionality**:
  * Top navigation contains a persistent, responsive Property Switcher Chip with instant dropdown search.
  * Tapping the chip displays a list of all properties with city, gender type, bed count, and active tickets.
  * Context switching dynamically updates all rooms, beds, tenants, invoices, and complaints without page reload.
  * **Add Building Engine (`+ Add Building`)**:
    * Captures Name, City, Full Address, Gender Type (*Boys PG / Girls PG / Unisex Coliving*), Total Floors, and Amenities.
    * **Unlimited & Flexible Floors**: Supports Basements (B1), Ground Floor, and 1 to 50+ upper floors. Live visual layout generator shows real-time preview before creation. Backend automatically initializes all corresponding floors in Prisma.
  * **Edit Building & Confirmed Deletion**:
    * **Edit Building**: Owners can edit Building Name, City, Full Address, PG Gender Type, and Amenities directly from the building switcher.
    * **Delete Building with Confirmation**: Explicit confirmation step prevents accidental loss. Blocks deletion if the building contains any active resident stays, requiring all residents to be checked out first.

### 2. Dynamic KPI System & Interactive Cross-Navigation
* **Live Bed Occupancy & Capacity**:
  * Displays Total Beds, Occupied Beds, Vacant Available, and Occupancy Rate (%).
  * Visual progress bar indicating capacity saturation.
  * **Interactive Trigger**: Clicking "Vacant Available" immediately navigates to Bed Matrix filtered to Vacant beds only.
* **100% Zero-Fee Revenue Realization (The Blinkit Model)**:
  * Collected Rent this month (₹) vs Expected Total Rent.
  * Direct 0% MDR note highlighting zero transaction deductions.
  * Collection Efficiency % badge (`(Collected / Total Billed) * 100`).
* **Pending Dues & Recovery Risk**:
  * Outstanding overdue balance (₹) and overdue tenants count.
  * **Interactive Trigger**: Clicking navigates directly to Invoices & Ledger with "Overdue" status filter active.
* **Service Tickets SLA**:
  * Active maintenance tickets breakdown: 🟡 Open, 🔵 In Progress, 🟢 Resolved.
  * **Interactive Trigger**: Clicking navigates to Complaints with "Open" filter active.
* **Floor Vacancy Glance Strip**:
  * Horizontal quick-glance chips showing each floor's live vacancy count (e.g. `🟢 3 Vacant` or `🔴 Full`).
  * 1-click filters the entire visual matrix to that floor.

### 3. Room & Bed Inventory Engine (Tab 1: Bed Matrix & Rooms)
* **Hierarchy**: `Organization ➔ Property ➔ Floor ➔ Room ➔ Bed`.
* **Room Name (Alphanumeric) & Floor Uniqueness Rule**:
  * Label standardized to **"Room Name"** (formerly "Room Number") to accommodate alphanumeric identifiers (e.g. `101`, `G-02`, `Studio A`, `Penthouse A`, `Suite 302`).
  * **Floor-Level Uniqueness**: Room names must be unique within a floor. Enforced at both:
    1. Database level via Prisma schema constraint: `@@unique([floorId, roomNumber])`.
    2. Controller level via case-insensitive pre-validation check, returning user-friendly error: *"A room named '{roomName}' already exists on this floor. Please choose a unique room name."*
* **Auto-Mapped & Disabled Bed Count**:
  * Selecting a Room Sharing Type automatically dictates bed allocation (`SINGLE` = 1 bed, `DOUBLE` = 2 beds, `TRIPLE` = 3 beds, `FOUR_SHARING` = 4 beds).
  * The bed count input is **disabled** and auto-synced, preventing configuration mismatch or manual entry error.
* **Edit Room & Confirmed Deletion**:
  * **Edit Room**: Owners can update Room Name, Assigned Floor, Base Rent per bed, and Climate Control (AC).
  * **Delete Room with Confirmation**: Requires explicit confirmation. Safely removes the room and its vacant beds. Deletion is strictly blocked if any active resident stay exists in the room.
* **Bed States**:
  * 🟢 `VACANT`: Ready for resident allocation.
  * 🔴 `OCCUPIED`: Assigned to active resident stay.
  * 🟡 `RESERVED`: Token advance paid.
  * ⚪ `MAINTENANCE`: Cleaning or repair underway.
* **Universal Search & Multi-Filters**:
  * Instant real-time search across Room Name, Floor Name, Bed Number, and Occupant Name.
  * **Vacancy Pills**: `All Beds`, `🟢 Vacant Only`, `🔴 Occupied Only`.
  * **Sharing Type Dropdown**: `All`, `Single Room`, `Double Sharing`, `Triple Sharing`, `4-Sharing`.
  * **Climate Control Pills**: `❄️ AC Rooms`, `Non-AC`.
  * **Floor Selector**: Instant jump to any floor (Basement, Ground Floor, Upper Floors).
  * Real-time result counter (e.g., *Showing 6 matching rooms (12 beds)*) with 1-click "Reset Filters".

### 4. Tenant Management & Multi-Bed Allocation (Tab 2: Residents Directory)
* **The Multi-Bed Edge Case (Handled)**:
  * A single resident can acquire **1 or multiple beds** (e.g., reserving both beds in a 2-sharing room for privacy, or paying for family/friends).
  * Backend and UI treat `TenantStay` as an array of stays mapped to the same tenant profile.
  * Visual badge `★ Multi-Bed Allocation (X Beds)` highlights multi-bed residents.
* **Onboarding Flow (`+ Onboard Resident`)**:
  * **Room & Bed Search**: Filterable room browser with live Floor, AC, and Room Type filters.
  * **Multi-Bed Selection**: Checkboxes allow multi-selecting beds across any rooms.
  * **Complete KYC Form**:
    * Personal: Full Name, Phone, Email.
    * Emergency: Name & Relationship (Father, Guardian), Emergency Phone.
    * Workplace / College: Company name or University.
    * Permanent Address: Home address and city.
    * Verification: ID Type (*Aadhaar, Passport, PAN, Voter ID*) & ID number.
    * Financials: Agreed Monthly Rent, Security Deposit, Check-in Date.
* **Search & Filters**:
  * Real-time search across resident name, phone, email, workplace, permanent address, or room number.
  * Filter pills: `All Residents`, `★ Multi-Bed Allocation`, `🟢 Active Stays`, `🟡 Notice Period`.
* **One-Click Actions & Management**:
  * **Revise Monthly Rent (`ReviseRentModal`)**:
    * Owners can increase or adjust a resident's monthly rent at any time.
    * Features 1-tap calculation shortcuts (`+5%`, `+10%`, `+₹500`, `+₹1,000`).
    * Flexible effective timing: *Starting from Next Billing Cycle (Recommended)* or *Apply Immediately*.
    * Optional toggle to update current month's unpaid pending invoice.
    * 1-tap *"Save & Send WhatsApp Notice"* sends a professional pre-composed escalation message directly to the resident's WhatsApp.
  * **Edit Resident Details (`EditTenantModal`)**: Owners can update full name, phone number, email, emergency contact details, workplace/college, and permanent address.
  * **1-Tap Direct WhatsApp Chat**: Opens WhatsApp with pre-composed greeting and building context.
  * **Vacate / Checkout Engine**: Releases all allocated beds back to `VACANT` and marks stay as checked out.
  * **Delete Resident with Confirmation**: Permanently removes resident profile, releases allocated beds to `VACANT`, and cleans up invoices with explicit confirmation.

### 5. Zero-Knock Rent Invoicing & Ledger (Tab 3: Invoices & Ledger)
* **Underlying Rule**: NPCI's 0% MDR mandate on standard UPI transactions.
* **Summary Ribbon**:
  * Total Invoiced (₹), Total Collected (₹), Outstanding Balance (₹), Collection Efficiency (%).
* **Search & Filters**:
  * Real-time search by resident name, phone, room number, invoice number, or billing month.
  * Status filter pills: `All Invoices`, `🔴 Overdue`, `🟡 Pending`, `🟢 Paid`.
* **Zero-Knock Collection**:
  * 1-tap WhatsApp Rent Nudge: Generates pre-filled WhatsApp message with invoice number, amount, billing month, and UPI payment instruction.
  * 1-tap Mark Cash: Instant confirmation modal to record offline cash payment and update invoice to `PAID`.

### 6. Maintenance & Lightbox Media Ticket Center (Tab 4: Maintenance Tickets)
* **Rule**: Simple ticket creation with Message + up to 3 photos or short videos.
* **Categories**: `PLUMBING`, `ELECTRICAL`, `WIFI`, `CLEANING`, `OTHER`.
* **Statuses**: `OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED`.
* **Search & Filters**:
  * Real-time search by complaint message, resident name, or room number.
  * Status filter pills: `All`, `🟡 Open`, `🔵 In Progress`, `🟢 Resolved`.
  * Category dropdown: `All Categories`, `Plumbing`, `Electrical`, `WiFi`, `Cleaning`, `Other`.
* **Lightbox Media Viewer**:
  * Tapping any attached photo/video thumbnail launches an edge-to-edge modal lightbox with full resolution preview.
* **Status Progression**:
  * 1-tap action buttons: `Mark In Progress`, `Mark Resolved`.

### 7. Native Mobile UI/UX Design System
* **Mobile Viewport Shell (`.mobile-app-shell`)**:
  * Centered 440px viewport shell with subtle device border/shadow on desktop; expands to 100% full-screen on mobile devices without letterboxing.
* **Mobile Top App Bar (`HeaderSwitcher`)**:
  * iOS/Android style top status bar mock (`09:41`, Signal, WiFi, Battery).
  * Compact building switcher pill opening an authentic bottom sheet with instant building search.
  * 1-tap Role Switcher badge (`Owner 👔` vs `Resident 🏠`).
* **Fixed Bottom Navigation Bar (`.mobile-bottom-nav`)**:
  * Persistent 4-tab mobile tab bar with active indicator glows, micro-labels, and real-time badge counts:
    * 🛏️ **Rooms** (Bed Matrix & Inventory)
    * 👥 **Residents** (Directory & KYC)
    * 💳 **Money** (Rent, Ledger & UPI)
    * 🎫 **Tickets** (Complaints & Media)
* **Mobile Quick Action FAB (`.mobile-fab`)**:
  * Floating action button on the bottom-right (above bottom navigation).
  * Tapping triggers an action bottom sheet (`+ Onboard Resident`, `+ Add Room & Beds`, `+ Add Building`).
* **Mobile Bottom Sheets (`.bottom-sheet-overlay` & `.bottom-sheet-content`)**:
  * All modals (`AddPropertyModal`, `AddRoomModal`, `OnboardTenantModal`, `BedDetailsModal`) slide up from the bottom with top drag handle notch and thumb-friendly touch targets.
* **2x2 Mobile KPI Grid**:
  * High-density, readable 2x2 cards with big legible figures, progress bars, and 1-tap filter navigation.

---

### 8. Super Admin Web Application (`admin/` on Port 3001)
* **Dedicated Desktop SaaS Console**:
  * Independent web application with desktop-class enterprise dark theme, Inter typography, and glassmorphic card aesthetic.
  * Completely separated from mobile applications to enforce strict governance and zero role leakage.
* **Platform KPIs & Real-time MRR**:
  * Platform Monthly Recurring Revenue (MRR) calculated across active paid tiers.
  * Fleet Bed Utilization: Real-time platform occupancy bar, occupied beds, vacant beds, and occupancy %.
  * Gross Merchandise Volume (GMV): Invoiced and collected rent volume across all properties.
* **PG Owners & Fleet Directory**:
  * Multi-PG organization search (by PG name, owner email, phone, contact name).
  * Capacity tracking: Total buildings, live bed count, and occupancy per PG operator.
  * **Instant Account Suspension / Reactivation**: 1-click toggle to suspend an operator's account, immediately blocking their login across mobile and backend.
  * **Subscription Management**: Extend trial or paid validity by +1, +3, +6, or +12 months, upgrade/downgrade SaaS tiers.

### 9. SaaS Subscription Plans Catalog
* **Pre-seeded Tiers**:
  * **Starter (₹999/mo)**: Single PG building, up to 50 beds, bed matrix, Email OTP auth, digital receipts.
  * **Growth (₹2,499/mo)**: Up to 3 PG buildings, up to 150 beds, automated rent invoicing, WhatsApp reminders, KYC.
  * **Enterprise (₹4,999/mo)**: Unlimited PG buildings, unlimited beds, multi-staff logins, priority SLA.
* **Dynamic Plan Management**:
  * Super Admin can add new tiers or edit existing prices, bed caps, property limits, and feature lists dynamically via `adminApi`.

### 10. Email OTP Authentication & Zero-Friction Security
* **Elimination of SMS / WhatsApp Template Fees & Indian DLT Delays**:
  * Replaced SMS/WhatsApp OTP with instant **Email OTP** to eliminate regulatory DLT template approval blocks, per-SMS gateway fees, and delivery failures.
  * Console fallback with dev preview code for local friction-free testing.
  * Tokens expire in 10 minutes and enforce single-use security.
* **Complete Role & UI Isolation**:
  * **Super Admin**: Must use the desktop portal at port 3001. Mobile app explicitly rejects Super Admin logins.
  * **PG Owner**: Logs into mobile app; auto-routed to Owner Dashboard. Cannot see or access Super Admin or Tenant screens.
  * **Resident / Tenant**: Logs into mobile app; auto-routed to Tenant Portal. Cannot see or access PG Owner controls or Super Admin console.

---

## 🛠️ Complete API Endpoints Registry

### Authentication & Sessions (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Generate and dispatch 6-digit Email OTP |
| `POST` | `/api/auth/verify-otp` | Verify OTP code & return JWT token with user role and profile |
| `POST` | `/api/auth/register-owner` | Self-serve onboarding for new PG business owner with trial plan |
| `GET` | `/api/auth/me` | Fetch authenticated session profile |

### Super Admin Control Center (`/api/admin`) *(Restricted to `SUPER_ADMIN` role)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/admin/metrics` | Platform MRR, GMV, total owners, buildings, beds, occupancy rate |
| `GET` | `/api/admin/organizations` | List all PG organizations with property count, bed capacity, and subscription |
| `PATCH` | `/api/admin/organizations/:id/status` | Suspend or reactivate PG owner account (`ACTIVE` / `SUSPENDED`) |
| `POST` | `/api/admin/organizations/:id/subscription` | Upgrade tier, change status, or extend validity duration |
| `GET` | `/api/admin/plans` | List all SaaS subscription plans with subscriber counts |
| `POST` | `/api/admin/plans` | Create a new SaaS subscription tier |
| `PATCH` | `/api/admin/plans/:id` | Update pricing, bed caps, and feature lists for a SaaS tier |

### Properties & Buildings (`/api/properties`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/properties` | List all properties for the organization |
| `POST` | `/api/properties` | Create new building with auto-generated floors |
| `GET` | `/api/properties/:id` | Get property details with floors, rooms, and beds |
| `PATCH` | `/api/properties/:id` | Update property name, city, address, gender type, amenities |
| `DELETE` | `/api/properties/:id` | Delete building and all child floors/rooms/beds |
| `GET` | `/api/properties/:id/dashboard` | Dashboard KPIs (occupancy, rent due, complaints) |

### Inventory (`/api/inventory`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inventory/rooms` | Create room with auto-generated beds matching sharing type |
| `PATCH` | `/api/inventory/rooms/:roomId` | Update room details (name, base rent, AC, floor) |
| `DELETE` | `/api/inventory/rooms/:roomId` | Delete room & vacant beds (blocked if active residents exist) |
| `PATCH` | `/api/inventory/beds/:id/status` | Update bed status (VACANT, OCCUPIED, etc.) |
| `DELETE` | `/api/inventory/beds/:id` | Delete vacant bed |

### Residents & Stays (`/api/tenants`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/tenants` | List all tenants with stay contracts & KYC |
| `POST` | `/api/tenants/onboard` | Onboard resident (supports `bedIds: string[]` for multi-bed) |
| `PATCH` | `/api/tenants/:id` | Update resident profile (contact, emergency, workplace, address) |
| `POST` | `/api/tenants/:id/revise-rent` | Revise monthly agreed rent / escalation with stay & invoice sync |
| `DELETE` | `/api/tenants/:id` | Delete resident record with cascade & release beds |
| `POST` | `/api/tenants/:id/checkout` | Check out resident & vacate all allocated beds |

### Billing & Payments (`/api/billing`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/billing/invoices` | List invoices with stay, bed, and payment details |
| `POST` | `/api/billing/pay/initiate` | Initiate 0% MDR UPI payment |
| `POST` | `/api/billing/pay/webhook` | Webhook payment settlement |
| `POST` | `/api/billing/pay/cash` | Record offline cash payment in ledger |

### Maintenance & Tickets (`/api/complaints`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/complaints` | List maintenance tickets with media URLs |
| `POST` | `/api/complaints` | Create ticket with message and media |
| `PATCH` | `/api/complaints/:id/status` | Update ticket status (OPEN, IN_PROGRESS, RESOLVED) |

---

## 📋 Antigravity AI Development Rules
1. **Always maintain TypeScript types** across `admin/src/types.ts` and `mobile/src/types.ts` and ensure `npm run build` succeeds on `admin`, `mobile`, and `backend`.
2. **Never break the multi-bed edge case**: A resident can occupy multiple beds across rooms.
3. **Keep code clean and scalable**: Avoid monolithic bloat; use modular components and native CSS tokens.
4. **Update this file (`FEATURES.md`)** whenever modifying business logic, adding new filters, or enhancing existing workflows.

