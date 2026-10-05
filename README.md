# SeniorCare (SCS) — Senior Citizen Management & Safety Support System

> Advanced, professional, full-stack SaaS web platform for senior citizen care coordination, 24/7 emergency response, daily safety check-ins, medical appointments, care fee billing, bilingual AI chatbot, and regulatory reporting.

---

## 🌟 Key Features

* **Role-Specific Dashboards (6 Distinct Roles)**:
  * **System Administrator**: Full platform governance, Recharts operational analytics (registrations trend, emergency resolution, check-in compliance, fee collections), user management, and security audit logs.
  * **Care Staff**: Senior resident directory, appointment scheduling, fee billing, check-in compliance tracking, and Excel reporting.
  * **Senior Citizen**: Large, high-contrast accessible interface, **"✓ I AM SAFE"** one-tap daily check-in with celebration feedback, **"🚨 EMERGENCY"** quick access button, assigned caregiver direct call card, my family contacts, and scheduled appointments.
  * **Family Member**: Linked elderly parent/relative monitoring, live safety status, active incident alerts, caregiver direct contact, and fee settlements.
  * **Primary Caregiver**: Assigned residents list, missed check-ins queue, active emergency response panel (*Acknowledge*, *Escalate*, *Resolve*), and care notes.
  * **Care Volunteer**: Task marketplace for voluntary assistance (*Medicine Pickup*, *Food Delivery*, *Grocery Shopping*, *Hospital Escort*), with one-click *Accept* and *Complete* status transitions.
* **Emergency Quick Access & Real-Time Broadcast**:
  * Persistent high-visibility **🚨 EMERGENCY** button.
  * Emits real-time WebSocket events via **Socket.IO** to Caregivers, Family, Staff, and Admin simultaneously.
  * Multi-step status progression: `Active` → `Acknowledged` → `Escalated` → `Resolved` with immutable audit log.
* **Daily Safety Monitoring ("I AM SAFE")**:
  * One-tap wellness confirmation with mood selection (*Good*, *Fair*, *Tired*, *Unwell*) and notes.
  * Automatic streak tracking (e.g., *14 consecutive days safe*).
  * Caregiver queue for seniors with missed check-ins.
* **Floating Bilingual AI Chatbot**:
  * Modern floating interface at the bottom-right of the screen.
  * Bilingual understanding and answers in **English** and **தமிழ் (Tamil)**.
  * Handles questions on appointments, pending fees, check-ins, and caregiver contacts.
  * Direct interactive **Emergency button** trigger embedded within the chat flow.
* **Complete English & Tamil (தமிழ்) Localization**:
  * Instant 1-click toggle updating all navigation, cards, forms, dialogs, toasts, and error messages.
* **Modern SaaS Layout & Design**:
  * Glassmorphism, tailored HSL color tokens, dark/light/calm mode themes.
  * Global search with instant autocomplete across seniors, appointments, and emergencies.
  * Notification center with unread badge and dropdown management panel.
  * Reusable confirmation dialogs for destructive actions.
* **Care Fees & Payments Module**:
  * Tracks total billed, collected, and remaining balances.
  * Progress bars per fee item.
  * Payment recording modal with receipts audit log.
* **Reports & Excel Import/Export**:
  * 6 Auditable Report Types: *Senior Registry*, *Emergency Response*, *Check-in Compliance*, *Appointments*, *Fee Collections*, *Assistance Requests*.
  * Printable/PDF layout and `.xlsx` export.
  * Excel spreadsheet import with row validation and error reporting.

---

## 🏗️ Architecture & Technology Stack

* **Frontend**:
  * React 18, Vite
  * Lucide React (modern icon library)
  * Recharts (interactive data visualizations)
  * Axios (JWT interceptors & API client)
  * Canvas Confetti (celebration effects)
  * Socket.IO Client (real-time WebSocket updates)
* **Backend**:
  * Node.js, Express.js (MVC architecture)
  * MongoDB with Mongoose (compatible with MongoDB Compass)
  * Socket.IO (bi-directional event broadcasting)
  * JWT (24-hour expiration) & bcryptjs password hashing
  * XLSX library (Excel generation and validation)
  * Google OAuth2 verification
