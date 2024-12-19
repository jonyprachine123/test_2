import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// In-memory store for production
let inMemoryDB = {
  products: [],
  orders: [],
  banners: []
};

// Load initial data in production
if (isProduction) {
  try {
    const initialData = JSON.parse(fs.readFileSync(path.join(__dirname, 'initial-data.json'), 'utf8'));
    inMemoryDB = initialData;
  } catch (err) {
    console.error('Error loading initial data:', err);
  }
}

// Middleware
app.use(cors({
  origin: config.corsOrigin
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize SQLite database
const dbPath = path.join(__dirname, '../shop.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database at:', dbPath);

  // Create tables in correct order
  db.serialize(() => {
    // Create tables if they don't exist
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      discount INTEGER DEFAULT 0,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, err => {
      if (err) console.error('Error creating products table:', err);
      else console.log('Products table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS product_features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      feature TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`, err => {
      if (err) console.error('Error creating product_features table:', err);
      else console.log('Product features table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      product_id INTEGER,
      product_title TEXT,
      quantity INTEGER,
      total_price REAL,
      status TEXT DEFAULT 'Pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )`, err => {
      if (err) console.error('Error creating orders table:', err);
      else console.log('Orders table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, err => {
      if (err) console.error('Error creating reviews table:', err);
      else console.log('Reviews table ready');
    });

    db.run(`CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      discount INTEGER DEFAULT 0,
      image TEXT NOT NULL,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, err => {
      if (err) console.error('Error creating banners table:', err);
      else console.log('Banners table ready');
    });

    // After tables are created, check and insert sample data
    setTimeout(() => {
      // Check products
      db.get('SELECT COUNT(*) as count FROM products', [], (err, row) => {
        if (err) {
          console.error('Error checking products count:', err);
          return;
        }
        if (row.count === 0) {
          console.log('Inserting sample product...');
          // Insert sample product code...
          db.run(
            'INSERT INTO products (title, description, price, discount, image) VALUES (?, ?, ?, ?, ?)',
            [
              'Syp. Chylosin-DS 450ml',
              'আপনি কি মুখের অরুচি, লিভারের দুর্বলতা, জন্ডিস সহ বিভিন্ন সমস্যায় ভুগছেন! \nঅনেক ডাক্তার দেখিয়ে মেডিসিন নিয়েও কাজ হচ্ছে না? \nতাহলে Sympathy Herbal অফার প্রাইসে নিয়ে এলো বহুমুখী গুনসম্পন্ন ভেষজ হারবাল ঔষধ Chylosin.ds\nপ্রাকৃতিক ঔষধ সেবন করুন, নিজেকে সারা জীবন সুস্থ্য রাখুন',
              6000,
              10,
              'https://www.prachinebangla.com/storage/app/public/product/2024-10-05-6701076548fd0.webp'
            ],
            function(err) {
              if (err) {
                console.error('Error inserting product:', err);
                return;
              }
              const productId = this.lastID;
              
              // Insert features for the product
              const features = [
                'প্রাকৃতিক উপাদানে তৈরি',
                'কোন পার্শ্ব প্রতিক্রিয়া নেই',
                'লিভার রোগের জন্য কার্যকরী',
                'খাবারের রুচি বাড়ায়',
                'হজমে সহায়তা করে'
              ];
              
              features.forEach(feature => {
                db.run(
                  'INSERT INTO product_features (product_id, feature) VALUES (?, ?)',
                  [productId, feature],
                  (err) => {
                    if (err) console.error('Error inserting feature:', err);
                  }
                );
              });
            }
          );
        }
      });

      // Check banners
      db.get('SELECT COUNT(*) as count FROM banners', [], (err, row) => {
        if (err) {
          console.error('Error checking banners count:', err);
          return;
        }
        if (row.count === 0) {
          console.log('Inserting sample banner...');
          db.run(
            'INSERT INTO banners (title, description, price, discount, image, link) VALUES (?, ?, ?, ?, ?, ?)',
            [
              'প্রিমিয়াম হেডফোন',
              'উচ্চ মানের সাউন্ড কোয়ালিটি সহ বিশেষ হেডফোন।',
              5000,
              5,
              'https://www.prachinebangla.com/storage/app/public/product/2024-01-15-65a4e9f5c8f9f.jpg',
              'https://www.prachinebangla.com/product/65a4e9f5c8f9f'
            ],
            (err) => {
              if (err) console.error('Error inserting sample banner:', err);
              else console.log('Sample banner inserted');
            }
          );
        }
      });
    }, 1000); // Wait 1 second for tables to be created
  });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      console.error('Error creating uploads directory:', error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/i;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (allowedTypes.test(ext) && allowedTypes.test(mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Ensure uploads directory exists at startup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory at:', uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
// Get all products
app.get('/api/products', (req, res) => {
  db.all('SELECT p.*, GROUP_CONCAT(pf.feature) as features FROM products p LEFT JOIN product_features pf ON p.id = pf.product_id GROUP BY p.id ORDER BY p.created_at DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    
    // Transform the data to parse features and fix image URLs
    const transformedRows = rows.map(row => ({
      ...row,
      imageUrl: row.image ? `http://localhost:5000${row.image}` : null,
      features: row.features ? row.features.split(',') : []
    }));
    
    res.json(transformedRows);
  });
});

// Get a single product
app.get('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.get(
    'SELECT p.*, GROUP_CONCAT(pf.feature) as features FROM products p LEFT JOIN product_features pf ON p.id = pf.product_id WHERE p.id = ? GROUP BY p.id',
    [productId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to fetch product' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      // Transform the data to parse features and fix image URL
      const transformedRow = {
        ...row,
        imageUrl: row.image ? `http://localhost:5000${row.image}` : null,
        features: row.features ? row.features.split(',') : []
      };
      
      res.json(transformedRow);
    }
  );
});

