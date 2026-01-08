(() => {
  const AUTH_KEY = 'hospital_auth_token';
  const USER_KEY = 'hospital_user';
  function checkSession() {
    const token = localStorage.getItem(AUTH_KEY);
    const user = localStorage.getItem(USER_KEY);
    if (token && user) {
      try {
        return JSON.parse(user);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
  function login(username, password) {
    if (username === 'admin' && password === 'admin') {
      const user = { username, role: 'admin', name: 'Admin User' };
      localStorage.setItem(AUTH_KEY, 'mock-token-' + Date.now());
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }
    return null;
  }
  function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  }
  window.App = window.App || {};
  App.Services = App.Services || {};
  App.Services.Auth = { checkSession, login, logout };
})();
