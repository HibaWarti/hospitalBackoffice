document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  mountNav();
  seedIfEmpty();
  const tbody = document.querySelector('tbody');
  const exportBtn = document.getElementById('export-appointments');
  const searchInput = document.getElementById('a-search');
  const sortField = document.getElementById('a-sort');
  const sortOrder = document.getElementById('a-order');
  const addBtn = document.getElementById('add-appointment');

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
            <td class="relative">
              <button class="kebab px-2 py-1" data-id="${a.id}" aria-label="Actions"><i data-lucide="more-vertical" class="w-4 h-4"></i></button>
              <div class="menu absolute right-0 mt-2 bg-white border rounded shadow hidden z-10">
                <button class="menu-view block w-full text-left px-3 py-2" data-id="${a.id}">Voir</button>
                <button class="menu-edit block w-full text-left px-3 py-2" data-id="${a.id}">Éditer</button>
                <button class="menu-del block w-full text-left px-3 py-2 text-red-600" data-id="${a.id}">Supprimer</button>
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
      title: 'Ajouter un rendez-vous',
      html:
        '<div class="grid grid-cols-1 gap-2 text-left">' +
        `<label class="text-sm">Patient<select id="sw-p" class="swal2-select"><option value="">Patient</option>${pOptions}</select></label>` +
        `<label class="text-sm">Médecin<select id="sw-d" class="swal2-select"><option value="">Médecin</option>${dOptions}</select></label>` +
        '<label class="text-sm">Date<input id="sw-date" class="swal2-input" type="date"></label>' +
        '<label class="text-sm">Heure<input id="sw-time" class="swal2-input" type="time"></label>' +
        '<label class="text-sm">Statut<select id="sw-status" class="swal2-select"><option value="">Statut</option><option value="confirmé">confirmé</option><option value="annulé">annulé</option><option value="en attente">en attente</option></select></label>' +
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
        const date = document.getElementById('sw-date').value;
        const time = document.getElementById('sw-time').value;
        const status = document.getElementById('sw-status').value;
        if (!patientId || !doctorId || !date || !time || !status) {
          Swal.showValidationMessage('Veuillez remplir tous les champs');
          return false;
        }
        return { patientId, doctorId, date, time, status };
      },
    }).then((res) => {
      if (res.isConfirmed && res.value) {
        create(HL_APPOINTMENTS, res.value, 'apt');
        render();
        Swal.fire({ icon: 'success', title: 'Ajouté', text: 'Rendez-vous ajouté' });
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
      window.location.href = 'info.html?type=appointments&id=' + encodeURIComponent(id);
      return;
    }
    if (t.classList.contains('menu-del')) {
      const id = t.getAttribute('data-id');
      removeItem(HL_APPOINTMENTS, id);
      render();
      Swal.fire({ icon: 'success', title: 'Supprimé', text: 'Rendez-vous supprimé' });
    } else if (t.classList.contains('menu-edit')) {
      const id = t.getAttribute('data-id');
      const items = list(HL_APPOINTMENTS);
      const a = items.find((x) => x.id === id);
      if (!a) return;
      Swal.fire({
        title: 'Éditer rendez-vous',
        html:
          '<div class="space-y-2 text-left">' +
          `<input id="sw-date" class="swal2-input" type="date" value="${a.date}">` +
          `<input id="sw-time" class="swal2-input" type="time" value="${a.time}">` +
          `<select id="sw-status" class="swal2-select"><option value="">Statut</option><option value="confirmé"${a.status==='confirmé'?' selected':''}>confirmé</option><option value="annulé"${a.status==='annulé'?' selected':''}>annulé</option><option value="en attente"${a.status==='en attente'?' selected':''}>en attente</option></select>` +
          '</div>',
        focusConfirm: false,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'Sauvegarder',
        preConfirm: () => {
          const date = document.getElementById('sw-date').value;
          const time = document.getElementById('sw-time').value;
          const status = document.getElementById('sw-status').value;
          if (!date || !time || !status) {
            Swal.showValidationMessage('Veuillez remplir tous les champs');
            return false;
          }
          return { date, time, status };
        },
      }).then((res) => {
        if (res.isConfirmed && res.value) {
          update(HL_APPOINTMENTS, id, res.value);
          render();
          Swal.fire({ icon: 'success', title: 'Modifié', text: 'Rendez-vous mis à jour' });
        }
      });
    }
  });

  exportBtn.addEventListener('click', () => {
    downloadCSV('rendez-vous.csv', list(HL_APPOINTMENTS));
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (sortField) sortField.addEventListener('change', render);
  if (sortOrder) sortOrder.addEventListener('change', render);
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  render();
});
