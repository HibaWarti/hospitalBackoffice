(() => {
const faker = {
  helpers: {
    arrayElement: (arr) => arr[Math.floor(Math.random() * arr.length)],
    arrayElements: (arr, config) => {
      const count = Math.floor(Math.random() * (config.max - config.min + 1)) + config.min;
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
  },
  number: {
    int: (config) => Math.floor(Math.random() * (config.max - config.min + 1)) + config.min,
  },
  person: {
    firstName: () => {
      const names = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ivan", "Julia", "Kevin", "Laura", "Michael", "Nina", "Oscar", "Paula", "Quinn", "Rachel", "Sam", "Tina", "Uma", "Victor", "Wendy", "Xander", "Yara", "Zack"];
      return names[Math.floor(Math.random() * names.length)];
    },
    lastName: () => {
      const names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
      return names[Math.floor(Math.random() * names.length)];
    },
  },
  lorem: {
    sentence: () => "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  },
  phone: {
    number: () => `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
  },
  internet: {
    email: () => `user${Math.floor(Math.random() * 10000)}@example.com`,
  },
  date: {
    birthdate: ({ min, max }) => {
      const year = new Date().getFullYear() - Math.floor(Math.random() * (max - min + 1) + min);
      const month = Math.floor(Math.random() * 12);
      const day = Math.floor(Math.random() * 28) + 1;
      return new Date(year, month, day);
    },
    past: ({ years }) => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - Math.floor(Math.random() * years));
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 12));
      return date;
    },
    between: ({ from, to }) => {
      return new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));
    },
  },
  location: {
    streetAddress: () => `${Math.floor(Math.random() * 9999) + 1} Main St`,
  },
};

const STORAGE_KEYS = {
  patients: "hospital_patients",
  doctors: "hospital_doctors",
  services: "hospital_services",
  appointments: "hospital_appointments",
  prescriptions: "hospital_prescriptions",
};

const SPECIALTIES = [
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Dermatology",
  "General Medicine",
  "Surgery",
  "Oncology",
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const SERVICE_NAMES = [
  "Emergency",
  "Cardiology",
  "Neurology",
  "Pediatrics",
  "Orthopedics",
  "Radiology",
  "Laboratory",
  "Pharmacy",
];

function generateServices() {
  return SERVICE_NAMES.map((name, index) => ({
    id: `service-${index + 1}`,
    name,
    description: faker.lorem.sentence(),
    headDoctorId: undefined,
  }));
}

function generateDoctors(services) {
  return Array.from({ length: 50 }, (_, index) => ({
    id: `doctor-${index + 1}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    specialty: faker.helpers.arrayElement(SPECIALTIES),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    serviceId: faker.helpers.arrayElement(services).id,
  }));
}

function generatePatients(services) {
  return Array.from({ length: 200 }, (_, index) => ({
    id: `patient-${index + 1}`,
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    dateOfBirth: faker.date.birthdate({ min: 1, max: 90 }).toISOString().split("T")[0],
    gender: faker.helpers.arrayElement(["male", "female"]),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    email: faker.internet.email(),
    bloodGroup: faker.helpers.arrayElement(BLOOD_GROUPS),
    registrationDate: faker.date.past({ years: 2 }).toISOString().split("T")[0],
    serviceId: faker.helpers.arrayElement(services).id,
  }));
}

function generateAppointments(patients, doctors, services) {
  const statuses = ["scheduled", "cancelled", "completed"];

  return Array.from({ length: 500 }, (_, index) => {
    const date = faker.date.between({
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return {
      id: `appointment-${index + 1}`,
      date: date.toISOString().split("T")[0],
      time: `${faker.number.int({ min: 8, max: 17 })}:${faker.helpers.arrayElement(["00", "30"])}`,
      patientId: faker.helpers.arrayElement(patients).id,
      doctorId: faker.helpers.arrayElement(doctors).id,
      serviceId: faker.helpers.arrayElement(services).id,
      status: faker.helpers.arrayElement(statuses),
    };
  });
}

function generatePrescriptions(patients, doctors) {
  const medications = [
    "Paracetamol",
    "Ibuprofen",
    "Amoxicillin",
    "Omeprazole",
    "Metformin",
    "Lisinopril",
    "Amlodipine",
    "Metoprolol",
  ];

  return Array.from({ length: 200 }, (_, index) => ({
    id: `prescription-${index + 1}`,
    patientId: faker.helpers.arrayElement(patients).id,
    doctorId: faker.helpers.arrayElement(doctors).id,
    medications: faker.helpers.arrayElements(medications, { min: 1, max: 3 }).join(", "),
    dosage: `${faker.number.int({ min: 1, max: 3 })} times daily`,
    duration: `${faker.number.int({ min: 5, max: 30 })} days`,
    prescriptionDate: faker.date.past({ years: 1 }).toISOString().split("T")[0],
  }));
}

function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.services)) {
    const services = generateServices();
    localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));

    const doctors = generateDoctors(services);
    // Assign head doctors to services
    services.forEach((service, index) => {
      if (doctors[index]) {
        service.headDoctorId = doctors[index].id;
      }
    });
    localStorage.setItem(STORAGE_KEYS.services, JSON.stringify(services));
    localStorage.setItem(STORAGE_KEYS.doctors, JSON.stringify(doctors));

    const patients = generatePatients(services);
    localStorage.setItem(STORAGE_KEYS.patients, JSON.stringify(patients));

    const appointments = generateAppointments(patients, doctors, services);
    localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments));

    const prescriptions = generatePrescriptions(patients, doctors);
    localStorage.setItem(STORAGE_KEYS.prescriptions, JSON.stringify(prescriptions));
  }
}

