(() => {
const { Auth, I18n } = App.Services;

const appRoot = document.getElementById("app-root");

const menuItems = [
  { key: "dashboard", label: "dashboard", icon: "layout-dashboard" },
  { key: "patients", label: "patients", icon: "users" },
  { key: "doctors", label: "doctors", icon: "user-round" },
  { key: "services", label: "services", icon: "building" },
  { key: "appointments", label: "appointments", icon: "calendar" },
  { key: "prescriptions", label: "prescriptions", icon: "file-text" },
];

function init() {
  const user = App.Services.Auth.checkSession();
  if (user) {
    renderShell(user);
  } else {
    renderLogin();
  }
}

function renderLogin() {
  const loginView = `
    <div class="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/40 to-background p-4 overflow-hidden">
      <div class="absolute inset-0 bg-grid opacity-60 pointer-events-none"></div>
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl"></div>

      <div class="relative w-full max-w-md glass rounded-2xl shadow-glow p-8 animate-fade-in">
        <div class="flex flex-col items-center gap-4 text-center">
          <div class="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
            <i data-lucide="building-2" class="w-7 h-7 text-white"></i>
          </div>
          <div>
            <p class="text-2xl font-heading font-semibold">${t("welcome")}</p>
            <p class="text-muted-foreground mt-1">${t("signIn")}</p>
          </div>
        </div>

        <form id="login-form" class="mt-8 space-y-4">
          <div id="login-error" class="hidden text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4"></i>
            <span>Invalid credentials. Try admin / admin</span>
          </div>

          <div class="space-y-2">
            <label for="username" class="text-sm font-medium">${t("username")}</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="admin"
              class="h-11 w-full rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div class="space-y-2">
            <label for="password" class="text-sm font-medium">${t("password")}</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              class="h-11 w-full rounded-lg border border-input bg-background px-3 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            class="w-full h-11 rounded-lg gradient-primary text-white font-medium shadow-md hover:opacity-90 transition-opacity"
          >
            ${t("login")}
          </button>
        </form>

        <p class="text-center text-sm text-muted-foreground mt-6">${t("demo")}</p>
      </div>
    </div>
  `;

  appRoot.innerHTML = loginView;
  lucide.createIcons();

  const loginForm = document.getElementById("login-form");
  const errorBox = document.getElementById("login-error");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value.trim();

    const user = App.Services.Auth.login(username, password);
    if (user) {
      renderShell(user);
    } else {
      errorBox.classList.remove("hidden");
    }
  });
}

