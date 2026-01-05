require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { db, initializeDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Initialize database
initializeDatabase();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        req.user = user;
        next();
    });
};

// ==================== AUTH ROUTES ====================

// Admin Login
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM admin WHERE email = ?', [email], (err, admin) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = bcrypt.compareSync(password, admin.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, email: admin.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            admin: { id: admin.id, email: admin.email }
        });
    });
});

// Verify Token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// ==================== CATEGORIES ROUTES ====================

// Get all categories
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY display_order', [], (err, categories) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(categories);
    });
});

// Get single category
app.get('/api/categories/:id', (req, res) => {
    db.get('SELECT * FROM categories WHERE id = ?', [req.params.id], (err, category) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json(category);
    });
});

// Create category (protected)
app.post('/api/categories', authenticateToken, (req, res) => {
    const { id, name, icon, visible, display_order } = req.body;

    db.run(
        'INSERT INTO categories (id, name, icon, visible, display_order) VALUES (?, ?, ?, ?, ?)',
        [id, name, icon || 'fa-tag', visible !== undefined ? visible : 1, display_order || 999],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create category' });
            }
            res.json({ success: true, id: this.lastID });
        }
    );
});

// Update category (protected)
app.put('/api/categories/:id', authenticateToken, (req, res) => {
    const { name, icon, visible, display_order } = req.body;

    db.run(
        'UPDATE categories SET name = ?, icon = ?, visible = ?, display_order = ? WHERE id = ?',
        [name, icon, visible, display_order, req.params.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to update category' });
            }
            res.json({ success: true, changes: this.changes });
        }
    );
});

// Delete category (protected)
app.delete('/api/categories/:id', authenticateToken, (req, res) => {
    db.run('DELETE FROM categories WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete category' });
        }
        res.json({ success: true, changes: this.changes });
    });
});

// ==================== PRODUCTS ROUTES ====================

// Get all products
app.get('/api/products', (req, res) => {
    const { category, featured } = req.query;
    let query = 'SELECT * FROM products WHERE visible = 1';
    const params = [];

    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }

    if (featured) {
        query += ' AND featured = 1';
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, products) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(products);
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    });
});

// Create product (protected)
app.post('/api/products', authenticateToken, upload.single('image'), (req, res) => {
    const { name, description, price, old_price, category, badge, featured } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
        `INSERT INTO products (name, description, price, old_price, category, image, badge, featured) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, old_price || null, category, image, badge || null, featured || 0],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to create product' });
            }
            res.json({ success: true, id: this.lastID, image });
        }
    );
});

// Update product (protected)
app.put('/api/products/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { name, description, price, old_price, category, badge, featured, visible } = req.body;
    
    // Get current product to check if we need to delete old image
    db.get('SELECT image FROM products WHERE id = ?', [req.params.id], (err, product) => {
        if (err || !product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let image = product.image;
        
        // If new image uploaded, delete old one and use new
        if (req.file) {
            if (product.image) {
                const oldImagePath = path.join(__dirname, product.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            image = `/uploads/${req.file.filename}`;
        }

        db.run(
            `UPDATE products SET name = ?, description = ?, price = ?, old_price = ?, 
             category = ?, image = ?, badge = ?, featured = ?, visible = ? WHERE id = ?`,
            [name, description, price, old_price || null, category, image, badge || null, 
             featured || 0, visible !== undefined ? visible : 1, req.params.id],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Failed to update product' });
                }
                res.json({ success: true, changes: this.changes, image });
            }
        );
    });
});

// Delete product (protected)
app.delete('/api/products/:id', authenticateToken, (req, res) => {
    // Get product to delete associated image
    db.get('SELECT image FROM products WHERE id = ?', [req.params.id], (err, product) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (product && product.image) {
            const imagePath = path.join(__dirname, product.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete product' });
            }
            res.json({ success: true, changes: this.changes });
        });
    });
});

// ==================== STATS ROUTES ====================

// Get dashboard statistics
app.get('/api/stats', authenticateToken, (req, res) => {
    const stats = {};

    db.get('SELECT COUNT(*) as count FROM products', [], (err, result) => {
        stats.totalProducts = result ? result.count : 0;

        db.get('SELECT COUNT(*) as count FROM categories', [], (err, result) => {
            stats.totalCategories = result ? result.count : 0;

            db.all('SELECT category, COUNT(*) as count FROM products GROUP BY category', [], (err, results) => {
                stats.productsByCategory = results || [];
                res.json(stats);
            });
        });
    });
});

// Serve frontend for all non-API routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 TiqtaQo Backend Server Running                  ║
║                                                       ║
║   📡 Server: http://localhost:${PORT}                   ║
║   📊 API: http://localhost:${PORT}/api                  ║
║                                                       ║
║   👤 Admin: ${process.env.ADMIN_EMAIL}      ║
║   🔑 Password: ${process.env.ADMIN_PASSWORD}                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
});
