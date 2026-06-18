import { SessionManager } from '../services/SessionManager.js';
import { StaffI18N, t } from '../js/i18n.js';

// Inject flag-icons CSS once
(function injectFlagIcons() {
  if (!document.querySelector('link[data-staff-flags]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/gh/lipis/flag-icons@7.2.3/css/flag-icons.min.css';
    link.setAttribute('data-staff-flags', '1');
    document.head.appendChild(link);
  }
})();

// Expose globally so non-module scripts (modules running in module scope) can use t()
window.StaffI18N = StaffI18N;
window.st = t;

export class LayoutRenderer {
  static async init() {
    if (!SessionManager.validateAccess()) return;

    try {
      const [sidebarHtml, headerHtml, modalsHtml] = await Promise.all([
        fetch('includes/sidebar.html').then(r => r.text()),
        fetch('includes/header.html').then(r => r.text()),
        fetch('includes/modals.html').then(r => r.text())
      ]);

      const sidebar = document.getElementById('sidebar-wrapper');
      const header = document.getElementById('header-wrapper');
      const modals = document.getElementById('modals-wrapper');

      if (sidebar) sidebar.innerHTML = sidebarHtml;
      if (header) header.innerHTML = headerHtml;
      if (modals) modals.innerHTML = modalsHtml;

      // Apply i18n to injected layout HTML
      StaffI18N.apply();

      this.setupEvents();
    } catch (error) {
      console.error('Failed to load layout templates:', error);
    }
  }

  static setupEvents() {
    const user = SessionManager.getUser();
    if (user) {
      const nameEl = document.getElementById('user-name');
      if (nameEl) nameEl.textContent = user.name || user.email || 'Staff Member';
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        SessionManager.logout();
      });
    }

    // Language toggle
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('#staff-lang-toggle');
      if (btn) {
        e.preventDefault();
        StaffI18N.toggleLang();
      }
    });

    const wrapper = document.getElementById('wrapper');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('menu-toggle');

    if (toggleBtn && wrapper) {
      toggleBtn.addEventListener('click', () => {
        wrapper.classList.toggle('toggled');
      });
    }

    if (overlay && wrapper) {
      overlay.addEventListener('click', () => {
        wrapper.classList.remove('toggled');
      });
    }

    // Highlight active link + update page title
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar-nav .nav-link[data-path]');
    const titleEl = document.getElementById('page-title');

    links.forEach(link => {
      if (link.dataset.path === currentPath) {
        link.classList.add('active');
        if (titleEl) {
          // Use the translated text (strip icon text from the link)
          const textNode = [...link.childNodes].find(n => n.nodeType === Node.TEXT_NODE);
          titleEl.textContent = textNode ? textNode.textContent.trim() : link.textContent.trim();
        }
        const collapse = link.closest('.collapse');
        if (collapse) {
          collapse.classList.add('show');
          const toggle = document.querySelector(`[href="#${collapse.id}"]`);
          if (toggle) toggle.setAttribute('aria-expanded', 'true');
        }
      }
    });
  }
}

// Initialize Choices for static dropdowns after a short delay to allow HTML to render
setTimeout(() => {
  document.querySelectorAll('select.form-select').forEach(el => {
    if (!el.dataset.choicesInit) {
      new Choices(el, { searchEnabled: false, shouldSort: false });
      el.dataset.choicesInit = "true";
    }
  });
}, 500);