function renderShell(user) {
  const currentLang = App.Services.I18n.getCurrentLang();
  
  const shell = `
    <div class="flex min-h-screen w-full max-w-full bg-background text-foreground">
      <aside
        id="sidebar"
        class="hidden md:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0"
      >
        <div class="p-4 border-b border-sidebar-border flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <i data-lucide="building-2" class="w-5 h-5 text-white"></i>
            </div>
            <div class="leading-tight">
              <div class="font-heading font-semibold">${t("hospital")}</div>
              <div class="text-xs text-sidebar-foreground/70">${t("backoffice")}</div>
            </div>
          </div>
          <button id="sidebar-close" class="md:hidden text-sidebar-foreground hover:bg-accent hover:text-accent-foreground p-2 rounded-md transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>
        <nav class="flex-1 p-3 space-y-1" id="sidebar-menu-list">
          ${menuItems
            .map(
              (item) => `
                <a
                  href="#"
                  data-key="${item.key}"
                  class="group flex items-center gap-3 px-3 h-11 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                >
                  <i data-lucide="${item.icon}" class="w-5 h-5"></i>
              <span class="font-medium">${t(item.label)}</span>
                </a>
              `,
            )
            .join("")}
        </nav>
        <div class="p-4 border-t border-sidebar-border">
          <button id="logout-btn" class="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground hover:text-destructive">
            <i data-lucide="log-out" class="w-5 h-5"></i>
            <span>${t("logout")}</span>
          </button>
        </div>
      </aside>

      <div class="flex-1 min-w-0 flex flex-col min-h-screen overflow-x-auto">
        <header class="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 fixed top-0 z-50 w-full">
          <div class="flex items-center gap-3">
            <button
              id="sidebar-toggle"
              class="h-9 w-9 inline-flex items-center justify-center rounded-md text-foreground/80 hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <i data-lucide="panel-left" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="relative">
            <button id="lang-button" class="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-white hover:bg-accent hover:text-accent-foreground transition-colors">
              <i data-lucide="globe" class="w-4 h-4"></i>
              <span id="lang-label" class="hidden sm:inline">🇬🇧 English</span>
              <span id="lang-flag" class="sm:hidden">🇬🇧</span>
            </button>
            <div id="lang-menu" class="hidden absolute right-0 mt-2 w-32 rounded-lg border border-border bg-white shadow-md z-50">
              ${languages
                .map(
                  (lang) => `
                    <button data-lang="${lang.code}" data-dir="${lang.dir}" class="w-[calc(100%-8px)] mx-1 my-1 rounded-md px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center gap-2 transition-colors ${currentLang === lang.code ? 'bg-accent/10' : ''}">
                      <span>${lang.flag}</span>
                      <span>${lang.label}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
        </header>
        <div id="global-overlay" class="fixed inset-0 bg-black/80 hidden z-[1000]"></div>

        <main class="flex-1 p-6 bg-background pt-16" id="main-content">
          <!-- Content injected here -->
        </main>
      </div>
    </div>
  `;

  appRoot.innerHTML = shell;
  lucide.createIcons();

  // Initial Language Label
  const currentLangObj = App.Services.I18n.languages.find(l => l.code === currentLang) || App.Services.I18n.languages[0];
  document.getElementById("lang-label").textContent = `${currentLangObj.flag} ${currentLangObj.label}`;
  document.getElementById("lang-flag").textContent = currentLangObj.flag;

  const menuList = document.getElementById("sidebar-menu-list");
  const mainContent = document.getElementById("main-content");
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const langButton = document.getElementById("lang-button");
  const langMenu = document.getElementById("lang-menu");
  const header = document.querySelector("header");

  function updateHeaderLayout() {
    const isMobile = window.innerWidth < 768;
    const sidebarRect = sidebar.getBoundingClientRect();
    const sidebarVisibleDesktop = !isMobile && !sidebar.classList.contains("md:hidden") && sidebarRect.width > 0;
    const isRTL = document.documentElement.dir === 'rtl';
    if (sidebarVisibleDesktop) {
      if (isRTL) {
        header.style.right = `${sidebarRect.width}px`;
        header.style.left = "0";
      } else {
        header.style.left = `${sidebarRect.width}px`;
        header.style.right = "0";
      }
      header.style.width = `calc(100% - ${sidebarRect.width}px)`;
    } else {
      header.style.left = "0";
      header.style.right = "0";
      header.style.width = "100%";
    }
    const headerHeight = header.offsetHeight || 64;
    mainContent.style.paddingTop = `${headerHeight + 24}px`;
  }
  requestAnimationFrame(updateHeaderLayout);

  // Navigation
  menuList.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-key]");
    if (!link) return;
    e.preventDefault();
    const key = link.getAttribute("data-key");
    navigateTo(key);
  });

  // Mobile Sidebar
  sidebarToggle?.addEventListener("click", () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      sidebar.classList.toggle("hidden");
      sidebar.classList.toggle("fixed");
      sidebar.classList.toggle("inset-0");
      sidebar.classList.toggle("z-[1002]");
    } else {
      sidebar.classList.toggle("md:hidden");
    }
    updateHeaderLayout();
  });

  const sidebarClose = document.getElementById("sidebar-close");
  sidebarClose?.addEventListener("click", () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      sidebar.classList.add("hidden");
      sidebar.classList.remove("fixed", "inset-0", "z-[1002]");
    } else {
      sidebar.classList.add("md:hidden");
    }
    updateHeaderLayout();
  });

  // Logout
  document.getElementById("logout-btn").addEventListener("click", App.Services.Auth.logout);

  // Language Switcher
  langButton.addEventListener("click", () => {
    langMenu.classList.toggle("hidden");
  });

  langMenu.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-lang]");
    if (!btn) return;
    const code = btn.getAttribute("data-lang");
    App.Services.I18n.setLanguage(code);
    langMenu.classList.add("hidden");
    
    // Re-render shell to update translations
    renderShell(user);
    
    // Restore active page
    const lastKey = localStorage.getItem('last_page') || 'dashboard';
    navigateTo(lastKey);
  });

  document.addEventListener("click", (e) => {
    const insideLang = e.target.closest("#lang-button") || e.target.closest("#lang-menu");
    if (!insideLang) langMenu.classList.add("hidden");
  });

  // Initial Page Load
  const lastKey = localStorage.getItem('last_page') || 'dashboard';
  navigateTo(lastKey);

  window.addEventListener("resize", updateHeaderLayout);
  window.addEventListener("load", updateHeaderLayout);
}

function navigateTo(key) {
  // Security check: ensure user is authenticated before navigating
  if (!App.Services.Auth.checkSession()) {
    init();
    return;
  }

  const mainContent = document.getElementById("main-content");
  setActiveMenu(key);
  
  // Clear content
  mainContent.innerHTML = '';
  
  // Render new content
  const contentElement = renderContent(key);
  if (typeof contentElement === 'string') {
      mainContent.innerHTML = contentElement;
  } else if (contentElement instanceof HTMLElement) {
      mainContent.appendChild(contentElement);
  }
  
  lucide.createIcons();
  localStorage.setItem('last_page', key);
}

function setActiveMenu(activeKey) {
  document.querySelectorAll("#sidebar-menu-list a[data-key]").forEach((link) => {
    const isActive = link.getAttribute("data-key") === activeKey;

    link.classList.remove(
      "bg-sidebar-accent", "text-sidebar-accent-foreground",
      "bg-primary", "text-primary-foreground", "shadow-md", "hover:bg-primary/90",
      "hover:bg-sidebar-accent", "hover:text-sidebar-accent-foreground"
    );

    if (isActive) {
      link.classList.add("bg-primary", "text-primary-foreground", "shadow-md", "hover:bg-primary/90");
    } else {
      link.classList.add("hover:bg-sidebar-accent", "hover:text-sidebar-accent-foreground");
    }

    link.classList.toggle("font-semibold", isActive);
  });
}

function renderContent(key) {
  if (key === "dashboard") {
    return App.Pages.Dashboard.render();
  }

  if (key === "patients") {
    return App.Pages.Patients.render();
  }

  if (key === "doctors") {
    return App.Pages.Doctors.render();
  }

  if (key === "services") {
    return App.Pages.Services.render();
  }

  if (key === "appointments") {
    return App.Pages.Appointments.render();
  }

  if (key === "prescriptions") {
    return App.Pages.Prescriptions.render();
  }

  const titles = {
    patients: "Patients",
    doctors: "Doctors",
    services: "Services",
    appointments: "Appointments",
    prescriptions: "Prescriptions",
  };

  const container = document.createElement('div');
  container.className = "space-y-4 animate-fade-in";
  container.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xl font-semibold">${t(titles[key] || "Section")}</p>
          <p class="text-sm text-muted-foreground">Static preview without React.</p>
        </div>
      </div>
      <div class="glass rounded-2xl p-5 shadow-glow">
        <p class="text-sm text-muted-foreground mb-2">Coming soon</p>
        <p class="text-sm">This section is not yet implemented in the vanilla preview.</p>
      </div>
  `;
  return container;
}

// Initialize
init();
})();
