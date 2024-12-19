const isDevelopment = process.env.NODE_ENV === 'development';

export const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3000/api'
  : '/api';

export const api = {
  products: {
    list: `${API_BASE_URL}/products`,
    create: `${API_BASE_URL}/products`,
  },
  orders: {
    list: `${API_BASE_URL}/orders`,
    create: `${API_BASE_URL}/orders`,
  },
  banners: {
    list: `${API_BASE_URL}/banners`,
    create: `${API_BASE_URL}/banners`,
  },
};
