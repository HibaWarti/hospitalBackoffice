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
            <td>
              <button data-id="${s.id}" class="edit">Éditer</button>
              <button data-id="${s.id}" class="del">Supprimer</button>
            </td>
          </tr>`
      )
      .join('');
  }

  function openAddModal() {
    Swal.fire({
      title: 'Ajouter un service',
      html:
        '<div class="space-y-2 text-left">' +
        '<input id="sw-nom" class="swal2-input" placeholder="Nom du service">' +
        '<input id="sw-resp" class="swal2-input" placeholder="Responsable">' +
        '<input id="sw-desc" class="swal2-input" placeholder="Description">' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Ajouter',
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
    if (t.classList.contains('del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_SERVICES, id);
      render();
    } else if (t.classList.contains('edit')) {
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
