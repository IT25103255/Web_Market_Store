function money(value) {
    return `Rs. ${Number(value || 0).toLocaleString('en-LK', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
}

function stockClass(status='') {
    const s = status.toLowerCase();
    if (s.includes('out')) return 'stock-out';
    if (s.includes('low')) return 'stock-low';
    return '';
}

const PRODUCT_IMAGES = {
    'premium rice pack':'premium-rice.jpg',
    'organic oats':'organic-oats.jpg',
    'pasta fusilli':'pasta-fusilli.jpg',
    'coconut milk pack':'coconut-milk.jpg',
    'wireless headphones':'wireless-headphones.jpg',
    'smart fitness band':'fitness-band.jpg',
    'portable bluetooth speaker':'bluetooth-speaker.jpg',
    'usb-c fast charger':'usb-charger.jpg',
    'ceylon tea premium':'ceylon-tea.jpg',
    'arabica coffee 250g':'arabica-coffee.jpg',
    'tropical mango juice':'mango-juice.jpg',
    'mineral water 6 pack':'mineral-water.jpg',
    'eco laundry liquid':'laundry-liquid.jpg',
    'dish wash lemon':'dish-wash.jpg',
    'multipurpose cleaner':'cleaner.jpg',
    'soft tissue 6 pack':'tissue.jpg',
    'herbal shampoo':'shampoo.jpg',
    'aloe body wash':'body-wash.jpg',
    'roasted cashew mix':'cashew-mix.jpg',
    'premium notebook set':'notebook-set.jpg',
    'fresh apple pack':'fresh-apple.jpg',
    'banana bunch':'banana-bunch.jpg',
    'ballpoint pen set':'ballpoint-pens.jpg'
};
const CATEGORY_IMAGES = {
    'groceries':'category-groceries.jpg',
    'electronics':'category-electronics.jpg',
    'beverages':'category-beverages.jpg',
    'household':'category-household.jpg',
    'personal care':'category-personal-care.jpg',
    'snacks':'category-snacks.jpg',
    'fresh produce':'category-fresh-produce.jpg',
    'stationery':'category-stationery.jpg'
};

function productImage(productOrName, category='') {
    const name = typeof productOrName === 'string' ? productOrName : (productOrName?.name || '');
    const cat = typeof productOrName === 'object' ? (productOrName?.category?.name || category) : category;
    const exact = PRODUCT_IMAGES[String(name).toLowerCase()];
    if (exact) return `assets/products/${exact}`;
    const fallback = CATEGORY_IMAGES[String(cat).toLowerCase()] || 'category-groceries.jpg';
    return `assets/products/${fallback}`;
}

function categoryImage(categoryName='') {
    return `assets/products/${CATEGORY_IMAGES[String(categoryName).toLowerCase()] || 'category-groceries.jpg'}`;
}

function productIcon(product) {
    const n = `${product.category?.name || ''} ${product.name || ''}`.toLowerCase();
    if (/elect|phone|laptop|computer|charger/.test(n)) return 'fa-laptop';
    if (/beverage|drink|juice|tea|coffee|water/.test(n)) return 'fa-bottle-water';
    if (/house|clean|soap|laundry|tissue/.test(n)) return 'fa-house';
    if (/food|grocery|rice|snack|oat|pasta/.test(n)) return 'fa-basket-shopping';
    return 'fa-box-open';
}

function productCard(p) {
    const promo = p.onPromotion && Number(p.effectivePrice) < Number(p.price);
    return `<article class="product-card">
        <div class="product-thumb" onclick="location.href='product-detail.html?id=${p.id}'">
            <img src="${productImage(p)}" alt="${escapeHtml(p.name)}" loading="lazy">
            ${promo ? `<span class="discount-badge">${escapeHtml(p.discountLabel || '')}</span>` : ''}
            <span class="stock-badge ${stockClass(p.stockStatus)}">${escapeHtml(p.stockStatus || '')}</span>
        </div>
        <div class="product-body">
            <div class="product-category">${escapeHtml(p.category?.name || 'Product')}</div>
            <div class="product-title">${escapeHtml(p.name)}</div>
            <div class="product-company">${escapeHtml(p.company?.name || '')}</div>
            <div class="price-row">${promo ? `<span class="price-old">${money(p.price)}</span>` : ''}<span class="price">${money(p.effectivePrice)}</span></div>
            <div class="card-actions">
                <a class="btn btn-outline" href="product-detail.html?id=${p.id}">View</a>
                <button class="btn btn-primary" ${p.stockStatus==='Out of Stock'?'disabled':''} onclick='addProductToCart(${JSON.stringify(p).replace(/'/g,"&#39;")})' aria-label="Add ${escapeHtml(p.name)} to cart"><i class="fas fa-cart-plus"></i></button>
            </div>
        </div>
    </article>`;
}

function addProductToCart(p, qty=1) {
    if (p.stockStatus === 'Out of Stock') return toast('This product is out of stock.', true);
    const safeQty = Math.max(1, Math.min(Number(qty || 1), Number(p.quantity || qty || 1)));
    cart.add(p, safeQty); toast(`${p.name} added to cart.`);
}

function escapeHtml(value='') {
    return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function toast(message, error=false) {
    let el = document.getElementById('storeToast');
    if (!el) {
        el=document.createElement('div'); el.id='storeToast';
        Object.assign(el.style,{position:'fixed',right:'22px',bottom:'22px',zIndex:'9999',padding:'1rem 1.2rem',borderRadius:'14px',fontWeight:'800',boxShadow:'0 18px 45px rgba(0,0,0,.4)',maxWidth:'360px'});
        document.body.appendChild(el);
    }
    el.textContent=message; el.style.background=error?'#b91c1c':'#166534'; el.style.color='#fff'; el.style.display='block';
    clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.style.display='none',2600);
}

function renderAuthActions() {
    const host = document.getElementById('authActions'); if (!host) return; const user=session.get();
    if (!user) { host.innerHTML='<a href="login.html" class="btn btn-outline">Login</a><a href="register.html" class="btn btn-primary">Register</a>'; return; }
    const target = user.role === 'ADMIN' ? 'admin-dashboard.html' : 'user-dashboard.html';
    const first=(user.name||'Account').split(' ')[0];
    host.innerHTML=`<a href="${target}" class="btn btn-outline"><i class="fas fa-user"></i> ${escapeHtml(first)}</a><button class="btn btn-primary" id="logoutTop">Logout</button>`;
    document.getElementById('logoutTop').onclick=()=>{session.clear();location.href='index.html'};
}

document.addEventListener('DOMContentLoaded',()=>{renderAuthActions();updateCartBadge();});
