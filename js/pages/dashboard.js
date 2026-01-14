(() => {
function getPatients() { return App.Services.Data.getPatients(); }
function getDoctors() { return App.Services.Data.getDoctors(); }
function getServices() { return App.Services.Data.getServices(); }
function getAppointments() { return App.Services.Data.getAppointments(); }
function getPrescriptions() { return App.Services.Data.getPrescriptions(); }

 function t(key) { return App.Services.I18n.t(key); }
 function exportToPDF(data, filename, title, columns) { return App.Services.Utils.exportToPDF(data, filename, title, columns); }

 const dashboardCharts = {
  patientsByService: null,
  appointmentsByDay: null,
  appointmentsEvolution: null,
  appointmentsByStatus: null,
  doctorsBySpecialty: null,
 };

 function destroyCharts() {
  Object.keys(dashboardCharts).forEach((k) => {
   const chart = dashboardCharts[k];
   if (chart && typeof chart.destroy === "function") {
    chart.destroy();
   }
   dashboardCharts[k] = null;
  });
 }

function buildDashboardData({ patients, doctors, services, appointments, prescriptions }) {
  const stats = [
    { key: t("totalPatients"), value: patients.length, color: "bg-primary", icon: "users" },
    { key: t("totalDoctors"), value: doctors.length, color: "bg-accent", icon: "user-round" },
    { key: t("totalAppointments"), value: appointments.length, color: "bg-success", icon: "calendar" },
    { key: t("totalServices"), value: services.length, color: "bg-warning", icon: "building" },
    { key: t("totalPrescriptions"), value: prescriptions.length, color: "bg-info", icon: "file-text" },
  ];

  const patientsByService = services.map((service) => ({
    name: service.name,
    count: patients.filter((p) => p.serviceId === service.id).length,
  }));

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const appointmentsByDay = days.map((_, index) => {
    return appointments.filter((a) => {
      const date = new Date(a.date);
      return date.getDay() === (index === 6 ? 0 : index + 1);
    }).length;
  });

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const appointmentsEvolution = last7Days.map(
    (day) => appointments.filter((a) => a.date === day).length,
  );

  const specialties = [...new Set(doctors.map((d) => d.specialty))];
  const doctorsBySpecialty = specialties.map((spec) => ({
    specialty: spec,
    count: doctors.filter((d) => d.specialty === spec).length,
  }));

  const statusCounts = {
    scheduled: appointments.filter((a) => a.status === "scheduled").length,
    completed: appointments.filter((a) => a.status === "completed").length,
    cancelled: appointments.filter((a) => a.status === "cancelled").length,
  };

  return {
    stats,
    patientsByService,
    appointmentsByDay,
    last7Days,
    appointmentsEvolution,
    doctorsBySpecialty,
    statusCounts,
  };
}

function render() {
  const container = document.createElement("div");
  container.className = "space-y-6 animate-fade-in";
  container.innerHTML = `<div class="text-muted-foreground">${t("loading") || "Loading..."}</div>`;

  initDashboard(container);
  return container;
}

async function initDashboard(container) {
  const currentLang = App.Services.I18n.getCurrentLang();

  const dataApi = App.Services.DataAsync || null;
  let patients = [];
  let doctors = [];
  let services = [];
  let appointments = [];
  let prescriptions = [];

  if (dataApi) {
    [patients, doctors, services, appointments, prescriptions] = await Promise.all([
      dataApi.getPatients(),
      dataApi.getDoctors(),
      dataApi.getServices(),
      dataApi.getAppointments(),
      dataApi.getPrescriptions(),
    ]);
  } else {
    patients = getPatients();
    doctors = getDoctors();
    services = getServices();
    appointments = getAppointments();
    prescriptions = getPrescriptions();
  }

  const baseData = { patients, doctors, services, appointments, prescriptions };
  renderDashboard(container, baseData, currentLang);
}

function renderDashboard(container, baseData, currentLang) {
  destroyCharts();

  const {
    stats,
    patientsByService,
    appointmentsByDay,
    last7Days,
    appointmentsEvolution,
    doctorsBySpecialty,
    statusCounts,
  } = buildDashboardData(baseData);

  const isRTL = document.documentElement.dir === 'rtl';
  const gapClass = isRTL ? 'ml-2' : 'mr-2';

  container.innerHTML = `
    <div class="grid grid-cols-[1fr_auto] gap-3 items-center">
      <div class="min-w-0">
        <h1 class="text-3xl font-heading font-bold min-w-0 truncate sm:whitespace-normal sm:overflow-visible sm:text-clip">${t("dashboard")}</h1>
        <p class="text-muted-foreground mt-1">${t("welcome")}</p>
      </div>

      <div class="flex flex-nowrap gap-2 justify-end shrink-0">
        <button id="dashboard-export-pdf" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-9 px-3 whitespace-nowrap">
          <i data-lucide="download" class="w-4 h-4 sm:${gapClass}"></i>
          <span class="hidden sm:inline">${t("exportPDF")}</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="stats-grid"></div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="glass rounded-2xl shadow-glow">
        <div class="p-5 border-b border-border/60">
          <p class="text-lg font-semibold">${t("patientsByService")}</p>
        </div>
        <div class="p-5 h-[300px]">
          <canvas id="chart-patients-service"></canvas>
        </div>
      </div>

      <div class="glass rounded-2xl shadow-glow">
        <div class="p-5 border-b border-border/60">
          <p class="text-lg font-semibold">${t("appointmentsByDay")}</p>
        </div>
        <div class="p-5 h-[300px]">
          <canvas id="chart-appointments-day"></canvas>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="glass rounded-2xl shadow-glow lg:col-span-2">
        <div class="p-5 border-b border-border/60">
          <p class="text-lg font-semibold">${t("appointmentsEvolution")}</p>
        </div>
        <div class="p-5 h-[300px]">
          <canvas id="chart-appointments-evolution"></canvas>
        </div>
      </div>

      <div class="glass rounded-2xl shadow-glow">
        <div class="p-5 border-b border-border/60">
          <p class="text-lg font-semibold">${t("appointmentsByStatus")}</p>
        </div>
        <div class="p-5 h-[300px]">
          <canvas id="chart-appointments-status"></canvas>
        </div>
      </div>
    </div>

    <div class="glass rounded-2xl shadow-glow">
      <div class="p-5 border-b border-border/60">
        <p class="text-lg font-semibold">${t("doctorsBySpecialty")}</p>
      </div>
      <div class="p-5 h-[300px]">
        <canvas id="chart-doctors-specialty"></canvas>
      </div>
    </div>
  `;

  const statsGrid = container.querySelector("#stats-grid");
  stats.forEach((stat) => {
    const bgClass = stat.color;
    const textClass = "text-white";

    const card = document.createElement("div");
    card.className = "glass rounded-2xl shadow-glow overflow-hidden";
    card.innerHTML = `
      <div class="p-6 flex items-center justify-between">
        <div>
          <p class="text-sm text-muted-foreground">${stat.key}</p>
          <p class="text-3xl font-bold mt-1">${stat.value}</p>
        </div>
        <div class="w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center">
          <i data-lucide="${stat.icon}" class="w-6 h-6 ${textClass}"></i>
        </div>
      </div>
    `;
    statsGrid.appendChild(card);
  });

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }

  // Dashboard report export
  const exportBtn = container.querySelector('#dashboard-export-pdf');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const pad = (n) => String(n).padStart(2, '0');
      const now = new Date();
      const ts = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

      // 1) Stats table
      const statsRows = stats.map((s) => ({ label: s.key, value: s.value }));
      exportToPDF(
        statsRows,
        `dashboard_report_${ts}`,
        t('dashboard') || 'Dashboard',
        [
          { key: 'label', header: t('metric') || 'Metric' },
          { key: 'value', header: t('value') || 'Value' },
        ]
      );
    });
  }

  setTimeout(() => {
    const isRTL = document.documentElement.dir === "rtl";
    const palette = [
      "hsl(199, 89%, 48%)",
      "hsl(262, 83%, 58%)",
      "hsl(142, 76%, 36%)",
      "hsl(38, 92%, 50%)",
      "hsl(0, 84%, 60%)",
      "hsl(220, 10%, 46%)",
      "#6366f1",
      "#ec4899",
    ];

    const patientsServiceCtx = container.querySelector("#chart-patients-service");
    if (patientsServiceCtx) {
      dashboardCharts.patientsByService = new Chart(patientsServiceCtx, {
        type: "pie",
        data: {
          labels: patientsByService.map((s) => s.name),
          datasets: [
            {
              data: patientsByService.map((s) => s.count),
              backgroundColor: palette,
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { padding: 20, usePointStyle: true, pointStyle: "circle" },
            },
          },
        },
      });
    }

    const appointmentsDayCtx = container.querySelector("#chart-appointments-day");
    if (appointmentsDayCtx) {
      const monday = new Date(1970, 0, 5);
      const dayLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d.toLocaleDateString(currentLang, { weekday: "short" });
      });
      dashboardCharts.appointmentsByDay = new Chart(appointmentsDayCtx, {
        type: "bar",
        data: {
          labels: dayLabels,
          datasets: [
            {
              label: t("appointments"),
              data: appointmentsByDay,
              backgroundColor: palette[0],
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: { beginAtZero: true, reverse: isRTL ? false : false },
          },
        },
      });
    }

    const appointmentsEvolutionCtx = container.querySelector("#chart-appointments-evolution");
    if (appointmentsEvolutionCtx) {
      dashboardCharts.appointmentsEvolution = new Chart(appointmentsEvolutionCtx, {
        type: "line",
        data: {
          labels: last7Days.map((d) =>
            new Date(d).toLocaleDateString(currentLang, { month: "short", day: "numeric" }),
          ),
          datasets: [
            {
              label: t("appointments"),
              data: appointmentsEvolution,
              borderColor: palette[0],
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              fill: true,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    const doctorsSpecialtyCtx = container.querySelector("#chart-doctors-specialty");
    if (doctorsSpecialtyCtx) {
      dashboardCharts.doctorsBySpecialty = new Chart(doctorsSpecialtyCtx, {
        type: "bar",
        data: {
          labels: doctorsBySpecialty.map((s) => s.specialty),
          datasets: [
            {
              label: t("doctors"),
              data: doctorsBySpecialty.map((s) => s.count),
              backgroundColor: palette.slice(0, doctorsBySpecialty.length),
              borderRadius: 8,
            },
          ],
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
        },
      });
    }

    const appointmentsStatusCtx = container.querySelector("#chart-appointments-status");
    if (appointmentsStatusCtx) {
      dashboardCharts.appointmentsByStatus = new Chart(appointmentsStatusCtx, {
        type: "doughnut",
        data: {
          labels: [t("scheduled"), t("completed"), t("cancelled")],
          datasets: [
            {
              data: [statusCounts.scheduled, statusCounts.completed, statusCounts.cancelled],
              backgroundColor: [palette[0], palette[2], palette[4]],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { padding: 20, usePointStyle: true, pointStyle: "circle" },
            },
          },
        },
      });
    }
  }, 0);
}
window.App = window.App || {};
App.Pages = App.Pages || {};
App.Pages.Dashboard = { render };
})();
