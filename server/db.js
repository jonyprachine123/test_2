import sqlite3 from 'sqlite3';
import { config } from './config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use in-memory database for production, file-based for development
const dbPath = config.nodeEnv === 'production' 
  ? ':memory:'
  : path.join(__dirname, '..', config.databaseUrl);

// Enable verbose mode for debugging
sqlite3.verbose();

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to SQLite database');
  
  // Create tables if they don't exist
  createTables();
});

// Create necessary tables
function createTables() {
  db.serialize(() => {
    // Products table
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      discount REAL DEFAULT 0,
      features TEXT,
      image TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      productId INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (productId) REFERENCES products(id)
    )`);

    // Banners table
    db.run(`CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      price REAL,
      discount REAL DEFAULT 0,
      link TEXT,
      image TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Reviews table
    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME
    )`);
  });
}

// Helper function to run SQL with parameters
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error running sql:', sql);
        console.error(err);
        reject(err);
      } else {
        resolve({ id: this.lastID });
      }
    });
  });
}

// Helper function to query all rows
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('Error querying sql:', sql);
        console.error(err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Helper function to query a single row
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('Error querying sql:', sql);
        console.error(err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export default {
  db,
  run,
  all,
  get
};
