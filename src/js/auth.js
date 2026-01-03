const AUTH_KEY = 'hospital_auth';

function login(username, password) {
  if (username === 'admin' && password === 'admin') {
    localStorage.setItem(AUTH_KEY, 'true');
    return true;
  }
  return false;
}

function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.href = 'pages/index.html';
}
