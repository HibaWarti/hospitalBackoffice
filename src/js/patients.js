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
            <td>
              <button data-id="${p.id}" class="edit">Éditer</button>
              <button data-id="${p.id}" class="del">Supprimer</button>
            </td>
          </tr>`
      )
      .join('');
  }

  function openAddModal() {
    Swal.fire({
      title: 'Ajouter un patient',
      html:
        '<div class="space-y-2 text-left">' +
        '<input id="sw-nom" class="swal2-input" placeholder="Nom">' +
        '<input id="sw-age" class="swal2-input" type="number" placeholder="Âge">' +
        '<select id="sw-sexe" class="swal2-select"><option value="">Sexe</option><option value="M">M</option><option value="F">F</option></select>' +
        '<input id="sw-tel" class="swal2-input" placeholder="Téléphone">' +
        '<input id="sw-adr" class="swal2-input" placeholder="Adresse">' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Ajouter',
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
    if (t.classList.contains('del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_PATIENTS, id);
      render();
    } else if (t.classList.contains('edit')) {
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
