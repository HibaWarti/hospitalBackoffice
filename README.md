# Hospital Backoffice

Hospital Backoffice is a lightweight, front-end admin dashboard for managing core hospital data such as patients, doctors, services, appointments, and prescriptions.

This project is built as a simple static web app (no build step required) and is intended as a clean starting point for a backoffice UI.

## Features

- **Authentication UI and session handling** (demo login)
- **Dashboard** (basic KPIs + charts)
- **CRUD-style management pages**
  - Patients
  - Doctors
  - Services
  - Appointments
  - Prescriptions
- **Internationalization (i18n)**
  - English, French, Arabic
  - RTL support for Arabic
- **Theme support**
  - Light / dark theme

## Technologies Used

- **HTML5** for the base layout
- **CSS3** for theming and custom styling (including dark mode variables)
- **JavaScript (Vanilla)** for routing, rendering, and page logic
- **Lucide Icons** for icons (via `data-lucide`)
- **LocalStorage** for persisting:
  - theme preference
  - language preference
  - last visited page

## Project Structure

```
hospitalBackoffice/
  index.html
  css/
    style.css
  js/
    main.js
    pages/
      dashboard.js
      patients.js
      doctors.js
      services.js
      appointments.js
      prescriptions.js
    services/
      auth.js
      data.js
      i18n.js
      theme.js
      utils.js
```

### Key Files

- `index.html`
  - App entry point.
- `js/main.js`
  - Renders the shell (sidebar + header), handles navigation, theme toggle, and language switching.
- `js/services/i18n.js`
  - Translation dictionary and language/RTL handling.
- `js/services/theme.js`
  - Applies light/dark theme.
- `js/pages/*`
  - Page modules (rendering + event wiring).

## Getting Started

### Prerequisites

- A modern web browser (Chrome/Edge/Firefox)
- (Optional) A local static server (recommended for best results)

### Run Locally

You can run the project in either of these ways:

#### Option 1: Open directly

Open `index.html` in your browser.

#### Option 2: Use a simple local server (recommended)

If you have Python installed:

```bash
python -m http.server 5173
```

Then open:

```
http://localhost:5173
```

## Demo Login

The login screen includes a demo credential hint:

- **Username**: `admin`
- **Password**: `admin`

## Configuration

- **Language** is stored in LocalStorage under: `hospital_lang`
- **Theme** is stored in LocalStorage under: `hospital_theme`

## Repository

https://github.com/HibaWarti/hospitalBackoffice.git
