(() => {
function getPatients() { return App.Services.Data.getPatients(); }
function getPatient(id) { return App.Services.Data.getPatient(id); }
function addPatient(p) { return App.Services.Data.addPatient(p); }
function updatePatient(id, updates) { return App.Services.Data.updatePatient(id, updates); }
function deletePatient(id) { return App.Services.Data.deletePatient(id); }
function getServices() { return App.Services.Data.getServices(); }
function t(key) { return App.Services.I18n.t(key); }
function exportToCSV(data, filename, columns) { return App.Services.Utils.exportToCSV(data, filename, columns); }
function exportToPDF(data, filename, title, columns) { return App.Services.Utils.exportToPDF(data, filename, title, columns); }

let patientsState = {
  search: "",
  sortKey: null,
  sortOrder: "asc",
  page: 1,
  pageSize: 10,
  filterServiceId: ""
};

function render() {
  const container = document.createElement('div');
  container.className = "patients-page";
  updateContent(container);
  return container;
}

function updateContent(container) {
  container.innerHTML = generateHTML();
  lucide.createIcons();
  attachListeners(container);
  
  // Restore focus if searching
  if (patientsState.search) {
      const searchInput = container.querySelector("#search-input");
      if (searchInput) {
          searchInput.focus();
          searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
  }
}

function generateHTML() {
  const allPatients = getPatients();
  const services = getServices();
  const isRTL = document.documentElement.dir === 'rtl';
  const gapClass = isRTL ? 'ml-2' : 'mr-2';
  
  // Filter
  let filteredPatients = allPatients.filter(patient => {
    const searchLower = patientsState.search.toLowerCase();
    const matchesSearch = (
      patient.firstName.toLowerCase().includes(searchLower) ||
      patient.lastName.toLowerCase().includes(searchLower) ||
      patient.email.toLowerCase().includes(searchLower) ||
      patient.phone.includes(searchLower)
    );
    const matchesService = patientsState.filterServiceId ? String(patient.serviceId || "") === String(patientsState.filterServiceId) : true;
    return matchesSearch && matchesService;
  });

  // Sort
  if (patientsState.sortKey) {
    filteredPatients.sort((a, b) => {
      const aVal = String(a[patientsState.sortKey]).toLowerCase();
      const bVal = String(b[patientsState.sortKey]).toLowerCase();
      if (patientsState.sortOrder === 'asc') return aVal.localeCompare(bVal);
      return bVal.localeCompare(aVal);
    });
  }

  // Paginate
  const totalPages = Math.ceil(filteredPatients.length / patientsState.pageSize);
  const startIndex = (patientsState.page - 1) * patientsState.pageSize;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + patientsState.pageSize);

  const renderSortIcon = (key) => {
    return '<i data-lucide="arrow-up-down" class="w-4 h-4 ml-1"></i>';
  };
  const prevIcon = isRTL ? 'chevron-right' : 'chevron-left';
  const nextIcon = isRTL ? 'chevron-left' : 'chevron-right';
  let pagesToShow = [];
  if (totalPages <= 7) {
    pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    pagesToShow = [1];
    if (patientsState.page > 3) pagesToShow.push('ellipsis');
    const start = Math.max(2, patientsState.page - 1);
    const end = Math.min(totalPages - 1, patientsState.page + 1);
    for (let p = start; p <= end; p++) pagesToShow.push(p);
    if (patientsState.page < totalPages - 2) pagesToShow.push('ellipsis');
    pagesToShow.push(totalPages);
  }
  const pageButtons = pagesToShow.map(p => {
    if (p === 'ellipsis') {
      return `<span class="px-2 text-muted-foreground">...</span>`;
    }
    const isActive = patientsState.page === p;
    const bgClass = isActive ? 'bg-primary text-primary-foreground' : 'bg-white';
    const hoverClass = isActive ? 'hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground';
    return `
      <button data-page="${p}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input ${bgClass} ${hoverClass} h-8 min-w-8 px-2">
        ${p}
      </button>
    `;
  }).join('');

  return `
    <div class="space-y-6 animate-fade-in">
      <h1 class="text-3xl font-heading font-bold">${t("patients")}</h1>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <div class="flex flex-1 gap-2 max-w-lg">
          <div class="relative flex-1">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
            <input 
              type="text" 
              id="search-input" 
              placeholder="${t("search")}" 
              value="${patientsState.search}"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <select id="service-filter" class="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="">${t("all")}</option>
            ${services.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
          </select>
        </div>
        <div class="flex gap-2">
          <div class="relative inline-block text-left">
            <button id="export-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-white hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
              <i data-lucide="download" class="w-4 h-4 ${gapClass}"></i>
              ${t("export")}
            </button>
            <div id="export-menu" class="hidden absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
              <div class="py-1">
                <button id="export-csv" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">${t("exportCSV")}</button>
                <button id="export-pdf" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">${t("exportPDF")}</button>
              </div>
            </div>
          </div>
          <button id="add-patient-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-9 px-4 py-2">
            <i data-lucide="plus" class="w-4 h-4 ${gapClass}"></i>
            ${t("add")}
          </button>
        </div>
      </div>

      <div class="rounded-lg border border-border bg-card overflow-visible">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-secondary/50 border-b border-border">
              <tr class="text-left">
                <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="firstName">
                  <div class="flex items-center">${t("firstName")} ${renderSortIcon('firstName')}</div>
                </th>
                <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="lastName">
                  <div class="flex items-center">${t("lastName")} ${renderSortIcon('lastName')}</div>
                </th>
                <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="email">
                  <div class="flex items-center">${t("email")} ${renderSortIcon('email')}</div>
                </th>
                <th class="h-12 px-4 font-medium text-muted-foreground">${t("phone")}</th>
                <th class="h-12 px-4 font-medium text-muted-foreground">${t("bloodGroup")}</th>
                <th class="h-12 px-4 font-medium text-muted-foreground text-right">${t("actions")}</th>
              </tr>
            </thead>
            <tbody id="patients-table-body" class="divide-y divide-border">
              ${paginatedPatients.map(patient => `
                <tr class="hover:bg-muted transition-colors group">
                  <td class="p-4 font-medium">${patient.firstName}</td>
                  <td class="p-4">${patient.lastName}</td>
                  <td class="p-4 text-muted-foreground">${patient.email}</td>
                  <td class="p-4 text-muted-foreground">${patient.phone}</td>
                  <td class="p-4">
                    <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                      ${patient.bloodGroup}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <div class="relative inline-block text-left">
                      <button data-action="menu" data-id="${patient.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
                        <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                      </button>
                      <div id="patient-menu-${patient.id}" class="hidden fixed w-48 rounded-md shadow-lg bg-white border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                        <div class="py-1">
                          <button data-action="view" data-id="${patient.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <i data-lucide="eye" class="w-4 h-4 ${gapClass}"></i>${t('view')}
                          </button>
                          <button data-action="edit" data-id="${patient.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                            <i data-lucide="pencil" class="w-4 h-4 ${gapClass}"></i>${t('edit')}
                          </button>
                          <button data-action="delete" data-id="${patient.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left transition-colors flex items-center text-destructive hover:bg-destructive/10">
                            <i data-lucide="trash-2" class="w-4 h-4 ${gapClass}"></i>${t('delete')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              `).join('')}
              ${paginatedPatients.length === 0 ? `
                <tr>
                  <td colspan="6" class="p-8 text-center text-muted-foreground">
                    ${t("noPatients")}
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-2 text-sm text-muted-foreground">
        <div class="text-center">${t("showing")} ${Math.min(startIndex + 1, filteredPatients.length)}-${Math.min(startIndex + patientsState.pageSize, filteredPatients.length)} ${t("of")} ${filteredPatients.length}</div>
        ${totalPages > 1 ? `
        <div id="pagination" class="flex items-center justify-center gap-2">
          <button id="prev-page" ${patientsState.page === 1 ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
            <i data-lucide="${prevIcon}" class="w-4 h-4"></i>
          </button>
          ${pageButtons}
          <button id="next-page" ${patientsState.page >= totalPages ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
            <i data-lucide="${nextIcon}" class="w-4 h-4"></i>
          </button>
        </div>
        ` : ''}
      </div>

      <!-- Patient Form Modal -->
      <div id="patient-modal" class="fixed inset-0 z-[1001] hidden items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white border border-border rounded-xl shadow-glow animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 id="patient-modal-title" class="text-lg font-semibold">${t("addPatient")}</h2>
            <button id="patient-modal-close" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <form id="patient-form" class="p-6 space-y-4">
            <input type="hidden" name="id" />
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">${t("firstName")}</label>
                <input name="firstName" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">${t("lastName")}</label>
                <input name="lastName" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">${t("email")}</label>
                <input name="email" type="email" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">${t("phone")}</label>
                <input name="phone" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm font-medium">${t("dateOfBirth")}</label>
                <input name="dateOfBirth" type="date" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div class="space-y-2">
                <label class="text-sm font-medium">${t("gender")}</label>
                <select name="gender" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="male">${t("male")}</option>
                  <option value="female">${t("female")}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
               <div class="space-y-2">
                <label class="text-sm font-medium">${t("bloodGroup")}</label>
                <select name="bloodGroup" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
               <div class="space-y-2">
                <label class="text-sm font-medium">${t("service")}</label>
                <select name="serviceId" class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                   <option value="">${t("selectService")}</option>
                   ${getServices().map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">${t("address")}</label>
              <input name="address" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </div>
            
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" id="patient-modal-cancel" class="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">${t("cancel")}</button>
              <button type="submit" class="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">${t("save")}</button>
            </div>
          </form>
        </div>
      </div>

       <!-- View Details Modal -->
      <div id="patient-details-modal" class="fixed inset-0 z-[1001] hidden items-center justify-center p-4">
        <div class="w-full max-w-lg bg-white border border-border rounded-xl shadow-glow animate-fade-in">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold">${t("patientDetails")}</h2>
            <button id="patient-details-close-x" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="patient-details-content" class="p-6 space-y-4">
            <!-- Content injected via JS -->
          </div>
          <div class="flex justify-end gap-3 p-6 border-t border-border">
            <button id="patient-details-export" class="h-9 px-3 rounded-md border border-input bg-white hover:bg-accent hover:text-accent-foreground text-sm font-medium inline-flex items-center">
              <i data-lucide="file-text" class="w-4 h-4 ${gapClass}"></i>${t("exportPDF")}
            </button>
            <button id="patient-details-close" class="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">
              ${t("close")}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
let closeMenusHandler = null;

function attachListeners(container) {
  const modal = container.querySelector("#patient-modal");
  const detailsModal = container.querySelector("#patient-details-modal");
  const form = container.querySelector("#patient-form");
  const modalTitle = container.querySelector("#patient-modal-title");
  let activeMenuAnchor = null;
  let activeMenuEl = null;
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
  const onAnyScroll = () => repositionActiveMenu();
  window.addEventListener("scroll", onAnyScroll, { passive: true, capture: true });
  window.addEventListener("resize", onAnyScroll);
  
  // Export Dropdown Logic
  const exportBtn = container.querySelector("#export-btn");
  const exportMenu = container.querySelector("#export-menu");
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportMenu.classList.toggle("hidden");
    });
    
    // Cleanup previous listener if exists
    if (closeMenusHandler) {
        document.removeEventListener("click", closeMenusHandler);
    }
    
    closeMenusHandler = (e) => {
      // Close export menu
      if (exportBtn && !exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
        exportMenu.classList.add("hidden");
      }
      
      // Close patient menus
      if (!e.target.closest('button[data-action="menu"]')) {
        const menus = container.querySelectorAll('[id^="patient-menu-"]');
        menus.forEach(m => m.classList.add("hidden"));
      }
    };
    
    document.addEventListener("click", closeMenusHandler);

    container.querySelector("#export-csv").addEventListener("click", () => {
      const columns = [
        { key: 'firstName', header: t('firstName') },
        { key: 'lastName', header: t('lastName') },
        { key: 'email', header: t('email') },
        { key: 'phone', header: t('phone') },
        { key: 'bloodGroup', header: t('bloodGroup') }
      ];
      exportToCSV(getPatients(), 'patients', columns);
      exportMenu.classList.add("hidden");
    });

    container.querySelector("#export-pdf").addEventListener("click", () => {
      const columns = [
        { key: 'firstName', header: t('firstName') },
        { key: 'lastName', header: t('lastName') },
        { key: 'email', header: t('email') },
        { key: 'phone', header: t('phone') },
        { key: 'bloodGroup', header: t('bloodGroup') }
      ];
      exportToPDF(getPatients(), 'patients', t('patients'), columns);
      exportMenu.classList.add("hidden");
    });
  }

  // Search
  const searchInput = container.querySelector("#search-input");
  searchInput.addEventListener("input", (e) => {
    patientsState.search = e.target.value;
    patientsState.page = 1; 
    updateContent(container);
  });
  
  // Service Filter
  const serviceFilter = container.querySelector("#service-filter");
  if (serviceFilter) {
    serviceFilter.addEventListener("change", (e) => {
      patientsState.filterServiceId = e.target.value;
      patientsState.page = 1;
      updateContent(container);
    });
  }

  // Sort
  container.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const key = th.getAttribute("data-sort");
      if (patientsState.sortKey === key) {
        patientsState.sortOrder = patientsState.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        patientsState.sortKey = key;
        patientsState.sortOrder = 'asc';
      }
      updateContent(container);
    });
  });

  // Pagination
  const prevBtn = container.querySelector("#prev-page");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
        if (patientsState.page > 1) {
        patientsState.page--;
        updateContent(container);
        }
    });
  }

  const nextBtn = container.querySelector("#next-page");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
        patientsState.page++;
        updateContent(container);
    });
  }
  
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.getAttribute('data-page'), 10);
      if (!isNaN(page)) {
        patientsState.page = page;
        updateContent(container);
      }
    });
  });

  // Open Add Modal
  container.querySelector("#add-patient-btn").addEventListener("click", () => {
    form.reset();
    form.elements["id"].value = "";
    modalTitle.textContent = t("addPatient");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    const overlay = document.getElementById("global-overlay");
    overlay?.classList.remove("hidden");
  });

  // Close Modals
  const closeModals = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    detailsModal.classList.add("hidden");
    detailsModal.classList.remove("flex");
    const overlay = document.getElementById("global-overlay");
    overlay?.classList.add("hidden");
  };
  
  // Close on backdrop click (blank spaces)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModals();
    }
  });
  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) {
      closeModals();
    }
  });

  container.querySelector("#patient-modal-close").addEventListener("click", closeModals);
  container.querySelector("#patient-modal-cancel").addEventListener("click", closeModals);
  container.querySelector("#patient-details-close").addEventListener("click", closeModals);
  container.querySelector("#patient-details-close-x")?.addEventListener("click", closeModals);

  // Form Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    if (data.id) {
      updatePatient(data.id, data);
    } else {
      addPatient({ ...data, registrationDate: new Date().toISOString().split('T')[0] });
    }
    
    closeModals();
    updateContent(container);
  });

  // Table Actions (Delegation)
  container.querySelector("#patients-table-body").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (action === "menu") {
      e.stopPropagation();
      // Close all other menus
      container.querySelectorAll('[id^="patient-menu-"]').forEach(m => {
        if (m.id !== `patient-menu-${id}`) m.classList.add("hidden");
      });
      const menu = container.querySelector(`#patient-menu-${id}`);
      if (menu) {
        const btnRect = btn.getBoundingClientRect();
        const isRTL = document.documentElement.dir === 'rtl';
        menu.classList.remove("hidden");
        menu.style.visibility = "hidden";
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
          menu.style.visibility = "visible";
          activeMenuAnchor = btn;
          activeMenuEl = menu;
        });
      }
      return;
    }

    // Close menu when an action is clicked
    const menu = container.querySelector(`#patient-menu-${id}`);
    if (menu) menu.classList.add("hidden");
    activeMenuEl = null;
    activeMenuAnchor = null;
    
    const patient = getPatient(id);
    
    if (action === "delete") {
      if (confirm(t("confirmDelete"))) {
        deletePatient(id);
        updateContent(container);
      }
    } else if (action === "edit") {
      form.reset();
      modalTitle.textContent = t("editPatient");
      // Fill form
      for (const [key, value] of Object.entries(patient)) {
        if (form.elements[key]) form.elements[key].value = value;
      }
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      const overlay = document.getElementById("global-overlay");
      overlay?.classList.remove("hidden");
    } else if (action === "view") {
      const content = container.querySelector("#patient-details-content");
      content.innerHTML = `
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="text-muted-foreground">${t("fullName")}:</span> <span class="font-medium block">${patient.firstName} ${patient.lastName}</span></div>
          <div><span class="text-muted-foreground">${t("email")}:</span> <span class="font-medium block">${patient.email}</span></div>
          <div><span class="text-muted-foreground">${t("phone")}:</span> <span class="font-medium block">${patient.phone}</span></div>
          <div><span class="text-muted-foreground">${t("bloodGroup")}:</span> <span class="font-medium block">${patient.bloodGroup}</span></div>
          <div><span class="text-muted-foreground">${t("gender")}:</span> <span class="font-medium block capitalize">${patient.gender}</span></div>
          <div><span class="text-muted-foreground">${t("dateOfBirth")}:</span> <span class="font-medium block">${patient.dateOfBirth}</span></div>
          <div class="col-span-2"><span class="text-muted-foreground">${t("address")}:</span> <span class="font-medium block">${patient.address}</span></div>
        </div>
      `;
      detailsModal.classList.remove("hidden");
      detailsModal.classList.add("flex");
      const exportBtn = detailsModal.querySelector('#patient-details-export');
      exportBtn?.addEventListener('click', () => {
        const columns = [
          { key: 'firstName', header: t('firstName') },
          { key: 'lastName', header: t('lastName') },
          { key: 'email', header: t('email') },
          { key: 'phone', header: t('phone') },
          { key: 'bloodGroup', header: t('bloodGroup') },
          { key: 'gender', header: t('gender') },
          { key: 'dateOfBirth', header: t('dateOfBirth') },
          { key: 'address', header: t('address') },
        ];
        const baseName = `${String(patient.firstName || '').trim()}_${String(patient.lastName || '').trim()}`.replace(/\s+/g, '_').replace(/[^\w\-]/g, '') || 'patient';
        App.Services.Utils.exportToPDF([patient], baseName, t('patientDetails'), columns);
      });
      const overlay = document.getElementById("global-overlay");
      overlay?.classList.remove("hidden");
    }
  });
}

window.App = window.App || {};
App.Pages = App.Pages || {};
App.Pages.Patients = { render };
})();
