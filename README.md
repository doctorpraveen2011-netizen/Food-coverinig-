# FOODCOVERING 2.0 — Smart Food Safety, Donation & Multi-Dashboard Management System

> **Tagline**: Safe Food • Healthy Tomorrow  
> **Framework**: React 19 + TypeScript + Vite + Tailwind CSS (Frontend) | Express + Node 24 + TypeScript (Backend)

FoodCovering 2.0 is an enterprise-grade food safety monitoring and community surplus donation application. It features **three distinct, isolated dashboard experiences** driven by a secure, centralized authentication and role-based access control (RBAC) engine.

---

## 1. Multi-Role Architecture

The dashboard and permitted operations automatically adapt based on the user's authenticated credentials and database-assigned role:

```text
                             FOODCOVERING 2.0
                                    |
                            SECURE LOGIN PAGE
                                    |
                    Server verifies bcrypt hash & JWT
                                    |
                        Read role from database
                                    |
             +----------------------+----------------------+
             |                      |                      |
        NORMAL_USER        SUPERMARKET_OFFICIAL   HEAD_OFFICE_ADMIN
             |                      |                      |
             v                      v                      v
     CITIZEN DASHBOARD     SUPERMARKET DASHBOARD   EXECUTIVE ADMIN
     (/user/dashboard)    (/supermarket/dashboard) (/admin/dashboard)
```

### The Three Account Roles

| Role Key | Target Route | Purpose & Authorized Capabilities |
| :--- | :--- | :--- |
| **`NORMAL_USER`** | `/user/dashboard` | **Citizens & Donors**: Public registration workflow. Can scan food freshness using AI, submit personal surplus donations, track active volunteer pickups in real-time, file food safety complaints against stores, and update personal profile. **Cannot** access store or administrative data. |
| **`SUPERMARKET_OFFICIAL`** | `/supermarket/dashboard` | **Retail Store Leads**: Provisioned by Head Office Administrator. Scoped strictly to their assigned supermarket and branch. Can manage food inventory batches, track expiry warnings, flag near-expiry stock for surplus charity donations, verify volunteer handovers, respond to store complaints, and export branch audits. **Cannot** access other supermarkets' private data. |
| **`HEAD_OFFICE_ADMIN`** | `/admin/dashboard` | **Enforcement Directorate**: Initialized securely via server environment variables. Platform-wide authority: register supermarkets & branches, provision official accounts, activate/deactivate users, conduct central food safety incident rulings, monitor fleet telemetry, broadcast alerts, inspect immutable audit logs, and monitor backend health. |

---

## 2. Credentials & Test Accounts

The database comes pre-seeded with verified test accounts for each role:

| Role | Email / Identifier | Password | Authorized Scope |
| :--- | :--- | :--- | :--- |
| **Head Office Admin** | `admin@foodcovering.gov` | `Admin@Secure2026!` | Nationwide platform oversight |
| **Supermarket Official** | `official@freshmart.com` | `Official@123` | FreshMart Supermarkets (`sm-001`), Connaught Place Flagship |
| **Supermarket Official** | `official@greenbasket.com` | `Official@123` | GreenBasket Hypermarket (`sm-002`), DLF Phase 1 Branch |
| **Normal User (Citizen)** | `user@foodcovering.com` | `User@123` | Aditi Verma (Rohini, New Delhi) |
| **Normal User (Citizen)** | `rahul.sen@example.com` | `User@123` | Rahul Sen (North Delhi) |

> **Note**: The login screen also features quick-fill test pill buttons to allow 1-click credential loading during evaluation.

---

