# Contract Extension Frontend Implementation

## Overview

Complete TypeScript React frontend implementation for Contract Extension functionality in the Online Warehouse Rental Management System. This includes components for renters to request extensions, owners to approve/reject requests, and digital contract signing flow.

## 🏗️ Architecture

### Tech Stack
- **React 18** with TypeScript
- **Ant Design** for UI components
- **Axios** for API communication
- **CSS-in-JS** for styling

### Key Features
1. **Renter Extension Requests**: Submit and track extension requests
2. **Owner Extension Management**: Review, approve, or reject requests
3. **Digital Contract Signing**: OTP-based signature flow
4. **Real-time Status Updates**: Live tracking of extension status
5. **Email Notifications**: Integration with backend notification system

## 📁 File Structure

```
frontend/src/
├── types/
│   └── contractExtension.ts          # TypeScript interfaces
├── services/
│   └── contractExtensionService.ts   # API service layer
├── components/contract/
│   ├── ExtensionRequestModal.tsx     # Extension request form modal
│   └── ContractCard.tsx              # Contract display card
├── pages/
│   ├── RenterExtensionPage.tsx       # Renter dashboard
│   ├── OwnerExtensionPage.tsx        # Owner management page
│   └── ContractSigningPage.tsx       # Digital signing interface
└── index.ts                          # Export declarations
```

## 🎯 Core Components

### 1. ExtensionRequestModal.tsx
Modal component for submitting extension requests with:
- Duration selection (1-24 months)
- Predefined reason templates
- Cost calculation preview
- Form validation
- Real-time end date calculation

### 2. ContractCard.tsx
Displays contract information with:
- Contract status indicators
- Expiry warnings (7-day alert)
- Extension eligibility checking
- Action buttons based on contract state

### 3. RenterExtensionPage.tsx
Complete dashboard for renters featuring:
- **Contracts Tab**: View all contracts with extension capabilities
- **Extensions Tab**: Track submitted extension requests
- Advanced filtering and search
- Status badges and notifications

### 4. OwnerExtensionPage.tsx
Management interface for owners with:
- **Pending Reviews**: Extensions awaiting approval
- **Pending Signatures**: Approved extensions needing signing
- Detailed extension information
- Approve/reject functionality with custom pricing

### 5. ContractSigningPage.tsx
Digital signature workflow including:
- Multi-step signing process
- OTP authentication via email
- Real-time progress tracking
- Role-based interface (Owner/Renter)

## 🔧 API Integration

### Service Layer (contractExtensionService.ts)
Provides comprehensive API methods:

```typescript
// Extension Management
requestExtension(data: ExtensionRequest): Promise<ContractExtension>
getPendingExtensions(): Promise<ContractExtension[]>
approveExtension(id: number, data: ApprovalData): Promise<ContractExtension>
rejectExtension(id: number, data: RejectionData): Promise<ContractExtension>

// Utility Methods
calculateNewEndDate(currentEndDate: string, months: number): Date
calculateAdditionalCost(monthlyPayment: number, months: number): number
checkExtensionEligibility(contract: Contract): EligibilityResult
```

### API Endpoints Used
- `POST /api/contract-extensions/request` - Submit extension request
- `GET /api/contract-extensions/pending` - Get pending requests (Owner)
- `GET /api/contract-extensions/pending-signature` - Get approved extensions needing signature
- `POST /api/contract-extensions/{id}/approve` - Approve extension
- `POST /api/contract-extensions/{id}/reject` - Reject extension
- `GET /api/contract-extensions/my-extensions` - Get user's extensions

## 📱 User Experience Flow

### Renter Flow
1. **View Contracts** → Navigate to RenterExtensionPage
2. **Check Eligibility** → System validates extension eligibility (90-day rule)
3. **Request Extension** → Fill ExtensionRequestModal with duration/reason
4. **Track Progress** → Monitor status in Extensions tab
5. **Sign Contract** → Complete OTP signing when approved

### Owner Flow
1. **Receive Notification** → Email/in-app notification of new request
2. **Review Request** → Examine details in OwnerExtensionPage
3. **Make Decision** → Approve with custom pricing or reject with reason
4. **Sign Contract** → Owner signs first via OTP authentication
5. **Monitor Completion** → Track renter signature completion

### Extension Status Flow
```
PENDING → APPROVED/REJECTED
    ↓
APPROVED → New Contract (PENDING_OWNER_SIGNATURE)
    ↓
PENDING_OWNER_SIGNATURE → PENDING_RENTER_SIGNATURE (after owner signs)
    ↓
PENDING_RENTER_SIGNATURE → PENDING_PAYMENT (after renter signs)
    ↓
PENDING_PAYMENT → ACTIVE (after payment)
```

