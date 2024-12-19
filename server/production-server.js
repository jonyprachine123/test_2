import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: config.corsOrigin,
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
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.all('SELECT * FROM products ORDER BY createdAt DESC');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, discount } = req.body;
    const features = JSON.stringify(JSON.parse(req.body.features || '[]'));
    const image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

    const result = await db.run(
      'INSERT INTO products (title, description, price, discount, features, image) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, parseFloat(price), parseFloat(discount), features, image]
    );

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.all('SELECT * FROM orders ORDER BY createdAt DESC');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, email, phone, address, productId, quantity } = req.body;

    const result = await db.run(
      'INSERT INTO orders (customerName, email, phone, address, productId, quantity) VALUES (?, ?, ?, ?, ?, ?)',
      [customerName, email, phone, address, productId, parseInt(quantity)]
    );

    const newOrder = await db.get('SELECT * FROM orders WHERE id = ?', [result.lastID]);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.get('/api/banners', async (req, res) => {
  try {
    const banners = await db.all('SELECT * FROM banners ORDER BY createdAt DESC');
    res.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
});

app.post('/api/banners', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, discount, link } = req.body;
    const image = req.file ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}` : null;

    const result = await db.run(
      'INSERT INTO banners (title, description, price, discount, link, image) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, parseFloat(price), parseFloat(discount), link, image]
    );

    const newBanner = await db.get('SELECT * FROM banners WHERE id = ?', [result.lastID]);
    res.status(201).json(newBanner);
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
});

// Reviews endpoints
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await db.all('SELECT * FROM reviews ORDER BY createdAt DESC');
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { name, rating, comment } = req.body;

    const result = await db.run(
      'INSERT INTO reviews (name, rating, comment) VALUES (?, ?, ?)',
      [name, parseInt(rating), comment]
    );

    const newReview = await db.get('SELECT * FROM reviews WHERE id = ?', [result.lastID]);
    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

app.put('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, rating, comment } = req.body;

    await db.run(
      'UPDATE reviews SET name = ?, rating = ?, comment = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [name, parseInt(rating), comment, id]
    );

    const updatedReview = await db.get('SELECT * FROM reviews WHERE id = ?', [id]);
    if (!updatedReview) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const review = await db.get('SELECT * FROM reviews WHERE id = ?', [id]);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    await db.run('DELETE FROM reviews WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: config.nodeEnv === 'production' ? 'in-memory' : 'file-based'
  });
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
  const port = config.port;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
