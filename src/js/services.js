document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const form = document.getElementById('service-form');
  const exportBtn = document.getElementById('export-services');
  const searchInput = document.getElementById('s-search');
  const sortField = document.getElementById('s-sort');
  const sortOrder = document.getElementById('s-order');

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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('s-nom').value.trim();
    const responsable = document.getElementById('s-resp').value.trim();
    const description = document.getElementById('s-desc').value.trim();
    if (!nom || !responsable || !description) return;
    create(HL_SERVICES, { nom, responsable, description }, 'srv');
    form.reset();
    render();
  });

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
      const nom = prompt('Nom du service', s.nom) || s.nom;
      const responsable = prompt('Responsable', s.responsable) || s.responsable;
      const description = prompt('Description', s.description) || s.description;
      update(HL_SERVICES, id, { nom, responsable, description });
      render();
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('services.csv', list(HL_SERVICES));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);

  render();
});
