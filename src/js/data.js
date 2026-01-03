const HL_PATIENTS = 'hlspital_patients';
const HL_DOCTORS = 'hlspital_doctors';
const HL_SERVICES = 'hlspital_services';
const HL_APPOINTMENTS = 'hlspital_appointments';
const HL_PRESCRIPTIONS = 'hlspital_prescriptions';

function seedIfEmpty() {
  if (!localStorage.getItem(HL_SERVICES)) {
    const services = [
      { id: 'srv-1', nom: 'Urgences', responsable: 'Dr. Karim', description: 'Soins immédiats' },
      { id: 'srv-2', nom: 'Cardiologie', responsable: 'Dr. Amina', description: 'Cœur et vaisseaux' },
      { id: 'srv-3', nom: 'Pédiatrie', responsable: 'Dr. Samir', description: 'Soins des enfants' },
    ];
    localStorage.setItem(HL_SERVICES, JSON.stringify(services));
  }
  if (!localStorage.getItem(HL_DOCTORS)) {
    const doctors = [
      { id: 'doc-1', nom: 'Dr. Ali', specialite: 'Urgentiste', telephone: '0600000001', email: 'ali@example.com', serviceId: 'srv-1' },
      { id: 'doc-2', nom: 'Dr. Noura', specialite: 'Cardiologue', telephone: '0600000002', email: 'noura@example.com', serviceId: 'srv-2' },
      { id: 'doc-3', nom: 'Dr. Yassine', specialite: 'Pédiatre', telephone: '0600000003', email: 'yassine@example.com', serviceId: 'srv-3' },
      { id: 'doc-4', nom: 'Dr. Hicham', specialite: 'Neurologue', telephone: '0600000004', email: 'hicham@example.com', serviceId: 'srv-1' },
      { id: 'doc-5', nom: 'Dr. Rania', specialite: 'Dermatologue', telephone: '0600000005', email: 'rania@example.com', serviceId: 'srv-3' },
      { id: 'doc-6', nom: 'Dr. Khalid', specialite: 'Radiologue', telephone: '0600000006', email: 'khalid@example.com', serviceId: 'srv-2' },
      { id: 'doc-7', nom: 'Dr. Salma', specialite: 'Anesthésiste', telephone: '0600000007', email: 'salma@example.com', serviceId: 'srv-1' },
      { id: 'doc-8', nom: 'Dr. Mehdi', specialite: 'Oncologue', telephone: '0600000008', email: 'mehdi@example.com', serviceId: 'srv-2' },
      { id: 'doc-9', nom: 'Dr. Aicha', specialite: 'Chirurgien', telephone: '0600000009', email: 'aicha@example.com', serviceId: 'srv-1' },
      { id: 'doc-10', nom: 'Dr. Reda', specialite: 'Endocrinologue', telephone: '0600000010', email: 'reda@example.com', serviceId: 'srv-2' },
      { id: 'doc-11', nom: 'Dr. Nouhaila', specialite: 'Gastro-entérologue', telephone: '0600000011', email: 'nouhaila@example.com', serviceId: 'srv-3' },
      { id: 'doc-12', nom: 'Dr. Anas', specialite: 'Néphrologue', telephone: '0600000012', email: 'anas@example.com', serviceId: 'srv-2' },
      { id: 'doc-13', nom: 'Dr. Soukaina', specialite: 'Ophtalmologue', telephone: '0600000013', email: 'soukaina@example.com', serviceId: 'srv-3' },
      { id: 'doc-14', nom: 'Dr. Hamza', specialite: 'Urgentiste', telephone: '0600000014', email: 'hamza@example.com', serviceId: 'srv-1' },
      { id: 'doc-15', nom: 'Dr. Ibtissam', specialite: 'Pédiatre', telephone: '0600000015', email: 'ibtissam@example.com', serviceId: 'srv-3' },
    ];
    localStorage.setItem(HL_DOCTORS, JSON.stringify(doctors));
  }
  if (!localStorage.getItem(HL_PATIENTS)) {
    const patients = [
      { id: 'pat-1', nom: 'Imane', age: 28, sexe: 'F', telephone: '0700000001', adresse: 'Rabat' },
      { id: 'pat-2', nom: 'Omar', age: 34, sexe: 'M', telephone: '0700000002', adresse: 'Casablanca' },
      { id: 'pat-3', nom: 'Sara', age: 22, sexe: 'F', telephone: '0700000003', adresse: 'Fès' },
      { id: 'pat-4', nom: 'Youssef', age: 30, sexe: 'M', telephone: '0700000004', adresse: 'Marrakech' },
      { id: 'pat-5', nom: 'Fatima', age: 45, sexe: 'F', telephone: '0700000005', adresse: 'Agadir' },
      { id: 'pat-6', nom: 'Hicham', age: 27, sexe: 'M', telephone: '0700000006', adresse: 'Tanger' },
      { id: 'pat-7', nom: 'Rania', age: 19, sexe: 'F', telephone: '0700000007', adresse: 'Oujda' },
      { id: 'pat-8', nom: 'Khalid', age: 52, sexe: 'M', telephone: '0700000008', adresse: 'Kenitra' },
      { id: 'pat-9', nom: 'Salma', age: 33, sexe: 'F', telephone: '0700000009', adresse: 'Rabat' },
      { id: 'pat-10', nom: 'Mehdi', age: 41, sexe: 'M', telephone: '0700000010', adresse: 'Casablanca' },
      { id: 'pat-11', nom: 'Aicha', age: 24, sexe: 'F', telephone: '0700000011', adresse: 'Fès' },
      { id: 'pat-12', nom: 'Reda', age: 36, sexe: 'M', telephone: '0700000012', adresse: 'Meknès' },
      { id: 'pat-13', nom: 'Nouhaila', age: 21, sexe: 'F', telephone: '0700000013', adresse: 'Tétouan' },
      { id: 'pat-14', nom: 'Anas', age: 29, sexe: 'M', telephone: '0700000014', adresse: 'Marrakech' },
      { id: 'pat-15', nom: 'Soukaina', age: 26, sexe: 'F', telephone: '0700000015', adresse: 'Agadir' },
      { id: 'pat-16', nom: 'Hamza', age: 38, sexe: 'M', telephone: '0700000016', adresse: 'Tanger' },
      { id: 'pat-17', nom: 'Ibtissam', age: 32, sexe: 'F', telephone: '0700000017', adresse: 'Oujda' },
      { id: 'pat-18', nom: 'Nabil', age: 40, sexe: 'M', telephone: '0700000018', adresse: 'Kenitra' },
      { id: 'pat-19', nom: 'Laila', age: 35, sexe: 'F', telephone: '0700000019', adresse: 'Rabat' },
      { id: 'pat-20', nom: 'Adil', age: 23, sexe: 'M', telephone: '0700000020', adresse: 'Casablanca' },
    ];
    localStorage.setItem(HL_PATIENTS, JSON.stringify(patients));
  }
  if (!localStorage.getItem(HL_APPOINTMENTS)) {
    const ps = JSON.parse(localStorage.getItem(HL_PATIENTS) || '[]');
    const ds = JSON.parse(localStorage.getItem(HL_DOCTORS) || '[]');
    const statuses = ['confirmé','annulé','en attente'];
    function gid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`; }
    const base = [];
    for (let i = 0; i < 10 && ps.length && ds.length; i++) {
      const p = ps[Math.floor(Math.random() * ps.length)].id;
      const d = ds[Math.floor(Math.random() * ds.length)].id;
      const day = new Date(Date.now() + Math.floor(Math.random() * 7) * 86400000);
      const date = day.toISOString().slice(0,10);
      const h = String(Math.floor(8 + Math.random() * 11)).padStart(2,'0');
      const m = String(Math.floor(Math.random() * 60)).padStart(2,'0');
      const time = `${h}:${m}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      base.push({ id: gid('apt'), patientId: p, doctorId: d, date, time, status });
    }
    localStorage.setItem(HL_APPOINTMENTS, JSON.stringify(base));
  }
  if (!localStorage.getItem(HL_PRESCRIPTIONS)) {
    const ps = JSON.parse(localStorage.getItem(HL_PATIENTS) || '[]');
    const ds = JSON.parse(localStorage.getItem(HL_DOCTORS) || '[]');
    function gid(prefix) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`; }
    const medsPool = ['Paracétamol','Ibuprofène','Amoxicilline','Oméprazole','Vitamine D','Aspirine','Metformine','Atorvastatine'];
    const base = [];
    for (let i = 0; i < 10 && ps.length && ds.length; i++) {
      const p = ps[Math.floor(Math.random() * ps.length)].id;
      const d = ds[Math.floor(Math.random() * ds.length)].id;
      const medsCount = Math.floor(1 + Math.random() * 3);
      const meds = Array.from({ length: medsCount }, () => medsPool[Math.floor(Math.random() * medsPool.length)]);
      const duration = `${Math.floor(3 + Math.random() * 12)} jours`;
      const notes = 'Suivi recommandé';
      base.push({ id: gid('rx'), patientId: p, doctorId: d, meds, duration, notes });
    }
    localStorage.setItem(HL_PRESCRIPTIONS, JSON.stringify(base));
  }
  const FX = (typeof window !== 'undefined' && window.faker) || (typeof globalThis !== 'undefined' && globalThis.faker);
  const F = FX && (FX.faker || FX);
  if (F) {
    try {
      const services = JSON.parse(localStorage.getItem(HL_SERVICES) || '[]');
      const serviceIds = services.map((s) => s.id);
      const patients = JSON.parse(localStorage.getItem(HL_PATIENTS) || '[]');
      const doctors = JSON.parse(localStorage.getItem(HL_DOCTORS) || '[]');
      const targetPatients = 100;
      const targetDoctors = 40;
      function gid(prefix) {
        return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      }
      const specialties = [
        'Urgentiste','Cardiologue','Pédiatre','Neurologue','Dermatologue',
        'Radiologue','Anesthésiste','Oncologue','Chirurgien','Endocrinologue',
        'Gastro-entérologue','Néphrologue','Ophtalmologue'
      ];
      while (patients.length < targetPatients) {
        const sex = Math.random() < 0.5 ? 'M' : 'F';
        patients.push({
          id: gid('pat'),
          nom: F.person.firstName(),
          age: F.number.int({ min: 1, max: 90 }),
          sexe: sex,
          telephone: F.phone.number(),
          adresse: F.location.city(),
        });
      }
      while (doctors.length < targetDoctors) {
        const first = F.person.firstName();
        const serviceId =
          serviceIds.length ? serviceIds[Math.floor(Math.random() * serviceIds.length)] : 'srv-1';
        doctors.push({
          id: gid('doc'),
          nom: `Dr. ${first}`,
          specialite: specialties[Math.floor(Math.random() * specialties.length)],
          telephone: F.phone.number(),
          email: F.internet.email({ firstName: first }),
          serviceId,
        });
      }
      localStorage.setItem(HL_PATIENTS, JSON.stringify(patients));
      localStorage.setItem(HL_DOCTORS, JSON.stringify(doctors));
      const appts = JSON.parse(localStorage.getItem(HL_APPOINTMENTS) || '[]');
      const statuses = ['confirmé','annulé','en attente'];
      while (appts.length < 80 && patients.length && doctors.length) {
        const p = patients[Math.floor(Math.random() * patients.length)].id;
        const d = doctors[Math.floor(Math.random() * doctors.length)].id;
        const date = F.date.soon({ days: 30 }).toISOString().slice(0,10);
        const time = String(F.number.int({ min: 8, max: 18 })).padStart(2,'0') + ':' + (F.number.int({ min: 0, max: 59 })).toString().padStart(2,'0');
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        appts.push({ id: `${'apt'}-${Date.now()}-${Math.floor(Math.random() * 100000)}`, patientId: p, doctorId: d, date, time, status });
      }
      localStorage.setItem(HL_APPOINTMENTS, JSON.stringify(appts));
      const rx = JSON.parse(localStorage.getItem(HL_PRESCRIPTIONS) || '[]');
      while (rx.length < 80 && patients.length && doctors.length) {
        const p = patients[Math.floor(Math.random() * patients.length)].id;
        const d = doctors[Math.floor(Math.random() * doctors.length)].id;
        const meds = [F.commerce.product(), F.commerce.product(), F.commerce.product()].slice(0, F.number.int({ min:1, max:3 }));
        const duration = `${F.number.int({ min: 3, max: 14 })} jours`;
        const notes = F.lorem.sentence();
        rx.push({ id: `${'rx'}-${Date.now()}-${Math.floor(Math.random() * 100000)}`, patientId: p, doctorId: d, meds, duration, notes });
      }
      localStorage.setItem(HL_PRESCRIPTIONS, JSON.stringify(rx));
    } catch (e) {
    }
  } else {
    const services = JSON.parse(localStorage.getItem(HL_SERVICES) || '[]');
    const serviceIds = services.map((s) => s.id);
    const patients = JSON.parse(localStorage.getItem(HL_PATIENTS) || '[]');
    const doctors = JSON.parse(localStorage.getItem(HL_DOCTORS) || '[]');
    const targetPatients = 100;
    const targetDoctors = 40;
    function gid(prefix) {
      return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    }
    const firstNames = ['Imane','Omar','Sara','Youssef','Fatima','Hicham','Rania','Khalid','Salma','Mehdi','Aicha','Reda','Nouhaila','Anas','Soukaina','Hamza','Ibtissam','Nabil','Laila','Adil','Karim','Amina','Samir','Yassine','Noura','Ali'];
    const cities = ['Rabat','Casablanca','Fès','Marrakech','Agadir','Tanger','Oujda','Kenitra','Meknès','Tétouan'];
    const specialties = [
      'Urgentiste','Cardiologue','Pédiatre','Neurologue','Dermatologue',
      'Radiologue','Anesthésiste','Oncologue','Chirurgien','Endocrinologue',
      'Gastro-entérologue','Néphrologue','Ophtalmologue'
    ];
    function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function phone() { return '07' + Math.floor(10000000 + Math.random() * 89999999); }
    function email(first) { return `${first.toLowerCase()}@example.com`; }
    while (patients.length < targetPatients) {
      const first = rand(firstNames);
      const sex = Math.random() < 0.5 ? 'M' : 'F';
      patients.push({
        id: gid('pat'),
        nom: first,
        age: Math.floor(1 + Math.random() * 90),
        sexe: sex,
        telephone: String(phone()),
        adresse: rand(cities),
      });
    }
    while (doctors.length < targetDoctors) {
      const first = rand(firstNames);
      const serviceId =
        serviceIds.length ? serviceIds[Math.floor(Math.random() * serviceIds.length)] : 'srv-1';
      doctors.push({
        id: gid('doc'),
        nom: `Dr. ${first}`,
        specialite: rand(specialties),
        telephone: String(phone()),
        email: email(first),
        serviceId,
      });
    }
    localStorage.setItem(HL_PATIENTS, JSON.stringify(patients));
    localStorage.setItem(HL_DOCTORS, JSON.stringify(doctors));
    const appts = JSON.parse(localStorage.getItem(HL_APPOINTMENTS) || '[]');
    const statuses = ['confirmé','annulé','en attente'];
    while (appts.length < 80 && patients.length && doctors.length) {
      const p = patients[Math.floor(Math.random() * patients.length)].id;
      const d = doctors[Math.floor(Math.random() * doctors.length)].id;
      const day = new Date(Date.now() + Math.floor(Math.random() * 30) * 86400000);
      const date = day.toISOString().slice(0,10);
      const h = String(Math.floor(8 + Math.random() * 11)).padStart(2,'0');
      const m = String(Math.floor(Math.random() * 60)).padStart(2,'0');
      const time = `${h}:${m}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      appts.push({ id: `${'apt'}-${Date.now()}-${Math.floor(Math.random() * 100000)}`, patientId: p, doctorId: d, date, time, status });
    }
    localStorage.setItem(HL_APPOINTMENTS, JSON.stringify(appts));
    const rx = JSON.parse(localStorage.getItem(HL_PRESCRIPTIONS) || '[]');
    const medsPool = ['Paracétamol','Ibuprofène','Amoxicilline','Oméprazole','Vitamine D','Aspirine','Metformine','Atorvastatine'];
    while (rx.length < 80 && patients.length && doctors.length) {
      const p = patients[Math.floor(Math.random() * patients.length)].id;
      const d = doctors[Math.floor(Math.random() * doctors.length)].id;
      const medsCount = Math.floor(1 + Math.random() * 3);
      const meds = Array.from({ length: medsCount }, () => rand(medsPool));
      const duration = `${Math.floor(3 + Math.random() * 12)} jours`;
      const notes = 'Suivi recommandé';
      rx.push({ id: `${'rx'}-${Date.now()}-${Math.floor(Math.random() * 100000)}`, patientId: p, doctorId: d, meds, duration, notes });
    }
    localStorage.setItem(HL_PRESCRIPTIONS, JSON.stringify(rx));
  }
}
