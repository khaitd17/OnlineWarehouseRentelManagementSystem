// Contract Extension Types for TypeScript

export interface Contract {
  contractId: number;
  contractNumber: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  status: 'DRAFT' | 'PENDING_OWNER_SIGNATURE' | 'PENDING_RENTER_SIGNATURE' | 'PENDING_PAYMENT' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  warehouseId: number;
  warehouseName?: string;
  renterId: number;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  ownerSignatureExpiry?: string;
  renterSignatureExpiry?: string;
  paymentExpiry?: string;
}

export interface ContractExtension {
  extensionId: number;
  originalContractId: number;
  newContractId?: number;
  requesterId: number;
  reviewerId?: number;
  durationMonths: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  newMonthlyPayment?: number;
  reviewNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  originalContract?: Contract;
  newContract?: Contract;
  requester?: User;
  reviewer?: User;
}

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface ExtensionRequest {
  contractId: number;
  durationMonths: number;
  reason: string;
  proposedStartDate?: string;
}

export interface ExtensionReview {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  newMonthlyPayment?: number;
}

export interface ExtensionSummary {
  currentEndDate: string;
  newEndDate: string;
  durationText: string;
  additionalCost: number;
  formattedCost: string;
  totalMonthsAfterExtension: number;
}

export interface ExtensionStatusDisplay {
  text: string;
  color: 'orange' | 'green' | 'red' | 'gray';
  description: string;
}

export interface DurationOption {
  value: number;
  label: string;
}

export interface ReasonTemplate {
  value: string;
  label: string;
  template?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Form Types
export interface ExtensionFormData {
  durationMonths: number;
  reason: string;
  templateReason?: string;
}

export interface ExtensionReviewFormData {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  newMonthlyPayment?: number;
  reviewNotes?: string;
}

// Component Props Types
export interface ExtensionRequestModalProps {
  contract: Contract;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ExtensionListProps {
  extensions: ContractExtension[];
  loading?: boolean;
  onRefresh?: () => void;
  userRole: 'RENTER' | 'OWNER' | 'ADMIN';
}

export interface ContractCardProps {
  contract: Contract;
  onRequestExtension?: (contract: Contract) => void;
  showExtensionButton?: boolean;
}