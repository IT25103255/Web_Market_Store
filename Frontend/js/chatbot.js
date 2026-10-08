/* =====================================================================
   Market Assistant — AI shopping chatbot
   ---------------------------------------------------------------------
   • Reads the store only through the EXISTING functions in api.js /
     store.js (api.storeProducts, api.offers, api.orders, cart, session,
     addProductToCart). Nothing in those files is changed.
   • Two brains:
       - AI mode (Gemini or Claude) when a key is set in chatbot-config.js.
         The model is grounded with the live catalogue, cart and orders.
       - Built-in shopping engine (no key needed) — search, offers,
         budget filters, recommendations, stock checks, cart, add to cart,
         order tracking and store FAQs.
   • If an AI call fails, it quietly falls back to the built-in engine.
   ===================================================================== */
(function () {
    'use strict';
    if (typeof api === 'undefined' || typeof cart === 'undefined' || typeof session === 'undefined') return;

    var CFG = Object.assign({ provider: 'local', apiKey: '', model: '', assistantName: 'Market Assistant' }, window.MARKET_AI || {});
    var AI_ON = CFG.provider !== 'local' && !!CFG.apiKey;
    var STORE_KEY = 'market_chat_v1';
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------------- helpers ---------------- */
    var esc = typeof escapeHtml === 'function' ? escapeHtml : function (v) { return String(v).replace(/[&<>'"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]; }); };
    var fmt = typeof money === 'function' ? money : function (v) { return 'Rs. ' + Number(v || 0).toFixed(2); };
    var img = function (p) { return typeof productImage === 'function' ? productImage(p) : ''; };
    function md(t) {
        var h = esc(t || '');
        h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        h = h.replace(/(^|\n)[-•] (.+)/g, '$1<span class="cb-li">$2</span>');
        return h.replace(/\n/g, '<br>');
    }
    function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9\s.-]/g, ' ').replace(/\s+/g, ' ').trim(); }
    function stem(w) { return w.length > 4 && /s$/.test(w) && !/ss$/.test(w) ? w.replace(/(ies)$/, 'y').replace(/s$/, '') : w; }
    var STOP = 'a an the i me my we you your is are am do does did can could would should please pls any some show find get give need want looking look for of to in on at with and or me what which how much many have has there this that it its be any items item product products buy store shop some about tell'.split(' ');
    function tokens(s) { return norm(s).split(' ').filter(function (w) { return w.length > 1 && STOP.indexOf(w) < 0; }).map(stem); }

    /* ---------------- data (cached) ---------------- */
    var DATA = { products: null, offers: null, loading: null };
    function loadData() {
        if (DATA.products) return Promise.resolve(DATA);
        if (DATA.loading) return DATA.loading;
        DATA.loading = Promise.all([api.storeProducts(), api.offers().catch(function () { return []; })])
            .then(function (r) { DATA.products = r[0] || []; DATA.offers = r[1] || []; DATA.loading = null; return DATA; })
            .catch(function (e) { DATA.loading = null; throw e; });
        return DATA.loading;
    }
    function byId(id) { return (DATA.products || []).find(function (p) { return String(p.id) === String(id); }); }
    var price = function (p) { return Number(p.effectivePrice != null ? p.effectivePrice : p.price); };
    var promo = function (p) { return p.onPromotion && Number(p.effectivePrice) < Number(p.price); };

    /* ---------------- built-in shopping engine ---------------- */
    var SYN = {
        headphone: 'headphones', earphone: 'headphones', headset: 'headphones', earbud: 'headphones',
        watch: 'fitness band', tracker: 'fitness band', smartwatch: 'fitness band',
        phone: 'charger', cable: 'charger', adapter: 'charger',
        detergent: 'laundry', soap: 'dish wash', dishwash: 'dish wash',
        juice: 'mango juice', drink: 'beverages', drinks: 'beverages',
        nut: 'cashew', nuts: 'cashew', book: 'notebook', books: 'notebook',
        pen: 'pen', fruit: 'fresh produce', fruits: 'fresh produce', veg: 'fresh produce', vegetable: 'fresh produce',
        gadget: 'electronics', gadgets: 'electronics', tech: 'electronics',
        grocery: 'groceries', cleaning: 'household', beauty: 'personal care', toiletries: 'personal care'
    };
    var THEMES = [
        { re: /breakfast|morning/, words: ['oats', 'banana', 'apple', 'tea', 'coffee', 'coconut'], title: 'Breakfast picks' },
        { re: /health|healthy|diet|fit\b/, words: ['apple', 'banana', 'oats', 'water', 'cashew'], title: 'Healthy choices' },
        { re: /clean|house ?work|chores/, words: ['laundry', 'dish', 'cleaner', 'tissue'], title: 'Cleaning essentials' },
        { re: /study|school|office|exam|uni|campus/, words: ['notebook', 'pen', 'charger', 'headphones', 'coffee'], title: 'Study kit' },
        { re: /gift|present|birthday/, words: ['headphones', 'fitness', 'speaker', 'cashew', 'coffee'], title: 'Gift ideas' },
        { re: /gym|workout|exercise|run/, words: ['fitness', 'water', 'banana'], title: 'Workout essentials' },
        { re: /party|movie|guests/, words: ['mango', 'cashew', 'speaker', 'water'], title: 'Party pack' },
        { re: /bath|shower|hair/, words: ['shampoo', 'body wash', 'tissue'], title: 'Bath & body' }
    ];
    var NUMWORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, a: 1, an: 1 };

    function expand(text) {
        var t = norm(text);
        Object.keys(SYN).forEach(function (k) { t = t.replace(new RegExp('\\b' + k + '\\b', 'g'), k + ' ' + SYN[k]); });
        return t;
    }
    function score(p, qt) {
        var name = tokens(p.name), cat = tokens(p.category && p.category.name), comp = tokens(p.company && p.company.name), desc = tokens(p.description);
        var s = 0;
        qt.forEach(function (q) {
            if (q.length < 3) return;
            if (name.some(function (n) { return n === q || (q.length >= 4 && (n.indexOf(q) === 0 || q.indexOf(n) === 0 && n.length >= 4)); })) s += 4;
            else if (cat.some(function (n) { return n === q || n.indexOf(q) === 0; })) s += 2;
            else if (comp.indexOf(q) >= 0) s += 1.5;
            else if (desc.indexOf(q) >= 0) s += 0.5;
        });
        return s;
    }
    function search(text, limit) {
        var qt = tokens(expand(text));
        return (DATA.products || []).map(function (p) { return { p: p, s: score(p, qt) }; })
            .filter(function (x) { return x.s > 0; })
            .sort(function (a, b) { return b.s - a.s || price(a.p) - price(b.p); })
            .slice(0, limit || 4).map(function (x) { return x.p; });
    }
    function matchCategory(text) {
        var t = expand(text);
        var cats = {};
        (DATA.products || []).forEach(function (p) { if (p.category) cats[p.category.name] = 1; });
        return Object.keys(cats).find(function (c) { return t.indexOf(c.toLowerCase()) >= 0; });
    }
    function inCat(c) { return (DATA.products || []).filter(function (p) { return p.category && p.category.name === c; }); }
    function qtyFrom(text) {
        var m = norm(text).match(/\b(\d{1,3})\b(?!\s*(rs|lkr|rupees|pack|packs|g|kg|ml|l)\b)/);
        if (m) return Math.max(1, Math.min(50, +m[1]));
        var w = norm(text).split(' ').find(function (x) { return NUMWORDS[x] && x.length > 2; });
        return w ? NUMWORDS[w] : 1;
    }
    function budgetFrom(text) {
        var m = norm(text).replace(/,/g, '').match(/(under|below|less than|cheaper than|max|within|upto|up to)\s*(rs\.?|lkr)?\s*(\d+(\.\d+)?)\s*(k)?/);
        if (!m) return null;
        return +m[3] * (m[5] ? 1000 : 1);
    }
    function cartSummary() {
        var items = cart.get();
        if (!items.length) return { text: "Your cart is empty right now. Want me to suggest something? Try **today's offers** or tell me what you need.", actions: [{ label: 'Browse the shop', href: 'shop.html' }] };
        var total = 0, n = 0;
        var lines = items.map(function (x) { var s = Number(x.price) * x.qty; total += s; n += x.qty; return '- ' + x.name + ' × ' + x.qty + ' — ' + fmt(s); });
        return { text: 'You have **' + n + ' item' + (n > 1 ? 's' : '') + '** in your cart:\n' + lines.join('\n') + '\n\n**Total: ' + fmt(total) + '** (promotional prices included).', actions: [{ label: 'Open cart', href: 'cart.html' }, { label: 'Checkout', href: 'checkout.html', primary: true }] };
    }
    function ordersReply() {
        var user = session.get();
        if (!user) return Promise.resolve({ text: 'Log in and I can track your orders and deliveries for you.', actions: [{ label: 'Log in', href: 'login.html', primary: true }] });
        return api.orders(user.name).then(function (orders) {
            if (!orders || !orders.length) return { text: "You haven't placed any orders yet, " + esc(user.name.split(' ')[0]) + '. Once you check out, I can track the delivery here.', actions: [{ label: 'Start shopping', href: 'shop.html' }] };
            var recent = orders.slice().sort(function (a, b) { return new Date(b.orderDate) - new Date(a.orderDate); }).slice(0, 3);
            return Promise.all(recent.map(function (o) { return api.deliveryByOrder(o.id).catch(function () { return null; }); })).then(function (ds) {
                var lines = recent.map(function (o, i) {
                    return '- **Order #' + o.id + '** · ' + new Date(o.orderDate).toLocaleDateString() + ' · ' + fmt(o.totalAmount) + '\n  Order: ' + o.status + ' · Delivery: ' + (ds[i] ? ds[i].deliveryStatus : 'not assigned yet');
                });
                return { text: 'Here are your latest orders:\n' + lines.join('\n'), actions: [{ label: 'View all orders', href: 'user-dashboard.html' }] };
            });
        }).catch(function () { return { text: "I couldn't reach the order service just now. Please try again in a moment." }; });
    }

    function localReply(raw) {
        var t = norm(raw);
        var user = session.get();
        var first = user && user.name ? user.name.split(' ')[0] : '';

        if (/^(hi|hello|hey|hii+|ayubowan|good (morning|afternoon|evening)|yo)\b/.test(t) && t.split(' ').length <= 4)
            return { text: 'Hi' + (first ? ' ' + first : '') + "! I'm your " + CFG.assistantName + '. I can find products, show deals, build a list on a budget, add things to your cart and track your orders. What are you shopping for?' };
        if (/(what can you do|help|how does this work|who are you)/.test(t))
            return { text: 'Here are things you can ask me:\n- "show today\'s offers"\n- "headphones under 10000"\n- "healthy breakfast ideas"\n- "is the fitness band in stock?"\n- "add 2 ceylon tea"\n- "what\'s in my cart?"\n- "track my order"' };
        if (/\b(thank|thanks|thx|ty)\b/.test(t)) return { text: 'Anytime! Happy shopping 🛒' };

        // add / remove from cart
        var addM = t.match(/\b(add|buy|put|i ll take|ill take|get me)\b(.*)/);
        if (addM && !budgetFrom(t) && !/\b(how|what|which|under|below|cheap|cheapest|recommend|suggest|should)\b/.test(t)) {
            var found = search(addM[2], 3);
            if (!found.length) return { text: "I couldn't find that product. Try the product name, like \"add banana bunch\"." };
            var p = found[0], q = qtyFrom(addM[2]);
            if (p.stockStatus === 'Out of Stock') return { text: '**' + p.name + '** is out of stock right now. Here are some alternatives:', products: inCat(p.category.name).filter(function (x) { return x.stockStatus !== 'Out of Stock' && x.id !== p.id; }).slice(0, 3).map(function (x) { return x.id; }) };
            addProductToCart(p, q);
            return { text: 'Added **' + Math.min(q, p.quantity || q) + ' × ' + p.name + '** to your cart at ' + fmt(price(p)) + ' each' + (promo(p) ? ' (' + p.discountLabel + ' applied)' : '') + '. 🛒', products: [p.id], actions: [{ label: 'View cart', href: 'cart.html' }, { label: 'Checkout', href: 'checkout.html', primary: true }] };
        }
        var rmM = t.match(/\b(remove|delete|take out)\b(.*)/);
        if (rmM && /cart|basket/.test(t) || (rmM && search(rmM[2], 1).length)) {
            var items = cart.get(), target = search(rmM[2], 1)[0];
            var idx = target ? items.findIndex(function (x) { return x.id === target.id; }) : -1;
            if (idx < 0) return { text: "That item isn't in your cart." };
            var removed = items.splice(idx, 1)[0]; cart.set(items);
            return { text: 'Removed **' + removed.name + '** from your cart.', actions: [{ label: 'View cart', href: 'cart.html' }] };
        }

        if (/\b(my )?(cart|basket)\b|\btotal\b/.test(t)) return cartSummary();
        if (/\b(track|order status|my orders?|where is my|delivery status|delivered yet|shipped)\b/.test(t)) return ordersReply();
        if (/\b(checkout|check out|place (an |my )?order|pay(ment)?|card|cash on delivery|cod)\b/.test(t))
            return { text: 'Checkout is a secure **sandbox**: choose Visa/Mastercard (sandbox) or Cash on Delivery (demo). No real card details or money are used. Promotional prices are calculated by the backend, so the cart price is exactly what you pay.', actions: [{ label: 'Go to checkout', href: 'checkout.html', primary: true }] };
        if (/\b(deliver|delivery|shipping|ship)\b/.test(t))
            return { text: 'As soon as you place an order, a delivery record is created with status **Preparing**. It then moves to **Shipped** and **Delivered**. You can follow it in My Orders, or just ask me "track my order".', actions: [{ label: 'My orders', href: 'user-dashboard.html' }] };
        if (/\b(return|refund|exchange|cancel)\b/.test(t))
            return { text: "Returns and refunds aren't handled online in this store yet. Order status changes (including cancellations) are managed by the store administrator." };
        if (/\b(login|log in|sign in|register|sign up|account|password)\b/.test(t))
            return { text: user ? "You're logged in as **" + esc(user.name) + '**.' : 'You can log in or create a free customer account in a few seconds.', actions: user ? [{ label: 'My account', href: 'user-dashboard.html' }] : [{ label: 'Log in', href: 'login.html' }, { label: 'Create account', href: 'register.html', primary: true }] };

        var budget = budgetFrom(t);
        var cat = matchCategory(raw);
        var pool = cat ? inCat(cat) : null;
        var hits = search(raw, 6);

        if (/\b(offer|offers|deal|deals|discount|sale|promo|promotion|special)\b/.test(t)) {
            var offs = (DATA.offers || []).slice(0, 4);
            if (!offs.length) return { text: 'There are no active promotions today. Check back soon!' };
            return { text: 'Here are today\'s active offers' + (offs.length < (DATA.offers || []).length ? ' (top ' + offs.length + ')' : '') + ':', products: offs.map(function (p) { return p.id; }), actions: [{ label: 'All offers', href: 'offers.html' }] };
        }
        if (budget) {
            var base = pool || (hits.length ? hits.concat([]) : DATA.products.slice());
            if (hits.length && !pool) base = (DATA.products || []).filter(function (p) { return hits.some(function (h) { return h.category && p.category && h.category.name === p.category.name; }); });
            var within = base.filter(function (p) { return price(p) <= budget && p.stockStatus !== 'Out of Stock'; }).sort(function (a, b) { return price(b) - price(a); });
            if (!within.length) return { text: 'Nothing ' + (cat ? 'in ' + cat + ' ' : '') + 'is under ' + fmt(budget) + ' right now. The lowest price there is ' + fmt(Math.min.apply(null, base.map(price))) + '.' };
            return { text: 'Best picks under **' + fmt(budget) + '**' + (cat ? ' in ' + cat : '') + ':', products: within.slice(0, 4).map(function (p) { return p.id; }) };
        }
        if (/\b(cheap|cheapest|lowest|budget|affordable|low price)\b/.test(t)) {
            var c1 = (pool || DATA.products).slice().sort(function (a, b) { return price(a) - price(b); }).slice(0, 4);
            return { text: 'The most affordable ' + (cat ? cat.toLowerCase() : 'items') + ' right now:', products: c1.map(function (p) { return p.id; }) };
        }
        if (/\b(expensive|premium|best|top|highest|luxury)\b/.test(t) && !hits.length) {
            var c2 = (pool || DATA.products).slice().sort(function (a, b) { return price(b) - price(a); }).slice(0, 4);
            return { text: 'Top-end picks' + (cat ? ' in ' + cat : '') + ':', products: c2.map(function (p) { return p.id; }) };
        }
        if (/\b(stock|available|availability|in stock|left|have)\b/.test(t) && hits.length) {
            var s = hits[0];
            var line = s.stockStatus === 'Out of Stock' ? 'is **out of stock** right now.' : s.stockStatus === 'Low Stock' ? 'is **low on stock**: only ' + s.quantity + ' left, so grab it soon.' : 'is **in stock** (' + s.quantity + ' units available).';
            return { text: '**' + s.name + '** ' + line, products: [s.id] };
        }
        var theme = THEMES.find(function (th) { return th.re.test(t); });
        if (theme) {
            var picks = [];
            theme.words.forEach(function (w) { (DATA.products || []).forEach(function (p) { if (norm(p.name).indexOf(w) >= 0 && picks.indexOf(p) < 0 && p.stockStatus !== 'Out of Stock') picks.push(p); }); });
            if (picks.length) return { text: theme.title + ' from our shelves:', products: picks.slice(0, 4).map(function (p) { return p.id; }) };
        }
        if (/\b(recommend|suggest|popular|trending|new|what should i)\b/.test(t)) {
            var rec = (DATA.offers || []).concat(DATA.products || []).filter(function (p, i, a) { return a.findIndex(function (x) { return x.id === p.id; }) === i && p.stockStatus !== 'Out of Stock'; }).slice(0, 4);
            return { text: 'Here are some popular picks, starting with items on promotion:', products: rec.map(function (p) { return p.id; }) };
        }
        if (cat && (!hits.length || hits.every(function (h) { return h.category && h.category.name === cat; }))) {
            return { text: 'Here\'s what we have in **' + cat + '**:', products: inCat(cat).slice(0, 6).map(function (p) { return p.id; }), actions: [{ label: 'Open ' + cat, href: 'shop.html?categoryId=' + inCat(cat)[0].category.id }] };
        }
        if (hits.length) {
            return { text: hits.length === 1 ? 'I found this:' : 'Here\'s what I found:', products: hits.slice(0, 4).map(function (p) { return p.id; }) };
        }
        return { text: "I'm not sure I understood that. I can search products, show offers, find items under a budget, check stock, manage your cart and track orders. Try one of these:", chips: true };
    }

    /* ---------------- AI mode ---------------- */
    var orderContext = null;
    function buildSystemPrompt() {
        var user = session.get();
        var catalog = (DATA.products || []).map(function (p) {
            return [p.id, p.name, p.category && p.category.name, (p.company && p.company.name) || '', 'Rs.' + Number(p.price).toFixed(2),
                promo(p) ? 'NOW Rs.' + price(p).toFixed(2) + ' (' + p.discountLabel + ')' : '', p.stockStatus + ' (' + p.quantity + ')'].join(' | ');
        }).join('\n');
        var items = cart.get();
        var cartTxt = items.length ? items.map(function (x) { return x.name + ' x' + x.qty + ' @ Rs.' + Number(x.price).toFixed(2); }).join('; ') : 'empty';
        return [
            'You are "' + CFG.assistantName + '", the friendly shopping assistant of Online Market Store, a Sri Lankan online market (prices in LKR, shown as "Rs.").',
            'Answer ONLY using the store data below. Never invent products, prices, stock or policies. Keep replies short (1-4 sentences, or a short list). Use **bold** for product names.',
            'Store facts: checkout is a sandbox (Visa/Mastercard sandbox or Cash on Delivery demo, no real payments). Promotions (percentage or fixed amount) are applied automatically by the backend. After checkout a delivery record is created: Preparing → Shipped → Delivered, tracked in My Orders. Online returns/refunds are not supported.',
            'When you recommend or mention specific products, end your reply with a tag listing up to 4 product ids, exactly like: [[products:3,7,12]]',
            'When the user clearly asks to add an item to the cart, end with [[add:ID:QTY]] (one tag per product). The user confirms with a button, so say "Tap Add to confirm".',
            'You may add one navigation tag when useful: [[go:cart]] [[go:checkout]] [[go:orders]] [[go:offers]] [[go:shop]] [[go:login]].',
            'CUSTOMER: ' + (user ? user.name + ' (logged in)' : 'guest, not logged in'),
            'CART: ' + cartTxt,
            orderContext ? 'RECENT ORDERS: ' + orderContext : '',
            'CATALOGUE (id | name | category | company | regular price | promotion | stock):\n' + catalog
        ].filter(Boolean).join('\n\n');
    }
    function loadOrderContext() {
        var user = session.get();
        if (!user || orderContext !== null) return Promise.resolve();
        return api.orders(user.name).then(function (orders) {
            var recent = (orders || []).slice(-3).reverse();
            return Promise.all(recent.map(function (o) { return api.deliveryByOrder(o.id).catch(function () { return null; }); })).then(function (ds) {
                orderContext = recent.map(function (o, i) { return '#' + o.id + ' ' + new Date(o.orderDate).toLocaleDateString() + ' total Rs.' + Number(o.totalAmount).toFixed(2) + ' status ' + o.status + ', delivery ' + (ds[i] ? ds[i].deliveryStatus : 'not assigned'); }).join('; ') || 'none';
            });
        }).catch(function () { orderContext = ''; });
    }
    function callAI(history) {
        var sys = buildSystemPrompt();
        var turns = history.slice(-12).map(function (m) { return { role: m.role === 'user' ? 'user' : 'assistant', text: m.raw || m.text }; });
        while (turns.length && turns[0].role !== 'user') turns.shift();
        if (CFG.provider === 'anthropic') {
            return fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'x-api-key': CFG.apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
                body: JSON.stringify({ model: CFG.model || 'claude-haiku-4-5-20251001', max_tokens: 600, system: sys, messages: turns.map(function (t) { return { role: t.role, content: t.text }; }) })
            }).then(function (r) { if (!r.ok) throw new Error('AI ' + r.status); return r.json(); })
              .then(function (d) { return (d.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n'); });
        }
        var model = CFG.model || 'gemini-2.5-flash';
        return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(CFG.apiKey), {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: sys }] }, contents: turns.map(function (t) { return { role: t.role === 'user' ? 'user' : 'model', parts: [{ text: t.text }] }; }), generationConfig: { temperature: 0.5, maxOutputTokens: 600 } })
        }).then(function (r) { if (!r.ok) throw new Error('AI ' + r.status); return r.json(); })
          .then(function (d) { var c = d.candidates && d.candidates[0]; return c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('') : ''; });
    }
    var GO = { cart: ['View cart', 'cart.html'], checkout: ['Checkout', 'checkout.html'], orders: ['My orders', 'user-dashboard.html'], offers: ['See offers', 'offers.html'], shop: ['Open shop', 'shop.html'], login: ['Log in', 'login.html'] };
    function parseAI(text) {
        var out = { text: text, raw: text, products: [], adds: [], actions: [] };
        out.text = text.replace(/\[\[products?:\s*([\d,\s]+)\]\]/gi, function (_, ids) {
            ids.split(',').forEach(function (id) { id = id.trim(); if (byId(id) && out.products.indexOf(+id) < 0) out.products.push(+id); }); return '';
        }).replace(/\[\[add:\s*(\d+)\s*:\s*(\d+)\s*\]\]/gi, function (_, id, q) {
            if (byId(id)) out.adds.push({ id: +id, qty: Math.max(1, Math.min(50, +q)) }); return '';
        }).replace(/\[\[go:\s*(\w+)\s*\]\]/gi, function (_, k) {
            k = k.toLowerCase(); if (GO[k]) out.actions.push({ label: GO[k][0], href: GO[k][1], primary: k === 'checkout' }); return '';
        }).trim();
        out.products = out.products.slice(0, 4);
        return out;
    }

    /* ---------------- UI ---------------- */
    var state = { open: false, busy: false, msgs: [] };
    try { state.msgs = JSON.parse(sessionStorage.getItem(STORE_KEY) || '[]'); } catch (e) { state.msgs = []; }
    function save() { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(state.msgs.slice(-40))); } catch (e) {} }

    var CHIPS = ["Today's offers", 'Healthy breakfast ideas', 'Headphones under 10000', "What's in my cart?", 'Track my order', 'Is the fitness band in stock?'];

    var root = document.createElement('div');
    root.className = 'cb-root';
    root.innerHTML =
        '<button class="cb-launcher" type="button" aria-label="Open shopping assistant" aria-expanded="false" aria-controls="cbPanel">' +
            '<span class="cb-launcher-ring" aria-hidden="true"></span>' +
            '<span class="cb-launcher-icon" aria-hidden="true"><i class="fas fa-wand-magic-sparkles"></i></span>' +
            '<span class="cb-launcher-label">Ask AI</span>' +
        '</button>' +
        '<section class="cb-panel" id="cbPanel" role="dialog" aria-modal="false" aria-label="' + esc(CFG.assistantName) + '" hidden>' +
            '<header class="cb-head">' +
                '<span class="cb-orb" aria-hidden="true"><i class="fas fa-basket-shopping"></i></span>' +
                '<div class="cb-title"><strong>' + esc(CFG.assistantName) + '</strong><small><span class="cb-dot"></span>' + (AI_ON ? 'Online · AI-powered' : 'Online · smart shopping assistant') + '</small></div>' +
                '<button class="cb-icon-btn" type="button" data-cb="reset" aria-label="Start a new conversation" title="New conversation"><i class="fas fa-rotate-left"></i></button>' +
                '<button class="cb-icon-btn" type="button" data-cb="close" aria-label="Close assistant" title="Close"><i class="fas fa-xmark"></i></button>' +
            '</header>' +
            '<div class="cb-body" aria-live="polite"></div>' +
            '<div class="cb-chips" role="list"></div>' +
            '<form class="cb-form" autocomplete="off">' +
                '<input class="cb-input" type="text" placeholder="Ask about products, offers, orders…" aria-label="Message the assistant" maxlength="400">' +
                '<button class="cb-send" type="submit" aria-label="Send"><i class="fas fa-paper-plane"></i></button>' +
            '</form>' +
        '</section>';
    document.body.appendChild(root);
    document.documentElement.classList.add('has-chat');

    var launcher = root.querySelector('.cb-launcher'), panel = root.querySelector('.cb-panel'), body = root.querySelector('.cb-body'),
        chips = root.querySelector('.cb-chips'), form = root.querySelector('.cb-form'), input = root.querySelector('.cb-input');

    function productCard(p) {
        var out = p.stockStatus === 'Out of Stock';
        return '<article class="cb-card' + (out ? ' is-out' : '') + '" data-id="' + p.id + '">' +
            '<a class="cb-card-img" href="product-detail.html?id=' + p.id + '"><img src="' + img(p) + '" alt="" loading="lazy">' + (promo(p) ? '<span class="cb-tag">' + esc(p.discountLabel || 'Offer') + '</span>' : '') + '</a>' +
            '<div class="cb-card-body"><a class="cb-card-name" href="product-detail.html?id=' + p.id + '">' + esc(p.name) + '</a>' +
            '<div class="cb-card-price"><b>' + fmt(price(p)) + '</b>' + (promo(p) ? '<s>' + fmt(p.price) + '</s>' : '') + '</div>' +
            '<div class="cb-card-stock ' + (out ? 'out' : p.stockStatus === 'Low Stock' ? 'low' : '') + '">' + esc(p.stockStatus || '') + '</div></div>' +
            '<button type="button" class="cb-add chat-add" data-add="' + p.id + '" ' + (out ? 'disabled' : '') + ' aria-label="Add ' + esc(p.name) + ' to cart"><i class="fas fa-plus"></i></button>' +
        '</article>';
    }
    function renderMsg(m, animate) {
        var el = document.createElement('div');
        el.className = 'cb-msg cb-' + (m.role === 'user' ? 'user' : 'bot') + (animate && !reduce ? ' is-new' : '');
        var html = '<div class="cb-bubble">' + (m.role === 'user' ? esc(m.text) : md(m.text)) + (m.note ? '<span class="cb-note">' + esc(m.note) + '</span>' : '') + '</div>';
        if (m.products && m.products.length && DATA.products) {
            html += '<div class="cb-cards">' + m.products.map(byId).filter(Boolean).map(productCard).join('') + '</div>';
        }
        if ((m.adds && m.adds.length) || (m.actions && m.actions.length)) {
            html += '<div class="cb-actions">' +
                (m.adds || []).map(function (a) { var p = byId(a.id); return p ? '<button type="button" class="cb-action is-primary" data-addqty="' + a.id + ':' + a.qty + '"><i class="fas fa-cart-plus"></i> Add ' + a.qty + ' × ' + esc(p.name) + '</button>' : ''; }).join('') +
                (m.actions || []).map(function (a) { return '<a class="cb-action' + (a.primary ? ' is-primary' : '') + '" href="' + a.href + '">' + esc(a.label) + '</a>'; }).join('') +
            '</div>';
        }
        el.innerHTML = html;
        body.appendChild(el);
        if (m.chips) renderChips(true);
    }
    function renderAll() {
        body.innerHTML = '';
        if (!state.msgs.length) {
            var user = session.get();
            state.msgs.push({ role: 'bot', text: 'Hi' + (user && user.name ? ' ' + user.name.split(' ')[0] : '') + '! 👋 I\'m your ' + CFG.assistantName + '. Ask me to find products, compare prices, show deals or track an order.' });
            save();
        }
        state.msgs.forEach(function (m) { renderMsg(m, false); });
        renderChips(state.msgs.length <= 1);
        scrollDown(true);
    }
    function renderChips(show) {
        chips.innerHTML = show ? CHIPS.map(function (c) { return '<button type="button" class="cb-chip" role="listitem">' + esc(c) + '</button>'; }).join('') : '';
        chips.hidden = !show;
    }
    function scrollDown(instant) { body.scrollTo({ top: body.scrollHeight, behavior: instant || reduce ? 'auto' : 'smooth' }); }
    function typing(on) {
        var t = body.querySelector('.cb-typing');
        if (on && !t) { t = document.createElement('div'); t.className = 'cb-msg cb-bot cb-typing'; t.innerHTML = '<div class="cb-bubble"><span></span><span></span><span></span></div>'; body.appendChild(t); scrollDown(); }
        if (!on && t) t.remove();
    }

    function respond(text) {
        return loadData().then(function () {
            if (!AI_ON) return Promise.resolve(localReply(text));
            return loadOrderContext().then(function () { return callAI(state.msgs); }).then(function (ans) {
                if (!ans) throw new Error('empty');
                return parseAI(ans);
            }).catch(function () {
                return Promise.resolve(localReply(text)).then(function (r) { r.note = 'AI is unavailable right now, so the built-in assistant answered.'; return r; });
            });
        }, function () {
            return { text: "I can't reach the store right now. Make sure the backend is running (RUN_STORE.bat) and try again." };
        });
    }

    function send(text) {
        text = String(text || '').trim();
        if (!text || state.busy) return;
        state.busy = true;
        renderChips(false);
        var um = { role: 'user', text: text };
        state.msgs.push(um); save(); renderMsg(um, true); scrollDown();
        input.value = '';
        var started = Date.now();
        setTimeout(function () { if (state.busy) typing(true); }, 120);
        Promise.resolve(respond(text)).then(function (r) {
            var wait = Math.max(0, (AI_ON ? 0 : 450) - (Date.now() - started));
            setTimeout(function () {
                typing(false);
                var bm = { role: 'bot', text: r.text || '', raw: r.raw, products: r.products || [], adds: r.adds || [], actions: r.actions || [], note: r.note, chips: r.chips };
                state.msgs.push(bm); save(); renderMsg(bm, true); scrollDown();
                state.busy = false;
            }, wait);
        });
    }

    function open() {
        if (state.open) return;
        state.open = true;
        panel.hidden = false;
        requestAnimationFrame(function () { root.classList.add('is-open'); });
        launcher.setAttribute('aria-expanded', 'true');
        loadData().catch(function () {}).then(renderAll);
        setTimeout(function () { input.focus(); }, 200);
        try { sessionStorage.setItem('market_chat_seen', '1'); } catch (e) {}
        root.classList.add('is-seen');
    }
    function close() {
        if (!state.open) return;
        state.open = false;
        root.classList.remove('is-open');
        launcher.setAttribute('aria-expanded', 'false');
        setTimeout(function () { if (!state.open) panel.hidden = true; }, reduce ? 0 : 260);
        launcher.focus();
    }

    launcher.addEventListener('click', function () { state.open ? close() : open(); });
    root.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cb]');
        if (b && b.dataset.cb === 'close') close();
        if (b && b.dataset.cb === 'reset') { state.msgs = []; orderContext = null; save(); renderAll(); input.focus(); }
        var chip = e.target.closest('.cb-chip');
        if (chip) send(chip.textContent);
        var add = e.target.closest('[data-add]');
        if (add && !add.disabled) {
            var p = byId(add.dataset.add);
            if (p) { addProductToCart(p, 1); add.classList.add('is-done'); add.innerHTML = '<i class="fas fa-check"></i>'; setTimeout(function () { add.classList.remove('is-done'); add.innerHTML = '<i class="fas fa-plus"></i>'; }, 1600); }
        }
        var aq = e.target.closest('[data-addqty]');
        if (aq && !aq.disabled) {
            var parts = aq.dataset.addqty.split(':'), pp = byId(parts[0]);
            if (pp) { addProductToCart(pp, +parts[1]); aq.disabled = true; aq.innerHTML = '<i class="fas fa-check"></i> Added to cart'; }
        }
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); send(input.value); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.open) close(); });

    try { if (sessionStorage.getItem('market_chat_seen')) root.classList.add('is-seen'); } catch (e) {}
})();
