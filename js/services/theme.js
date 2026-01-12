(() => {
  const STORAGE_KEY = 'hospital_theme';

  function getPreferredTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;

    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.dataset.theme = theme;
  }

  function setTheme(theme) {
    const next = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    return next;
  }

  function getTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }

  function toggleTheme() {
    return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function init() {
    applyTheme(getPreferredTheme());
  }

  init();

  window.App = window.App || {};
  App.Services = App.Services || {};
  App.Services.Theme = { init, getTheme, setTheme, toggleTheme };
})();