// Create a new product
app.post('/api/products', upload.single('image'), (req, res) => {
  console.log('Creating new product...');
  console.log('Request body:', req.body);
  console.log('File:', req.file);

  const { title, description, price, discount } = req.body;
  const features = JSON.parse(req.body.features || '[]');
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  // Validate required fields
  if (!title || !price) {
    return res.status(400).json({ error: 'Title and price are required' });
  }

  db.run(
    'INSERT INTO products (title, description, price, discount, image) VALUES (?, ?, ?, ?, ?)',
    [title, description, price, discount || 0, image],
    function(err) {
      if (err) {
        console.error('Error creating product:', err);
        return res.status(500).json({ error: 'Failed to create product' });
      }

      const productId = this.lastID;

      // Insert features if any
      if (features && features.length > 0) {
        const insertFeatures = features.map(feature =>
          new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO product_features (product_id, feature) VALUES (?, ?)',
              [productId, feature],
              (err) => {
                if (err) reject(err);
                else resolve(null);
              }
            );
          })
        );

        Promise.all(insertFeatures)
          .then(() => {
            res.json({
              id: productId,
              title,
              description,
              price,
              discount: discount || 0,
              image,
              imageUrl: image ? `http://localhost:5000${image}` : null,
              features
            });
          })
          .catch(err => {
            console.error('Error creating product features:', err);
            res.status(500).json({ error: 'Failed to create product features' });
          });
      } else {
        res.json({
          id: productId,
          title,
          description,
          price,
          discount: discount || 0,
          image,
          imageUrl: image ? `http://localhost:5000${image}` : null,
          features: []
        });
      }
    }
  );
});

// Update a product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  const productId = req.params.id;
  const { title, description, price, discount } = req.body;
  const features = JSON.parse(req.body.features || '[]');
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Start a transaction
    await new Promise((resolve, reject) => {
      db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    // Update product
    const updates = [];
    const params = [];
    if (title) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price) {
      updates.push('price = ?');
      params.push(price);
    }
    if (discount) {
      updates.push('discount = ?');
      params.push(discount);
    }
    if (image) {
      updates.push('image = ?');
      params.push(image);
    }

    if (updates.length > 0) {
      params.push(productId);
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
          params,
          (err) => {
            if (err) reject(err);
            else resolve(null);
          }
        );
      });
    }

    // Delete old features
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM product_features WHERE product_id = ?', [productId], (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    // Insert new features
    for (const feature of features) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO product_features (product_id, feature) VALUES (?, ?)',
          [productId, feature],
          (err) => {
            if (err) reject(err);
            else resolve(null);
          }
        );
      });
    }

    // Commit transaction
    await new Promise((resolve, reject) => {
      db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve(null);
      });
    });

    res.json({ message: 'Product updated successfully' });
  } catch (err) {
    // Rollback on error
    await new Promise((resolve) => {
      db.run('ROLLBACK', () => resolve(null));
    });
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
app.delete('/api/products/:id', (req, res) => {
  const id = req.params.id;
  
  // First get the product to delete its image if it exists
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    // Delete the image file if it exists
    if (product.image) {
      const imagePath = path.join(__dirname, product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete the product from the database
    db.run('DELETE FROM products WHERE id = ?', id, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: 'Product deleted' });
    });
  });
});

