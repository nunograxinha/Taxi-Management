# Taxi Fleet & Ride-Hailing Management Platform (MEAN Stack)

A full-stack MEAN (**MongoDB, Express, Angular, Node.js**) web application for managing a taxi fleet, driver shifts, live GPS tracking, in-trip chat, customer bookings, and operational analytics with real-time Socket.IO synchronization.

---

## Key Features

### 1. Manager Portal (`/manager`)

- **Live Fleet Monitor:** Real-time overview of online active rides, vehicles in active service, pending driver confirmations, and drivers currently on shift, plus an interactive Leaflet map with click-to-toggle rides and search by driver, NIF, client, plate, or status.
- **Fleet Management (`/manager/manage-taxis`):** Register, search, edit, and delete taxis with Portuguese license plate validation, vehicle thumbnails, and shift-integrity guards.
- **Driver Management (`/manager/manage-drivers`):** Register, search, edit, and delete drivers (NIF, driver's license, 18+ age validation, CSV postal-code lookup), plus live star rating averages and clickable **Driver Reviews** modal with passenger comments.
- **Pricing & Simulator (`/manager/manage-prices`):** Configure per-minute rates (`Basic` / `Luxury`) and nighttime surcharge (`9 PM – 6 AM`) with a built-in fare simulator.
- **Operational Reports (`/manager/reports`):** Filter by date range or quick presets (*Today*, *Last 7 days*, *This month*), drill down into trips/hours/kilometers/revenue, inspect **Hourly/Daily Activity**, **Basic vs Luxury** breakdown, and **Top Drivers**, and export reports to **CSV**.

### 2. Driver Portal (`/driver` & `/driver/portal`)

- **JWT Role Authentication & Password Management:** Secure login using driver NIF/password with password change modal.
- **Current Shift & Inline Reviews:** View active shift vehicle details, completed trips with inline passenger comments, and a **My Reviews** modal displaying 5★–1★ distribution and written feedback.
- **Shift Scheduling (`/driver/portal/shifts`):** Book shifts up to 8 hours with overlap prevention and automatic filtering of available taxis.
- **Pending Ride Requests (`/driver/portal/pending-requests`):** Live request queue filtered by vehicle comfort, passenger capacity, proximity (Haversine distance), and remaining shift time.
- **Live Navigation & Active Trip (`/driver/accepted-request/:pedidoId`):** Turn-by-turn OSRM directions, real-time GPS broadcasting over Socket.IO, passenger count adjustments, trip start/end timing, nighttime fare calculation, and live **Client ↔ Driver chat**.

### 3. Customer Portal (`/client`)

- **Interactive Ride Booking:** Request rides using browser GPS or street/postal search on permanent **Pickup** and **Destination** Leaflet maps with **OSRM nearest-road snapping**, saved **Favorite Places** (`GET/PUT /client/:id/favorites`), and **Recent Places** dropdown.
- **Driver Confirmation & Night Warnings (`/client/confirm-trip/:pedidoId`):** Inspect assigned driver rating, vehicle model/capacity, ETA, estimated fare, and nighttime surcharge warning before accepting or rejecting.
- **Live Trip Tracking & Public Sharing (`/client/track-trip/:pedidoId` & `/share-trip/:shareToken`):** Watch the assigned taxi approach and travel in real time, chat live with the driver, generate a read-only public sharing link, rate the driver (`1–5 ★` + comment), and view/print **Trip Receipts** and **Trip History**.

### 4. Discreet Audio & Browser Notifications (All Portals)

- Synthesized **Web Audio API** chimes per real-time event (new request, driver accepted/confirmed, trip updates, chat messages, cancellations) with persistent **Mute / Sound** toggle (`localStorage`) and optional background-tab **Browser Desktop Notifications** across Manager, Driver, and Client navbars.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Angular 16, TypeScript, RxJS, Angular Material, Socket.IO Client, Leaflet (OpenStreetMap + Nominatim + OSRM), Web Audio API, PapaParse |
| **Backend** | Node.js, Express 5, Socket.IO, Mongoose (MongoDB), Scrypt password hashing, JWT (`HS256`), CORS, Dotenv |
| **Database & DevOps** | MongoDB 7 (Docker / Local / Atlas), Docker & Docker Compose |

---

## Project Structure

```text
psi-2425-main/
├── docker-compose.yml              # Full-stack orchestration (MongoDB + Backend + Frontend)
├── backend/
│   ├── controllers/                # REST API & Auth controllers
│   ├── middleware/                 # JWT authentication & role-based guards
│   ├── models/                     # Mongoose schemas (Taxi, Driver, Shift, Trip, RideRequest, Price, Client)
│   ├── routes/                     # Express API route definitions
│   ├── services/                   # Business logic, ratings, favorites & persistence
│   ├── tests/                      # Node native test runner suite (auth & business logic)
│   ├── utils/                      # Password hashing & HS256 JWT utilities
│   ├── socket.js                   # Socket.IO rooms, live fleet GPS & MongoDB-backed trip chat
│   ├── .env.example                # Environment variables template
│   └── server.js                   # Express + HTTP/Socket.IO entrypoint
└── frontend/
    └── taxi_app/
        └── src/
            ├── app/
            │   ├── appServices/    # HTTP services, Socket.IO, Geolocation/OSRM, Auth, Audio/Desktop alerts
            │   ├── client/         # Booking, favorites/recent, waiting, confirmation, tracking, sharing
            │   ├── drivers/        # Driver auth, portal dashboard, pending/accepted requests, CRUD
            │   ├── manage-prices/  # Pricing configuration & trip fare simulator
            │   ├── manager/        # Manager dashboard & Live Fleet Monitor
            │   ├── reports/        # Analytics charts, breakdowns & CSV export
            │   ├── shared/         # Trip chat drawer, Alert Mute toggle, Driver Reviews modal
            │   ├── shifts/         # Shift scheduling, listing & current shift details
            │   ├── taxis/          # Taxi fleet management components
            │   └── trips/          # Completed trip interfaces
            └── assets/             # Taxi vehicle icons & Portuguese postal codes dataset (CSV)
```

---

## Getting Started

### Option A: Quick Start with Docker (Recommended)

Run MongoDB, Backend API, and Angular Frontend together:

```bash
docker compose up --build
```

- **Frontend:** `http://localhost:4200`
- **Backend API:** `http://localhost:3073`

### Option B: Manual Setup

#### Prerequisites

- **Node.js** (v18+) and **npm**
- **MongoDB** (local instance or MongoDB Atlas)

#### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm start
```

Available environment variables in `backend/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/psi
PORT=3073
JWT_SECRET=change-this-jwt-secret-in-production
MANAGER_PASSWORD=admin123
```

Run backend unit tests:

```bash
cd backend
npm test
```

#### 2. Frontend Setup

```bash
cd frontend/taxi_app
npm install
npm start
```

Open `http://localhost:4200` in your browser.

---

## Main API Endpoints & Real-Time Events

| Area | Method & Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /auth/manager/login`, `POST /auth/driver/login`, `POST /auth/client/login` | Issue role-scoped JWT tokens |
| **Drivers** | `GET / POST /driver`, `GET / PUT / DELETE /driver/:nif` | Manage drivers & view driver ratings (`ratingAverage`, `ratingCount`) |
| **Clients** | `GET / POST /client`, `GET / PUT /client/:id/favorites` | Client registration & saved favorite addresses |
| **Taxis** | `GET / POST /taxi`, `GET / PUT / DELETE /taxi/:plate` | Fleet management & availability validation |
| **Shifts** | `GET / POST /shift`, `GET /shift/driver/:nif`, `GET /shift/interval` | Shift booking & schedule conflict verification |
| **Pricing** | `GET / PUT /price` | Per-minute comfort tariffs & nighttime surcharge |
| **Ride Requests** | `GET / POST /rideRequest`, `PATCH /rideRequest/:id/acceptDriver\|acceptClient\|reject` | Ride lifecycle dispatch & driver/client confirmation |
| **Public Share** | `POST /rideRequest/:id/share`, `GET /rideRequest/share/:token` | Generate & read public live-tracking share links |
| **Trips** | `GET / POST /trip`, `GET /trip/driver/:id`, `PATCH /trip/:id/rate` | Completed trips, driver history & 1–5★ passenger ratings/comments |
| **Socket.IO** | `joinPedido`, `driverLocation`, `fleet:getLocations`, `chat:getHistory`, `chat:send` | Live taxi coordinates, fleet overview & MongoDB-persisted trip chat |
