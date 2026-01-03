document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const exportBtn = document.getElementById('export-prescriptions');
  const searchInput = document.getElementById('r-search');
  const sortField = document.getElementById('r-sort');
  const sortOrder = document.getElementById('r-order');
  const addBtn = document.getElementById('add-prescription');

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

  function openAddModal() {
    const patients = list(HL_PATIENTS);
    const doctors = list(HL_DOCTORS);
    const pOptions = patients.map((p) => `<option value="${p.id}">${p.nom}</option>`).join('');
    const dOptions = doctors.map((d) => `<option value="${d.id}">${d.nom}</option>`).join('');
    Swal.fire({
      title: 'Ajouter une prescription',
      html:
        '<div class="space-y-2 text-left">' +
        `<select id="sw-p" class="swal2-select"><option value="">Patient</option>${pOptions}</select>` +
        `<select id="sw-d" class="swal2-select"><option value="">Médecin</option>${dOptions}</select>` +
        '<input id="sw-meds" class="swal2-input" placeholder="Médicaments (séparés par ,)">' +
        '<input id="sw-duration" class="swal2-input" placeholder="Durée du traitement">' +
        '<input id="sw-notes" class="swal2-input" placeholder="Notes médicales">' +
        '</div>',
      focusConfirm: false,
      showCancelButton: true,
      showCloseButton: true,
      confirmButtonText: 'Ajouter',
      preConfirm: () => {
        const patientId = document.getElementById('sw-p').value;
        const doctorId = document.getElementById('sw-d').value;
        const meds = (document.getElementById('sw-meds').value || '').split(',').map((s) => s.trim()).filter(Boolean);
        const duration = document.getElementById('sw-duration').value.trim();
        const notes = document.getElementById('sw-notes').value.trim();
        if (!patientId || !doctorId || !meds.length || !duration) {
          Swal.showValidationMessage('Veuillez remplir patient, médecin, médicaments et durée');
          return false;
        }
        return { patientId, doctorId, meds, duration, notes };
      },
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        create(HL_PRESCRIPTIONS, res.value, 'rx');
        render();
        Swal.fire({ icon: 'success', title: 'Ajouté', text: 'Prescription ajoutée' });
      }
    });
  }

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
      Swal.fire({
        title: 'Éditer prescription',
        html:
          '<div class="space-y-2 text-left">' +
          `<input id="sw-meds" class="swal2-input" placeholder="Médicaments (séparés par ,)" value="${Array.isArray(r.meds) ? r.meds.join(', ') : r.meds}">` +
          `<input id="sw-duration" class="swal2-input" placeholder="Durée du traitement" value="${r.duration}">` +
          `<input id="sw-notes" class="swal2-input" placeholder="Notes médicales" value="${r.notes || ''}">` +
          '</div>',
        focusConfirm: false,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'Sauvegarder',
        preConfirm: () => {
          const meds = (document.getElementById('sw-meds').value || '').split(',').map((s) => s.trim()).filter(Boolean);
          const duration = document.getElementById('sw-duration').value.trim();
          const notes = document.getElementById('sw-notes').value.trim();
          if (!meds.length || !duration) {
            Swal.showValidationMessage('Veuillez remplir médicaments et durée');
            return false;
          }
          return { meds, duration, notes };
        },
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          update(HL_PRESCRIPTIONS, id, res.value);
          render();
          Swal.fire({ icon: 'success', title: 'Modifié', text: 'Prescription mise à jour' });
        }
      });
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('prescriptions.csv', list(HL_PRESCRIPTIONS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  render();
});
