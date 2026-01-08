(() => {
  function getDoctors() { return App.Services.Data.getDoctors(); }
  function getDoctor(id) { return App.Services.Data.getDoctor(id); }
  function addDoctor(d) { return App.Services.Data.addDoctor(d); }
  function updateDoctor(id, updates) { return App.Services.Data.updateDoctor(id, updates); }
  function deleteDoctor(id) { return App.Services.Data.deleteDoctor(id); }
  function t(key) { return App.Services.I18n.t(key); }
  function exportToCSV(data, filename, columns) { return App.Services.Utils.exportToCSV(data, filename, columns); }
  function exportToPDF(data, filename, title, columns) { return App.Services.Utils.exportToPDF(data, filename, title, columns); }

  let doctorsState = {
    search: "",
    sortKey: null,
    sortOrder: "asc",
    page: 1,
    pageSize: 10,
    isModalOpen: false,
    editingId: null,
    viewingId: null, // Added for view modal
    filterSpecialty: ""
  };

  function render() {
    const container = document.createElement('div');
    container.className = "doctors-page";
    updateContent(container);
    return container;
  }

  function updateContent(container) {
    container.innerHTML = generateHTML();
    lucide.createIcons();
    attachListeners(container);
    
    // Restore focus if searching
    if (doctorsState.search) {
        const searchInput = container.querySelector("#search-input");
        if (searchInput) {
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    }
  }

  function generateHTML() {
    const allDoctors = getDoctors();
    const isRTL = document.documentElement.dir === 'rtl';
    const gapClass = isRTL ? 'ml-2' : 'mr-2';
    const specialties = [...new Set(allDoctors.map(d => d.specialty))].filter(Boolean).sort();
    
    // Filter
    let filteredDoctors = allDoctors.filter(doctor => {
      const searchLower = doctorsState.search.toLowerCase();
      const matchesSearch = (
        doctor.firstName.toLowerCase().includes(searchLower) ||
        doctor.lastName.toLowerCase().includes(searchLower) ||
        doctor.email.toLowerCase().includes(searchLower) ||
        doctor.phone.includes(searchLower) ||
        doctor.specialty.toLowerCase().includes(searchLower)
      );
      const matchesSpecialty = doctorsState.filterSpecialty ? String(doctor.specialty) === String(doctorsState.filterSpecialty) : true;
      return matchesSearch && matchesSpecialty;
    });

    // Sort
    if (doctorsState.sortKey) {
      filteredDoctors.sort((a, b) => {
        const aVal = String(a[doctorsState.sortKey]).toLowerCase();
        const bVal = String(b[doctorsState.sortKey]).toLowerCase();
        if (doctorsState.sortOrder === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      });
    }

    // Paginate
    const totalPages = Math.ceil(filteredDoctors.length / doctorsState.pageSize);
    const startIndex = (doctorsState.page - 1) * doctorsState.pageSize;
    const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + doctorsState.pageSize);

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
      if (doctorsState.page > 3) pagesToShow.push('ellipsis');
      const start = Math.max(2, doctorsState.page - 1);
      const end = Math.min(totalPages - 1, doctorsState.page + 1);
      for (let p = start; p <= end; p++) pagesToShow.push(p);
      if (doctorsState.page < totalPages - 2) pagesToShow.push('ellipsis');
      pagesToShow.push(totalPages);
    }
    const pageButtons = pagesToShow.map(p => {
      if (p === 'ellipsis') {
        return `<span class="px-2 text-muted-foreground">...</span>`;
      }
      const isActive = doctorsState.page === p;
      const bgClass = isActive ? 'bg-primary text-primary-foreground' : 'bg-white';
      const hoverClass = isActive ? 'hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground';
      return `
        <button data-page="${p}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input ${bgClass} ${hoverClass} h-8 min-w-8 px-2">
          ${p}
        </button>
      `;
    }).join('');

    // Modal HTML (Add/Edit)
    const modalHTML = doctorsState.isModalOpen ? `
      <div class="fixed inset-0 z-[1001] flex items-center justify-center p-4" id="doctor-modal-overlay">
        <div class="w-full max-w-lg bg-white border border-border rounded-xl shadow-glow animate-fade-in max-h-[90vh] overflow-y-auto">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold">${doctorsState.editingId ? t("editDoctor") : t("addDoctor")}</h2>
            <button id="close-modal-x" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <form id="doctor-form" class="p-6 space-y-4">
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
            <div class="space-y-2">
              <label class="text-sm font-medium">${t("specialty")}</label>
              <select name="specialty" required class="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                 <option value="Cardiology">${t("cardiology")}</option>
                 <option value="Neurology">${t("neurology")}</option>
                 <option value="Pediatrics">${t("pediatrics")}</option>
                 <option value="Orthopedics">${t("orthopedics")}</option>
                 <option value="Dermatology">${t("dermatology")}</option>
                 <option value="General Medicine">${t("generalMedicine")}</option>
                 <option value="Surgery">${t("surgery")}</option>
                 <option value="Oncology">${t("oncology")}</option>
              </select>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button type="button" id="cancel-modal-btn" class="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors">${t("cancel")}</button>
              <button type="submit" class="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">${t("save")}</button>
            </div>
          </form>
        </div>
      </div>
    ` : '';

    // Details Modal HTML
    const viewDoctor = doctorsState.viewingId ? getDoctor(doctorsState.viewingId) : null;
    const detailsModalHTML = (doctorsState.viewingId && viewDoctor) ? `
      <div class="fixed inset-0 z-[1001] flex items-center justify-center p-4" id="doctor-details-overlay">
        <div class="w-full max-w-lg bg-white border border-border rounded-xl shadow-glow animate-fade-in">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold">${t("doctorDetails")}</h2>
            <button id="close-details-x" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-muted-foreground">${t("firstName")}</p>
                <p class="text-base">${viewDoctor.firstName}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">${t("lastName")}</p>
                <p class="text-base">${viewDoctor.lastName}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm font-medium text-muted-foreground">${t("email")}</p>
                <p class="text-base">${viewDoctor.email}</p>
              </div>
              <div>
                <p class="text-sm font-medium text-muted-foreground">${t("phone")}</p>
                <p class="text-base">${viewDoctor.phone}</p>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">${t("specialty")}</p>
              <p class="text-base">
                <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground">
                  ${t(viewDoctor.specialty.toLowerCase().replace(' ', '')) || viewDoctor.specialty}
                </span>
              </p>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button id="export-detail-pdf-btn" class="h-10 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors flex items-center">
                <i data-lucide="download" class="w-4 h-4 ${gapClass}"></i>
                ${t("exportPDF")}
              </button>
              <button id="close-details-btn" class="h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">${t("close")}</button>
            </div>
          </div>
        </div>
      </div>
    ` : '';

    return `
      <div class="space-y-6 animate-fade-in">
        <h1 class="text-3xl font-heading font-bold">${t("doctors")}</h1>
        
        <div class="flex flex-col sm:flex-row gap-4 justify-between">
          <div class="relative flex-1 max-w-sm">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
            <input 
              type="text" 
              id="search-input" 
              placeholder="${t("search")}" 
              value="${doctorsState.search}"
              class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
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
            <select id="specialty-filter" class="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option value="">${t("all")}</option>
              ${specialties.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
            <button id="add-doctor-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-9 px-4 py-2">
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
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="specialty">
                    <div class="flex items-center">${t("specialty")} ${renderSortIcon('specialty')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="email">
                    <div class="flex items-center">${t("email")} ${renderSortIcon('email')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground">${t("phone")}</th>
                  <th class="h-12 px-4 font-medium text-muted-foreground text-right">${t("actions")}</th>
                </tr>
              </thead>
              <tbody id="doctors-table-body" class="divide-y divide-border">
                ${paginatedDoctors.map(doctor => `
                  <tr class="hover:bg-muted transition-colors group">
                    <td class="p-4 font-medium">${doctor.firstName}</td>
                    <td class="p-4">${doctor.lastName}</td>
                    <td class="p-4">
                      <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                        ${t(doctor.specialty.toLowerCase().replace(' ', '')) || doctor.specialty}
                      </span>
                    </td>
                    <td class="p-4 text-muted-foreground">${doctor.email}</td>
                    <td class="p-4 text-muted-foreground">${doctor.phone}</td>
                    <td class="p-4 text-right">
                      <div class="relative inline-block text-left">
                        <button data-action="menu" data-id="${doctor.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
                          <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                        </button>
                        <div id="doctor-menu-${doctor.id}" class="hidden fixed w-48 rounded-md shadow-lg bg-white border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                          <div class="py-1">
                            <button data-action="view" data-id="${doctor.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                              <i data-lucide="eye" class="w-4 h-4 ${gapClass}"></i>${t('view')}
                            </button>
                            <button data-action="edit" data-id="${doctor.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                              <i data-lucide="pencil" class="w-4 h-4 ${gapClass}"></i>${t('edit')}
                            </button>
                            <button data-action="delete" data-id="${doctor.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left transition-colors flex items-center text-destructive hover:bg-destructive/10">
                              <i data-lucide="trash-2" class="w-4 h-4 ${gapClass}"></i>${t('delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `).join('')}
                ${paginatedDoctors.length === 0 ? `
                  <tr>
                    <td colspan="6" class="p-8 text-center text-muted-foreground">
                      ${t("noDoctors")}
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
          
          <div class="space-y-2 text-sm text-muted-foreground mt-4 pb-4">
             <div class="text-center">
               ${t("showing")} <span class="font-medium">${startIndex + 1}</span> - <span class="font-medium">${Math.min(startIndex + doctorsState.pageSize, filteredDoctors.length)}</span> ${t("of")} <span class="font-medium">${filteredDoctors.length}</span>
             </div>
             ${totalPages > 1 ? `
             <div id="pagination" class="flex items-center justify-center gap-2">
               <button id="prev-page" ${doctorsState.page === 1 ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
                 <i data-lucide="${prevIcon}" class="w-4 h-4"></i>
               </button>
               ${pageButtons}
               <button id="next-page" ${doctorsState.page >= totalPages ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-white hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
                 <i data-lucide="${nextIcon}" class="w-4 h-4"></i>
               </button>
             </div>
             ` : ''}
           </div>
        </div>
        ${modalHTML}
        ${detailsModalHTML}
      </div>
    `;
  }

  let closeMenusHandler = null;

  function attachListeners(container) {
    const renderPage = () => updateContent(container);
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

    // Search
    const searchInput = container.querySelector('#search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            doctorsState.search = e.target.value;
            doctorsState.page = 1;
            renderPage();
        });
    }
    
    // Specialty Filter
    const specialtyFilter = container.querySelector('#specialty-filter');
    if (specialtyFilter) {
        specialtyFilter.addEventListener('change', (e) => {
            doctorsState.filterSpecialty = e.target.value;
            doctorsState.page = 1;
            renderPage();
        });
    }

    // Sort
    container.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        if (doctorsState.sortKey === key) {
          doctorsState.sortOrder = doctorsState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          doctorsState.sortKey = key;
          doctorsState.sortOrder = 'asc';
        }
        renderPage();
      });
    });

    // Pagination
    container.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page');
        if (page === 'ellipsis') return;
        doctorsState.page = parseInt(page);
        renderPage();
      });
    });

    const prevBtn = container.querySelector('#prev-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (doctorsState.page > 1) {
                doctorsState.page--;
                renderPage();
            }
        });
    }

    const nextBtn = container.querySelector('#next-page');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const allDoctors = getDoctors();
            const filteredDoctors = allDoctors.filter(doctor => {
              const searchLower = doctorsState.search.toLowerCase();
              return (
                doctor.firstName.toLowerCase().includes(searchLower) ||
                doctor.lastName.toLowerCase().includes(searchLower) ||
                doctor.email.toLowerCase().includes(searchLower) ||
                doctor.phone.includes(searchLower) ||
                doctor.specialty.toLowerCase().includes(searchLower)
              );
            });
            const totalPages = Math.ceil(filteredDoctors.length / doctorsState.pageSize);
            if (doctorsState.page < totalPages) {
                doctorsState.page++;
                renderPage();
            }
        });
    }

    // Export Menu
    const exportBtn = container.querySelector('#export-btn');
    const exportMenu = container.querySelector('#export-menu');
    
    if (exportBtn && exportMenu) {
        exportBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportMenu.classList.toggle('hidden');
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
          
          // Close doctor menus
          if (!e.target.closest('button[data-action="menu"]')) {
            const menus = container.querySelectorAll('[id^="doctor-menu-"]');
            menus.forEach(m => m.classList.add("hidden"));
          }
        };

        document.addEventListener('click', closeMenusHandler);

        container.querySelector('#export-csv')?.addEventListener('click', () => {
            const doctors = getDoctors();
            exportToCSV(doctors, 'doctors-export', ['firstName', 'lastName', 'email', 'phone', 'specialty']);
            exportMenu.classList.add('hidden');
        });

        container.querySelector('#export-pdf')?.addEventListener('click', () => {
            const doctors = getDoctors();
            exportToPDF(doctors, 'doctors-export', 'Doctors List', ['firstName', 'lastName', 'email', 'phone', 'specialty']);
            exportMenu.classList.add('hidden');
        });
    }

    // Modal Actions
    const closeModal = () => {
        doctorsState.isModalOpen = false;
        doctorsState.editingId = null;
        const overlay = document.getElementById("global-overlay");
        overlay?.classList.add("hidden");
        renderPage();
    };

    const openModal = (id = null) => {
        doctorsState.isModalOpen = true;
        doctorsState.editingId = id;
        
        // Show overlay immediately
        const overlay = document.getElementById("global-overlay");
        overlay?.classList.remove("hidden");
        
        renderPage();
        
        if (id) {
            const doctor = getDoctor(id);
            const form = container.querySelector('#doctor-form');
            if (form && doctor) {
                form.firstName.value = doctor.firstName;
                form.lastName.value = doctor.lastName;
                form.email.value = doctor.email;
                form.phone.value = doctor.phone;
                form.specialty.value = doctor.specialty;
            }
        }
    };
    
    // Close Details Modal
    const closeDetailsModal = () => {
        doctorsState.viewingId = null;
        const overlay = document.getElementById("global-overlay");
        overlay?.classList.add("hidden");
        renderPage();
    };

    container.querySelector('#add-doctor-btn')?.addEventListener('click', () => openModal());
    container.querySelector('#close-modal-x')?.addEventListener('click', closeModal);
    container.querySelector('#cancel-modal-btn')?.addEventListener('click', closeModal);
    
    // Close on backdrop click
    const modalOverlay = container.querySelector('#doctor-modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
    
    const detailsOverlay = container.querySelector('#doctor-details-overlay');
    if (detailsOverlay) {
        // Show overlay if details modal is open
        const overlay = document.getElementById("global-overlay");
        overlay?.classList.remove("hidden");
        
        detailsOverlay.addEventListener('click', (e) => {
            if (e.target === detailsOverlay) closeDetailsModal();
        });
    }
    
    container.querySelector('#close-details-x')?.addEventListener('click', closeDetailsModal);
    container.querySelector('#close-details-btn')?.addEventListener('click', closeDetailsModal);

    const form = container.querySelector('#doctor-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            if (doctorsState.editingId) {
                updateDoctor(doctorsState.editingId, data);
            } else {
                addDoctor(data);
            }
            closeModal();
        });
    }

    // Export Details PDF
    const exportDetailBtn = container.querySelector('#export-detail-pdf-btn');
    if (exportDetailBtn && doctorsState.viewingId) {
        exportDetailBtn.addEventListener('click', () => {
             const doctor = getDoctor(doctorsState.viewingId);
             if (doctor) {
                 const columns = [
                     { key: 'firstName', header: t('firstName') },
                     { key: 'lastName', header: t('lastName') },
                     { key: 'email', header: t('email') },
                     { key: 'phone', header: t('phone') },
                     { key: 'specialty', header: t('specialty') }
                 ];
                 const baseName = `${String(doctor.firstName || '').trim()}_${String(doctor.lastName || '').trim()}`.replace(/\s+/g, '_').replace(/[^\w\-]/g, '') || 'doctor';
                 exportToPDF([doctor], baseName, t('doctorDetails'), columns);
             }
        });
    }

    // Table Actions (Delegation)
    const tableBody = container.querySelector("#doctors-table-body");
    if (tableBody) {
        tableBody.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-action]");
            if (!btn) return;
            
            const action = btn.getAttribute("data-action");
            const id = btn.getAttribute("data-id");

            if (action === "menu") {
                e.stopPropagation();
                // Close all other menus
                container.querySelectorAll('[id^="doctor-menu-"]').forEach(m => {
                    if (m.id !== `doctor-menu-${id}`) m.classList.add("hidden");
                });
                const menu = container.querySelector(`#doctor-menu-${id}`);
                if (menu) {
                    const btnRect = btn.getBoundingClientRect();
                    const isRTL = document.documentElement.dir === 'rtl';
                    menu.classList.remove("hidden");
                    menu.style.visibility = "hidden";
                    menu.style.top = `${btnRect.bottom + 8}px`;
                    menu.style.left = `${isRTL ? btnRect.left : btnRect.right - 192}px`;
                    
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
            const menu = container.querySelector(`#doctor-menu-${id}`);
            if (menu) menu.classList.add("hidden");
            activeMenuEl = null;
            activeMenuAnchor = null;
            
            if (action === "delete") {
                if (confirm(t("confirmDelete"))) {
                    deleteDoctor(id);
                    renderPage();
                }
            } else if (action === "edit") {
                openModal(id);
            } else if (action === "view") {
                doctorsState.viewingId = id;
                renderPage();
            }
        });
    }
  }

  // Register
  App.Pages.Doctors = { render };
})();
