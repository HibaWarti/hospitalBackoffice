const HL_PATIENTS = 'hlspital_patients';
const HL_DOCTORS = 'hlspital_doctors';
const HL_SERVICES = 'hlspital_services';

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
  if (typeof faker !== 'undefined') {
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
          nom: faker.person.firstName(),
          age: faker.number.int({ min: 1, max: 90 }),
          sexe: sex,
          telephone: faker.phone.number(),
          adresse: faker.location.city(),
        });
      }
      while (doctors.length < targetDoctors) {
        const first = faker.person.firstName();
        const serviceId =
          serviceIds.length ? serviceIds[Math.floor(Math.random() * serviceIds.length)] : 'srv-1';
        doctors.push({
          id: gid('doc'),
          nom: `Dr. ${first}`,
          specialite: specialties[Math.floor(Math.random() * specialties.length)],
          telephone: faker.phone.number(),
          email: faker.internet.email({ firstName: first }),
          serviceId,
        });
      }
      localStorage.setItem(HL_PATIENTS, JSON.stringify(patients));
      localStorage.setItem(HL_DOCTORS, JSON.stringify(doctors));
    } catch (e) {
      // ignore faker errors to keep app functional
    }
  }
}
