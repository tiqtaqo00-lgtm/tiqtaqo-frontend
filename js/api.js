// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Set auth token
function setAuthToken(token) {
    localStorage.setItem('auth_token', token);
}

// Remove auth token
function removeAuthToken() {
    localStorage.removeItem('auth_token');
}

// API Helper function
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        ...options.headers,
    };

    // Add auth token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add Content-Type for JSON requests
    if (options.body && !(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ==================== AUTH API ====================

const AuthAPI = {
    async login(email, password) {
        const data = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        
        if (data.token) {
            setAuthToken(data.token);
        }
        
        return data;
    },

    async verify() {
        try {
            return await apiRequest('/auth/verify');
        } catch (error) {
            removeAuthToken();
            throw error;
        }
    },

    logout() {
        removeAuthToken();
        window.location.href = '/admin/login.html';
    }
};

// ==================== CATEGORIES API ====================

const CategoriesAPI = {
    async getAll() {
        return await apiRequest('/categories');
    },

    async getById(id) {
        return await apiRequest(`/categories/${id}`);
    },

    async create(categoryData) {
        return await apiRequest('/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    },

    async update(id, categoryData) {
        return await apiRequest(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    },

    async delete(id) {
        return await apiRequest(`/categories/${id}`, {
            method: 'DELETE',
        });
    }
};

// ==================== PRODUCTS API ====================

const ProductsAPI = {
    async getAll(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.category) {
            params.append('category', filters.category);
        }
        
        if (filters.featured) {
            params.append('featured', '1');
        }

        const queryString = params.toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';
        
        return await apiRequest(endpoint);
    },

    async getById(id) {
        return await apiRequest(`/products/${id}`);
    },

    async create(productData) {
        const formData = new FormData();
        
        for (const key in productData) {
            if (productData[key] !== null && productData[key] !== undefined) {
                formData.append(key, productData[key]);
            }
        }

        return await apiRequest('/products', {
            method: 'POST',
            body: formData,
        });
    },

    async update(id, productData) {
        const formData = new FormData();
        
        for (const key in productData) {
            if (productData[key] !== null && productData[key] !== undefined) {
                formData.append(key, productData[key]);
            }
        }

        return await apiRequest(`/products/${id}`, {
            method: 'PUT',
            body: formData,
        });
    },

    async delete(id) {
        return await apiRequest(`/products/${id}`, {
            method: 'DELETE',
        });
    }
};

// ==================== STATS API ====================

const StatsAPI = {
    async getDashboard() {
        return await apiRequest('/stats');
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthAPI, CategoriesAPI, ProductsAPI, StatsAPI };
}
