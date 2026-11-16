# 🚕 Taxi Fleet & Ride-Hailing Management Platform (MEAN Stack)

A full-stack web application built with the **MEAN stack (MongoDB, Express, Angular, Node.js)** for managing a taxi fleet, driver shifts, and real-time ride requests with geolocation and interactive maps.

---

## Key Features

The platform is divided into three user roles:

### 1. Manager Portal (`/gestor`)
- **Fleet Management (Taxis):** Register, list (sorted by latest update), edit, and delete taxis with Portuguese license plate validation and protection against deleting or changing comfort levels on taxis with assigned shifts.
- **Driver Management:** Register, edit, and delete drivers with Tax ID (NIF), driver's license, and minimum age (18+) validation, plus automatic city lookup from Portuguese postal codes (`CSV`).
- **Pricing Configuration & Simulator:** Configure per-minute rates (Basic and Luxury) and nighttime surcharge (9 PM – 6 AM), including a built-in trip cost simulator.
- **Daily Reports:** View daily operational metrics and statistics (total trips, hours driven, and kilometers traveled per driver).

### 2. Driver Portal (`/motorista`)
- **NIF Authentication:** Quick access to the driver dashboard.
- **Shift Management:** Book shifts (up to 8 hours, preventing overlapping schedules) with automatic filtering of available taxis for the selected time window.
- **Pending Ride Requests:** Browse customer ride requests matching the active shift's taxi comfort level and fitting within the remaining shift time, sorted by proximity to the customer (Haversine formula).
- **Ride Execution:** Record trip start and end times with GPS coordinates, automatically calculate the final fare (accounting for daytime/nighttime minutes), and log completed rides to the active shift.

### 3. Customer Portal (`/cliente`)
- **Ride Booking with Interactive Map:** Select pickup location (via live browser GPS or Postal Code) and destination (by clicking directly on an interactive **Leaflet / OpenStreetMap** map or geocoding a street address).
- **Driver Confirmation:** Review assigned driver and vehicle details, estimated arrival time, estimated fare, and nighttime surcharge warnings, with the option to accept or reject the driver.
- **Live Trip Tracking:** Track ride status in real time (*Waiting for driver*, *In progress*, and *Completed* with total duration and final price).

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Angular 16, TypeScript, RxJS, Angular Material (`MatSnackBar`), Socket.IO Client, Leaflet (OpenStreetMap & Nominatim API), PapaParse |
| **Backend** | Node.js, Express 5, Socket.IO, Mongoose (MongoDB), JWT (HS256), CORS, Dotenv |
| **Database & DevOps** | MongoDB (Local / MongoDB Atlas), Docker & Docker Compose |

---

## 📁 Project Structure

```text
psi-2425-main/
├── docker-compose.yml    # Full-stack orchestration (MongoDB + Backend + Frontend)
├── backend/
│   ├── controllers/      # REST API & Auth request handlers
│   ├── middleware/       # JWT authentication & role-based access control
│   ├── models/           # Mongoose schemas & validations (Taxi, Motorista, Turno, Viagem, etc.)
│   ├── routes/           # Express route definitions
│   ├── services/         # Data access layer & business logic
│   ├── utils/            # HS256 JWT signing & verification utilities
│   ├── socket.js         # Socket.IO server & real-time room management
│   ├── .env.example      # Environment variables template
│   └── server.js         # Express + HTTP/Socket.IO server entry point
└── frontend/
    └── taxi_app/
        └── src/
            ├── app/
            │   ├── appServices/   # Angular services (HttpClient, Socket.IO, Auth, Guards, Interceptor)
            │   ├── cliente/       # Customer workflow components
            │   ├── gestor/        # Manager dashboard
            │   ├── gerir-precos/  # Pricing management & fare simulator
            │   ├── motoristas/    # Driver management & driver portal components
            │   ├── relatorios/    # Daily reports (hours, distance, trips)
            │   ├── taxis/         # Taxi fleet management components
            │   └── turno/         # Shift booking & listing components
            └── assets/data/       # Postal codes dataset (CSV)
```

---

## Getting Started

### Option A: Quick Start with Docker (Recommended)
Run the entire stack (**MongoDB + Backend + Frontend**) with a single command:
```bash
docker compose up --build
```
- **Frontend:** `http://localhost:4200`
- **Backend API:** `http://localhost:3073`

---

### Option B: Manual Setup

#### Prerequisites
- **Node.js** (v18 or higher) and **npm**
- **MongoDB** (local instance or MongoDB Atlas cluster)

#### 1. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder (you can copy `.env.example`):
```env
MONGO_URI=mongodb://127.0.0.1:27017/psi
PORT=3073
```

Start the backend server:
```bash
npm start
```
> The API will be running at `http://localhost:3073` and will automatically seed the default pricing configuration, initial drivers, and taxis on startup.

#### 2. Frontend Setup
In a new terminal:
```bash
cd frontend/taxi_app
npm install
npm start
```
> Open your browser at `http://localhost:4200`.

---

## Main API Endpoints

| Resource | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Drivers** | `GET / POST` | `/driver` | List all drivers or register a new driver |
| | `GET / PUT / DELETE` | `/driver/:nif` | Get, update, or delete a driver by NIF |
| **Taxis** | `GET / POST` | `/taxi` | List all taxis or register a new taxi |
| | `GET / PUT / DELETE` | `/taxi/:plate` | Get, update, or delete a taxi by license plate |
| **Shifts** | `GET / POST` | `/shift` | List all shifts or create a new shift |
| | `GET` | `/shift/interval` | Check driver shifts within a time range (`motoristaNIF`, `start`, `end`) |
| | `GET` | `/shift/driver/:motoristaNIF` | List shifts for a specific driver |
| **Pricing** | `GET / PUT` | `/price` / `/price/:id` | Get or update per-minute rates and night surcharge |
| **Ride Requests** | `GET / POST` | `/rideRequest` | List pending ride requests or create a new request |
| | `PATCH` | `/rideRequest/:id/acceptDriver` | Driver accepts a ride request |
| | `PATCH` | `/rideRequest/:id/acceptClient` | Customer confirms the assigned driver |
| | `PATCH` | `/rideRequest/:id/reject` | Customer rejects the assigned driver |
| **Trips** | `GET / POST` | `/trip` | List completed trips or record a finished trip |
