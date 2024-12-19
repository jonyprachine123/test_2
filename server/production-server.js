import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// In-memory store for production
let inMemoryDB = {
  products: [],
  orders: [],
  banners: []
};

// Load initial data
try {
  const initialData = {
    products: [],
    orders: [],
    banners: []
  };
  inMemoryDB = initialData;
} catch (err) {
  console.error('Error loading initial data:', err);
}

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// API Routes
app.get('/api/products', (req, res) => {
  res.json(inMemoryDB.products);
});

app.post('/api/products', upload.single('image'), (req, res) => {
  try {
    const { title, description, price, discount } = req.body;
    const features = JSON.parse(req.body.features || '[]');
    
    const newProduct = {
      id: Date.now(),
      title,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
      features,
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
      createdAt: new Date().toISOString()
    };
    
    inMemoryDB.products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/orders', (req, res) => {
  res.json(inMemoryDB.orders);
});

app.post('/api/orders', (req, res) => {
  try {
    const { customerName, email, phone, address, productId, quantity } = req.body;
    
    const newOrder = {
      id: Date.now(),
      customerName,
      email,
      phone,
      address,
      productId,
      quantity: parseInt(quantity),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    inMemoryDB.orders.push(newOrder);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/banners', (req, res) => {
  res.json(inMemoryDB.banners);
});

app.post('/api/banners', upload.single('image'), (req, res) => {
  try {
    const { title, description, price, discount, link } = req.body;
    
    const newBanner = {
      id: Date.now(),
      title,
      description,
      price: parseFloat(price),
      discount: parseFloat(discount),
      link,
      image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null,
      createdAt: new Date().toISOString()
    };
    
    inMemoryDB.banners.push(newBanner);
    res.status(201).json(newBanner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// For Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
