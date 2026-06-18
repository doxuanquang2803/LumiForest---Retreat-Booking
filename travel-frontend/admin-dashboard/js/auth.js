document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch(e) {
    console.error("Error parsing user from localStorage");
  }

  // Redirect to root login page if no token
  if (!token) {
    const path = window.location.pathname;
    if (path.includes('/admin-dashboard/pages/')) {
      window.location.href = '../../login.html';
    } else {
      window.location.href = '../login.html';
    }
    return;
  }

  // Check roles and setup UI
  if (user) {
    // Only Admin or Staff should access dashboard
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      window.CustomAlert.alert('Unauthorized access. Only ADMIN or STAFF allowed.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const path = window.location.pathname;
      if (path.includes('/admin-dashboard/pages/')) {
        window.location.href = '../../login.html';
      } else {
        window.location.href = '../login.html';
      }
      return;
    }

    // Set user name in header
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
      userNameEl.textContent = user.name || user.username || 'Admin';
    }

    // Handle logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const path = window.location.pathname;
        if (path.includes('/admin-dashboard/pages/')) {
          window.location.replace('../../index.html');
        } else {
          window.location.replace('../index.html');
        }
      });
    }
  }
});

// Initialize Choices for static dropdowns after a short delay
setTimeout(() => {
  document.querySelectorAll('select.form-select').forEach(el => {
    if (!el.dataset.choicesInit) {
      new Choices(el, { searchEnabled: false, shouldSort: false });
      el.dataset.choicesInit = "true";
    }
  });
}, 500);
