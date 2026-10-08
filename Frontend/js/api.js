const API_BASE = (location.protocol === 'file:' || location.port === '5500') ? 'http://localhost:8080/api' : '/api';

async function request(path, options = {}) {
    const config = { headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, ...options };
    const response = await fetch(API_BASE + path, config);
    if (!response.ok) {
        let message = `Request failed (${response.status})`;
        try { const body = await response.json(); message = body.message || message; } catch (_) {}
        throw new Error(message);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

const api = {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: user => request('/auth/register', { method: 'POST', body: JSON.stringify(user) }),

    categories: () => request('/categories'),
    addCategory: body => request('/categories', { method:'POST', body:JSON.stringify(body) }),
    updateCategory: (id, body) => request(`/categories/${id}`, { method:'PUT', body:JSON.stringify(body) }),
    deleteCategory: id => request(`/categories/${id}`, { method:'DELETE' }),

    companies: () => request('/companies'),
    addCompany: body => request('/companies', { method:'POST', body:JSON.stringify(body) }),
    updateCompany: (id, body) => request(`/companies/${id}`, { method:'PUT', body:JSON.stringify(body) }),
    deleteCompany: id => request(`/companies/${id}`, { method:'DELETE' }),

    products: (q='', categoryId='') => request(`/products?q=${encodeURIComponent(q)}${categoryId ? `&categoryId=${categoryId}` : ''}`),
    product: id => request(`/products/${id}`),
    addProduct: body => request('/products', { method:'POST', body:JSON.stringify(body) }),
    updateProduct: (id, body) => request(`/products/${id}`, { method:'PUT', body:JSON.stringify(body) }),
    deleteProduct: id => request(`/products/${id}`, { method:'DELETE' }),

    inventory: () => request('/inventory'),
    inventoryByProduct: id => request(`/inventory/product/${id}`),
    addInventory: body => request('/inventory', { method:'POST', body:JSON.stringify(body) }),
    updateInventory: (id, body) => request(`/inventory/${id}`, { method:'PUT', body:JSON.stringify(body) }),
    deleteInventory: id => request(`/inventory/${id}`, { method:'DELETE' }),

    promotions: () => request('/promotions'),
    addPromotion: body => request('/promotions', { method:'POST', body:JSON.stringify(body) }),
    updatePromotion: (id, body) => request(`/promotions/${id}`, { method:'PUT', body:JSON.stringify(body) }),
    deletePromotion: id => request(`/promotions/${id}`, { method:'DELETE' }),
    effectivePrice: id => request(`/promotions/price/${id}`),
    promotionStrategy: id => request(`/promotions/strategy/${id}`),

    orders: (customerName='') => request(`/orders${customerName ? `?customerName=${encodeURIComponent(customerName)}` : ''}`),
    order: id => request(`/orders/${id}`),
    createOrder: body => request('/orders', { method:'POST', body:JSON.stringify(body) }),
    updateOrderStatus: (id,status) => request(`/orders/${id}/status`, { method:'PUT', body:JSON.stringify({status}) }),
    deleteOrder: id => request(`/orders/${id}`, { method:'DELETE' }),

    deliveries: () => request('/deliveries'),
    deliveryByOrder: id => request(`/deliveries/order/${id}`),
    addDelivery: body => request('/deliveries', { method:'POST', body:JSON.stringify(body) }),
    updateDelivery: (id, body) => request(`/deliveries/${id}`, { method:'PUT', body:JSON.stringify(body) }),
    updateDeliveryStatus: (id,status) => request(`/deliveries/${id}/status`, { method:'PUT', body:JSON.stringify({status}) }),
    deleteDelivery: id => request(`/deliveries/${id}`, { method:'DELETE' }),

    users: () => request('/users'),
    updateUser: (id,body) => request(`/users/${id}`, {method:'PUT',body:JSON.stringify(body)}),
    deleteUser: id => request(`/users/${id}`, {method:'DELETE'}),

    storeProducts: (q='', categoryId='') => request(`/store/products?q=${encodeURIComponent(q)}${categoryId ? `&categoryId=${categoryId}` : ''}`),
    storeProduct: id => request(`/store/products/${id}`),
    offers: () => request('/store/offers'),
    storeCategories: () => request('/store/categories'),
    checkout: body => request('/store/checkout', { method:'POST', body:JSON.stringify(body) }),
    adminSummary: () => request('/admin/summary')
};

const session = {
    get: () => { try { return JSON.parse(localStorage.getItem('market_user') || 'null'); } catch { return null; } },
    set: user => localStorage.setItem('market_user', JSON.stringify(user)),
    clear: () => localStorage.removeItem('market_user')
};

const cart = {
    key: 'market_cart',
    get() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; } },
    set(items) { localStorage.setItem(this.key, JSON.stringify(items)); updateCartBadge(); },
    add(product, qty=1) {
        const items = this.get(); const found = items.find(x => x.id === product.id);
        if (found) found.qty += qty; else items.push({ id:product.id, name:product.name, category:product.category?.name || '', image:(typeof productImage === 'function' ? productImage(product) : ''), price:Number(product.effectivePrice), originalPrice:Number(product.price), qty, stockStatus:product.stockStatus });
        this.set(items);
    },
    clear() { this.set([]); }
};

function updateCartBadge() {
    const badge = document.getElementById('cartCount'); if (!badge) return;
    const count = cart.get().reduce((n,x) => n + (x.qty || 0), 0); badge.textContent = count; badge.style.display = count ? 'inline-flex' : 'none';
}
