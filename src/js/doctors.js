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
            <td>
              <button data-id="${d.id}" class="edit">Éditer</button>
              <button data-id="${d.id}" class="del">Supprimer</button>
            </td>
          </tr>`
      )
      .join('');
  }

  function openAddModal() {
    const services = list(HL_SERVICES);
    const options = services.map((s) => `<option value="${s.id}">${s.nom}</option>`).join('');
    Swal.fire({
      title: 'Ajouter un médecin',
      html:
        '<div class="space-y-2 text-left">' +
        '<input id="sw-nom" class="swal2-input" placeholder="Nom">' +
        '<input id="sw-spec" class="swal2-input" placeholder="Spécialité">' +
        '<input id="sw-tel" class="swal2-input" placeholder="Téléphone">' +
        '<input id="sw-email" class="swal2-input" type="email" placeholder="Email">' +
        `<select id="sw-service" class="swal2-select"><option value="">Service</option>${options}</select>` +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Ajouter',
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
    if (t.classList.contains('del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_DOCTORS, id);
      render();
    } else if (t.classList.contains('edit')) {
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
