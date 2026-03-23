export type UserRole = 'ADMIN' | 'HOD' | 'VERIFIER';

export interface UserProfile {
  uid: string;
  role?: UserRole;
  name: string;
  email: string;
  employeeId?: string;
  isApproved?: boolean;
  department?: string;
  signatureBase64?: string;
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number';
  options?: string[];
  required: boolean;
}

export interface Template {
  templateId: string;
  name: string;
  version: number;
  content: string;
  schema: TemplateField[];
  isActive: boolean;
  allowedDurations?: string[];
  allowedStartDates?: string[];
}

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Application {
  trackingId: string;
  studentEmail: string;
  templateId: string;
  department: string;
  status: ApplicationStatus;
  formData: Record<string, any>;
  securityHash?: string;
  timestamps: {
    submittedAt: any;
    approvedAt?: any;
  };
}

export interface Company {
  id: string;
  name: string;
  designation: string;
  address: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  hodName?: string;
  hodEmail?: string;
  hodMobile?: string;
}

export interface AcademicSession {
  id: string;
  name: string; // e.g. "2022-26"
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "3rd Year"
}

export interface Duration {
  id: string;
  name: string; // e.g. "3 Months"
}

export interface StartDate {
  id: string;
  name: string; // e.g. "2024-06-01"
}

export interface HODInfo {
  id: string;
  name: string;
  email: string;
  mobile: string;
  branchId: string;
}
