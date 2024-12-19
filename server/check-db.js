import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('shop.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');

  // Check products table
  db.all("SELECT * FROM products", [], (err, rows) => {
    if (err) {
      console.error('Error querying products:', err);
    } else {
      console.log('Products:', rows);
    }

    // Check banners table
    db.all("SELECT * FROM banners", [], (err, rows) => {
      if (err) {
        console.error('Error querying banners:', err);
      } else {
        console.log('Banners:', rows);
      }

      // Close the database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    });
  });
});
