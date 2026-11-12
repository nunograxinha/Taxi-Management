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
| **Frontend** | Angular 16, TypeScript, RxJS, Angular Material, Leaflet (OpenStreetMap & Nominatim API), PapaParse |
| **Backend** | Node.js, Express 5, Mongoose (MongoDB), CORS, Dotenv |
| **Database** | MongoDB (Local or MongoDB Atlas) |

---

## 📁 Project Structure

```text
psi-2425-main/
├── backend/
│   ├── controllers/      # REST API request handlers
│   ├── models/           # Mongoose schemas & validations (Taxi, Motorista, Turno, Viagem, etc.)
│   ├── routes/           # Express route definitions
│   ├── services/         # Data access layer & business logic
│   ├── .env.example      # Environment variables template
│   └── server.js         # Express server entry point
└── frontend/
    └── taxi_app/
        └── src/
            ├── app/
            │   ├── appServices/   # Angular services (HttpClient, Geolocation, State)
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

### Prerequisites
- **Node.js** (v18 or higher) and **npm**
- **MongoDB** (local instance or MongoDB Atlas cluster)

### 1. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` folder (you can copy `.env.example`):
```env
MONGODB_URI=mongodb://localhost:27017/taxi_app
PORT=3073
```

Start the backend server:
```bash
npm start
```
> The API will be running at `http://localhost:3073` and will automatically seed the default pricing configuration on startup.

### 2. Frontend Setup
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
| **Drivers** | `GET / POST` | `/motorista` | List all drivers or register a new driver |
| | `GET / PUT / DELETE` | `/motorista/:nif` | Get, update, or delete a driver by NIF |
| **Taxis** | `GET / POST` | `/taxi` | List all taxis or register a new taxi |
| | `GET / PUT / DELETE` | `/taxi/:plate` | Get, update, or delete a taxi by license plate |
| **Shifts** | `GET / POST` | `/turno` | List all shifts or create a new shift |
| | `GET` | `/turno/intervalo` | Check driver shifts within a time range (`motoristaNIF`, `start`, `end`) |
| | `GET` | `/turno/motorista/:motoristaNIF` | List shifts for a specific driver |
| **Pricing** | `GET / PUT` | `/preco` / `/preco/:id` | Get or update per-minute rates and night surcharge |
| **Ride Requests** | `GET / POST` | `/pedidoViagem` | List pending ride requests or create a new request |
| | `PATCH` | `/pedidoViagem/:id/acceptMotorista` | Driver accepts a ride request |
| | `PATCH` | `/pedidoViagem/:id/acceptClient` | Customer confirms the assigned driver |
| | `PATCH` | `/pedidoViagem/:id/reject` | Customer rejects the assigned driver |
| **Trips** | `GET / POST` | `/viagem` | List completed trips or record a finished trip |
