document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const form = document.getElementById('patient-form');
  const exportBtn = document.getElementById('export-patients');
  const searchInput = document.getElementById('p-search');
  const sortField = document.getElementById('p-sort');
  const sortOrder = document.getElementById('p-order');

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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('p-nom').value.trim();
    const age = Number(document.getElementById('p-age').value);
    const sexe = document.getElementById('p-sexe').value;
    const telephone = document.getElementById('p-tel').value.trim();
    const adresse = document.getElementById('p-adr').value.trim();
    if (!nom || !age || !sexe || !telephone || !adresse) return;
    create(HL_PATIENTS, { nom, age, sexe, telephone, adresse }, 'pat');
    form.reset();
    render();
  });

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
      const nom = prompt('Nom', p.nom) || p.nom;
      const age = Number(prompt('Âge', String(p.age)) || p.age);
      const sexe = prompt('Sexe (M/F)', p.sexe) || p.sexe;
      const telephone = prompt('Téléphone', p.telephone) || p.telephone;
      const adresse = prompt('Adresse', p.adresse) || p.adresse;
      update(HL_PATIENTS, id, { nom, age, sexe, telephone, adresse });
      render();
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('patients.csv', list(HL_PATIENTS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);

  render();
});
