# Hospital Backoffice

## Deployment

Live application:

https://hospitalbackoffice.netlify.app/

Repository:

https://github.com/HibaWarti/hospitalBackoffice.git

## Project Description

Hospital Backoffice is a front-end admin dashboard for managing core hospital data:

- Patients
- Doctors
- Services
- Appointments
- Prescriptions

The application is a static web app using HTML/CSS/Vanilla JavaScript with client-side rendering.

## Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- TailwindCSS (CDN)

## Libraries

- Chart.js (dashboard charts)
- SweetAlert2 (confirmation dialogs and toast notifications)
- jsPDF + html2canvas (PDF export)
- Lucide Icons

## Data Source

- Local JSON data stored in LocalStorage (seeded with a faker-like generator in `js/services/data.js`)
- No external APIs are used

## Authentication

Demo credentials:

- Username: `admin`
- Password: `admin`

Session is stored in LocalStorage.

## Main Features

### Dashboard

- Statistic cards
- Charts (Chart.js)

### Entities / CRUD

Entities implemented:

- Patients
- Doctors
- Services
- Appointments
- Prescriptions

For each entity, the UI includes:

- Create (add form)
- Read (table view)
- Pagination
- Filters and search
- Sorting
- Export CSV
- Consult (details view)
- Export PDF
- Update (edit form)
- Delete (confirmation popup)

## Internationalization (i18n)

Supported languages:

- English (EN)
- French (FR)
- Arabic (AR) with RTL support

## Theme

- Light / Dark

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

## Installation / Run

### Option 1: Open directly

Open `index.html` in your browser.

### Option 2: Run with a local server (recommended)

If you have Python installed:

```bash
python -m http.server 5173
```

Then open:

http://localhost:5173

## Configuration

LocalStorage keys:

- `hospital_lang` (language)
- `hospital_theme` (theme)
- `hospital_auth_token` and `hospital_user` (session)
- `hospital_*` data keys (entities)