// Create a new order
app.post('/api/orders', async (req, res) => {
  const { customerName, email, phone, address, productId, quantity } = req.body;

  // Validate required fields
  if (!customerName || !phone || !address || !productId || !quantity) {
    return res.status(400).json({ 
      error: 'Required fields missing',
      details: {
        customerName: !customerName ? 'Name is required' : null,
        phone: !phone ? 'Phone is required' : null,
        address: !address ? 'Address is required' : null,
        productId: !productId ? 'Product is required' : null,
        quantity: !quantity ? 'Quantity is required' : null
      }
    });
  }

  // Validate phone number format (Bangladesh)
  const phoneRegex = /^(\+8801|8801|01)[3-9]\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
    return res.status(400).json({ error: 'Invalid phone number format' });
  }

  // Validate email format if provided
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Generate a unique order ID
    const orderId = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Get product details
    const product = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Calculate final price
    const finalPrice = calculateDiscountedPrice(product.price, product.discount);
    const totalPrice = finalPrice * quantity;

    // Insert order into database
    db.run(
      `INSERT INTO orders (
        id, customer_name, email, phone, address, 
        product_id, product_title, quantity, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        customerName,
        email || null, // Make email optional
        phone,
        address,
        productId,
        product.title,
        quantity,
        totalPrice
      ],
      (err) => {
        if (err) {
          console.error('Error creating order:', err);
          return res.status(500).json({ error: 'Failed to create order' });
        }

        // Return the created order
        db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
          if (err) {
            console.error('Error fetching created order:', err);
            return res.status(500).json({ error: 'Order created but failed to fetch it' });
          }
          res.json(order);
        });
      }
    );
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch orders' });
    }
    res.json(rows);
  });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  // Validate status
  const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, orderId],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update order status' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ message: 'Order status updated successfully' });
    }
  );
});

// Update order details
app.put('/api/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { customerName, email, phone, address, productId, quantity, status } = req.body;

  try {
    // Validate status if provided
    if (status) {
      const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    // Get the product details if productId is provided
    let totalPrice = null;
    if (productId) {
      const product = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM products WHERE id = ?', [productId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Calculate total price with discount
      const discountedPrice = product.price - (product.price * (product.discount / 100));
      totalPrice = discountedPrice * quantity;
    }

    // Build the update query dynamically based on provided fields
    const updates = [];
    const params = [];
    if (customerName) {
      updates.push('customer_name = ?');
      params.push(customerName);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (address) {
      updates.push('address = ?');
      params.push(address);
    }
    if (productId) {
      updates.push('product_id = ?');
      params.push(productId);
    }
    if (quantity) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (totalPrice !== null) {
      updates.push('total_price = ?');
      params.push(totalPrice);
    }
    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add orderId to params array
    params.push(orderId);

    const query = `UPDATE orders SET ${updates.join(', ')} WHERE id = ?`;
    console.log('Update query:', query, params);

    db.run(query, params, function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to update order' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }
      res.json({ message: 'Order updated successfully' });
    });
  } catch (err) {
    console.error('Error in update order:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// Delete an order
app.delete('/api/orders/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM orders WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json({ message: 'Order deleted' });
  });
});

// Get all reviews
app.get('/api/reviews', (req, res) => {
  db.all('SELECT * FROM reviews ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
    res.json(rows);
  });
});

// Create a new review
app.post('/api/reviews', (req, res) => {
  const { customerName, rating, comment } = req.body;

  db.run(
    'INSERT INTO reviews (customer_name, rating, comment) VALUES (?, ?, ?)',
    [customerName, rating, comment],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      db.get('SELECT * FROM reviews WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    }
  );
});

// Delete a review
app.delete('/api/reviews/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM reviews WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }
    res.json({ message: 'Review deleted' });
  });
});

// GET endpoint for banners
app.get('/api/banners', (req, res) => {
  console.log('Fetching banners...');
  db.all('SELECT * FROM banners ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('Error fetching banners:', err);
      return res.status(500).json({ error: 'Failed to fetch banners' });
    }
    console.log('Fetched banners:', rows);
    res.json(rows);
  });
});

// Create a new banner
app.post('/api/banners', upload.single('image'), (req, res) => {
  console.log('Creating new banner...');
  console.log('Request body:', req.body);
  console.log('File:', req.file);

  const { title, description, imageUrl } = req.body;
  const price = parseFloat(req.body.price) || 0;
  const discount = parseInt(req.body.discount) || 0;
  const link = req.body.link || null;
  
  // Use either the uploaded file path or the image URL
  const image = req.file ? `/uploads/${req.file.filename}` : (imageUrl || null);

  console.log('Processed data:', {
    title,
    description,
    price,
    discount,
    link,
    image
  });

  if (!title || !description) {
    console.error('Missing required fields');
    return res.status(400).json({ error: 'Title and description are required' });
  }

  if (!image) {
    console.error('No image provided');
    return res.status(400).json({ error: 'Please provide either an image file or image URL' });
  }

  const sql = `
    INSERT INTO banners (title, description, image, price, discount, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [title, description, image, price, discount, link];

  console.log('Executing SQL:', sql);
  console.log('Parameters:', params);

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const bannerId = this.lastID;
    console.log('Created banner with ID:', bannerId);
    
    // Fetch and return the created banner
    db.get('SELECT * FROM banners WHERE id = ?', [bannerId], (err, row) => {
      if (err) {
        console.error('Error fetching created banner:', err);
        return res.status(500).json({ error: 'Banner created but failed to fetch it' });
      }
      console.log('Returning created banner:', row);
      res.json(row);
    });
  });
});

