document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const exportBtn = document.getElementById('export-patients');
  const searchInput = document.getElementById('p-search');
  const sortField = document.getElementById('p-sort');
  const sortOrder = document.getElementById('p-order');
  const addBtn = document.getElementById('add-patient');

  function applyFilterSort(items) {
    const q = (searchInput && searchInput.value || '').toLowerCase();
    let res = items;
    if (q) {
      res = res.filter((p) =>
        [p.nom, p.telephone, p.adresse].some((v) => String(v || '').toLowerCase().includes(q))
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
    const items = applyFilterSort(list(HL_PATIENTS));
    tbody.innerHTML = items
      .map(
        (p) =>
          `<tr>
            <td>${p.nom}</td>
            <td>${p.age}</td>
            <td>${p.sexe}</td>
            <td>${p.telephone}</td>
            <td>${p.adresse}</td>
            <td class="relative">
              <button class="kebab px-2 py-1" data-id="${p.id}" aria-label="Actions"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
              <div class="menu absolute right-0 mt-2 bg-white border rounded shadow hidden z-10">
                <button class="menu-view block w-full text-left px-3 py-2" data-id="${p.id}">Voir</button>
                <button class="menu-edit block w-full text-left px-3 py-2" data-id="${p.id}">Éditer</button>
                <button class="menu-del block w-full text-left px-3 py-2 text-red-600" data-id="${p.id}">Supprimer</button>
              </div>
            </td>
          </tr>`
      )
      .join('');
    if (window.lucide) lucide.createIcons();
  }

  function openAddModal() {
    Swal.fire({
      title: 'Ajouter un patient',
      html:
        '<div class="grid grid-cols-1 gap-2 text-left">' +
        '<label class="text-sm">Nom<input id="sw-nom" class="swal2-input"></label>' +
        '<label class="text-sm">Âge<input id="sw-age" class="swal2-input" type="number"></label>' +
        '<label class="text-sm">Sexe<select id="sw-sexe" class="swal2-select"><option value="">Sexe</option><option value="M">M</option><option value="F">F</option></select></label>' +
        '<label class="text-sm">Téléphone<input id="sw-tel" class="swal2-input"></label>' +
        '<label class="text-sm">Adresse<input id="sw-adr" class="swal2-input"></label>' +
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
        const age = Number(document.getElementById('sw-age').value);
        const sexe = document.getElementById('sw-sexe').value;
        const telephone = document.getElementById('sw-tel').value.trim();
        const adresse = document.getElementById('sw-adr').value.trim();
        if (!nom || !age || !sexe || !telephone || !adresse) {
          Swal.showValidationMessage('Veuillez remplir tous les champs');
          return false;
        }
        return { nom, age, sexe, telephone, adresse };
      },
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        create(HL_PATIENTS, res.value, 'pat');
        render();
        Swal.fire({ icon: 'success', title: 'Ajouté', text: 'Patient ajouté' });
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
      window.location.href = 'info.html?type=patients&id=' + encodeURIComponent(id);
      return;
    }
    if (t.classList.contains('menu-del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_PATIENTS, id);
      render();
      Swal.fire({ icon: 'success', title: 'Supprimé', text: 'Patient supprimé' });
      return;
    }
    if (t.classList.contains('menu-edit')) {
      const id = t.getAttribute('data-id');
      const items = list(HL_PATIENTS);
      const p = items.find((x) => x.id === id);
      if (!p) return;
      Swal.fire({
        title: 'Éditer patient',
        html:
          '<div class="space-y-2 text-left">' +
          `<input id="sw-nom" class="swal2-input" placeholder="Nom" value="${p.nom}">` +
          `<input id="sw-age" class="swal2-input" type="number" placeholder="Âge" value="${p.age}">` +
          `<select id="sw-sexe" class="swal2-select"><option value="">Sexe</option><option value="M"${p.sexe==='M'?' selected':''}>M</option><option value="F"${p.sexe==='F'?' selected':''}>F</option></select>` +
          `<input id="sw-tel" class="swal2-input" placeholder="Téléphone" value="${p.telephone}">` +
          `<input id="sw-adr" class="swal2-input" placeholder="Adresse" value="${p.adresse}">` +
          '</div>',
        focusConfirm: false,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'Sauvegarder',
        preConfirm: () => {
          const nom = document.getElementById('sw-nom').value.trim();
          const age = Number(document.getElementById('sw-age').value);
          const sexe = document.getElementById('sw-sexe').value;
          const telephone = document.getElementById('sw-tel').value.trim();
          const adresse = document.getElementById('sw-adr').value.trim();
          if (!nom || !age || !sexe || !telephone || !adresse) {
            Swal.showValidationMessage('Veuillez remplir tous les champs');
            return false;
          }
          return { nom, age, sexe, telephone, adresse };
        },
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          update(HL_PATIENTS, id, res.value);
          render();
          Swal.fire({ icon: 'success', title: 'Modifié', text: 'Patient mis à jour' });
        }
      });
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('patients.csv', list(HL_PATIENTS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  render();
});
