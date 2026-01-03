document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const exportBtn = document.getElementById('export-services');
  const searchInput = document.getElementById('s-search');
  const sortField = document.getElementById('s-sort');
  const sortOrder = document.getElementById('s-order');
  const addBtn = document.getElementById('add-service');

  function applyFilterSort(items) {
    const q = (searchInput && searchInput.value || '').toLowerCase();
    let res = items;
    if (q) {
      res = res.filter((s) =>
        [s.nom, s.responsable, s.description].some((v) => String(v || '').toLowerCase().includes(q))
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
    const items = applyFilterSort(list(HL_SERVICES));
    tbody.innerHTML = items
      .map(
        (s) =>
          `<tr>
            <td>${s.nom}</td>
            <td>${s.responsable}</td>
            <td>${s.description}</td>
            <td class="relative">
              <button class="kebab px-2 py-1" data-id="${s.id}" aria-label="Actions"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
              <div class="menu absolute right-0 mt-2 bg-white border rounded shadow hidden z-10">
                <button class="menu-view block w-full text-left px-3 py-2" data-id="${s.id}">Voir</button>
                <button class="menu-edit block w-full text-left px-3 py-2" data-id="${s.id}">Éditer</button>
                <button class="menu-del block w-full text-left px-3 py-2 text-red-600" data-id="${s.id}">Supprimer</button>
              </div>
            </td>
          </tr>`
      )
      .join('');
    if (window.lucide) lucide.createIcons();
  }

  function openAddModal() {
    Swal.fire({
      title: 'Ajouter un service',
      html:
        '<div class="grid grid-cols-1 gap-2 text-left">' +
        '<label class="text-sm">Nom du service<input id="sw-nom" class="swal2-input"></label>' +
        '<label class="text-sm">Responsable<input id="sw-resp" class="swal2-input"></label>' +
        '<label class="text-sm">Description<input id="sw-desc" class="swal2-input"></label>' +
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
        const responsable = document.getElementById('sw-resp').value.trim();
        const description = document.getElementById('sw-desc').value.trim();
        if (!nom || !responsable || !description) {
          Swal.showValidationMessage('Veuillez remplir tous les champs');
          return false;
        }
        return { nom, responsable, description };
      },
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        create(HL_SERVICES, res.value, 'srv');
        render();
        Swal.fire({ icon: 'success', title: 'Ajouté', text: 'Service ajouté' });
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
      window.location.href = 'info.html?type=services&id=' + encodeURIComponent(id);
      return;
    }
    if (t.classList.contains('menu-del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_SERVICES, id);
      render();
      Swal.fire({ icon: 'success', title: 'Supprimé', text: 'Service supprimé' });
    } else if (t.classList.contains('menu-edit')) {
      const id = t.getAttribute('data-id');
      const items = list(HL_SERVICES);
      const s = items.find((x) => x.id === id);
      if (!s) return;
      Swal.fire({
        title: 'Éditer service',
        html:
          '<div class="space-y-2 text-left">' +
          `<input id="sw-nom" class="swal2-input" placeholder="Nom du service" value="${s.nom}">` +
          `<input id="sw-resp" class="swal2-input" placeholder="Responsable" value="${s.responsable}">` +
          `<input id="sw-desc" class="swal2-input" placeholder="Description" value="${s.description}">` +
          '</div>',
        focusConfirm: false,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'Sauvegarder',
        preConfirm: () => {
          const nom = document.getElementById('sw-nom').value.trim();
          const responsable = document.getElementById('sw-resp').value.trim();
          const description = document.getElementById('sw-desc').value.trim();
          if (!nom || !responsable || !description) {
            Swal.showValidationMessage('Veuillez remplir tous les champs');
            return false;
          }
          return { nom, responsable, description };
        },
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          update(HL_SERVICES, id, res.value);
          render();
          Swal.fire({ icon: 'success', title: 'Modifié', text: 'Service mis à jour' });
        }
      });
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('services.csv', list(HL_SERVICES));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  render();
});
