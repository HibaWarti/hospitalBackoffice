function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
  }
}

function mountNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  const links = [
    ['dashboard.html', 'Dashboard'],
    ['patients.html', 'Patients'],
    ['doctors.html', 'Médecins'],
    ['appointments.html', 'Rendez-vous'],
    ['prescriptions.html', 'Prescriptions'],
    ['services.html', 'Services'],
  ];
  nav.innerHTML = links
    .map(([href, label]) => `<a href="${href}">${label}</a>`)
    .concat('<a href="#" id="logout">Déconnexion</a>')
    .join(' | ');
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

