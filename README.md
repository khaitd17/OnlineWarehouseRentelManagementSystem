# 🏗 ONLINE WAREHOUSE RENTAL MANAGEMENT SYSTEM (WMS)

Fullstack system for managing warehouse rental operations.

---

# 🛠 TECH STACK

## 🖥 Backend
- ASP.NET Core Web API
- Clean Architecture
- Entity Framework Core
- SQL Server
- JWT Authentication

## 🌐 Frontend
- React
- React Router DOM
- Axios

---

# 📁 PROJECT STRUCTURE

```
warehouse-management-system/
│
├── backend/
│   ├── WMS.Domain
│   ├── WMS.Application
│   ├── WMS.Infrastructure
│   ├── WMS.API
│   ├── tests
│   └── WMS.sln
│
└── frontend/
    ├── public
    └── src
```

---

# 🧱 BACKEND ARCHITECTURE (CLEAN ARCHITECTURE)

## 🟢 WMS.Domain
- Entities
- Enums
- Interfaces

## 🟢 WMS.Application
- Business logic
- DTOs
- Service interfaces

## 🟢 WMS.Infrastructure
- Database (EF Core)
- Repository implementations
- Persistence configuration

## 🟢 WMS.API
- Controllers
- Middleware
- JWT Authentication
- Swagger configuration

---

# 🌐 FRONTEND STRUCTURE

```
src/
│
├── components/
├── pages/
├── services/
├── routes/
├── layouts/
└── App.js
```

---

# 🚀 HOW TO RUN BACKEND

## 1️⃣ Go to API project
```bash
cd backend/WMS.API
```

## 2️⃣ Restore packages
```bash
dotnet restore
```

## 3️⃣ Run API
```bash
dotnet run
```

Swagger will be available at:

```
https://localhost:xxxx/swagger
```

---

# 🗄 DATABASE (CODE FIRST)

## 🟢 Create Migration
```bash
dotnet ef migrations add MigrationName --project ../WMS.Infrastructure --startup-project .
```

## 🟢 Update Database
```bash
dotnet ef database update --project ../WMS.Infrastructure --startup-project .
```

---

# 🌐 HOW TO RUN FRONTEND

## 1️⃣ Go to frontend
```bash
cd frontend
```

## 2️⃣ Install dependencies
```bash
npm install
```

## 3️⃣ Start React app
```bash
npm start
```

---

# 🔐 AUTHENTICATION

- JWT-based authentication
- Token stored in localStorage
- Protected routes enabled
- Role-based authorization supported

---

# 📦 API RESPONSE FORMAT

All APIs should return:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

---

# 🌳 GIT WORKFLOW (QUY TRÌNH LÀM VIỆC NHÓM)

## 🔴 KHÔNG được push trực tiếp vào nhánh `main`

---

## 🟢 Quy trình làm việc chuẩn

1. Tạo branch mới từ `main`

```
git checkout main
git pull origin main
git checkout -b ten-branch-cua-ban
```

2. Code và commit theo chức năng

```
git add .
git commit -m "Mô tả chức năng"
```

3. Push lên GitHub

```
git push origin ten-branch-cua-ban
```

4. Tạo Pull Request

5. Thành viên khác review

6. Sau khi review xong mới được merge vào `main`

---


# 🧑‍💻 DEVELOPMENT CONVENTIONS

## 🟢 Backend Naming Convention

- Classes → PascalCase  
- Methods → PascalCase  
- Variables → camelCase  
- DTOs → Tên + Dto  
- Interfaces → I + Tên  

Ví dụ:
```
IUserService
CreateContractDto
WarehouseService
```

---

## 🟢 Frontend Naming Convention

- Components → PascalCase  
- Variables → camelCase  
- Functions → camelCase  
- Folder names → lowercase  

Ví dụ:
```
LoginPage.jsx
warehouseService.js
authContext.js
```

---

# 👥 TEAM STRUCTURE

- Main branch: `main`
- Each member works on their own branch
- Merge via Pull Request only

---

# 📄 LICENSE

Student Project – For academic use only.