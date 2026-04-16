# Military Asset Management System - Documentation

## 1. Project Overview
The Military Asset Management System is a full-stack application designed to allow commanders and logistics personnel to securely manage, trace, and execute logistics for military assets (vehicles, weapons, and ammunition) across multiple interconnected bases.

## 2. Tech Stack & Architecture
- **Frontend**: React, built with Vite for optimal performance. Uses `react-router-dom` for client-side routing, Context API for state management, and `Tailwind CSS` for responsive, modern styling.
- **Backend**: Node.js and Express. Handles API requests, performs RBAC assertions, and wraps complex sequential logic inside SQL Transactions to ensure database atomic structure.
- **Database**: SQLite. A lightweight, file-based relational database that perfectly handles relationships between Bases, Assets, and Transactions without requiring an external DB installation.

## 3. Data Models / Schema
1. **Users**: (`id`, `username`, `password`, `role`, `base_id`).
2. **Bases**: (`id`, `name`, `location`).
3. **Assets**: (`id`, `name`, `category`).
4. **Inventory**: (`id`, `asset_id`, `base_id`, `quantity`).
5. **Transactions**: (`id`, `transaction_type`, `asset_id`, `quantity`, `from_base_id`, `to_base_id`, `assigned_to`, `date`, `created_by`).

## 4. Role-Based Access Control (RBAC) Explanation
The app uses JWT (JSON Web Tokens) to verify Identity and Role mapping:
- **Admin**: Can view all inventory, manage users/bases, record global purchases, and view all transfers and assignments.
- **Base Commander**: Restricted to their own base. Can view their base's inventory and initiate inter-base transfers or internal assignments.
- **Logistics Officer**: Restricted to their own base. Mostly handling internal day-to-day operations: tracking expenditures (assignments) and acquiring new purchases.

## 5. API Logging (Endpoints Overview)
- `POST /api/auth/login`: Authenticates user and returns JWT.
- `GET /api/inventory`: Fetches aggregated asset inventory based on user role (Admin sees all, others see own base mapping).
- `GET /api/transactions`: Fetches all net movements (Purchases, Transfers, Assignments).
- `POST /api/transactions/purchase`: Logic to insert newly ordered gear directly into a target base.
- `POST /api/transactions/transfer`: Highly restricted logic allowing commander to shift assets. Uses standard SQL Transactions (Rollback on failure) to prevent duplication.
- `POST /api/transactions/assignment`: Dispatches inventory out of a base for consumption or unit tracking.

## 6. Setup Instructions
To run this application locally:

### Terminal 1: Backend
1. Open a terminal and navigate to `military-asset-management/backend`.
2. Run `npm install` to install Express, SQLite3, Bcrypt, and JWT.
3. Run `node src/index.js` to start the server on `http://localhost:5000`. (This will also auto-seed the SQLite database with initial data).

### Terminal 2: Frontend
1. Open a new terminal and navigate to `military-asset-management/military-asset-management`.
2. Run `npm install` to setup React, Vite, and Tailwind.
3. Run `npm run dev` to start the local development server.
4. Visit `http://localhost:5173` in your browser.

## 7. Login Credentials
_You can use the following accounts configured during database seeding:_
- **Admin**: Username: `admin` | Password: `password123`
- **Alpha Base Commander**: Username: `commander_alpha` | Password: `password123`
- **Alpha Base Logistics**: Username: `logistics_alpha` | Password: `password123`
- **Bravo Base Commander**: Username: `commander_bravo` | Password: `password123`
