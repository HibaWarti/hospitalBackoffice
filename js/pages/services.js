(() => {
  function getServices() { return App.Services.Data.getServices(); }
  function getService(id) { return App.Services.Data.getService(id); }
  function addService(s) { return App.Services.Data.addService(s); }
  function updateService(id, updates) { return App.Services.Data.updateService(id, updates); }
  function deleteService(id) { return App.Services.Data.deleteService(id); }
  function t(key) { return App.Services.I18n.t(key); }
  function exportToCSV(data, filename, columns) { return App.Services.Utils.exportToCSV(data, filename, columns); }
  function exportToPDF(data, filename, title, columns) { return App.Services.Utils.exportToPDF(data, filename, title, columns); }
  function exportElementToPDF(element, filename) { return App.Services.Utils.exportElementToPDF(element, filename); }
  function toastSuccess(message) { return App.Services.Utils.toastSuccess(message); }
  function toastError(message) { return App.Services.Utils.toastError(message); }
  function confirmDialog(options) { return App.Services.Utils.confirmDialog(options); }

  function getDataAsync() { return App.Services.DataAsync || null; }

  async function addServiceAsync(s) {
    const api = getDataAsync();
    return api ? api.addService(s) : addService(s);
  }

  async function updateServiceAsync(id, updates) {
    const api = getDataAsync();
    return api ? api.updateService(id, updates) : updateService(id, updates);
  }

  async function deleteServiceAsync(id) {
    const api = getDataAsync();
    return api ? api.deleteService(id) : deleteService(id);
  }

  let servicesState = {
    search: "",
    sortKey: null,
    sortOrder: "asc",
    page: 1,
    pageSize: 10,
    isModalOpen: false,
    editingId: null,
    viewingId: null
  };

  function render() {
    const container = document.createElement('div');
    container.className = "services-page";
    updateContent(container);
    return container;
  }

  function updateContent(container) {
    container.innerHTML = generateHTML();
    lucide.createIcons();
    attachListeners(container);
    
    if (servicesState.search) {
        const searchInput = container.querySelector("#search-input");
        if (searchInput) {
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
        }
    }
  }

  function generateHTML() {
    const allServices = getServices();
    const isRTL = document.documentElement.dir === 'rtl';
    const gapClass = isRTL ? 'ml-2' : 'mr-2';
    const prevIcon = isRTL ? 'chevron-right' : 'chevron-left';
    const nextIcon = isRTL ? 'chevron-left' : 'chevron-right';

    // Filter
    let filteredServices = allServices.filter(service => {
      const searchLower = servicesState.search.toLowerCase();
      const matchesSearch = (
        service.name.toLowerCase().includes(searchLower) ||
        (service.description && service.description.toLowerCase().includes(searchLower))
      );
      return matchesSearch;
    });

    // Sort
    if (servicesState.sortKey) {
      filteredServices.sort((a, b) => {
        const aVal = String(a[servicesState.sortKey]).toLowerCase();
        const bVal = String(b[servicesState.sortKey]).toLowerCase();
        if (servicesState.sortOrder === 'asc') return aVal.localeCompare(bVal);
        return bVal.localeCompare(aVal);
      });
    }

    // Paginate
    const totalPages = Math.ceil(filteredServices.length / servicesState.pageSize);
    const startIndex = (servicesState.page - 1) * servicesState.pageSize;
    const paginatedServices = filteredServices.slice(startIndex, startIndex + servicesState.pageSize);

    const renderSortIcon = (key) => {
      if (servicesState.sortKey !== key) return `<i data-lucide="arrow-up-down" class="w-3 h-3 ml-1 text-muted-foreground/50"></i>`;
      return servicesState.sortOrder === 'asc' 
        ? `<i data-lucide="arrow-up" class="w-3 h-3 ml-1 text-foreground"></i>`
        : `<i data-lucide="arrow-down" class="w-3 h-3 ml-1 text-foreground"></i>`;
    };
    
    let pagesToShow = [];
    if (totalPages <= 7) {
      pagesToShow = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      pagesToShow = [1];
      if (servicesState.page > 3) pagesToShow.push('ellipsis');
      const start = Math.max(2, servicesState.page - 1);
      const end = Math.min(totalPages - 1, servicesState.page + 1);
      for (let p = start; p <= end; p++) pagesToShow.push(p);
      if (servicesState.page < totalPages - 2) pagesToShow.push('ellipsis');
      pagesToShow.push(totalPages);
    }
    const pageButtons = pagesToShow.map(p => {
      if (p === 'ellipsis') {
        return `<span class="px-2 text-muted-foreground">...</span>`;
      }
      const isActive = servicesState.page === p;
      const bgClass = isActive ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground';
      const hoverClass = isActive ? 'hover:bg-primary/90' : 'hover:bg-accent hover:text-accent-foreground';
      return `
        <button data-page="${p}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input ${bgClass} ${hoverClass} h-8 min-w-8 px-2">
          ${p}
        </button>
      `;
    }).join('');

    // View Details Modal HTML
    const viewModalHTML = `
      <div id="service-details-modal" class="fixed inset-0 z-[1001] ${servicesState.viewingId ? 'flex' : 'hidden'} items-center justify-center p-4">
        <div class="w-full max-w-lg bg-card text-card-foreground border border-border rounded-xl shadow-glow animate-fade-in">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 class="text-lg font-semibold">${t("serviceDetails")}</h2>
            <button id="close-details-x" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div id="service-details-content" class="p-6 space-y-6">
             <!-- Content injected via JS -->
          </div>
          <div class="flex justify-end gap-3 p-6 border-t border-border">
            <button id="export-detail-pdf-btn" class="h-9 px-3 rounded-md border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground text-sm font-medium inline-flex items-center">
              <i data-lucide="download" class="w-4 h-4 ${gapClass}"></i>
              ${t("exportPDF")}
            </button>
            <button id="close-details-btn" class="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors">${t("close")}</button>
          </div>
        </div>
      </div>
    `;

    // Add/Edit Modal HTML
    const modalHTML = `
      <div id="service-modal" class="fixed inset-0 z-[1001] ${servicesState.isModalOpen ? 'flex' : 'hidden'} items-center justify-center p-4 bg-black/50 backdrop-blur-sm global-overlay">
        <div class="w-full max-w-lg bg-card text-card-foreground border border-border rounded-xl shadow-glow animate-fade-in">
          <div class="p-6 border-b border-border flex items-center justify-between">
            <h2 id="service-modal-title" class="text-lg font-semibold">${servicesState.editingId ? t("editService") : t("addService")}</h2>
            <button id="close-modal-x" class="text-muted-foreground hover:text-foreground">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <form id="service-form" class="p-6 space-y-4">
            <div class="space-y-2">
              <label for="name" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t("name")}</label>
              <input id="name" name="name" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" required />
            </div>
            <div class="space-y-2">
              <label for="description" class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">${t("description")}</label>
              <textarea id="description" name="description" class="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"></textarea>
            </div>
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button type="button" id="cancel-modal-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                ${t("cancel")}
              </button>
              <button type="submit" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                ${t("save")}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    return `
      <div class="space-y-6 animate-fade-in">
        <div class="flex items-center justify-between gap-3 min-w-0">
          <h1 class="text-3xl font-heading font-bold min-w-0 truncate sm:whitespace-normal sm:overflow-visible sm:text-clip">${t("services")}</h1>
          <div class="flex flex-nowrap gap-2 shrink-0">
            <button id="reset-filters-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-9 px-3 whitespace-nowrap">
                <i data-lucide="rotate-ccw" class="w-4 h-4 sm:${gapClass}"></i>
                <span class="hidden sm:inline">${t("reset")}</span>
            </button>
            <div class="relative inline-block text-left">
              <button id="export-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 whitespace-nowrap">
                <i data-lucide="download" class="w-4 h-4 sm:${gapClass}"></i>
                <span class="hidden sm:inline">${t("export")}</span>
              </button>
              <div id="export-menu" class="hidden absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-card text-foreground border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                <div class="py-1">
                  <button id="export-csv" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">${t("exportCSV")}</button>
                  <button id="export-pdf" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors">${t("exportPDF")}</button>
                </div>
              </div>
            </div>
            <button id="add-service-btn" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-white hover:bg-primary/90 h-9 px-4 py-2 whitespace-nowrap">
              <i data-lucide="plus" class="w-4 h-4 sm:${gapClass}"></i>
              <span class="hidden sm:inline">${t("add")}</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 justify-between">
          <div class="flex flex-1 gap-2 max-w-lg">
            <div class="relative flex-1">
                <i data-lucide="search" class="absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"></i>
                <input 
                  type="text" 
                  id="search-input" 
                  placeholder="${t("search")}" 
                  value="${servicesState.search}"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ${isRTL ? 'pr-10' : 'pl-10'} text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
            </div>
          </div>
        </div>

        <div class="glass rounded-2xl shadow-glow overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-secondary/80 dark:bg-secondary/50 border-b border-border">
                <tr class="${isRTL ? 'text-right' : 'text-left'}">
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="name">
                    <div class="flex items-center">${t("name")} ${renderSortIcon('name')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors" data-sort="description">
                    <div class="flex items-center">${t("description")} ${renderSortIcon('description')}</div>
                  </th>
                  <th class="h-12 px-4 font-medium text-muted-foreground text-right rtl:text-left">${t("actions")}</th>
                </tr>
              </thead>
              <tbody id="services-table-body" class="divide-y divide-border">
                ${paginatedServices.map(service => `
                  <tr class="hover:bg-muted transition-colors group">
                    <td class="p-4 font-medium text-left rtl:text-right">${service.name}</td>
                    <td class="p-4 text-muted-foreground max-w-xs truncate text-left rtl:text-right" title="${service.description || ''}">${service.description || '-'}</td>
                    <td class="p-4 text-right rtl:text-left">
                      <div class="relative inline-block text-left rtl:text-right">
                        <button data-action="menu" data-id="${service.id}" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-8 w-8">
                          <i data-lucide="more-horizontal" class="w-4 h-4"></i>
                        </button>
                        <div id="service-menu-${service.id}" class="hidden fixed w-48 rounded-md shadow-lg bg-card text-foreground border border-border ring-1 ring-black ring-opacity-5 focus-visible:outline-none z-50">
                          <div class="py-1">
                            <button data-action="view" data-id="${service.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                              <i data-lucide="eye" class="w-4 h-4 ${gapClass}"></i>${t('view')}
                            </button>
                            <button data-action="edit" data-id="${service.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors flex items-center">
                              <i data-lucide="pencil" class="w-4 h-4 ${gapClass}"></i>${t('edit')}
                            </button>
                            <button data-action="delete" data-id="${service.id}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left transition-colors flex items-center text-destructive hover:bg-destructive/10">
                              <i data-lucide="trash-2" class="w-4 h-4 ${gapClass}"></i>${t('delete')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                `).join('')}
                ${paginatedServices.length === 0 ? `
                  <tr>
                    <td colspan="3" class="p-8 text-center text-muted-foreground">
                      ${t("noServices")}
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
          
          <div class="space-y-2 text-sm text-muted-foreground mt-4 pb-4">
             <div class="text-center">${t("showing")} ${startIndex + 1}-${Math.min(startIndex + servicesState.pageSize, filteredServices.length)} ${t("of")} ${filteredServices.length}</div>
             ${totalPages > 1 ? `
             <div id="pagination" class="flex items-center justify-center gap-2">
               <button id="prev-page" ${servicesState.page === 1 ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
                 <i data-lucide="${prevIcon}" class="w-4 h-4"></i>
               </button>
               ${pageButtons}
               <button id="next-page" ${servicesState.page >= totalPages ? 'disabled' : ''} class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground h-8 w-8 disabled:opacity-50">
                 <i data-lucide="${nextIcon}" class="w-4 h-4"></i>
               </button>
             </div>
             ` : ''}
          </div>
        </div>
      </div>
      ${modalHTML}
      ${viewModalHTML}
    `;
  }

  let closeMenusHandler = null;

  function attachListeners(container) {
    const renderPage = () => updateContent(container);
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
    const onAnyScroll = () => repositionActiveMenu();
    window.addEventListener("scroll", onAnyScroll, { passive: true, capture: true });
    window.addEventListener("resize", onAnyScroll);

    // Search
    const searchInput = container.querySelector('#search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            servicesState.search = e.target.value;
            servicesState.page = 1;
            renderPage();
        });
    }

    const resetBtn = container.querySelector('#reset-filters-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            servicesState.search = "";
            servicesState.sortKey = null;
            servicesState.sortOrder = "asc";
            servicesState.page = 1;
            renderPage();
        });
    }

    // Sort
    container.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.getAttribute('data-sort');
        if (servicesState.sortKey === key) {
          servicesState.sortOrder = servicesState.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
          servicesState.sortKey = key;
          servicesState.sortOrder = 'asc';
        }
        renderPage();
      });
    });

    // Pagination
    container.querySelectorAll('button[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.getAttribute('data-page');
        if (page === 'ellipsis') return;
        servicesState.page = parseInt(page);
        renderPage();
      });
    });

    const prevBtn = container.querySelector('#prev-page');
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (servicesState.page > 1) {
                servicesState.page--;
                renderPage();
            }
        });
    }

    const nextBtn = container.querySelector('#next-page');
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const allServices = getServices();
            const filteredServices = allServices.filter(service => {
              const searchLower = servicesState.search.toLowerCase();
              return (
                service.name.toLowerCase().includes(searchLower) ||
                (service.description && service.description.toLowerCase().includes(searchLower))
              );
            });
            const totalPages = Math.ceil(filteredServices.length / servicesState.pageSize);
            if (servicesState.page < totalPages) {
                servicesState.page++;
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

        // Cleanup previous listener
        if (closeMenusHandler) {
            document.removeEventListener("click", closeMenusHandler);
        }
        
        closeMenusHandler = (e) => {
            if (exportBtn && !exportBtn.contains(e.target) && !exportMenu.contains(e.target)) {
                exportMenu.classList.add('hidden');
            }
            if (!e.target.closest('button[data-action="menu"]')) {
                container.querySelectorAll('[id^="service-menu-"]').forEach(m => m.classList.add("hidden"));
            }
        };
        document.addEventListener("click", closeMenusHandler);

        const getExportServices = () => {
            let services = getServices().filter(service => {
                const searchLower = servicesState.search.toLowerCase();
                const matchesSearch = (
                    service.name.toLowerCase().includes(searchLower) ||
                    (service.description && service.description.toLowerCase().includes(searchLower))
                );
                return matchesSearch;
            });

            if (servicesState.sortKey) {
                services.sort((a, b) => {
                    const aVal = String(a[servicesState.sortKey]).toLowerCase();
                    const bVal = String(b[servicesState.sortKey]).toLowerCase();
                    if (servicesState.sortOrder === 'asc') return aVal.localeCompare(bVal);
                    return bVal.localeCompare(aVal);
                });
            }
            return services;
        };

        container.querySelector('#export-csv')?.addEventListener('click', () => {
            const services = getExportServices();
            const columns = [
                { key: 'name', header: t('name') },
                { key: 'description', header: t('description') }
            ];
            exportToCSV(services, 'services-export', columns);
            exportMenu.classList.add('hidden');
        });

        container.querySelector('#export-pdf')?.addEventListener('click', () => {
            const services = getExportServices();
            const columns = [
                { key: 'name', header: t('name') },
                { key: 'description', header: t('description') }
            ];
            exportToPDF(services, 'services-export', t('services'), columns);
            exportMenu.classList.add('hidden');
        });
    }

    // Modals
    const modal = container.querySelector("#service-modal");
    const detailsModal = container.querySelector("#service-details-modal");
    const form = container.querySelector("#service-form");

    const closeModals = () => {
        servicesState.isModalOpen = false;
        servicesState.editingId = null;
        servicesState.viewingId = null;
        
        modal?.classList.add("hidden");
        modal?.classList.remove("flex");
        detailsModal?.classList.add("hidden");
        detailsModal?.classList.remove("flex");
        
        const overlay = document.getElementById("global-overlay");
        overlay?.classList.add("hidden");
        
        renderPage();
    };

    const openModal = (id = null) => {
        servicesState.isModalOpen = true;
        servicesState.editingId = id;
        
        const overlay = document.getElementById("global-overlay");
        overlay?.classList.remove("hidden");
        
        renderPage();
        
        if (id) {
            const service = getService(id);
            const form = container.querySelector('#service-form');
            if (form && service) {
                form.name.value = service.name;
                form.description.value = service.description || '';
            }
        }
    };

    container.querySelector("#add-service-btn").addEventListener("click", () => openModal());
    container.querySelector("#close-modal-x")?.addEventListener("click", closeModals);
    container.querySelector("#cancel-modal-btn")?.addEventListener("click", closeModals);
    container.querySelector("#close-details-x")?.addEventListener("click", closeModals);
    container.querySelector("#close-details-btn")?.addEventListener("click", closeModals);

    // Close on backdrop click
    modal?.addEventListener("click", (e) => {
        if (e.target === modal) closeModals();
    });
    detailsModal?.addEventListener("click", (e) => {
        if (e.target === detailsModal) closeModals();
    });

    // Form Submit
    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            if (servicesState.editingId) {
                await updateServiceAsync(servicesState.editingId, data);
                toastSuccess(t('updatedSuccessfully'));
            } else {
                await addServiceAsync(data);
                toastSuccess(t('createdSuccessfully'));
            }
            closeModals();
        });
    }

    // Table Actions
    container.querySelector("#services-table-body").addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");

        if (action === "menu") {
            e.stopPropagation();
            container.querySelectorAll('[id^="service-menu-"]').forEach(m => {
                if (m.id !== `service-menu-${id}`) m.classList.add("hidden");
            });
            const menu = container.querySelector(`#service-menu-${id}`);
            if (menu) {
                const btnRect = btn.getBoundingClientRect();
                const isRTL = document.documentElement.dir === 'rtl';
                const cb = getFixedContainingBlock(menu);
                const cbRect = cb ? cb.getBoundingClientRect() : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
                const viewportW = cb ? cbRect.width : window.innerWidth;
                const viewportH = cb ? cbRect.height : window.innerHeight;
                menu.classList.remove("hidden");
                menu.style.visibility = "hidden";
                menu.style.top = `${btnRect.bottom + 8 - cbRect.top}px`;
                menu.style.left = `${(isRTL ? btnRect.left : btnRect.right - 192) - cbRect.left}px`;
                
                requestAnimationFrame(() => {
                    const mw = menu.offsetWidth;
                    const mh = menu.offsetHeight;
                    let top = btnRect.bottom + 8 - cbRect.top;
                    if (top + mh > viewportH) {
                        top = btnRect.top - mh - 8 - cbRect.top;
                    }
                    let left = (isRTL ? btnRect.left : btnRect.right - mw) - cbRect.left;
                    if (left < 8) left = 8;
                    if (left + mw > viewportW - 8) left = viewportW - mw - 8;
                    menu.style.top = `${top}px`;
                    menu.style.left = `${left}px`;
                    menu.style.visibility = "visible";
                    activeMenuAnchor = btn;
                    activeMenuEl = menu;
                });
            }
            return;
        }

        const menu = container.querySelector(`#service-menu-${id}`);
        if (menu) menu.classList.add("hidden");

        if (action === "delete") {
            confirmDialog({
                title: t('confirm'),
                text: t('confirmDelete') || 'Are you sure you want to delete?',
                icon: 'warning',
            }).then(async (ok) => {
                if (!ok) return;
                const deleted = await deleteServiceAsync(id);
                if (!deleted) {
                    toastError(t('deleteFailed'));
                    return;
                }
                renderPage();
                toastSuccess(t('deletedSuccessfully'));
            });
        } else if (action === "edit") {
            openModal(id);
        } else if (action === "view") {
            servicesState.viewingId = id;
            servicesState.isModalOpen = false; // ensure edit modal is closed
            const overlay = document.getElementById("global-overlay");
            overlay?.classList.remove("hidden");
            renderPage();
            
            const service = getService(id);
            if (service) {
                const content = container.querySelector("#service-details-content");
                if (content) {
                    content.innerHTML = `
                        <div class="space-y-4">
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">${t("name")}</p>
                                <p class="text-base font-medium mt-1">${service.name}</p>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">${t("description")}</p>
                                <p class="text-base text-muted-foreground mt-1">${service.description || '-'}</p>
                            </div>
                        </div>
                    `;
                    container.querySelector("#export-detail-pdf-btn")?.addEventListener("click", () => {
                        const element = container.querySelector('#service-details-modal');
                        if (element) {
                            exportElementToPDF(element, `service_${service.name}`);
                        }
                    });
                }
            }
        }
    });
  }

  window.App = window.App || {};
  App.Pages = App.Pages || {};
  App.Pages.Services = { render };
})();
