(() => {
  // Data Access
  function getPrescriptions() { return App.Services.Data.getPrescriptions(); }
  function getPrescription(id) { return App.Services.Data.getPrescription(id); }
  function addPrescription(p) { return App.Services.Data.addPrescription(p); }
  function updatePrescription(id, updates) { return App.Services.Data.updatePrescription(id, updates); }
  function deletePrescription(id) { return App.Services.Data.deletePrescription(id); }
  
  function getPatients() { return App.Services.Data.getPatients(); }
  function getDoctors() { return App.Services.Data.getDoctors(); }
  function getPatient(id) { return App.Services.Data.getPatient(id); }
  function getDoctor(id) { return App.Services.Data.getDoctor(id); }
  
  function t(key) { return App.Services.I18n.t(key); }
  function exportToCSV(data, filename, columns) { return App.Services.Utils.exportToCSV(data, filename, columns); }
  function exportToPDF(data, filename, title, columns) { return App.Services.Utils.exportToPDF(data, filename, title, columns); }
  function exportElementToPDF(element, filename) { return App.Services.Utils.exportElementToPDF(element, filename); }

  // State
  const prescriptionsState = {
    page: 1,
    itemsPerPage: 10,
    searchQuery: "",
    filterDoctorId: "",
    filterDate: "",
    sortKey: "date",
    sortOrder: "desc",
    activeMenuId: null
  };

  let activeMenuAnchor = null;
  let activeMenuEl = null;

  function render() {
    const container = document.createElement('div');
    container.id = 'prescriptions-page';
    // container.className = 'pb-8'; // Removed to avoid potential layout issues with fixed children
    updateContent(container);
    return container;
  }

  function updateContent(container) {
    container.innerHTML = generateHTML();
    attachListeners(container);
  }

  function generateHTML() {
    const prescriptions = getPrescriptions();
    const isRTL = document.documentElement.dir === 'rtl';
    const gapClass = isRTL ? 'ml-2' : 'mr-2';

    const renderSortIcon = (key) => {
      if (prescriptionsState.sortKey !== key) return '<i data-lucide="arrow-up-down" class="w-4 h-4 ms-1 opacity-50"></i>';
      return prescriptionsState.sortOrder === 'asc' 
        ? '<i data-lucide="arrow-up" class="w-4 h-4 ms-1"></i>'
        : '<i data-lucide="arrow-down" class="w-4 h-4 ms-1"></i>';
    };

    // Filter
    let filtered = prescriptions.filter(p => {
      const query = prescriptionsState.searchQuery.toLowerCase();
      const patient = getPatient(p.patientId);
      const doctor = getDoctor(p.doctorId);
      const matchesSearch = 
        p.medications.toLowerCase().includes(query) ||
        (patient ? patient.fullName.toLowerCase().includes(query) : false) ||
        (doctor ? doctor.name.toLowerCase().includes(query) : false);
      const matchesDoctor = prescriptionsState.filterDoctorId ? p.doctorId === prescriptionsState.filterDoctorId : true;
      const matchesDate = prescriptionsState.filterDate ? p.date === prescriptionsState.filterDate : true;
      return matchesSearch && matchesDoctor && matchesDate;
    });

    // Sort
    if (prescriptionsState.sortKey) {
      filtered.sort((a, b) => {
        let aVal = a[prescriptionsState.sortKey];
        let bVal = b[prescriptionsState.sortKey];
        
        if (prescriptionsState.sortKey === 'patientName') {
           const pa = getPatient(a.patientId);
           const pb = getPatient(b.patientId);
           aVal = pa ? (pa.fullName || '').toLowerCase() : '';
           bVal = pb ? (pb.fullName || '').toLowerCase() : '';
        } else if (prescriptionsState.sortKey === 'doctorName') {
           const da = getDoctor(a.doctorId);
           const db = getDoctor(b.doctorId);
           aVal = da ? (da.name || '').toLowerCase() : '';
           bVal = db ? (db.name || '').toLowerCase() : '';
        }

        if (aVal < bVal) return prescriptionsState.sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return prescriptionsState.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / prescriptionsState.itemsPerPage);
    const start = (prescriptionsState.page - 1) * prescriptionsState.itemsPerPage;
    const end = start + prescriptionsState.itemsPerPage;
    const paginated = filtered.slice(start, end);

    let pagesToShow = [];
    if (totalPages <= 7) {
      pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pagesToShow = [1];
      if (prescriptionsState.page > 3) pagesToShow.push('ellipsis');
      const start = Math.max(2, prescriptionsState.page - 1);
      const end = Math.min(totalPages - 1, prescriptionsState.page + 1);
      for (let p = start; p <= end; p++) pagesToShow.push(p);
      if (prescriptionsState.page < totalPages - 2) pagesToShow.push('ellipsis');
      pagesToShow.push(totalPages);
    }
    const pageButtons = pagesToShow.map(p => {
      if (p === 'ellipsis') {
        return `<span class="px-2 text-muted-foreground">...</span>`;
      }
      const isActive = prescriptionsState.page === p;
      const bgClass = isActive ? 'bg-primary text-primary-foreground' : 'bg-white';
      const hoverClass = isActive ? 'hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground';
      return `
        <button data-page="${p}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input ${bgClass} ${hoverClass} h-8 min-w-8 px-2">
          ${p}
        </button>
      `;
    }).join('');

    const paginationHTML = totalPages > 1 ? `
      <div class="space-y-2 pt-4 border-t border-border">
          <div class="text-sm text-muted-foreground text-center">
              ${t('showing')} ${start + 1} ${t('to')} ${Math.min(end, filtered.length)} ${t('of')} ${filtered.length}
          </div>
          <div class="flex items-center justify-center gap-2">
              <button data-page="prev" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8" ${prescriptionsState.page === 1 ? 'disabled' : ''}>
                  <i data-lucide="${isRTL ? 'chevron-right' : 'chevron-left'}" class="w-4 h-4"></i>
              </button>
              ${pageButtons}
              <button data-page="next" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8" ${prescriptionsState.page === totalPages ? 'disabled' : ''}>
                  <i data-lucide="${isRTL ? 'chevron-left' : 'chevron-right'}" class="w-4 h-4"></i>
              </button>
          </div>
      </div>
    ` : '';
    
    return `
      <div class="space-y-6 animate-fade-in pb-8"> <!-- Moved pb-8 here -->
        <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
                <h1 class="text-3xl font-heading font-bold">${t("prescriptions")}</h1>
            </div>

            <div class="flex flex-col sm:flex-row gap-4 justify-between">
                <div class="flex flex-1 gap-2 max-w-lg">
                    <div class="relative flex-1">
                        <i data-lucide="search" class="absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
                        <input
                            type="text"
                            id="search-input"
                            placeholder="${t("search")}"
                            value="${prescriptionsState.searchQuery}"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ${isRTL ? 'pr-10' : 'pl-10'} text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                    </div>
                    <input
                        type="date"
                        id="date-filter"
                        value="${prescriptionsState.filterDate}"
                        class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="${t("date") || 'Date'}"
                    >
                </div>

                <div class="flex gap-2">
                    <button id="reset-filters-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-10 px-3">
                        <i data-lucide="rotate-ccw" class="w-4 h-4 ${gapClass}"></i>
                        ${t("reset")}
                    </button>
                    <div class="relative inline-block text-left">
                        <button id="export-menu-btn" type="button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4">
                            <i data-lucide="download" class="w-4 h-4 ${gapClass}"></i>
                            ${t("export")}
                        </button>
                        <div id="export-menu" class="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-border ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div class="py-1">
                                <button id="export-csv" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                                    ${t("exportCSV")}
                                </button>
                                <button id="export-pdf" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">
                                    ${t("exportPDF")}
                                </button>
                            </div>
                        </div>
                    </div>
                    <button id="add-prescription-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                        <i data-lucide="plus" class="w-4 h-4 ${gapClass}"></i>
                        ${t("add")}
                    </button>
                </div>
            </div>
        </div>

        <div class="rounded-md border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm" dir="${isRTL ? 'rtl' : 'ltr'}">
              <thead class="bg-muted/50 text-muted-foreground">
                <tr class="${isRTL ? 'text-right' : 'text-left'}">
                  <th class="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" data-sort="patientName">
                    <div class="flex items-center">${t("patient")} ${renderSortIcon('patientName')}</div>
                  </th>
                  <th class="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" data-sort="doctorName">
                    <div class="flex items-center">${t("doctor")} ${renderSortIcon('doctorName')}</div>
                  </th>
                  <th class="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" data-sort="medications">
                    <div class="flex items-center">${t("medications")} ${renderSortIcon('medications')}</div>
                  </th>
                  <th class="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" data-sort="dosage">
                    <div class="flex items-center">${t("dosage")} ${renderSortIcon('dosage')}</div>
                  </th>
                  <th class="h-12 px-4 align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors" data-sort="date">
                    <div class="flex items-center">${t("date")} ${renderSortIcon('date')}</div>
                  </th>
                  <th class="h-12 px-4 align-middle font-medium text-muted-foreground text-right rtl:text-left">${t("actions")}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                ${paginated.length > 0 ? paginated.map(p => {
                  const patient = getPatient(p.patientId);
                  const doctor = getDoctor(p.doctorId);
                  const patientName = patient ? (patient.fullName || `${patient.firstName} ${patient.lastName}`) : t("unknown");
                  const doctorName = doctor ? (doctor.name || `${doctor.firstName} ${doctor.lastName}`) : t("unknown");
                  const date = p.date || p.prescriptionDate || '-';
                  return `
                  <tr data-id="${p.id}" class="hover:bg-muted/50 transition-colors">
                    <td class="p-4 align-middle ${isRTL ? 'text-right' : 'text-left'}">${patientName}</td>
                    <td class="p-4 align-middle ${isRTL ? 'text-right' : 'text-left'}">${doctorName}</td>
                    <td class="p-4 align-middle font-medium text-foreground ${isRTL ? 'text-right' : 'text-left'}">${p.medications}</td>
                    <td class="p-4 align-middle ${isRTL ? 'text-right' : 'text-left'}">${p.dosage || '-'}</td>
                    <td class="p-4 align-middle ${isRTL ? 'text-right' : 'text-left'}">${date}</td>
                    <td class="p-4 align-middle text-right rtl:text-left">
                      <div class="relative inline-block text-left rtl:text-right">
                        <button data-action="menu" data-id="${p.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
                          <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                        </button>
                        <div id="prescription-menu-${p.id}" class="hidden fixed w-48 rounded-md shadow-lg bg-white border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                          <div class="py-1">
                            <button data-action="view" data-id="${p.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                              <i data-lucide="eye" class="w-4 h-4 ${gapClass}"></i>${t('view')}
                            </button>
                            <button data-action="edit" data-id="${p.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                              <i data-lucide="pencil" class="w-4 h-4 ${gapClass}"></i>${t('edit')}
                            </button>
                            <button data-action="delete" data-id="${p.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left transition-colors flex items-center text-destructive hover:bg-destructive/10">
                              <i data-lucide="trash-2" class="w-4 h-4 ${gapClass}"></i>${t('delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `;}).join('') : `
                  <tr>
                    <td colspan="6" class="p-8 text-center text-muted-foreground">
                      ${t("noPrescriptions")}
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
        ${paginationHTML}
      </div>
      ${getModalsHTML(isRTL)}
    `;
  }

  function getModalsHTML(isRTL) {
    const gapClass = isRTL ? 'ml-2' : 'mr-2';
    const patients = getPatients();
    const doctors = getDoctors();
    
    return `
    <!-- Add Modal -->
    <div id="add-modal" class="fixed inset-0 z-[1001] hidden items-center justify-center p-4 bg-black/50 backdrop-blur-sm global-overlay">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">${t('addPrescription')}</h2>
          <button data-action="close-modal" class="text-muted-foreground hover:text-foreground">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('medications')}</label>
            <input type="text" id="add-medications" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('dosage')}</label>
            <input type="text" id="add-dosage" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('patient')}</label>
            <select id="add-patient-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">${t('selectPatient') || 'Select Patient'}</option>
                ${patients.map(p => `<option value="${p.id}">${p.fullName}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('doctor')}</label>
            <select id="add-doctor-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                <option value="">${t('selectDoctor') || 'Select Doctor'}</option>
                ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('date')}</label>
            <input type="date" id="add-date" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
        </div>
        <div class="flex justify-end gap-2 p-4 border-t bg-muted/50">
          <button data-action="close-modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
            ${t('cancel')}
          </button>
          <button id="save-add-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
            ${t('save')}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div id="edit-modal" class="fixed inset-0 z-[1001] hidden items-center justify-center p-4 bg-black/50 backdrop-blur-sm global-overlay">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">${t('editPrescription')}</h2>
          <button data-action="close-modal" class="text-muted-foreground hover:text-foreground">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="p-4 space-y-4">
          <input type="hidden" id="edit-id">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('medications')}</label>
            <input type="text" id="edit-medications" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('dosage')}</label>
            <input type="text" id="edit-dosage" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('patient')}</label>
            <select id="edit-patient-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                ${patients.map(pat => `<option value="${pat.id}">${pat.fullName}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('doctor')}</label>
            <select id="edit-doctor-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none">${t('date')}</label>
            <input type="date" id="edit-date" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          </div>
        </div>
        <div class="flex justify-end gap-2 p-4 border-t bg-muted/50">
          <button data-action="close-modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
            ${t('cancel')}
          </button>
          <button id="save-edit-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
            ${t('save')}
          </button>
        </div>
      </div>
    </div>

    <!-- View Modal -->
    <div id="view-modal" class="fixed inset-0 z-[1001] hidden items-center justify-center bg-black/50 backdrop-blur-sm global-overlay">
      <div class="w-full max-w-lg bg-white border border-border rounded-xl shadow-glow animate-fade-in max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">
        <div class="flex items-center justify-between p-4 border-b">
          <h2 class="text-lg font-semibold">${t('prescriptionDetails')}</h2>
          <button data-action="close-modal" class="text-muted-foreground hover:text-foreground">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-muted-foreground">${t('patient')}</label>
              <p class="text-base" id="view-patient"></p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">${t('doctor')}</label>
              <p class="text-base" id="view-doctor"></p>
            </div>
            <div>
              <label class="text-sm font-medium text-muted-foreground">${t('date')}</label>
              <p class="text-base" id="view-date"></p>
            </div>
             <div>
              <label class="text-sm font-medium text-muted-foreground">${t('dosage')}</label>
              <p class="text-base" id="view-dosage"></p>
            </div>
            <div class="col-span-2">
              <label class="text-sm font-medium text-muted-foreground">${t('medications')}</label>
              <p class="text-base font-medium" id="view-medications"></p>
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-2 p-4 border-t bg-muted/50">
           <button id="view-export-pdf" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
            <i data-lucide="file-down" class="w-4 h-4 ${gapClass}"></i>
            ${t('exportPDF')}
          </button>
          <button data-action="close-modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
            ${t('close')}
          </button>
        </div>
      </div>
    </div>
    `;
  }

  function attachListeners(container) {
    if (window.lucide) {
      window.lucide.createIcons({
        root: container
      });
    }

    // Modal Utilities
    const closeModals = () => {
        container.querySelectorAll('.fixed.inset-0').forEach(el => {
            el.classList.add('hidden');
            el.classList.remove('flex');
        });
    };

    // Global Overlay Close
    container.querySelectorAll('.global-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModals();
        });
    });
    
    // Close modal buttons
    container.querySelectorAll('button[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Menu logic
    const closeMenusHandler = () => {
        if (prescriptionsState.activeMenuId) {
            const el = document.getElementById(`prescription-menu-${prescriptionsState.activeMenuId}`);
            if (el) el.classList.add('hidden');
            prescriptionsState.activeMenuId = null;
        }
    };
    const repositionActiveMenu = () => {
      if (!activeMenuAnchor || !activeMenuEl || activeMenuEl.classList.contains("hidden")) return;
      const btnRect = activeMenuAnchor.getBoundingClientRect();
      const isRTL = document.documentElement.dir === 'rtl';
      const mw = activeMenuEl.offsetWidth || 192;
      const mh = activeMenuEl.offsetHeight || 120;
      let top = btnRect.bottom + 8;
      if (top + mh > window.innerHeight) {
        top = btnRect.top - mh - 8;
      }
      let left = isRTL ? btnRect.left : btnRect.right - mw;
      if (left < 8) left = 8;
      if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
      activeMenuEl.style.top = `${top}px`;
      activeMenuEl.style.left = `${left}px`;
    };
    window.addEventListener('scroll', closeMenusHandler, { capture: true, passive: true });
    window.addEventListener('resize', closeMenusHandler, { passive: true });
    window.addEventListener('resize', repositionActiveMenu, { passive: true });

    // Search & Filter
    const searchInput = container.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        prescriptionsState.searchQuery = e.target.value;
        prescriptionsState.page = 1;
        updateContent(container);
        const newSearch = container.querySelector('#search-input');
        if (newSearch) {
            newSearch.focus();
            newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    const dateFilter = container.querySelector('#date-filter');
    if (dateFilter) {
      dateFilter.addEventListener('change', (e) => {
        prescriptionsState.filterDate = e.target.value;
        prescriptionsState.page = 1;
        updateContent(container);
      });
    }

    const resetBtn = container.querySelector('#reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            prescriptionsState.searchQuery = "";
            prescriptionsState.filterDoctorId = "";
            prescriptionsState.filterDate = "";
            prescriptionsState.sortKey = null;
            prescriptionsState.sortOrder = "desc";
            prescriptionsState.page = 1;
            updateContent(container);
        });
    }

    // Sort
    container.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (prescriptionsState.sortKey === key) {
          prescriptionsState.sortOrder = prescriptionsState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          prescriptionsState.sortKey = key;
          prescriptionsState.sortOrder = 'asc';
        }
        updateContent(container);
      });
    });

    // Export Menu
    const exportBtn = container.querySelector('#export-menu-btn');
    const exportMenu = container.querySelector('#export-menu');
    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
                exportMenu.classList.add('hidden');
            }
        });
    }

    container.querySelector('#export-csv')?.addEventListener('click', () => {
        const prescriptions = getPrescriptions();
        const columns = [
            { key: 'medications', header: t('medications') },
            { key: 'dosage', header: t('dosage') },
            { key: 'date', header: t('date') }
        ];
        exportToCSV(prescriptions, 'prescriptions-export', columns);
        exportMenu.classList.add('hidden');
    });

    container.querySelector('#export-pdf')?.addEventListener('click', () => {
        const prescriptions = getPrescriptions();
        const columns = [
            { key: 'date', header: t('date') },
            { key: 'patientName', header: t('patient') },
            { key: 'doctorName', header: t('doctor') },
            { key: 'medications', header: t('medications') },
            { key: 'dosage', header: t('dosage') }
        ];
        const enrichedPrescriptions = prescriptions.map(p => {
            const patient = getPatient(p.patientId);
            const doctor = getDoctor(p.doctorId);
            return {
                ...p,
                patientName: patient ? patient.fullName : t('unknown'),
                doctorName: doctor ? doctor.name : t('unknown')
            };
        });
        exportToPDF(enrichedPrescriptions, 'prescriptions-export', t('prescriptions'), columns);
        exportMenu.classList.add('hidden');
    });

    // Add Modal Open
    container.querySelector('#add-prescription-btn')?.addEventListener('click', () => {
        const modal = container.querySelector('#add-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });

    // Save Add
    container.querySelector('#save-add-btn')?.addEventListener('click', () => {
        const medications = container.querySelector('#add-medications').value;
        const dosage = container.querySelector('#add-dosage').value;
        const patientId = container.querySelector('#add-patient-id').value;
        const doctorId = container.querySelector('#add-doctor-id').value;
        const date = container.querySelector('#add-date').value;

        if (medications && patientId && doctorId && date) {
            addPrescription({ medications, dosage, patientId, doctorId, date });
            closeModals();
            updateContent(container);
        } else {
            alert(t('fillAllFields') || "Please fill all fields");
        }
    });

    // Save Edit
    container.querySelector('#save-edit-btn')?.addEventListener('click', () => {
        const id = container.querySelector('#edit-id').value;
        const medications = container.querySelector('#edit-medications').value;
        const dosage = container.querySelector('#edit-dosage').value;
        const patientId = container.querySelector('#edit-patient-id').value;
        const doctorId = container.querySelector('#edit-doctor-id').value;
        const date = container.querySelector('#edit-date').value;

        if (id && medications && patientId && doctorId && date) {
            updatePrescription(parseInt(id), { medications, dosage, patientId, doctorId, date });
            closeModals();
            updateContent(container);
        }
    });

    // View PDF Export
    container.querySelector('#view-export-pdf')?.addEventListener('click', () => {
         const modalContent = container.querySelector('#view-modal > div');
         // We might want to use a more specific ID if needed, but this targets the card
         if (modalContent) {
            // Get patient name for filename
            const patientName = container.querySelector('#view-patient').innerText;
            exportElementToPDF(modalContent, `prescription-${patientName.replace(/\s+/g, '-')}`);
         }
    });

    // Row Menu Actions (Delegation)
    container.querySelectorAll('button[data-action="menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const menu = document.getElementById(`prescription-menu-${id}`);
        
        // Close others
        if (prescriptionsState.activeMenuId && prescriptionsState.activeMenuId !== id) {
            const el = document.getElementById(`prescription-menu-${prescriptionsState.activeMenuId}`);
            if (el) el.classList.add('hidden');
        }

        if (menu) {
          const btnRect = btn.getBoundingClientRect();
          const isRTL = document.documentElement.dir === 'rtl';
          menu.classList.remove('hidden');
          menu.style.visibility = 'hidden';
          menu.style.top = `${btnRect.bottom + 8}px`;
          menu.style.left = `${isRTL ? btnRect.left : btnRect.right - 192}px`; // 192px ~ w-48
          // Measure then adjust for viewport overflow
          requestAnimationFrame(() => {
            const mw = menu.offsetWidth;
            const mh = menu.offsetHeight;
            let top = btnRect.bottom + 8;
            if (top + mh > window.innerHeight) {
              top = btnRect.top - mh - 8;
            }
            let left = isRTL ? btnRect.left : btnRect.right - mw;
            if (left < 8) left = 8;
            if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
            menu.style.visibility = 'visible';
            activeMenuAnchor = btn;
            activeMenuEl = menu;
          });
          
          prescriptionsState.activeMenuId = id;
        }
      });
    });

    // Menu item clicks (Edit/View/Delete)
    // Since menus are re-rendered, we can attach listeners to the container
    // asking if click target is inside a menu button
    container.addEventListener('click', (e) => {
        const actionBtn = e.target.closest('button[data-action]');
        if (!actionBtn) return;

        const action = actionBtn.getAttribute('data-action');
        const id = actionBtn.getAttribute('data-id');

        // Close menu when an action is clicked
        const menu = container.querySelector(`#prescription-menu-${id}`);
        if (menu) menu.classList.add('hidden');
        activeMenuEl = null;
        activeMenuAnchor = null;

        if (action === 'view') {
            const p = getPrescription(id);
            if (p) {
                const patient = getPatient(p.patientId);
                const doctor = getDoctor(p.doctorId);

                container.querySelector('#view-patient').innerText = patient ? patient.fullName : t('unknown');
                container.querySelector('#view-doctor').innerText = doctor ? doctor.name : t('unknown');
                container.querySelector('#view-date').innerText = p.date;
                container.querySelector('#view-dosage').innerText = p.dosage;
                container.querySelector('#view-medications').innerText = p.medications;

                const modal = container.querySelector('#view-modal');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            closeMenusHandler();
        } else if (action === 'edit') {
            const p = getPrescription(id);
            if (p) {
                container.querySelector('#edit-id').value = p.id;
                container.querySelector('#edit-medications').value = p.medications;
                container.querySelector('#edit-dosage').value = p.dosage;
                container.querySelector('#edit-date').value = p.date;

                // Selects
                const pSelect = container.querySelector('#edit-patient-id');
                if (pSelect) pSelect.value = p.patientId;
                const dSelect = container.querySelector('#edit-doctor-id');
                if (dSelect) dSelect.value = p.doctorId;

                const modal = container.querySelector('#edit-modal');
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
            closeMenusHandler();
        } else if (action === 'delete') {
            if (confirm(t('confirmDelete'))) {
                deletePrescription(id);
                updateContent(container);
            }
            closeMenusHandler();
        }
    });
  }

  window.App = window.App || {};
  App.Pages = App.Pages || {};
  App.Pages.Prescriptions = { render };
})();