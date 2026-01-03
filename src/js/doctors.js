document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const exportBtn = document.getElementById('export-doctors');
  const searchInput = document.getElementById('d-search');
  const sortField = document.getElementById('d-sort');
  const sortOrder = document.getElementById('d-order');
  const addBtn = document.getElementById('add-doctor');

  function serviceName(id) {
    const s = list(HL_SERVICES).find((x) => x.id === id);
    return s ? s.nom : '';
  }

  function applyFilterSort(items) {
    const q = (searchInput && searchInput.value || '').toLowerCase();
    let res = items;
    if (q) {
      res = res.filter((d) =>
        [d.nom, d.specialite, d.telephone, d.email].some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    const field = sortField && sortField.value;
    const order = (sortOrder && sortOrder.value) === 'desc' ? -1 : 1;
    if (field) {
      res = res.slice().sort((a, b) => {
        const va = a[field];
        const vb = b[field];
        if (va < vb) return -1 * order;
        if (va > vb) return 1 * order;
        return 0;
      });
    }
    return res;
  }

  function render() {
    const items = applyFilterSort(list(HL_DOCTORS));
    tbody.innerHTML = items
      .map(
        (d) =>
          `<tr>
            <td>${d.nom}</td>
            <td>${d.specialite}</td>
            <td>${d.telephone}</td>
            <td>${d.email}</td>
            <td>${serviceName(d.serviceId)}</td>
            <td class="relative">
              <button class="kebab px-2 py-1" data-id="${d.id}" aria-label="Actions"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
              <div class="menu absolute right-0 mt-2 bg-white border rounded shadow hidden z-10">
                <button class="menu-view block w-full text-left px-3 py-2" data-id="${d.id}">Voir</button>
                <button class="menu-edit block w-full text-left px-3 py-2" data-id="${d.id}">Éditer</button>
                <button class="menu-del block w-full text-left px-3 py-2 text-red-600" data-id="${d.id}">Supprimer</button>
              </div>
            </td>
          </tr>`
      )
      .join('');
    if (window.lucide) lucide.createIcons();
  }

  function openAddModal() {
    const services = list(HL_SERVICES);
    const options = services.map((s) => `<option value="${s.id}">${s.nom}</option>`).join('');
    Swal.fire({
      title: 'Ajouter un médecin',
      html:
        '<div class="grid grid-cols-1 gap-2 text-left">' +
        '<label class="text-sm">Nom<input id="sw-nom" class="swal2-input"></label>' +
        '<label class="text-sm">Spécialité<input id="sw-spec" class="swal2-input"></label>' +
        '<label class="text-sm">Téléphone<input id="sw-tel" class="swal2-input"></label>' +
        '<label class="text-sm">Email<input id="sw-email" class="swal2-input" type="email"></label>' +
        `<label class="text-sm">Service<select id="sw-service" class="swal2-select"><option value="">Service</option>${options}</select></label>` +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Ajouter',
      buttonsStyling: false,
      customClass: {
        confirmButton: 'bg-blue-600 text-white rounded px-3 py-2',
        cancelButton: 'bg-gray-200 text-gray-800 rounded px-3 py-2',
        popup: 'rounded-lg'
      },
      preConfirm: () => {
        const nom = document.getElementById('sw-nom').value.trim();
        const specialite = document.getElementById('sw-spec').value.trim();
        const telephone = document.getElementById('sw-tel').value.trim();
        const email = document.getElementById('sw-email').value.trim();
        const serviceId = document.getElementById('sw-service').value;
        if (!nom || !specialite || !telephone || !email || !serviceId) {
          Swal.showValidationMessage('Veuillez remplir tous les champs');
          return false;
        }
        return { nom, specialite, telephone, email, serviceId };
      },
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        create(HL_DOCTORS, res.value, 'doc');
        render();
        Swal.fire({ icon: 'success', title: 'Ajouté', text: 'Médecin ajouté' });
      }
    });
  }

  tbody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.closest('.kebab')) {
      const btn = t.closest('.kebab');
      const cell = btn.parentElement;
      document.querySelectorAll('.menu').forEach((m) => m.classList.add('hidden'));
      const menu = cell.querySelector('.menu');
      if (menu) menu.classList.toggle('hidden');
      return;
    }
    if (t.classList.contains('menu-view')) {
      const id = t.getAttribute('data-id');
      window.location.href = 'info.html?type=doctors&id=' + encodeURIComponent(id);
      return;
    }
    if (t.classList.contains('menu-del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_DOCTORS, id);
      render();
      Swal.fire({ icon: 'success', title: 'Supprimé', text: 'Médecin supprimé' });
    } else if (t.classList.contains('menu-edit')) {
      const id = t.getAttribute('data-id');
      const items = list(HL_DOCTORS);
      const d = items.find((x) => x.id === id);
      if (!d) return;
      const services = list(HL_SERVICES);
      const options = services.map((s) => `<option value="${s.id}"${s.id===d.serviceId?' selected':''}>${s.nom}</option>`).join('');
      Swal.fire({
        title: 'Éditer médecin',
        html:
          '<div class="space-y-2 text-left">' +
          `<input id="sw-nom" class="swal2-input" placeholder="Nom" value="${d.nom}">` +
          `<input id="sw-spec" class="swal2-input" placeholder="Spécialité" value="${d.specialite}">` +
          `<input id="sw-tel" class="swal2-input" placeholder="Téléphone" value="${d.telephone}">` +
          `<input id="sw-email" class="swal2-input" type="email" placeholder="Email" value="${d.email}">` +
          `<select id="sw-service" class="swal2-select"><option value="">Service</option>${options}</select>` +
          '</div>',
        focusConfirm: false,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'Sauvegarder',
        preConfirm: () => {
          const nom = document.getElementById('sw-nom').value.trim();
          const specialite = document.getElementById('sw-spec').value.trim();
          const telephone = document.getElementById('sw-tel').value.trim();
          const email = document.getElementById('sw-email').value.trim();
          const serviceId = document.getElementById('sw-service').value;
          if (!nom || !specialite || !telephone || !email || !serviceId) {
            Swal.showValidationMessage('Veuillez remplir tous les champs');
            return false;
          }
          return { nom, specialite, telephone, email, serviceId };
        },
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          update(HL_DOCTORS, id, res.value);
          render();
          Swal.fire({ icon: 'success', title: 'Modifié', text: 'Médecin mis à jour' });
        }
      });
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('medecins.csv', list(HL_DOCTORS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);
  if (addBtn) addBtn.addEventListener('click', openAddModal);
  render();
});
