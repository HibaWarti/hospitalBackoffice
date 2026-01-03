function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = 'pages/index.html';
  }
}

function mountNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;
  nav.className = 'bg-white shadow';
  nav.innerHTML =
    '<div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">' +
    '<div class="flex items-center gap-2"><i data-lucide="hospital" class="w-5 h-5 text-blue-600"></i><span class="font-semibold">HLSpital</span></div>' +
    '<div class="flex-1"></div>' +
    '<a class="text-sm text-gray-700 hover:text-blue-600" href="pages/dashboard.html">Dashboard</a>' +
    '<a class="text-sm text-gray-700 hover:text-blue-600" href="pages/patients.html">Patients</a>' +
    '<a class="text-sm text-gray-700 hover:text-blue-600" href="pages/doctors.html">Médecins</a>' +
    '<a class="text-sm text-gray-700 hover:text-blue-600" href="pages/appointments.html">Rendez-vous</a>' +
    '<a class="text-sm text-gray-700 hover:text-blue-600" href="pages/prescriptions.html">Prescriptions</a>' +
    '<a class="text-sm text-gray-700 hover:text-blue-600" href="pages/services.html">Services</a>' +
    '<a id="logout" class="text-sm text-red-600 hover:text-red-700" href="#">Déconnexion</a>' +
    '</div>';
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
  if (window.lucide && typeof lucide.createIcons === 'function') {
    lucide.createIcons();
  }
}
