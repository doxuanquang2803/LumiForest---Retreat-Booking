(function () {
  var page = window.location.pathname.split('/').pop() || 'index.html';

  function setActiveNav() {
    document.querySelectorAll('#ftco-navbar .nav-item[data-page]').forEach(function (item) {
      if (item.dataset.page === page) item.classList.add('active');
    });
  }

  function injectAuthNav() {
    var nav = document.querySelector('#ftco-navbar .navbar-nav');
    if (!nav) return;

    var existing = nav.querySelector('.auth-nav');
    if (existing) existing.remove();

    var li = document.createElement('li');
    li.className = 'nav-item auth-nav';

    if (Auth.isLoggedIn()) {
      var user = Auth.getUser();
      var role = (user && user.role) ? user.role.toLowerCase() : '';
      var dashboardLink = '';
      if (role === 'admin') {
        dashboardLink = '<a class="dropdown-item" href="admin-dashboard/index.html">Admin Dashboard</a><div class="dropdown-divider"></div>';
      } else if (role === 'staff') {
        dashboardLink = '<a class="dropdown-item" href="staff/index.html">Staff Dashboard</a><div class="dropdown-divider"></div>';
      }
      li.classList.add('dropdown');
      li.innerHTML =
        '<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown">' +
          '<span class="icon-user"></span> ' + user.name +
        '</a>' +
        '<div class="dropdown-menu dropdown-menu-right">' +
          dashboardLink +
          '<a class="dropdown-item" href="profile.html" data-i18n="nav.profile">My Profile</a>' +
          '<div class="dropdown-divider"></div>' +
          '<a class="dropdown-item" href="#" id="btn-logout" data-i18n="nav.logout">Logout</a>' +
        '</div>';
      nav.appendChild(li);
      document.addEventListener('click', function (e) {
        if (e.target && e.target.id === 'btn-logout') {
          e.preventDefault();
          Auth.logout();
        }
      });
    } else {
      li.innerHTML = '<a href="login.html" class="nav-link" data-i18n="nav.login">Login</a>';
      nav.appendChild(li);
    }
  }

  function loadNotifCount() {
    if (!Auth.isLoggedIn()) return;
    var token = Auth.getToken();
    fetch('http://localhost:3000/api/notifications?page=1&limit=50', {
      headers: { 'Authorization': 'Bearer ' + token }
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res.success || !res.data) return;
      var count = res.data.filter(function (n) { return !n.isRead; }).length;
      var bell = document.getElementById('notif-bell-count');
      if (bell && count > 0) {
        bell.textContent = count;
        bell.style.display = 'inline-block';
      }
    }).catch(function () {});
  }

  fetch('assets/includes/header.html')
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var el = document.getElementById('header-placeholder');
      if (!el) return;
      el.innerHTML = html;
      setActiveNav();
      injectAuthNav();
      loadNotifCount();
      if (window.I18N) window.I18N.apply();
    })
    .catch(function () {
      console.warn('Could not load header');
    });
})();