## 3. Installation & Running the Project

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### 1. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables
Copy the example environment files:
```bash
# Server environment variables
cp server/.env.example server/.env
```
Ensure `server/.env` contains your desired initial administrator credentials:
```env
PORT=5000
JWT_SECRET=foodcovering_super_secure_jwt_secret_2026_rbac_system
INITIAL_ADMIN_EMAIL=admin@foodcovering.gov
INITIAL_ADMIN_PASSWORD=Admin@Secure2026!
INITIAL_ADMIN_NAME=Head Office Administrator
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Start Both Frontend & Backend
To run both concurrently in one command:
```bash
npm run dev:all
```

Or run them individually in separate terminals:
- **Terminal 1 (Backend Server on Port 5000)**:
  ```bash
  npm run server
  ```
- **Terminal 2 (Frontend Client on Port 5173)**:
  ```bash
  npm run dev
  ```

---

## 4. Automated RBAC & Security Test Suite

The project includes an automated test runner verifying all 13 core security rules:
- Unauthenticated requests blocked with `401 Unauthorized`
- Invalid passwords rejected with `401 Unauthorized`
- Public citizen registration assigns strictly `NORMAL_USER` role
- Normal users can access citizen endpoints (`200 OK`)
- Normal users blocked from admin endpoints (`403 Forbidden`)
- Normal users blocked from supermarket endpoints (`403 Forbidden`)
- Supermarket officials receive scoped store dashboards (`200 OK`)
- Supermarket officials blocked from admin endpoints (`403 Forbidden`)
- Multi-tenant data isolation: Officials blocked from editing another store's inventory (`403 Forbidden`)
- Head Office Administrators login and access executive controls (`200 OK`)
- Head Office Administrator provisions official accounts (`201 Created`)

Run the test suite anytime:
```bash
node server/test-auth-rbac.js
```

---

## 5. API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Public citizen registration (`NORMAL_USER` only)
- `POST /api/auth/login` — Central credentials verification; returns JWT & assigned role
- `GET /api/auth/me` — Returns current authenticated user and branch scope
- `POST /api/auth/logout` — Invalidates session and logs audit event
- `POST /api/auth/change-password` — Secure password update

### Normal User Endpoints (`/api/user`)
- `GET /api/user/dashboard` — Personal donation stats, active pickups, complaints
- `GET /api/user/donations` — My personal donation history
- `POST /api/user/donations` — Schedule new surplus food donation
- `GET /api/user/complaints` — My submitted food safety reports
- `POST /api/user/complaints` — Report spoiled or contaminated food
- `GET /api/user/tracking` — Live GPS telemetry and volunteer route
- `PUT /api/user/profile` — Update contact information & default address

### Supermarket Official Endpoints (`/api/supermarket`)
- `GET /api/supermarket/dashboard` — Store-specific KPI cards, near-expiry alerts
- `GET /api/supermarket/inventory` — Branch inventory list with search and filters
- `POST /api/supermarket/inventory` — Add new batch (barcode, category, expiry, status)
- `PUT /api/supermarket/inventory/:id` — Update batch or flag for surplus charity
- `DELETE /api/supermarket/inventory/:id` — Retire batch from inventory
- `GET /api/supermarket/donations` — Commercial surplus donation log
- `POST /api/supermarket/donations` — Queue commercial surplus batch for charity
- `PUT /api/supermarket/donations/:id/handover` — Confirm physical handover to volunteer
- `GET /api/supermarket/complaints` — Inquiries filed against this branch
- `POST /api/supermarket/complaints/:id/respond` — Register official store response & logs
- `POST /api/supermarket/complaints/:id/escalate` — Escalate contamination incident to Head Office
- `GET /api/supermarket/reports` — Aggregate store audit report with CSV export
- `GET /api/supermarket/settings` — Branch scope and official password management

### Head Office Administrator Endpoints (`/api/admin`)
- `GET /api/admin/dashboard` — Nationwide executive metrics and store comparisons
- `GET /api/admin/supermarkets` — List all supermarkets and authorized branches
- `POST /api/admin/supermarkets` — Register new retail partner & branch
- `POST /api/admin/supermarket-officials` — Provision official store lead accounts
- `GET /api/admin/users` — Platform user directory with role and status filtering
- `PUT /api/admin/users/:id/status` — Activate or deactivate user accounts
- `GET /api/admin/complaints` — Nationwide food safety complaints
- `PUT /api/admin/complaints/:id` — Formal inspector ruling and case closing
- `GET /api/admin/donations` — Master nationwide donation dispatch
- `GET /api/admin/audit-logs` — Immutable platform security audit trail
- `GET /api/admin/alerts` — Central alert broadcast management
- `POST /api/admin/alerts` — Broadcast alert to stores or consumers
- `GET /api/admin/system/health` — Infrastructure health and database ledger stats

### AI Food Freshness (`/api/v1/analyze`)
- `POST /api/v1/analyze` — Evaluates food freshness condition (Fresh, Moderate, Spoiled), risk grade, model confidence, and actionable recommendations.
