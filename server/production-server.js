import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './config.js';

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
  const initialData = JSON.parse(fs.readFileSync(path.join(__dirname, 'initial-data.json'), 'utf8'));
  inMemoryDB = initialData;
} catch (err) {
  console.error('Error loading initial data:', err);
}

// Middleware
app.use(cors({
  origin: config.corsOrigin
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../dist')));

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
  const { title, description, price, discount } = req.body;
  const features = JSON.parse(req.body.features || '[]');
  
  const newProduct = {
    id: Date.now(),
    title,
    description,
    price,
    discount,
    features,
    image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null
  };
  
  inMemoryDB.products.push(newProduct);
  res.json(newProduct);
});

app.get('/api/orders', (req, res) => {
  res.json(inMemoryDB.orders);
});

app.post('/api/orders', (req, res) => {
  const { customerName, email, phone, address, productId, quantity } = req.body;
  
  const newOrder = {
    id: Date.now(),
    customerName,
    email,
    phone,
    address,
    productId,
    quantity,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  inMemoryDB.orders.push(newOrder);
  res.json(newOrder);
});

app.get('/api/banners', (req, res) => {
  res.json(inMemoryDB.banners);
});

app.post('/api/banners', upload.single('image'), (req, res) => {
  const { title, description, price, discount, link } = req.body;
  
  const newBanner = {
    id: Date.now(),
    title,
    description,
    price,
    discount,
    link,
    image: req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null
  };
  
  inMemoryDB.banners.push(newBanner);
  res.json(newBanner);
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
