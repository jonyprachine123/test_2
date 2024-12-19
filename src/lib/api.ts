// Base URL configuration
const isDevelopment = import.meta.env.DEV;
const VERCEL_URL = import.meta.env.VITE_VERCEL_URL;

// In production, use the Vercel URL or fallback to relative path
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api'
  : VERCEL_URL 
    ? `https://${VERCEL_URL}/api`
    : '/api';

// API endpoints configuration
export const endpoints = {
  baseUrl: isDevelopment 
    ? 'http://localhost:5000' 
    : VERCEL_URL 
      ? `https://${VERCEL_URL}`
      : '',
  admin: {
    login: `${API_BASE_URL}/admin/login`,
  },
  products: {
    list: `${API_BASE_URL}/products`,
    create: `${API_BASE_URL}/products`,
    update: (id: string) => `${API_BASE_URL}/products/${id}`,
    delete: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  orders: {
    list: `${API_BASE_URL}/orders`,
    create: `${API_BASE_URL}/orders`,
    update: (id: string) => `${API_BASE_URL}/orders/${id}`,
    delete: (id: string) => `${API_BASE_URL}/orders/${id}`,
  },
  banners: {
    list: `${API_BASE_URL}/banners`,
    create: `${API_BASE_URL}/banners`,
    update: (id: string) => `${API_BASE_URL}/banners/${id}`,
    delete: (id: string) => `${API_BASE_URL}/banners/${id}`,
  },
  reviews: {
    list: `${API_BASE_URL}/reviews`,
    create: `${API_BASE_URL}/reviews`,
    update: (id: string) => `${API_BASE_URL}/reviews/${id}`,
    delete: (id: string) => `${API_BASE_URL}/reviews/${id}`,
  },
};
