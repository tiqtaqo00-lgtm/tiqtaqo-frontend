const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'tiqtaqo.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Create admin table
        db.run(`
            CREATE TABLE IF NOT EXISTS admin (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create categories table
        db.run(`
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                icon TEXT,
                visible INTEGER DEFAULT 1,
                display_order INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create products table
        db.run(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                old_price REAL,
                category TEXT NOT NULL,
                image TEXT,
                badge TEXT,
                featured INTEGER DEFAULT 0,
                visible INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category) REFERENCES categories(id)
            )
        `);

        // Insert default admin if not exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@tiqtaqo.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        
        db.get('SELECT * FROM admin WHERE email = ?', [adminEmail], (err, row) => {
            if (!row) {
                const hashedPassword = bcrypt.hashSync(adminPassword, 10);
                db.run('INSERT INTO admin (email, password) VALUES (?, ?)', 
                    [adminEmail, hashedPassword],
                    (err) => {
                        if (err) {
                            console.error('Error creating admin:', err);
                        } else {
                            console.log('✅ Default admin created:', adminEmail);
                        }
                    }
                );
            }
        });

        // Insert default categories if not exists
        const defaultCategories = [
            { id: 'packs', name: 'Packs', icon: 'fa-gifts', order: 1 },
            { id: 'homme', name: 'Homme', icon: 'fa-watch', order: 2 },
            { id: 'femme', name: 'Femme', icon: 'fa-gem', order: 3 },
            { id: 'accessoires', name: 'Accessoires', icon: 'fa-ring', order: 4 }
        ];

        defaultCategories.forEach(cat => {
            db.run(`
                INSERT OR IGNORE INTO categories (id, name, icon, display_order) 
                VALUES (?, ?, ?, ?)
            `, [cat.id, cat.name, cat.icon, cat.order]);
        });

        console.log('✅ Database initialized successfully');
    });
}

module.exports = { db, initializeDatabase };