* **Database**:
  * MongoDB Compass (`mongodb://127.0.0.1:27017/senior_care`)
  * Collections: `users`, `seniors`, `caregivers`, `familymembers`, `volunteers`, `checkins`, `emergencies`, `appointments`, `assistancerequests`, `fees`, `payments`, `notifications`, `notificationpreferences`, `recentlyaccesseds`, `auditlogs`.

---

## 🚀 How to Run the Application

### 1. MongoDB Compass Setup
1. Open **MongoDB Compass**.
2. Connect to URI:
   ```text
   mongodb://127.0.0.1:27017
   ```
3. Database Name: `senior_care`

### 2. Backend Setup & Database Seeding
Open a terminal window:
```bash
cd backend
npm install
npm run seed
npm start
```
* Backend runs on: `http://localhost:5000`
* `npm run seed` populates all collections with realistic data and builds `sample_data.xlsx`.

### 3. Frontend Setup
Open a second terminal window:
```bash
cd frontend
npm install
npm run dev
```
* Frontend runs on: `http://localhost:5174`

---

## 🔑 Test Login Accounts

All test accounts share the common password:
```text
SeniorCare@2026!
```

| Role | Email |
| :--- | :--- |
| **System Admin** | `admin.test@seniorcare.local` |
| **Care Staff** | `staff.test@seniorcare.local` |
| **Senior Citizen** | `senior.test@seniorcare.local` |
| **Family Member** | `family.test@seniorcare.local` |
| **Caregiver / Caretaker** | `caretaker.test@seniorcare.local` |
| **Volunteer** | `volunteer.test@seniorcare.local` |

> 💡 **Tip**: On the login page, you can also click any of the **Quick Demo Login buttons** to test any role with a single click!

---

## 📑 REST API Endpoints Overview

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Email/password sign-in |
| | `POST` | `/api/auth/register` | Register new user |
| | `POST` | `/api/auth/quick-demo-login` | Instant demo login for presentation |
| | `POST` | `/api/auth/google` | Google OAuth token verification |
| | `GET` | `/api/auth/me` | Fetch authenticated user |
| | `PATCH` | `/api/auth/profile` | Update profile details |
| **Seniors** | `GET` | `/api/seniors` | List seniors with filters |
| | `GET` | `/api/seniors/:id` | Detailed senior profile tabs |
| | `POST` | `/api/seniors` | Add new senior citizen |
| | `PATCH` | `/api/seniors/:id` | Update senior record |
| | `DELETE` | `/api/seniors/:id` | Delete senior record |
| **Emergencies** | `GET` | `/api/emergencies` | List active & resolved emergencies |
| | `POST` | `/api/emergencies` | Trigger emergency (EMG-XXXX) |
| | `PATCH` | `/api/emergencies/:id/status`| Acknowledge, escalate, resolve |
| **Safety** | `GET` | `/api/checkins` | Check-in history logs |
| | `POST` | `/api/checkins` | Record "I AM SAFE" check-in |
| | `GET` | `/api/checkins/today-summary`| Today's compliance counts |
| **Appointments** | `GET` | `/api/appointments` | List medical visits |
| | `POST` | `/api/appointments` | Schedule consultation |
| | `PATCH` | `/api/appointments/:id` | Update / complete appointment |
| **Assistance** | `GET` | `/api/assistance` | List assistance requests |
| | `POST` | `/api/assistance` | Post food/medicine request |
| | `PATCH` | `/api/assistance/:id/status`| Accept / complete workflow |
| **Fees** | `GET` | `/api/fees` | List fees and financial summary |
| | `POST` | `/api/fees/:id/pay` | Record payment and generate receipt |
| **Reports** | `GET` | `/api/reports/:type` | Generate report data |
| | `GET` | `/api/reports/export/excel` | Export spreadsheet (.xlsx) |
| | `POST` | `/api/reports/import/excel` | Import spreadsheet with validation |
| **Chatbot** | `POST` | `/api/chatbot/message` | Bilingual AI contextual answers |
| **Search** | `GET` | `/api/search` | Global instant search |
| | `GET` | `/api/search/recently-accessed` | View recent records |
