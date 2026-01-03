document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const form = document.getElementById('rx-form');
  const exportBtn = document.getElementById('export-prescriptions');
  const pSelect = document.getElementById('r-patient');
  const dSelect = document.getElementById('r-doctor');
  const searchInput = document.getElementById('r-search');
  const sortField = document.getElementById('r-sort');
  const sortOrder = document.getElementById('r-order');

  function loadRefs() {
    const patients = list(HL_PATIENTS);
    const doctors = list(HL_DOCTORS);
    pSelect.innerHTML =
      '<option value="">Patient</option>' +
      patients.map((p) => `<option value="${p.id}">${p.nom}</option>`).join('');
    dSelect.innerHTML =
      '<option value="">Médecin</option>' +
      doctors.map((d) => `<option value="${d.id}">${d.nom}</option>`).join('');
  }

  function patientName(id) {
    const p = list(HL_PATIENTS).find((x) => x.id === id);
    return p ? p.nom : '';
  }
  function doctorName(id) {
    const d = list(HL_DOCTORS).find((x) => x.id === id);
    return d ? d.nom : '';
  }

  function applyFilterSort(items) {
    const q = (searchInput && searchInput.value || '').toLowerCase();
    let res = items;
    if (q) {
      res = res.filter((r) =>
        [patientName(r.patientId), doctorName(r.doctorId), Array.isArray(r.meds) ? r.meds.join(', ') : r.meds, r.duration, r.notes || '']
          .some((v) => String(v || '').toLowerCase().includes(q))
      );
    }
    const field = sortField && sortField.value;
    const order = (sortOrder && sortOrder.value) === 'desc' ? -1 : 1;
    if (field) {
      res = res.slice().sort((a, b) => {
        function val(x) {
          if (field === 'patient') return patientName(x.patientId);
          if (field === 'doctor') return doctorName(x.doctorId);
          if (field === 'duration') return x.duration;
          return '';
        }
        const va = val(a);
        const vb = val(b);
        if (va < vb) return -1 * order;
        if (va > vb) return 1 * order;
        return 0;
      });
    }
    return res;
  }

  function render() {
    const items = applyFilterSort(list(HL_PRESCRIPTIONS));
    tbody.innerHTML = items
      .map(
        (r) =>
          `<tr>
            <td>${patientName(r.patientId)}</td>
            <td>${doctorName(r.doctorId)}</td>
            <td>${Array.isArray(r.meds) ? r.meds.join(', ') : r.meds}</td>
            <td>${r.duration}</td>
            <td>${r.notes || ''}</td>
            <td>
              <button data-id="${r.id}" class="edit">Éditer</button>
              <button data-id="${r.id}" class="del">Supprimer</button>
            </td>
          </tr>`
      )
      .join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const patientId = pSelect.value;
    const doctorId = dSelect.value;
    const meds = document.getElementById('r-meds').value.split(',').map((s) => s.trim()).filter(Boolean);
    const duration = document.getElementById('r-duration').value.trim();
    const notes = document.getElementById('r-notes').value.trim();
    if (!patientId || !doctorId || !meds.length || !duration) return;
    create(HL_PRESCRIPTIONS, { patientId, doctorId, meds, duration, notes }, 'rx');
    form.reset();
    render();
  });

  tbody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains('del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_PRESCRIPTIONS, id);
      render();
    } else if (t.classList.contains('edit')) {
      const id = t.getAttribute('data-id');
      const items = list(HL_PRESCRIPTIONS);
      const r = items.find((x) => x.id === id);
      if (!r) return;
      const meds = (prompt('Médicaments (séparés par ,)', (Array.isArray(r.meds) ? r.meds.join(', ') : r.meds)) || '').split(',').map((s) => s.trim()).filter(Boolean);
      const duration = prompt('Durée du traitement', r.duration) || r.duration;
      const notes = prompt('Notes médicales', r.notes || '') || r.notes || '';
      update(HL_PRESCRIPTIONS, id, { meds, duration, notes });
      render();
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('prescriptions.csv', list(HL_PRESCRIPTIONS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);

  loadRefs();
  render();
});
