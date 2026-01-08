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

  // State
  const prescriptionsState = {
    page: 1,
    itemsPerPage: 10,
    searchQuery: "",
    filterDoctorId: "", // New filter
    sortKey: "date",
    sortOrder: "desc",
    isAddModalOpen: false,
    isEditModalOpen: false,
    isViewModalOpen: false,
    selectedPrescription: null,
    activeMenuId: null
  };

  let activeMenuAnchor = null;
  let activeMenuEl = null;

  function render() {
    const container = document.createElement('div');
    container.id = 'prescriptions-page';
    container.className = 'space-y-6 animate-fade-in pb-8';
    updateContent(container);
    return container;
  }

  function updateContent(container) {
    container.innerHTML = generateHTML();
    attachListeners(container);
  }

  function generateHTML() {
    const prescriptions = getPrescriptions();
    const patients = getPatients();
    const doctors = getDoctors();
    const isRTL = document.documentElement.dir === 'rtl';
    const gapClass = isRTL ? 'ml-2' : 'mr-2';

    // Filtering
    const filtered = prescriptions.filter(p => {
      const patient = getPatient(p.patientId);
      const doctor = getDoctor(p.doctorId);
      const searchStr = (
        (p.medications || "") + " " + 
        (patient ? patient.fullName : "") + " " + 
        (doctor ? doctor.name : "")
      ).toLowerCase();
      
      const matchesSearch = searchStr.includes(prescriptionsState.searchQuery.toLowerCase());
      const matchesDoctor = prescriptionsState.filterDoctorId ? p.doctorId === prescriptionsState.filterDoctorId : true;
      
      return matchesSearch && matchesDoctor;
    });

    // Pagination
    const totalPages = Math.ceil(filtered.length / prescriptionsState.itemsPerPage);
    if (prescriptionsState.page > totalPages) prescriptionsState.page = totalPages || 1;
    
    const startIdx = (prescriptionsState.page - 1) * prescriptionsState.itemsPerPage;
    const paginated = filtered.slice(startIdx, startIdx + prescriptionsState.itemsPerPage);

    // Pagination HTML
    let paginationHTML = '';
    if (totalPages > 1) {
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
            if (p === 'ellipsis') return `<span class="px-2 text-muted-foreground">...</span>`;
            const isActive = prescriptionsState.page === p;
            return `
                <button data-page="${p}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input ${isActive ? 'bg-primary text-primary-foreground' : 'bg-white hover:bg-accent hover:text-accent-foreground'} h-8 min-w-8 px-2">
                    ${p}
                </button>
            `;
        }).join('');

        paginationHTML = `
            <div class="flex items-center justify-center space-x-2 py-4">
                <button data-page="prev" ${prescriptionsState.page === 1 ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
                    <i data-lucide="${isRTL ? 'chevron-right' : 'chevron-left'}" class="w-4 h-4"></i>
                </button>
                ${pageButtons}
                <button data-page="next" ${prescriptionsState.page === totalPages ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
                    <i data-lucide="${isRTL ? 'chevron-left' : 'chevron-right'}" class="w-4 h-4"></i>
                </button>
            </div>
        `;
    }

    // Doctor Filter Options
    const doctorOptions = doctors.map(d => 
        `<option value="${d.id}" ${prescriptionsState.filterDoctorId === d.id.toString() ? 'selected' : ''}>${d.name}</option>`
    ).join('');

    return `
      <div class="space-y-6 animate-fade-in">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 class="text-3xl font-heading font-bold">${t("prescriptions")}</h1>
            <div class="flex gap-2">
                <button id="add-prescription-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                    <i data-lucide="plus" class="w-4 h-4 ${gapClass}"></i>
                    ${t("addPrescription")}
                </button>
                <div class="relative inline-block text-left">
                    <button id="export-menu-btn" type="button" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4">
                        <i data-lucide="download" class="w-4 h-4 ${gapClass}"></i>
                        ${t("export")}
                    </button>
                    <div id="export-menu" class="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white border border-border ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                        <div class="py-1">
                            <button id="export-csv" class="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                                ${t("exportCSV")}
                            </button>
                            <button id="export-pdf" class="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground">
                                ${t("exportPDF")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-between">
            <div class="flex flex-1 gap-2 max-w-lg">
                <div class="relative flex-1">
                    <i data-lucide="search" class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"></i>
                    <input
                        type="text"
                        id="search-input"
                        placeholder="${t("search")}"
                        value="${prescriptionsState.searchQuery}"
                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                </div>
                <select id="doctor-filter" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="">${t("doctor")}: ${t("total")}</option>
                    ${doctorOptions}
                </select>
            </div>
        </div>

        <div class="rounded-md border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead class="bg-muted/50 text-muted-foreground">
                <tr>
                  <th class="h-12 px-4 align-middle font-medium">${t("medications")}</th>
                  <th class="h-12 px-4 align-middle font-medium">${t("patient")}</th>
                  <th class="h-12 px-4 align-middle font-medium">${t("doctor")}</th>
                  <th class="h-12 px-4 align-middle font-medium">${t("date")}</th>
                  <th class="h-12 px-4 align-middle font-medium text-right">${t("actions")}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                ${paginated.length > 0 ? paginated.map(p => {
                  const patient = getPatient(p.patientId);
                  const doctor = getDoctor(p.doctorId);
                  return `
                  <tr class="hover:bg-muted/50 transition-colors">
                    <td class="p-4 align-middle font-medium text-foreground">${p.medications}</td>
                    <td class="p-4 align-middle">${patient ? patient.fullName : t("unknown")}</td>
                    <td class="p-4 align-middle">${doctor ? doctor.name : t("unknown")}</td>
                    <td class="p-4 align-middle">${p.date}</td>
                    <td class="p-4 align-middle text-right">
                      <div class="relative inline-block text-left">
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
                    <td colspan="5" class="p-8 text-center text-muted-foreground">
                      ${t("noPrescriptions")}
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
        ${paginationHTML}
        ${renderModals(isRTL)}
      </div>
    `;
  }

  function renderModals(isRTL) {
    const gapClass = isRTL ? 'ml-2' : 'mr-2';
    const patients = getPatients();
    const doctors = getDoctors();
    
    // Add Modal
    let addModalHTML = '';
    if (prescriptionsState.isAddModalOpen) {
      addModalHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 global-overlay">
          <div class="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between p-4 border-b">
              <h2 class="text-lg font-semibold">${t('addPrescription')}</h2>
              <button data-action="close-modal" class="text-muted-foreground hover:text-foreground">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('medications')}</label>
                <input type="text" id="add-medications" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('dosage')}</label>
                <input type="text" id="add-dosage" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('patient')}</label>
                <select id="add-patient-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    ${patients.map(p => `<option value="${p.id}">${p.fullName}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('doctor')}</label>
                <select id="add-doctor-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('date')}</label>
                <input type="date" id="add-date" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              </div>
            </div>
            <div class="flex justify-end gap-2 p-4 border-t bg-muted/50">
              <button data-action="close-modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
                ${t('cancel')}
              </button>
              <button id="save-add-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                ${t('save')}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // Edit Modal
    let editModalHTML = '';
    if (prescriptionsState.isEditModalOpen && prescriptionsState.selectedPrescription) {
      const p = prescriptionsState.selectedPrescription;
      editModalHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 global-overlay">
          <div class="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between p-4 border-b">
              <h2 class="text-lg font-semibold">${t('editPrescription')}</h2>
              <button data-action="close-modal" class="text-muted-foreground hover:text-foreground">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>
            </div>
            <div class="p-4 space-y-4">
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('medications')}</label>
                <input type="text" id="edit-medications" value="${p.medications}" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('dosage')}</label>
                <input type="text" id="edit-dosage" value="${p.dosage}" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('patient')}</label>
                <select id="edit-patient-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    ${patients.map(pat => `<option value="${pat.id}" ${pat.id == p.patientId ? 'selected' : ''}>${pat.fullName}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('doctor')}</label>
                <select id="edit-doctor-id" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    ${doctors.map(d => `<option value="${d.id}" ${d.id == p.doctorId ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t('date')}</label>
                <input type="date" id="edit-date" value="${p.date}" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              </div>
            </div>
            <div class="flex justify-end gap-2 p-4 border-t bg-muted/50">
              <button data-action="close-modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
                ${t('cancel')}
              </button>
              <button id="save-edit-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                ${t('save')}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // View Modal
    let viewModalHTML = '';
    if (prescriptionsState.isViewModalOpen && prescriptionsState.selectedPrescription) {
      const p = prescriptionsState.selectedPrescription;
      const patient = getPatient(p.patientId);
      const doctor = getDoctor(p.doctorId);
      viewModalHTML = `
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 global-overlay">
          <div class="bg-background rounded-lg shadow-lg w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onclick="event.stopPropagation()">
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
                  <p class="text-base">${patient ? patient.fullName : t('unknown')}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-muted-foreground">${t('doctor')}</label>
                  <p class="text-base">${doctor ? doctor.name : t('unknown')}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-muted-foreground">${t('date')}</label>
                  <p class="text-base">${p.date}</p>
                </div>
                 <div>
                  <label class="text-sm font-medium text-muted-foreground">${t('dosage')}</label>
                  <p class="text-base">${p.dosage}</p>
                </div>
                <div class="col-span-2">
                  <label class="text-sm font-medium text-muted-foreground">${t('medications')}</label>
                  <p class="text-base font-medium">${p.medications}</p>
                </div>
              </div>
            </div>
            <div class="flex justify-end gap-2 p-4 border-t bg-muted/50">
               <button id="view-export-pdf" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
                <i data-lucide="file-down" class="w-4 h-4 ${gapClass}"></i>
                ${t('exportPDF')}
              </button>
              <button data-action="close-modal" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                ${t('close')}
              </button>
            </div>
          </div>
        </div>
      `;
    }

    return addModalHTML + editModalHTML + viewModalHTML;
  }

  function attachListeners(container) {
    // Lucide icons
    if (window.lucide) {
      window.lucide.createIcons({
        root: container
      });
    }

    // Reposition active menu function
    const repositionActiveMenu = () => {
        if (!activeMenuAnchor || !activeMenuEl || activeMenuEl.classList.contains("hidden")) return;
        const btnRect = activeMenuAnchor.getBoundingClientRect();
        const isRTL = document.documentElement.dir === 'rtl';
        
        // Default size approximation if not yet rendered
        const mw = activeMenuEl.offsetWidth || 192; 
        const mh = activeMenuEl.offsetHeight || 120;
        
        let top = btnRect.bottom + 8;
        // Flip up if near bottom
        if (top + mh > window.innerHeight) {
            top = btnRect.top - mh - 8;
        }

        let left = isRTL ? btnRect.left : btnRect.right - mw;
        // Keep within horizontal bounds
        if (left < 8) left = 8;
        if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;

        activeMenuEl.style.top = `${top}px`;
        activeMenuEl.style.left = `${left}px`;
    };

    // Close modals helper
    const closeModals = () => {
      prescriptionsState.isAddModalOpen = false;
      prescriptionsState.isEditModalOpen = false;
      prescriptionsState.isViewModalOpen = false;
      prescriptionsState.selectedPrescription = null;
      updateContent(container);
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

    // Scroll/Resize listener for menus
    const closeMenusHandler = () => {
        if (prescriptionsState.activeMenuId) {
            const el = document.getElementById(`prescription-menu-${prescriptionsState.activeMenuId}`);
            if (el) el.classList.add('hidden');
            prescriptionsState.activeMenuId = null;
            activeMenuAnchor = null;
            activeMenuEl = null;
        }
    };
    window.addEventListener('scroll', closeMenusHandler, { capture: true, passive: true });
    window.addEventListener('resize', closeMenusHandler, { passive: true });

    // Search & Filter
    const searchInput = container.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        prescriptionsState.searchQuery = e.target.value;
        prescriptionsState.page = 1;
        updateContent(container);
        // Restore focus
        const newSearch = container.querySelector('#search-input');
        if (newSearch) {
            newSearch.focus();
            newSearch.setSelectionRange(newSearch.value.length, newSearch.value.length);
        }
      });
    }

    const doctorFilter = container.querySelector('#doctor-filter');
    if (doctorFilter) {
        doctorFilter.addEventListener('change', (e) => {
            prescriptionsState.filterDoctorId = e.target.value;
            prescriptionsState.page = 1;
            updateContent(container);
        });
    }

    // Sorting
    container.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const key = th.getAttribute('data-sort');
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
        exportToCSV(prescriptions, 'prescriptions-export', ['medications', 'dosage', 'date']);
        exportMenu.classList.add('hidden');
    });

    container.querySelector('#export-pdf')?.addEventListener('click', () => {
        const prescriptions = getPrescriptions();
        exportToPDF(prescriptions, 'prescriptions-export', 'Prescriptions List', ['medications', 'dosage', 'date']);
        exportMenu.classList.add('hidden');
    });

    // Pagination
    container.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.getAttribute('data-page');
        if (p === 'prev') {
          if (prescriptionsState.page > 1) {
            prescriptionsState.page--;
            updateContent(container);
          }
        } else if (p === 'next') {
          const totalPages = Math.ceil(getPrescriptions().length / prescriptionsState.itemsPerPage); // Approximate for now, simplified
          if (prescriptionsState.page < totalPages) { // logic improvement needed if filtered
             prescriptionsState.page++;
             updateContent(container);
          }
        } else {
          prescriptionsState.page = parseInt(p);
          updateContent(container);
        }
      });
    });

    // Add Modal Open
    container.querySelector('#add-prescription-btn')?.addEventListener('click', () => {
        prescriptionsState.isAddModalOpen = true;
        updateContent(container);
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
            prescriptionsState.isAddModalOpen = false;
            updateContent(container);
        } else {
            alert(t('fillAllFields') || "Please fill all fields");
        }
    });

    // Save Edit
    container.querySelector('#save-edit-btn')?.addEventListener('click', () => {
        if (!prescriptionsState.selectedPrescription) return;
        const medications = container.querySelector('#edit-medications').value;
        const dosage = container.querySelector('#edit-dosage').value;
        const patientId = container.querySelector('#edit-patient-id').value;
        const doctorId = container.querySelector('#edit-doctor-id').value;
        const date = container.querySelector('#edit-date').value;

        if (medications && patientId && doctorId && date) {
            updatePrescription(prescriptionsState.selectedPrescription.id, { medications, dosage, patientId, doctorId, date });
            prescriptionsState.isEditModalOpen = false;
            prescriptionsState.selectedPrescription = null;
            updateContent(container);
        }
    });

    // View PDF Export
    container.querySelector('#view-export-pdf')?.addEventListener('click', () => {
         if (prescriptionsState.selectedPrescription) {
             const p = prescriptionsState.selectedPrescription;
             exportToPDF([p], `prescription-${p.id}`, `Prescription Details`, ['medications', 'dosage', 'date']);
         }
    });

    // Row Menu Actions
    container.querySelectorAll('button[data-action="menu"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        
        // Close others
        container.querySelectorAll('[id^="prescription-menu-"]').forEach(el => el.classList.add('hidden'));
        
        const menu = container.querySelector(`#prescription-menu-${id}`);
        if (menu) {
            menu.classList.remove('hidden');
            prescriptionsState.activeMenuId = id;
            activeMenuAnchor = btn;
            activeMenuEl = menu;
            repositionActiveMenu();
        }
      });
    });

    // View Action
    container.querySelectorAll('button[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const p = getPrescription(id);
            if (p) {
                prescriptionsState.selectedPrescription = p;
                prescriptionsState.isViewModalOpen = true;
                prescriptionsState.activeMenuId = null; // Close menu
                updateContent(container);
            }
        });
    });

    // Edit Action
    container.querySelectorAll('button[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            const p = getPrescription(id);
            if (p) {
                prescriptionsState.selectedPrescription = p;
                prescriptionsState.isEditModalOpen = true;
                prescriptionsState.activeMenuId = null; // Close menu
                updateContent(container);
            }
        });
    });

    // Delete Action
    container.querySelectorAll('button[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (confirm(t("confirmDeletePrescription"))) {
                deletePrescription(id);
                prescriptionsState.activeMenuId = null;
                updateContent(container);
            }
        });
    });

    // Click outside to close menus
    document.addEventListener('click', (e) => {
       if (!e.target.closest('button[data-action="menu"]')) {
           container.querySelectorAll('[id^="prescription-menu-"]').forEach(el => el.classList.add('hidden'));
           prescriptionsState.activeMenuId = null;
       }
    });
  }

  window.App = window.App || {};
  App.Pages = App.Pages || {};
  App.Pages.Prescriptions = { render };
})();