// Delete banner
app.delete('/api/banners/:id', (req, res) => {
  const id = req.params.id;
  console.log('Deleting banner with ID:', id);
  
  // First get the banner to delete its image if it exists
  db.get('SELECT * FROM banners WHERE id = ?', [id], (err, banner) => {
    if (err) {
      console.error('Error fetching banner for deletion:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!banner) {
      console.error('Banner not found:', id);
      res.status(404).json({ error: 'Banner not found' });
      return;
    }

    console.log('Found banner to delete:', banner);

    // Delete the image file if it exists
    if (banner.image) {
      const imagePath = path.join(__dirname, banner.image);
      console.log('Checking for image file:', imagePath);
      
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Deleted image file:', imagePath);
        } catch (error) {
          console.error('Error deleting image file:', error);
        }
      }
    }

    // Delete the banner from the database
    db.run('DELETE FROM banners WHERE id = ?', id, function(err) {
      if (err) {
        console.error('Error deleting banner from database:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('Successfully deleted banner:', id);
      res.json({ message: 'Banner deleted' });
    });
  });
});

// Update a banner
app.put('/api/banners/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { title, description, price, discount, link } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  // First get the current banner to check if we need to update the image
  db.get('SELECT * FROM banners WHERE id = ?', [id], (err, banner) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!banner) {
      res.status(404).json({ error: 'Banner not found' });
      return;
    }

    // If a new image is uploaded, delete the old one
    if (image && banner.image) {
      const oldImagePath = path.join(__dirname, banner.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update the banner
    const updateImage = image !== null;
    const sql = updateImage
      ? 'UPDATE banners SET title = ?, description = ?, image = ?, price = ?, discount = ?, link = ? WHERE id = ?'
      : 'UPDATE banners SET title = ?, description = ?, price = ?, discount = ?, link = ? WHERE id = ?';
    const params = updateImage
      ? [title, description, image, price, discount, link, id]
      : [title, description, price, discount, link, id];

    db.run(sql, params, function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      db.get('SELECT * FROM banners WHERE id = ?', [id], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function calculateDiscountedPrice(price, discount) {
  return price - (price * (discount / 100));
}
