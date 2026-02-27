import axios from 'axios';
import { LoginCredentials, Request, Transaction } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🌐 API URL:', API_URL); // Pour vérifier

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('📡 Requête:', config.method?.toUpperCase(), config.url); // Debug
  return config;
});

export const login = async (credentials: LoginCredentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData: any) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getRequests = async () => {
  const response = await api.get('/requests');
  return response.data;
};

export const getRequestById = async (id: number) => {
  const response = await api.get(`/requests/${id}`);
  return response.data;
};

export const createRequest = async (data: Partial<Request>) => {
  const response = await api.post('/requests', data);
  return response.data;
};

export const updateRequest = async (id: number, data: Partial<Request>) => {
  const response = await api.put(`/requests/${id}`, data);
  return response.data;
};

export const submitRequest = async (id: number) => {
  const response = await api.put(`/requests/${id}/submit`);
  return response.data;
};

export const updateRequestStatus = async (id: number, status: string) => {
  const response = await api.put(`/requests/${id}/status`, { status });
  return response.data;
};

export const deleteRequest = async (id: number) => {
  const response = await api.delete(`/requests/${id}`);
  return response.data;
};

export const getBudget = async () => {
  const response = await api.get('/budget/current');
  return response.data;
};

export const updateBudget = async (year: number, data: { total_amount: number; remaining_amount?: number }) => {
  const response = await api.put(`/budget/${year}`, data);
  return response.data;
};

export const getTransactions = async (year?: number): Promise<{ success: boolean; data: Transaction[] }> => {
  const url = year ? `/transactions?year=${year}` : '/transactions';
  const response = await api.get(url);
  return response.data;
};

export const getTransactionDetails = async (id: number): Promise<{ success: boolean; data: Transaction }> => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

export default api;