initializeData();

// Generic CRUD operations
function getItems(key) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems(key, items) {
  localStorage.setItem(key, JSON.stringify(items));
}

function addItem(key, item) {
  const items = getItems(key);
  const newItem = { ...item, id: `${key}-${Date.now()}` };
  items.push(newItem);
  setItems(key, items);
  return newItem;
}

function updateItem(key, id, updates) {
  const items = getItems(key);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setItems(key, items);
  return items[index];
}

function deleteItem(key, id) {
  const items = getItems(key);
  const filteredItems = items.filter((item) => item.id !== id);
  if (filteredItems.length === items.length) return false;
  setItems(key, filteredItems);
  return true;
}

function getPatients() { return getItems(STORAGE_KEYS.patients); }
function getPatient(id) { return getPatients().find((p) => p.id === id); }
function addPatient(patient) { return addItem(STORAGE_KEYS.patients, patient); }
function updatePatient(id, updates) { return updateItem(STORAGE_KEYS.patients, id, updates); }
function deletePatient(id) { return deleteItem(STORAGE_KEYS.patients, id); }

function getDoctors() { return getItems(STORAGE_KEYS.doctors); }
function getDoctor(id) { return getDoctors().find((d) => d.id === id); }
function addDoctor(doctor) { return addItem(STORAGE_KEYS.doctors, doctor); }
function updateDoctor(id, updates) { return updateItem(STORAGE_KEYS.doctors, id, updates); }
function deleteDoctor(id) { return deleteItem(STORAGE_KEYS.doctors, id); }

function getServices() { return getItems(STORAGE_KEYS.services); }
function getService(id) { return getServices().find((s) => s.id === id); }
function addService(service) { return addItem(STORAGE_KEYS.services, service); }
function updateService(id, updates) { return updateItem(STORAGE_KEYS.services, id, updates); }
function deleteService(id) { return deleteItem(STORAGE_KEYS.services, id); }

function getAppointments() { return getItems(STORAGE_KEYS.appointments); }
function getAppointment(id) { return getAppointments().find((a) => a.id === id); }
function addAppointment(appointment) { return addItem(STORAGE_KEYS.appointments, appointment); }
function updateAppointment(id, updates) { return updateItem(STORAGE_KEYS.appointments, id, updates); }
function deleteAppointment(id) { return deleteItem(STORAGE_KEYS.appointments, id); }

function getPrescriptions() { return getItems(STORAGE_KEYS.prescriptions); }
function getPrescription(id) { return getPrescriptions().find((p) => p.id === id); }
function addPrescription(prescription) { return addItem(STORAGE_KEYS.prescriptions, prescription); }
function updatePrescription(id, updates) { return updateItem(STORAGE_KEYS.prescriptions, id, updates); }
function deletePrescription(id) { return deleteItem(STORAGE_KEYS.prescriptions, id); }

function resetData() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  initializeData();
  window.location.reload();
}
window.App = window.App || {};
App.Services = App.Services || {};
App.Services.Data = {
  getPatients, getPatient, addPatient, updatePatient, deletePatient,
  getDoctors, getDoctor, addDoctor, updateDoctor, deleteDoctor,
  getServices, getService, addService, updateService, deleteService,
  getAppointments, getAppointment, addAppointment, updateAppointment, deleteAppointment,
  getPrescriptions, getPrescription, addPrescription, updatePrescription, deletePrescription,
  resetData
};
})();
