/* Light / dark theme toggle.
   Standalone file: it only sets data-theme on <html> and adds a toggle button.
   It does not touch the cart, session, API or any other store logic. */
(function () {
    var KEY = 'market_theme';
    var root = document.documentElement;

    function saved() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }
    function systemPrefersDark() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    function current() {
        return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }
    function apply(theme) {
        root.setAttribute('data-theme', theme);
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', theme === 'dark' ? '#07140f' : '#0b2a20');
        var btn = document.getElementById('themeToggle');
        if (btn) {
            var dark = theme === 'dark';
            btn.setAttribute('aria-pressed', String(dark));
            btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
            btn.title = dark ? 'Light mode' : 'Dark mode';
            btn.innerHTML = dark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }

    // Runs in <head>, before the page paints, so there is no flash of the wrong theme
    apply(saved() || (systemPrefersDark() ? 'dark' : 'light'));

    document.addEventListener('DOMContentLoaded', function () {
        if (document.getElementById('themeToggle')) return;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'themeToggle';
        btn.className = 'theme-toggle';
        btn.addEventListener('click', function () {
            var next = current() === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(KEY, next); } catch (e) {}
            apply(next);
        });

        // Store pages: next to the cart. Admin: in the top bar. Login/register: floating.
        var auth = document.getElementById('authActions');
        var adminTop = document.querySelector('.top-actions');
        if (auth && auth.parentNode) auth.parentNode.insertBefore(btn, auth);
        else if (adminTop) adminTop.insertBefore(btn, adminTop.firstChild);
        else { btn.classList.add('theme-toggle--floating'); document.body.appendChild(btn); }

        apply(current());
    });
})();
