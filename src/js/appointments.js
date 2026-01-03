document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const form = document.getElementById('appt-form');
  const exportBtn = document.getElementById('export-appointments');
  const pSelect = document.getElementById('a-patient');
  const dSelect = document.getElementById('a-doctor');
  const sSelect = document.getElementById('a-status');
  const searchInput = document.getElementById('a-search');
  const sortField = document.getElementById('a-sort');
  const sortOrder = document.getElementById('a-order');

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
      res = res.filter((a) =>
        [patientName(a.patientId), doctorName(a.doctorId), a.date, a.time, a.status]
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
          if (field === 'date') return x.date;
          if (field === 'time') return x.time;
          if (field === 'status') return x.status;
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
    const items = applyFilterSort(list(HL_APPOINTMENTS));
    tbody.innerHTML = items
      .map(
        (a) =>
          `<tr>
            <td>${patientName(a.patientId)}</td>
            <td>${doctorName(a.doctorId)}</td>
            <td>${a.date}</td>
            <td>${a.time}</td>
            <td>${a.status}</td>
            <td>
              <button data-id="${a.id}" class="edit">Éditer</button>
              <button data-id="${a.id}" class="del">Supprimer</button>
            </td>
          </tr>`
      )
      .join('');
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const patientId = pSelect.value;
    const doctorId = dSelect.value;
    const date = document.getElementById('a-date').value;
    const time = document.getElementById('a-time').value;
    const status = sSelect.value;
    if (!patientId || !doctorId || !date || !time || !status) return;
    create(HL_APPOINTMENTS, { patientId, doctorId, date, time, status }, 'apt');
    form.reset();
    render();
  });

  tbody.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.classList.contains('del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_APPOINTMENTS, id);
      render();
    } else if (t.classList.contains('edit')) {
      const id = t.getAttribute('data-id');
      const items = list(HL_APPOINTMENTS);
      const a = items.find((x) => x.id === id);
      if (!a) return;
      const date = prompt('Date (YYYY-MM-DD)', a.date) || a.date;
      const time = prompt('Heure (HH:MM)', a.time) || a.time;
      const status = prompt('Statut', a.status) || a.status;
      update(HL_APPOINTMENTS, id, { date, time, status });
      render();
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('rendez-vous.csv', list(HL_APPOINTMENTS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);

  loadRefs();
  render();
});
