document.addEventListener('DOMContentLoaded', () => {
  seedIfEmpty();
  const patients = list(HL_PATIENTS);
  const doctors = list(HL_DOCTORS);
  const services = list(HL_SERVICES);
  const appointments = list(HL_APPOINTMENTS);
  const prescriptions = list(HL_PRESCRIPTIONS);
  const cp = document.getElementById('count-patients');
  const cd = document.getElementById('count-doctors');
  const ca = document.getElementById('count-appointments');
  const cr = document.getElementById('count-prescriptions');
  const cs = document.getElementById('count-services');
  if (cp) cp.textContent = 'Patients: ' + patients.length;
  if (cd) cd.textContent = 'Médecins: ' + doctors.length;
  if (ca) ca.textContent = 'Rendez-vous: ' + appointments.length;
  if (cr) cr.textContent = 'Prescriptions: ' + prescriptions.length;
  if (cs) cs.textContent = 'Services: ' + services.length;
  const sexCounts = { M: 0, F: 0 };
  patients.forEach((p) => { if (p.sexe === 'M') sexCounts.M++; else if (p.sexe === 'F') sexCounts.F++; });
  const servicesById = {};
  services.forEach((s) => { servicesById[s.id] = s.nom; });
  const apptByService = {};
  appointments.forEach((a) => {
    const d = doctors.find((x) => x.id === a.doctorId);
    const sid = d ? d.serviceId : 'srv-unknown';
    const name = servicesById[sid] || 'Inconnu';
    apptByService[name] = (apptByService[name] || 0) + 1;
  });
  const apptByDay = {};
  appointments.forEach((a) => { apptByDay[a.date] = (apptByDay[a.date] || 0) + 1; });
  const sortedDays = Object.keys(apptByDay).sort();
  const specialtyCounts = {};
  doctors.forEach((d) => { specialtyCounts[d.specialite] = (specialtyCounts[d.specialite] || 0) + 1; });
  const statusCounts = {};
  appointments.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
  const c1 = document.getElementById('chart-patients-sex');
  if (c1 && Chart) {
    new Chart(c1, { type: 'pie', data: { labels: ['M', 'F'], datasets: [{ data: [sexCounts.M, sexCounts.F] }] } });
  }
  const c2 = document.getElementById('chart-appointments-service');
  if (c2 && Chart) {
    const labels = Object.keys(apptByService);
    const data = labels.map((k) => apptByService[k]);
    new Chart(c2, { type: 'bar', data: { labels, datasets: [{ data }] } });
  }
  const c3 = document.getElementById('chart-appointments-day');
  if (c3 && Chart) {
    const labels = sortedDays;
    const data = labels.map((k) => apptByDay[k]);
    new Chart(c3, { type: 'line', data: { labels, datasets: [{ data }] } });
  }
  const c4 = document.getElementById('chart-doctors-specialty');
  if (c4 && Chart) {
    const labels = Object.keys(specialtyCounts);
    const data = labels.map((k) => specialtyCounts[k]);
    new Chart(c4, { type: 'doughnut', data: { labels, datasets: [{ data }] } });
  }
  const c5 = document.getElementById('chart-appointments-status');
  if (c5 && Chart) {
    const labels = Object.keys(statusCounts);
    const data = labels.map((k) => statusCounts[k]);
    new Chart(c5, { type: 'bar', data: { labels, datasets: [{ data }] } });
  }
});

