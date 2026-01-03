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
            <td class="relative">
              <button class="kebab px-2 py-1" data-id="${r.id}" aria-label="Actions"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
              <div class="menu absolute right-0 mt-2 bg-white border rounded shadow hidden z-10">
                <button class="menu-view block w-full text-left px-3 py-2" data-id="${r.id}">Voir</button>
                <button class="menu-edit block w-full text-left px-3 py-2" data-id="${r.id}">Éditer</button>
                <button class="menu-del block w-full text-left px-3 py-2 text-red-600" data-id="${r.id}">Supprimer</button>
              </div>
            </td>
          </tr>`
      )
      .join('');
    if (window.lucide) lucide.createIcons();
  }

  function openAddModal() {
    const patients = list(HL_PATIENTS);
    const doctors = list(HL_DOCTORS);
    const pOptions = patients.map((p) => `<option value="${p.id}">${p.nom}</option>`).join('');
    const dOptions = doctors.map((d) => `<option value="${d.id}">${d.nom}</option>`).join('');
    Swal.fire({
      title: 'Ajouter une prescription',
      html:
        '<div class="grid grid-cols-1 gap-2 text-left">' +
        `<label class="text-sm">Patient<select id="sw-p" class="swal2-select"><option value="">Patient</option>${pOptions}</select></label>` +
        `<label class="text-sm">Médecin<select id="sw-d" class="swal2-select"><option value="">Médecin</option>${dOptions}</select></label>` +
        '<label class="text-sm">Médicaments<input id="sw-meds" class="swal2-input" placeholder="Séparés par ,"></label>' +
        '<label class="text-sm">Durée<input id="sw-duration" class="swal2-input" placeholder="Durée du traitement"></label>' +
        '<label class="text-sm">Notes<input id="sw-notes" class="swal2-input" placeholder="Notes médicales"></label>' +
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
      window.location.href = 'info.html?type=prescriptions&id=' + encodeURIComponent(id);
      return;
    }
    if (t.classList.contains('menu-del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_PRESCRIPTIONS, id);
      render();
      Swal.fire({ icon: 'success', title: 'Supprimé', text: 'Prescription supprimée' });
    } else if (t.classList.contains('menu-edit')) {
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
