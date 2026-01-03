document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const form = document.getElementById('doctor-form');
  const exportBtn = document.getElementById('export-doctors');
  const serviceSelect = document.getElementById('d-service');
  const searchInput = document.getElementById('d-search');
  const sortField = document.getElementById('d-sort');
  const sortOrder = document.getElementById('d-order');

  function loadServices() {
    const services = list(HL_SERVICES);
    serviceSelect.innerHTML =
      '<option value="">Service</option>' +
      services.map((s) => `<option value="${s.id}">${s.nom}</option>`).join('');
  }

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

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nom = document.getElementById('d-nom').value.trim();
    const specialite = document.getElementById('d-spec').value.trim();
    const telephone = document.getElementById('d-tel').value.trim();
    const email = document.getElementById('d-email').value.trim();
    const serviceId = document.getElementById('d-service').value;
    if (!nom || !specialite || !telephone || !email || !serviceId) return;
    create(HL_DOCTORS, { nom, specialite, telephone, email, serviceId }, 'doc');
    form.reset();
    render();
  });

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
      const nom = prompt('Nom', d.nom) || d.nom;
      const specialite = prompt('Spécialité', d.specialite) || d.specialite;
      const telephone = prompt('Téléphone', d.telephone) || d.telephone;
      const email = prompt('Email', d.email) || d.email;
      const serviceId = prompt('Service ID', d.serviceId) || d.serviceId;
      update(HL_DOCTORS, id, { nom, specialite, telephone, email, serviceId });
      render();
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('medecins.csv', list(HL_DOCTORS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);

  loadServices();
  render();
});
