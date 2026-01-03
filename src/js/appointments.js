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

  function render() {
    const items = list(HL_APPOINTMENTS);
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

  loadRefs();
  render();
});
