# PG Flow — Enterprise PG & Coliving Management Ecosystem

A complete, production-grade management platform for Paying Guest (PG) and Coliving operators built with **React Native**, **Node.js (TypeScript)**, and **Prisma ORM with PostgreSQL**.

---

## 🌟 Comprehensive Real-World Feature Set

### 1. Universal Building Switcher & Property Management
- **Instant Building Switcher Dropdown**: Switch between properties on the fly via the top bar without logging out or reloading.
- **Add Property Engine (`+ New Building`)**:
  - Add new buildings with property name, city, full address, gender segregation (Boys / Girls / Unisex Coliving).
  - Select amenities (WiFi, Daily Food, Housekeeping, CCTV, Power Backup, Gym, Biometric Access).
  - **Automatic Floor Generation**: Creates floors (`1st Floor`, `2nd Floor`, `3rd Floor`, etc.) upon property creation so rooms can be added immediately.

### 2. Room Creation & Bed Mapping Engine
- **Add Room & Map Beds (`+ Add Room / Beds`)**:
  - Select Floor, Room Number (e.g. 101, 204), Room Type (Single, Double, Triple, 4-Sharing), Base Rent, and AC toggle.
  - Automatically maps granular bed units (e.g., `101-A`, `101-B`, `101-C`).
- **Visual Bed Occupancy Grid**:
  - Real-time status badges:
    - 🟢 **Vacant**: Click to allocate tenant or manage bed.
    - 🔴 **Occupied**: Click to view resident's complete profile and emergency contacts.
    - 🟡 **Reserved**: Token advance paid.
    - ⚪ **Maintenance**: Repairs/cleaning.

### 3. Comprehensive Tenant Onboarding (Multi-Bed Edge Case Handled)
- **Multi-Bed Allocation for a Single Tenant**:
  - Real-world scenario handled: A tenant can acquire **more than one bed** (e.g. paying for both beds in a 2-sharing room for privacy/work from home).
  - Multi-bed checkbox selector dynamically sums suggested rents while allowing custom discount overrides.
- **Complete Real-Life Tenant Profile & KYC**:
  - Full Name, Phone, Email
  - Workplace / College Name (e.g., *Google India* / *St. Joseph's College*)
  - Emergency Contact Name & Relation (e.g., *Father / Guardian*)
  - Emergency Phone Number
  - Permanent Home Address (City, State, House No)
  - Govt ID Proof Type & Number (Aadhaar, Passport, PAN, Voter ID)
  - Monthly Agreed Rent, Security Deposit, and Check-in Date.
- **Tenants Directory**:
  - Full roster of residents in the building, highlighting multi-bed tags, room/bed numbers, monthly rent, and direct WhatsApp contact.
- **1-Click Checkout / Bed Release**:
  - Seamless check-out that marks stay `CHECKED_OUT` and automatically frees all allocated beds back to `VACANT`.

### 4. Zero Transaction Fee Rent Collection (The Blinkit Model)
- Built on NPCI's **0% MDR (Merchant Discount Rate)** mandate for standard bank UPI transfers.
- Integrated with **PhonePe PG SDK** and **UPI Intent** (`upi://pay?pa=...`) for instant in-app payment with Google Pay, PhonePe, Paytm, or CRED.
- Owners keep **100% of collected rent** (no 2% gateway deduction).
- In-app cash ledger with confirmation.

### 5. Simplified Complaints Portal
- Resident tenants submit:
  - Issue category (Plumbing, Electrical, WiFi, Cleaning, Other)
  - Description message
  - **Up to 3 media items** (photos or short video clips)
- Real-time status badges: `Open` ➔ `In Progress` ➔ `Resolved`.

---

## 🛠️ Architecture & Tech Stack

- **Mobile App**: React Native (TypeScript) with responsive web and native mobile rendering.
- **Backend API**: Node.js + Express (TypeScript), modular domain-driven architecture.
- **Database & ORM**: PostgreSQL with Prisma ORM (`prisma/schema.prisma`).
- **Payments**: 0.00% fee PhonePe Payment Gateway / Direct UPI Intent integration.

---

## 🚀 Running the Project

### 1. Backend (`/backend`)
```bash
cd backend

# Database migrations & seed
npx prisma migrate dev
npm run prisma:seed

# Start development server (Port 5050)
npm run dev
```

### 2. Mobile App (`/mobile`)
```bash
cd mobile

# Start preview (Port 3000)
npm run dev
```

- **Backend API**: `http://localhost:5050/health`
- **Mobile Frontend Preview**: `http://localhost:3000/`
