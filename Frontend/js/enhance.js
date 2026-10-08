/* =====================================================================
   enhance.js — motion & micro-interaction layer
   Purely additive. It never calls the API, never changes the cart,
   session or any data, and never replaces anything the page scripts
   rely on. It only adds classes, decorative elements and animations.
   If this file is removed, every page still works exactly as before.
   ===================================================================== */
(function () {
    'use strict';
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

    document.documentElement.classList.add('js-enhanced');

    /* ---------- 1. Scroll progress bar + condensed navbar ---------- */
    function initScrollChrome() {
        var bar = document.createElement('div');
        bar.className = 'scroll-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);
        var nav = $('.navbar');
        var top = document.createElement('button');
        top.type = 'button';
        top.className = 'to-top';
        top.setAttribute('aria-label', 'Back to top');
        top.innerHTML = '<i class="fas fa-arrow-up"></i>';
        top.onclick = function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); };
        document.body.appendChild(top);
        var ticking = false;
        function update() {
            var h = document.documentElement.scrollHeight - innerHeight;
            var y = scrollY;
            bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0) + ')';
            if (nav) nav.classList.toggle('is-scrolled', y > 24);
            top.classList.toggle('is-visible', y > 700);
            catchUp();
            ticking = false;
        }
        addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
        update();
    }

    /* ---------- 2. Reveal-on-scroll (static + dynamically rendered) --- */
    var REVEAL = '[data-reveal], .product-card, .category-card, .feature-card, .step-card, .order-card, .cart-item, .trust-item, .stat, .quick-action, .detail-grid, .summary, .checkout-panel';
    var io = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            reveal(e.target);
        });
    }, { rootMargin: '0px 0px -4% 0px', threshold: 0.04 }) : null;

    /* anything scrolled past without being seen (fast jumps, End key) is shown too */
    function reveal(el) {
        if (io) io.unobserve(el);
        el.classList.add('rv-in');
        countUpWithin(el);
        setTimeout(function () { el.classList.remove('rv', 'rv-in'); el.style.removeProperty('--rv-d'); }, 1100);
    }
    function catchUp() {
        if (!io) return;
        $$('.rv:not(.rv-in)').forEach(function (el) {
            if (el.getBoundingClientRect().top < innerHeight) reveal(el);
        });
    }

    function prime(list) {
        if (!io) { list.forEach(countUpWithin); return; }
        var groups = new Map();
        list.forEach(function (el) {
            if (el.dataset.rvDone) return;
            el.dataset.rvDone = '1';
            var p = el.parentNode, n = groups.get(p) || 0;
            groups.set(p, n + 1);
            el.style.setProperty('--rv-d', Math.min(n, 10) * 70 + 'ms');
            el.classList.add('rv');
            io.observe(el);
        });
    }

    /* Admin table rows: fade only */
    function primeRows(rows) {
        if (reduce) return;
        rows.forEach(function (tr, i) {
            if (tr.dataset.rvDone) return;
            tr.dataset.rvDone = '1';
            tr.style.setProperty('--rv-d', Math.min(i, 14) * 35 + 'ms');
            tr.classList.add('row-in');
        });
    }

    /* ---------- 3. Count-up numbers ---------------------------------- */
    function countUp(el) {
        if (el.dataset.counted) return;
        var raw = (el.getAttribute('data-count') || el.textContent).trim();
        var target = parseFloat(raw.replace(/[^0-9.]/g, ''));
        if (!isFinite(target) || target === 0 || /[a-z]/i.test(raw.replace(/[0-9.,+%]/g, '').replace(/\s/g, ''))) return;
        el.dataset.counted = '1';
        var suffix = el.getAttribute('data-suffix') || (raw.match(/[+%]$/) || [''])[0];
        if (reduce) return;
        var start = performance.now(), dur = 1100;
        (function tick(t) {
            var p = Math.min(1, (t - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        })(start);
    }
    function countUpWithin(root) {
        if (root.matches && (root.matches('[data-count]') || root.matches('.stat'))) {
            if (root.matches('[data-count]')) countUp(root);
        }
        $$('[data-count], .stat strong', root).forEach(countUp);
    }

    /* ---------- 4. Skeleton loaders in place of spinners ------------- */
    function skeletonize(sp) {
        if (sp.dataset.sk) return;
        sp.dataset.sk = '1';
        var host = sp.parentNode;
        var html = '', i;
        if (host && host.classList.contains('product-grid')) {
            for (i = 0; i < 4; i++) html += '<div class="sk-card"><div class="sk sk-img"></div><div class="sk sk-line w40"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div><div class="sk-row"><div class="sk sk-btn"></div><div class="sk sk-btn"></div></div></div>';
            sp.classList.add('sk-grid');
        } else if (host && host.classList.contains('category-grid')) {
            for (i = 0; i < 8; i++) html += '<div class="sk-cat"><div class="sk sk-circle"></div><div class="sk sk-line w60"></div></div>';
            sp.classList.add('sk-grid', 'sk-grid--cats');
        } else {
            html = '<div class="sk-block"><div class="sk sk-line w40"></div><div class="sk sk-line w80"></div><div class="sk sk-line w60"></div></div>';
            sp.classList.add('sk-plain');
        }
        sp.innerHTML = html;
        sp.setAttribute('aria-label', 'Loading');
        sp.setAttribute('role', 'status');
    }

    /* ---------- 5. Shop: category chips + result count --------------- */
    function initShopChips() {
        var select = $('#category'), rail = $('#categoryChips');
        if (!select || !rail) return;
        function build() {
            var opts = Array.prototype.slice.call(select.options);
            rail.innerHTML = opts.map(function (o) {
                return '<button type="button" class="chip' + (o.value === select.value ? ' is-active' : '') + '" data-value="' + o.value.replace(/"/g, '') + '">' +
                    (o.value === '' ? '<i class="fas fa-border-all"></i> ' : '') + o.textContent.replace(/</g, '&lt;') + '</button>';
            }).join('');
        }
        function sync() {
            $$('.chip', rail).forEach(function (c) { c.classList.toggle('is-active', c.dataset.value === select.value); });
        }
        rail.addEventListener('click', function (e) {
            var chip = e.target.closest('.chip');
            if (!chip || chip.dataset.value === select.value) return;
            select.value = chip.dataset.value;
            // Same event the dropdown fires — the page's own handler does the loading
            select.dispatchEvent(new Event('change', { bubbles: true }));
            sync();
        });
        select.addEventListener('change', sync);
        new MutationObserver(build).observe(select, { childList: true });
        build();
        // the page may set the value from ?categoryId=… after loading options
        setTimeout(sync, 400); setTimeout(sync, 1500);

        var grid = $('#grid'), count = $('#resultCount');
        if (grid && count) {
            new MutationObserver(function () {
                var n = grid.querySelectorAll('.product-card').length;
                count.textContent = n ? n + (n === 1 ? ' product' : ' products') : '';
                count.classList.toggle('is-visible', n > 0);
            }).observe(grid, { childList: true });
        }
    }

    /* ---------- 6. Fly-to-cart + cart badge bump ---------------------- */
    function initCartFx() {
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('.card-actions .btn-primary, #addBtn, .chat-add');
            if (!btn || btn.disabled || reduce) return;
            var img = btn.closest('.product-card') ? btn.closest('.product-card').querySelector('.product-thumb img')
                : btn.closest('.cb-card') ? btn.closest('.cb-card').querySelector('img') : $('.detail-art img');
            var cart = $('.cart-link');
            if (!img || !cart || !img.animate) return;
            var a = img.getBoundingClientRect(), b = cart.getBoundingClientRect();
            var ghost = img.cloneNode(false);
            ghost.className = 'fly-ghost';
            ghost.removeAttribute('loading');
            Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
            document.body.appendChild(ghost);
            var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
            ghost.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1, borderRadius: '18px' },
                { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.55 - 120) + 'px) scale(.45)', opacity: .95, borderRadius: '50%', offset: .55 },
                { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: .2, borderRadius: '50%' }
            ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = function () {
                ghost.remove();
                cart.classList.remove('is-hit'); void cart.offsetWidth; cart.classList.add('is-hit');
            };
        }, true);

        var badge = $('#cartCount');
        if (badge) {
            var last = badge.textContent;
            new MutationObserver(function () {
                if (badge.textContent !== last) {
                    last = badge.textContent;
                    badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump');
                }
            }).observe(badge, { childList: true, characterData: true, subtree: true });
        }
    }

    /* ---------- 7. Card tilt + spotlight (mouse only) ------------------ */
    function initTilt() {
        if (!finePointer || reduce) return;
        var active = null;
        document.addEventListener('pointermove', function (e) {
            var card = e.target.closest && e.target.closest('.product-card, .category-card, .feature-card, .stat, .quick-action');
            if (active && active !== card) { active.style.removeProperty('--rx'); active.style.removeProperty('--ry'); active = null; }
            if (!card) return;
            active = card;
            var r = card.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            if (card.classList.contains('product-card')) {
                card.style.setProperty('--rx', ((0.5 - py) * 6).toFixed(2) + 'deg');
                card.style.setProperty('--ry', ((px - 0.5) * 8).toFixed(2) + 'deg');
            }
        }, { passive: true });
    }

    /* ---------- 8. Button ripple ------------------------------------- */
    function initRipple() {
        if (reduce) return;
        document.addEventListener('pointerdown', function (e) {
            var b = e.target.closest('.btn, .chip, .quick-action');
            if (!b || b.disabled) return;
            var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2;
            var dot = document.createElement('span');
            dot.className = 'ripple';
            Object.assign(dot.style, { width: s + 'px', height: s + 'px', left: (e.clientX - r.left - s / 2) + 'px', top: (e.clientY - r.top - s / 2) + 'px' });
            b.appendChild(dot);
            setTimeout(function () { dot.remove(); }, 650);
        }, { passive: true });
    }

    /* ---------- 9. Product detail: hover zoom ------------------------- */
    function initZoom() {
        if (!finePointer) return;
        document.addEventListener('pointermove', function (e) {
            var art = e.target.closest && e.target.closest('.detail-art');
            if (!art) return;
            var img = art.querySelector('img'); if (!img) return;
            var r = art.getBoundingClientRect();
            img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
            art.classList.add('is-zoom');
        }, { passive: true });
        document.addEventListener('pointerout', function (e) {
            var art = e.target.closest && e.target.closest('.detail-art');
            if (art && !art.contains(e.relatedTarget)) art.classList.remove('is-zoom');
        });
    }

    /* ---------- 10. Watch the DOM for content the page scripts render - */
    function scan(root) {
        if (root.nodeType !== 1) return;
        var items = [];
        if (root.matches(REVEAL)) items.push(root);
        $$(REVEAL, root).forEach(function (el) { items.push(el); });
        if (items.length) prime(items);
        var sps = root.matches('.spinner') ? [root] : $$('.spinner', root);
        sps.forEach(skeletonize);
        var rows = root.matches('tbody') ? $$('tr', root) : $$('tbody tr', root);
        if (rows.length) primeRows(rows);
        countUpWithin(root);
    }

    function boot() {
        initScrollChrome();
        initShopChips();
        initCartFx();
        initTilt();
        initRipple();
        initZoom();
        scan(document.body);
        new MutationObserver(function (muts) {
            muts.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, scan); });
        }).observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
