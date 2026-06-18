var Auth = {
  getToken:        function () { return localStorage.getItem('token'); },
  getRefreshToken: function () { return localStorage.getItem('refreshToken'); },
  getUser: function () {
    var u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },
  save: function (accessToken, user) {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  },
  saveTokens: function (accessToken, refreshToken) {
    localStorage.setItem('token', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  },
  logout: function () {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    var path = window.location.pathname;
    if (path.indexOf('/admin-dashboard/') !== -1 || path.indexOf('/staff/') !== -1) {
      window.location.replace('../index.html');
    } else {
      window.location.replace('index.html');
    }
  },
  isLoggedIn: function () { return !!this.getToken(); }
};
