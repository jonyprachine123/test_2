const isDevelopment = process.env.NODE_ENV === 'development';
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5000/api'
  : '/api';

export const endpoints = {
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
  },
  banners: {
    list: `${API_BASE_URL}/banners`,
    create: `${API_BASE_URL}/banners`,
    update: (id: string) => `${API_BASE_URL}/banners/${id}`,
  },
};
