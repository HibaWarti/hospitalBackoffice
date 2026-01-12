(() => {
  function getAppointments() { return App.Services.Data.getAppointments(); }
  function getAppointment(id) { return App.Services.Data.getAppointment(id); }
  function addAppointment(a) { return App.Services.Data.addAppointment(a); }
  function updateAppointment(id, updates) { return App.Services.Data.updateAppointment(id, updates); }
  function deleteAppointment(id) { return App.Services.Data.deleteAppointment(id); }
  function getPatient(id) { return App.Services.Data.getPatient(id); }
  function getDoctor(id) { return App.Services.Data.getDoctor(id); }
  function getService(id) { return App.Services.Data.getService(id); }
  function getPatients() { return App.Services.Data.getPatients(); }
  function getDoctors() { return App.Services.Data.getDoctors(); }
  function getServices() { return App.Services.Data.getServices(); }
  function t(key) { return App.Services.I18n.t(key); }
  function exportToCSV(data, filename, columns) { return App.Services.Utils.exportToCSV(data, filename, columns); }
  function exportToPDF(data, filename, title, columns) { return App.Services.Utils.exportToPDF(data, filename, title, columns); }
  function exportElementToPDF(element, filename) { return App.Services.Utils.exportElementToPDF(element, filename); }
  function formatDateDMY(value) { return App.Services.Utils.formatDateDMY(value); }
  function toastSuccess(message) { return App.Services.Utils.toastSuccess(message); }
  function toastError(message) { return App.Services.Utils.toastError(message); }
  function confirmDialog(options) { return App.Services.Utils.confirmDialog(options); }

  let appointmentsState = {
    search: "",
    sortKey: "date",
    sortOrder: "desc",
    page: 1,
    pageSize: 10,
    isModalOpen: false,
    editingId: null,
    viewingId: null,
    filterDoctorId: "",
    filterStatus: "",
    filterDate: ""
  };

  function render() {
    const container = document.createElement('div');
    container.className = "appointments-page";
    updateContent(container);
    return container;
  }

  function updateContent(container) {
    container.innerHTML = generateHTML();
    lucide.createIcons();
    attachListeners(container);
    
    // Set filter values
    const statusFilter = container.querySelector('#status-filter');
    if (statusFilter) {
        statusFilter.value = appointmentsState.filterStatus;
    }

    if (appointmentsState.search) {
        const searchInput = container.querySelector("#search-input");
        if (searchInput) {
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    }
  }

  function generateHTML() {
    const allAppointments = getAppointments();
    const patients = getPatients();
    const doctors = getDoctors();
    const services = getServices();
    const isRTL = document.documentElement.dir === 'rtl';
    const gapClass = isRTL ? 'ml-2' : 'mr-2';
    const prevIcon = isRTL ? 'chevron-right' : 'chevron-left';
    const nextIcon = isRTL ? 'chevron-left' : 'chevron-right';
    
    // Enrich data
    const enrichedAppointments = allAppointments.map(a => {
        const patient = getPatient(a.patientId);
        const doctor = getDoctor(a.doctorId);
        const service = services.find(s => s.id === a.serviceId);
        return {
            ...a,
            patientName: patient ? `${patient.firstName} ${patient.lastName}` : t('unknown'),
            doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : t('unknown'),
            serviceName: service ? service.name : t('unknown')
        };
    });

    const doctorOptions = [`<option value="">${t('doctor')}</option>`]
      .concat(doctors.map((d) => {
        const selected = String(appointmentsState.filterDoctorId) === String(d.id) ? 'selected' : '';
        return `<option value="${d.id}" ${selected}>${d.firstName} ${d.lastName}</option>`;
      }))
      .join('');

    // Filter
    let filteredAppointments = enrichedAppointments.filter(app => {
      const searchLower = appointmentsState.search.toLowerCase();
      const matchesSearch = (
        app.patientName.toLowerCase().includes(searchLower) ||
        app.doctorName.toLowerCase().includes(searchLower) ||
        app.status.toLowerCase().includes(searchLower)
      );
      const matchesDoctor = appointmentsState.filterDoctorId ? String(app.doctorId) === String(appointmentsState.filterDoctorId) : true;
      const matchesStatus = appointmentsState.filterStatus ? String(app.status) === String(appointmentsState.filterStatus) : true;
      const matchesDate = appointmentsState.filterDate ? app.date === appointmentsState.filterDate : true;
      return matchesSearch && matchesDoctor && matchesStatus && matchesDate;
    });

    // Sort
    if (appointmentsState.sortKey) {
      filteredAppointments.sort((a, b) => {
        const aVal = String(a[appointmentsState.sortKey]).toLowerCase();
        const bVal = String(b[appointmentsState.sortKey]).toLowerCase();
        if (appointmentsState.sortOrder === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      });
    }

    // Paginate
    const totalPages = Math.ceil(filteredAppointments.length / appointmentsState.pageSize);
    const startIndex = (appointmentsState.page - 1) * appointmentsState.pageSize;
    const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + appointmentsState.pageSize);

    const renderSortIcon = (key) => {
      return '<i data-lucide="arrow-up-down" class="w-4 h-4 ms-1"></i>';
    };
    
    let pagesToShow = [];
    if (totalPages <= 7) {
      pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pagesToShow = [1];
      if (appointmentsState.page > 3) pagesToShow.push('ellipsis');
      const start = Math.max(2, appointmentsState.page - 1);
      const end = Math.min(totalPages - 1, appointmentsState.page + 1);
      for (let p = start; p <= end; p++) pagesToShow.push(p);
      if (appointmentsState.page < totalPages - 2) pagesToShow.push('ellipsis');
      pagesToShow.push(totalPages);
    }
    const pageButtons = pagesToShow.map(p => {
      if (p === 'ellipsis') {
        return `<span class="px-2 text-muted-foreground">...</span>`;
      }
      const isActive = appointmentsState.page === p;
      const bgClass = isActive ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground';
      const hoverClass = isActive ? 'hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground';
      return `
        <button data-page="${p}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input ${bgClass} ${hoverClass} h-8 min-w-8 px-2">
          ${p}
        </button>
      `;
    }).join('');

    // Modal Overlays
    const modalOverlayHTML = (appointmentsState.isModalOpen || appointmentsState.viewingId) ? `
      <div class="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm global-overlay" id="global-overlay">
        ${appointmentsState.viewingId ? (() => {
            const app = enrichedAppointments.find(a => a.id === appointmentsState.viewingId);
            if (!app) return '';
            return `
            <div class="w-full max-w-lg bg-card text-card-foreground border border-border rounded-xl shadow-glow animate-fade-in" id="details-modal-content">
              <div class="p-6 border-b border-border flex items-center justify-between">
                <h2 class="text-lg font-semibold">${t("appointmentDetails")}</h2>
                <button id="close-details-x" class="text-muted-foreground hover:text-foreground">
                  <i data-lucide="x" class="w-5 h-5"></i>
                </button>
              </div>
              <div class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-muted-foreground">${t("date")}</p>
                        <p class="text-base font-medium mt-1">${formatDateDMY(app.date)}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-muted-foreground">${t("time")}</p>
                        <p class="text-base font-medium mt-1">${app.time}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-muted-foreground">${t("patient")}</p>
                        <p class="text-base font-medium mt-1">${app.patientName}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-muted-foreground">${t("doctor")}</p>
                        <p class="text-base font-medium mt-1">${app.doctorName}</p>
                    </div>
                     <div>
                        <p class="text-sm font-medium text-muted-foreground">${t("service")}</p>
                        <p class="text-base font-medium mt-1">${app.serviceName}</p>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-muted-foreground">${t("status")}</p>
                        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent mt-1
                            ${app.status === 'completed' ? 'bg-success text-success-foreground' : 
                              app.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}">
                            ${t(app.status)}
                        </span>
                    </div>
                </div>
              </div>
              <div class="flex justify-end gap-3 p-6 border-t border-border">
                  <button id="export-detail-pdf-btn" class="h-9 px-3 rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground text-sm font-medium inline-flex items-center">
                    <i data-lucide="file-text" class="w-4 h-4 ${gapClass}"></i>
                    ${t("exportPDF")}
                  </button>
                  <button id="close-details-btn" class="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">${t("close")}</button>
              </div>
            </div>
            `;
        })() : ''}

        ${appointmentsState.isModalOpen ? `
        <div class="w-full max-w-lg bg-card text-card-foreground border border-border rounded-xl shadow-glow animate-fade-in" id="form-modal-content">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold">${appointmentsState.editingId ? t("editAppointment") : t("addAppointment")}</h2>
            <button id="close-modal-x" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <form id="appointment-form" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label for="date" class="text-sm font-medium">${t("date")}</label>
                <input id="date" name="date" type="date" lang="fr" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required />
              </div>
              <div class="space-y-2">
                <label for="time" class="text-sm font-medium">${t("time")}</label>
                <input id="time" name="time" type="time" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required />
              </div>
            </div>
            
            <div class="space-y-2">
              <label for="patientId" class="text-sm font-medium">${t("patient")}</label>
              <select id="patientId" name="patientId" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                <option value="">${t("selectPatient")}</option>
                ${patients.map(p => `<option value="${p.id}">${p.firstName} ${p.lastName}</option>`).join('')}
              </select>
            </div>

            <div class="space-y-2">
              <label for="doctorId" class="text-sm font-medium">${t("doctor")}</label>
              <select id="doctorId" name="doctorId" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                <option value="">${t("selectDoctor")}</option>
                ${doctors.map(d => `<option value="${d.id}">${d.firstName} ${d.lastName} - ${d.specialty}</option>`).join('')}
              </select>
            </div>

            <div class="space-y-2">
              <label for="serviceId" class="text-sm font-medium">${t("service")}</label>
              <select id="serviceId" name="serviceId" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                <option value="">${t("selectService")}</option>
                ${services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
              </select>
            </div>

            <div class="space-y-2">
              <label for="status" class="text-sm font-medium">${t("status")}</label>
              <select id="status" name="status" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" required>
                <option value="scheduled">${t("scheduled")}</option>
                <option value="completed">${t("completed")}</option>
                <option value="cancelled">${t("cancelled")}</option>
              </select>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button type="button" id="cancel-modal-btn" class="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">
                ${t("cancel")}
              </button>
              <button type="submit" class="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
                ${t("save")}
              </button>
            </div>
          </form>
        </div>
        ` : ''}
      </div>
    ` : '';

    return `
      <div class="space-y-6 animate-fade-in">
        <h1 class="text-3xl font-heading font-bold">${t("appointments")}</h1>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-between">
          <div class="flex flex-1 gap-2">
            <div class="relative flex-1">
              <i data-lucide="search" class="absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
              <input 
                type="text" 
                id="search-input" 
                placeholder="${t("search")}" 
                value="${appointmentsState.search}"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ${isRTL ? 'pr-10' : 'pl-10'} text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <input
              type="date"
              lang="fr"
              id="date-filter"
              value="${appointmentsState.filterDate}"
              class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="${t("date") || 'Date'}"
            >
            <select id="doctor-filter" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              ${doctorOptions}
            </select>
            <select id="status-filter" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">${t("status")}</option>
              <option value="scheduled">${t("scheduled")}</option>
              <option value="completed">${t("completed")}</option>
              <option value="cancelled">${t("cancelled")}</option>
            </select>
          </div>
          <div class="flex gap-2">
            <button id="reset-filters-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-10 px-3">
                <i data-lucide="rotate-ccw" class="w-4 h-4 ${gapClass}"></i>
                ${t("reset")}
            </button>
            <div class="relative inline-block text-left">
              <button id="export-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                <i data-lucide="download" class="w-4 h-4 ${gapClass}"></i>
                ${t("export")}
              </button>
              <div id="export-menu" class="hidden absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card text-foreground border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                <div class="py-1">
                  <button id="export-csv" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">${t("exportCSV")}</button>
                  <button id="export-pdf" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">${t("exportPDF")}</button>
                </div>
              </div>
            </div>
            <button id="add-appointment-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-10 px-4 py-2">
              <i data-lucide="plus" class="w-4 h-4 ${gapClass}"></i>
              ${t("add")}
            </button>
          </div>
        </div>

        <div class="glass rounded-2xl shadow-glow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm" dir="${isRTL ? 'rtl' : 'ltr'}">
              <thead class="bg-secondary/80 dark:bg-secondary/50 border-b border-border">
                <tr class="${isRTL ? 'text-right' : 'text-left'}">
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="patientName">
                    <div class="flex items-center">${t("patient")} ${renderSortIcon('patientName')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="doctorName">
                    <div class="flex items-center">${t("doctor")} ${renderSortIcon('doctorName')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="date">
                    <div class="flex items-center">${t("date")} ${renderSortIcon('date')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="time">
                    <div class="flex items-center">${t("time")} ${renderSortIcon('time')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="status">
                    <div class="flex items-center">${t("status")} ${renderSortIcon('status')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground text-right rtl:text-left">${t("actions")}</th>
                </tr>
              </thead>
              <tbody id="appointments-table-body" class="divide-y divide-border">
                ${paginatedAppointments.map(app => `
                  <tr class="hover:bg-muted transition-colors group">
                    <td class="p-4 text-left rtl:text-right">${app.patientName}</td>
                    <td class="p-4 text-left rtl:text-right">${app.doctorName}</td>
                    <td class="p-4 font-medium text-left rtl:text-right">${formatDateDMY(app.date)}</td>
                    <td class="p-4 text-left rtl:text-right">${app.time}</td>
                    <td class="p-4 text-left rtl:text-right">
                      <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent 
                        ${app.status === 'completed' ? 'bg-success text-success-foreground' : 
                          app.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-secondary-foreground'}">
                        ${t(app.status)}
                      </span>
                    </td>
                    <td class="p-4 text-right rtl:text-left">
                      <div class="relative inline-block text-left rtl:text-right">
                        <button data-action="menu" data-id="${app.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
                            <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                        </button>
                        <div id="appointment-menu-${app.id}" class="hidden fixed w-48 rounded-md shadow-lg bg-card text-foreground border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                            <div class="py-1">
                                <button data-action="view" data-id="${app.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                                    <i data-lucide="eye" class="w-4 h-4 ${gapClass}"></i>${t('view')}
                                </button>
                                <button data-action="edit" data-id="${app.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                                    <i data-lucide="pencil" class="w-4 h-4 ${gapClass}"></i>${t('edit')}
                                </button>
                                <button data-action="delete" data-id="${app.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left transition-colors flex items-center text-destructive hover:bg-destructive/10">
                                    <i data-lucide="trash-2" class="w-4 h-4 ${gapClass}"></i>${t('delete')}
                                </button>
                            </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `).join('')}
                ${paginatedAppointments.length === 0 ? `
                  <tr>
                    <td colspan="6" class="p-8 text-center text-muted-foreground">
                      ${t("noAppointments")}
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        </div>

        <div class="space-y-2 text-sm text-muted-foreground mt-4 pb-4">
           <div class="text-center">${t("showing")} ${Math.min(startIndex + 1, filteredAppointments.length)}-${Math.min(startIndex + appointmentsState.pageSize, filteredAppointments.length)} ${t("of")} ${filteredAppointments.length}</div>
           ${totalPages > 1 ? `
           <div id="pagination" class="flex items-center justify-center gap-2">
             <button id="prev-page" ${appointmentsState.page === 1 ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
               <i data-lucide="${prevIcon}" class="w-4 h-4"></i>
             </button>
             ${pageButtons}
             <button id="next-page" ${appointmentsState.page >= totalPages ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
               <i data-lucide="${nextIcon}" class="w-4 h-4"></i>
             </button>
           </div>
           ` : ''}
        </div>
      </div>
      ${modalOverlayHTML}
    `;
  }

  let closeMenusHandler = null;

  function attachListeners(container) {
    let activeMenuAnchor = null;
    let activeMenuEl = null;

    const getFixedContainingBlock = (el) => {
      let p = el && el.parentElement ? el.parentElement : null;
      while (p) {
        const cs = window.getComputedStyle(p);
        const hasTransform = cs.transform && cs.transform !== 'none';
        const hasFilter = cs.filter && cs.filter !== 'none';
        const hasBackdrop = cs.backdropFilter && cs.backdropFilter !== 'none';
        const hasPerspective = cs.perspective && cs.perspective !== 'none';
        if (hasTransform || hasFilter || hasBackdrop || hasPerspective) return p;
        p = p.parentElement;
      }
      return null;
    };

    const repositionActiveMenu = () => {
      if (!activeMenuAnchor || !activeMenuEl || activeMenuEl.classList.contains("hidden")) return;
      const btnRect = activeMenuAnchor.getBoundingClientRect();
      const isRTL = document.documentElement.dir === 'rtl';
      const cb = getFixedContainingBlock(activeMenuEl);
      const cbRect = cb ? cb.getBoundingClientRect() : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
      const viewportW = cb ? cbRect.width : window.innerWidth;
      const viewportH = cb ? cbRect.height : window.innerHeight;
      const mw = activeMenuEl.offsetWidth || 192;
      const mh = activeMenuEl.offsetHeight || 120;
      let top = btnRect.bottom + 8 - cbRect.top;
      if (top + mh > viewportH) {
        top = btnRect.top - mh - 8 - cbRect.top;
      }
      let left = (isRTL ? btnRect.left : btnRect.right - mw) - cbRect.left;
      if (left < 8) left = 8;
      if (left + mw > viewportW - 8) left = viewportW - mw - 8;
      activeMenuEl.style.top = `${top}px`;
      activeMenuEl.style.left = `${left}px`;
    };

    window.addEventListener('resize', repositionActiveMenu);
    window.addEventListener('scroll', repositionActiveMenu, true);

    const closeModals = () => {
        appointmentsState.isModalOpen = false;
        appointmentsState.viewingId = null;
        appointmentsState.editingId = null;
        updateContent(container);
    };

    const modal = container.querySelector("#global-overlay");
    const modalContent = container.querySelector("#form-modal-content");
    const detailsContent = container.querySelector("#details-modal-content");

    // Close on backdrop click
    modal?.addEventListener("click", (e) => {
        if (e.target === modal) closeModals();
    });

    // Close buttons
    container.querySelector("#close-modal-x")?.addEventListener("click", closeModals);
    container.querySelector("#cancel-modal-btn")?.addEventListener("click", closeModals);
    container.querySelector("#close-details-x")?.addEventListener("click", closeModals);
    container.querySelector("#close-details-btn")?.addEventListener("click", closeModals);

    // Form submit
    const form = container.querySelector("#appointment-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const appointment = {
                date: formData.get("date"),
                time: formData.get("time"),
                patientId: formData.get("patientId"),
                doctorId: formData.get("doctorId"),
                serviceId: formData.get("serviceId"),
                status: formData.get("status")
            };

            if (appointmentsState.editingId) {
                updateAppointment(appointmentsState.editingId, appointment);
                toastSuccess(t('updatedSuccessfully'));
            } else {
                addAppointment(appointment);
                toastSuccess(t('createdSuccessfully'));
            }
            closeModals();
        });
        
        // Fill form if editing
        if (appointmentsState.editingId) {
            const app = getAppointment(appointmentsState.editingId);
            if (app) {
                form.querySelector('[name="date"]').value = app.date;
                form.querySelector('[name="time"]').value = app.time;
                form.querySelector('[name="patientId"]').value = app.patientId;
                form.querySelector('[name="doctorId"]').value = app.doctorId;
                form.querySelector('[name="serviceId"]').value = app.serviceId;
                form.querySelector('[name="status"]').value = app.status;
            }
        }
    }

    // Export buttons
    container.querySelector("#export-btn")?.addEventListener("click", () => {
        const menu = container.querySelector("#export-menu");
        menu.classList.toggle("hidden");
    });
    
    container.querySelector("#export-csv")?.addEventListener("click", () => {
        exportToCSV(getAppointments(), 'appointments.csv', ['id', 'date', 'time', 'patientId', 'doctorId', 'serviceId', 'status']);
        container.querySelector("#export-menu").classList.add("hidden");
    });

    container.querySelector("#export-pdf")?.addEventListener("click", () => {
        const columns = [
            { key: 'patientName', header: t('patient') },
            { key: 'doctorName', header: t('doctor') },
            { key: 'date', header: t('date') },
            { key: 'time', header: t('time') },
            { key: 'status', header: t('status') }
        ];
        // Enrich appointments with names for export
        const enrichedAppointments = getAppointments().map(app => ({
            ...app,
            patientName: (() => {
                const p = getPatient(app.patientId);
                if (!p) return t('unknown');
                const full = `${String(p.firstName || '').trim()} ${String(p.lastName || '').trim()}`.trim();
                return full || t('unknown');
            })(),
            doctorName: (() => {
                const d = getDoctor(app.doctorId);
                if (!d) return t('unknown');
                const full = `${String(d.firstName || '').trim()} ${String(d.lastName || '').trim()}`.trim();
                return full || t('unknown');
            })()
        }));
        exportToPDF(enrichedAppointments, 'appointments.pdf', t('appointments'), columns);
        container.querySelector("#export-menu").classList.add("hidden");
    });

    container.querySelector('#export-csv')?.addEventListener('click', () => {
        const columns = [
            { key: 'date', header: t('date') },
            { key: 'time', header: t('time') },
            { key: 'patientName', header: t('patient') },
            { key: 'doctorName', header: t('doctor') },
            { key: 'status', header: t('status') }
        ];
        // Enrich appointments with names for export
        const enrichedAppointments = getAppointments().map(app => ({
            ...app,
            patientName: getPatient(app.patientId)?.firstName + ' ' + getPatient(app.patientId)?.lastName,
            doctorName: getDoctor(app.doctorId)?.firstName + ' ' + getDoctor(app.doctorId)?.lastName
        }));
        exportToCSV(enrichedAppointments, 'appointments-export', columns);
        container.querySelector("#export-menu").classList.add("hidden");
    });

    container.querySelector("#export-detail-pdf-btn")?.addEventListener("click", () => {
        if (appointmentsState.viewingId) {
            const app = getAppointment(appointmentsState.viewingId);
            if (app) {
                const element = container.querySelector("#details-modal-content");
                exportElementToPDF(element, `appointment-${app.id}`);
            }
        }
    });

    // Search input
    const searchInput = container.querySelector("#search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            appointmentsState.search = e.target.value;
            appointmentsState.page = 1;
            updateContent(container);
        });
    }
    
    // Filters
    const doctorFilter = container.querySelector("#doctor-filter");
    if (doctorFilter) {
        doctorFilter.addEventListener("change", (e) => {
            appointmentsState.filterDoctorId = e.target.value;
            appointmentsState.page = 1;
            updateContent(container);
        });
    }
    const statusFilter = container.querySelector("#status-filter");
    if (statusFilter) {
        statusFilter.addEventListener("change", (e) => {
            appointmentsState.filterStatus = e.target.value;
            appointmentsState.page = 1;
            updateContent(container);
        });
    }
    const dateFilter = container.querySelector("#date-filter");
    if (dateFilter) {
        dateFilter.addEventListener("change", (e) => {
            appointmentsState.filterDate = e.target.value;
            appointmentsState.page = 1;
            updateContent(container);
        });
    }

    const resetBtn = container.querySelector("#reset-filters-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            appointmentsState.search = "";
            appointmentsState.filterDoctorId = "";
            appointmentsState.filterStatus = "";
            appointmentsState.filterDate = "";
            appointmentsState.sortKey = null;
            appointmentsState.sortOrder = "asc";
            appointmentsState.page = 1;
            updateContent(container);
        });
    }

    // Pagination
    container.querySelectorAll("[data-page]").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const page = e.target.closest("button").dataset.page;
            if (page === 'ellipsis') return;
            appointmentsState.page = parseInt(page);
            updateContent(container);
        });
    });
    container.querySelector("#prev-page")?.addEventListener("click", () => {
        if (appointmentsState.page > 1) {
            appointmentsState.page--;
            updateContent(container);
        }
    });
    container.querySelector("#next-page")?.addEventListener("click", () => {
        const totalPages = Math.ceil(getAppointments().length / appointmentsState.pageSize); // Approximate check
        if (appointmentsState.page < totalPages) {
            appointmentsState.page++;
            updateContent(container);
        }
    });

    // Sort headers
    container.querySelectorAll("th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.sort;
            if (appointmentsState.sortKey === key) {
                appointmentsState.sortOrder = appointmentsState.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                appointmentsState.sortKey = key;
                appointmentsState.sortOrder = 'asc';
            }
            updateContent(container);
        });
    });

    // Table Actions
    const tableBody = container.querySelector("#appointments-table-body");
    tableBody?.addEventListener("click", (e) => {
        const target = e.target.closest("button");
        if (!target) return;
        const action = target.dataset.action;
        const id = target.dataset.id;
        
        if (action === "menu") {
             // Close any other open menus
            document.querySelectorAll('[id^="appointment-menu-"]').forEach(el => {
                if (el.id !== `appointment-menu-${id}`) el.classList.add("hidden");
            });
            const menu = container.querySelector(`#appointment-menu-${id}`);
            menu.classList.toggle("hidden");
            
            if (!menu.classList.contains("hidden")) {
                activeMenuAnchor = target;
                activeMenuEl = menu;
                repositionActiveMenu();
            } else {
                activeMenuAnchor = null;
                activeMenuEl = null;
            }
            e.stopPropagation();
        } else if (action === "view") {
            appointmentsState.viewingId = id;
            updateContent(container);
        } else if (action === "edit") {
            appointmentsState.editingId = id;
            appointmentsState.isModalOpen = true;
            updateContent(container);
        } else if (action === "delete") {
            confirmDialog({
                title: t('confirm'),
                text: t('confirmDeleteAppointment') || t('confirmDelete'),
                icon: 'warning',
            }).then((ok) => {
                if (!ok) return;
                const deleted = deleteAppointment(id);
                if (!deleted) {
                    toastError(t('deleteFailed'));
                    return;
                }
                updateContent(container);
                toastSuccess(t('deletedSuccessfully'));
            });
        }
    });

    // Sort headers
    container.querySelectorAll("th[data-sort]").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.sort;
            if (appointmentsState.sortKey === key) {
                appointmentsState.sortOrder = appointmentsState.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                appointmentsState.sortKey = key;
                appointmentsState.sortOrder = 'asc';
            }
            updateContent(container);
        });
    });
    
    // Add button
    container.querySelector("#add-appointment-btn")?.addEventListener("click", () => {
        appointmentsState.editingId = null;
        appointmentsState.isModalOpen = true;
        updateContent(container);
    });

    // Global click listener for menus
    if (closeMenusHandler) {
        document.removeEventListener('click', closeMenusHandler);
    }
    closeMenusHandler = (e) => {
        if (!e.target.closest('[data-action="menu"]')) {
            document.querySelectorAll('[id^="appointment-menu-"]').forEach(el => {
                el.classList.add("hidden");
            });
            activeMenuAnchor = null;
            activeMenuEl = null;
        }
    };
    document.addEventListener('click', closeMenusHandler);
  }

  App.Pages.Appointments = { render };
})();