## 🎨 UI/UX Features

### Design System
- **Consistent Colors**: Primary blue (#1677ff), Success green (#52c41a), Warning orange (#fa8c16)
- **Typography**: Clear hierarchy with Ant Design's typography system
- **Icons**: Semantic icons for all actions and states
- **Responsive**: Mobile-first design with grid system

### Key UX Improvements
1. **Status Indicators**: Color-coded badges for all states
2. **Progress Tracking**: Step-by-step progress visualization
3. **Smart Defaults**: Pre-filled forms based on context
4. **Validation Feedback**: Real-time form validation
5. **Loading States**: Proper loading indicators for all async operations

### Accessibility
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader compatibility
- High contrast color ratios

## 🚀 Integration Guide

### 1. Install Dependencies
```bash
npm install antd @ant-design/icons
npm install @types/react @types/react-dom  # if not already installed
```

### 2. Import Components
```typescript
import { RenterExtensionPage, OwnerExtensionPage } from './src';
```

### 3. Add to Router
```typescript
// Add to your routing configuration
<Route path="/extensions" element={<RenterExtensionPage />} />
<Route path="/manage-extensions" element={<OwnerExtensionPage />} />
<Route path="/sign-contract/:contractId" element={<ContractSigningPage />} />
```

### 4. Configure API Base URL
Update `axiosClient.js` to point to your backend:
```typescript
const axiosClient = axios.create({
  baseURL: 'https://localhost:5276/api',  // Your backend URL
  timeout: 10000,
});
```

### 5. Add Navigation Menu Items
```typescript
// For Renters
<Menu.Item key="extensions" icon={<ContainerOutlined />}>
  <Link to="/extensions">Quản lý hợp đồng</Link>
</Menu.Item>

// For Owners
<Menu.Item key="manage-extensions" icon={<ClockCircleOutlined />}>
  <Link to="/manage-extensions">Duyệt gia hạn</Link>
</Menu.Item>
```

## ⚙️ Configuration

### Environment Variables
```env
REACT_APP_API_BASE_URL=https://localhost:5276/api
REACT_APP_OTP_EXPIRE_TIME=300  # 5 minutes
```

### Customization Options
1. **Duration Options**: Modify in `contractExtensionService.ts`
2. **Reason Templates**: Update predefined reasons
3. **UI Theme**: Customize Ant Design theme
4. **Validation Rules**: Adjust form validation in components

## 🔍 Testing Recommendations

### Unit Testing
Test each component with different props and states:
```typescript
// Example test for ExtensionRequestModal
describe('ExtensionRequestModal', () => {
  it('should calculate correct additional cost', () => {
    // Test cost calculation logic
  });

  it('should validate form input correctly', () => {
    // Test form validation
  });
});
```

### Integration Testing
- API service methods with mock responses
- User flow from request to completion
- Error handling scenarios

### E2E Testing
- Complete renter extension request flow
- Owner approval/rejection workflow
- Contract signing process

## 🚨 Error Handling

### API Errors
- Network failures with retry mechanisms
- Validation errors with user-friendly messages
- Authentication errors with redirect to login

### Form Validation
- Client-side validation for immediate feedback
- Server-side validation error display
- Input sanitization and security

### Edge Cases
- Contract eligibility edge cases (exactly 90 days before expiry)
- OTP expiry handling
- Concurrent modification scenarios

## 📈 Performance Optimizations

1. **Code Splitting**: Lazy load pages
2. **Memoization**: React.memo for heavy components
3. **API Caching**: Cache static data like reason templates
4. **Virtual Scrolling**: For large contract lists
5. **Debounced Search**: Prevent excessive API calls

## 🔗 Related Backend Endpoints

Ensure these backend endpoints are implemented:
- Contract CRUD operations
- Extension workflow management
- OTP generation and verification
- Email notification system
- User authentication and authorization

## 🎉 Features Implemented

✅ Complete TypeScript implementation
✅ Responsive design with Ant Design
✅ Comprehensive error handling
✅ Real-time status updates
✅ Form validation and sanitization
✅ Multi-role interface support
✅ Digital signature workflow
✅ Cost calculation and preview
✅ Extension eligibility validation
✅ Professional UI/UX design

This implementation provides a production-ready frontend for the contract extension system with modern React practices, TypeScript safety, and professional user experience.