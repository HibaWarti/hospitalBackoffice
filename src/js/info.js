document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const type = params.get('type') || '';
  const id = params.get('id') || '';
  const card = document.getElementById('detail-card');
  function findItem() {
    if (!type || !id) return null;
    let key = null;
    if (type === 'patients') key = HL_PATIENTS;
    else if (type === 'doctors') key = HL_DOCTORS;
    else if (type === 'services') key = HL_SERVICES;
    else if (type === 'appointments') key = HL_APPOINTMENTS;
    else if (type === 'prescriptions') key = HL_PRESCRIPTIONS;
    if (!key) return null;
    const items = list(key);
    return items.find((x) => x.id === id) || null;
  }
  function patientName(pid) {
    const p = list(HL_PATIENTS).find((x) => x.id === pid);
    return p ? p.nom : pid;
  }
  function doctorName(did) {
    const d = list(HL_DOCTORS).find((x) => x.id === did);
    return d ? d.nom : did;
  }
  function serviceName(sid) {
    const s = list(HL_SERVICES).find((x) => x.id === sid);
    return s ? s.nom : sid;
  }
  function render() {
    const item = findItem();
    if (!item) {
      card.innerHTML = '<p class="text-gray-600">Élément introuvable.</p>';
      return;
    }
    if (type === 'patients') {
      card.innerHTML =
        '<div class="space-y-2">' +
        `<div><span class="font-medium">Nom:</span> ${item.nom}</div>` +
        `<div><span class="font-medium">Âge:</span> ${item.age}</div>` +
        `<div><span class="font-medium">Sexe:</span> ${item.sexe}</div>` +
        `<div><span class="font-medium">Téléphone:</span> ${item.telephone}</div>` +
        `<div><span class="font-medium">Adresse:</span> ${item.adresse}</div>` +
        '</div>';
    } else if (type === 'doctors') {
      card.innerHTML =
        '<div class="space-y-2">' +
        `<div><span class="font-medium">Nom:</span> ${item.nom}</div>` +
        `<div><span class="font-medium">Spécialité:</span> ${item.specialite}</div>` +
        `<div><span class="font-medium">Téléphone:</span> ${item.telephone}</div>` +
        `<div><span class="font-medium">Email:</span> ${item.email}</div>` +
        `<div><span class="font-medium">Service:</span> ${serviceName(item.serviceId)}</div>` +
        '</div>';
    } else if (type === 'services') {
      card.innerHTML =
        '<div class="space-y-2">' +
        `<div><span class="font-medium">Nom:</span> ${item.nom}</div>` +
        `<div><span class="font-medium">Responsable:</span> ${item.responsable}</div>` +
        `<div><span class="font-medium">Description:</span> ${item.description}</div>` +
        '</div>';
    } else if (type === 'appointments') {
      card.innerHTML =
        '<div class="space-y-2">' +
        `<div><span class="font-medium">Patient:</span> ${patientName(item.patientId)}</div>` +
        `<div><span class="font-medium">Médecin:</span> ${doctorName(item.doctorId)}</div>` +
        `<div><span class="font-medium">Date:</span> ${item.date}</div>` +
        `<div><span class="font-medium">Heure:</span> ${item.time}</div>` +
        `<div><span class="font-medium">Statut:</span> ${item.status}</div>` +
        '</div>';
    } else if (type === 'prescriptions') {
      const meds = Array.isArray(item.meds) ? item.meds.join(', ') : item.meds;
      card.innerHTML =
        '<div class="space-y-2">' +
        `<div><span class="font-medium">Patient:</span> ${patientName(item.patientId)}</div>` +
        `<div><span class="font-medium">Médecin:</span> ${doctorName(item.doctorId)}</div>` +
        `<div><span class="font-medium">Médicaments:</span> ${meds}</div>` +
        `<div><span class="font-medium">Durée:</span> ${item.duration}</div>` +
        `<div><span class="font-medium">Notes:</span> ${item.notes || ''}</div>` +
        '</div>';
    }
  }
  render();
});
