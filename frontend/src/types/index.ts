export interface User {
  id: number;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'BENEFICIARY';
  first_name?: string;
  last_name?: string;
}

export interface Request {
  id: number;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PAID';
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: number;
  year: number;
  total_amount: number;
  remaining_amount: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
}

export interface Transaction {
  id: number;
  request_id: number;
  amount: number;
  type: string;
  beneficiary_name: string;
  beneficiary_email: string;
  approved_by: string;
  paid_by: string;
  approved_at: string;
  paid_at: string;
  status: 'PAID';
}