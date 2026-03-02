🏗 ONLINE WAREHOUSE RENTAL MANAGEMENT SYSTEM (WMS)

Fullstack system for managing warehouse rental operations.

🛠 TECH STACK
🖥 Backend

ASP.NET Core Web API

Clean Architecture

CQRS Pattern

MediatR

Entity Framework Core (Code First)

SQL Server

JWT Authentication

FluentValidation

🌐 Frontend

React

React Router DOM

Axios

🧱 BACKEND ARCHITECTURE

(Clean Architecture + CQRS + MediatR)

The backend is built using Clean Architecture combined with CQRS (Command Query Responsibility Segregation) and MediatR.

The system is divided into 4 main layers:

backend/
├── WMS.Domain
├── WMS.Application
├── WMS.Infrastructure
└── WMS.API
🟢 1️⃣ WMS.Domain (Core Layer)

Contains the core business model:

Entities (Warehouse, User, Contract, etc.)

Enums

Repository Interfaces

Core domain rules

⚠ This layer does NOT depend on any other layer.

Example structure:

WMS.Domain/
├── Entities/
│     ├── Warehouse.cs
│     └── User.cs
├── Enums/
└── Interfaces/
      ├── IWarehouseRepository.cs
      └── IUserRepository.cs
🟢 2️⃣ WMS.Application (Business Logic + CQRS Layer)

This layer contains all business logic and follows the CQRS pattern.

It includes:

Commands (write operations)

Queries (read operations)

Handlers (business logic execution)

Validators (input validation)

DTOs

📌 Feature-Based Structure

Each feature is organized separately:

WMS.Application/
└── Features/
     └── Warehouses/
          ├── Create/
          │     ├── CreateWarehouseCommand.cs
          │     ├── CreateWarehouseHandler.cs
          │     └── CreateWarehouseValidator.cs
          ├── Update/
          ├── Delete/
          └── GetById/
📌 CQRS Concept

Command → Changes data (Create, Update, Delete)

Query → Retrieves data (Get, Search)

Each Command/Query has its own Handler

No large traditional service classes

Example:

CreateWarehouseCommand → CreateWarehouseHandler
GetWarehouseByIdQuery → GetWarehouseByIdHandler

Each Handler acts as a small, focused service.

🟢 3️⃣ WMS.Infrastructure (Persistence Layer)

Responsible for data access and external services.

Contains:

EF Core DbContext

Repository implementations

Entity configurations

Migrations

JWT implementation

Example:

WMS.Infrastructure/
├── Persistence/
│     └── ApplicationDbContext.cs
├── Repositories/
│     └── WarehouseRepository.cs
└── Migrations/

Implements interfaces defined in the Domain layer.

🟢 4️⃣ WMS.API (Presentation Layer)

Responsible for handling HTTP requests.

Contains:

Controllers

Middleware

Swagger configuration

JWT Authentication setup

Controller responsibilities:

Receive request

Send Command/Query via MediatR

Return standardized response

Example:

await _mediator.Send(new CreateWarehouseCommand(...));

Controllers do NOT contain business logic.

🔄 REQUEST FLOW (CQRS FLOW)
Frontend
   ↓
Controller
   ↓
MediatR
   ↓
Command / Query
   ↓
Handler
   ↓
Repository
   ↓
Database
📁 FRONTEND STRUCTURE
frontend/
└── src/
     ├── components/
     ├── pages/
     ├── services/
     ├── routes/
     ├── layouts/
     └── App.js
Folder Responsibilities

components → Reusable UI components

pages → Page-level components

services → API calls (Axios)

routes → Routing configuration

layouts → Shared layouts (Navbar, Sidebar)

🔐 AUTHENTICATION

JWT-based authentication

Token stored in localStorage

Role-based authorization

Protected routes enabled

🗄 DATABASE (CODE FIRST)
Create Migration
dotnet ef migrations add MigrationName --project ../WMS.Infrastructure --startup-project .
Update Database
dotnet ef database update --project ../WMS.Infrastructure --startup-project .
🚀 HOW TO RUN BACKEND
1️⃣ Go to API project
cd backend/WMS.API
2️⃣ Restore packages
dotnet restore
3️⃣ Run API
dotnet run

Swagger will be available at:

https://localhost:xxxx/swagger
🌐 HOW TO RUN FRONTEND
1️⃣ Go to frontend
cd frontend
2️⃣ Install dependencies
npm install
3️⃣ Start React app
npm start
🔍 VALIDATION STRATEGY

Validation is implemented in 3 layers:

1️⃣ Input Validation

Implemented in Application layer

Using FluentValidation

2️⃣ Business Rule Validation

Implemented in Handler or Domain

Example: Email uniqueness, business constraints

3️⃣ Database Constraints

Unique index

Foreign key constraints

Configured in Infrastructure layer

📦 STANDARD API RESPONSE FORMAT

All APIs return:

{
  "success": true,
  "message": "Request successful",
  "data": {}
}
🌳 GIT WORKFLOW (TEAM DEVELOPMENT)
❌ Do NOT push directly to main
✅ Standard workflow

1️⃣ Create new branch from main

git checkout main
git pull origin main
git checkout -b your-branch-name

2️⃣ Commit your changes

git add .
git commit -m "Feature description"

3️⃣ Push to GitHub

git push origin your-branch-name

4️⃣ Create Pull Request

5️⃣ Code review

6️⃣ Merge after approval

🧑‍💻 DEVELOPMENT CONVENTIONS
Backend Naming Convention

Classes → PascalCase

Methods → PascalCase

Variables → camelCase

DTOs → Name + Dto

Interfaces → I + Name

Example:

IUserRepository
CreateContractDto
WarehouseEntity
Frontend Naming Convention

Components → PascalCase

Variables → camelCase

Functions → camelCase

Folder names → lowercase

Example:

LoginPage.jsx
warehouseService.js
authContext.js
🎯 WHY CQRS?

CQRS is used because:

Clear separation between read and write operations

Better scalability

Cleaner business logic organization

Easier maintenance for larger teams

Suitable for enterprise-style architecture

👥 TEAM STRUCTURE

Main branch: main

Each member works on their own branch

Merge via Pull Request only

📄 LICENSE

Student Project – For academic use only.